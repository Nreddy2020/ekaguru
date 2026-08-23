import { Test, TestingModule } from '@nestjs/testing';
import { PdfExtractorService } from './extractors/pdf-extractor.service';
import { StructureDetectorService } from './structure-detector.service';
import { SemanticBoundaryService } from './semantic-boundary.service';
import { KnowledgeConstructorService } from './knowledge-constructor.service';
import { RelationshipEngineService } from './relationship-engine.service';
import { CanonicalModelService } from './canonical-model.service';
import { ExtractionOrchestratorService } from './extraction-orchestrator.service';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { ExtractorFactoryService } from './extractor-factory.service';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';
import { EmbeddingService } from '../knowledge/alignment/embedding.service';
import { MaterialType, MaterialStatus, ProcessingStatus, DocumentStatus, ConceptRelationshipType } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');
jest.mock('pdf-parse', () => jest.fn());
jest.mock('tesseract.js', () => ({
  recognize: jest.fn().mockResolvedValue({
    data: { text: 'OCR text', confidence: 85 },
  }),
}));

describe('M2 Acceptance & Benchmark Test Suite (FROZEN SPECIFICATION GATES)', () => {
  let pdfExtractor: PdfExtractorService;
  let structureDetector: StructureDetectorService;
  let semanticBoundary: SemanticBoundaryService;
  let knowledgeConstructor: KnowledgeConstructorService;
  let relationshipEngine: RelationshipEngineService;
  let canonicalModel: CanonicalModelService;
  let orchestrator: ExtractionOrchestratorService;

  const tempPdfPath = path.resolve(process.cwd(), './uploads/m2-benchmark.pdf');

  beforeAll(async () => {
    if (!fs.existsSync(path.dirname(tempPdfPath))) {
      fs.mkdirSync(path.dirname(tempPdfPath), { recursive: true });
    }
  });

  beforeEach(async () => {
    const mockPrisma = {
      learningMaterial: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'mat-m2-cbse',
          learnerId: 'learner-1',
          title: 'CBSE Grade 5 Science: Human Body & Nutrition',
          subjectName: 'Science',
          materialType: MaterialType.TEXTBOOK,
          status: MaterialStatus.ACTIVE,
          processingStatus: ProcessingStatus.STORED,
          storageKey: 'm2-benchmark.pdf',
          mimeType: 'application/pdf',
          originalFileName: 'cbse.pdf',
          documents: [{ id: 'doc-cbse-1', status: DocumentStatus.PENDING }],
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'mat-m2-cbse', ...data })),
      },
      document: {
        create: jest.fn().mockResolvedValue({ id: 'doc-cbse-1', status: DocumentStatus.PROCESSING }),
        update: jest.fn().mockResolvedValue({ id: 'doc-cbse-1', status: DocumentStatus.READY }),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb({
        conceptRelationship: { deleteMany: jest.fn(), upsert: jest.fn() },
        conceptChunk: { deleteMany: jest.fn(), upsert: jest.fn() },
        concept: { upsert: jest.fn().mockResolvedValue({ id: 'concept-uuid-1' }) },
        contentChunk: { deleteMany: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'chunk-uuid-1' }) },
        contentTopic: { deleteMany: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'topic-uuid-1' }) },
        contentChapter: { deleteMany: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'chap-uuid-1' }) },
        documentPage: { deleteMany: jest.fn(), create: jest.fn() },
        document: { update: jest.fn() },
        learningMaterial: { update: jest.fn() },
      })),
    };

    const mockStorage = {
      fileExists: jest.fn().mockResolvedValue(true),
    };

    const mockAuthGuard = {
      verifyUserLearnerOwnership: jest.fn().mockResolvedValue(true),
    };

    const mockEmbedding = {
      calculateCosineSimilarity: jest.fn().mockReturnValue(0.85),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfExtractorService,
        StructureDetectorService,
        SemanticBoundaryService,
        KnowledgeConstructorService,
        RelationshipEngineService,
        CanonicalModelService,
        {
          provide: ExtractorFactoryService,
          useFactory: (pdf: PdfExtractorService) => ({
            getExtractor: () => pdf,
          }),
          inject: [PdfExtractorService],
        },
        ExtractionOrchestratorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
        { provide: LearningLibraryAuthGuard, useValue: mockAuthGuard },
        { provide: EmbeddingService, useValue: mockEmbedding },
      ],
    }).compile();

    pdfExtractor = module.get<PdfExtractorService>(PdfExtractorService);
    structureDetector = module.get<StructureDetectorService>(StructureDetectorService);
    semanticBoundary = module.get<SemanticBoundaryService>(SemanticBoundaryService);
    knowledgeConstructor = module.get<KnowledgeConstructorService>(KnowledgeConstructorService);
    relationshipEngine = module.get<RelationshipEngineService>(RelationshipEngineService);
    canonicalModel = module.get<CanonicalModelService>(CanonicalModelService);
    orchestrator = module.get<ExtractionOrchestratorService>(ExtractionOrchestratorService);
  });

  afterEach(() => {
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }
  });

  it('Benchmark 1: CBSE Textbook Hierarchy, Layout Geometry & Prerequisite Linkages', async () => {
    fs.writeFileSync(tempPdfPath, 'pdf buffer');

    const cbsePage1 = [
      'Chapter 1: Nutrition and Digestion',
      '1.1 The Human Digestive System',
      '1.1.1 The Mouth and Teeth',
      'Concept: Mouth',
      'Concept: Digestive System',
      'Digestion is defined as the mechanical and chemical breakdown of food into smaller components.',
      'The Mouth is a component of Digestive System.',
      'Figure 1.1: Human digestive tract anatomy',
      'E = mc^2',
    ].join('\n\n');

    (pdfParse as jest.Mock).mockResolvedValueOnce({
      text: cbsePage1,
      numpages: 1,
      info: { Title: 'CBSE Science Grade 5' },
    });

    const extraction = await pdfExtractor.extract(tempPdfPath, 'cbse.pdf');
    expect(extraction.metadata.documentType).toBe('TEXTBOOK');
    expect(extraction.pages[0].classification).toBe('TEXT_NATIVE');

    // Structure pass
    const structure = structureDetector.processStructure(extraction);
    expect(structure.chapters).toHaveLength(1);
    expect(structure.chapters[0].title).toBe('Chapter 1: Nutrition and Digestion');
    expect(structure.chapters[0].topics).toHaveLength(2);
    expect(structure.chapters[0].topics[0].title).toBe('1.1 The Human Digestive System');
    expect(structure.chapters[0].topics[0].level).toBe(2);
    expect(structure.chapters[0].topics[1].title).toBe('1.1.1 The Mouth and Teeth');
    expect(structure.chapters[0].topics[1].level).toBe(3);

    // Knowledge & Validation pass
    const knowledge = await knowledgeConstructor.constructKnowledge('doc-cbse-1', extraction.pages, 'Science');
    expect(knowledge.concepts.some((c) => c.canonicalTerm === 'Digestion' && c.status === 'ACTIVE')).toBe(true);

    // Relationship pass
    const relationships = relationshipEngine.inferRelationships(knowledge.concepts, extraction.pages);
    const componentEdge = relationships.find((r) => r.relationshipType === ConceptRelationshipType.COMPONENT_OF);
    expect(componentEdge).toBeDefined();
    expect(componentEdge?.evidenceType).toBe('EXPLICIT');
  });

  it('Benchmark 2: Multilingual Source Language Preservation (Hindi -> Canonical Bridge)', async () => {
    fs.writeFileSync(tempPdfPath, 'pdf buffer');
    const hindiPage = 'Chapter 2: पादपों में पोषण\n\nप्रकाश संश्लेषण is the process of synthesizing food using sunlight in plants.';

    (pdfParse as jest.Mock).mockResolvedValueOnce({
      text: hindiPage,
      numpages: 1,
      info: { Title: 'Hindi Science' },
    });

    const extraction = await pdfExtractor.extract(tempPdfPath, 'hindi_science.pdf');
    const knowledge = await knowledgeConstructor.constructKnowledge('doc-hi-1', extraction.pages, 'Biology');

    const photosynthesisConcept = knowledge.concepts.find((c) => c.canonicalTerm === 'Photosynthesis');
    expect(photosynthesisConcept).toBeDefined();
    expect(photosynthesisConcept?.sourceLanguage).toBe('hi');
    expect(photosynthesisConcept?.sourceTerm).toContain('प्रकाश संश्लेषण');
    expect(photosynthesisConcept?.status).toBe('ACTIVE');
  });

  it('Benchmark 3: Context-Aware Contradiction Detection (Sea level vs Mountain Altitude)', async () => {
    fs.writeFileSync(tempPdfPath, 'pdf buffer');
    const multiPageDoc = [
      'Chapter 1: Pure Liquids\nWater boils at 100 °C under standard atmospheric conditions.',
      'Chapter 4: Mountain Science\nAt high altitude, water boils at 91 °C due to reduced pressure.',
    ].join('\f');

    (pdfParse as jest.Mock).mockResolvedValueOnce({
      text: multiPageDoc,
      numpages: 2,
      info: { Title: 'Physical Sciences' },
    });

    const extraction = await pdfExtractor.extract(tempPdfPath, 'physics.pdf');
    const knowledge = await knowledgeConstructor.constructKnowledge('doc-phys-1', extraction.pages, 'Chemistry');

    expect(knowledge.contradictions).toHaveLength(1);
    expect(knowledge.contradictions[0].isContextualVariation).toBe(true);
    expect(knowledge.contradictions[0].status).toBe('CONTEXTUAL_VARIATION');
    expect(knowledge.contradictions[0].provenanceA.pageNumber).toBe(1);
    expect(knowledge.contradictions[0].provenanceB.pageNumber).toBe(2);
  });

  it('Benchmark 4: Missing Structure Invariant (No Fabricated Topics)', async () => {
    fs.writeFileSync(tempPdfPath, 'pdf buffer');
    const flatDoc = 'Chapter 8: Conclusion and Final Remarks\n\nThis concluding chapter synthesizes the findings.';

    (pdfParse as jest.Mock).mockResolvedValueOnce({
      text: flatDoc,
      numpages: 1,
      info: { Title: 'Summary Guide' },
    });

    const extraction = await pdfExtractor.extract(tempPdfPath, 'flat.pdf');
    const structure = structureDetector.processStructure(extraction);

    expect(structure.chapters).toHaveLength(1);
    expect(structure.chapters[0].missingStructure).toBe(true);
    expect(structure.chapters[0].topics).toHaveLength(0); // ZERO placeholder topics!
  });

  it('Benchmark 5: End-to-End Orchestrator Execution & Frozen M1 Contract Transition', async () => {
    fs.writeFileSync(tempPdfPath, 'pdf buffer');
    (pdfParse as jest.Mock).mockResolvedValueOnce({
      text: 'Chapter 1: Living Systems\n\n1.1 Cells\n\nCells are the structural units of life.',
      numpages: 1,
      info: { Title: 'Living Systems' },
    });

    const result = await orchestrator.processMaterial('mat-m2-cbse', { userId: 'tenant-1', role: 'PARENT' });

    expect(result.data.processingStatus).toBe('READY');
    expect(result.data.progress).toBe(100);
    expect(result.data.currentStage).toBe('READY');
    expect(result.data.conceptCount).toBeGreaterThanOrEqual(1);
  });
});
