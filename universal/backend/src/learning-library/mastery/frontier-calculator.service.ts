import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FrontierCalculatorService {
  private readonly logger = new Logger(FrontierCalculatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateFrontier(learnerId: string, structureVersion: number): Promise<any> {
    // 1. Fetch CurriculumStructure
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
                  select: { id: true, code: true, complexityLevel: true, bloomTaxonomy: true },
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

    // 2. Fetch Learner Concept and Objective Masteries
    const conceptMasteries = await this.prisma.learnerConceptMastery.findMany({
      where: { learnerId },
    });
    const conceptMasteryMap = new Map<string, number>();
    conceptMasteries.forEach((m) => conceptMasteryMap.set(m.conceptId, m.masteryScore));

    const objMasteries = await this.prisma.learnerObjectiveMastery.findMany({
      where: { learnerId },
    });
    const objMasteryMap = new Map<string, number>();
    objMasteries.forEach((m) => objMasteryMap.set(m.learningObjectiveId, m.masteryScore));

    const masteryThreshold = 0.75;

    // Build Prerequisite Graph maps (targetNodeId -> set of sourceNodeIds)
    const incomingPrereqsMap = new Map<string, Set<string>>();
    structure.prerequisites.forEach((p) => {
      if (!incomingPrereqsMap.has(p.targetNodeId)) incomingPrereqsMap.set(p.targetNodeId, new Set());
      incomingPrereqsMap.get(p.targetNodeId)!.add(p.sourceNodeId);
    });

    const nodeById = new Map<string, any>();
    structure.nodes.forEach((n) => nodeById.set(n.id, n));

    // Helper to evaluate Transitive Prerequisite Closure Readiness
    const isTransitivePrereqSatisfied = (nodeId: string, visited: Set<string>): boolean => {
      if (visited.has(nodeId)) return true; // Cycle safety
      visited.add(nodeId);

      const prereqNodeIds = incomingPrereqsMap.get(nodeId);
      if (!prereqNodeIds || prereqNodeIds.size === 0) return true;

      for (const pNodeId of prereqNodeIds) {
        const pNode = nodeById.get(pNodeId);
        if (!pNode) continue;
        const pConceptScore = conceptMasteryMap.get(pNode.conceptId) || 0.0;
        if (pConceptScore < masteryThreshold) return false;

        // Check transitive prerequisites
        if (!isTransitivePrereqSatisfied(pNodeId, visited)) return false;
      }

      return true;
    };

    const frontierNodes: any[] = [];

    // Evaluate each CurriculumNode for Frontier Eligibility
    for (const node of structure.nodes) {
      const conceptScore = conceptMasteryMap.get(node.conceptId) || 0.0;

      // Node itself must NOT be fully mastered yet
      if (conceptScore >= masteryThreshold) continue;

      // Rule 1: All transitive incoming prerequisite concepts must be satisfied
      if (!isTransitivePrereqSatisfied(node.id, new Set())) continue;

      // Rule 2: Objective-level readiness check.
      // Enforce sequenced learning objective readiness within the concept node:
      // An objective is ready if it is the first objective (lowest sequenceIndex) OR if its predecessor is mastered.
      // A node is eligible only if there is at least one objective that is ready and unmastered (or the node has no objectives).
      const sortedNodeObjectives = [...node.nodeObjectives].sort((a, b) => a.sequenceIndex - b.sequenceIndex);

      const isObjectiveReady = (no: any, index: number): boolean => {
        if (index === 0) return true; // First objective is always ready to be attempted
        const prevNo = sortedNodeObjectives[index - 1];
        const prevScore = objMasteryMap.get(prevNo.learningObjectiveId) || 0.0;
        return prevScore >= masteryThreshold;
      };

      const hasReadyUnmasteredObj = sortedNodeObjectives.some((no, index) => {
        const score = objMasteryMap.get(no.learningObjectiveId) || 0.0;
        const isMastered = score >= masteryThreshold;
        return !isMastered && isObjectiveReady(no, index);
      });

      const isEligible = sortedNodeObjectives.length === 0 || hasReadyUnmasteredObj;

      if (isEligible) {
        frontierNodes.push(node);
      }
    }

    // Clean stale frontier records not in the newly computed active list
    const activeFrontierNodeIds = frontierNodes.map((fn) => fn.id);
    await this.prisma.learnerCurriculumFrontier.deleteMany({
      where: {
        learnerId,
        structureId: structure.id,
        currentNodeId: { notIn: activeFrontierNodeIds },
      },
    });

    // Cache / Upsert derived frontier records in LearnerCurriculumFrontier
    for (const fNode of frontierNodes) {
      await this.prisma.learnerCurriculumFrontier.upsert({
        where: {
          learnerId_structureId_currentNodeId: {
            learnerId,
            structureId: structure.id,
            currentNodeId: fNode.id,
          },
        },
        create: {
          learnerId,
          structureId: structure.id,
          currentNodeId: fNode.id,
          isRemediation: false,
        },
        update: {
          updatedAt: new Date(),
        },
      });
    }

    this.logger.log(`Computed ${frontierNodes.length} active frontier nodes for learner '${learnerId}' on structure v${structureVersion}`);
    return {
      learnerId,
      structureVersion,
      frontierNodes,
    };
  }
}
