import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeConstructorService } from './knowledge-constructor.service';
import { LlmService } from '../../ai/llm.service';
import { ExtractedPage } from './document-extractor.interface';

describe('KnowledgeConstructorService - M2.4 Knowledge & Validation Tests', () => {
  let service: KnowledgeConstructorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeConstructorService,
        { provide: LlmService, useValue: {} },
      ],
    }).compile();

    service = module.get<KnowledgeConstructorService>(KnowledgeConstructorService);
  });

  it('should preserve source language terms (e.g. Hindi) while constructing canonical English concepts', async () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        rawText: 'प्रकाश संश्लेषण is the process of synthesizing food using sunlight in green plants.',
        blocks: [
          {
            id: 'b1',
            type: 'PARAGRAPH',
            text: 'प्रकाश संश्लेषण is the process of synthesizing food using sunlight in green plants.',
            sequenceNumber: 1,
            pageNumber: 1,
          },
        ],
      },
    ];

    const result = await service.constructKnowledge('doc-1', pages, 'Biology');

    expect(result.concepts.length).toBeGreaterThan(0);
    const concept = result.concepts[0];
    expect(concept.sourceLanguage).toBe('hi');
    expect(concept.sourceTerm).toContain('प्रकाश संश्लेषण');
    expect(concept.canonicalTerm).toBe('Photosynthesis');
    expect(concept.status).toBe('ACTIVE');
    expect(concept.sourceProvenance.pageNumbers).toEqual([1]);
  });

  it('should enforce the No Evidence -> No Active Knowledge invariant', async () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        rawText: 'This page discusses basic physics laws without mentioning chemistry.',
        blocks: [
          {
            id: 'b1',
            type: 'PARAGRAPH',
            text: 'This page discusses basic physics laws without mentioning chemistry.',
            sequenceNumber: 1,
            pageNumber: 1,
          },
        ],
      },
    ];

    const result = await service.constructKnowledge('doc-2', pages, 'Physics');

    // Concepts must be grounded strictly in raw text; hallucinated concepts rejected
    expect(result.concepts.every((c) => c.status === 'ACTIVE')).toBe(true);
    for (const c of result.concepts) {
      expect(pages[0].rawText.toLowerCase()).toContain(c.sourceTerm.toLowerCase());
    }
  });

  it('should perform context-aware contradiction detection preserving provenance', async () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 2,
        rawText: 'At sea level, water boils at 100 °C under standard atmospheric pressure.',
        blocks: [
          {
            id: 'b2',
            type: 'PARAGRAPH',
            text: 'At sea level, water boils at 100 °C under standard atmospheric pressure.',
            sequenceNumber: 1,
            pageNumber: 2,
          },
        ],
      },
      {
        pageNumber: 8,
        rawText: 'At high altitude on mountain peaks, water boils at 92 °C due to lower atmospheric pressure.',
        blocks: [
          {
            id: 'b8',
            type: 'PARAGRAPH',
            text: 'At high altitude on mountain peaks, water boils at 92 °C due to lower atmospheric pressure.',
            sequenceNumber: 2,
            pageNumber: 8,
          },
        ],
      },
    ];

    const result = await service.constructKnowledge('doc-3', pages, 'Chemistry');

    expect(result.contradictions.length).toBe(1);
    const item = result.contradictions[0];
    expect(item.isContextualVariation).toBe(true);
    expect(item.status).toBe('CONTEXTUAL_VARIATION');
    expect(item.provenanceA.pageNumber).toBe(2);
    expect(item.provenanceB.pageNumber).toBe(8);
  });
});
