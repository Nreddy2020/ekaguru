import { Injectable, Logger } from '@nestjs/common';
import { ConceptRelationshipType } from '@prisma/client';
import { CanonicalConceptDefinition } from './knowledge-constructor.service';
import { ExtractedPage } from './document-extractor.interface';
import * as crypto from 'crypto';

export type EvidenceType = 'EXPLICIT' | 'STRUCTURAL' | 'SEMANTIC_INFERENCE' | 'PEDAGOGICAL_INFERENCE';

export interface EvidenceBackedRelationship {
  id: string;
  sourceConceptId: string;
  targetConceptId: string;
  sourceConceptTerm: string;
  targetConceptTerm: string;
  relationshipType: ConceptRelationshipType;
  evidenceType: EvidenceType;
  strength: number;
  evidenceSnippet: string;
  sourcePageNumber: number;
  sourceBlockId: string;
  confidence: number;
}

@Injectable()
export class RelationshipEngineService {
  private readonly logger = new Logger(RelationshipEngineService.name);

  inferRelationships(
    concepts: CanonicalConceptDefinition[],
    pages: ExtractedPage[],
  ): EvidenceBackedRelationship[] {
    const relationships: EvidenceBackedRelationship[] = [];
    const conceptMap = new Map<string, CanonicalConceptDefinition>();
    for (const c of concepts) {
      conceptMap.set(c.canonicalTerm.toLowerCase(), c);
      conceptMap.set(c.sourceTerm.toLowerCase(), c);
    }

    // 1. Explicit Textual Link Extraction (e.g. "Digestion depends on Enzymes" or "Mouth is part of Digestive System")
    for (const page of pages) {
      for (const block of page.blocks) {
        const text = block.text;

        for (const [termA, conceptA] of conceptMap.entries()) {
          for (const [termB, conceptB] of conceptMap.entries()) {
            if (conceptA.canonicalId === conceptB.canonicalId) continue;

            // Pattern A: "A is a component of B" / "A is part of B"
            const componentPattern = new RegExp(`\\b${this.escapeRegex(termA)}\\b\\s+(?:is a component of|is part of|is inside|is contained in)\\s+\\b${this.escapeRegex(termB)}\\b`, 'i');
            if (componentPattern.test(text)) {
              relationships.push(this.createRelationship(
                conceptA,
                conceptB,
                ConceptRelationshipType.COMPONENT_OF,
                'EXPLICIT',
                0.95,
                text,
                page.pageNumber,
                block.id || 'b0',
              ));
            }

            // Pattern B: "B requires A" / "B depends on A" / "Before learning B, understand A" -> PREREQUISITE
            const prereqPattern = new RegExp(`\\b${this.escapeRegex(termB)}\\b\\s+(?:requires|depends on|builds upon|presupposes)\\s+\\b${this.escapeRegex(termA)}\\b`, 'i');
            if (prereqPattern.test(text)) {
              relationships.push(this.createRelationship(
                conceptA, // source (prerequisite)
                conceptB, // target (dependent)
                ConceptRelationshipType.PREREQUISITE,
                'EXPLICIT',
                0.95,
                text,
                page.pageNumber,
                block.id || 'b0',
              ));
            }
          }
        }
      }
    }

    // 2. Structural Inference (e.g. Nested Subtopic Concepts inside Topic Chunks)
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const c1 = concepts[i];
        const c2 = concepts[j];

        // If on same page and share provenance block
        const sharedPage = c1.sourceProvenance.pageNumbers.find((p) => c2.sourceProvenance.pageNumbers.includes(p));
        if (sharedPage) {
          const sharedBlock = c1.sourceProvenance.blockIds.find((b) => c2.sourceProvenance.blockIds.includes(b));
          if (sharedBlock) {
            // Deduplication check
            const exists = relationships.some(
              (r) =>
                (r.sourceConceptId === c1.canonicalId && r.targetConceptId === c2.canonicalId) ||
                (r.sourceConceptId === c2.canonicalId && r.targetConceptId === c1.canonicalId),
            );

            if (!exists) {
              relationships.push(this.createRelationship(
                c1,
                c2,
                ConceptRelationshipType.RELATED,
                'STRUCTURAL',
                0.75,
                c1.sourceProvenance.snippet,
                sharedPage,
                sharedBlock,
              ));
            }
          }
        }
      }
    }

    this.logger.log(`RelationshipEngine inferred ${relationships.length} evidence-backed relationships.`);
    return relationships;
  }

  private createRelationship(
    source: CanonicalConceptDefinition,
    target: CanonicalConceptDefinition,
    type: ConceptRelationshipType,
    evidenceType: EvidenceType,
    strength: number,
    snippet: string,
    pageNumber: number,
    blockId: string,
  ): EvidenceBackedRelationship {
    const id = crypto.createHash('sha256').update(`${source.canonicalId}|${target.canonicalId}|${type}`).digest('hex').slice(0, 16);
    return {
      id,
      sourceConceptId: source.canonicalId,
      targetConceptId: target.canonicalId,
      sourceConceptTerm: source.canonicalTerm,
      targetConceptTerm: target.canonicalTerm,
      relationshipType: type,
      evidenceType,
      strength,
      evidenceSnippet: snippet.slice(0, 200),
      sourcePageNumber: pageNumber,
      sourceBlockId: blockId,
      confidence: strength,
    };
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^$\{\}()|[\]\\\/]/g, '\\$&');
  }
}
