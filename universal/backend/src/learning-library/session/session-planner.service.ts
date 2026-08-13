import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SessionStatus, SessionStepType, SessionStepStatus } from '@prisma/client';
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

  /**
   * Deterministic fingerprint: SHA256(learnerId | structureId | YYYY-MM-DD | timeBudgetMinutes)
   * Per approved architecture: one non-ABANDONED session per fingerprint per day.
   */
  private buildFingerprint(learnerId: string, structureId: string, timeBudgetMinutes: number): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return crypto
      .createHash('sha256')
      .update(`${learnerId}|${structureId}|${today}|${timeBudgetMinutes}`)
      .digest('hex');
  }

  async createSession(dto: CreateSessionDto): Promise<any> {
    const { learnerId, structureVersion, timeBudgetMinutes } = dto;
    const timeBudgetSeconds = timeBudgetMinutes * 60;

    // 1. Validate published curriculum enrollment
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
      throw new NotFoundException(`Curriculum structure version ${structureVersion} not found.`);
    }

    if (structure.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Cannot create session against curriculum v${structureVersion} with status '${structure.status}'. Only PUBLISHED versions allowed.`,
      );
    }

    const enrollment = await this.prisma.learnerCurriculumEnrollment.findUnique({
      where: { learnerId_structureId: { learnerId, structureId: structure.id } },
    });

    if (!enrollment || !enrollment.active) {
      throw new ForbiddenException(`Learner '${learnerId}' is not enrolled in curriculum v${structureVersion}.`);
    }

    // 2. Compute deterministic fingerprint and check for existing session
    const fingerprint = this.buildFingerprint(learnerId, structure.id, timeBudgetMinutes);

    const existing = await this.prisma.learningSession.findUnique({
      where: { sessionRequestFingerprint: fingerprint },
      include: { targets: { include: { steps: true } } },
    });

    if (existing && existing.status !== 'ABANDONED') {
      this.logger.log(`FINGERPRINT HIT: returning existing session '${existing.id}' (${existing.status})`);
      return existing;
    }

    // 3. Obtain Phase 2.7 mastery state
    const conceptMasteries = await this.prisma.learnerConceptMastery.findMany({
      where: { learnerId },
    });
    const masteryMap = new Map<string, number>();
    conceptMasteries.forEach((m) => masteryMap.set(m.conceptId, m.masteryScore));

    const objMasteries = await this.prisma.learnerObjectiveMastery.findMany({
      where: { learnerId },
    });
    const objMasteryMap = new Map<string, number>();
    objMasteries.forEach((m) => objMasteryMap.set(m.learningObjectiveId, m.masteryScore));

    // 4. Obtain frontier
    const frontierResult = await this.frontierService.calculateFrontier(learnerId, structure.version);
    const frontierNodeIds = new Set(frontierResult.frontierNodes.map((f: any) => f.id));

    const masteryThreshold = 0.75;
    const nodeById = new Map<string, any>();
    structure.nodes.forEach((n) => nodeById.set(n.id, n));

    // Build incoming prereq map
    const incomingMap = new Map<string, string[]>();
    structure.prerequisites.forEach((p) => {
      if (!incomingMap.has(p.targetNodeId)) incomingMap.set(p.targetNodeId, []);
      incomingMap.get(p.targetNodeId)!.push(p.sourceNodeId);
    });

    // 5. Collect unmastered prereq nodes (remediation) and frontier nodes
    const remediationNodes: any[] = [];
    const frontierNodes: any[] = [];

    for (const node of structure.nodes) {
      const score = masteryMap.get(node.conceptId) || 0.0;
      if (score >= masteryThreshold) continue;

      const prereqIds = incomingMap.get(node.id) || [];
      const hasUnmasteredPrereqs = prereqIds.some((pId) => {
        const pNode = nodeById.get(pId);
        return pNode && (masteryMap.get(pNode.conceptId) || 0.0) < masteryThreshold;
      });

      if (hasUnmasteredPrereqs) {
        remediationNodes.push(node);
      } else if (frontierNodeIds.has(node.id)) {
        frontierNodes.push(node);
      }
    }

    // 6. Deterministic target ordering per approved spec:
    //    1. Remediation targets first (unmastered prereqs)
    //    2. Frontier nodes
    //    3. Within each group: sort canonically using TopologicalSortService to preserve Phase 2.6 sort order
    const toSortNode = (n: any): SortConceptNode => ({
      id: n.id,
      canonicalName: n.concept.canonicalName,
      gradeBand: n.gradeBand,
      prerequisiteIds: (incomingMap.get(n.id) || []).filter((pId) => nodeById.has(pId)),
    });

    const remediationSorted = remediationNodes.length > 0
      ? this.topoSortService.sortConcepts(remediationNodes.map(toSortNode)).sortedNodes
      : [];
    const orderedRemediation = remediationSorted.map((sn) => remediationNodes.find((n) => n.id === sn.id)!);

    const frontierSorted = frontierNodes.length > 0
      ? this.topoSortService.sortConcepts(frontierNodes.map(toSortNode)).sortedNodes
      : [];
    const orderedFrontier = frontierSorted.map((sn) => frontierNodes.find((n) => n.id === sn.id)!);

    const orderedTargets = [...orderedRemediation, ...orderedFrontier];

    // 7. Select targets fitting within time budget
    const STEP_DURATIONS: Record<string, number> = {
      READ: 300,
      PRACTICE: 300,
      ASSESS: 180,
    };

    const selectedTargets: Array<{ node: any; steps: string[]; isRemediation: boolean; totalSecs: number }> = [];
    let remainingBudget = timeBudgetSeconds;

    for (const node of orderedTargets) {
      // Check if ASSESS step is possible (requires existing AssessmentSpecification)
      const objIds = (node.nodeObjectives || []).map((no: any) => no.learningObjectiveId);
      const hasSpecs = objIds.length > 0
        ? await this.prisma.assessmentSpecification.findFirst({
            where: { learningObjectiveId: { in: objIds }, active: true },
          })
        : null;

      const steps = ['READ', 'PRACTICE'];
      if (hasSpecs) steps.push('ASSESS');

      const targetSecs = steps.reduce((sum, s) => sum + (STEP_DURATIONS[s] || 300), 0);
      if (targetSecs > remainingBudget) break;

      selectedTargets.push({
        node,
        steps,
        isRemediation: remediationNodes.includes(node),
        totalSecs: targetSecs,
      });
      remainingBudget -= targetSecs;
    }

    // 8. Persist session atomically — sessions start as READY (PLANNED is internal-only)
    const session = await this.prisma.$transaction(async (tx) => {
      const newSession = await tx.learningSession.create({
        data: {
          learnerId,
          structureId: structure.id,
          sessionRequestFingerprint: fingerprint,
          status: SessionStatus.READY,
          timeBudgetSeconds,
        },
      });

      let globalStepSeq = 0;

      for (let targetIdx = 0; targetIdx < selectedTargets.length; targetIdx++) {
        const { node, steps, isRemediation } = selectedTargets[targetIdx];

        const target = await tx.sessionTarget.create({
          data: {
            sessionId: newSession.id,
            curriculumNodeId: node.id,
            sequenceIndex: targetIdx,
            isRemediation,
          },
        });

        for (const stepType of steps) {
          const firstObjectiveId = node.nodeObjectives?.[0]?.learningObjectiveId || null;
          const step = await tx.sessionStep.create({
            data: {
              sessionId: newSession.id,
              targetId: target.id,
              stepType: stepType as SessionStepType,
              sequenceIndex: globalStepSeq++,
              status: SessionStepStatus.PENDING,
              learningObjectiveId: firstObjectiveId,
              estimatedDurationSeconds: STEP_DURATIONS[stepType] || 300,
            },
          });

          if (stepType === 'ASSESS' && firstObjectiveId) {
            // Find active assessment specification for this objective
            const spec = await tx.assessmentSpecification.findFirst({
              where: { learningObjectiveId: firstObjectiveId, active: true },
            });
            if (spec) {
              await tx.assessmentInstance.create({
                data: {
                  sessionStepId: step.id,
                  assessmentSpecificationId: spec.id,
                  learnerId,
                  attemptNumber: 1,
                  status: 'PENDING',
                },
              });
            }
          }
        }
      }

      return tx.learningSession.findUnique({
        where: { id: newSession.id },
        include: {
          targets: {
            orderBy: { sequenceIndex: 'asc' },
            include: { steps: { orderBy: { sequenceIndex: 'asc' } } },
          },
        },
      });
    });

    this.logger.log(`Created session '${session!.id}' with ${selectedTargets.length} targets for learner '${learnerId}'.`);
    return session;
  }
}
