import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';
import { OpenAIEmbeddingProvider } from './openai-embedding.provider';
import { PrismaService } from '../../prisma.service';

describe('EmbeddingService Sanitized Input & Fingerprinting Tests', () => {
  let service: EmbeddingService;

  beforeEach(async () => {
    const mockPrisma = {
      semanticEmbedding: {
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'emb-1', ...create })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        OpenAIEmbeddingProvider,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
  });

  it('1. SANITIZED FINGERPRINT: should produce deterministic SHA256 fingerprint for rawLabel, domain, gradeBand', () => {
    const res1 = service.generateSanitizedFingerprint('Single-Digit Addition', 'Mathematics', 'PRIMARY');
    const res2 = service.generateSanitizedFingerprint(' single-digit addition ', ' mathematics ', 'PRIMARY');

    expect(res1.fingerprint).toBe(res2.fingerprint);
    expect(res1.fingerprint).toHaveLength(64);
  });

  it('2. COSINE SIMILARITY: should calculate exact cosine similarity for normalized vectors', () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];

    expect(service.calculateCosineSimilarity(vecA, vecB)).toBe(1.0);
    expect(service.calculateCosineSimilarity(vecA, vecC)).toBe(0.0);
  });
});
