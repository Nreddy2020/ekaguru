import { Test, TestingModule } from '@nestjs/testing';
import { MultiFactorPolicyService } from './multi-factor-policy.service';
import { PrismaService } from '../../prisma.service';
import { GradeBand, AlignmentDecisionType } from '@prisma/client';

describe('MultiFactorPolicyService GradeBand Protection Tests', () => {
  let service: MultiFactorPolicyService;

  beforeEach(async () => {
    const mockPolicy = {
      version: 1,
      cosineWeight: 0.40,
      gradeWeight: 0.25,
      domainWeight: 0.15,
      taxonomyWeight: 0.10,
      curatorWeight: 0.10,
      autoLinkThreshold: 0.88,
      reviewThreshold: 0.70,
    };

    const mockPrisma = {
      alignmentPolicy: {
        findFirst: jest.fn().mockResolvedValue(mockPolicy),
      },
      curatorRule: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiFactorPolicyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MultiFactorPolicyService>(MultiFactorPolicyService);
  });

  it('1. AUTO_LINK: should classify as AUTO_LINK when composite score >= 0.88 and GradeBands match exactly', async () => {
    const res = await service.evaluateAlignment({
      candidateId: 'cand-1',
      candidateLabel: 'Single-Digit Addition',
      candidateDomain: 'Mathematics',
      candidateGradeBand: GradeBand.PRIMARY,
      targetConceptId: 'c-1',
      targetCanonicalName: 'Single-Digit Addition',
      targetDomain: 'Mathematics',
      targetGradeBand: GradeBand.PRIMARY,
      cosineSimilarity: 0.95,
    });

    expect(res.decision).toBe(AlignmentDecisionType.AUTO_LINK);
    expect(res.gradeBandScore).toBe(1.0);
  });

  it('2. GRADEBAND SAFETY BLOCK: should NEVER AUTO_LINK when GradeBands are incompatible (e.g. PRIMARY vs MIDDLE_SCHOOL)', async () => {
    const res = await service.evaluateAlignment({
      candidateId: 'cand-2',
      candidateLabel: 'Fractions',
      candidateDomain: 'Mathematics',
      candidateGradeBand: GradeBand.PRIMARY,
      targetConceptId: 'c-2',
      targetCanonicalName: 'Fractions',
      targetDomain: 'Mathematics',
      targetGradeBand: GradeBand.MIDDLE_SCHOOL,
      cosineSimilarity: 0.99, // High cosine similarity alone must NOT trigger AUTO_LINK
    });

    expect(res.decision).not.toBe(AlignmentDecisionType.AUTO_LINK);
    expect(res.decision).toBe(AlignmentDecisionType.REVIEW_REQUIRED);
    expect(res.gradeBandScore).toBe(0.3); // Adjacent GradeBand
  });
});
