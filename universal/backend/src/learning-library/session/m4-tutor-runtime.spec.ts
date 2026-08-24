import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { MasteryCalculatorService } from '../mastery/mastery-calculator.service';
import { MisconceptionClassifierService } from '../mastery/misconception-classifier.service';
import { PedagogicalContextAssemblerService } from './pedagogical-context-assembler.service';
import { ConversationalStateMachineService } from './conversational-state-machine.service';
import { QuestionGeneratorService } from './question-generator.service';
import { ResponseEvaluatorService } from './response-evaluator.service';
import { TutorSafetyGateService } from './tutor-safety-gate.service';
import { TutorOrchestratorService } from './tutor-orchestrator.service';
import { BadRequestException } from '@nestjs/common';
import { MasteryStatus } from '@prisma/client';

import { OutboxService } from './outbox.service';
import { FrontierCalculatorService } from '../mastery/frontier-calculator.service';

describe('Milestone M4 — Runtime Conversational Tutoring & Closed-Loop Engine', () => {
  let contextAssembler: PedagogicalContextAssemblerService;
  let stateMachine: ConversationalStateMachineService;
  let questionGenerator: QuestionGeneratorService;
  let responseEvaluator: ResponseEvaluatorService;
  let safetyGate: TutorSafetyGateService;
  let orchestrator: TutorOrchestratorService;
  let masteryCalculator: MasteryCalculatorService;
  let misconceptionClassifier: MisconceptionClassifierService;

  const mockPrisma: any = {
    learningSession: { findUnique: jest.fn() },
    concept: { findUnique: jest.fn() },
    contentChunk: { findFirst: jest.fn() },
    learnerConceptMastery: { findUnique: jest.fn(), findMany: jest.fn(), upsert: jest.fn() },
    learningEvidence: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    masteryPolicy: { findFirst: jest.fn() },
    masteryHistory: { create: jest.fn() },
    sessionStep: { update: jest.fn() },
    assessmentInstance: { update: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedagogicalContextAssemblerService,
        ConversationalStateMachineService,
        QuestionGeneratorService,
        ResponseEvaluatorService,
        TutorSafetyGateService,
        TutorOrchestratorService,
        MasteryCalculatorService,
        MisconceptionClassifierService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OutboxService, useValue: { createEvent: jest.fn() } },
        { provide: FrontierCalculatorService, useValue: {} },
      ],
    }).compile();

    contextAssembler = module.get<PedagogicalContextAssemblerService>(PedagogicalContextAssemblerService);
    stateMachine = module.get<ConversationalStateMachineService>(ConversationalStateMachineService);
    questionGenerator = module.get<QuestionGeneratorService>(QuestionGeneratorService);
    responseEvaluator = module.get<ResponseEvaluatorService>(ResponseEvaluatorService);
    safetyGate = module.get<TutorSafetyGateService>(TutorSafetyGateService);
    orchestrator = module.get<TutorOrchestratorService>(TutorOrchestratorService);
    masteryCalculator = module.get<MasteryCalculatorService>(MasteryCalculatorService);
    misconceptionClassifier = module.get<MisconceptionClassifierService>(MisconceptionClassifierService);
  });

  // ── GATE 1: TRUTH GATE ───────────────────────────────────────────────────
  describe('Gate 1: Truth Gate (Context Assembly)', () => {
    it('should assemble bounded context from verified M2 chunks and M3 learner state', async () => {
      mockPrisma.learningSession.findUnique.mockResolvedValue({ id: 'sess-1', learnerId: 'learner-1' });
      mockPrisma.concept.findUnique.mockResolvedValue({
        id: 'concept-frac',
        canonicalName: 'Fraction Addition',
        definition: 'Adding fractions with common denominators',
        outgoing: [],
        incoming: [],
        sourceChunks: [
          {
            chunk: {
              id: 'chunk-101',
              content: 'To add fractions with like denominators, add the numerators.',
              pageStart: 42,
            },
          },
        ],
      });
      mockPrisma.learnerConceptMastery.findUnique.mockResolvedValue({
        masteryScore: 0.45,
        confidence: 0.60,
      });
      mockPrisma.learnerConceptMastery.findMany.mockResolvedValue([]);
      mockPrisma.learningEvidence.findMany.mockResolvedValue([]);

      const context = await contextAssembler.assembleContext('sess-1', 'concept-frac');

      expect(context.canonicalName).toBe('Fraction Addition');
      expect(context.sourceChunkId).toBe('chunk-101');
      expect(context.pageIndex).toBe(42);
      expect(context.pKnowledge).toBe(0.45);
    });

    it('should throw BadRequestException if concept has zero M2 source grounding', async () => {
      mockPrisma.learningSession.findUnique.mockResolvedValue({ id: 'sess-1', learnerId: 'learner-1' });
      mockPrisma.concept.findUnique.mockResolvedValue({
        id: 'concept-unanchored',
        canonicalName: 'Unanchored Topic',
        definition: null, // No definition and no chunk
        outgoing: [],
        incoming: [],
        sourceChunks: [],
      });

      await expect(contextAssembler.assembleContext('sess-1', 'concept-unanchored')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── GATE 2: QUESTION GATE ─────────────────────────────────────────────────
  describe('Gate 2: Question Gate (Validation Gate)', () => {
    it('should generate and validate a Bloom Level 2 question with valid distractors', () => {
      const context = {
        learnerId: 'l1',
        conceptId: 'c1',
        canonicalName: 'Fractions Addition',
        sourceSnippet: 'To add fractions with unlike denominators, find the least common denominator.',
        sourceChunkId: 'chunk-1',
        pageIndex: 1,
        pKnowledge: 0.40,
        pRetrieval: 1.0,
        confidence: 0.5,
        activeMisconceptions: [],
        unmasteredPrerequisites: [],
        recentTurns: [],
      };

      const q = questionGenerator.generateAndValidateQuestion(context, 2);
      expect(q).toBeDefined();
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.options.filter((o) => o.isCorrect).length).toBe(1);
      expect(q.options.filter((o) => !o.isCorrect).every((o) => o.misconceptionType)).toBe(true);
    });

    it('should veto question generation if prerequisites are unmastered for Bloom > 2', () => {
      const context = {
        learnerId: 'l1',
        conceptId: 'c1',
        canonicalName: 'Complex Calculus',
        sourceSnippet: 'Integrate the function...',
        sourceChunkId: 'chunk-1',
        pageIndex: 1,
        pKnowledge: 0.10,
        pRetrieval: 1.0,
        confidence: 0.5,
        activeMisconceptions: [],
        unmasteredPrerequisites: ['prereq-algebra'], // Prerequisite unmastered!
        recentTurns: [],
      };

      expect(() => questionGenerator.generateAndValidateQuestion(context, 3)).toThrow(BadRequestException);
    });
  });

  // ── GATE 3: RESPONSE SAFETY & GROUNDING GATE ──────────────────────────────
  describe('Gate 3: Response Safety & Grounding Gate', () => {
    it('should veto tutor turns that leak assessment answers during INDEPENDENT_CHECK', () => {
      const turn: any = {
        sessionId: 'sess-1',
        phase: 'INDEPENDENT_CHECK',
        tutorResponseText: 'The answer is clearly 5/6 (Find common denominator 6), so pick that.',
        sourceAnchors: [{ chunkId: 'c1', pageIndex: 1, snippet: 'text' }],
        evaluationPolicy: {
          expectedAnswer: '5/6 (Find common denominator 6)',
        },
      };
      const context: any = { sourceSnippet: 'text' };

      expect(() => safetyGate.validateTutorTurn(turn, context)).toThrow(BadRequestException);
    });

    it('should veto tutor turns with 0 verified M2 source anchors', () => {
      const turn: any = {
        sessionId: 'sess-1',
        phase: 'INSTRUCTION',
        tutorResponseText: 'Let us discuss fractions today.',
        sourceAnchors: [], // 0 source anchors!
        evaluationPolicy: {},
      };
      const context: any = { sourceSnippet: 'text' };

      expect(() => safetyGate.validateTutorTurn(turn, context)).toThrow(BadRequestException);
    });
  });

  // ── GATE 4: EVIDENCE GATE & DETERMINISM ────────────────────────────────────
  describe('Gate 4: Evidence Gate & Determinism', () => {
    it('should compute identical evidenceId for identical (sessionId, stepId, turnIndex, response)', () => {
      const id1 = orchestrator.computeDeterministicEvidenceId('sess-1', 'step-1', 1, '5/6');
      const id2 = orchestrator.computeDeterministicEvidenceId('sess-1', 'step-1', 1, '5/6');
      expect(id1).toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBe(64); // SHA-256 hex string
    });

    it('should compute different evidenceIds for different responses', () => {
      const id1 = orchestrator.computeDeterministicEvidenceId('sess-1', 'step-1', 1, '5/6');
      const id2 = orchestrator.computeDeterministicEvidenceId('sess-1', 'step-1', 1, '2/5');
      expect(id1).not.toBe(id2);
    });
  });

  // ── CLOSED-LOOP CONVERSATIONAL RUNTIME ─────────────────────────────────────
  describe('Closed-Loop Conversational Tutoring Journey', () => {
    it('should execute end-to-end tutor start and response cycle with verified evidence submission', async () => {
      mockPrisma.learningSession.findUnique.mockResolvedValue({
        id: 'sess-100',
        learnerId: 'learner-maya',
        targets: [
          {
            sequenceIndex: 1,
            curriculumNode: { concept: { id: 'concept-frac', canonicalName: 'Fractions Addition', description: 'Fraction adding' } },
            steps: [{ id: 'step-1', status: 'PENDING', sequenceIndex: 1, assessmentInstances: [{ id: 'inst-1' }] }],
          },
        ],
      });

      mockPrisma.concept.findUnique.mockResolvedValue({
        id: 'concept-frac',
        canonicalName: 'Fractions Addition',
        definition: 'To add fractions with unlike denominators, find the least common denominator.',
        outgoing: [],
        incoming: [],
        sourceChunks: [
          {
            chunk: {
              id: 'chunk-101',
              content: 'To add fractions with unlike denominators, find the least common denominator.',
              pageStart: 42,
            },
          },
        ],
      });
      mockPrisma.learnerConceptMastery.findUnique.mockResolvedValue(null);
      mockPrisma.learningEvidence.findMany.mockResolvedValue([]);
      mockPrisma.masteryPolicy.findFirst.mockResolvedValue({ version: 1, masteryThreshold: 0.75 });
      mockPrisma.learningEvidence.create.mockResolvedValue({ id: 'ev-1' });
      mockPrisma.learnerConceptMastery.upsert.mockResolvedValue({
        learnerId: 'learner-maya',
        conceptId: 'concept-frac',
        masteryScore: 0.87,
        status: MasteryStatus.MASTERED,
      });
      mockPrisma.masteryHistory.create.mockResolvedValue({ id: 'hist-1' });
      mockPrisma.sessionStep.update.mockResolvedValue({});
      mockPrisma.assessmentInstance.update.mockResolvedValue({});

      // 1. Start Session -> Tutor Turn
      const turn = await orchestrator.startSession('sess-100');
      expect(turn).toBeDefined();
      expect(turn.phase).toBe('ORIENTATION');
      expect(turn.sourceAnchors.length).toBeGreaterThan(0);

      // 2. Submit Correct Learner Response -> Evaluator + M3 Ledger Write
      const responseRes = await orchestrator.respond('sess-100', '5/6 (Find common denominator 6)', 1);
      expect(responseRes).toBeDefined();
      expect(responseRes.evaluation.passed).toBe(true);
      expect(responseRes.evaluation.outcome).toBe('CORRECT');
      expect(responseRes.evidenceKey).toBeDefined();
      expect(responseRes.masteryUpdate.status).toBe(MasteryStatus.MASTERED);
    });
  });
});
