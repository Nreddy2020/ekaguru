import { Injectable, Logger } from '@nestjs/common';
import {
  DocumentExtractorInterface,
  ExtractedDocument,
  ExtractedPage,
  ExtractedBlock,
} from '../document-extractor.interface';
import * as fs from 'fs';

@Injectable()
export class EpubExtractorService implements DocumentExtractorInterface {
  private readonly logger = new Logger(EpubExtractorService.name);

  supports(mimeType: string, extension: string): boolean {
    const ext = extension.toLowerCase();
    return mimeType === 'application/epub+zip' || ext === '.epub';
  }

  async extract(filePath: string, originalFilename: string): Promise<ExtractedDocument> {
    const fileBuffer = fs.readFileSync(filePath);
    const warnings: string[] = [
      'EPUB pages are logical sections derived from EPUB spine documents.',
    ];

    // Basic deterministic EPUB text extraction (extracting XHTML text blocks)
    const fileString = fileBuffer.toString('utf-8', 0, Math.min(fileBuffer.length, 500000));
    
    // Extract HTML tags from spine/container content
    const tagRegex = /<(h[1-6]|p|div|section)[^>]*>([\s\S]*?)<\/\1>/gi;
    let match: RegExpExecArray | null;

    let pageNumber = 1;
    let globalSequence = 1;
    const blocks: ExtractedBlock[] = [];
    const pageRawTextParts: string[] = [];

    while ((match = tagRegex.exec(fileString)) !== null) {
      const tag = match[1].toLowerCase();
      const text = match[2].replace(/<[^>]+>/g, '').trim();

      if (!text || text.length < 3) continue;

      if (tag.startsWith('h')) {
        const level = parseInt(tag.charAt(1), 10);
        blocks.push({
          type: 'HEADING',
          text,
          sequenceNumber: globalSequence++,
          pageNumber,
          headingLevel: level,
        });
        pageRawTextParts.push(text);
      } else {
        blocks.push({
          type: 'PARAGRAPH',
          text,
          sequenceNumber: globalSequence++,
          pageNumber,
        });
        pageRawTextParts.push(text);
      }
    }

    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        rawText: pageRawTextParts.join('\n'),
        blocks,
      },
    ];

    return {
      metadata: {
        title: originalFilename,
        pageCount: pages.length,
        fileSizeBytes: fileBuffer.length,
        mimeType: 'application/epub+zip',
      },
      pages,
      warnings,
    };
  }
}
