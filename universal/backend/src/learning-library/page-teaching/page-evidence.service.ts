import { nativePdfBlocks } from "../extraction/native-pdf-blocks";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { promises as fs } from "fs";
import * as path from "path";
import { createHash } from "crypto";
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
@Injectable()
export class PageEvidenceService {
  private cache = new Map<string, Promise<any>>();
  constructor(
    private readonly ocr: OcrDocumentVisionService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private pageNumber(value: string) {
    if (!/^[1-9][0-9]*$/.test(value) || Number(value) > 10000)
      throw new BadRequestException("Invalid physical page");
    return Number(value);
  }
  async builtin(bookId: string, value: string) {
    const page = this.pageNumber(value);
    if (!BOOKS.includes(bookId))
      throw new NotFoundException("Unknown textbook");
    const base =
      process.env.TEXTBOOK_SCAN_DIR ||
      path.resolve(process.cwd(), "../frontend/public/textbooks");
    const dir = path.join(base, bookId);
    let bytes: Buffer;
    try {
      bytes = await fs.readFile(path.join(dir, "page-" + page + ".png"));
    } catch {
      throw new NotFoundException("Physical scan unavailable");
    }
    const files = await fs.readdir(dir);
    const totalPages = Math.max(
      ...files
        .filter((f) => /^page-[0-9]+\.png$/.test(f))
        .map((f) => Number(f.match(/[0-9]+/)![0])),
    );
    return this.fromImage(bookId, page, totalPages, bytes);
  }
  async material(materialId: string, value: string) {
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
        ...(await this.fromImage(materialId, page, 1, bytes)),
        recommendedDepth,
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
        )),
        recommendedDepth,
      };
    } finally {
      await doc.destroy();
    }
  }
  private async fromImage(
    bookId: string,
    page: number,
    totalPages: number,
    bytes: Buffer,
    nativeBlocks?: any[],
  ) {
    const hash = createHash("sha256").update(bytes).digest("hex");
    const key = bookId + ":" + page + ":" + hash;
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
        return {
          version: "page-evidence-v1",
          provenance: nativeBlocks ? "PDF_NATIVE" : "OCR",
          bookId,
          physicalPage: page,
          totalPages,
          sourceHash: hash,
          width: image.width,
          height: image.height,
          imageDataUrl:
            "data:image/png;base64," +
            png.toBuffer("image/png").toString("base64"),
          status:
            blocks.length && vision.averageWordConfidence >= 0.65
              ? "READY"
              : "NEEDS_REVIEW",
          blocks,
          omittedBlockCount: vision.blocks.length - blocks.length,
        };
      })();
      this.cache.set(key, pending);
      pending.catch(() => {
        if (this.cache.get(key) === pending) this.cache.delete(key);
      });
    }
    return this.cache.get(key);
  }
}
