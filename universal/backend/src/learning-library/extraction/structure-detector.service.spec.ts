import { Test, TestingModule } from '@nestjs/testing';
import { StructureDetectorService } from './structure-detector.service';
import { ExtractedDocument } from './document-extractor.interface';

describe('StructureDetectorService', () => {
  let service: StructureDetectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StructureDetectorService],
    }).compile();

    service = module.get<StructureDetectorService>(StructureDetectorService);
  });

  it('should detect chapter and topic hierarchy from AST blocks', () => {
    const mockDoc: ExtractedDocument = {
      metadata: { pageCount: 1, fileSizeBytes: 100, mimeType: 'text/plain' },
      warnings: [],
      pages: [
        {
          pageNumber: 1,
          rawText: 'Chapter 1: Arithmetic\n\nSection 1.1: Addition\n\nContent for addition.',
          blocks: [
            { type: 'HEADING', text: 'Chapter 1: Arithmetic', sequenceNumber: 1, pageNumber: 1, headingLevel: 1 },
            { type: 'PARAGRAPH', text: 'Introduction to arithmetic.', sequenceNumber: 2, pageNumber: 1 },
            { type: 'HEADING', text: 'Section 1.1: Addition', sequenceNumber: 3, pageNumber: 1, headingLevel: 2 },
            { type: 'PARAGRAPH', text: 'Content for addition.', sequenceNumber: 4, pageNumber: 1 },
          ],
        },
      ],
    };

    const res = service.processStructure(mockDoc);

    expect(res.chapters).toHaveLength(1);
    expect(res.chapters[0].title).toBe('Chapter 1: Arithmetic');
    expect(res.chapters[0].topics).toHaveLength(1);
    expect(res.chapters[0].topics[0].title).toBe('Section 1.1: Addition');

    expect(res.chunks.length).toBeGreaterThan(0);
    expect(res.chunks[0].sequenceNumber).toBe(1);
    expect(res.chunks[0].pageStart).toBe(1);
    expect(res.chunks[0].pageEnd).toBe(1);
  });
});
