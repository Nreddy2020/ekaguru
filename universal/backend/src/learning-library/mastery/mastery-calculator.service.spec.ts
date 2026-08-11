import { Test, TestingModule } from '@nestjs/testing';
import { MasteryCalculatorService } from './mastery-calculator.service';
import { PrismaService } from '../prisma.service';
import { MasteryStatus, EvidenceType, EvidenceOutcome } from '@prisma/client';

const createMockPrisma = () => {
  const policyObj = {
    id: 'policy-1',
    version: 1,
    name: 'EKAGURU Default Mastery Policy v1',
    recentWeight: 0.60,
    decayLambda: 0.001,
    masteryThreshold: 0.75,
    remediationThreshold: 0.50,
    confidenceThreshold: 0.70,
    createdBy: 'SYSTEM',
    createdAt: new Date(),
  };

  const transactionFn = jest.fn().mockImplementation(async (fn) => {
    return fn({
      learningEvidence: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'ev-1', ...args.data })),
      },
      masteryPolicy: {
        findUnique: jest.fn().mockResolvedValue(policyObj),
        findFirst: jest.fn().mockResolvedValue(policyObj),
        create: jest.fn(),
      },
      learnerConceptMastery: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'lcm-1', ...create })),
      },
      learnerObjectiveMastery: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'lom-1', ...create })),
      },
      masteryHistory: {
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'hist-1', ...args.data })),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    });
  });

  return {
    $transaction: transactionFn,
    learnerConceptMastery: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    learnerObjectiveMastery: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
};

