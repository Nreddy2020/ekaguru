import { Test, TestingModule } from '@nestjs/testing';
import { SemanticBoundaryService } from './semantic-boundary.service';
import { EmbeddingService } from '../knowledge/alignment/embedding.service';
import { ExtractedBlock } from './document-extractor.interface';

describe('SemanticBoundaryService - M2.3 Multi-Signal Boundary Tests', () => {
  let service: SemanticBoundaryService;
  let mockEmbeddingService: Partial<EmbeddingService>;

  beforeEach(async () => {
    mockEmbeddingService = {
      calculateCosineSimilarity: jest.fn((vecA: number[], vecB: number[]) => 0.85),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemanticBoundaryService,
        { provide: EmbeddingService, useValue: mockEmbeddingService },
      ],
    }).compile();

    service = module.get<SemanticBoundaryService>(SemanticBoundaryService);
  });

  it('should detect a STRONG_BOUNDARY when heading evidence and high semantic shift co-occur', () => {
    const prevBlock: ExtractedBlock = {
      id: 'b1',
      type: 'PARAGRAPH',
      text: 'Plants generate oxygen through the light reactions of photosynthesis.',
      sequenceNumber: 1,
      pageNumber: 1,
      boundingBox: [36, 100, 576, 140],
    };

    const currBlock: ExtractedBlock = {
      id: 'b2',
      type: 'HEADING',
      text: 'Chapter 2: Animal Respiration',
      sequenceNumber: 2,
      pageNumber: 2,
      boundingBox: [36, 50, 576, 80],
      fontSize: 22,
      isBold: true,
    };

    (mockEmbeddingService.calculateCosineSimilarity as jest.Mock).mockReturnValue(0.15); // Large semantic shift

    const result = service.evaluateBoundary(prevBlock, currBlock, [0.1, 0.2], [0.9, 0.8]);

    expect(result.isBoundary).toBe(true);
    expect(result.decision).toBe('STRONG_BOUNDARY');
    expect(result.boundaryScore).toBeGreaterThanOrEqual(0.60);
    expect(result.signals.headingEvidence).toBe(1.0);
    expect(result.signals.layoutBoundary).toBe(0.8);
  });

  it('should recommend CONTINUE_SEGMENT for contiguous paragraphs with high semantic similarity and no headings', () => {
    const prevBlock: ExtractedBlock = {
      id: 'b1',
      type: 'PARAGRAPH',
      text: 'Chlorophyll pigments absorb blue and red light spectrums effectively.',
      sequenceNumber: 1,
      pageNumber: 1,
      boundingBox: [36, 100, 576, 140],
    };

    const currBlock: ExtractedBlock = {
      id: 'b2',
      type: 'PARAGRAPH',
      text: 'These pigments are situated in the thylakoid membrane structures of the chloroplast.',
      sequenceNumber: 2,
      pageNumber: 1,
      boundingBox: [36, 150, 576, 190],
    };

    (mockEmbeddingService.calculateCosineSimilarity as jest.Mock).mockReturnValue(0.92); // High similarity

    const result = service.evaluateBoundary(prevBlock, currBlock, [0.8, 0.8], [0.85, 0.82]);

    expect(result.isBoundary).toBe(false);
    expect(result.decision).toBe('CONTINUE_SEGMENT');
    expect(result.boundaryScore).toBeLessThan(0.40);
  });
});
