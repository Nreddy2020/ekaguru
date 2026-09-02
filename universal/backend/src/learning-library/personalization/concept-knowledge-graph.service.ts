import { Injectable, Logger } from '@nestjs/common';
import { CanonicalEvidencePack } from '../knowledge/canonical-evidence-pack.service';

export type RelationshipType = 'PREREQUISITE_OF' | 'BUILDS_UPON' | 'REINFORCES' | 'CROSS_SUBJECT_ANALOGY';

export interface ConceptNode {
  conceptId: string;
  name: string;
  bookId: string;
  chapterNumber: number;
  primaryPhysicalPage: number;
  definition: string;
}

export interface ConceptEdge {
  sourceConceptId: string;
  targetConceptId: string;
  relationship: RelationshipType;
  strengthWeight: number; // 0.0 to 1.0
}

export interface KnowledgeGraphTopology {
  totalNodes: number;
  totalEdges: number;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

@Injectable()
export class CrossChapterConceptKnowledgeGraphService {
  private readonly logger = new Logger(CrossChapterConceptKnowledgeGraphService.name);
  private nodes: Map<string, ConceptNode> = new Map();
  private edges: ConceptEdge[] = [];

  constructor() {
    this.seedDefaultKnowledgeGraph();
  }

  private seedDefaultKnowledgeGraph(): void {
    // Seed core cross-chapter concepts
    const seedNodes: ConceptNode[] = [
      { conceptId: 'C0101', name: 'Living Things', bookId: 'evs-class-5', chapterNumber: 1, primaryPhysicalPage: 3, definition: 'Organisms that grow, breathe, and reproduce.' },
      { conceptId: 'C0102', name: 'Growth Continuum', bookId: 'evs-class-5', chapterNumber: 1, primaryPhysicalPage: 4, definition: 'Continuous physical development over time.' },
      { conceptId: 'C0201', name: 'Skeletal System', bookId: 'evs-class-5', chapterNumber: 2, primaryPhysicalPage: 8, definition: 'Internal framework supporting living movement.' },
      { conceptId: 'M0301', name: 'Area Calculation', bookId: 'maths-class-5', chapterNumber: 3, primaryPhysicalPage: 18, definition: 'Quantifying space enclosed in living bounds.' },
      { conceptId: 'S0101', name: 'Nutritional Energy', bookId: 'science-class-6', chapterNumber: 1, primaryPhysicalPage: 5, definition: 'Chemical intake sustaining living organism growth.' },
    ];

    seedNodes.forEach((n) => this.nodes.set(n.conceptId, n));

    // Seed cross-chapter & cross-subject dependency edges
    this.edges = [
      { sourceConceptId: 'C0101', targetConceptId: 'C0102', relationship: 'PREREQUISITE_OF', strengthWeight: 0.95 },
      { sourceConceptId: 'C0101', targetConceptId: 'C0201', relationship: 'BUILDS_UPON', strengthWeight: 0.85 },
      { sourceConceptId: 'C0101', targetConceptId: 'S0101', relationship: 'REINFORCES', strengthWeight: 0.90 },
      { sourceConceptId: 'C0102', targetConceptId: 'M0301', relationship: 'CROSS_SUBJECT_ANALOGY', strengthWeight: 0.80 },
    ];
  }

  public registerEvidencePackConcepts(evidencePack: CanonicalEvidencePack): void {
    for (const c of evidencePack.concepts) {
      this.nodes.set(c.id, {
        conceptId: c.id,
        name: c.name,
        bookId: evidencePack.bookId,
        chapterNumber: evidencePack.chapterNumber,
        primaryPhysicalPage: c.primaryPhysicalPage,
        definition: c.definition,
      });
    }
  }

  public getPrerequisites(conceptId: string): ConceptNode[] {
    const prereqEdges = this.edges.filter((e) => e.targetConceptId === conceptId && e.relationship === 'PREREQUISITE_OF');
    return prereqEdges.map((e) => this.nodes.get(e.sourceConceptId)).filter(Boolean) as ConceptNode[];
  }

  public getDependents(conceptId: string): ConceptNode[] {
    const dependentEdges = this.edges.filter((e) => e.sourceConceptId === conceptId);
    return dependentEdges.map((e) => this.nodes.get(e.targetConceptId)).filter(Boolean) as ConceptNode[];
  }

  public getTopology(): KnowledgeGraphTopology {
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }
}
