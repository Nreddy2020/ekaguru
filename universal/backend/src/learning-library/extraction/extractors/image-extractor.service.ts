import { Injectable, Logger } from '@nestjs/common';
import {
  DocumentExtractorInterface,
  ExtractedDocument,
  ExtractedPage,
} from '../document-extractor.interface';
import * as fs from 'fs';

@Injectable()
export class ImageExtractorService implements DocumentExtractorInterface {
  private readonly logger = new Logger(ImageExtractorService.name);

  supports(mimeType: string, extension: string): boolean {
    const ext = extension.toLowerCase();
    const isImageMime = mimeType.startsWith('image/');
    const isImageExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    return isImageMime || isImageExt;
  }

  async extract(filePath: string, originalFilename: string): Promise<ExtractedDocument> {
    const fileBuffer = fs.readFileSync(filePath);

    this.logger.log(`ImageExtractor processed '${originalFilename}' (${fileBuffer.length} bytes). OCR required for text.`);

    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        rawText: '',
        blocks: [],
      },
    ];

    return {
      metadata: {
        title: originalFilename,
        pageCount: 1,
        fileSizeBytes: fileBuffer.length,
        mimeType: 'image/png',
      },
      pages,
      warnings: ['OCR_REQUIRED'],
    };
  }
}
