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

  async extract(filePath: string, originalFilename: string, documentId?: string): Promise<ExtractedDocument> {
    const fileBuffer = fs.readFileSync(filePath);
    const warnings: string[] = [];

    const deterministicDocId =
      documentId ||
      crypto
        .createHash('sha256')
        .update(`${originalFilename}:${fileBuffer.length}:${filePath}`)
        .digest('hex')
        .slice(0, 16);

    let parsedData: any;
    try {
      if (typeof pdfParse === 'function') {
        parsedData = await pdfParse(fileBuffer);
      } else if (pdfParse && pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: fileBuffer });
        const textResult = await parser.getText();
        const infoResult = typeof parser.getInfo === 'function' ? await parser.getInfo().catch(() => ({})) : {};
        parsedData = {
          text:
            typeof textResult === 'string'
              ? textResult
              : textResult?.text ||
                (Array.isArray(textResult?.pages)
                  ? textResult.pages.map((p: any) => p.text).join('\n\f\n')
                  : ''),
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
    let verifiedPages = 0;
    let degradedPages = 0;
    let totalQualityScoreSum = 0;
    let totalWords = 0;
    let totalBlocks = 0;

    const actualPageCount = Math.max(pageCount, rawPages.length);

    for (let i = 0; i < actualPageCount; i++) {
      const physicalPageIndex = i + 1;
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

      // 2. Full-Document OCR Handler for SCANNED / MIXED pages
      if (classification === 'SCANNED' || classification === 'MIXED') {
        try {
          const ocrResult = await this.runTesseractOcrIfAvailable(fileBuffer, physicalPageIndex);
          if (ocrResult && ocrResult.text.trim().length > pageText.length) {
            pageText = ocrResult.text.trim();
            ocrApplied = true;
            ocrConfidence = ocrResult.confidence;
            this.logger.log(`OCR recovered ${pageText.length} characters on page ${physicalPageIndex} (confidence: ${ocrConfidence}).`);
          }
        } catch (ocrErr) {
          this.logger.warn(`OCR execution skipped/failed on page ${physicalPageIndex}: ${ocrErr.message}`);
        }
      }

      if (classification === 'SCANNED' && !ocrApplied) {
        warnings.push(`OCR_REQUIRED_PAGE_${physicalPageIndex}`);
      }

      const lines = pageText.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      const blocks: ExtractedBlock[] = [];
      let currentParagraph: string[] = [];
      let currentParaStartY = 100;

      let estimatedY = 50;
      const pageHeight = 792;
      const pageWidth = 612;

      // Visual objects collection for Page Truth Record
      const images: any[] = [];
      const tables: any[] = [];
      const diagrams: any[] = [];
      const equations: any[] = [];

      let detectedPrintedPage: number | undefined;
      let detectedPrintedPageConfidence = 0.0;
      let detectedPrintedPageBBox: [number, number, number, number] | undefined;

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        const lineY = Math.min(pageHeight - 20, estimatedY + lineIdx * 16);

        // Page Number Detection (Physical vs Printed)
        const isHeaderFooter =
          (lineIdx === 0 && line.length < 40 && (line.includes('Page') || /^\d+$/.test(line))) ||
          (lineIdx === lines.length - 1 && /^\d+$/.test(line));

        const pageMatch = line.match(/(?:Page|p\.?)\s*(\d+)/i) || (line.length <= 5 && line.match(/^(\d+)$/));
        if (pageMatch && !detectedPrintedPage) {
          detectedPrintedPage = parseInt(pageMatch[1], 10);
          detectedPrintedPageConfidence = 0.95;
          detectedPrintedPageBBox = [36, lineY, 100, lineY + 12];
        }

        const isCaption = /^(figure|fig\.|diagram|illustration|table)\s+\d+/i.test(line);
        const isEquation =
          /(?:[a-zA-Z]\s*=\s*[^=]+|\b\d+\s*[\+\-\*\/]\s*\d+\s*=|\bE\s*=\s*mc\^2\b|\bF\s*=\s*ma\b)/i.test(line) &&
          line.length < 80;
        const isTable =
          (line.includes('|') || line.includes('\t') || /\s{3,}/.test(line)) &&
          line.split(/\s{2,}|\t|\|/).length >= 3;
        const isListItem = /^(\d+[\.\)]|\-|\*|•|\([a-z]\))\s+/i.test(line);
        const isChapterHeading = /^(chapter|unit|module|section)\s+\d+/i.test(line);
        const isSectionHeading =
          /^\d+\.\d+(\.\d+)?\s+[A-Z]/.test(line) ||
          (line.length <= 60 && line === line.toUpperCase() && /[A-Z]{3,}/.test(line));

        if (isHeaderFooter) {
          blocks.push(this.createBlock('HEADER', line, globalSequence++, physicalPageIndex, [36, lineY, pageWidth - 36, lineY + 12], 9, false));
        } else if (isCaption) {
          if (currentParagraph.length > 0) {
            blocks.push(this.flushParagraph(currentParagraph, globalSequence++, physicalPageIndex, currentParaStartY, lineY));
            currentParagraph = [];
          }
          const captionBlock = {
            ...this.createBlock('CAPTION', line, globalSequence++, physicalPageIndex, [54, lineY, pageWidth - 54, lineY + 14], 10, false, true),
            structuredData: { diagramCaption: line },
          };
          blocks.push(captionBlock);
          diagrams.push({
            id: `diag-${physicalPageIndex}-${diagrams.length + 1}`,
            title: line,
            boundingBox: [54, lineY, pageWidth - 54, lineY + 14],
            labels: [line],
            caption: line,
          });
        } else if (isEquation) {
          if (currentParagraph.length > 0) {
            blocks.push(this.flushParagraph(currentParagraph, globalSequence++, physicalPageIndex, currentParaStartY, lineY));
            currentParagraph = [];
          }
          const eqBlock = {
            ...this.createBlock('EQUATION', line, globalSequence++, physicalPageIndex, [72, lineY, pageWidth - 72, lineY + 20], 12, true),
            structuredData: { latexEquation: line },
          };
          blocks.push(eqBlock);
          equations.push({
            id: `eq-${physicalPageIndex}-${equations.length + 1}`,
            boundingBox: [72, lineY, pageWidth - 72, lineY + 20],
            latexOrText: line,
            inline: false,
          });
        } else if (isTable) {
          if (currentParagraph.length > 0) {
            blocks.push(this.flushParagraph(currentParagraph, globalSequence++, physicalPageIndex, currentParaStartY, lineY));
            currentParagraph = [];
          }
          const tableCols = line.split(/\s{2,}|\t|\|/).map((c) => c.trim()).filter((c) => c.length > 0);
          blocks.push({
            ...this.createBlock('TABLE', line, globalSequence++, physicalPageIndex, [36, lineY, pageWidth - 36, lineY + 30], 10, false),
            structuredData: { tableJson: { rawRows: [line] } },
          });
          tables.push({
            id: `tbl-${physicalPageIndex}-${tables.length + 1}`,
            boundingBox: [36, lineY, pageWidth - 36, lineY + 30],
            headers: tableCols,
            rows: [tableCols],
            cellCount: tableCols.length,
          });
        } else if (isChapterHeading || isSectionHeading) {
          if (currentParagraph.length > 0) {
            blocks.push(this.flushParagraph(currentParagraph, globalSequence++, physicalPageIndex, currentParaStartY, lineY));
            currentParagraph = [];
          }
          const headingLevel = isChapterHeading ? 1 : (isSectionHeading ? 2 : 3);
          const fontSize = headingLevel === 1 ? 22 : 16;
          blocks.push({
            ...this.createBlock('HEADING', line, globalSequence++, physicalPageIndex, [36, lineY, pageWidth - 36, lineY + fontSize], fontSize, true),
            headingLevel,
          });
        } else if (isListItem) {
          if (currentParagraph.length > 0) {
            blocks.push(this.flushParagraph(currentParagraph, globalSequence++, physicalPageIndex, currentParaStartY, lineY));
            currentParagraph = [];
          }
          blocks.push(this.createBlock('LIST', line, globalSequence++, physicalPageIndex, [54, lineY, pageWidth - 36, lineY + 14], 11, false));
        } else {
          if (currentParagraph.length === 0) currentParaStartY = lineY;
          currentParagraph.push(line);
        }
      }

      if (currentParagraph.length > 0) {
        blocks.push(this.flushParagraph(currentParagraph, globalSequence++, physicalPageIndex, currentParaStartY, pageHeight - 40));
      }

      totalBlocks += blocks.length;

      // 3. Page Truth Quality Gate & Corruption Analysis
      const corruptionFlags: string[] = [];
      let characterIntegrity = 1.0;
      let wordIntegrity = 1.0;

      if (pageText.length > 0) {
        const nonAsciiGarbage = (pageText.match(/[^\x20-\x7E\u0900-\u097F\n\r\t]/g) || []).length;
        if (nonAsciiGarbage / pageText.length > 0.15) {
          corruptionFlags.push('EXCESSIVE_GARBAGE_CHARACTERS');
          characterIntegrity = Math.max(0.2, 1.0 - (nonAsciiGarbage / pageText.length) * 2);
        }

        const words = pageText.split(/\s+/);
        const fragmentedWords = words.filter((w: string) => w.length === 1 && /[b-hj-z]/i.test(w)).length;
        if (words.length > 10 && fragmentedWords / words.length > 0.2) {
          corruptionFlags.push('FRAGMENTED_WORDS_DETECTED');
          wordIntegrity = Math.max(0.3, 1.0 - (fragmentedWords / words.length) * 2);
        }
      } else {
        characterIntegrity = 0.0;
        wordIntegrity = 0.0;
        corruptionFlags.push('EMPTY_PAGE_TEXT');
      }

      const layoutConsistency = blocks.length > 0 ? 0.95 : 0.2;
      const readingOrderConfidence = 0.95;
      const visualQuality = (images.length > 0 || tables.length > 0 || diagrams.length > 0) ? 0.90 : 0.85;

      const compositeScore = Math.min(
        1.0,
        Math.max(
          0.0,
          0.30 * ocrConfidence +
          0.20 * characterIntegrity +
          0.15 * wordIntegrity +
          0.10 * layoutConsistency +
          0.10 * (detectedPrintedPageConfidence > 0 ? 1.0 : 0.7) +
          0.10 * visualQuality +
          0.05 * readingOrderConfidence
        )
      );

      let pageStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'FAILED' = 'VERIFIED';
      if (compositeScore < 0.40 || (classification === 'SCANNED' && !ocrApplied)) {
        pageStatus = 'FAILED';
        degradedPages++;
      } else if (compositeScore < 0.70 || corruptionFlags.length > 0) {
        pageStatus = 'NEEDS_REVIEW';
        degradedPages++;
      } else {
        verifiedPages++;
      }

      totalQualityScoreSum += compositeScore;

      const pageTruth = {
        documentId: deterministicDocId,
        physicalPageIndex,
        printedPageNumber: detectedPrintedPage,
        printedPageNumberConfidence: detectedPrintedPageConfidence,
        printedPageNumberBBox: detectedPrintedPageBBox,
        pageWidth,
        pageHeight,
        textExtractionMode: classification === 'SCANNED' ? ('OCR' as const) : (classification === 'MIXED' ? ('HYBRID' as const) : ('NATIVE' as const)),
        ocrUsed: ocrApplied,
        ocrEngine: ocrApplied ? 'tesseract.js' : undefined,
        ocrConfidence,
        characterCount: pageText.length,
        wordCount,
        lineCount: lines.length,
        visualObjects: {
          images,
          tables,
          diagrams,
          equations,
        },
        qualityScore: {
          compositeScore,
          ocrTextConfidence: ocrConfidence,
          characterIntegrity,
          wordIntegrity,
          layoutConsistency,
          pageNumberConfidence: detectedPrintedPageConfidence,
          visualQuality,
          readingOrderConfidence,
        },
        corruptionFlags,
        status: pageStatus,
      };

      pages.push({
        pageNumber: physicalPageIndex,
        physicalPageIndex,
        rawText: pageText,
        classification,
        textDensity,
        wordCount,
        blocks,
        pageTruth,
        ocrMetadata: {
          ocrUsed: ocrApplied,
          ocrConfidence,
          ocrEngine: ocrApplied ? 'tesseract.js' : undefined,
          ocrLanguage: ocrApplied ? 'eng' : undefined,
          ocrBoundingBox: ocrApplied ? [0, 0, pageWidth, pageHeight] : undefined,
        },
      });
    }

    // 4. Document Forensics Classification
    const documentType = this.inferDocumentType(rawText, scannedPageCount, actualPageCount);
    const averagePageQuality = actualPageCount > 0 ? totalQualityScoreSum / actualPageCount : 0.0;

    return {
      metadata: {
        title: parsedData.info?.Title || originalFilename,
        author: parsedData.info?.Author || undefined,
        pageCount: actualPageCount,
        fileSizeBytes: fileBuffer.length,
        documentType,
        checksum: crypto.createHash('sha256').update(fileBuffer).digest('hex'),
        mimeType: 'application/pdf',
        forensicsMetrics: {
          totalWords,
          totalBlocks,
          scannedPageCount,
          nativePageCount,
          mixedPageCount,
          verifiedPages,
          degradedPages,
          averagePageQuality,
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
      if (!buffer || buffer.length < 4) return null;
      // Do not pass raw PDF file buffer directly to Tesseract (requires raster image)
      if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        return null;
      }
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

