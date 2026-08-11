import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MasteryCalculatorService } from '../mastery/mastery-calculator.service';
import { AssessmentInstanceStatus, SessionStatus } from '@prisma/client';
import * as crypto from 'crypto';

export interface SubmitResponseDto {
  response: any; // client submits ONLY the response - never rawScore/masteryScore/status
}

@Injectable()
export class AssessmentEngineService {
  private readonly logger = new Logger(AssessmentEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly masteryService: MasteryCalculatorService,
  ) {}

  async getAssessmentInstance(sessionId: string, instanceId: string): Promise<any> {
    const instance = await this.prisma.assessmentInstance.findFirst({
      where: { id: instanceId, sessionStep: { sessionId } },
      include: {
        assessmentSpecification: {
          select: {
            id: true,
            assessmentType: true,
            difficulty: true,
            passThreshold: true,
            configuration: true, // full config since this is the question itself
          },
        },
        sessionStep: { select: { id: true, stepType: true, learningObjectiveId: true } },
      },
    });

    if (!instance) throw new NotFoundException(`Assessment instance '${instanceId}' not found in session '${sessionId}'.`);

    // Strip correctAnswer from the configuration before returning to client
    const config = instance.assessmentSpecification.configuration as any;
    const { correctOption, correctAnswer, ...safeConfig } = config;

    return {
      instanceId: instance.id,
      status: instance.status,
      attemptNumber: instance.attemptNumber,
      assessmentType: instance.assessmentSpecification.assessmentType,
      difficulty: instance.assessmentSpecification.difficulty,
      configuration: safeConfig, // question + options only, no answer
    };
  }

  /**
   * Submit a learner response and process evidence.
   *
   * Three-stage transaction boundary (per approved architecture):
   * Stage 1: Create AssessmentResponse with server-computed rawScore (Phase 2.8 transaction)
   * Stage 2: Call Phase 2.7 MasteryCalculatorService.recordEvidence (its own transaction)
   * Stage 3: Create SessionEvidence audit record (Phase 2.8 transaction)
   *
   * Client-supplied rawScore/masteryScore/status are REJECTED.
   */
  async submitResponse(sessionId: string, instanceId: string, dto: SubmitResponseDto): Promise<any> {
    const instance = await this.prisma.assessmentInstance.findFirst({
      where: { id: instanceId, sessionStep: { sessionId } },
      include: {
        assessmentSpecification: true,
        sessionStep: {
          include: {
            session: { select: { id: true, status: true, learnerId: true } },
            target: {
              include: {
                curriculumNode: {
                  include: { concept: { select: { id: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!instance) throw new NotFoundException(`Assessment instance '${instanceId}' not found.`);

    // Guard: session must be ACTIVE
    const session = instance.sessionStep.session;
    if (session?.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException(`Session '${sessionId}' is not ACTIVE. Cannot submit response.`);
    }

    // Guard: instance not already completed
    if (instance.status === AssessmentInstanceStatus.COMPLETED) {
      throw new ConflictException(`Assessment instance '${instanceId}' is already completed.`);
    }

    // ── Stage 1: Server-authoritative scoring ─────────────────────────────────
    const spec = instance.assessmentSpecification;
    const config = spec.configuration as any;

    // DeterministicAssessmentProvider: configuration IS the assessment
    // rawScore is server-computed — client response is compared against stored correct answer
    const rawScore = this.scoreResponse(dto.response, config, spec.scoringMethod);
    const passed = rawScore >= spec.passThreshold;

    // Deterministic evidenceKey: SHA256(sessionId|instanceId|attemptNumber)
    const evidenceKey = crypto
      .createHash('sha256')
      .update(`${sessionId}|${instanceId}|${instance.attemptNumber}`)
      .digest('hex');

    // Stage 1 transaction: AssessmentResponse + mark instance complete
    await this.prisma.$transaction(async (tx) => {
      await tx.assessmentResponse.create({
        data: {
          assessmentInstanceId: instanceId,
          responsePayload: { response: dto.response },
          rawScore,   // SERVER-COMPUTED
          passed,
          evidenceKey,
          scoredAt: new Date(),
        },
      });

      await tx.assessmentInstance.update({
        where: { id: instanceId },
        data: { status: AssessmentInstanceStatus.COMPLETED, completedAt: new Date() },
      });
    });

    // ── Stage 2: Phase 2.7 evidence pipeline (its own transaction) ────────────
    // Resolve canonical conceptId from CurriculumNode via the step→target→curriculumNode chain.
    // Phase 2.8 identifies the concept; Phase 2.7 remains solely responsible for mastery calculation.
    const resolvedConceptId = instance.sessionStep.target?.curriculumNode?.concept?.id ?? undefined;

    let masteryResult: any = null;
    try {
      masteryResult = await this.masteryService.recordEvidence({
        evidenceKey,
        learnerId: session!.learnerId,
        conceptId: resolvedConceptId,
        learningObjectiveId: instance.sessionStep.learningObjectiveId ?? undefined,
        rawScore,
        evidenceType: 'ASSESSMENT' as any,
        outcome: passed ? 'CORRECT' : 'INCORRECT' as any,
        observedAt: new Date().toISOString(),
      });
    } catch (err) {
      this.logger.error(`Phase 2.7 evidence pipeline error for key '${evidenceKey}': ${err.message}`);
      // Do not create SessionEvidence if Phase 2.7 fails
      throw err;
    }

    // ── Stage 3: SessionEvidence audit link ───────────────────────────────────
    await this.prisma.sessionEvidence.create({
      data: { sessionId, evidenceKey },
    });

    this.logger.log(`Assessment '${instanceId}' scored: rawScore=${rawScore}, passed=${passed}, evidenceKey=${evidenceKey}`);

    return {
      instanceId,
      rawScore,
      passed,
      evidenceKey,
      masteryUpdated: masteryResult?.idempotent === false,
    };
  }

  /**
   * DeterministicAssessmentProvider scoring logic.
   * The AssessmentSpecification.configuration IS the complete assessment.
   * No generation occurs — provider compares response to stored correctOption/correctAnswer.
   */
  private scoreResponse(response: any, config: any, scoringMethod: string): number {
    switch (scoringMethod) {
      case 'EXACT_MATCH': {
        const correct = config.correctOption ?? config.correctAnswer;
        if (correct === undefined) return 0;
        return String(response).trim().toLowerCase() === String(correct).trim().toLowerCase() ? 1.0 : 0.0;
      }
      case 'PARTIAL_CREDIT': {
        // If config defines correctOptions as array, score fraction of correct answers
        const correctOptions: string[] = config.correctOptions ?? [];
        if (!Array.isArray(response) || correctOptions.length === 0) return 0;
        const correct = response.filter((r: string) =>
          correctOptions.some((c) => c.trim().toLowerCase() === String(r).trim().toLowerCase()),
        );
        return correct.length / correctOptions.length;
      }
      case 'THRESHOLD': {
        // Numeric response scored against a threshold value
        const numericResponse = parseFloat(String(response));
        const threshold = parseFloat(String(config.threshold ?? 0.5));
        return isNaN(numericResponse) ? 0 : numericResponse >= threshold ? 1.0 : numericResponse / threshold;
      }
      default:
        return 0;
    }
  }
}
