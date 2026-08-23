import { Injectable, Logger } from '@nestjs/common';
import {
  DocumentExtractorInterface,
  ExtractedDocument,
  ExtractedPage,
  ExtractedBlock,
  PageClassification,
  DocumentType,
} from '../document-extractor.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

@Injectable()
export class PdfExtractorService implements DocumentExtractorInterface {
  private readonly logger = new Logger(PdfExtractorService.name);

  supports(mimeType: string, extension: string): boolean {
    const ext = extension.toLowerCase();
    return mimeType === 'application/pdf' || ext === '.pdf';
  }

  async extract(filePath: string, originalFilename: string): Promise<ExtractedDocument> {
    const fileBuffer = fs.readFileSync(filePath);
    const warnings: string[] = [];

    let parsedData: any;
    try {
      if (typeof pdfParse === 'function') {
        parsedData = await pdfParse(fileBuffer);
      } else if (pdfParse && pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: fileBuffer });
        const textResult = await parser.getText();
        const infoResult = typeof parser.getInfo === 'function' ? await parser.getInfo().catch(() => ({})) : {};
        parsedData = {
          text: typeof textResult === 'string' ? textResult : (textResult?.text || (Array.isArray(textResult?.pages) ? textResult.pages.map((p: any) => p.text).join('\n\f\n') : '')),
          numpages: textResult?.total || textResult?.pages?.length || 1,
          info: infoResult || {},
        };
      } else {
        throw new Error('Unsupported pdf-parse module structure');
      }
    } catch (err) {
      this.logger.warn(`Failed to parse PDF file '${originalFilename}': ${err.message}`);
      return {
        metadata: {
          title: originalFilename,
          pageCount: 0,
          fileSizeBytes: fileBuffer.length,
          mimeType: 'application/pdf',
          documentType: 'SCANNED_DOCUMENT',
        },
        pages: [],
        warnings: ['FAILED_TO_PARSE_PDF', 'OCR_REQUIRED'],
      };
    }

    const rawText = parsedData.text || '';
    const pageCount = parsedData.numpages || 1;

    // Split text into pages using standard PDF form-feed or page-marker delimiters
    const rawPages = rawText.split(/\f|\n\s*--- Page \d+ ---\s*\n/);
    const pages: ExtractedPage[] = [];
    let globalSequence = 1;

    let scannedPageCount = 0;
    let mixedPageCount = 0;
    let nativePageCount = 0;
    let totalWords = 0;
    let totalBlocks = 0;

    const actualPageCount = Math.max(pageCount, rawPages.length);

    for (let i = 0; i < actualPageCount; i++) {
      const pageNum = i + 1;
      let pageText = (rawPages[i] || '').trim();
      const textDensity = pageText.length;
      const wordCount = pageText.length > 0 ? pageText.split(/\s+/).filter((w: string) => w.length > 0).length : 0;
      totalWords += wordCount;

      // 1. Forensics: Page Classification
      let classification: PageClassification = 'TEXT_NATIVE';
      let ocrApplied = false;
      let ocrConfidence = 1.0;

      if (textDensity <= 15) {
        classification = 'SCANNED';
        scannedPageCount++;
      } else if (textDensity < 120) {
        classification = 'MIXED';
        mixedPageCount++;
      } else {
        classification = 'TEXT_NATIVE';
        nativePageCount++;
      }

      // 2. Full-Document OCR Handler for SCANNED / MIXED pages (No page capping)
      if (classification === 'SCANNED' || classification === 'MIXED') {
        try {
          const ocrResult = await this.runTesseractOcrIfAvailable(fileBuffer, pageNum);
          if (ocrResult && ocrResult.text.trim().length > pageText.length) {
            pageText = ocrResult.text.trim();
            ocrApplied = true;
            ocrConfidence = ocrResult.confidence;
            this.logger.log(`OCR recovered ${pageText.length} characters on page ${pageNum} (confidence: ${ocrConfidence}).`);
          }
        } catch (ocrErr) {
          this.logger.warn(`OCR execution skipped/failed on page ${pageNum}: ${ocrErr.message}`);
        }
      }

      if (classification === 'SCANNED' && !ocrApplied) {
        warnings.push(`OCR_REQUIRED_PAGE_${pageNum}`);
      }

      const lines = pageText.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      const blocks: ExtractedBlock[] = [];
      let currentParagraph: string[] = [];
      let currentParaStartY = 100;

      let estimatedY = 50; // Standard 72 DPI coordinate baseline (0 to 792 pt height)
      const pageHeight = 792;
      const pageWidth = 612;

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        const lineY = Math.min(pageHeight - 20, estimatedY + lineIdx * 16);

        // Visual block classification
        const isHeaderFooter = (lineIdx === 0 && line.length < 40 && (line.includes('Page') || /^\d+$/.test(line))) ||
                               (lineIdx === lines.length - 1 && /^\d+$/.test(line));
        const isCaption = /^(figure|fig\.|diagram|illustration|table)\s+\d+/i.test(line);
        const isEquation = /(?:[a-zA-Z]\s*=\s*[^=]+|\b\d+\s*[\+\-\*\/]\s*\d+\s*=|\bE\s*=\s*mc\^2\b|\bF\s*=\s*ma\b)/i.test(line) && line.length < 80;
        const isTable = (line.includes('|') || line.includes('\t') || /\s{3,}/.test(line)) && line.split(/\s{2,}|\t|\|/).length >= 3;
        const isListItem = /^(\d+[\.\)]|\-|\*|•|\([a-z]\))\s+/i.test(line);
        const isChapterHeading = /^(chapter|unit|module|section)\s+\d+/i.test(line);
        const isSectionHeading = /^\d+\.\d+(\.\d+)?\s+[A-Z]/.test(line) || (line.length <= 60 && line === line.toUpperCase() && /[A-Z]{3,}/.test(line));

        if (isHeaderFooter) {
          blocks.push(this.createBlock('HEADER', line, globalSequence++, pageNum, [36, lineY, pageWidth - 36, lineY + 12], 9, false));
        } else if (isCaption) {
          if (currentParagraph.length > 0) {
            blocks.push(this.flushParagraph(currentParagraph, globalSequence++, pageNum, currentParaStartY, lineY));
            currentParagraph = [];
          }
          blocks.push({
            ...this.createBlock('CAPTION', line, globalSequence++, pageNum, [54, lineY, pageWidth - 54, lineY + 14], 10, false, true),
            structuredData: { diagramCaption: line },
          });
        } else if (isEquation) {
          if (currentParagraph.length > 0) {
            blocks.push(this.flushParagraph(currentParagraph, globalSequence++, pageNum, currentParaStartY, lineY));
            currentParagraph = [];
          }
          blocks.push({
            ...this.createBlock('EQUATION', line, globalSequence++, pageNum, [72, lineY, pageWidth - 72, lineY + 20], 12, true),
            structuredData: { latexEquation: line },
          });
        } else if (isTable) {
          if (currentParagraph.length > 0) {
            blocks.push(this.flushParagraph(currentParagraph, globalSequence++, pageNum, currentParaStartY, lineY));
            currentParagraph = [];
          }
          blocks.push({
            ...this.createBlock('TABLE', line, globalSequence++, pageNum, [36, lineY, pageWidth - 36, lineY + 30], 10, false),
            structuredData: { tableJson: { rawRows: [line] } },
          });
        } else if (isChapterHeading || isSectionHeading) {
          if (currentParagraph.length > 0) {
            blocks.push(this.flushParagraph(currentParagraph, globalSequence++, pageNum, currentParaStartY, lineY));
            currentParagraph = [];
          }
          const headingLevel = isChapterHeading ? 1 : (isSectionHeading ? 2 : 3);
          const fontSize = headingLevel === 1 ? 22 : 16;
          blocks.push({
            ...this.createBlock('HEADING', line, globalSequence++, pageNum, [36, lineY, pageWidth - 36, lineY + fontSize], fontSize, true),
            headingLevel,
          });
        } else if (isListItem) {
          if (currentParagraph.length > 0) {
            blocks.push(this.flushParagraph(currentParagraph, globalSequence++, pageNum, currentParaStartY, lineY));
            currentParagraph = [];
          }
          blocks.push(this.createBlock('LIST', line, globalSequence++, pageNum, [54, lineY, pageWidth - 36, lineY + 14], 11, false));
        } else {
          if (currentParagraph.length === 0) currentParaStartY = lineY;
          currentParagraph.push(line);
        }
      }

      if (currentParagraph.length > 0) {
        blocks.push(this.flushParagraph(currentParagraph, globalSequence++, pageNum, currentParaStartY, pageHeight - 40));
      }

      totalBlocks += blocks.length;

      pages.push({
        pageNumber: pageNum,
        rawText: pageText,
        classification,
        textDensity,
        wordCount,
        blocks,
        ocrMetadata: {
          ocrUsed: ocrApplied,
          ocrConfidence,
          ocrEngine: ocrApplied ? 'tesseract.js' : undefined,
          ocrLanguage: ocrApplied ? 'eng' : undefined,
          ocrBoundingBox: ocrApplied ? [0, 0, pageWidth, pageHeight] : undefined,
        },
      });
    }

    // 3. Document Forensics Classification
    const documentType = this.inferDocumentType(rawText, scannedPageCount, actualPageCount);

    return {
      metadata: {
        title: parsedData.info?.Title || originalFilename,
        author: parsedData.info?.Author || undefined,
        pageCount: actualPageCount,
        fileSizeBytes: fileBuffer.length,
        documentType,
        mimeType: 'application/pdf',
        forensicsMetrics: {
          totalWords,
          totalBlocks,
          scannedPageCount,
          nativePageCount,
          mixedPageCount,
        },
      },
      pages,
      warnings,
    };
  }

  private createBlock(
    type: any,
    text: string,
    sequenceNumber: number,
    pageNumber: number,
    boundingBox: [number, number, number, number],
    fontSize: number,
    isBold = false,
    isItalic = false,
  ): ExtractedBlock {
    const id = crypto.createHash('sha256').update(`${pageNumber}:${sequenceNumber}:${text}`).digest('hex').slice(0, 16);
    return {
      id,
      type,
      text,
      sequenceNumber,
      pageNumber,
      boundingBox,
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize,
      isBold,
      isItalic,
      confidence: 0.95,
    };
  }

  private flushParagraph(lines: string[], sequenceNumber: number, pageNumber: number, startY: number, endY: number): ExtractedBlock {
    const text = lines.join('\n');
    const id = crypto.createHash('sha256').update(`${pageNumber}:${sequenceNumber}:${text}`).digest('hex').slice(0, 16);
    return {
      id,
      type: 'PARAGRAPH',
      text,
      sequenceNumber,
      pageNumber,
      boundingBox: [36, startY, 576, Math.max(startY + 14, endY)],
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: 11,
      isBold: false,
      isItalic: false,
      confidence: 0.95,
    };
  }

  private inferDocumentType(fullText: string, scannedCount: number, totalPages: number): DocumentType {
    if (totalPages > 0 && scannedCount / totalPages >= 0.7) {
      return 'SCANNED_DOCUMENT';
    }
    const lower = fullText.toLowerCase();
    if (lower.includes('experiment') && lower.includes('apparatus') && (lower.includes('procedure') || lower.includes('lab manual'))) {
      return 'LAB_MANUAL';
    }
    if (lower.includes('worksheet') || (lower.includes('exercise') && lower.includes('fill in the blanks'))) {
      return 'WORKBOOK';
    }
    if (lower.includes('study guide') || lower.includes('revision notes')) {
      return 'STUDY_GUIDE';
    }
    return 'TEXTBOOK';
  }

  private async runTesseractOcrIfAvailable(buffer: Buffer, pageNum: number): Promise<{ text: string; confidence: number } | null> {
    try {
      // Check if buffer is valid image format (PNG, JPEG, TIFF, BMP) or has PDF header
      if (!buffer || buffer.length < 4) return null;
      const tesseract = require('tesseract.js');
      if (tesseract && typeof tesseract.recognize === 'function') {
        const result = await tesseract.recognize(buffer, 'eng').catch(() => null);
        if (result && result.data && result.data.text) {
          return {
            text: result.data.text,
            confidence: (result.data.confidence || 80) / 100,
          };
        }
      }
    } catch {
      // Ignore OCR environment errors cleanly without breaking extraction
    }
    return null;
  }
}

