import { Test, TestingModule } from '@nestjs/testing';
import { RelationshipEngineService } from './relationship-engine.service';
import { CanonicalConceptDefinition } from './knowledge-constructor.service';
import { ExtractedPage } from './document-extractor.interface';
import { ConceptRelationshipType } from '@prisma/client';

describe('RelationshipEngineService - M2.5 Evidence-Gated Relationship Tests', () => {
  let service: RelationshipEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RelationshipEngineService],
    }).compile();

    service = module.get<RelationshipEngineService>(RelationshipEngineService);
  });

  it('should infer EXPLICIT PREREQUISITE and COMPONENT_OF relationships with verifiable page evidence', () => {
    const concepts: CanonicalConceptDefinition[] = [
      {
        canonicalId: 'c-mouth',
        canonicalTerm: 'Mouth',
        canonicalMeaning: 'Organ of ingestion',
        semanticContext: 'Biology',
        sourceLanguage: 'en',
        sourceTerm: 'Mouth',
        localizedTerms: [],
        conceptType: 'ENTITY',
        difficultyBand: 'BEGINNER',
        sourceProvenance: { documentId: 'd1', pageNumbers: [1], blockIds: ['b1'], snippet: '', supportingTextHash: '' },
        confidence: 0.95,
        status: 'ACTIVE',
      },
      {
        canonicalId: 'c-digestion',
        canonicalTerm: 'Digestive System',
        canonicalMeaning: 'Organ system for breaking down food',
        semanticContext: 'Biology',
        sourceLanguage: 'en',
        sourceTerm: 'Digestive System',
        localizedTerms: [],
        conceptType: 'ENTITY',
        difficultyBand: 'INTERMEDIATE',
        sourceProvenance: { documentId: 'd1', pageNumbers: [1], blockIds: ['b1'], snippet: '', supportingTextHash: '' },
        confidence: 0.95,
        status: 'ACTIVE',
      },
    ];

    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        rawText: 'The Mouth is a component of Digestive System in all mammals.',
        blocks: [
          {
            id: 'b1',
            type: 'PARAGRAPH',
            text: 'The Mouth is a component of Digestive System in all mammals.',
            sequenceNumber: 1,
            pageNumber: 1,
          },
        ],
      },
    ];

    const edges = service.inferRelationships(concepts, pages);

    expect(edges.length).toBeGreaterThan(0);
    const edge = edges.find((e) => e.relationshipType === ConceptRelationshipType.COMPONENT_OF);
    expect(edge).toBeDefined();
    expect(edge?.sourceConceptTerm).toBe('Mouth');
    expect(edge?.targetConceptTerm).toBe('Digestive System');
    expect(edge?.evidenceType).toBe('EXPLICIT');
    expect(edge?.sourcePageNumber).toBe(1);
    expect(edge?.evidenceSnippet).toContain('Mouth is a component of Digestive System');
  });

  it('should strictly enforce the No Relationship Evidence -> No Active Edge invariant', () => {
    const concepts: CanonicalConceptDefinition[] = [
      {
        canonicalId: 'c-photosynthesis',
        canonicalTerm: 'Photosynthesis',
        canonicalMeaning: 'Plant food synthesis',
        semanticContext: 'Biology',
        sourceLanguage: 'en',
        sourceTerm: 'Photosynthesis',
        localizedTerms: [],
        conceptType: 'PROCESS',
        difficultyBand: 'INTERMEDIATE',
        sourceProvenance: { documentId: 'd1', pageNumbers: [1], blockIds: ['b1'], snippet: '', supportingTextHash: '' },
        confidence: 0.95,
        status: 'ACTIVE',
      },
      {
        canonicalId: 'c-quantum',
        canonicalTerm: 'Quantum Mechanics',
        canonicalMeaning: 'Subatomic physics',
        semanticContext: 'Physics',
        sourceLanguage: 'en',
        sourceTerm: 'Quantum Mechanics',
        localizedTerms: [],
        conceptType: 'RULE',
        difficultyBand: 'ADVANCED',
        sourceProvenance: { documentId: 'd1', pageNumbers: [2], blockIds: ['b2'], snippet: '', supportingTextHash: '' },
        confidence: 0.95,
        status: 'ACTIVE',
      },
    ];

    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        rawText: 'Photosynthesis occurs in green leaves.',
        blocks: [{ id: 'b1', type: 'PARAGRAPH', text: 'Photosynthesis occurs in green leaves.', sequenceNumber: 1, pageNumber: 1 }],
      },
      {
        pageNumber: 2,
        rawText: 'Quantum mechanics governs atoms.',
        blocks: [{ id: 'b2', type: 'PARAGRAPH', text: 'Quantum mechanics governs atoms.', sequenceNumber: 2, pageNumber: 2 }],
      },
    ];

    const edges = service.inferRelationships(concepts, pages);

    // Unrelated concepts across disjoint pages without textual link MUST NOT produce edges
    expect(edges).toHaveLength(0);
  });
});
