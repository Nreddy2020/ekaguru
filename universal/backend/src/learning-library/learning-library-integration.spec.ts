import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LearningLibraryModule } from './learning-library.module';
import { PrismaService } from './prisma.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { LearnerType, MaterialType, MaterialStatus, ProcessingStatus, DocumentStatus } from '@prisma/client';

describe('Learning Library Real HTTP Security & Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  let tokenUserA: string;
  let tokenUserB: string;
  let tokenAdmin: string;

  const mockLearnerUserA = {
    id: 'learner-user-a',
    name: 'Child User A',
    learnerType: LearnerType.CHILD,
    preferredLanguage: 'en',
    dateOfBirth: new Date('2015-01-01'),
    legacyChildId: 'child-a',
    legacyChild: { id: 'child-a', parentId: 'parent-user-a' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLearnerUserB = {
    id: 'learner-user-b',
    name: 'Child User B',
    learnerType: LearnerType.CHILD,
    preferredLanguage: 'en',
    dateOfBirth: new Date('2016-01-01'),
    legacyChildId: 'child-b',
    legacyChild: { id: 'child-b', parentId: 'parent-user-b' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMaterialUserA = {
    id: 'mat-user-a',
    learnerId: 'learner-user-a',
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
    learner: mockLearnerUserA,
    documents: [],
  };

  const mockMaterialUserB = {
    id: 'mat-user-b',
    learnerId: 'learner-user-b',
    title: 'Chemistry 101',
    description: 'Introductory Chemistry',
    materialType: MaterialType.TEXTBOOK,
    status: MaterialStatus.DRAFT,
    processingStatus: ProcessingStatus.UPLOADED,
    subjectName: 'Chemistry',
    gradeLevel: 'Grade 10',
    language: 'en',
    originalFileName: 'chemistry.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: BigInt(4096),
    storageKey: 'uploads/chemistry.pdf',
    failureReason: null,
    processingVersion: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    learner: mockLearnerUserB,
    documents: [],
  };

  const mockDocumentUserB = {
    id: 'doc-user-b',
    materialId: 'mat-user-b',
    title: 'Chemistry Chapter 1',
    status: DocumentStatus.PENDING,
    pageCount: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    material: { id: 'mat-user-b', title: 'Chemistry 101', learnerId: 'learner-user-b' },
  };

  const mockPrisma = {
    learner: {
      create: jest.fn().mockResolvedValue(mockLearnerUserA),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where?.id?.in && Array.isArray(where.id.in)) {
          const list = [];
          if (where.id.in.includes('learner-user-a')) list.push(mockLearnerUserA);
          if (where.id.in.includes('learner-user-b')) list.push(mockLearnerUserB);
          return Promise.resolve(list);
        }
        if (where?.legacyChild?.parentId === 'parent-user-a') {
          return Promise.resolve([mockLearnerUserA]);
        }
        if (where?.legacyChild?.parentId === 'parent-user-b') {
          return Promise.resolve([mockLearnerUserB]);
        }
        return Promise.resolve([mockLearnerUserA, mockLearnerUserB]);
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        if (where?.id?.in) return Promise.resolve(where.id.in.length);
        if (where?.legacyChild?.parentId === 'parent-user-a') return Promise.resolve(1);
        return Promise.resolve(2);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'learner-user-a') return Promise.resolve(mockLearnerUserA);
        if (where.id === 'learner-user-b') return Promise.resolve(mockLearnerUserB);
        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue(mockLearnerUserA),
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
      create: jest.fn().mockResolvedValue(mockMaterialUserA),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where?.learnerId === 'learner-user-a') return Promise.resolve([mockMaterialUserA]);
        if (where?.learnerId === 'learner-user-b') return Promise.resolve([mockMaterialUserB]);
        if (where?.learnerId?.in) {
          const list = [];
          if (where.learnerId.in.includes('learner-user-a')) list.push(mockMaterialUserA);
          if (where.learnerId.in.includes('learner-user-b')) list.push(mockMaterialUserB);
          return Promise.resolve(list);
        }
        return Promise.resolve([mockMaterialUserA, mockMaterialUserB]);
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        if (where?.learnerId?.in) return Promise.resolve(where.learnerId.in.length);
        return Promise.resolve(2);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'mat-user-a') return Promise.resolve(mockMaterialUserA);
        if (where.id === 'mat-user-b') return Promise.resolve(mockMaterialUserB);
        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue({ ...mockMaterialUserA, status: MaterialStatus.DELETED }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    document: {
      create: jest.fn().mockResolvedValue(mockDocumentUserB),
      findMany: jest.fn().mockResolvedValue([mockDocumentUserB]),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'doc-user-b') return Promise.resolve(mockDocumentUserB);
        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue({ ...mockDocumentUserB, pageCount: 35 }),
    },
    contentChapter: {
      count: jest.fn().mockResolvedValue(6),
    },
    contentTopic: {
      count: jest.fn().mockResolvedValue(24),
    },
    concept: {
      count: jest.fn().mockResolvedValue(56),
    },
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
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);
    tokenUserA = jwtService.sign({ sub: 'parent-user-a', email: 'parentA@test.com', role: 'PARENT' });
    tokenUserB = jwtService.sign({ sub: 'parent-user-b', email: 'parentB@test.com', role: 'PARENT' });
    tokenAdmin = jwtService.sign({ sub: 'admin-user', email: 'admin@test.com', role: 'ADMIN' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. HTTP Security Test — Missing JWT returns 401 Unauthorized', async () => {
    await request(app.getHttpServer())
      .get('/api/v2/learning-materials')
      .expect(401);
  });

  it('2. HTTP Security Test — User A requests User B material returns 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .get('/api/v2/learning-materials/mat-user-b')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(403);
  });

  it('3. HTTP Security Test — User A requests GET /learning-materials without learnerId is automatically scoped to User A materials', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v2/learning-materials')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].id).toBe('mat-user-a');
  });

  it('4. HTTP Security Test — User A requests GET /learners without filters is automatically scoped to User A learners', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v2/learners')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe('learner-user-a');
  });

  it('5. HTTP Security Test — User A attempting to create material assigned to User B learner returns 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/learning-materials')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        learnerId: 'learner-user-b',
        title: 'Unauthorized Material',
        materialType: 'TEXTBOOK',
      })
      .expect(403);
  });

  it('6. HTTP Security Test — User A attempting to archive User B material returns 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .delete('/api/v2/learning-materials/mat-user-b')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(403);
  });

  it('7. HTTP Security Test — ADMIN request GET /learning-materials returns all materials', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v2/learning-materials')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(response.body.items).toHaveLength(2);
  });

  it('8. HTTP Integration Test — Successful Material Creation for Authorized Learner', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v2/learning-materials')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        learnerId: 'learner-user-a',
        title: 'Biology 101',
        materialType: 'TEXTBOOK',
      })
      .expect(201);

    expect(response.body.data.id).toBe('mat-user-a');
  });

  it('9. HTTP Integration Test — Successful Material Retry for Failed Material', async () => {
    (mockMaterialUserA as any).processingStatus = ProcessingStatus.FAILED;

    const response = await request(app.getHttpServer())
      .post('/api/v2/learning-materials/mat-user-a/retry')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(response.body.data.processingStatus).toBe('UPLOADED');
    expect(response.body.data.progress).toBe(0);
  });

  it('10. HTTP Integration Test — Reject Retry for Non-Failed Material', async () => {
    (mockMaterialUserA as any).processingStatus = ProcessingStatus.READY;

    const response = await request(app.getHttpServer())
      .post('/api/v2/learning-materials/mat-user-a/retry')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('MATERIAL_NOT_RETRYABLE');
  });
});
