import { Test, TestingModule } from '@nestjs/testing';
import { CandidateExtractorService } from './candidate-extractor.service';
import { PrismaService } from '../prisma.service';
import { GradeBand } from '@prisma/client';

describe('CandidateExtractorService Idempotency & Hashing Tests', () => {
  let service: CandidateExtractorService;

  beforeEach(async () => {
    const mockPrisma = {
      learningMaterial: { findUnique: jest.fn() },
      conceptCandidate: { upsert: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateExtractorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CandidateExtractorService>(CandidateExtractorService);
  });

  it('1. SHA256 CANDIDATE KEY: should produce deterministic candidateKey hash for chunkId, label, domain, and gradeBand', () => {
    const key1 = service.generateCandidateKey('chunk-1', 'Single-Digit Addition', 'Mathematics', GradeBand.PRIMARY);
    const key2 = service.generateCandidateKey('chunk-1', 'single-digit addition ', ' mathematics ', GradeBand.PRIMARY);

    expect(key1).toBe(key2);
    expect(key1).toHaveLength(64); // SHA256 hex string length
  });

  it('2. GRADE BAND SEPARATION: should produce different candidateKeys for different GradeBands', () => {
    const keyPrimary = service.generateCandidateKey('chunk-1', 'Fractions', 'Mathematics', GradeBand.PRIMARY);
    const keyMiddle = service.generateCandidateKey('chunk-1', 'Fractions', 'Mathematics', GradeBand.MIDDLE_SCHOOL);

    expect(keyPrimary).not.toBe(keyMiddle);
  });
});
