import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { LearningLibraryModule } from './learning-library.module';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LearnerType, MaterialType, MaterialStatus, ProcessingStatus, DocumentStatus } from '@prisma/client';

describe('Learning Library HTTP API Integration (Mocked DB)', () => {
  let app: INestApplication;

  const mockLearner = {
    id: 'learner-integration-1',
    name: 'Integration Learner',
    learnerType: LearnerType.STUDENT,
    preferredLanguage: 'en',
    dateOfBirth: new Date('2012-01-01'),
    legacyChildId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMaterial = {
    id: 'mat-integration-1',
    learnerId: 'learner-integration-1',
    title: 'Biology 101',
    description: 'Introductory Biology',
    materialType: MaterialType.TEXTBOOK,
    status: MaterialStatus.DRAFT,
    processingStatus: ProcessingStatus.UPLOADED,
    subjectName: 'Biology',
    gradeLevel: 'Grade 9',
    language: 'en',
    originalFileName: 'biology.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: BigInt(2048),
    storageKey: 'uploads/biology.pdf',
    failureReason: null,
    processingVersion: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    learner: mockLearner,
    documents: [],
  };

  const mockDocument = {
    id: 'doc-integration-1',
    materialId: 'mat-integration-1',
    title: 'Biology Chapter 1',
    status: DocumentStatus.PENDING,
    pageCount: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
    material: { id: 'mat-integration-1', title: 'Biology 101', learnerId: 'learner-integration-1' },
  };

  const mockPrisma = {
    learner: {
      create: jest.fn().mockResolvedValue(mockLearner),
      findMany: jest.fn().mockResolvedValue([mockLearner]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(mockLearner),
      update: jest.fn().mockResolvedValue({ ...mockLearner, name: 'Updated Integration Learner' }),
    },
    child: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    learningMaterial: {
      create: jest.fn().mockResolvedValue(mockMaterial),
      findMany: jest.fn().mockResolvedValue([mockMaterial]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(mockMaterial),
      update: jest.fn().mockResolvedValue({ ...mockMaterial, status: MaterialStatus.DELETED }),
    },
    document: {
      create: jest.fn().mockResolvedValue(mockDocument),
      findMany: jest.fn().mockResolvedValue([mockDocument]),
      findUnique: jest.fn().mockResolvedValue(mockDocument),
      update: jest.fn().mockResolvedValue({ ...mockDocument, pageCount: 30 }),
    },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [LearningLibraryModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 'admin-user', role: 'ADMIN' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v2/learners (Success)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v2/learners')
      .send({ name: 'Integration Learner', learnerType: 'STUDENT' })
      .expect(201);

    expect(response.body.data.id).toBe('learner-integration-1');
  });

  it('POST /api/v2/learners (Validation Failure on invalid enum)', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/learners')
      .send({ name: 'Integration Learner', learnerType: 'INVALID_ENUM' })
      .expect(400);
  });

  it('GET /api/v2/learners (Success)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v2/learners')
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(1);
  });

  it('GET /api/v2/learners/:id (Success)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v2/learners/learner-integration-1')
      .expect(200);

    expect(response.body.data.id).toBe('learner-integration-1');
  });

  it('POST /api/v2/learning-materials (Success)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v2/learning-materials')
      .send({
        learnerId: 'learner-integration-1',
        title: 'Biology 101',
        materialType: 'TEXTBOOK',
      })
      .expect(201);

    expect(response.body.data.id).toBe('mat-integration-1');
  });

  it('GET /api/v2/learning-materials (Success)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v2/learning-materials?materialType=TEXTBOOK')
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].progress).toBe(5);
  });

  it('GET /api/v2/learning-materials/:id/status (Success)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v2/learning-materials/mat-integration-1/status')
      .expect(200);

    expect(response.body.data.progress).toBe(5);
    expect(response.body.data.currentStage).toBe('UPLOADED');
  });

  it('DELETE /api/v2/learning-materials/:id (Logical Archive)', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/v2/learning-materials/mat-integration-1?action=archive')
      .expect(200);

    expect(response.body.data.status).toBe('DELETED'); // Mocked return
  });

  it('POST /api/v2/learning-materials/:materialId/documents (Success)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v2/learning-materials/mat-integration-1/documents')
      .send({ title: 'Biology Chapter 1', pageCount: 25 })
      .expect(201);

    expect(response.body.data.id).toBe('doc-integration-1');
  });
});
