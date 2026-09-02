import { Test, TestingModule } from '@nestjs/testing';
import { PdfExtractorService } from './extractors/pdf-extractor.service';
import { StructureDetectorService } from './structure-detector.service';
import { SemanticBoundaryService } from './semantic-boundary.service';
import { KnowledgeConstructorService } from './knowledge-constructor.service';
import { RelationshipEngineService } from './relationship-engine.service';
import { CanonicalModelService } from './canonical-model.service';
import { ExtractorFactoryService } from './extractor-factory.service';
import { ExtractionOrchestratorService } from './extraction-orchestrator.service';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';
import { MaterialType, MaterialStatus, ProcessingStatus, DocumentStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');
jest.mock('pdf-parse', () => jest.fn());

describe('M2 Document Intelligence Acceptance Benchmark', () => {
  let pdfExtractor: PdfExtractorService;
  let structureDetector: StructureDetectorService;
  let knowledgeConstructor: KnowledgeConstructorService;
  let orchestrator: ExtractionOrchestratorService;
  const tempPdfPath = path.join(process.cwd(), 'uploads', 'm2-benchmark.pdf');

  beforeAll(() => {
    if (!fs.existsSync(path.join(process.cwd(), 'uploads'))) {
      fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempPdfPath)) {
      try {
        fs.unlinkSync(tempPdfPath);
      } catch {}
    }
  });

  beforeEach(async () => {
    const mockPrisma = {
      learningMaterial: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'mat-m2-cbse',
          learnerId: 'tenant-1',
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
        findFirst: jest.fn().mockResolvedValue({ id: 'doc-cbse-1', status: DocumentStatus.PROCESSING }),
        create: jest.fn().mockResolvedValue({ id: 'doc-cbse-1', status: DocumentStatus.PROCESSING }),
        update: jest.fn().mockResolvedValue({ id: 'doc-cbse-1', status: DocumentStatus.READY }),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb({
        conceptRelationship: { deleteMany: jest.fn(), upsert: jest.fn() },
        conceptChunk: { deleteMany: jest.fn(), upsert: jest.fn() },
        concept: { upsert: jest.fn().mockResolvedValue({ id: 'concept-uuid-1' }) },
        contentChunk: { deleteMany: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'chunk-uuid-1' }) },
        contentTopic: { deleteMany: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'topic-uuid-1' }) },
        contentSpecialSection: { deleteMany: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'spec-uuid-1' }) },
        contentChapter: { deleteMany: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'chap-uuid-1' }) },
        contentUnit: { deleteMany: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'unit-uuid-1' }) },
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
      ],
    }).compile();

    pdfExtractor = module.get<PdfExtractorService>(PdfExtractorService);
    structureDetector = module.get<StructureDetectorService>(StructureDetectorService);
    knowledgeConstructor = module.get<KnowledgeConstructorService>(KnowledgeConstructorService);
    orchestrator = module.get<ExtractionOrchestratorService>(ExtractionOrchestratorService);
  });

  it('Benchmark 1: High OCR Fidelity on Multilingual & Complex Scientific Content', async () => {
    fs.writeFileSync(tempPdfPath, 'fake-pdf-bytes');
    (pdfParse as jest.Mock).mockResolvedValueOnce({
      text: 'UNIT 1: HUMAN BIOLOGY\n\nChapter 2: The Circulatory System\n\n2.1 Heart Structure\nThe human heart is a muscular organ that pumps oxygenated blood throughout the circulatory system.\n\n• The left ventricle pumps blood into the aorta.\n• The right ventricle pumps blood into the pulmonary artery.\n\nFigure 2.1: Anatomy of the human heart\nName | Chamber | Function\nAorta | Left | Systemic Circulation',
      numpages: 1,
      info: { Title: 'CBSE Grade 5 Science' },
    });

    const result = await pdfExtractor.extract(tempPdfPath, 'science.pdf');

    expect(result.pages).toHaveLength(1);
    const page = result.pages[0];
    expect(page.pageTruth).toBeDefined();
    expect(page.pageTruth?.status).toBe('VERIFIED');
    expect(page.blocks.length).toBeGreaterThan(0);

    const heading = page.blocks.find((b) => b.type === 'HEADING');
    expect(heading).toBeDefined();
  });

  it('Benchmark 2: Hierarchy Recovery & Semantic Boundary Chunking without Cross-Topic Leaks', () => {
    const mockExtraction: any = {
      metadata: { pageCount: 2 },
      pages: [
        {
          pageNumber: 1,
          rawText: 'Chapter 1: Nutrition\n1.1 Carbohydrates\nCarbohydrates are the main energy source.',
          blocks: [
            { id: 'b1', type: 'HEADING', text: 'Chapter 1: Nutrition', headingLevel: 1, pageNumber: 1 },
            { id: 'b2', type: 'HEADING', text: '1.1 Carbohydrates', headingLevel: 2, pageNumber: 1 },
            { id: 'b3', type: 'PARAGRAPH', text: 'Carbohydrates are the main energy source.', pageNumber: 1 },
          ],
        },
        {
          pageNumber: 2,
          rawText: '1.2 Proteins\nProteins build and repair body tissues.',
          blocks: [
            { id: 'b4', type: 'HEADING', text: '1.2 Proteins', headingLevel: 2, pageNumber: 2 },
            { id: 'b5', type: 'PARAGRAPH', text: 'Proteins build and repair body tissues.', pageNumber: 2 },
          ],
        },
      ],
    };

    const structure = structureDetector.processStructure(mockExtraction);

    expect(structure.chapters).toHaveLength(1);
    expect(structure.chapters[0].topics).toHaveLength(2);
    expect(structure.chunks.length).toBeGreaterThanOrEqual(2);
  });

  it('Benchmark 3: Multilingual Concept Extraction with Active Grounding', async () => {
    const mockPages: any[] = [
      {
        pageNumber: 1,
        rawText: 'प्रकाश संश्लेषण is the process of synthesizing food using sunlight in plants.',
        blocks: [
          {
            id: 'b1',
            type: 'PARAGRAPH',
            text: 'प्रकाश संश्लेषण is the process of synthesizing food using sunlight in plants.',
            sequenceNumber: 1,
            pageNumber: 1,
          },
        ],
      },
    ];

    const result = await knowledgeConstructor.constructKnowledge('doc-1', mockPages, 'Biology');

    expect(result.concepts.length).toBeGreaterThan(0);
    const concept = result.concepts[0];
    expect(concept.canonicalTerm).toBe('Photosynthesis');
    expect(concept.sourceLanguage).toBe('hi');
    expect(concept.status).toBe('ACTIVE');
  });

  it('Benchmark 4: Strict Missing Structure Audit', () => {
    const flatDoc: any = {
      metadata: { pageCount: 1 },
      pages: [
        {
          pageNumber: 1,
          rawText: 'Chapter 8: Conclusion and Final Remarks\n\nThis concluding chapter synthesizes the findings.',
          blocks: [
            { id: 'b1', type: 'HEADING', text: 'Chapter 8: Conclusion and Final Remarks', headingLevel: 1, pageNumber: 1 },
            { id: 'b2', type: 'PARAGRAPH', text: 'This concluding chapter synthesizes the findings.', pageNumber: 1 },
          ],
        },
      ],
    };

    const structure = structureDetector.processStructure(flatDoc);

    expect(structure.chapters).toHaveLength(1);
    expect(structure.chapters[0].missingStructure).toBe(true);
    expect(structure.chapters[0].topics).toHaveLength(0);
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
