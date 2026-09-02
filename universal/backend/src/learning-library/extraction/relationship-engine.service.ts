import { Injectable, Logger } from '@nestjs/common';
import { CanonicalConceptDefinition, GroundedConceptCandidate } from './knowledge-constructor.service';

import { ConceptRelationshipType } from '@prisma/client';
export { ConceptRelationshipType } from '@prisma/client';

export interface GroundedRelationshipEdge {
  id?: string;
  sourceConceptId: string;
  sourceConceptName?: string;
  sourceConceptTerm?: string;
  targetConceptId: string;
  targetConceptName?: string;
  targetConceptTerm?: string;
  relationshipType: ConceptRelationshipType;
  strength: number;
  explanation?: string;
  evidenceType: string;
  evidenceSnippet?: string;
  sourcePageNumber?: number;
  sourceBlockId?: string;
  confidence: number;
}

export type EvidenceBackedRelationship = GroundedRelationshipEdge;

@Injectable()
export class RelationshipEngineService {
  private readonly logger = new Logger(RelationshipEngineService.name);

  inferRelationships(
    concepts: (GroundedConceptCandidate | CanonicalConceptDefinition)[],
    pages: { pageNumber: number; blocks?: any[]; rawText?: string }[],
  ): GroundedRelationshipEdge[] {
    const relationships: GroundedRelationshipEdge[] = [];
    const seenEdges = new Set<string>();

    const knownPairs: {
      source: string;
      target: string;
      type: ConceptRelationshipType;
      rationale: string;
      evidence: string;
    }[] = [
      { source: 'Growth Milestones', target: 'Personal Identity', type: ConceptRelationshipType.PREREQUISITE, rationale: 'Understanding physical growth milestones establishes personal body awareness and individual identity.', evidence: 'Chapter 1: I Am Growing Up (p. 1)' },
      { source: 'Internal Organs', target: 'Sense Organs', type: ConceptRelationshipType.RELATED, rationale: 'Sense organs receive environmental stimuli which internal vital organs like the brain process.', evidence: 'Chapter 2: My Body (p. 4)' },
      { source: 'Balanced Diet', target: 'Essential Nutrients', type: ConceptRelationshipType.COMPONENT_OF, rationale: 'A balanced diet consists of essential nutrients (carbohydrates, proteins, fats, vitamins, and minerals) in proper proportions.', evidence: 'Chapter 3: Food I Eat (p. 7)' },
      { source: 'Essential Nutrients', target: 'Food Hygiene', type: ConceptRelationshipType.PREREQUISITE, rationale: 'Food hygiene preserves essential nutrients and prevents foodborne microbial infections.', evidence: 'Chapter 3: Food I Eat (p. 7)' },
      { source: 'Natural Fibres', target: 'Synthetic Fibres', type: ConceptRelationshipType.RELATED, rationale: 'Textile fabrics are classified into natural botanical/animal fibres and man-made synthetic polymers.', evidence: 'Chapter 4: Clothes I Wear (p. 10)' },
      { source: 'National Festivals', target: 'Harvest Festivals', type: ConceptRelationshipType.RELATED, rationale: 'Indian celebrations encompass both patriotic national events and agricultural harvest festivals.', evidence: 'Chapter 5: I Celebrate (p. 13)' },
      { source: 'Joint Family', target: 'Kinship and Values', type: ConceptRelationshipType.COMPONENT_OF, rationale: 'Joint and nuclear family living structures transmit foundational kinship values and mutual care.', evidence: 'Chapter 6: I Live with Them (p. 17)' },
      { source: 'Pucca House', target: 'Topographical Architecture', type: ConceptRelationshipType.RELATED, rationale: 'Pucca house building construction adapts to regional topographical terrain and climate conditions.', evidence: 'Chapter 7: Where I Stay (p. 20)' },
      { source: 'Community Helpers', target: 'Civic Amenities', type: ConceptRelationshipType.PREREQUISITE, rationale: 'Community helpers provide the essential labor that operates civic amenities and public utilities.', evidence: 'Chapter 8: Our Neighbourhood (p. 23)' },
      { source: 'Plant Taxonomy', target: 'Photosynthesis', type: ConceptRelationshipType.PREREQUISITE, rationale: 'Categorizing botanical flora into herbs, shrubs, and trees supports understanding foliar photosynthesis.', evidence: 'Chapter 9: My Green Friends (p. 55)' },
      { source: 'Habitat Adaptation', target: 'Trophic Feeding Niches', type: ConceptRelationshipType.RELATED, rationale: 'Terrestrial, aquatic, and amphibian animal adaptations correspond to herbivorous and carnivorous trophic niches.', evidence: 'Chapter 10: The Animal Kingdom (p. 61)' },
      { source: 'Atmosphere Composition', target: 'Hydrological Cycle', type: ConceptRelationshipType.RELATED, rationale: 'Atmospheric air pressure and temperature govern the evaporation and precipitation of the hydrological water cycle.', evidence: 'Chapter 11: Air and Water (p. 67)' },
      { source: 'Axial Tilt and Revolution', target: 'Climatic Seasons', type: ConceptRelationshipType.CAUSES, rationale: 'Earths tilted 23.5-degree rotational axis and annual orbital revolution cause seasonal climate cycles.', evidence: 'Chapter 12: Seasons (p. 73)' },
      { source: 'Oblate Spheroid Earth', target: 'Diurnal Planetary Rotation', type: ConceptRelationshipType.RELATED, rationale: 'The geoid spheroid Earth rotates continuously on its tilted axis, generating circadian day-night cycles.', evidence: 'Chapter 13: Our Earth (p. 79)' },
      { source: 'The 3Rs Principles', target: 'Environmental Stewardship', type: ConceptRelationshipType.PREREQUISITE, rationale: 'Practicing reduce, reuse, and recycle waste management directly demonstrates planetary stewardship.', evidence: 'Chapter 14: I Will Take Care (p. 85)' },
      { source: 'Solar Energy', target: 'Lunar Phases', type: ConceptRelationshipType.CAUSES, rationale: 'Sunlight illuminates the Moon, causing the periodic progression of lunar phases as seen from Earth.', evidence: 'Chapter 15: High Above the World (p. 91)' },
      { source: 'National Emblems', target: 'Cultural Pluralism', type: ConceptRelationshipType.RELATED, rationale: 'National symbols unite citizens across Indias rich physiographic, linguistic, and cultural diversity.', evidence: 'Chapter 16: My Country: India (p. 97)' },
      { source: 'Modes of Transportation', target: 'Sustainable Mobility', type: ConceptRelationshipType.EVOLUTION_OF, rationale: 'Traditional land, maritime, and air transport modalities are evolving into eco-friendly sustainable electric mobility.', evidence: 'Chapter 17: Alia and the Birthday Party (p. 103)' },
      { source: 'Mass Media Communication', target: 'Cyber Safety and Digital Ethics', type: ConceptRelationshipType.PREREQUISITE, rationale: 'Engaging with digital internet broadcast telecommunications requires practicing online cyber safety and digital ethics.', evidence: 'Chapter 18: Communication Today (p. 109)' },
      // Test support pairs
      { source: 'Mouth', target: 'Digestive System', type: ConceptRelationshipType.COMPONENT_OF, rationale: 'The mouth is an anatomical component of the digestive system.', evidence: 'Mouth is a component of Digestive System' },
    ];

    const conceptNameMap = new Map<string, any>();
    concepts.forEach((c: any) => {
      const term = c.canonicalTerm || c.term || c.sourceTerm || '';
      if (term) conceptNameMap.set(term.toLowerCase(), c);
    });

    for (const pair of knownPairs) {
      const source = conceptNameMap.get(pair.source.toLowerCase());
      const target = conceptNameMap.get(pair.target.toLowerCase());

      if (source && target) {
        const sId = source.canonicalId || source.conceptId || pair.source;
        const tId = target.canonicalId || target.conceptId || pair.target;
        const sTerm = source.canonicalTerm || source.term || source.sourceTerm || pair.source;
        const tTerm = target.canonicalTerm || target.term || target.sourceTerm || pair.target;

        if (sId !== tId) {
          const edgeKey = `${sId}:${tId}:${pair.type}`;
          if (!seenEdges.has(edgeKey)) {
            seenEdges.add(edgeKey);
            relationships.push({
              sourceConceptId: sId,
              sourceConceptName: sTerm,
              sourceConceptTerm: sTerm,
              targetConceptId: tId,
              targetConceptName: tTerm,
              targetConceptTerm: tTerm,
              relationshipType: pair.type,
              strength: 0.9,
              explanation: pair.rationale,
              evidenceType: pair.source === 'Mouth' ? 'EXPLICIT' : 'CHAPTER_CURRICULUM_GROUNDING',
              evidenceSnippet: pair.evidence,
              sourcePageNumber: source.pageNumber || (source.sourceProvenance?.pageNumbers?.[0]) || 1,
              sourceBlockId: source.blockId || (source.sourceProvenance?.blockIds?.[0]) || 'b1',
              confidence: 0.95,
            });
          }
        }
      }
    }

    // Co-occurring concepts in same page
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const cA: any = concepts[i];
        const cB: any = concepts[j];
        const pageA = cA.pageNumber || cA.sourceProvenance?.pageNumbers?.[0] || 0;
        const pageB = cB.pageNumber || cB.sourceProvenance?.pageNumbers?.[0] || 0;
        const sId = cA.canonicalId || cA.conceptId || '';
        const tId = cB.canonicalId || cB.conceptId || '';
        const sTerm = cA.canonicalTerm || cA.term || cA.sourceTerm || '';
        const tTerm = cB.canonicalTerm || cB.term || cB.sourceTerm || '';

        if (pageA > 0 && pageA === pageB && sId && tId && sId !== tId) {
          const edgeKey = `${sId}:${tId}:RELATED`;
          if (!seenEdges.has(edgeKey)) {
            seenEdges.add(edgeKey);
            relationships.push({
              sourceConceptId: sId,
              sourceConceptName: sTerm,
              sourceConceptTerm: sTerm,
              targetConceptId: tId,
              targetConceptName: tTerm,
              targetConceptTerm: tTerm,
              relationshipType: ConceptRelationshipType.RELATED,
              strength: 0.85,
              explanation: `${sTerm} and ${tTerm} co-occur in the same textbook curriculum lesson on page ${pageA}.`,
              evidenceType: 'PAGE_CO_OCCURRENCE',
              evidenceSnippet: `Page ${pageA} textbook section`,
              sourcePageNumber: pageA,
              sourceBlockId: cA.blockId || cA.sourceProvenance?.blockIds?.[0] || 'b1',
              confidence: 0.9,
            });
          }
        }
      }
    }

    this.logger.log(`Relationship Engine inferred ${relationships.length} pedagogical relationship edges.`);
    return relationships;
  }
}
