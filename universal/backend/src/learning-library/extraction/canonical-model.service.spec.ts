import { Test, TestingModule } from '@nestjs/testing';
import { CanonicalModelService } from './canonical-model.service';
import { CanonicalConceptDefinition } from './knowledge-constructor.service';
import { EvidenceBackedRelationship } from './relationship-engine.service';
import { ConceptRelationshipType } from '@prisma/client';

describe('CanonicalModelService - M2.6 Canonical Model & Projections Tests', () => {
  let service: CanonicalModelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CanonicalModelService],
    }).compile();

    service = module.get<CanonicalModelService>(CanonicalModelService);
  });

  it('should disambiguate homonyms by semantic context (e.g. Apple fruit vs Apple company)', () => {
    const concepts: CanonicalConceptDefinition[] = [
      {
        canonicalId: 'c-apple-fruit',
        canonicalTerm: 'Apple',
        canonicalMeaning: 'Edible fruit of apple tree',
        semanticContext: 'Botany',
        sourceLanguage: 'en',
        sourceTerm: 'Apple',
        localizedTerms: [],
        conceptType: 'ENTITY',
        difficultyBand: 'BEGINNER',
        sourceProvenance: { documentId: 'd1', pageNumbers: [1], blockIds: ['b1'], snippet: '', supportingTextHash: '' },
        confidence: 0.95,
        status: 'ACTIVE',
      },
      {
        canonicalId: 'c-apple-tech',
        canonicalTerm: 'Apple',
        canonicalMeaning: 'Technology company founded in California',
        semanticContext: 'Technology',
        sourceLanguage: 'en',
        sourceTerm: 'Apple',
        localizedTerms: [],
        conceptType: 'ENTITY',
        difficultyBand: 'BEGINNER',
        sourceProvenance: { documentId: 'd1', pageNumbers: [10], blockIds: ['b10'], snippet: '', supportingTextHash: '' },
        confidence: 0.95,
        status: 'ACTIVE',
      },
    ];

    const model = service.buildCanonicalModel('doc-1', concepts, []);

    // Distinct contexts prevent destructive merging
    expect(model.concepts.size).toBe(2);
    expect(model.concepts.has('apple|botany')).toBe(true);
    expect(model.concepts.has('apple|technology')).toBe(true);
  });

  it('should project the canonical model to Knowledge Graph and RAPTOR retrieval trees', () => {
    const concepts: CanonicalConceptDefinition[] = [
      {
        canonicalId: 'c-digest',
        canonicalTerm: 'Digestion',
        canonicalMeaning: 'Process of nutrient breakdown',
        semanticContext: 'Biology',
        sourceLanguage: 'en',
        sourceTerm: 'Digestion',
        localizedTerms: [],
        conceptType: 'PROCESS',
        difficultyBand: 'INTERMEDIATE',
        sourceProvenance: { documentId: 'd1', pageNumbers: [1], blockIds: ['b1'], snippet: '', supportingTextHash: '' },
        confidence: 0.95,
        status: 'ACTIVE',
      },
    ];

    const relationships: EvidenceBackedRelationship[] = [
      {
        id: 'r1',
        sourceConceptId: 'c-mouth',
        targetConceptId: 'c-digest',
        sourceConceptTerm: 'Mouth',
        targetConceptTerm: 'Digestion',
        relationshipType: ConceptRelationshipType.COMPONENT_OF,
        evidenceType: 'EXPLICIT',
        strength: 0.95,
        evidenceSnippet: 'Mouth begins digestion',
        sourcePageNumber: 1,
        sourceBlockId: 'b1',
        confidence: 0.95,
      },
    ];

    const model = service.buildCanonicalModel('doc-1', concepts, relationships);

    const chunkIdMap = new Map<string, string>([['b1', 'chunk-uuid-1']]);
    const kgProjection = service.projectToKnowledgeGraph(model, chunkIdMap);

    expect(kgProjection.nodes).toHaveLength(1);
    expect(kgProjection.edges).toHaveLength(1);
    expect(kgProjection.conceptChunks).toHaveLength(1);
    expect(kgProjection.edges[0].explanation).toContain('EXPLICIT');

    const raptorTree = service.projectToRaptorTree('Biology Textbook', [{
      title: 'Chapter 1: Nutrition',
      orderIndex: 1,
      topics: [{ title: '1.1 Digestion', orderIndex: 1 }],
      missingStructure: false,
    }], model);

    expect(raptorTree.length).toBe(3); // DOCUMENT + CHAPTER + TOPIC
    expect(raptorTree.some((n) => n.level === 'DOCUMENT')).toBe(true);
    expect(raptorTree.every((n) => n.isRaptorSummary)).toBe(true);
  });
});
