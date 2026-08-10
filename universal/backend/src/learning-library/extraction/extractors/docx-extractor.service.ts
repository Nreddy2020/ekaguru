import { Injectable, Logger } from '@nestjs/common';
import {
  DocumentExtractorInterface,
  ExtractedDocument,
  ExtractedPage,
  ExtractedBlock,
} from '../document-extractor.interface';
import * as fs from 'fs';
import * as mammoth from 'mammoth';

@Injectable()
export class DocxExtractorService implements DocumentExtractorInterface {
  private readonly logger = new Logger(DocxExtractorService.name);

  supports(mimeType: string, extension: string): boolean {
    const ext = extension.toLowerCase();
    return (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === '.docx'
    );
  }

  async extract(filePath: string, originalFilename: string): Promise<ExtractedDocument> {
    const fileBuffer = fs.readFileSync(filePath);
    const warnings: string[] = [
      'DOCX page numbers are logical sections derived from document headings.',
    ];

    let result: any;
    try {
      result = await mammoth.convertToHtml({ buffer: fileBuffer });
    } catch (err) {
      this.logger.warn(`Failed to parse DOCX file '${originalFilename}': ${err.message}`);
      return {
        metadata: {
          title: originalFilename,
          pageCount: 0,
          fileSizeBytes: fileBuffer.length,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        pages: [],
        warnings: ['FAILED_TO_PARSE_DOCX'],
      };
    }

    const html = result.value || '';
    if (result.messages && result.messages.length > 0) {
      warnings.push(...result.messages.map((m: any) => m.message));
    }

    // Parse HTML blocks (h1-h6, p, ul/ol, table)
    const blocks: ExtractedBlock[] = [];
    let pageNumber = 1;
    let globalSequence = 1;

    // Simple deterministic HTML parser for mammoth output
    const tagRegex = /<(h[1-6]|p|ul|ol|table)[^>]*>([\s\S]*?)<\/\1>/gi;
    let match: RegExpExecArray | null;

    let pageBlocks: ExtractedBlock[] = [];
    let pageRawTextParts: string[] = [];
    const pages: ExtractedPage[] = [];

    while ((match = tagRegex.exec(html)) !== null) {
      const tag = match[1].toLowerCase();
      const content = match[2].replace(/<[^>]+>/g, '').trim();

      if (!content) continue;

      if (tag.startsWith('h')) {
        const level = parseInt(tag.charAt(1), 10);
        // Increment logical page number on H1
        if (level === 1 && pageBlocks.length > 0) {
          pages.push({
            pageNumber,
            rawText: pageRawTextParts.join('\n'),
            blocks: pageBlocks,
          });
          pageNumber++;
          pageBlocks = [];
          pageRawTextParts = [];
        }

        const block: ExtractedBlock = {
          type: 'HEADING',
          text: content,
          sequenceNumber: globalSequence++,
          pageNumber,
          headingLevel: level,
        };
        pageBlocks.push(block);
        pageRawTextParts.push(content);
      } else if (tag === 'p') {
        const block: ExtractedBlock = {
          type: 'PARAGRAPH',
          text: content,
          sequenceNumber: globalSequence++,
          pageNumber,
        };
        pageBlocks.push(block);
        pageRawTextParts.push(content);
      } else if (tag === 'ul' || tag === 'ol') {
        const block: ExtractedBlock = {
          type: 'LIST',
          text: content,
          sequenceNumber: globalSequence++,
          pageNumber,
        };
        pageBlocks.push(block);
        pageRawTextParts.push(content);
      } else if (tag === 'table') {
        const block: ExtractedBlock = {
          type: 'TABLE',
          text: content,
          sequenceNumber: globalSequence++,
          pageNumber,
        };
        pageBlocks.push(block);
        pageRawTextParts.push(content);
      }
    }

    if (pageBlocks.length > 0 || pages.length === 0) {
      pages.push({
        pageNumber,
        rawText: pageRawTextParts.join('\n'),
        blocks: pageBlocks,
      });
    }

    return {
      metadata: {
        title: originalFilename,
        pageCount: pages.length,
        fileSizeBytes: fileBuffer.length,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      pages,
      warnings,
    };
  }
}
