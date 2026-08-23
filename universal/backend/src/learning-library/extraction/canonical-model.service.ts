import { Injectable, Logger } from '@nestjs/common';
import { CanonicalConceptDefinition } from './knowledge-constructor.service';
import { EvidenceBackedRelationship } from './relationship-engine.service';
import { StructureChapter } from './structure-detector.service';
import * as crypto from 'crypto';

export interface CanonicalKnowledgeModel {
  documentId: string;
  concepts: Map<string, CanonicalConceptDefinition>;
  relationships: EvidenceBackedRelationship[];
  provenanceTimestamp: Date;
}

export interface KnowledgeGraphProjection {
  nodes: {
    id: string;
    canonicalName: string;
    normalizedName: string;
    conceptType: string;
    domain: string;
    definition: string;
    metadata: any;
  }[];
  edges: {
    sourceId: string;
    targetId: string;
    relationshipType: string;
    strength: number;
    explanation: string;
  }[];
  conceptChunks: {
    conceptId: string;
    chunkId: string;
    confidence: number;
  }[];
}

export interface RaptorTreeNode {
  id: string;
  level: 'DOCUMENT' | 'CHAPTER' | 'TOPIC' | 'CONCEPT';
  title: string;
  summary: string;
  childNodeIds: string[];
  isRaptorSummary: boolean;
  metadata: any;
}

@Injectable()
export class CanonicalModelService {
  private readonly logger = new Logger(CanonicalModelService.name);

  buildCanonicalModel(
    documentId: string,
    validatedConcepts: CanonicalConceptDefinition[],
    relationships: EvidenceBackedRelationship[],
  ): CanonicalKnowledgeModel {
    const conceptsMap = new Map<string, CanonicalConceptDefinition>();

    for (const concept of validatedConcepts) {
      // Conservative Canonicalization: Disambiguate by canonicalTerm + semanticContext
      const uniqueKey = `${concept.canonicalTerm.toLowerCase()}|${concept.semanticContext.toLowerCase()}`;

      if (conceptsMap.has(uniqueKey)) {
        // Merge provenance sources without destroying distinct concepts
        const existing = conceptsMap.get(uniqueKey)!;
        existing.sourceProvenance.pageNumbers = Array.from(
          new Set([...existing.sourceProvenance.pageNumbers, ...concept.sourceProvenance.pageNumbers]),
        );
        existing.sourceProvenance.blockIds = Array.from(
          new Set([...existing.sourceProvenance.blockIds, ...concept.sourceProvenance.blockIds]),
        );
      } else {
        conceptsMap.set(uniqueKey, concept);
      }
    }

    return {
      documentId,
      concepts: conceptsMap,
      relationships,
      provenanceTimestamp: new Date(),
    };
  }

  projectToKnowledgeGraph(
    model: CanonicalKnowledgeModel,
    chunkIdMap: Map<string, string>, // Maps blockId to ContentChunk DB ID
  ): KnowledgeGraphProjection {
    const nodes = Array.from(model.concepts.values()).map((c) => ({
      id: c.canonicalId,
      canonicalName: c.canonicalTerm,
      normalizedName: c.canonicalTerm.toLowerCase(),
      conceptType: c.conceptType,
      domain: c.semanticContext,
      definition: c.canonicalMeaning,
      metadata: {
        sourceLanguage: c.sourceLanguage,
        sourceTerm: c.sourceTerm,
        localizedTerms: c.localizedTerms,
        difficultyBand: c.difficultyBand,
        sourceProvenance: c.sourceProvenance,
      },
    }));

    const edges = model.relationships.map((r) => ({
      sourceId: r.sourceConceptId,
      targetId: r.targetConceptId,
      relationshipType: r.relationshipType,
      strength: r.strength,
      explanation: JSON.stringify({
        evidenceType: r.evidenceType,
        sourcePage: r.sourcePageNumber,
        sourceBlockId: r.sourceBlockId,
        snippet: r.evidenceSnippet,
      }),
    }));

    const conceptChunks: { conceptId: string; chunkId: string; confidence: number }[] = [];
    for (const c of model.concepts.values()) {
      for (const blockId of c.sourceProvenance.blockIds) {
        const dbChunkId = chunkIdMap.get(blockId);
        if (dbChunkId) {
          conceptChunks.push({
            conceptId: c.canonicalId,
            chunkId: dbChunkId,
            confidence: c.confidence,
          });
        }
      }
    }

    return { nodes, edges, conceptChunks };
  }

  projectToRaptorTree(
    documentTitle: string,
    chapters: StructureChapter[],
    model: CanonicalKnowledgeModel,
  ): RaptorTreeNode[] {
    const treeNodes: RaptorTreeNode[] = [];

    // Document Level Root
    const docNodeId = crypto.randomUUID();
    const chapterNodeIds: string[] = [];

    for (const chapter of chapters) {
      const chapNodeId = crypto.randomUUID();
      chapterNodeIds.push(chapNodeId);
      const topicNodeIds: string[] = [];

      for (const topic of chapter.topics) {
        const topicNodeId = crypto.randomUUID();
        topicNodeIds.push(topicNodeId);

        // Topic Summary Node
        treeNodes.push({
          id: topicNodeId,
          level: 'TOPIC',
          title: topic.title,
          summary: `Hierarchical topic overview for '${topic.title}'.`,
          childNodeIds: [],
          isRaptorSummary: true,
          metadata: { orderIndex: topic.orderIndex, chapterTitle: chapter.title },
        });
      }

      // Chapter Summary Node
      treeNodes.push({
        id: chapNodeId,
        level: 'CHAPTER',
        title: chapter.title,
        summary: `Hierarchical chapter summary for '${chapter.title}'. Contains ${chapter.topics.length} topics.`,
        childNodeIds: topicNodeIds,
        isRaptorSummary: true,
        metadata: { orderIndex: chapter.orderIndex, missingStructure: chapter.missingStructure },
      });
    }

    // Root Document Node
    treeNodes.push({
      id: docNodeId,
      level: 'DOCUMENT',
      title: documentTitle,
      summary: `Master curriculum hierarchical index for '${documentTitle}'. Contains ${chapters.length} chapters.`,
      childNodeIds: chapterNodeIds,
      isRaptorSummary: true,
      metadata: { totalChapters: chapters.length },
    });

    return treeNodes;
  }
}
