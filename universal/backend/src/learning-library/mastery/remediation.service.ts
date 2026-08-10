import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TopologicalSortService, SortConceptNode } from '../knowledge/curriculum/topological-sort.service';

@Injectable()
export class RemediationService {
  private readonly logger = new Logger(RemediationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly topoSortService: TopologicalSortService,
  ) {}

  async calculateRemediationPath(learnerId: string, structureVersion: number, targetNodeId: string): Promise<any> {
    const structure = await this.prisma.curriculumStructure.findUnique({
      where: { version: structureVersion },
      include: {
        nodes: {
          include: {
            concept: { select: { id: true, canonicalName: true, gradeBand: true } },
          },
        },
        prerequisites: true,
      },
    });

    if (!structure) {
      throw new NotFoundException(`Curriculum structure version ${structureVersion} not found.`);
    }

    const targetNode = structure.nodes.find((n) => n.id === targetNodeId);
    if (!targetNode) {
      throw new NotFoundException(`Curriculum node '${targetNodeId}' not found in structure v${structureVersion}.`);
    }

    // Fetch Learner Concept Mastery
    const masteries = await this.prisma.learnerConceptMastery.findMany({
      where: { learnerId },
    });
    const masteryMap = new Map<string, number>();
    masteries.forEach((m) => masteryMap.set(m.conceptId, m.masteryScore));

    const remediationThreshold = 0.50;
    const nodeById = new Map<string, any>();
    structure.nodes.forEach((n) => nodeById.set(n.id, n));

    // Incoming prerequisites map (targetNodeId -> set of sourceNodeIds)
    const incomingMap = new Map<string, string[]>();
    structure.prerequisites.forEach((p) => {
      if (!incomingMap.has(p.targetNodeId)) incomingMap.set(p.targetNodeId, []);
      incomingMap.get(p.targetNodeId)!.push(p.sourceNodeId);
    });

    const unmasteredNodeIds = new Set<string>();

    // Step 1: Backward DFS Traversal to collect unmastered prerequisite nodes
    const backwardDFS = (currNodeId: string, visited: Set<string>) => {
      if (visited.has(currNodeId)) return;
      visited.add(currNodeId);

      const currNode = nodeById.get(currNodeId);
      if (!currNode) return;

      const score = masteryMap.get(currNode.conceptId) || 0.0;
      if (score < remediationThreshold) {
        unmasteredNodeIds.add(currNodeId);

        // Traverse incoming prerequisites
        const prereqSourceIds = incomingMap.get(currNodeId) || [];
        for (const prereqSourceId of prereqSourceIds) {
          backwardDFS(prereqSourceId, visited);
        }
      }
    };

    backwardDFS(targetNodeId, new Set());

    const collectedNodes = Array.from(unmasteredNodeIds).map((id) => nodeById.get(id)!);

    if (collectedNodes.length === 0) {
      return {
        learnerId,
        targetNodeId,
        remediationSequence: [],
      };
    }

    // Step 2: Reorder collected nodes using Phase 2.6 4-tier deterministic tie-breaking topological sort
    const sortInputNodes: SortConceptNode[] = collectedNodes.map((n) => ({
      id: n.id,
      canonicalName: n.concept.canonicalName,
      gradeBand: n.gradeBand,
      prerequisiteIds: (incomingMap.get(n.id) || []).filter((pId) => unmasteredNodeIds.has(pId)),
    }));

    const { sortedNodes } = this.topoSortService.sortConcepts(sortInputNodes);

    const remediationSequence = sortedNodes.map((sn, idx) => {
      const originalNode = nodeById.get(sn.id)!;
      return {
        remediationStepIndex: idx + 1,
        nodeId: originalNode.id,
        conceptId: originalNode.conceptId,
        canonicalName: originalNode.concept.canonicalName,
        gradeBand: originalNode.gradeBand,
        currentMasteryScore: masteryMap.get(originalNode.conceptId) || 0.0,
      };
    });

    this.logger.log(`Computed deterministic remediation sequence of ${remediationSequence.length} nodes for learner '${learnerId}'.`);
    return {
      learnerId,
      targetNodeId,
      remediationSequence,
    };
  }
}
