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

describe('Learning Material Multipart Upload HTTP Integration & Security Remediation Tests', () => {
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

  const mockMaterialCreated = {
    id: 'mat-uploaded-1',
    learnerId: 'learner-user-a',
    title: 'Uploaded Textbook',
    description: 'Uploaded via integration test',
    materialType: MaterialType.TEXTBOOK,
    status: MaterialStatus.ACTIVE,
    processingStatus: ProcessingStatus.STORED,
    fileSizeBytes: BigInt(2048),
    storageKey: 'v2/source/parent-user-a/learner-user-a/mat-uploaded-1/uuid.pdf',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDocumentCreated = {
    id: 'doc-uploaded-1',
    materialId: 'mat-uploaded-1',
    title: 'Uploaded Textbook Document',
    status: DocumentStatus.PENDING,
    pageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
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
      create: jest.fn().mockResolvedValue(mockMaterialCreated),
    },
    document: {
      create: jest.fn().mockResolvedValue(mockDocumentCreated),
    },
  };

  const mockStorageService = {
    saveFile: jest.fn().mockResolvedValue({
      storageKey: 'v2/source/parent-user-a/learner-user-a/mat-uploaded-1/uuid.pdf',
      fileSizeBytes: 2048,
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      mimeType: 'application/pdf',
    }),
    getFileStream: jest.fn().mockResolvedValue(Readable.from(['pdf content'])),
    deleteFile: jest.fn().mockResolvedValue(true),
    fileExists: jest.fn().mockResolvedValue(true),
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

  it('1. POST /api/v2/learning-materials/upload — 401 Unauthorized when missing JWT', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/learning-materials/upload')
      .attach('file', Buffer.from('%PDF-1.7 Valid PDF'), 'test.pdf')
      .field('learnerId', 'learner-user-a')
      .field('title', 'Test PDF')
      .field('materialType', 'TEXTBOOK')
      .expect(401);
  });

  it('2. POST /api/v2/learning-materials/upload — 403 Forbidden when User A attempts upload for User B learner', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/learning-materials/upload')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .attach('file', Buffer.from('%PDF-1.7 Valid PDF'), 'test.pdf')
      .field('learnerId', 'learner-user-b')
      .field('title', 'Test PDF')
      .field('materialType', 'TEXTBOOK')
      .expect(403);
  });

  it('3. POST /api/v2/learning-materials/upload — 400 Bad Request on MIME spoofing (fake.pdf with executable binary header)', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/learning-materials/upload')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .attach('file', Buffer.from('MZ Executable Binary Header'), 'fake.pdf')
      .field('learnerId', 'learner-user-a')
      .field('title', 'Fake PDF')
      .field('materialType', 'TEXTBOOK')
      .expect(400);
  });

  it('4. POST /api/v2/learning-materials/upload — 400 Bad Request when public client passes EKAGURU_SYNTHESIZED provenance', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/learning-materials/upload')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .attach('file', Buffer.from('%PDF-1.7 Valid PDF Header Data'), 'valid.pdf')
      .field('learnerId', 'learner-user-a')
      .field('title', 'Uploaded Textbook')
      .field('materialType', 'TEXTBOOK')
      .field('provenanceType', 'EKAGURU_SYNTHESIZED')
      .expect(400);
  });

  it('5. POST /api/v2/learning-materials/upload — 400 Bad Request when public client passes CURRICULUM_STANDARD provenance', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/learning-materials/upload')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .attach('file', Buffer.from('%PDF-1.7 Valid PDF Header Data'), 'valid.pdf')
      .field('learnerId', 'learner-user-a')
      .field('title', 'Uploaded Textbook')
      .field('materialType', 'TEXTBOOK')
      .field('provenanceType', 'CURRICULUM_STANDARD')
      .expect(400);
  });

  it('6. POST /api/v2/learning-materials/upload — 201 Created on valid PDF upload with USER_UPLOADED provenance', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v2/learning-materials/upload')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .attach('file', Buffer.from('%PDF-1.7 Valid PDF Header Data'), 'valid.pdf')
      .field('learnerId', 'learner-user-a')
      .field('title', 'Uploaded Textbook')
      .field('materialType', 'TEXTBOOK')
      .field('provenanceType', 'USER_UPLOADED')
      .field('sourceOrganization', 'School A')
      .expect(201);

    expect(response.body.data.id).toBe('mat-uploaded-1');
    expect(response.body.data.processingStatus).toBe('STORED');
    expect(response.body.data.progress).toBe(25);
    expect(response.body.data.provenanceType).toBe('USER_UPLOADED');
    expect(response.body.data.checksum).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
