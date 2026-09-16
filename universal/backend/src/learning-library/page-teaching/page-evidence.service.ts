import { nativePdfBlocks } from "../extraction/native-pdf-blocks";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { promises as fs } from "fs";
import * as path from "path";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { authSigningSecret } from "../../auth/auth-config";
import { OcrDocumentVisionService } from "../extraction/ocr-document-vision.service";
import { PrismaService } from "../prisma.service";
import { StorageService } from "../storage/storage.service";

// Built-in scans are public. Uploaded sources are served only by the guarded controller.
const BOOKS = [
  "evs-class-5",
  "maths-class-5",
  "science-class-6",
  "social-class-5",
];
export const BUILTIN_BOOKS = BOOKS;
export interface EvidenceReadOptions {
  /** false: answer from stored text or return a PENDING page without running OCR (request paths). */
  performOcr?: boolean;
}
@Injectable()
export class PageEvidenceService {
  private readonly logger = new Logger(PageEvidenceService.name);
  private cache = new Map<string, Promise<any>>();
  /** Built-in scan files keyed by path: unchanged mtime and size means the revision (and evidence) is unchanged. */
  private builtinFiles = new Map<string, { mtimeMs: number; size: number; sourceHash: string; totalPages: number }>();
  constructor(
    private readonly ocr: OcrDocumentVisionService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Client-facing shape: blocks and identity only; the scan is fetched separately and cached by the browser. */
  publicView(evidence: any, imageUrl: string) {
    const { imageDataUrl, imageBytes, ...rest } = evidence;
    return { ...rest, imageUrl };
  }
  builtinImageUrl(bookId: string, page: number, sourceHash: string) {
    return (
      "/api/v2/textbooks/" + encodeURIComponent(bookId) + "/pages/" + page +
      "/image?v=" + sourceHash.slice(0, 16)
    );
  }
  /** Private scans cannot carry a bearer header in an <img>; a short-lived HMAC signature stands in for it. */
  signedMaterialImageUrl(materialId: string, page: number, ttlMs = 60 * 60 * 1000) {
    const exp = Date.now() + ttlMs;
    const sig = this.imageSignature(materialId, page, exp);
    return (
      "/api/v2/learning-materials/" + encodeURIComponent(materialId) + "/pages/" + page +
      "/image?exp=" + exp + "&sig=" + sig
    );
  }
  imageSignature(materialId: string, page: number, exp: number) {
    return createHmac("sha256", authSigningSecret())
      .update("page-image|" + materialId + "|" + page + "|" + exp)
      .digest("base64url");
  }
  verifyImageSignature(materialId: string, page: number, exp: unknown, sig: unknown) {
    const expiry = Number(exp);
    if (!Number.isFinite(expiry) || expiry < Date.now() || typeof sig !== "string") return false;
    const expected = Buffer.from(this.imageSignature(materialId, page, expiry));
    const given = Buffer.from(sig);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }
  private pageNumber(value: string) {
    if (!/^[1-9][0-9]*$/.test(value) || Number(value) > 10000)
      throw new BadRequestException("Invalid physical page");
    return Number(value);
  }
  async builtin(bookId: string, value: string, options: EvidenceReadOptions = {}) {
    const performOcr = options.performOcr !== false;
    const page = this.pageNumber(value);
    if (!BOOKS.includes(bookId))
      throw new NotFoundException("Unknown textbook");
    const base =
      process.env.TEXTBOOK_SCAN_DIR ||
      path.resolve(process.cwd(), "../frontend/public/textbooks");
    const dir = path.join(base, bookId);
    const file = path.join(dir, "page-" + page + ".png");
    let stat: { mtimeMs: number; size: number };
    try {
      stat = await fs.stat(file);
    } catch {
      throw new NotFoundException("Physical scan unavailable");
    }
    // Fast path: the file has not changed, so neither has its hash or evidence; skip the 2 MB read and SHA-256.
    const known = this.builtinFiles.get(file);
    if (known && known.mtimeMs === stat.mtimeMs && known.size === stat.size) {
      const memo = this.cache.get(this.cacheKey(bookId, page, known.sourceHash, performOcr));
      if (memo) return memo;
    }
    let bytes: Buffer;
    try {
      bytes = await fs.readFile(file);
    } catch {
      throw new NotFoundException("Physical scan unavailable");
    }
    const files = await fs.readdir(dir);
    const totalPages = Math.max(
      ...files
        .filter((f) => /^page-[0-9]+\.png$/.test(f))
        .map((f) => Number(f.match(/[0-9]+/)![0])),
    );
    const evidence = await this.fromImage(bookId, page, totalPages, bytes, undefined, performOcr);
    this.builtinFiles.set(file, {
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      sourceHash: evidence.sourceHash,
      totalPages,
    });
    return evidence;
  }
  async material(materialId: string, value: string, options: EvidenceReadOptions = {}) {
    const performOcr = options.performOcr !== false;
    const page = this.pageNumber(value);
    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: materialId },
    });
    if (!material?.storageKey)
      throw new NotFoundException("Original source unavailable");
    const stream = await this.storage.getFileStream(material.storageKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const bytes = Buffer.concat(chunks);
    const masteries = await this.prisma.learnerConceptMastery.findMany({
      where: {
        learnerId: material.learnerId,
        concept: {
          sourceChunks: {
            some: {
              chunk: {
                document: { materialId },
                pageStart: { lte: page },
                pageEnd: { gte: page },
              },
            },
          },
        },
      },
      select: { masteryScore: true },
    });
    const score = masteries.length
      ? Math.min(...masteries.map((m) => m.masteryScore))
      : 0;
    const recommendedDepth =
      score < 0.3
        ? "basis"
        : score < 0.5
          ? "developing"
          : score < 0.7
            ? "proficient"
            : score < 0.85
              ? "advanced"
              : "deep";
    if (material.mimeType?.startsWith("image/")) {
      if (page !== 1) throw new NotFoundException("Page unavailable");
      return {
        ...(await this.fromImage(materialId, page, 1, bytes, undefined, performOcr)),
        recommendedDepth,
        targetAudience: (material as any).targetAudience || "child",
      };
    }
    if (material.mimeType !== "application/pdf")
      throw new BadRequestException(
        "Board teaching currently requires an original PDF or page image",
      );
    // Preserve PDF page identity; never split a book into guessed pages or substitute curriculum text.
    const importEsm = new Function("specifier", "return import(specifier)");
    const pdfjs = await importEsm("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const doc = await task.promise;
    try {
      if (page > doc.numPages) throw new NotFoundException("Page unavailable");
      const sourcePage = await doc.getPage(page);
      const viewport = sourcePage.getViewport({ scale: 1.5 });
      if (viewport.width * viewport.height > 16000000)
        throw new BadRequestException("Page dimensions exceed rendering limit");
      const canvas = require("@napi-rs/canvas").createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      );
      await sourcePage.render({
        canvasContext: canvas.getContext("2d"),
        viewport,
      }).promise;
      const native = nativePdfBlocks(
        (await sourcePage.getTextContent()).items,
        viewport,
        page,
      );
      const nativeEvidence = native.map((b) => ({
        blockId: b.id,
        physicalPageNumber: page,
        text: b.text,
        type:
          b.type === "HEADING"
            ? "heading"
            : b.type === "EQUATION"
              ? "formula"
              : "paragraph",
        confidence: 1,
        readingOrderIndex: b.sequenceNumber,
        bbox: {
          x: b.boundingBox![0],
          y: b.boundingBox![1],
          width: b.boundingBox![2] - b.boundingBox![0],
          height: b.boundingBox![3] - b.boundingBox![1],
        },
        words: [],
      }));
      return {
        ...(await this.fromImage(
          materialId,
          page,
          doc.numPages,
          canvas.toBuffer("image/png"),
          nativeEvidence.length ? nativeEvidence : undefined,
          performOcr,
        )),
        recommendedDepth,
        targetAudience: (material as any).targetAudience || "child",
      };
    } finally {
      await doc.destroy();
    }
  }
  private async storedEvidence(identity: {
    bookId: string;
    physicalPage: number;
    sourceHash: string;
  }): Promise<any | null> {
    try {
      const row = await this.prisma.guruPageEvidence?.findUnique({
        where: { bookId_physicalPage_sourceHash: identity },
      });
      return row && Array.isArray(row.blocks) ? row : null;
    } catch (error: any) {
      this.logger.warn("Evidence cache read failed: " + (error?.message || error));
      return null;
    }
  }
  /** Blocks only; the image is regenerated from the source bytes on every read. */
  private async persistEvidence(
    identity: { bookId: string; physicalPage: number; sourceHash: string },
    evidence: any,
    averageWordConfidence: number,
  ) {
    try {
      const data = {
        // never the image: blocks, status and identity only
        provenance: evidence.provenance,
        status: evidence.status,
        width: evidence.width,
        height: evidence.height,
        blocks: evidence.blocks,
        omittedBlockCount: evidence.omittedBlockCount,
        averageWordConfidence,
      };
      await this.prisma.guruPageEvidence?.upsert({
        where: { bookId_physicalPage_sourceHash: identity },
        create: { ...identity, ...data },
        update: data,
      });
    } catch (error: any) {
      // The lesson never depends on the cache write.
      this.logger.warn("Evidence cache write failed: " + (error?.message || error));
    }
  }
  private cacheKey(bookId: string, page: number, hash: string, performOcr: boolean) {
    return bookId + ":" + page + ":" + hash + (performOcr ? "" : ":peek");
  }
  private async fromImage(
    bookId: string,
    page: number,
    totalPages: number,
    bytes: Buffer,
    nativeBlocks?: any[],
    performOcr = true,
  ) {
    const hash = createHash("sha256").update(bytes).digest("hex");
    // Peeks (request paths) never share a promise with a running OCR pass, so they never wait on it.
    const key = this.cacheKey(bookId, page, hash, performOcr);
    if (!this.cache.has(key)) {
      if (this.cache.size >= 24) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }
      const pending = (async () => {
        const image = await require("@napi-rs/canvas").loadImage(bytes);
        if (image.width * image.height > 16000000)
          throw new BadRequestException(
            "Page dimensions exceed rendering limit",
          );
        const png = require("@napi-rs/canvas").createCanvas(
          image.width,
          image.height,
        );
        png.getContext("2d").drawImage(image, 0, 0);
        const imageBytes: Buffer = png.toBuffer("image/png");
        const imageDataUrl = "data:image/png;base64," + imageBytes.toString("base64");
        const identity = { bookId, physicalPage: page, sourceHash: hash };
        // Evidence for this exact page revision may already exist from another process or an earlier run.
        const stored = await this.storedEvidence(identity);
        if (stored)
          return {
            version: "page-evidence-v1",
            provenance: stored.provenance,
            bookId,
            physicalPage: page,
            totalPages,
            sourceHash: hash,
            width: stored.width,
            height: stored.height,
            imageDataUrl,
            imageBytes,
            status: stored.status,
            blocks: stored.blocks,
            omittedBlockCount: stored.omittedBlockCount,
            cached: "database",
          };
        if (!nativeBlocks && !performOcr)
          // The scan is ready to show; its text is read by the evidence worker, not in this request.
          return {
            version: "page-evidence-v1",
            provenance: "OCR",
            bookId,
            physicalPage: page,
            totalPages,
            sourceHash: hash,
            width: image.width,
            height: image.height,
            imageDataUrl,
            imageBytes,
            status: "PENDING",
            blocks: [],
            omittedBlockCount: 0,
          };
        const vision = nativeBlocks
          ? { blocks: nativeBlocks, averageWordConfidence: 1 }
          : await this.ocr.processPageVision(Number(page), bytes);
        const blocks = vision.blocks.filter(
          (b: any) =>
            b.text.trim() &&
            b.confidence >= 0.85 &&
            b.words.every(
              (w: any) => !/[A-Za-z]/.test(w.word) || w.confidence >= 0.65,
            ) &&
            b.bbox.width > 0 &&
            b.bbox.height > 0,
        );
        const evidence = {
          version: "page-evidence-v1",
          provenance: nativeBlocks ? "PDF_NATIVE" : "OCR",
          bookId,
          physicalPage: page,
          totalPages,
          sourceHash: hash,
          width: image.width,
          height: image.height,
          imageDataUrl,
          imageBytes,
          status:
            blocks.length && vision.averageWordConfidence >= 0.65
              ? "READY"
              : "NEEDS_REVIEW",
          blocks,
          omittedBlockCount: vision.blocks.length - blocks.length,
        };
        await this.persistEvidence(identity, evidence, vision.averageWordConfidence);
        return evidence;
      })();
      this.cache.set(key, pending);
      pending
        .then((result) => {
          // A pending page is re-checked against stored text on the next request.
          if (result?.status === "PENDING" && this.cache.get(key) === pending) this.cache.delete(key);
        })
        .catch(() => {
          if (this.cache.get(key) === pending) this.cache.delete(key);
        });
    }
    return this.cache.get(key);
  }
}
