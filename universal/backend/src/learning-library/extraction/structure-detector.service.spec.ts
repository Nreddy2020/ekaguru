import { Test, TestingModule } from '@nestjs/testing';
import { StructureDetectorService } from './structure-detector.service';
import { ExtractedDocument } from './document-extractor.interface';

describe('StructureDetectorService - M2.2 Structure & Hierarchy Tests', () => {
  let service: StructureDetectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StructureDetectorService],
    }).compile();

    service = module.get<StructureDetectorService>(StructureDetectorService);
  });

  it('should decouple heading detection score from hierarchy level inference (Chapter vs Topic vs Subtopic)', () => {
    const mockDoc: ExtractedDocument = {
      metadata: { pageCount: 1, fileSizeBytes: 100, mimeType: 'text/plain' },
      warnings: [],
      pages: [
        {
          pageNumber: 1,
          rawText: 'Chapter 3: Human Biology\n3.1 Digestive System\n3.1.1 The Mouth and Teeth\nThe digestive process starts in the mouth.',
          blocks: [
            { id: 'b1', type: 'HEADING', text: 'Chapter 3: Human Biology', sequenceNumber: 1, pageNumber: 1, fontSize: 24, isBold: true },
            { id: 'b2', type: 'HEADING', text: '3.1 Digestive System', sequenceNumber: 2, pageNumber: 1, fontSize: 18, isBold: true },
            { id: 'b3', type: 'HEADING', text: '3.1.1 The Mouth and Teeth', sequenceNumber: 3, pageNumber: 1, fontSize: 14, isBold: true },
            { id: 'b4', type: 'PARAGRAPH', text: 'The digestive process starts in the mouth with mastication and salivary enzymes breaking down carbohydrates.', sequenceNumber: 4, pageNumber: 1, fontSize: 11 },
          ],
        },
      ],
    };

    const res = service.processStructure(mockDoc);

    expect(res.chapters).toHaveLength(1);
    expect(res.chapters[0].title).toBe('Chapter 3: Human Biology');
    expect(res.chapters[0].chapterNumber).toBe(3);
    expect(res.chapters[0].structureConfidence).toBe('HIGH');
    expect(res.chapters[0].missingStructure).toBe(false);

    // Topics list
    expect(res.chapters[0].topics).toHaveLength(2);
    expect(res.chapters[0].topics[0].title).toBe('3.1 Digestive System');
    expect(res.chapters[0].topics[0].level).toBe(2);
    expect(res.chapters[0].topics[1].title).toBe('3.1.1 The Mouth and Teeth');
    expect(res.chapters[0].topics[1].level).toBe(3);

    // Chunk sequence order
    expect(res.chunks.length).toBeGreaterThan(0);
    expect(res.chunks[0].sequenceNumber).toBe(1);
    expect(res.chunks[0].chapterOrderIndex).toBe(1);
  });

  it('should enforce the missingStructure invariant without fabricating artificial placeholder topics', () => {
    const mockDoc: ExtractedDocument = {
      metadata: { pageCount: 1, fileSizeBytes: 100, mimeType: 'text/plain', title: 'Science Notes' },
      warnings: [],
      pages: [
        {
          pageNumber: 1,
          rawText: 'Chapter 5: Overview of Matter\n\nMatter exists in three primary phases: solid, liquid, and gas. There are no other subsections in this chapter.',
          blocks: [
            { id: 'b1', type: 'HEADING', text: 'Chapter 5: Overview of Matter', sequenceNumber: 1, pageNumber: 1, fontSize: 24, isBold: true },
            { id: 'b2', type: 'PARAGRAPH', text: 'Matter exists in three primary phases: solid, liquid, and gas. There are no other subsections in this chapter.', sequenceNumber: 2, pageNumber: 1, fontSize: 11 },
          ],
        },
      ],
    };

    const res = service.processStructure(mockDoc);

    expect(res.chapters).toHaveLength(1);
    expect(res.chapters[0].title).toBe('Chapter 5: Overview of Matter');
    expect(res.chapters[0].topics).toHaveLength(0); // ZERO placeholder topics fabricated!
    expect(res.chapters[0].missingStructure).toBe(true);
    expect(res.chapters[0].structureConfidence).toBe('LOW');
  });

  it('should maintain deterministic ordering across chapters and chunks', () => {
    const mockDoc: ExtractedDocument = {
      metadata: { pageCount: 2, fileSizeBytes: 200, mimeType: 'text/plain' },
      warnings: [],
      pages: [
        {
          pageNumber: 1,
          rawText: 'Chapter 1: Foundations\n1.1 Scope\nContent 1',
          blocks: [
            { id: 'b1', type: 'HEADING', text: 'Chapter 1: Foundations', sequenceNumber: 1, pageNumber: 1, fontSize: 22, isBold: true },
            { id: 'b2', type: 'HEADING', text: '1.1 Scope', sequenceNumber: 2, pageNumber: 1, fontSize: 16, isBold: true },
            { id: 'b3', type: 'PARAGRAPH', text: 'Content 1 of foundations.', sequenceNumber: 3, pageNumber: 1, fontSize: 11 },
          ],
        },
        {
          pageNumber: 2,
          rawText: 'Chapter 2: Methods\n2.1 Applications\nContent 2',
          blocks: [
            { id: 'b4', type: 'HEADING', text: 'Chapter 2: Methods', sequenceNumber: 4, pageNumber: 2, fontSize: 22, isBold: true },
            { id: 'b5', type: 'HEADING', text: '2.1 Applications', sequenceNumber: 5, pageNumber: 2, fontSize: 16, isBold: true },
            { id: 'b6', type: 'PARAGRAPH', text: 'Content 2 of applications.', sequenceNumber: 6, pageNumber: 2, fontSize: 11 },
          ],
        },
      ],
    };

    const res1 = service.processStructure(mockDoc);
    const res2 = service.processStructure(mockDoc);

    expect(res1.chapters.map((c) => c.orderIndex)).toEqual([1, 2]);
    expect(res1.chapters[0].topics[0].orderIndex).toBe(1);
    expect(res1.chapters[1].topics[0].orderIndex).toBe(1);

    // Identical execution gives identical ordering
    expect(res1.chunks.map((c) => c.sequenceNumber)).toEqual(res2.chunks.map((c) => c.sequenceNumber));
    expect(res1.chapters.map((c) => c.title)).toEqual(res2.chapters.map((c) => c.title));
  });
});

