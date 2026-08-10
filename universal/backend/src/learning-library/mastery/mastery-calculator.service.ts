import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MasteryStatus, EvidenceType, EvidenceOutcome } from '@prisma/client';

export interface RecordEvidenceDto {
  evidenceKey: string;
  learnerId: string;
  conceptId?: string;
  learningObjectiveId?: string;
  rawScore: number; // 0.0 to 1.0
  evidenceType?: EvidenceType;
  outcome?: EvidenceOutcome;
  observedAt?: string;
}

@Injectable()
export class MasteryCalculatorService {
  private readonly logger = new Logger(MasteryCalculatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordEvidence(dto: RecordEvidenceDto): Promise<any> {
    if (!dto.conceptId && !dto.learningObjectiveId) {
      throw new BadRequestException('Either conceptId or learningObjectiveId must be provided.');
    }
    if (dto.rawScore < 0.0 || dto.rawScore > 1.0) {
      throw new BadRequestException('rawScore must be between 0.0 and 1.0.');
    }

    // Execute atomic exact-once evidence transaction
    return await this.prisma.$transaction(async (tx) => {
      // 1. Check idempotency via unique evidenceKey
      const existingEvidence = await tx.learningEvidence.findUnique({
        where: { evidenceKey: dto.evidenceKey },
      });

      if (existingEvidence) {
        this.logger.log(`IDEMPOTENCY HIT: evidenceKey '${dto.evidenceKey}' already processed.`);
        const existingHistory = await tx.masteryHistory.findFirst({
          where: { evidenceKey: dto.evidenceKey },
        });
        return {
          idempotent: true,
          evidence: existingEvidence,
          history: existingHistory,
        };
      }

      // 2. Fetch or create default MasteryPolicy v1
      let policy = await tx.masteryPolicy.findUnique({ where: { version: 1 } });
      if (!policy) {
        policy = await tx.masteryPolicy.create({
          data: {
            version: 1,
            name: 'EKAGURU Default Mastery Policy v1',
            recentWeight: 0.60,
            decayLambda: 0.001,
            masteryThreshold: 0.75,
            remediationThreshold: 0.50,
            confidenceThreshold: 0.70,
          },
        });
      }

      // 3. Create immutable LearningEvidence record
      const evidence = await tx.learningEvidence.create({
        data: {
          evidenceKey: dto.evidenceKey,
          learnerId: dto.learnerId,
          conceptId: dto.conceptId || null,
          learningObjectiveId: dto.learningObjectiveId || null,
          evidenceType: dto.evidenceType || EvidenceType.ASSESSMENT,
          outcome: dto.outcome || (dto.rawScore >= 0.75 ? EvidenceOutcome.CORRECT : EvidenceOutcome.INCORRECT),
          score: dto.rawScore,
          confidence: policy.confidenceThreshold,
          observedAt: dto.observedAt ? new Date(dto.observedAt) : new Date(),
        },
      });

      let updatedConceptMastery: any = null;
      let updatedObjectiveMastery: any = null;
      let previousScore = 0.0;
      let previousStatus: MasteryStatus = MasteryStatus.NOT_STARTED;
      let newScore = dto.rawScore;
      let newStatus: MasteryStatus = MasteryStatus.NOT_STARTED;

      // 4. Calculate Concept-Level Mastery if conceptId provided
      if (dto.conceptId) {
        const priorConceptMastery = await tx.learnerConceptMastery.findUnique({
          where: { learnerId_conceptId: { learnerId: dto.learnerId, conceptId: dto.conceptId } },
        });

        if (priorConceptMastery) {
          previousScore = priorConceptMastery.masteryScore;
          previousStatus = priorConceptMastery.status;

          // Temporal decay delta (hours)
          const now = new Date();
          const lastAssessed = priorConceptMastery.lastAssessedAt ? new Date(priorConceptMastery.lastAssessedAt) : now;
          const deltaHours = Math.max(0, (now.getTime() - lastAssessed.getTime()) / (1000 * 60 * 60));

          // Formula: M_comp = w_recent * S_recent + (1 - w_recent) * M_prior * e^(-lambda * deltaHours)
          const decayedPrior = priorConceptMastery.masteryScore * Math.exp(-policy.decayLambda * deltaHours);
          newScore = policy.recentWeight * dto.rawScore + (1 - policy.recentWeight) * decayedPrior;
          newScore = Math.min(1.0, Math.max(0.0, newScore));
        }

        if (newScore >= policy.masteryThreshold) newStatus = MasteryStatus.MASTERED;
        else if (newScore >= policy.remediationThreshold) newStatus = MasteryStatus.IN_PROGRESS;
        else newStatus = MasteryStatus.NEEDS_REMEDIATION;

        updatedConceptMastery = await tx.learnerConceptMastery.upsert({
          where: { learnerId_conceptId: { learnerId: dto.learnerId, conceptId: dto.conceptId } },
          create: {
            learnerId: dto.learnerId,
            conceptId: dto.conceptId,
            masteryScore: newScore,
            confidence: policy.confidenceThreshold,
            status: newStatus,
            policyVersion: policy.version,
            attemptsCount: 1,
            successfulCount: dto.rawScore >= policy.masteryThreshold ? 1 : 0,
            lastAssessedAt: new Date(),
          },
          update: {
            masteryScore: newScore,
            confidence: policy.confidenceThreshold,
            status: newStatus,
            attemptsCount: { increment: 1 },
            successfulCount: dto.rawScore >= policy.masteryThreshold ? { increment: 1 } : undefined,
            lastAssessedAt: new Date(),
          },
        });
      }

      // 5. Calculate Objective-Level Mastery if learningObjectiveId provided
      if (dto.learningObjectiveId) {
        const priorObjMastery = await tx.learnerObjectiveMastery.findUnique({
          where: { learnerId_learningObjectiveId: { learnerId: dto.learnerId, learningObjectiveId: dto.learningObjectiveId } },
        });

        const objPrevScore = priorObjMastery ? priorObjMastery.masteryScore : 0.0;
        const objNewScore = priorObjMastery
          ? Math.min(1.0, Math.max(0.0, policy.recentWeight * dto.rawScore + (1 - policy.recentWeight) * priorObjMastery.masteryScore))
          : dto.rawScore;

        let objStatus: MasteryStatus = MasteryStatus.NOT_STARTED;
        if (objNewScore >= policy.masteryThreshold) objStatus = MasteryStatus.MASTERED;
        else if (objNewScore >= policy.remediationThreshold) objStatus = MasteryStatus.IN_PROGRESS;
        else objStatus = MasteryStatus.NEEDS_REMEDIATION;

        updatedObjectiveMastery = await tx.learnerObjectiveMastery.upsert({
          where: { learnerId_learningObjectiveId: { learnerId: dto.learnerId, learningObjectiveId: dto.learningObjectiveId } },
          create: {
            learnerId: dto.learnerId,
            learningObjectiveId: dto.learningObjectiveId,
            masteryScore: objNewScore,
            status: objStatus,
            policyVersion: policy.version,
            lastAssessedAt: new Date(),
          },
          update: {
            masteryScore: objNewScore,
            status: objStatus,
            lastAssessedAt: new Date(),
          },
        });
      }

      // 6. Insert immutable audit log into MasteryHistory
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
        },
      });

      this.logger.log(`Recorded evidence '${dto.evidenceKey}' for learner '${dto.learnerId}'. Mastery updated to ${newScore.toFixed(2)} (${newStatus}).`);

      return {
        idempotent: false,
        evidence,
        conceptMastery: updatedConceptMastery,
        objectiveMastery: updatedObjectiveMastery,
        history,
      };
    });
  }

  async getLearnerMastery(learnerId: string): Promise<any> {
    const conceptMasteries = await this.prisma.learnerConceptMastery.findMany({
      where: { learnerId },
      include: { concept: { select: { canonicalName: true, domain: true, gradeBand: true } } },
    });

    const objectiveMasteries = await this.prisma.learnerObjectiveMastery.findMany({
      where: { learnerId },
      include: { learningObjective: { select: { code: true, description: true, complexityLevel: true } } },
    });

    return {
      learnerId,
      conceptMasteries,
      objectiveMasteries,
    };
  }
}
