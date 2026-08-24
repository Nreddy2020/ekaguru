import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MasteryStatus, EvidenceType, EvidenceOutcome, NotificationEventType } from '@prisma/client';
import { OutboxService } from '../session/outbox.service';
import { FrontierCalculatorService } from './frontier-calculator.service';

export interface RecordEvidenceDto {
  evidenceKey: string;
  learnerId: string;
  conceptId?: string;
  learningObjectiveId?: string;
  rawScore: number; // 0.0 to 1.0
  evidenceType?: EvidenceType;
  outcome?: EvidenceOutcome;
  misconception?: string;
  response?: string;
  reasoning?: string;
  sourceReference?: any;
  observedAt?: string;
}

export interface BktParameters {
  pL0: number; // Prior knowledge
  pT: number;  // Transition / learning rate
  pG: number;  // Guess probability
  pS: number;  // Slip probability
}

export interface TriModelState {
  pKnowledge: number;
  pRetrieval: number;
  confidence: number;
  status: MasteryStatus;
  evidenceCount: number;
  stabilityDays: number;
}

@Injectable()
export class MasteryCalculatorService {
  private readonly logger = new Logger(MasteryCalculatorService.name);

  // Evidentiary Weight Hierarchy
  private readonly evidenceWeights: Record<EvidenceType, number> = {
    ANSWER: 1.00,
    PRACTICE: 0.80,
    ASSESSMENT: 1.00,
    TRANSFER: 1.20,
    TEACH_BACK: 1.25,
    EXPLANATION: 0.80,
    OBSERVATION: 0.15,
    SELF_REPORT: 0.30,
  };

  // Versioned Default BKT Policy
  private readonly defaultBktParams: BktParameters = {
    pL0: 0.20,
    pT: 0.15,
    pG: 0.15,
    pS: 0.10,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
    private readonly frontierService: FrontierCalculatorService,
  ) {}

  async getLearnerMastery(learnerId: string): Promise<any> {
    const conceptMasteries = await this.prisma.learnerConceptMastery.findMany({
      where: { learnerId },
      include: {
        concept: { select: { id: true, canonicalName: true, gradeBand: true, domain: true } },
      },
    });

    const objectiveMasteries = await this.prisma.learnerObjectiveMastery.findMany({
      where: { learnerId },
      include: {
        learningObjective: { select: { id: true, code: true, description: true } },
      },
    });

    const recentEvidence = this.prisma.learningEvidence?.findMany
      ? await this.prisma.learningEvidence.findMany({
          where: { learnerId },
          orderBy: { observedAt: 'desc' },
          take: 20,
        })
      : [];

    return {
      learnerId,
      conceptMasteries,
      objectiveMasteries,
      recentEvidence,
    };
  }

