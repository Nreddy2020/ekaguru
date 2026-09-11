import { nativePdfBlocks } from "../native-pdf-blocks";
import { Injectable, Logger } from "@nestjs/common";
import { promises as fs } from "fs";
import { createHash } from "crypto";
import {
  ExtractedDocument,
  ExtractedPage,
  ExtractedBlock,
} from "../document-extractor.interface";
import { OcrDocumentVisionService } from "../ocr-document-vision.service";

@Injectable()
export class PdfExtractorService {
  private readonly logger = new Logger(PdfExtractorService.name);
  supports(mimeType: string, extension: string) {
    return mimeType === "application/pdf" || extension.toLowerCase() === ".pdf";
  }
  /** Kept as a test seam: fixtures must model PDF pages, never a fabricated curriculum. */
  async openDocument(bytes: Buffer): Promise<any> {
    const importEsm = new Function("specifier", "return import(specifier)");
    const pdfjs = await importEsm("pdfjs-dist/legacy/build/pdf.mjs");
    return pdfjs.getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
      isEvalSupported: false,
    }).promise;
  }
  async extract(
    filePath: string,
    originalFilename: string,
  ): Promise<ExtractedDocument> {
    const bytes = await fs.readFile(filePath);
    const checksum = createHash("sha256").update(bytes).digest("hex");
    let doc: any;
    try {
      doc = await this.openDocument(bytes);
    } catch {
      throw new Error(
        "FAILED_TO_PARSE_PDF: The source PDF is unreadable. No replacement content was generated.",
      );
    }
    const pages: ExtractedPage[] = [];
    const warnings: string[] = [];
    try {
      if (
        !Number.isInteger(doc.numPages) ||
        doc.numPages < 1 ||
        doc.numPages > 2000
      )
        throw new Error("PDF page count is outside the supported limit");
      for (let number = 1; number <= doc.numPages; number++) {
        const page = await doc.getPage(number);
        const viewport = page.getViewport({ scale: 1 });
        if (viewport.width * viewport.height > 16000000)
          throw new Error("PDF page dimensions exceed extraction limit");
        const text = await page.getTextContent();
        let blocks: ExtractedBlock[] = nativePdfBlocks(
          text.items,
          viewport,
          number,
        );
        const ocrUsed = blocks.map((b) => b.text).join(" ").length < 40;
        let confidence = 1;
        if (ocrUsed) {
          const scale = 1.5;
          const rendered = page.getViewport({ scale });
          if (rendered.width * rendered.height > 16000000)
            throw new Error("PDF raster dimensions exceed extraction limit");
          const canvas = require("@napi-rs/canvas").createCanvas(
            Math.ceil(rendered.width),
            Math.ceil(rendered.height),
          );
          await page.render({
            canvasContext: canvas.getContext("2d"),
            viewport: rendered,
          }).promise;
          const vision = await new OcrDocumentVisionService().processPageVision(
            number,
            canvas.toBuffer("image/png"),
          );
          confidence = vision.averageWordConfidence;
          blocks = vision.blocks.map((b, index) => ({
            id: "page-" + number + "-block-" + index,
            type:
              b.type === "heading"
                ? "HEADING"
                : b.type === "formula"
                  ? "EQUATION"
                  : b.type === "table"
                    ? "TABLE"
                    : "PARAGRAPH",
            text: b.text,
            sequenceNumber: index + 1,
            pageNumber: number,
            confidence: b.confidence,
            boundingBox: [
              b.bbox.x / scale,
              b.bbox.y / scale,
              (b.bbox.x + b.bbox.width) / scale,
              (b.bbox.y + b.bbox.height) / scale,
            ],
          }));
          if (!blocks.length || confidence < 0.85)
            warnings.push("PAGE_" + number + "_NEEDS_OCR_REVIEW");
        }
        const rawText = blocks.map((b) => b.text).join("\n");
        const words = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
        const quality = {
          compositeScore: confidence,
          ocrTextConfidence: confidence,
          characterIntegrity: confidence,
          wordIntegrity: confidence,
          layoutConsistency: ocrUsed ? confidence : 1,
          pageNumberConfidence: 1,
          visualQuality: confidence,
          readingOrderConfidence: ocrUsed ? confidence : 1,
        };
        pages.push({
          pageNumber: number,
          physicalPageIndex: number,
          rawText,
          wordCount: words,
          classification: ocrUsed ? "SCANNED" : "TEXT_NATIVE",
          blocks,
          pageTruth: {
            documentId: checksum,
            physicalPageIndex: number,
            pageWidth: viewport.width,
            pageHeight: viewport.height,
            textExtractionMode: ocrUsed ? "OCR" : "NATIVE",
            ocrUsed,
            ocrConfidence: confidence,
            characterCount: rawText.length,
            wordCount: words,
            lineCount: blocks.length,
            visualObjects: {
              images: [],
              tables: [],
              diagrams: [],
              equations: [],
            },
            qualityScore: quality,
            corruptionFlags: confidence < 0.85 ? ["OCR_REVIEW_REQUIRED"] : [],
            status: !blocks.length
              ? "FAILED"
              : confidence < 0.85
                ? "NEEDS_REVIEW"
                : "VERIFIED",
          },
        });
        page.cleanup?.();
      }
    } finally {
      await doc.destroy();
    }
    this.logger.log(
      "Extracted " + pages.length + " actual pages from " + originalFilename,
    );
    const scanned = pages.filter((p) => p.classification === "SCANNED").length;
    return {
      metadata: {
        title: originalFilename,
        pageCount: pages.length,
        fileSizeBytes: bytes.length,
        checksum,
        mimeType: "application/pdf",
        documentType:
          scanned === pages.length
            ? "SCANNED_DOCUMENT"
            : scanned
              ? "MIXED_DOCUMENT"
              : "TEXTBOOK",
        forensicsMetrics: {
          totalWords: pages.reduce((s, p) => s + (p.wordCount || 0), 0),
          totalBlocks: pages.reduce((s, p) => s + p.blocks.length, 0),
          scannedPageCount: scanned,
          nativePageCount: pages.length - scanned,
          mixedPageCount: 0,
          verifiedPages: pages.filter((p) => p.pageTruth?.status === "VERIFIED")
            .length,
          degradedPages: pages.filter((p) => p.pageTruth?.status !== "VERIFIED")
            .length,
          averagePageQuality:
            pages.reduce(
              (s, p) => s + (p.pageTruth?.qualityScore.compositeScore || 0),
              0,
            ) / pages.length,
        },
      },
      pages,
      warnings,
    };
  }
}
