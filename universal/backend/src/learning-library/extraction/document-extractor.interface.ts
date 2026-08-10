export type ExtractedBlockType = 'PARAGRAPH' | 'HEADING' | 'TABLE' | 'LIST' | 'IMAGE';

export interface ExtractedBlock {
  type: ExtractedBlockType;
  text: string;
  sequenceNumber: number;
  pageNumber: number;
  headingLevel?: number; // 1 = Chapter, 2 = Topic, 3 = Subtopic
}

export interface ExtractedPage {
  pageNumber: number;
  rawText: string;
  blocks: ExtractedBlock[];
}

export interface ExtractedDocument {
  metadata: {
    title?: string;
    author?: string;
    pageCount: number;
    fileSizeBytes: number;
    checksum?: string;
    mimeType: string;
  };
  pages: ExtractedPage[];
  warnings: string[];
}

export interface DocumentExtractorInterface {
  supports(mimeType: string, extension: string): boolean;
  extract(filePath: string, originalFilename: string): Promise<ExtractedDocument>;
}
