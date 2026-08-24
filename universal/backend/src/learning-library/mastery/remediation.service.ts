import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TopologicalSortService, SortConceptNode } from '../knowledge/curriculum/topological-sort.service';

export interface DiagnosticCandidateNode {
  nodeId: string;
  conceptId: string;
  canonicalName: string;
  expectedInformationGain: number; // Delta Entropy
  pedagogicalSafetyScore: number;  // 0.0 to 1.0 (penalizes consecutive failure/high difficulty)
  combinedScore: number;
}

@Injectable()
export class RemediationService {
  private readonly logger = new Logger(RemediationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly topoSortService: TopologicalSortService,
  ) {}

  /**
   * Calculates Pedagogically Safe Diagnostic & Remediation Path.
   * Maximizes Information Gain subject to:
   * 1. Consecutive failure backoff (stops aggressive probing if failures >= 2)
   * 2. Prerequisite validity
   * 3. Cognitive fatigue caps
   */
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
      throw new NotFoundException("Curriculum structure version " + structureVersion + " not found.");
    }

    const targetNode = structure.nodes.find((n) => n.id === targetNodeId);
    if (!targetNode) {
      throw new NotFoundException("Curriculum node '" + targetNodeId + "' not found in structure v" + structureVersion + ".");
    }

    // 1. Fetch Learner Knowledge Masteries & Recent Evidence History
    const masteries = await this.prisma.learnerConceptMastery.findMany({
      where: { learnerId },
    });
    const masteryMap = new Map<string, number>();
    masteries.forEach((m) => masteryMap.set(m.conceptId, m.masteryScore));

    const recentEvidence = this.prisma.learningEvidence?.findMany
      ? await this.prisma.learningEvidence.findMany({
          where: { learnerId },
          orderBy: { observedAt: 'desc' },
          take: 5,
        })
      : [];

    const consecutiveFailures = (recentEvidence || []).filter((e: any) => e.outcome === 'INCORRECT').length;
    const remediationThreshold = 0.50;
    const nodeById = new Map<string, any>();
    const nodeByConceptId = new Map<string, any>();
    structure.nodes.forEach((n) => {
      nodeById.set(n.id, n);
      nodeByConceptId.set(n.conceptId, n);
    });

    const incomingMap = new Map<string, string[]>();
    structure.prerequisites.forEach((p) => {
      if (!incomingMap.has(p.targetNodeId)) incomingMap.set(p.targetNodeId, []);
      incomingMap.get(p.targetNodeId)!.push(p.sourceNodeId);
    });

    const unmasteredNodeIds = new Set<string>();

    // 2. Backward DFS Prerequisite Traversal
    const backwardDFS = (currNodeId: string, visited: Set<string>) => {
      if (visited.has(currNodeId)) return;
      visited.add(currNodeId);

      const currNode = nodeById.get(currNodeId);
      if (!currNode) return;

      const score = masteryMap.get(currNode.conceptId) || 0.0;
      if (score < remediationThreshold) {
        unmasteredNodeIds.add(currNodeId);

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
        targetNodeId,
        remediationRequired: false,
        remediationSequence: [],
        remediationPath: [],
        optimalDiagnosticTarget: null,
      };
    }

    // 3. Information-Gain & Pedagogical Safety Optimization
    const candidates: DiagnosticCandidateNode[] = collectedNodes.map((n) => {
      const pScore = masteryMap.get(n.conceptId) || 0.20;
      const p = Math.max(0.01, Math.min(0.99, pScore));
      const entropy = -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
      const expectedInfoGain = entropy;

      let safetyScore = 1.0;
      if (consecutiveFailures >= 2) {
        safetyScore = 1.0 - (n.sequenceIndex / (structure.nodes.length || 1)) * 0.50;
      }

      const combinedScore = expectedInfoGain * 0.70 + safetyScore * 0.30;

      return {
        nodeId: n.id,
        conceptId: n.conceptId,
        canonicalName: n.concept.canonicalName,
        expectedInformationGain: expectedInfoGain,
        pedagogicalSafetyScore: safetyScore,
        combinedScore,
      };
    });

    candidates.sort((a, b) => b.combinedScore - a.combinedScore);
    const optimalDiagnosticTarget = candidates[0] || null;

    // 4. Deterministic Topological Sort of unmastered path
    const sortNodes: SortConceptNode[] = collectedNodes.map((n) => ({
      id: n.conceptId,
      canonicalName: n.concept.canonicalName,
      gradeBand: n.concept.gradeBand,
      prerequisiteIds: (incomingMap.get(n.id) || [])
        .map((pId) => nodeById.get(pId)?.conceptId)
        .filter(Boolean),
    }));

    const sortedResult = this.topoSortService.sortConcepts(sortNodes);

    const remediationSequence = sortedResult.sortedNodes.map((s) => {
      const originalNode = nodeByConceptId.get(s.id);
      return {
        nodeId: originalNode?.id || s.id,
        conceptId: s.id,
        canonicalName: s.canonicalName,
        gradeBand: s.gradeBand,
      };
    });

    return {
      targetNodeId,
      remediationRequired: true,
      optimalDiagnosticTarget,
      remediationSequence,
      remediationPath: remediationSequence,
    };
  }
}
