import { Test, TestingModule } from '@nestjs/testing';
import { MasteryCalculatorService } from './mastery-calculator.service';
import { MisconceptionClassifierService } from './misconception-classifier.service';
import { RemediationService } from './remediation.service';
import { KnowledgeActivatorService } from '../knowledge/knowledge-activator.service';
import { PrismaService } from '../prisma.service';
import { OutboxService } from '../session/outbox.service';
import { FrontierCalculatorService } from './frontier-calculator.service';
import { TopologicalSortService } from '../knowledge/curriculum/topological-sort.service';
import { MasteryStatus, EvidenceType, EvidenceOutcome } from '@prisma/client';

describe('Milestone M3 — Learner Intelligence & Knowledge Activation Suite', () => {
  let masteryCalculator: MasteryCalculatorService;
  let misconceptionClassifier: MisconceptionClassifierService;
  let remediationService: RemediationService;
  let knowledgeActivator: KnowledgeActivatorService;

  const mockPrisma = {
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    learningEvidence: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    masteryPolicy: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    learnerConceptMastery: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    learnerObjectiveMastery: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    masteryHistory: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    concept: {
      findUnique: jest.fn(),
    },
    curriculumStructure: {
      findUnique: jest.fn(),
    },
  };

  const mockOutbox = {
    createEvent: jest.fn(),
  };

  const mockFrontier = {
    calculateFrontier: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MasteryCalculatorService,
        MisconceptionClassifierService,
        RemediationService,
        KnowledgeActivatorService,
        TopologicalSortService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OutboxService, useValue: mockOutbox },
        { provide: FrontierCalculatorService, useValue: mockFrontier },
      ],
    }).compile();

    masteryCalculator = module.get<MasteryCalculatorService>(MasteryCalculatorService);
    misconceptionClassifier = module.get<MisconceptionClassifierService>(MisconceptionClassifierService);
    remediationService = module.get<RemediationService>(RemediationService);
    knowledgeActivator = module.get<KnowledgeActivatorService>(KnowledgeActivatorService);
    jest.clearAllMocks();
  });

  describe('1. Tri-Model Knowledge State & BKT Calculations', () => {
    it('should independently track pKnowledge and pRetrieval without scalar collapse', () => {
      const priorState = { masteryScore: 0.20, attemptsCount: 0, lastAssessedAt: null };
      const policy = { version: 1, masteryThreshold: 0.88, remediationThreshold: 0.50, confidenceThreshold: 0.70 };

      // Observation 1: Correct response
      const state1 = masteryCalculator.calculateTriModelUpdate(
        priorState,
        true,
        EvidenceType.ANSWER,
        new Date(),
        policy,
      );

      expect(state1.pKnowledge).toBeGreaterThan(0.20);
      expect(state1.pRetrieval).toBeGreaterThan(0.90);
      expect(state1.confidence).toBeGreaterThan(0.20);

      // Observation 2: Spaced retrieval after 48 hours
      const futureDate = new Date(Date.now() + 48 * 3600 * 1000);
      const state2 = masteryCalculator.calculateTriModelUpdate(
        { masteryScore: state1.pKnowledge, attemptsCount: 1, lastAssessedAt: new Date() },
        true,
        EvidenceType.TRANSFER,
        futureDate,
        policy,
      );

      expect(state2.pKnowledge).toBeGreaterThan(state1.pKnowledge);
      expect(state2.stabilityDays).toBe(3.0); // Spaced retention bonus
    });
  });

  describe('2. Six-Point Mastery Convergence Standard', () => {
    it('should NOT grant MASTERED on a single 100% score under 6-point convergence', () => {
      const triModel = {
        pKnowledge: 0.95,
        pRetrieval: 0.99,
        confidence: 0.50,
        status: MasteryStatus.IN_PROGRESS,
        evidenceCount: 1,
        stabilityDays: 1.0,
      };
      const singleEvidence = [
        { evidenceType: EvidenceType.ASSESSMENT, outcome: EvidenceOutcome.CORRECT, misconception: null },
      ];

      const isMastered = masteryCalculator.evaluateMasteryConvergence(triModel, singleEvidence);
      expect(isMastered).toBe(false); // Single attempt cannot satisfy 6-point convergence!
    });
  });

  describe('3. Conservative Misconception Attribution', () => {
    it('should label the initial failure as UNATTRIBUTED_ERROR', async () => {
      mockPrisma.learningEvidence.findMany.mockResolvedValue([]); // Zero prior failures

      const result = await misconceptionClassifier.classifyError(
        'learner-1',
        'concept-friction',
        'Friction only occurs in solids',
        'Friction occurs in all fluid states and solids',
      );

      expect(result.taxonomyType).toBe('UNATTRIBUTED_ERROR');
      expect(result.recommendedIntervention).toBe('SOCRATIC_CLARIFICATION');
    });

    it('should detect a computational or clerical slip for minor typo/offset', async () => {
      mockPrisma.learningEvidence.findMany.mockResolvedValue([]);

      const result = await misconceptionClassifier.classifyError(
        'learner-1',
        'concept-math',
        '53', // Typo/slip for 54
        '54',
      );

      expect(result.taxonomyType).toBe('COMPUTATIONAL_SLIP');
      expect(result.recommendedIntervention).toBe('GENTLE_REPROMPT');
    });

    it('should promote to CONCEPTUAL_MISUNDERSTANDING only after repeated pattern match', async () => {
      mockPrisma.learningEvidence.findMany.mockResolvedValue([
        { response: 'mass is weight', outcome: 'INCORRECT' },
      ]);

      const result = await misconceptionClassifier.classifyError(
        'learner-1',
        'concept-gravity',
        'mass is weight',
        'mass is the amount of matter while weight is gravitational force',
      );

      expect(result.taxonomyType).toBe('CONCEPTUAL_MISUNDERSTANDING');
      expect(result.recommendedIntervention).toBe('REFUTATIONAL_COUNTER_EXAMPLE');
    });
  });

  describe('4. Deterministic Evidence Ledger Replay', () => {
    it('should deterministically reconstruct identical learner state by replaying evidence', async () => {
      const mockHistory = [
        { evidenceType: EvidenceType.ANSWER, outcome: EvidenceOutcome.CORRECT, score: 0.85, observedAt: new Date('2026-08-01T10:00:00Z') },
        { evidenceType: EvidenceType.ANSWER, outcome: EvidenceOutcome.CORRECT, score: 0.90, observedAt: new Date('2026-08-02T10:00:00Z') },
        { evidenceType: EvidenceType.TRANSFER, outcome: EvidenceOutcome.CORRECT, score: 0.95, observedAt: new Date('2026-08-03T10:00:00Z') },
        { evidenceType: EvidenceType.ASSESSMENT, outcome: EvidenceOutcome.CORRECT, score: 0.95, observedAt: new Date('2026-08-05T10:00:00Z') },
      ];

      mockPrisma.learningEvidence.findMany.mockResolvedValue(mockHistory);

      const replayedState = await masteryCalculator.replayEvidenceLedger('learner-1', 'concept-fractions');

      expect(replayedState.pKnowledge).toBeGreaterThan(0.85);
      expect(replayedState.status).toBe(MasteryStatus.MASTERED);
      expect(replayedState.evidenceCount).toBe(4);
    });
  });

  describe('5. M2 Read-Only Technical Invariant', () => {
    it('should fetch M2 Canonical Concepts without executing mutations on Concept tables', async () => {
      mockPrisma.concept.findUnique.mockResolvedValue({
        id: 'c-ohm',
        canonicalName: "Ohm's Law",
        domain: 'Physics',
        gradeBand: 'HIGH_SCHOOL',
        definition: 'V = I * R',
        outgoingRelationships: [],
        incomingRelationships: [],
        chunks: [],
      });

      const unit = await knowledgeActivator.getLearningUnit('c-ohm');

      expect(unit.canonicalName).toBe("Ohm's Law");
      expect(unit.difficultyBand).toBe('ADVANCED');
      expect(mockPrisma.concept.findUnique).toHaveBeenCalled();
    });
  });
});
