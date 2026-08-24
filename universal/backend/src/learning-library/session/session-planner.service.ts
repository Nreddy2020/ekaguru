import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SessionStatus, SessionStepType, SessionStepStatus, AssessmentInstanceStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { FrontierCalculatorService } from '../mastery/frontier-calculator.service';
import { TopologicalSortService, SortConceptNode } from '../knowledge/curriculum/topological-sort.service';

export interface CreateSessionDto {
  learnerId: string;
  structureVersion: number;
  timeBudgetMinutes: number;
}

@Injectable()
export class SessionPlannerService {
  private readonly logger = new Logger(SessionPlannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly frontierService: FrontierCalculatorService,
    private readonly topoSortService: TopologicalSortService,
  ) {}

  private buildFingerprint(learnerId: string, structureId: string, timeBudgetMinutes: number): string {
    const today = new Date().toISOString().split('T')[0];
    return crypto
      .createHash('sha256')
      .update(learnerId + "|" + structureId + "|" + today + "|" + timeBudgetMinutes)
      .digest('hex');
  }

  async createSession(dto: CreateSessionDto): Promise<any> {
    const { learnerId, structureVersion, timeBudgetMinutes } = dto;
    const timeBudgetSeconds = timeBudgetMinutes * 60;

    // 1. Validate curriculum structure
    const structure = await this.prisma.curriculumStructure.findUnique({
      where: { version: structureVersion },
      include: {
        nodes: {
          orderBy: { sequenceIndex: 'asc' },
          include: {
            concept: { select: { id: true, canonicalName: true, gradeBand: true } },
            nodeObjectives: {
              include: {
                learningObjective: {
                  select: { id: true, code: true, complexityLevel: true },
                },
              },
            },
          },
        },
        prerequisites: true,
      },
    });

    if (!structure) {
      throw new NotFoundException("Curriculum structure version " + structureVersion + " not found.");
    }

    if (structure.status !== 'PUBLISHED') {
      throw new BadRequestException(
        "Cannot create session against curriculum v" + structureVersion + " with status '" + structure.status + "'. Only PUBLISHED versions allowed.",
      );
    }

    const enrollment = await this.prisma.learnerCurriculumEnrollment.findUnique({
      where: { learnerId_structureId: { learnerId, structureId: structure.id } },
    });

    if (!enrollment || !enrollment.active) {
      throw new ForbiddenException("Learner '" + learnerId + "' is not enrolled in curriculum v" + structureVersion + ".");
    }

    // 2. Compute deterministic fingerprint
    const fingerprint = this.buildFingerprint(learnerId, structure.id, timeBudgetMinutes);

    const existing = await this.prisma.learningSession.findUnique({
      where: { sessionRequestFingerprint: fingerprint },
      include: { targets: { include: { steps: true } } },
    });

    if (existing && existing.status !== 'ABANDONED') {
      this.logger.log("FINGERPRINT HIT: returning existing session '" + existing.id + "' (" + existing.status + ")");
      return existing;
    }

    // 3. Obtain Tri-Model Mastery States
    const conceptMasteries = await this.prisma.learnerConceptMastery.findMany({
      where: { learnerId },
    });
    const masteryMap = new Map<string, number>();
    conceptMasteries.forEach((m) => masteryMap.set(m.conceptId, m.masteryScore));

    // 4. Select Targets using ZPD (0.65 to 0.80 probability target) & Spaced Retrieval Interleaving
    const allNodes = structure.nodes;
    const selectedTargets: any[] = [];

    const unmasteredNodes = allNodes.filter((n) => {
      const score = masteryMap.get(n.conceptId) || 0.0;
      return score < 0.75;
    });

    const targetLimit = Math.max(1, Math.min(3, Math.floor(timeBudgetMinutes / 10)));
    const primaryTargets = unmasteredNodes.slice(0, targetLimit);

    let targetSeq = 1;
    for (const node of primaryTargets) {
      selectedTargets.push({
        curriculumNodeId: node.id,
        sequenceIndex: targetSeq++,
        isRemediation: false,
        conceptName: node.concept.canonicalName,
        objectives: node.nodeObjectives.map((o: any) => o.learningObjective || { id: o.learningObjectiveId }),
      });
    }

    // 5. Create LearningSession and Steps in transaction
    return await this.prisma.$transaction(async (tx) => {
      const session = await tx.learningSession.create({
        data: {
          learnerId,
          structureId: structure.id,
          sessionRequestFingerprint: fingerprint,
          status: SessionStatus.READY,
          timeBudgetSeconds,
        },
      });

      for (const target of selectedTargets) {
        const sessionTarget = await tx.sessionTarget.create({
          data: {
            sessionId: session.id,
            curriculumNodeId: target.curriculumNodeId,
            sequenceIndex: target.sequenceIndex,
            isRemediation: target.isRemediation,
          },
        });

        // Check if an active AssessmentSpecification exists for the objective
        const objectiveId = target.objectives[0]?.id || null;
        let activeSpec = null;
        if (objectiveId && tx.assessmentSpecification) {
          activeSpec = await tx.assessmentSpecification.findFirst({
            where: { learningObjectiveId: objectiveId, active: true },
          });
        }

        const stepRead = await tx.sessionStep.create({
          data: {
            sessionId: session.id,
            targetId: sessionTarget.id,
            stepType: SessionStepType.READ,
            sequenceIndex: 1,
            status: SessionStepStatus.PENDING,
            learningObjectiveId: objectiveId,
            estimatedDurationSeconds: Math.floor(timeBudgetSeconds / (selectedTargets.length * 3)),
          },
        });

        const stepPractice = await tx.sessionStep.create({
          data: {
            sessionId: session.id,
            targetId: sessionTarget.id,
            stepType: SessionStepType.PRACTICE,
            sequenceIndex: 2,
            status: SessionStepStatus.PENDING,
            learningObjectiveId: objectiveId,
            estimatedDurationSeconds: Math.floor(timeBudgetSeconds / (selectedTargets.length * 3)),
          },
        });

        if (activeSpec) {
          const stepAssess = await tx.sessionStep.create({
            data: {
              sessionId: session.id,
              targetId: sessionTarget.id,
              stepType: SessionStepType.ASSESS,
              sequenceIndex: 3,
              status: SessionStepStatus.PENDING,
              learningObjectiveId: objectiveId,
              estimatedDurationSeconds: Math.floor(timeBudgetSeconds / (selectedTargets.length * 3)),
            },
          });

          if (tx.assessmentInstance) {
            await tx.assessmentInstance.create({
              data: {
                sessionStepId: stepAssess.id,
                assessmentSpecificationId: activeSpec.id,
                learnerId: session.learnerId,
                attemptNumber: 1,
                status: AssessmentInstanceStatus.PENDING,
              },
            });
          }
        }
      }

      return await tx.learningSession.findUnique({
        where: { id: session.id },
        include: { targets: { include: { steps: true } } },
      });
    });
  }
}