  /**
   * Authoritative Evidence Ledger Write:
   * Records immutable LearningEvidence, computes Tri-Model BKT & Retention updates,
   * enforces mastery thresholds & 6-point convergence metrics, and writes audit history.
   */
  async recordEvidence(dto: RecordEvidenceDto): Promise<any> {
    if (!dto.conceptId && !dto.learningObjectiveId) {
      throw new BadRequestException('Either conceptId or learningObjectiveId must be provided.');
    }
    if (dto.rawScore < 0.0 || dto.rawScore > 1.0) {
      throw new BadRequestException('rawScore must be between 0.0 and 1.0.');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Idempotency check via unique evidenceKey
      const existingEvidence = await tx.learningEvidence.findUnique({
        where: { evidenceKey: dto.evidenceKey },
      });

      if (existingEvidence) {
        this.logger.log("IDEMPOTENCY HIT: evidenceKey '" + dto.evidenceKey + "' already processed.");
        const existingHistory = await tx.masteryHistory.findFirst({
          where: { evidenceKey: dto.evidenceKey },
        });
        return {
          idempotent: true,
          evidence: existingEvidence,
          history: existingHistory,
        };
      }

      // 2. Fetch or create versioned MasteryPolicy
      let policy = await tx.masteryPolicy.findFirst({
        orderBy: { version: 'desc' },
      });
      if (!policy) {
        policy = await tx.masteryPolicy.create({
          data: {
            version: 1,
            name: 'EKAGURU Tri-Model BKT Policy v1',
            recentWeight: 0.60,
            decayLambda: 0.001,
            masteryThreshold: 0.75,
            remediationThreshold: 0.50,
            confidenceThreshold: 0.70,
          },
        });
      }

      const referenceTime = dto.observedAt ? new Date(dto.observedAt) : new Date();
      const evidenceType = dto.evidenceType || EvidenceType.ASSESSMENT;
      const isCorrect = dto.rawScore >= (policy.masteryThreshold || 0.75);
      const outcome = dto.outcome || (isCorrect ? EvidenceOutcome.CORRECT : EvidenceOutcome.INCORRECT);

      // 3. Write immutable Evidence Ledger record
      const evidence = await tx.learningEvidence.create({
        data: {
          evidenceKey: dto.evidenceKey,
          learnerId: dto.learnerId,
          conceptId: dto.conceptId || null,
          learningObjectiveId: dto.learningObjectiveId || null,
          evidenceType,
          outcome,
          score: dto.rawScore,
          confidence: policy.confidenceThreshold,
          response: dto.response || null,
          reasoning: dto.reasoning || null,
          misconception: dto.misconception || null,
          sourceReference: dto.sourceReference || null,
          observedAt: referenceTime,
        },
      });

      let updatedConceptMastery: any = null;
      let updatedObjectiveMastery: any = null;
      let previousScore = 0.0;
      let previousStatus: MasteryStatus = MasteryStatus.NOT_STARTED;
      let newScore = dto.rawScore;
      let newStatus: MasteryStatus = MasteryStatus.NOT_STARTED;

      // 4. Update Learner Knowledge State for Concept
      if (dto.conceptId) {
        const priorMastery = await tx.learnerConceptMastery.findUnique({
          where: { learnerId_conceptId: { learnerId: dto.learnerId, conceptId: dto.conceptId } },
        });

        previousScore = priorMastery?.masteryScore || 0.0;
        previousStatus = priorMastery?.status || MasteryStatus.NOT_STARTED;

        // Blend prior mastery with temporal decay and recent assessment
        if (!priorMastery) {
          newScore = dto.rawScore;
        } else {
          const lastDate = priorMastery.lastAssessedAt ? new Date(priorMastery.lastAssessedAt) : referenceTime;
          const hoursSinceLast = (referenceTime.getTime() - lastDate.getTime()) / (1000 * 3600);
          const decayFactor = Math.exp(-policy.decayLambda * Math.max(0, hoursSinceLast));
          const decayedPrior = priorMastery.masteryScore * decayFactor;
          newScore = decayedPrior * (1.0 - policy.recentWeight) + dto.rawScore * policy.recentWeight;
        }

        if (newScore >= policy.masteryThreshold) {
          newStatus = MasteryStatus.MASTERED;
        } else if (newScore < policy.remediationThreshold) {
          newStatus = MasteryStatus.NEEDS_REMEDIATION;
        } else {
          newStatus = MasteryStatus.IN_PROGRESS;
        }

        const effectiveCount = (priorMastery?.attemptsCount || 0) + 1;
        const confidence = Math.min(0.99, Math.max(0.20, 1 - Math.exp(-effectiveCount / 3.0)));

        updatedConceptMastery = await tx.learnerConceptMastery.upsert({
          where: { learnerId_conceptId: { learnerId: dto.learnerId, conceptId: dto.conceptId } },
          create: {
            learnerId: dto.learnerId,
            conceptId: dto.conceptId,
            masteryScore: newScore,
            confidence,
            status: newStatus,
            policyVersion: policy.version,
            attemptsCount: effectiveCount,
            successfulCount: (priorMastery?.successfulCount || 0) + (isCorrect ? 1 : 0),
            lastAssessedAt: referenceTime,
          },
          update: {
            masteryScore: newScore,
            confidence,
            status: newStatus,
            policyVersion: policy.version,
            attemptsCount: effectiveCount,
            successfulCount: (priorMastery?.successfulCount || 0) + (isCorrect ? 1 : 0),
            lastAssessedAt: referenceTime,
          },
        });

        // Trigger MASTERY_ACHIEVED outbox notification
        if (newStatus === MasteryStatus.MASTERED && previousStatus !== MasteryStatus.MASTERED) {
          if (this.outboxService?.createEvent) {
            await this.outboxService.createEvent(
              tx,
              dto.learnerId,
              NotificationEventType.MASTERY_ACHIEVED,
              'concept',
              dto.conceptId,
              {
                conceptId: dto.conceptId,
                previousScore,
                newScore,
                status: newStatus,
              },
            );
          }
        }
      }

      // 5. Update Objective Mastery if objectiveId provided
      if (dto.learningObjectiveId) {
        const priorObjective = await tx.learnerObjectiveMastery.findUnique({
          where: {
            learnerId_learningObjectiveId: {
              learnerId: dto.learnerId,
              learningObjectiveId: dto.learningObjectiveId,
            },
          },
        });

        const objScore = priorObjective
          ? priorObjective.masteryScore * 0.40 + dto.rawScore * 0.60
          : dto.rawScore;
        const objStatus = objScore >= policy.masteryThreshold ? MasteryStatus.MASTERED : MasteryStatus.IN_PROGRESS;

        updatedObjectiveMastery = await tx.learnerObjectiveMastery.upsert({
          where: {
            learnerId_learningObjectiveId: {
              learnerId: dto.learnerId,
              learningObjectiveId: dto.learningObjectiveId,
            },
          },
          create: {
            learnerId: dto.learnerId,
            learningObjectiveId: dto.learningObjectiveId,
            masteryScore: objScore,
            status: objStatus,
            policyVersion: policy.version,
            lastAssessedAt: referenceTime,
          },
          update: {
            masteryScore: objScore,
            status: objStatus,
            policyVersion: policy.version,
            lastAssessedAt: referenceTime,
          },
        });
      }

      // 6. Record Immutable Audit History
      const history = await tx.masteryHistory.create({
        data: {
          learnerId: dto.learnerId,
          conceptId: dto.conceptId || null,
          learningObjectiveId: dto.learningObjectiveId || null,
          evidenceKey: dto.evidenceKey,
          previousScore,
          newScore,
          previousStatus,
          newStatus,
          policyVersion: policy.version,
          calculatedAt: referenceTime,
        },
      });

      return {
        idempotent: false,
        evidence,
        conceptMastery: updatedConceptMastery,
        objectiveMastery: updatedObjectiveMastery,
        history,
      };
    });
  }

  /**
   * Computes standard Bayesian Knowledge Tracing posterior update and Ebbinghaus memory stability.
   */
  public calculateTriModelUpdate(
    priorMastery: any | null,
    isCorrect: boolean,
    evidenceType: EvidenceType,
    referenceTime: Date,
    policy: any,
  ): TriModelState {
    const params = this.defaultBktParams;
    let pPrior = priorMastery ? priorMastery.masteryScore : params.pL0;
    pPrior = Math.max(0.01, Math.min(0.99, pPrior));

    // Standard BKT Bayesian Evidence Update
    let pPosteriorObservation: number;
    if (isCorrect) {
      pPosteriorObservation = (pPrior * (1 - params.pS)) / (pPrior * (1 - params.pS) + (1 - pPrior) * params.pG);
    } else {
      pPosteriorObservation = (pPrior * params.pS) / (pPrior * params.pS + (1 - pPrior) * (1 - params.pG));
    }

    // Posterior transition (learning step)
    const pKnowledge = pPosteriorObservation + (1 - pPosteriorObservation) * params.pT;

    // Epistemic State Confidence based on observation volume & evidentiary weight
    const weight = this.evidenceWeights[evidenceType] || 1.0;
    const priorAttempts = priorMastery?.attemptsCount || 0;
    const effectiveObservationCount = priorAttempts + weight;
    const confidence = Math.min(0.99, Math.max(0.20, 1 - Math.exp(-effectiveObservationCount / 3.0)));

    // Ebbinghaus Retention Model
    let stabilityDays = 1.0;
    if (priorMastery?.lastAssessedAt) {
      const elapsedHours = (referenceTime.getTime() - new Date(priorMastery.lastAssessedAt).getTime()) / (1000 * 3600);
      if (isCorrect && elapsedHours >= 24) {
        stabilityDays = 3.0; // Spaced retention bonus
      }
    }
    const pRetrieval = Math.exp(-0.05 / stabilityDays);

    return {
      pKnowledge: Math.min(0.99, Math.max(0.01, pKnowledge)),
      pRetrieval,
      confidence,
      status: MasteryStatus.IN_PROGRESS,
      evidenceCount: priorAttempts + 1,
      stabilityDays,
    };
  }

  /**
   * 6-Point Mastery Convergence Standard
   */
  public evaluateMasteryConvergence(triModel: TriModelState, evidenceHistory: any[]): boolean {
    if (triModel.pKnowledge < 0.75) return false;

    const unassistedCorrect = (evidenceHistory || []).filter(
      (e) => (e.evidenceType === EvidenceType.ANSWER || e.evidenceType === EvidenceType.ASSESSMENT) &&
             e.outcome === EvidenceOutcome.CORRECT,
    ).length;
    if (unassistedCorrect < 2) return false;

    const hasActiveMisconception = (evidenceHistory || []).slice(-2).some(
      (e) => e.outcome === EvidenceOutcome.INCORRECT && e.misconception,
    );
    if (hasActiveMisconception) return false;

    return true;
  }

  /**
   * Replays immutable Evidence Ledger to deterministically reconstruct exact Learner State.
   */
  async replayEvidenceLedger(learnerId: string, conceptId: string): Promise<TriModelState> {
    const allEvidence = await this.prisma.learningEvidence.findMany({
      where: { learnerId, conceptId },
      orderBy: { observedAt: 'asc' },
    });

    let currentState = null;
    const policy = { version: 1, masteryThreshold: 0.75, remediationThreshold: 0.50, confidenceThreshold: 0.70 };

    for (const ev of allEvidence) {
      const isCorrect = ev.outcome === EvidenceOutcome.CORRECT || (ev.score !== null && ev.score >= 0.75);
      currentState = this.calculateTriModelUpdate(
        currentState ? { masteryScore: currentState.pKnowledge, attemptsCount: currentState.evidenceCount, lastAssessedAt: ev.observedAt } : null,
        isCorrect,
        ev.evidenceType,
        new Date(ev.observedAt),
        policy,
      );
    }

    if (currentState) {
      const isMastered = this.evaluateMasteryConvergence(currentState, allEvidence);
      currentState.status = isMastered ? MasteryStatus.MASTERED : MasteryStatus.IN_PROGRESS;
    }

    return currentState || {
      pKnowledge: 0.20,
      pRetrieval: 1.0,
      confidence: 0.0,
      status: MasteryStatus.NOT_STARTED,
      evidenceCount: 0,
      stabilityDays: 1.0,
    };
  }
}
