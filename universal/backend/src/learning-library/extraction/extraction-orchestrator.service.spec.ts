import { Test, TestingModule } from '@nestjs/testing';
import { ExtractionOrchestratorService } from './extraction-orchestrator.service';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { ExtractorFactoryService } from './extractor-factory.service';
import { StructureDetectorService } from './structure-detector.service';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';
import { MaterialType, MaterialStatus, ProcessingStatus, DocumentStatus } from '@prisma/client';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('ExtractionOrchestratorService Security, Race Condition & Idempotency Tests', () => {
  let service: ExtractionOrchestratorService;
  let prisma: any;
  let storageService: any;
  let extractorFactory: any;
  let structureDetector: any;
  let authGuard: any;

  const mockMaterialStored = {
    id: 'mat-proc-123',
    learnerId: 'learner-123',
    title: 'Algebra Textbook',
    materialType: MaterialType.TEXTBOOK,
    status: MaterialStatus.ACTIVE,
    processingStatus: ProcessingStatus.STORED,
    storageKey: 'v2/source/tenant-1/learner-123/uuid.pdf',
    mimeType: 'application/pdf',
    originalFileName: 'algebra.pdf',
    documents: [{ id: 'doc-123', status: DocumentStatus.PENDING }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMaterialReady = {
    ...mockMaterialStored,
    processingStatus: ProcessingStatus.READY,
  };

  beforeEach(async () => {
    prisma = {
      learningMaterial: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'mat-proc-123') return Promise.resolve(mockMaterialStored);
          if (where.id === 'mat-ready-123') return Promise.resolve(mockMaterialReady);
          return Promise.resolve(null);
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockMaterialStored, ...data })),
      },
      document: {
        create: jest.fn().mockResolvedValue({ id: 'doc-123', status: DocumentStatus.PROCESSING }),
        update: jest.fn().mockResolvedValue({ id: 'doc-123', status: DocumentStatus.READY }),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb({
        contentChunk: { deleteMany: jest.fn(), create: jest.fn() },
        contentTopic: { deleteMany: jest.fn(), create: jest.fn() },
        contentChapter: { deleteMany: jest.fn(), create: jest.fn() },
        documentPage: { deleteMany: jest.fn(), create: jest.fn() },
        document: { update: jest.fn() },
        learningMaterial: { update: jest.fn() },
      })),
      contentChunk: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'chunk-1', sequenceNumber: 1, content: 'Chunk text', pageStart: 1, pageEnd: 1, chapter: null, topic: null, createdAt: new Date() },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    storageService = {
      fileExists: jest.fn().mockResolvedValue(true),
    };

    extractorFactory = {
      getExtractor: jest.fn().mockReturnValue({
        extract: jest.fn().mockResolvedValue({
          metadata: { pageCount: 1, mimeType: 'application/pdf' },
          pages: [{ pageNumber: 1, rawText: 'algebra text', blocks: [] }],
          warnings: [],
        }),
      }),
    };

    structureDetector = {
      processStructure: jest.fn().mockReturnValue({
        pages: [{ pageNumber: 1, rawText: 'algebra text' }],
        chapters: [],
        chunks: [{ sequenceNumber: 1, content: 'algebra text', pageStart: 1, pageEnd: 1 }],
      }),
    };

    authGuard = {
      verifyUserLearnerOwnership: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractionOrchestratorService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
        { provide: ExtractorFactoryService, useValue: extractorFactory },
        { provide: StructureDetectorService, useValue: structureDetector },
        { provide: LearningLibraryAuthGuard, useValue: authGuard },
      ],
    }).compile();

    service = module.get<ExtractionOrchestratorService>(ExtractionOrchestratorService);
  });

  it('1. IDEMPOTENCY: should return existing status if material is already READY without creating duplicate records', async () => {
    const res = await service.processMaterial('mat-ready-123', { userId: 'tenant-1', role: 'PARENT' });

    expect(res.data.processingStatus).toBe('READY');
    expect(res.data.progress).toBe(100);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('2. RACE CONDITION / 409 CONFLICT: should throw 409 Conflict if atomic processing lock fails', async () => {
    prisma.learningMaterial.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      service.processMaterial('mat-proc-123', { userId: 'tenant-1', role: 'PARENT' }),
    ).rejects.toThrow(ConflictException);
  });

  it('3. SECURITY: should throw ForbiddenException if user does not own learner', async () => {
    authGuard.verifyUserLearnerOwnership.mockResolvedValueOnce(false);

    await expect(
      service.processMaterial('mat-proc-123', { userId: 'other-user', role: 'PARENT' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('4. STATE TRANSITION & TRANSACTION: should execute extraction, transaction write, and transition to READY', async () => {
    const res = await service.processMaterial('mat-proc-123', { userId: 'tenant-1', role: 'PARENT' });

    expect(prisma.learningMaterial.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'mat-proc-123' }),
        data: expect.objectContaining({ processingStatus: 'EXTRACTING' }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(res.data.processingStatus).toBe('READY');
    expect(res.data.progress).toBe(100);
  });
});
