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
export type PageTruthStatus = 'VERIFIED' | 'NEEDS_REVIEW' | 'FAILED';
export type VisualClarity = 'CLEAR' | 'ACCEPTABLE' | 'LOW_QUALITY' | 'UNREADABLE';

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

export interface VisualImageObject {
  id: string;
  boundingBox: [number, number, number, number];
  width: number;
  height: number;
  effectiveDpi?: number;
  sharpness: number;
  clarity: VisualClarity;
  caption?: string;
  imageStorageKey?: string;
}

export interface TableObject {
  id: string;
  boundingBox: [number, number, number, number];
  headers: string[];
  rows: string[][];
  cellCount: number;
  caption?: string;
}

export interface DiagramObject {
  id: string;
  title?: string;
  boundingBox: [number, number, number, number];
  labels: string[];
  caption?: string;
}

export interface EquationObject {
  id: string;
  boundingBox: [number, number, number, number];
  latexOrText: string;
  inline: boolean;
}

export interface PageQualityScore {
  compositeScore: number; // 0.0 - 1.0
  ocrTextConfidence: number;
  characterIntegrity: number;
  wordIntegrity: number;
  layoutConsistency: number;
  pageNumberConfidence: number;
  visualQuality: number;
  readingOrderConfidence: number;
}

export interface PageTruthRecord {
  documentId: string;
  physicalPageIndex: number; // 1-based physical page in PDF
  printedPageNumber?: number; // Detected textbook printed page
  printedPageNumberConfidence?: number;
  printedPageNumberBBox?: [number, number, number, number];

  pageWidth: number;
  pageHeight: number;

  textExtractionMode: 'NATIVE' | 'OCR' | 'HYBRID';
  ocrUsed: boolean;
  ocrEngine?: string;
  ocrConfidence?: number;

  characterCount: number;
  wordCount: number;
  lineCount: number;

  visualObjects: {
    images: VisualImageObject[];
    tables: TableObject[];
    diagrams: DiagramObject[];
    equations: EquationObject[];
  };

  qualityScore: PageQualityScore;
  corruptionFlags: string[]; // e.g. 'EXCESSIVE_GARBAGE', 'FRAGMENTED_WORDS'

  status: PageTruthStatus;
}

export interface ExtractedBlock {
  id?: string;
  type: ExtractedBlockType;
  text: string;
  sequenceNumber: number;
  pageNumber: number;
  headingLevel?: number; // 1 = Chapter, 2 = Topic, 3 = Subtopic
  boundingBox?: [number, number, number, number]; // [x_min, y_min, x_max, y_max] in 72 DPI pt
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
  physicalPageIndex?: number;
  rawText: string;
  classification?: PageClassification;
  textDensity?: number;
  wordCount?: number;
  blocks: ExtractedBlock[];
  pageTruth?: PageTruthRecord;
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
      verifiedPages: number;
      degradedPages: number;
      averagePageQuality: number;
    };
  };
  pages: ExtractedPage[];
  warnings: string[];
}

export interface DocumentExtractorInterface {
  supports(mimeType: string, extension: string): boolean;
  extract(filePath: string, originalFilename: string, documentId?: string): Promise<ExtractedDocument>;
}

