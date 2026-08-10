import { Injectable, Logger } from '@nestjs/common';
import {
  DocumentExtractorInterface,
  ExtractedDocument,
  ExtractedPage,
  ExtractedBlock,
} from '../document-extractor.interface';
import * as fs from 'fs';

@Injectable()
export class TextExtractorService implements DocumentExtractorInterface {
  private readonly logger = new Logger(TextExtractorService.name);

  supports(mimeType: string, extension: string): boolean {
    const ext = extension.toLowerCase();
    return (
      mimeType === 'text/plain' ||
      mimeType === 'text/markdown' ||
      ext === '.txt' ||
      ext === '.md'
    );
  }

  async extract(filePath: string, originalFilename: string): Promise<ExtractedDocument> {
    const fileBuffer = fs.readFileSync(filePath);
    const content = fileBuffer.toString('utf-8');
    const lines = content.split(/\r?\n/);

    const blocks: ExtractedBlock[] = [];
    let globalSequence = 1;
    let currentParagraph: string[] = [];

    const flushParagraph = (pageNum: number) => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ').trim();
        if (text.length > 0) {
          // Check if it's a list item
          const isList = /^[*\-\d+\.]\s+/.test(text);
          blocks.push({
            type: isList ? 'LIST' : 'PARAGRAPH',
            text,
            sequenceNumber: globalSequence++,
            pageNumber: pageNum,
          });
        }
        currentParagraph = [];
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph(1);
        continue;
      }

      // Check for Markdown headings (# Heading, ## Heading, ### Heading)
      const mdHeadingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (mdHeadingMatch) {
        flushParagraph(1);
        const level = mdHeadingMatch[1].length;
        const headingText = mdHeadingMatch[2].trim();
        blocks.push({
          type: 'HEADING',
          text: headingText,
          sequenceNumber: globalSequence++,
          pageNumber: 1,
          headingLevel: level,
        });
      } else {
        currentParagraph.push(line);
      }
    }
    flushParagraph(1);

    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        rawText: content,
        blocks,
      },
    ];

    return {
      metadata: {
        title: originalFilename,
        pageCount: 1,
        fileSizeBytes: fileBuffer.length,
        mimeType: 'text/plain',
      },
      pages,
      warnings: [],
    };
  }
}
