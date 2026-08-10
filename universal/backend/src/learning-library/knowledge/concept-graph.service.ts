import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConceptRelationshipType } from '@prisma/client';

export interface CreateRelationshipDto {
  sourceId: string;
  targetId: string;
  relationshipType: ConceptRelationshipType;
  strength?: number;
  explanation?: string;
}

@Injectable()
export class ConceptGraphService {
  private readonly logger = new Logger(ConceptGraphService.name);

  constructor(private readonly prisma: PrismaService) {}

  async addRelationship(dto: CreateRelationshipDto): Promise<any> {
    const { sourceId, targetId, relationshipType, strength = 1.0, explanation } = dto;

    if (sourceId === targetId) {
      throw new BadRequestException('A concept cannot have a relationship with itself.');
    }

    const [source, target] = await Promise.all([
      this.prisma.concept.findUnique({ where: { id: sourceId } }),
      this.prisma.concept.findUnique({ where: { id: targetId } }),
    ]);

    if (!source) throw new NotFoundException(`Source concept '${sourceId}' not found.`);
    if (!target) throw new NotFoundException(`Target concept '${targetId}' not found.`);

    // Check DAG cycle for PREREQUISITE and EVOLUTION_OF relationships
    if (relationshipType === ConceptRelationshipType.PREREQUISITE || relationshipType === ConceptRelationshipType.EVOLUTION_OF) {
      const wouldCreateCycle = await this.detectCycle(sourceId, targetId, relationshipType);
      if (wouldCreateCycle) {
        throw new BadRequestException(`Adding ${relationshipType} relationship from '${source.canonicalName}' to '${target.canonicalName}' creates a directed cyclic dependency.`);
      }
    }

    const rel = await this.prisma.conceptRelationship.upsert({
      where: {
        sourceId_targetId_relationshipType: {
          sourceId,
          targetId,
          relationshipType,
        },
      },
      create: {
        sourceId,
        targetId,
        relationshipType,
        strength,
        explanation: explanation || `${source.canonicalName} -> ${target.canonicalName} (${relationshipType})`,
      },
      update: {
        strength,
        explanation,
      },
    });

    this.logger.log(`Added relationship ${source.canonicalName} -[${relationshipType}]-> ${target.canonicalName}`);
    return rel;
  }

  private async detectCycle(sourceId: string, targetId: string, relType: ConceptRelationshipType): Promise<boolean> {
    // DFS from targetId to see if we can reach sourceId using edges of the same type
    const visited = new Set<string>();
    const stack: string[] = [targetId];

    while (stack.length > 0) {
      const curr = stack.pop()!;
      if (curr === sourceId) return true; // Cycle detected!

      if (!visited.has(curr)) {
        visited.add(curr);
        const outgoing = await this.prisma.conceptRelationship.findMany({
          where: {
            sourceId: curr,
            relationshipType: relType,
          },
          select: { targetId: true },
        });

        for (const out of outgoing) {
          if (!visited.has(out.targetId)) {
            stack.push(out.targetId);
          }
        }
      }
    }

    return false;
  }

  async getConceptGraph(conceptId: string, userLearnerIds: string[] | 'ALL' = []): Promise<any> {
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
      include: {
        objectives: true,
        outgoing: {
          include: {
            target: {
              select: { id: true, canonicalName: true, domain: true, gradeBand: true },
            },
          },
        },
        incoming: {
          include: {
            source: {
              select: { id: true, canonicalName: true, domain: true, gradeBand: true },
            },
          },
        },
        sourceChunks: {
          include: {
            chunk: {
              include: {
                document: {
                  include: {
                    material: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!concept) {
      throw new NotFoundException(`Concept with ID '${conceptId}' not found.`);
    }

    // Filter evidence metric by user ownership (ZERO private chunk text or learner IDs leaked)
    const totalSources = concept.sourceChunks.length;
    const userAuthorizedSources = concept.sourceChunks.filter((sc) =>
      userLearnerIds === 'ALL' || (Array.isArray(userLearnerIds) && userLearnerIds.includes(sc.chunk.document.material.learnerId)),
    ).length;

    return {
      concept: {
        id: concept.id,
        canonicalName: concept.canonicalName,
        normalizedName: concept.normalizedName,
        conceptType: concept.conceptType,
        domain: concept.domain,
        gradeBand: concept.gradeBand,
        definition: concept.definition,
        createdAt: concept.createdAt,
      },
      objectives: concept.objectives.map((o) => ({
        id: o.id,
        code: o.code,
        description: o.description,
        complexityLevel: o.complexityLevel,
        bloomTaxonomy: o.bloomTaxonomy,
      })),
      relationships: [
        ...concept.outgoing.map((r) => ({
          id: r.id,
          direction: 'OUTGOING',
          relationshipType: r.relationshipType,
          relatedConcept: r.target,
          strength: r.strength,
        })),
        ...concept.incoming.map((r) => ({
          id: r.id,
          direction: 'INCOMING',
          relationshipType: r.relationshipType,
          relatedConcept: r.source,
          strength: r.strength,
        })),
      ],
      evidenceSummary: {
        totalSources,
        userAuthorizedSources,
      },
    };
  }
}
