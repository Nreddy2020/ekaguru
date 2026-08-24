import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GradeBand, ConceptRelationshipType } from '@prisma/client';

export interface LearningUnit {
  conceptId: string;
  canonicalName: string;
  domain: string;
  gradeBand: GradeBand;
  difficultyBand: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  prerequisiteConceptIds: string[];
  componentConceptIds: string[];
  definition: string;
  sourceSnippet?: string;
  sourceLanguage: string;
  misconceptionCatalogs: {
    distractorKey: string;
    description: string;
    taxonomyType: 'CONCEPTUAL' | 'PREREQUISITE' | 'COMPUTATIONAL' | 'LINGUISTIC' | 'UNATTRIBUTED';
  }[];
}

@Injectable()
export class KnowledgeActivatorService {
  private readonly logger = new Logger(KnowledgeActivatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Strictly READ-ONLY projection: Converts M2 Canonical Concepts into Active Pedagogical Learning Units.
   * NEVER executes mutations on M2 tables.
   */
  async getLearningUnit(conceptId: string): Promise<LearningUnit> {
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
      include: {
        outgoing: {
          include: { target: { select: { id: true, canonicalName: true } } },
        },
        incoming: {
          include: { source: { select: { id: true, canonicalName: true } } },
        },
        sourceChunks: {
          include: { chunk: true },
          take: 1,
        },
      },
    });

    if (!concept) {
      throw new NotFoundException("Canonical Concept '" + conceptId + "' not found in M2 store.");
    }

    // Prerequisite concepts (incoming edges of type PREREQUISITE: source -> target)
    const prerequisiteConceptIds = (concept.incoming || [])
      .filter((r) => r.relationshipType === ConceptRelationshipType.PREREQUISITE)
      .map((r) => r.sourceId);

    // Component concepts (outgoing edges of type COMPONENT_OF: source -> target)
    const componentConceptIds = (concept.outgoing || [])
      .filter((r) => r.relationshipType === ConceptRelationshipType.COMPONENT_OF)
      .map((r) => r.targetId);

    // Infer difficulty band
    let difficultyBand: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'INTERMEDIATE';
    if (concept.gradeBand === 'EARLY_CHILDHOOD' || concept.gradeBand === 'PRIMARY') {
      difficultyBand = 'BEGINNER';
    } else if (concept.gradeBand === 'ADVANCED' || concept.gradeBand === 'HIGH_SCHOOL') {
      difficultyBand = 'ADVANCED';
    }

    const firstChunk = concept.sourceChunks?.[0]?.chunk;
    const sourceSnippet = firstChunk?.content?.slice(0, 240) || concept.definition || '';

    return {
      conceptId: concept.id,
      canonicalName: concept.canonicalName,
      domain: concept.domain || 'General',
      gradeBand: concept.gradeBand,
      difficultyBand,
      prerequisiteConceptIds,
      componentConceptIds,
      definition: concept.definition || '',
      sourceSnippet,
      sourceLanguage: (concept.metadata as any)?.sourceLanguage || 'en',
      misconceptionCatalogs: (concept.metadata as any)?.misconceptionPatterns || [],
    };
  }

  async getLearningUnitsForCurriculumNode(curriculumNodeId: string): Promise<LearningUnit> {
    const node = await this.prisma.curriculumNode.findUnique({
      where: { id: curriculumNodeId },
      select: { conceptId: true },
    });

    if (!node) {
      throw new NotFoundException("CurriculumNode '" + curriculumNodeId + "' not found.");
    }

    return this.getLearningUnit(node.conceptId);
  }
}
