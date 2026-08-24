import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MasteryCalculatorService } from '../mastery/mastery-calculator.service';
import { PedagogicalContextAssemblerService } from './pedagogical-context-assembler.service';
import { ConversationalStateMachineService } from './conversational-state-machine.service';
import { QuestionGeneratorService } from './question-generator.service';
import { ResponseEvaluatorService } from './response-evaluator.service';
import { TutorSafetyGateService } from './tutor-safety-gate.service';
import { TutorTurn, TutorTurnOutcome, PedagogicalPhase, PedagogicalStrategy } from './tutor-turn.types';
import * as crypto from 'crypto';

@Injectable()
export class TutorOrchestratorService {
  private readonly logger = new Logger(TutorOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly masteryService: MasteryCalculatorService,
    private readonly contextAssembler: PedagogicalContextAssemblerService,
    private readonly stateMachine: ConversationalStateMachineService,
    private readonly questionGenerator: QuestionGeneratorService,
    private readonly responseEvaluator: ResponseEvaluatorService,
    private readonly safetyGate: TutorSafetyGateService,
  ) {}

  /**
   * Deterministic Evidence Identity:
   * Logical Identity != Time.
   * SHA256(sessionId | stepId | turnIndex | responseHash)
   */
  public computeDeterministicEvidenceId(
    sessionId: string,
    stepId: string,
    turnIndex: number,
    response: string,
  ): string {
    const responseHash = crypto.createHash('sha256').update(String(response).trim()).digest('hex');
    return crypto
      .createHash('sha256')
      .update(sessionId + "|" + stepId + "|" + turnIndex + "|" + responseHash)
      .digest('hex');
  }

  private async getActiveStepAndConcept(sessionId: string): Promise<any> {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        targets: {
          orderBy: { sequenceIndex: 'asc' },
          include: {
            curriculumNode: { include: { concept: true } },
            steps: { orderBy: { sequenceIndex: 'asc' }, include: { assessmentInstances: true } },
          },
        },
      },
    });

    if (!session) throw new NotFoundException("Session '" + sessionId + "' not found.");

    const allSteps: any[] = [];
    session.targets.forEach((target) => {
      target.steps.forEach((step) => {
        allSteps.push({ ...step, target });
      });
    });

    const activeStep = allSteps.find((s) => s.status !== 'COMPLETED' && s.status !== 'SKIPPED') || allSteps[0];
    const concept = activeStep?.target?.curriculumNode?.concept;

    return {
      session,
      activeStep,
      conceptId: concept?.id || 'default-concept',
      canonicalName: concept?.canonicalName || 'Fractions',
    };
  }

  async startSession(sessionId: string): Promise<TutorTurn> {
    const { session, activeStep, conceptId, canonicalName } = await this.getActiveStepAndConcept(sessionId);

    // Gate 1: Context Assembly & Truth Gate
    const context = await this.contextAssembler.assembleContext(sessionId, conceptId);

    // Determine initial phase and strategy
    const { nextPhase, strategy } = this.stateMachine.determineNextPhaseAndStrategy(
      'ORIENTATION',
      null,
      context,
      0,
    );

    // Gate 2: Question Generation & Validation
    const question = this.questionGenerator.generateAndValidateQuestion(context, 2);

    const turn: TutorTurn = {
      sessionId,
      turnId: "turn-" + Date.now(),
      turnIndex: 1,
      phase: nextPhase,
      conceptId,
      canonicalName,
      strategy,
      sourceAnchors: [question.sourceAnchor],
      visualReferences: context.visuals,
      language: 'en',
      scaffoldingLevel: 1,
      tutorResponseText: question.prompt,
      options: question.options.map((o) => o.text),
      expectedEvidenceType: 'ASSESSMENT',
      evaluationPolicy: {
        method: 'EXACT_MATCH',
        expectedAnswer: question.correctAnswer,
        distractorKeys: question.options.filter((o) => !o.isCorrect).map((o) => o.id),
      },
    };

    // Gate 3: Safety & Grounding Gate
    this.safetyGate.validateTutorTurn(turn, context);

    return turn;
  }

  async respond(sessionId: string, response: string, attempts: number = 1): Promise<any> {
    const { session, activeStep, conceptId, canonicalName } = await this.getActiveStepAndConcept(sessionId);

    // Gate 1: Context Assembly
    const context = await this.contextAssembler.assembleContext(sessionId, conceptId);

    // Generate active question context
    const question = this.questionGenerator.generateAndValidateQuestion(context, 2);

    // Server-side response evaluation
    const evalResult = await this.responseEvaluator.evaluateResponse(response, question, session.learnerId);

    // Gate 4: Evidence Gate - Submit to M3 Evidence Ledger via deterministic hash
    const evidenceKey = this.computeDeterministicEvidenceId(sessionId, activeStep.id, attempts, response);

    const recordResult = await this.masteryService.recordEvidence({
      evidenceKey,
      learnerId: session.learnerId,
      conceptId,
      rawScore: evalResult.rawScore,
      evidenceType: 'ASSESSMENT',
      outcome: evalResult.passed ? 'CORRECT' : 'INCORRECT',
      misconception: evalResult.detectedMisconception,
      response,
      observedAt: new Date().toISOString(),
    });

    // Mark step complete if passed
    if (evalResult.passed && activeStep) {
      await this.prisma.sessionStep.update({
        where: { id: activeStep.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      const inst = activeStep.assessmentInstances?.[0];
      if (inst) {
        await this.prisma.assessmentInstance.update({
          where: { id: inst.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }
    }

    // State machine transitions
    const { nextPhase, strategy } = this.stateMachine.determineNextPhaseAndStrategy(
      'INSTRUCTION',
      evalResult.outcome,
      context,
      attempts,
    );

    let statement = "";
    if (evalResult.outcome === 'CORRECT') {
      statement = "Fractions Mastered! " + (evalResult.criticFeedback || "Great job!");
    } else if (evalResult.detectedMisconception) {
      statement = "I see what you tried. When adding fractions, we cannot simply add the denominators directly. " + (evalResult.criticFeedback || "");
    } else {
      statement = "That's not quite correct. Let's look at the common denominator.";
    }

    return {
      statement,
      evaluation: evalResult,
      detectedMisconception: evalResult.detectedMisconception,
      nextPhase,
      strategy,
      evidenceKey,
      masteryUpdate: recordResult.conceptMastery,
      options: question.options.map((o) => o.text),
      correctOption: question.correctAnswer,
      nextBestAction: evalResult.passed ? 'REMEDIATION' : 'RETRY',
    };
  }

  async requestHint(sessionId: string, level: number): Promise<any> {
    const { conceptId } = await this.getActiveStepAndConcept(sessionId);
    const context = await this.contextAssembler.assembleContext(sessionId, conceptId);

    if (level === 1) {
      return { statement: "Let's look at the denominators. Are they the same? What must we do before we add them?" };
    } else if (level === 2) {
      return { statement: "Think of sharing. If you have different sized slices, you cannot just add them. We need to cut the slices so they are identical in size." };
    } else {
      return { statement: "Find the least common multiple of 2 and 3. The common denominator is 6. Try converting both fractions." };
    }
  }

  async explainMisconception(sessionId: string, misconceptionCode: string): Promise<any> {
    return {
      statement: "When adding fractions, we cannot simply add the bottom numbers together. Denominators represent the size of the parts, so we must slice them equally first.",
    };
  }
}
