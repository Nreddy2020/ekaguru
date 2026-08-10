import { Injectable, Logger } from '@nestjs/common';
import {
  DocumentExtractorInterface,
  ExtractedDocument,
  ExtractedPage,
  ExtractedBlock,
} from '../document-extractor.interface';
import * as fs from 'fs';
import * as path from 'path';

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
      parsedData = await pdfParse(fileBuffer);
    } catch (err) {
      this.logger.warn(`Failed to parse PDF file '${originalFilename}': ${err.message}`);
      return {
        metadata: {
          title: originalFilename,
          pageCount: 0,
          fileSizeBytes: fileBuffer.length,
          mimeType: 'application/pdf',
        },
        pages: [],
        warnings: ['FAILED_TO_PARSE_PDF', 'OCR_REQUIRED'],
      };
    }

    const rawText = parsedData.text || '';
    const pageCount = parsedData.numpages || 1;

    if (!rawText || rawText.trim().length === 0) {
      warnings.push('OCR_REQUIRED');
      return {
        metadata: {
          title: parsedData.info?.Title || originalFilename,
          author: parsedData.info?.Author || undefined,
          pageCount,
          fileSizeBytes: fileBuffer.length,
          mimeType: 'application/pdf',
        },
        pages: [
          {
            pageNumber: 1,
            rawText: '',
            blocks: [],
          },
        ],
        warnings,
      };
    }

    // Split text deterministically into pages using form-feed / page breaks or approximate splitting
    const rawPages = rawText.split(/\f|\n\s*--- Page \d+ ---\s*\n/);
    const pages: ExtractedPage[] = [];
    let globalSequence = 1;

    for (let i = 0; i < Math.max(pageCount, rawPages.length); i++) {
      const pageNum = i + 1;
      const pageText = rawPages[i] || '';
      const lines = pageText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

      const blocks: ExtractedBlock[] = [];
      let currentParagraph: string[] = [];

      for (const line of lines) {
        // Deterministic heading detection: Chapter / Unit / Module / Short ALL CAPS heading
        const isChapterHeading = /^(chapter|unit|module|section)\s+\d+/i.test(line);
        const isShortHeading = line.length <= 60 && (line === line.toUpperCase() || /^\d+\.\d+\s+[A-Z]/.test(line));

        if (isChapterHeading || isShortHeading) {
          if (currentParagraph.length > 0) {
            blocks.push({
              type: 'PARAGRAPH',
              text: currentParagraph.join(' '),
              sequenceNumber: globalSequence++,
              pageNumber: pageNum,
            });
            currentParagraph = [];
          }

          blocks.push({
            type: 'HEADING',
            text: line,
            sequenceNumber: globalSequence++,
            pageNumber: pageNum,
            headingLevel: isChapterHeading ? 1 : 2,
          });
        } else {
          currentParagraph.push(line);
        }
      }

      if (currentParagraph.length > 0) {
        blocks.push({
          type: 'PARAGRAPH',
          text: currentParagraph.join(' '),
          sequenceNumber: globalSequence++,
          pageNumber: pageNum,
        });
      }

      pages.push({
        pageNumber: pageNum,
        rawText: pageText,
        blocks,
      });
    }

    return {
      metadata: {
        title: parsedData.info?.Title || originalFilename,
        author: parsedData.info?.Author || undefined,
        pageCount,
        fileSizeBytes: fileBuffer.length,
        mimeType: 'application/pdf',
      },
      pages,
      warnings,
    };
  }
}
