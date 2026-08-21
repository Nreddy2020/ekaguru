import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MasteryCalculatorService } from '../mastery/mastery-calculator.service';
import { OutboxService } from './outbox.service';
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
    private readonly outboxService: OutboxService,
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

    const rawScore = this.scoreResponse(dto.response, config, spec.scoringMethod);
    const passed = rawScore >= spec.passThreshold;

    const evidenceKey = crypto
      .createHash('sha256')
      .update(`${sessionId}|${instanceId}|${instance.attemptNumber}`)
      .digest('hex');

    // Stage 1 transaction: AssessmentResponse + mark instance complete + ASSESSMENT_STRUGGLE check
    await this.prisma.$transaction(async (tx) => {
      await tx.assessmentResponse.create({
        data: {
          assessmentInstanceId: instanceId,
          responsePayload: { response: dto.response },
          rawScore,
          passed,
          evidenceKey,
          scoredAt: new Date(),
        },
      });

      await tx.assessmentInstance.update({
        where: { id: instanceId },
        data: { status: AssessmentInstanceStatus.COMPLETED, completedAt: new Date() },
      });

      // Atomic assessment struggle check (>= 3 failures in rolling 7 days)
      if (!passed && instance.sessionStep.learningObjectiveId) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const failCount = await tx.assessmentResponse.count({
          where: {
            passed: false,
            scoredAt: { gte: sevenDaysAgo },
            assessmentInstance: {
              learnerId: session.learnerId,
              assessmentSpecification: {
                learningObjectiveId: instance.sessionStep.learningObjectiveId,
              },
            },
          },
        });

        if (failCount >= 3) {
          const utcDateString = new Date().toISOString().split('T')[0]; // UTC YYYY-MM-DD
          await this.outboxService.createEvent(
            tx,
            session.learnerId,
            'ASSESSMENT_STRUGGLE',
            'objective',
            instance.sessionStep.learningObjectiveId,
            {
              learningObjectiveId: instance.sessionStep.learningObjectiveId,
              failedCount: failCount,
            },
            utcDateString
          );
        }
      }
    });

    // ── Stage 2: Phase 2.7 evidence pipeline (its own transaction) ────────────
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

  private scoreResponse(response: any, config: any, scoringMethod: string): number {
    switch (scoringMethod) {
      case 'EXACT_MATCH': {
        const correct = config.correctOption ?? config.correctAnswer;
        if (correct === undefined) return 0;
        return String(response).trim().toLowerCase() === String(correct).trim().toLowerCase() ? 1.0 : 0.0;
      }
      case 'PARTIAL_CREDIT': {
        const correctOptions: string[] = config.correctOptions ?? [];
        if (!Array.isArray(response) || correctOptions.length === 0) return 0;
        const correct = response.filter((r: string) =>
          correctOptions.some((c) => c.trim().toLowerCase() === String(r).trim().toLowerCase()),
        );
        return correct.length / correctOptions.length;
      }
      case 'THRESHOLD': {
        const numericResponse = parseFloat(String(response));
        const threshold = parseFloat(String(config.threshold ?? 0.5));
        return isNaN(numericResponse) ? 0 : numericResponse >= threshold ? 1.0 : numericResponse / threshold;
      }
      default:
        return 0;
    }
  }
}
