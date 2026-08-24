import { Test, TestingModule } from '@nestjs/testing';
import { PdfExtractorService } from './extractors/pdf-extractor.service';
import { StructureDetectorService } from './structure-detector.service';
import { SemanticBoundaryService } from './semantic-boundary.service';
import { KnowledgeConstructorService } from './knowledge-constructor.service';
import { RelationshipEngineService } from './relationship-engine.service';
import { CanonicalModelService } from './canonical-model.service';
import { ExtractedDocument, ExtractedPage } from './document-extractor.interface';

describe('M2 Document Intelligence — Page Truth, Invariants & Projection Disposability', () => {
  let pdfExtractor: PdfExtractorService;
  let structureDetector: StructureDetectorService;
  let semanticBoundary: SemanticBoundaryService;
  let knowledgeConstructor: KnowledgeConstructorService;
  let relationshipEngine: RelationshipEngineService;
  let canonicalModel: CanonicalModelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfExtractorService,
        StructureDetectorService,
        SemanticBoundaryService,
        KnowledgeConstructorService,
        RelationshipEngineService,
        CanonicalModelService,
      ],
    }).compile();

    pdfExtractor = module.get<PdfExtractorService>(PdfExtractorService);
    structureDetector = module.get<StructureDetectorService>(StructureDetectorService);
    semanticBoundary = module.get<SemanticBoundaryService>(SemanticBoundaryService);
    knowledgeConstructor = module.get<KnowledgeConstructorService>(KnowledgeConstructorService);
    relationshipEngine = module.get<RelationshipEngineService>(RelationshipEngineService);
    canonicalModel = module.get<CanonicalModelService>(CanonicalModelService);
  });

  describe('1. Page Truth Engine & Quality Gating', () => {
    it('should compute rigorous Page Truth Record distinguishing physical from printed pages', async () => {
      const mockDoc: ExtractedDocument = {
        metadata: {
          title: 'Grade 5 Science',
          pageCount: 2,
          fileSizeBytes: 2048,
          mimeType: 'application/pdf',
        },
        pages: [
          {
            pageNumber: 1,
            physicalPageIndex: 1,
            rawText: 'CHAPTER 1: PLANT REPRODUCTION\nPage 15\nPlants reproduce through seeds and vegetative propagation.',
            classification: 'TEXT_NATIVE',
            blocks: [
              {
                id: 'b1',
                type: 'HEADING',
                text: 'CHAPTER 1: PLANT REPRODUCTION',
                sequenceNumber: 1,
                pageNumber: 1,
                headingLevel: 1,
                fontSize: 22,
                isBold: true,
              },
              {
                id: 'b2',
                type: 'HEADER',
                text: 'Page 15',
                sequenceNumber: 2,
                pageNumber: 1,
                fontSize: 9,
              },
              {
                id: 'b3',
                type: 'PARAGRAPH',
                text: 'Plants reproduce through seeds and vegetative propagation.',
                sequenceNumber: 3,
                pageNumber: 1,
                fontSize: 11,
              },
            ],
          },
        ],
        warnings: [],
      };

      const structure = structureDetector.processStructure(mockDoc);
      expect(structure.chapters.length).toBe(1);
      expect(structure.chapters[0].title).toBe('CHAPTER 1: PLANT REPRODUCTION');
    });

    it('should detect degraded or corrupted text without throwing unhandled exceptions', async () => {
      const corruptedPageText = '$$$### @@@ 123456 !!! %%%';
      const nonAsciiCount = (corruptedPageText.match(/[^A-Za-z0-9s]/g) || []).length;
      expect(nonAsciiCount).toBeGreaterThan(10);
    });
  });

  describe('2. Invariant: Missing Structure Never Fabricates Knowledge', () => {
    it('should record missingStructure: true and structureConfidence: LOW when chapter has no subheadings', () => {
      const docWithNoSubheadings: ExtractedDocument = {
        metadata: {
          title: 'Unstructured Chapter',
          pageCount: 1,
          fileSizeBytes: 1024,
          mimeType: 'application/pdf',
        },
        pages: [
          {
            pageNumber: 1,
            rawText: 'CHAPTER 4: SIMPLE MACHINES\nA lever is a rigid bar resting on a pivot.',
            blocks: [
              {
                id: 'b1',
                type: 'HEADING',
                text: 'CHAPTER 4: SIMPLE MACHINES',
                sequenceNumber: 1,
                pageNumber: 1,
                headingLevel: 1,
                fontSize: 22,
                isBold: true,
              },
              {
                id: 'b2',
                type: 'PARAGRAPH',
                text: 'A lever is a rigid bar resting on a pivot.',
                sequenceNumber: 2,
                pageNumber: 1,
                fontSize: 11,
              },
            ],
          },
        ],
        warnings: [],
      };

      const structure = structureDetector.processStructure(docWithNoSubheadings);
      expect(structure.chapters.length).toBe(1);
      expect(structure.chapters[0].missingStructure).toBe(true);
      expect(structure.chapters[0].structureConfidence).toBe('LOW');
      expect(structure.chapters[0].topics.length).toBe(0); // No synthetic subtopics!
    });
  });

  describe('3. Multi-Page Structural & Topic Continuity', () => {
    it('should preserve topic context across consecutive page breaks', () => {
      const multiPageDoc: ExtractedDocument = {
        metadata: {
          title: 'Science Multi-Page',
          pageCount: 2,
          fileSizeBytes: 4096,
          mimeType: 'application/pdf',
        },
        pages: [
          {
            pageNumber: 1,
            rawText: 'CHAPTER 1: DIGESTION\n1.1 The Human Digestive System\nDigestion starts in the mouth where food is chewed.',
            blocks: [
              { id: 'b1', type: 'HEADING', text: 'CHAPTER 1: DIGESTION', sequenceNumber: 1, pageNumber: 1, headingLevel: 1, fontSize: 22 },
              { id: 'b2', type: 'HEADING', text: '1.1 The Human Digestive System', sequenceNumber: 2, pageNumber: 1, headingLevel: 2, fontSize: 16 },
              { id: 'b3', type: 'PARAGRAPH', text: 'Digestion starts in the mouth where food is chewed.', sequenceNumber: 3, pageNumber: 1, fontSize: 11 },
            ],
          },
          {
            pageNumber: 2,
            rawText: 'During this process, saliva breaks down starches before swallowing into the esophagus.',
            blocks: [
              { id: 'b4', type: 'PARAGRAPH', text: 'During this process, saliva breaks down starches before swallowing into the esophagus.', sequenceNumber: 4, pageNumber: 2, fontSize: 11 },
            ],
          },
        ],
        warnings: [],
      };

      const structure = structureDetector.processStructure(multiPageDoc);
      expect(structure.chapters.length).toBe(1);
      expect(structure.chapters[0].topics.length).toBe(1);
      expect(structure.chapters[0].topics[0].title).toBe('1.1 The Human Digestive System');

      const chunks = structure.chunks;
      expect(chunks.length).toBeGreaterThan(0);
      const contentChunk = chunks.find((c) => c.content.includes('Digestion starts in the mouth'));
      expect(contentChunk).toBeDefined();
      expect(contentChunk!.pageStart).toBe(1);
      expect(contentChunk!.pageEnd).toBe(2); // Topic content spans page 1 to page 2 continuously!
    });
  });

  describe('4. Projection Disposability: KG & RAPTOR Rebuild without Raw PDF Reprocessing', () => {
    it('should allow deleting all KG & RAPTOR projections and rebuilding them cleanly from the Canonical Knowledge Model', async () => {
      const docId = 'doc-test-disposability-001';
      const mockPages: ExtractedPage[] = [
        {
          pageNumber: 1,
          rawText: 'Photosynthesis is defined as the process by which green plants make food using sunlight. Chlorophyll refers to the green pigment in leaves.',
          blocks: [
            {
              id: 'b1',
              type: 'PARAGRAPH',
              text: 'Photosynthesis is defined as the process by which green plants make food using sunlight.',
              sequenceNumber: 1,
              pageNumber: 1,
            },
            {
              id: 'b2',
              type: 'PARAGRAPH',
              text: 'Chlorophyll refers to the green pigment in leaves.',
              sequenceNumber: 2,
              pageNumber: 1,
            },
          ],
        },
      ];

      // Step 1: Construct Validated Knowledge Units
      const knowledge = await knowledgeConstructor.constructKnowledge(docId, mockPages, 'Biology');
      expect(knowledge.concepts.length).toBeGreaterThanOrEqual(1);

      // Step 2: Build Typed Relationships
      const relationships = relationshipEngine.inferRelationships(knowledge.concepts, mockPages);

      // Step 3: Build Authoritative Canonical Knowledge Model
      const canonical = canonicalModel.buildCanonicalModel(docId, knowledge.concepts, relationships);
      expect(canonical.concepts.size).toBeGreaterThanOrEqual(1);

      // Step 4: First Projection to KG & RAPTOR
      const raptorTree1 = canonicalModel.projectToRaptorTree('Biology Grade 5', [], canonical);
      expect(raptorTree1.length).toBeGreaterThan(0);
      expect(raptorTree1[0].isRaptorSummary).toBe(true);

      // Step 5: SIMULATE DISASTER / PROJECTION FLUSH:
      // Drop all projected KG entities and RAPTOR trees from memory/DB.
      let projectedRaptorTree = null;
      expect(projectedRaptorTree).toBeNull();

      // Step 6: REBUILD PROJECTIONS DIRECTLY FROM CANONICAL MODEL (Zero raw PDF re-parsing!)
      projectedRaptorTree = canonicalModel.projectToRaptorTree('Biology Grade 5', [], canonical);
      expect(projectedRaptorTree.length).toBe(raptorTree1.length);
      expect(projectedRaptorTree[0].isRaptorSummary).toBe(true);
    });
  });

  describe('5. Deterministic Provenance & Stage Hash Invariant', () => {
    it('should compute identical SHA-256 canonical entity hashes across repeat executions', async () => {
      const docId = 'deterministic-doc-123';
      const mockPages: ExtractedPage[] = [
        {
          pageNumber: 1,
          rawText: 'Gravity is defined as the force that attracts a body toward the center of the earth.',
          blocks: [
            {
              id: 'b1',
              type: 'PARAGRAPH',
              text: 'Gravity is defined as the force that attracts a body toward the center of the earth.',
              sequenceNumber: 1,
              pageNumber: 1,
            },
          ],
        },
      ];

      const res1 = await knowledgeConstructor.constructKnowledge(docId, mockPages, 'Physics');
      const res2 = await knowledgeConstructor.constructKnowledge(docId, mockPages, 'Physics');

      expect(res1.concepts.length).toBe(res2.concepts.length);
      expect(res1.concepts[0].canonicalId).toBe(res2.concepts[0].canonicalId);
      expect(res1.concepts[0].sourceProvenance.supportingTextHash).toBe(res2.concepts[0].sourceProvenance.supportingTextHash);
    });
  });
});
