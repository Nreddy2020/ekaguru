import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DocumentExtractorInterface } from './document-extractor.interface';
import { PdfExtractorService } from './extractors/pdf-extractor.service';
import { DocxExtractorService } from './extractors/docx-extractor.service';
import { EpubExtractorService } from './extractors/epub-extractor.service';
import { TextExtractorService } from './extractors/text-extractor.service';
import { ImageExtractorService } from './extractors/image-extractor.service';
import * as path from 'path';

@Injectable()
export class ExtractorFactoryService {
  private readonly logger = new Logger(ExtractorFactoryService.name);
  private readonly extractors: DocumentExtractorInterface[];

  constructor(
    private readonly pdfExtractor: PdfExtractorService,
    private readonly docxExtractor: DocxExtractorService,
    private readonly epubExtractor: EpubExtractorService,
    private readonly textExtractor: TextExtractorService,
    private readonly imageExtractor: ImageExtractorService,
  ) {
    this.extractors = [
      this.pdfExtractor,
      this.docxExtractor,
      this.epubExtractor,
      this.textExtractor,
      this.imageExtractor,
    ];
  }

  getExtractor(mimeType: string, filename: string): DocumentExtractorInterface {
    const ext = path.extname(filename).toLowerCase();
    const cleanMime = (mimeType || '').toLowerCase();

    for (const extractor of this.extractors) {
      if (extractor.supports(cleanMime, ext)) {
        return extractor;
      }
    }

    throw new BadRequestException(
      `No supported document extractor found for file '${filename}' (MIME: ${mimeType}, Ext: ${ext}).`,
    );
  }
}
