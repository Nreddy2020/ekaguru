export type ExtractedBlockType =
  | 'PARAGRAPH'
  | 'HEADING'
  | 'TABLE'
  | 'LIST'
  | 'IMAGE'
  | 'CAPTION'
  | 'EQUATION'
  | 'DIAGRAM'
  | 'HEADER'
  | 'FOOTER';

export type PageClassification = 'TEXT_NATIVE' | 'MIXED' | 'SCANNED';

export type DocumentType =
  | 'TEXTBOOK'
  | 'WORKBOOK'
  | 'REFERENCE_BOOK'
  | 'STUDY_GUIDE'
  | 'LAB_MANUAL'
  | 'NOTES'
  | 'ARTICLE'
  | 'PAPER'
  | 'ASSIGNMENT'
  | 'SCANNED_DOCUMENT'
  | 'MIXED_DOCUMENT';

export interface ExtractedBlock {
  id?: string;
  type: ExtractedBlockType;
  text: string;
  sequenceNumber: number;
  pageNumber: number;
  headingLevel?: number; // 1 = Chapter, 2 = Topic, 3 = Subtopic
  boundingBox?: [number, number, number, number]; // [x_min, y_min, x_max, y_max]
  fontFamily?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  confidence?: number;
  structuredData?: {
    tableJson?: any;
    latexEquation?: string;
    diagramCaption?: string;
    imageStorageKey?: string;
  };
}

export interface ExtractedPage {
  pageNumber: number;
  rawText: string;
  classification?: PageClassification;
  textDensity?: number;
  wordCount?: number;
  blocks: ExtractedBlock[];
  ocrMetadata?: {
    ocrUsed: boolean;
    ocrConfidence?: number;
    ocrEngine?: string;
    ocrLanguage?: string;
    ocrBoundingBox?: number[];
  };
}

export interface ExtractedDocument {
  metadata: {
    title?: string;
    author?: string;
    pageCount: number;
    fileSizeBytes: number;
    documentType?: DocumentType;
    checksum?: string;
    mimeType: string;
    forensicsMetrics?: {
      totalWords: number;
      totalBlocks: number;
      scannedPageCount: number;
      nativePageCount: number;
      mixedPageCount: number;
    };
  };
  pages: ExtractedPage[];
  warnings: string[];
}

export interface DocumentExtractorInterface {
  supports(mimeType: string, extension: string): boolean;
  extract(filePath: string, originalFilename: string): Promise<ExtractedDocument>;
}
