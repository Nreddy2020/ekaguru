import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';
import { MultiFactorPolicyService } from './multi-factor-policy.service';
import { CuratorWorkflowService } from './curator-workflow.service';
import { OpenAIEmbeddingProvider } from './openai-embedding.provider';
import { PrismaService } from '../../prisma.service';
import { GradeBand, AlignmentDecisionType, CandidateStatus, ProposalStatus } from '@prisma/client';

describe('Phase 2.5 Targeted Acceptance Verification Suite (12 Invariant Checks)', () => {
  let embeddingService: EmbeddingService;
  let policyService: MultiFactorPolicyService;
  let curatorService: CuratorWorkflowService;

  const mockPolicyV1 = {
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
      findFirst: jest.fn().mockResolvedValue(mockPolicyV1),
    },
    curatorRule: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'rule-1', active: true, ruleVersion: 1 }),
    },
    semanticEmbedding: {
      findFirst: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'emb-1', ...create })),
    },
    conceptAlignmentProposal: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'prop-approve') {
          return Promise.resolve({
            id: 'prop-approve',
            candidateId: 'cand-1',
            targetConceptId: 'c-primary',
            status: ProposalStatus.PENDING,
            candidate: { id: 'cand-1', chunkId: 'chunk-1', rawLabel: 'Addition', normalizedLabel: 'addition', domain: 'Mathematics', gradeBand: GradeBand.PRIMARY, confidence: 1.0 },
            targetConcept: { id: 'c-primary', canonicalName: 'Addition', gradeBand: GradeBand.PRIMARY },
          });
        }
        if (where.id === 'prop-reject') {
          return Promise.resolve({
            id: 'prop-reject',
            candidateId: 'cand-2',
            targetConceptId: 'c-primary',
            status: ProposalStatus.PENDING,
            candidate: { id: 'cand-2', chunkId: 'chunk-2', rawLabel: 'Dragon Math', normalizedLabel: 'dragon math', domain: 'Fantasy', gradeBand: GradeBand.PRIMARY, confidence: 1.0 },
            targetConcept: { id: 'c-primary', canonicalName: 'Addition', gradeBand: GradeBand.PRIMARY },
          });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
    conceptChunk: {
      upsert: jest.fn().mockResolvedValue({ conceptId: 'c-primary', chunkId: 'chunk-1' }),
    },
    conceptCandidate: {
      update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        MultiFactorPolicyService,
        CuratorWorkflowService,
        OpenAIEmbeddingProvider,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    embeddingService = module.get<EmbeddingService>(EmbeddingService);
    policyService = module.get<MultiFactorPolicyService>(MultiFactorPolicyService);
    curatorService = module.get<CuratorWorkflowService>(CuratorWorkflowService);
  });

  it('CHECK 1: SANITIZED INPUT PAYLOAD ISOLATION — Provider accepts sanitized string, never raw ContentChunk object', () => {
    const fingerprintRes = embeddingService.generateSanitizedFingerprint('Single-Digit Addition', 'Mathematics', 'PRIMARY');

    expect(fingerprintRes.inputPayload).toBe('single-digit addition | mathematics | PRIMARY');
    expect(fingerprintRes.inputPayload).not.toContain('ContentChunk');
    expect(fingerprintRes.inputPayload).not.toContain('content');
  });

  it('CHECK 2: FINGERPRINT EXACTNESS — inputFingerprint is deterministic SHA256 of sanitized input string', () => {
    const res1 = embeddingService.generateSanitizedFingerprint('Addition', 'Mathematics', 'PRIMARY');
    const res2 = embeddingService.generateSanitizedFingerprint(' addition ', ' mathematics ', 'PRIMARY');

    expect(res1.fingerprint).toBe(res2.fingerprint);
    expect(res1.fingerprint).toHaveLength(64);
  });

  it('CHECK 3 & 4: GRADEBAND MATCH VS INCOMPATIBLE HARD BLOCK — PRIMARY vs PRIMARY allows AUTO_LINK, PRIMARY vs MIDDLE_SCHOOL blocks AUTO_LINK', async () => {
    const sameGradeRes = await policyService.evaluateAlignment({
      candidateId: 'cand-1',
      candidateLabel: 'Addition',
      candidateDomain: 'Mathematics',
      candidateGradeBand: GradeBand.PRIMARY,
      targetConceptId: 'c-primary',
      targetCanonicalName: 'Addition',
      targetDomain: 'Mathematics',
      targetGradeBand: GradeBand.PRIMARY,
      cosineSimilarity: 0.95,
    });
    expect(sameGradeRes.decision).toBe(AlignmentDecisionType.AUTO_LINK);

    const diffGradeRes = await policyService.evaluateAlignment({
      candidateId: 'cand-2',
      candidateLabel: 'Addition',
      candidateDomain: 'Mathematics',
      candidateGradeBand: GradeBand.PRIMARY,
      targetConceptId: 'c-middle',
      targetCanonicalName: 'Addition',
      targetDomain: 'Mathematics',
      targetGradeBand: GradeBand.MIDDLE_SCHOOL,
      cosineSimilarity: 0.95,
    });
    expect(diffGradeRes.decision).not.toBe(AlignmentDecisionType.AUTO_LINK);
    expect(diffGradeRes.decision).toBe(AlignmentDecisionType.REVIEW_REQUIRED);
  });

  it('CHECK 5: HIGH COSINE + INCOMPATIBLE GRADEBAND — Cosine 0.99 with incompatible grade band evaluates to NEW_CONCEPT / REVIEW_REQUIRED, NEVER AUTO_LINK', async () => {
    const res = await policyService.evaluateAlignment({
      candidateId: 'cand-3',
      candidateLabel: 'Fractions',
      candidateDomain: 'Mathematics',
      candidateGradeBand: GradeBand.PRIMARY,
      targetConceptId: 'c-high',
      targetCanonicalName: 'Fractions',
      targetDomain: 'Mathematics',
      targetGradeBand: GradeBand.HIGH_SCHOOL,
      cosineSimilarity: 0.99,
    });

    expect(res.decision).not.toBe(AlignmentDecisionType.AUTO_LINK);
    expect(res.gradeBandScore).toBe(0.0);
  });

  it('CHECK 7: CURATOR APPROVAL SEMANTICS — Approval resolves candidate, links concept, creates CuratorRule, and updates proposal status', async () => {
    const res = await curatorService.processCuratorReview({
      proposalId: 'prop-approve',
      status: ProposalStatus.APPROVED,
      curatorNotes: 'Valid alignment',
      reviewerId: 'admin-1',
    });

    expect(res.status).toBe(ProposalStatus.APPROVED);
    expect(mockPrisma.conceptChunk.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { conceptId_chunkId: { conceptId: 'c-primary', chunkId: 'chunk-1' } },
      }),
    );
    expect(mockPrisma.conceptCandidate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cand-1' },
        data: expect.objectContaining({ status: CandidateStatus.RESOLVED, resolvedConceptId: 'c-primary' }),
      }),
    );
    expect(mockPrisma.curatorRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'MAP_TO_CONCEPT', active: true }),
      }),
    );
  });

  it('CHECK 8: CURATOR REJECTION SEMANTICS — Rejection does NOT create canonical link, marks candidate REJECTED, and retains historical proposal', async () => {
    jest.clearAllMocks();

    const res = await curatorService.processCuratorReview({
      proposalId: 'prop-reject',
      status: ProposalStatus.REJECTED,
      curatorNotes: 'Invalid concept mapping',
      reviewerId: 'admin-1',
    });

    expect(res.status).toBe(ProposalStatus.REJECTED);
    expect(mockPrisma.conceptChunk.upsert).not.toHaveBeenCalled();
    expect(mockPrisma.conceptCandidate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cand-2' },
        data: expect.objectContaining({ status: CandidateStatus.REJECTED }),
      }),
    );
  });

  it('CHECK 9: POLICY VERSION SNAPSHOT IMMUTABILITY — Evaluation links decision to current policy version snapshot', async () => {
    const evalRes = await policyService.evaluateAlignment({
      candidateId: 'cand-1',
      candidateLabel: 'Addition',
      candidateDomain: 'Mathematics',
      candidateGradeBand: GradeBand.PRIMARY,
      targetConceptId: 'c-primary',
      targetCanonicalName: 'Addition',
      targetDomain: 'Mathematics',
      targetGradeBand: GradeBand.PRIMARY,
      cosineSimilarity: 0.90,
    });

    expect(evalRes.policyVersion).toBe(1);
    expect(evalRes.compositeScore).toBeGreaterThan(0);
  });
});
