import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LearningLibraryModule } from '../learning-library.module';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { LearnerType, MaterialType, MaterialStatus, ProcessingStatus, DocumentStatus } from '@prisma/client';
import { Readable } from 'stream';

describe('Phase 2.3 Document Extraction & Chunks HTTP Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  let tokenUserA: string;
  let tokenUserB: string;

  const mockLearnerUserA = {
    id: 'learner-user-a',
    name: 'Child User A',
    learnerType: LearnerType.CHILD,
    legacyChildId: 'child-a',
    legacyChild: { id: 'child-a', parentId: 'parent-user-a' },
  };

  const mockLearnerUserB = {
    id: 'learner-user-b',
    name: 'Child User B',
    learnerType: LearnerType.CHILD,
    legacyChildId: 'child-b',
    legacyChild: { id: 'child-b', parentId: 'parent-user-b' },
  };

  const mockMaterialUserA = {
    id: 'mat-process-a',
    learnerId: 'learner-user-a',
    title: 'Textbook A',
    materialType: MaterialType.TEXTBOOK,
    status: MaterialStatus.ACTIVE,
    processingStatus: ProcessingStatus.STORED,
    fileSizeBytes: BigInt(2048),
    storageKey: 'v2/source/parent-user-a/learner-user-a/mat-process-a/uuid.pdf',
    mimeType: 'application/pdf',
    originalFileName: 'textbook.pdf',
    documents: [{ id: 'doc-a', status: DocumentStatus.PENDING }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMaterialUserB = {
    ...mockMaterialUserA,
    id: 'mat-process-b',
    learnerId: 'learner-user-b',
    storageKey: 'v2/source/parent-user-b/learner-user-b/mat-process-b/uuid.pdf',
  };

  const mockPrisma = {
    learner: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'learner-user-a') return Promise.resolve(mockLearnerUserA);
        if (where.id === 'learner-user-b') return Promise.resolve(mockLearnerUserB);
        return Promise.resolve(null);
      }),
    },
    child: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where.parentId === 'parent-user-a' && where.learner?.id === 'learner-user-a') {
          return Promise.resolve(mockLearnerUserA.legacyChild);
        }
        if (where.parentId === 'parent-user-b' && where.learner?.id === 'learner-user-b') {
          return Promise.resolve(mockLearnerUserB.legacyChild);
        }
        return Promise.resolve(null);
      }),
    },
    learningMaterial: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'mat-process-a') return Promise.resolve(mockMaterialUserA);
        if (where.id === 'mat-process-b') return Promise.resolve(mockMaterialUserB);
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockMaterialUserA, ...data })),
    },
    document: {
      create: jest.fn().mockResolvedValue({ id: 'doc-a', status: DocumentStatus.PROCESSING }),
      update: jest.fn().mockResolvedValue({ id: 'doc-a', status: DocumentStatus.READY }),
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
        { id: 'c-1', sequenceNumber: 1, content: 'Chunk text', pageStart: 1, pageEnd: 1, chapter: null, topic: null, createdAt: new Date() },
      ]),
      count: jest.fn().mockResolvedValue(1),
    },
  };

  const mockStorageService = {
    fileExists: jest.fn().mockResolvedValue(true),
    getFileStream: jest.fn().mockResolvedValue(Readable.from(['pdf text stream'])),
  };

  beforeAll(async () => {
    const secret = 'ekaguru-secret-key-change-in-production';
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret, signOptions: { expiresIn: '1h' } }),
        LearningLibraryModule,
      ],
      providers: [JwtStrategy],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);
    tokenUserA = jwtService.sign({ sub: 'parent-user-a', email: 'parentA@test.com', role: 'PARENT' });
    tokenUserB = jwtService.sign({ sub: 'parent-user-b', email: 'parentB@test.com', role: 'PARENT' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. POST /api/v2/learning-materials/:id/process — 401 Unauthorized when missing JWT', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/learning-materials/mat-process-a/process')
      .expect(401);
  });

  it('2. POST /api/v2/learning-materials/:id/process — 403 Forbidden when User A attempts processing for User B material', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/learning-materials/mat-process-b/process')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(403);
  });

  it('3. GET /api/v2/learning-materials/:id/chunks — 403 Forbidden when User A attempts chunk access for User B material', async () => {
    await request(app.getHttpServer())
      .get('/api/v2/learning-materials/mat-process-b/chunks')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(403);
  });

  it('4. GET /api/v2/learning-materials/:id/chunks — 200 OK returning paginated chunks for authorized user', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v2/learning-materials/mat-process-a/chunks')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].sequenceNumber).toBe(1);
    expect(res.body.meta.total).toBe(1);
  });
});
