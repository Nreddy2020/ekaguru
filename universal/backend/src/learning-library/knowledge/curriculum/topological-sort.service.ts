import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GradeBand } from '@prisma/client';

export interface SortConceptNode {
  id: string;
  canonicalName: string;
  gradeBand: GradeBand;
  prerequisiteIds: string[];
}

export interface TopologicalSortResult {
  sortedNodes: SortConceptNode[];
  nodeDepths: Map<string, number>;
}

@Injectable()
export class TopologicalSortService {
  private readonly logger = new Logger(TopologicalSortService.name);

  private readonly gradeBandOrder: Record<GradeBand, number> = {
    EARLY_CHILDHOOD: 1,
    PRIMARY: 2,
    MIDDLE_SCHOOL: 3,
    HIGH_SCHOOL: 4,
    ADVANCED: 5,
  };

  sortConcepts(nodes: SortConceptNode[]): TopologicalSortResult {
    const nodeMap = new Map<string, SortConceptNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Calculate indegrees and adjacency graph
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      adjList.set(n.id, []);
    });

    nodes.forEach((n) => {
      n.prerequisiteIds.forEach((prereqId) => {
        if (nodeMap.has(prereqId)) {
          adjList.get(prereqId)!.push(n.id);
          inDegree.set(n.id, (inDegree.get(n.id) || 0) + 1);
        }
      });
    });

    // Calculate Prerequisite Depth for tie-breaking
    const nodeDepths = this.calculateDepths(nodes, nodeMap);

    // Initial queue: nodes with indegree == 0
    let readyNodes: SortConceptNode[] = nodes.filter((n) => inDegree.get(n.id) === 0);
    this.sortTieBreaker(readyNodes, nodeDepths);

    const sortedNodes: SortConceptNode[] = [];

    while (readyNodes.length > 0) {
      // Pick the top node according to deterministic 4-tier tie-breaker
      const curr = readyNodes.shift()!;
      sortedNodes.push(curr);

      const neighbors = adjList.get(curr.id) || [];
      for (const neighborId of neighbors) {
        const currentInDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, currentInDegree);

        if (currentInDegree === 0) {
          const neighborNode = nodeMap.get(neighborId)!;
          readyNodes.push(neighborNode);
        }
      }

      // Re-sort ready queue using 4-tier tie-breaker
      this.sortTieBreaker(readyNodes, nodeDepths);
    }

    if (sortedNodes.length !== nodes.length) {
      throw new BadRequestException('Prerequisite dependency cycle detected during curriculum topological sorting.');
    }

    this.logger.log(`Deterministically sorted ${sortedNodes.length} concepts for universal curriculum backbone.`);
    return { sortedNodes, nodeDepths };
  }

  private sortTieBreaker(nodes: SortConceptNode[], depths: Map<string, number>): void {
    nodes.sort((a, b) => {
      // 1. Prerequisite Depth (Ascending)
      const depthA = depths.get(a.id) || 0;
      const depthB = depths.get(b.id) || 0;
      if (depthA !== depthB) return depthA - depthB;

      // 2. GradeBand Order (Ascending)
      const gA = this.gradeBandOrder[a.gradeBand] || 99;
      const gB = this.gradeBandOrder[b.gradeBand] || 99;
      if (gA !== gB) return gA - gB;

      // 3. Canonical Name (Alphabetical A-Z)
      const nameComp = a.canonicalName.localeCompare(b.canonicalName);
      if (nameComp !== 0) return nameComp;

      // 4. Concept ID (Alphabetical A-Z)
      return a.id.localeCompare(b.id);
    });
  }

  private calculateDepths(nodes: SortConceptNode[], nodeMap: Map<string, SortConceptNode>): Map<string, number> {
    const depths = new Map<string, number>();

    const getDepth = (nodeId: string, visited: Set<string>): number => {
      if (depths.has(nodeId)) return depths.get(nodeId)!;
      if (visited.has(nodeId)) return 0; // Cycle safety fallback

      visited.add(nodeId);
      const node = nodeMap.get(nodeId);
      if (!node || node.prerequisiteIds.length === 0) {
        depths.set(nodeId, 0);
        return 0;
      }

      let maxPrereqDepth = 0;
      for (const pId of node.prerequisiteIds) {
        if (nodeMap.has(pId)) {
          maxPrereqDepth = Math.max(maxPrereqDepth, getDepth(pId, visited));
        }
      }

      const depth = maxPrereqDepth + 1;
      depths.set(nodeId, depth);
      return depth;
    };

    nodes.forEach((n) => getDepth(n.id, new Set()));
    return depths;
  }
}
