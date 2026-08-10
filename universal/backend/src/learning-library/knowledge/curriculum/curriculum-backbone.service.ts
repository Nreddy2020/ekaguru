import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TopologicalSortService, SortConceptNode } from './topological-sort.service';
import { CurriculumStatus, ConceptRelationshipType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class CurriculumBackboneService {
  private readonly logger = new Logger(CurriculumBackboneService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly topoSortService: TopologicalSortService,
  ) {}

  generateInputFingerprint(domain: string, activeConcepts: any[]): string {
    const conceptIds = activeConcepts.map((c) => c.id).sort().join(',');

    const edgeStrings: string[] = [];
    activeConcepts.forEach((c) => {
      c.outgoing.forEach((rel: any) => {
        edgeStrings.push(`${rel.sourceId}:${rel.relationshipType}:${rel.targetId}`);
      });
    });
    edgeStrings.sort();

    const objIds: string[] = [];
    activeConcepts.forEach((c) => {
      c.objectives.forEach((o: any) => {
        objIds.push(`${o.id}:${o.complexityLevel}`);
      });
    });
    objIds.sort();

    const rawPayload = [domain, conceptIds, edgeStrings.join('|'), objIds.join('|'), 'policy-v1'].join(' :: ');
    return crypto.createHash('sha256').update(rawPayload).digest('hex');
  }

  async generateUniversalBackbone(domain: string = 'General', createdBy: string = 'SYSTEM'): Promise<any> {
    // 1. Fetch ACTIVE concepts ONLY (Exclude RETIRED concepts by default)
    const activeConcepts = await this.prisma.concept.findMany({
      where: {
        domain,
        status: 'ACTIVE',
      },
      include: {
        objectives: true,
        outgoing: {
          where: {
            relationshipType: {
              in: [ConceptRelationshipType.PREREQUISITE, ConceptRelationshipType.EVOLUTION_OF],
            },
          },
        },
      },
    });

    if (activeConcepts.length === 0) {
      throw new BadRequestException(`No active concepts found for domain '${domain}'.`);
    }

    // 2. Compute Deterministic Source Graph Fingerprint
    const inputFingerprint = this.generateInputFingerprint(domain, activeConcepts);

    // 3. IDEMPOTENCY CHECK: Return existing cached CurriculumStructure if exact graph fingerprint matches
    const existingCached = await this.prisma.curriculumStructure.findFirst({
      where: {
        domain,
        inputFingerprint,
      },
    });

    if (existingCached) {
      this.logger.log(`IDEMPOTENCY HIT: Returning existing cached CurriculumStructure v${existingCached.version} for fingerprint ${inputFingerprint.slice(0, 10)}...`);
      return this.getBackboneByVersion(existingCached.version);
    }

    // 4. Prepare nodes for Topological Sorting
    const sortNodes: SortConceptNode[] = activeConcepts.map((c) => ({
      id: c.id,
      canonicalName: c.canonicalName,
      gradeBand: c.gradeBand,
      prerequisiteIds: c.outgoing
        .filter((r) => r.relationshipType === ConceptRelationshipType.PREREQUISITE || r.relationshipType === ConceptRelationshipType.EVOLUTION_OF)
        .map((r) => r.targetId),
    }));

    // 5. Execute Deterministic Topological Sort
    const { sortedNodes } = this.topoSortService.sortConcepts(sortNodes);

    // 6. Calculate Next Curriculum Version
    const lastStructure = await this.prisma.curriculumStructure.findFirst({
      where: { domain },
      orderBy: { version: 'desc' },
    });
    const nextVersion = lastStructure ? lastStructure.version + 1 : 1;

    // 7. Create CurriculumStructure snapshot
    const structure = await this.prisma.curriculumStructure.create({
      data: {
        version: nextVersion,
        name: `EKAGURU Universal Curriculum (v${nextVersion})`,
        domain,
        inputFingerprint,
        status: CurriculumStatus.PUBLISHED,
        createdBy,
      },
    });

    // 8. Create CurriculumNode, CurriculumNodeObjective, and CurriculumPrerequisite records
    const nodeMap = new Map<string, any>();

    for (let index = 0; index < sortedNodes.length; index++) {
      const nodeData = sortedNodes[index];
      const concept = activeConcepts.find((c) => c.id === nodeData.id)!;

      const currNode = await this.prisma.curriculumNode.create({
        data: {
          structureId: structure.id,
          conceptId: concept.id,
          gradeBand: concept.gradeBand,
          sequenceIndex: index + 1,
          masteryDepthLevel: concept.objectives.length > 0 ? Math.max(...concept.objectives.map((o) => o.complexityLevel)) : 1,
        },
      });

      nodeMap.set(concept.id, currNode);

      // Create CurriculumNodeObjective join records
      for (let objIdx = 0; objIdx < concept.objectives.length; objIdx++) {
        const obj = concept.objectives[objIdx];
        await this.prisma.curriculumNodeObjective.create({
          data: {
            curriculumNodeId: currNode.id,
            learningObjectiveId: obj.id,
            sequenceIndex: objIdx + 1,
          },
        });
      }
    }

    // Create CurriculumPrerequisite snapshot edges
    for (const concept of activeConcepts) {
      const sourceNode = nodeMap.get(concept.id);
      for (const rel of concept.outgoing) {
        const targetNode = nodeMap.get(rel.targetId);
        if (sourceNode && targetNode) {
          await this.prisma.curriculumPrerequisite.create({
            data: {
              structureId: structure.id,
              sourceNodeId: sourceNode.id,
              targetNodeId: targetNode.id,
              prerequisiteType: rel.relationshipType,
              confidence: rel.strength,
            },
          });
        }
      }
    }

    this.logger.log(`Generated Published Universal Curriculum Structure v${nextVersion} with ${sortedNodes.length} nodes.`);
    return this.getBackboneByVersion(nextVersion);
  }

  async getBackboneByVersion(version: number): Promise<any> {
    const structure = await this.prisma.curriculumStructure.findUnique({
      where: { version },
      include: {
        nodes: {
          orderBy: { sequenceIndex: 'asc' },
          include: {
            concept: {
              select: { id: true, canonicalName: true, normalizedName: true, domain: true, gradeBand: true, status: true },
            },
            nodeObjectives: {
              include: { learningObjective: true },
              orderBy: { sequenceIndex: 'asc' },
            },
          },
        },
        prerequisites: {
          include: {
            sourceNode: { include: { concept: { select: { canonicalName: true } } } },
            targetNode: { include: { concept: { select: { canonicalName: true } } } },
          },
        },
        boardMappings: true,
      },
    });

    if (!structure) {
      throw new NotFoundException(`Curriculum structure version ${version} not found.`);
    }

    return structure;
  }
}