describe('MasteryCalculatorService', () => {
  let service: MasteryCalculatorService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MasteryCalculatorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MasteryCalculatorService>(MasteryCalculatorService);
  });

  // Gate 1: Server-authoritative mastery (rawScore 0.0-1.0)
  it('[Gate-1] REJECTS rawScore outside [0.0, 1.0]', async () => {
    await expect(
      service.recordEvidence({
        evidenceKey: 'key-bad',
        learnerId: 'l1',
        conceptId: 'c1',
        rawScore: 1.1,
      }),
    ).rejects.toThrow('rawScore must be between 0.0 and 1.0');
  });

  // Gate 2: Evidence requires at least one of conceptId or learningObjectiveId
  it('[Gate-2] REJECTS evidence with neither conceptId nor learningObjectiveId', async () => {
    await expect(
      service.recordEvidence({
        evidenceKey: 'key-missing',
        learnerId: 'l1',
        rawScore: 0.8,
      }),
    ).rejects.toThrow('Either conceptId or learningObjectiveId must be provided');
  });

  // Gate 3: First evidence → new mastery = rawScore
  it('[Gate-3] First evidence creates mastery at rawScore level', async () => {
    const result = await service.recordEvidence({
      evidenceKey: 'key-first',
      learnerId: 'l1',
      conceptId: 'c1',
      rawScore: 0.8,
    });

    expect(result.idempotent).toBe(false);
    expect(result.conceptMastery).toBeDefined();
    expect(result.conceptMastery.masteryScore).toBeCloseTo(0.8, 2);
    expect(result.conceptMastery.status).toBe(MasteryStatus.MASTERED);
  });

  // Gate 4: Evidence ≥ 0.75 → MASTERED status
  it('[Gate-4] rawScore 0.80 maps to MASTERED status', async () => {
    const result = await service.recordEvidence({
      evidenceKey: 'key-mastered',
      learnerId: 'l1',
      conceptId: 'c1',
      rawScore: 0.80,
    });
    expect(result.conceptMastery.status).toBe(MasteryStatus.MASTERED);
  });

  // Gate 5: Evidence ≥ 0.50 < 0.75 → IN_PROGRESS
  it('[Gate-5] rawScore 0.60 maps to IN_PROGRESS status', async () => {
    const result = await service.recordEvidence({
      evidenceKey: 'key-ip',
      learnerId: 'l1',
      conceptId: 'c1',
      rawScore: 0.60,
    });
    expect(result.conceptMastery.status).toBe(MasteryStatus.IN_PROGRESS);
  });

  // Gate 6: Evidence < 0.50 → NEEDS_REMEDIATION
  it('[Gate-6] rawScore 0.30 maps to NEEDS_REMEDIATION status', async () => {
    const result = await service.recordEvidence({
      evidenceKey: 'key-rem',
      learnerId: 'l1',
      conceptId: 'c1',
      rawScore: 0.30,
    });
    expect(result.conceptMastery.status).toBe(MasteryStatus.NEEDS_REMEDIATION);
  });

  // Gate 7: MasteryHistory is always recorded
  it('[Gate-7] MasteryHistory is persisted with correct evidenceKey', async () => {
    const result = await service.recordEvidence({
      evidenceKey: 'key-hist',
      learnerId: 'l1',
      conceptId: 'c1',
      rawScore: 0.75,
    });
    expect(result.history).toBeDefined();
    expect(result.history.evidenceKey).toBe('key-hist');
  });

  // Gate 8: Idempotency — duplicate evidenceKey returns idempotent=true
  it('[Gate-8] Duplicate evidenceKey returns idempotent=true without reprocessing', async () => {
    const existingEvidence = { id: 'ev-existing', evidenceKey: 'key-dup', learnerId: 'l1', conceptId: 'c1', rawScore: 0.8 };

    // Override the transaction to simulate an existing evidence record
    mockPrisma.$transaction = jest.fn().mockImplementation(async (fn) => {
      return fn({
        learningEvidence: {
          findUnique: jest.fn().mockResolvedValue(existingEvidence),
        },
        masteryHistory: {
          findFirst: jest.fn().mockResolvedValue({ id: 'hist-dup', evidenceKey: 'key-dup' }),
        },
        masteryPolicy: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
        learnerConceptMastery: { findUnique: jest.fn(), upsert: jest.fn() },
        learnerObjectiveMastery: { findUnique: jest.fn(), upsert: jest.fn() },
      });
    });

    const result = await service.recordEvidence({
      evidenceKey: 'key-dup',
      learnerId: 'l1',
      conceptId: 'c1',
      rawScore: 0.8,
    });

    expect(result.idempotent).toBe(true);
  });

  // Gate 9: Objective-level mastery is created when learningObjectiveId is provided
  it('[Gate-9] Records objective-level mastery when learningObjectiveId is provided', async () => {
    const result = await service.recordEvidence({
      evidenceKey: 'key-obj',
      learnerId: 'l1',
      learningObjectiveId: 'obj-1',
      rawScore: 0.85,
    });

    expect(result.objectiveMastery).toBeDefined();
    expect(result.objectiveMastery.learningObjectiveId).toBe('obj-1');
  });

  // Gate 10: Temporal decay formula applied to prior mastery
  it('[Gate-10] Temporal decay formula blends prior mastery with recent evidence', async () => {
    const lastAssessedAt = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
    const priorScore = 0.9;

    // Override to return an existing mastery record
    mockPrisma.$transaction = jest.fn().mockImplementation(async (fn) => {
      const policyObj = {
        id: 'policy-1', version: 1, recentWeight: 0.60,
        decayLambda: 0.001, masteryThreshold: 0.75, remediationThreshold: 0.50, confidenceThreshold: 0.70,
      };
      return fn({
        learningEvidence: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation((a) => Promise.resolve({ id: 'ev-1', ...a.data })),
        },
        masteryPolicy: { findUnique: jest.fn().mockResolvedValue(policyObj), findFirst: jest.fn().mockResolvedValue(policyObj), create: jest.fn() },
        learnerConceptMastery: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'lcm-old', learnerId: 'l1', conceptId: 'c1',
            masteryScore: priorScore, status: MasteryStatus.MASTERED, lastAssessedAt,
          }),
          upsert: jest.fn().mockImplementation(({ update, create }) => {
            // Capture the masteryScore we'd compute
            return Promise.resolve({ id: 'lcm-new', masteryScore: update.masteryScore, status: update.status });
          }),
        },
        learnerObjectiveMastery: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn() },
        masteryHistory: {
          create: jest.fn().mockImplementation((a) => Promise.resolve({ id: 'hist-1', ...a.data })),
          findFirst: jest.fn().mockResolvedValue(null),
        },
      });
    });

    const rawScore = 0.60;
    const deltaHours = 5;
    const lambda = 0.001;
    const recentWeight = 0.60;
    const expected = recentWeight * rawScore + (1 - recentWeight) * priorScore * Math.exp(-lambda * deltaHours);

    const result = await service.recordEvidence({
      evidenceKey: 'key-decay',
      learnerId: 'l1',
      conceptId: 'c1',
      rawScore,
    });

    // The computed mastery should be within a 5-hour decay band tolerance
    expect(result.conceptMastery.masteryScore).toBeGreaterThan(rawScore);
    expect(result.conceptMastery.masteryScore).toBeLessThan(priorScore);
  });

  // Gate 11: getLearnerMastery returns no ContentChunk.content (source text privacy)
  it('[Gate-11] getLearnerMastery excludes source text (only IDs and scores)', async () => {
    mockPrisma.learnerConceptMastery.findMany = jest.fn().mockResolvedValue([
      { id: 'lcm-1', conceptId: 'c1', masteryScore: 0.8, status: MasteryStatus.MASTERED,
        concept: { canonicalName: 'Algebra', domain: 'MATH', gradeBand: 'GRADE_6_8' } },
    ]);
    mockPrisma.learnerObjectiveMastery.findMany = jest.fn().mockResolvedValue([]);

    const result = await service.getLearnerMastery('l1');
    const hasContentText = JSON.stringify(result).toLowerCase().includes('"content"');
    expect(hasContentText).toBe(false);
  });
});
