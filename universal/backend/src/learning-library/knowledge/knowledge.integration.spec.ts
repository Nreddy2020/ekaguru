import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LearningLibraryModule } from '../learning-library.module';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { LearnerType, MaterialType, MaterialStatus, ProcessingStatus, GradeBand, ConceptType, ConceptRelationshipType } from '@prisma/client';

describe('Phase 2.4 Knowledge Abstraction HTTP Integration & Security Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  let tokenUserA: string;
  let tokenAdmin: string;

  const mockLearnerUserA = {
    id: 'learner-user-a',
    name: 'Child User A',
    learnerType: LearnerType.CHILD,
    legacyChildId: 'child-a',
    legacyChild: { id: 'child-a', parentId: 'parent-user-a' },
  };

  const mockMaterialUserA = {
    id: 'mat-knowledge-a',
    learnerId: 'learner-user-a',
    title: 'Textbook A',
    materialType: MaterialType.TEXTBOOK,
    status: MaterialStatus.ACTIVE,
    processingStatus: ProcessingStatus.READY,
    storageKey: 'v2/source/parent-user-a/learner-user-a/mat-knowledge-a/uuid.pdf',
    mimeType: 'application/pdf',
    originalFileName: 'textbook.pdf',
    documents: [
      {
        id: 'doc-a',
        chunks: [
          {
            id: 'chunk-1',
            content: 'Chapter 1: Single-Digit Addition\nContent for addition.',
          },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConceptA = {
    id: 'concept-123',
    canonicalName: 'Single-Digit Addition',
    normalizedName: 'single-digit addition',
    conceptType: ConceptType.CONCEPT,
    domain: 'Mathematics',
    gradeBand: GradeBand.PRIMARY,
    definition: 'Canonical concept for single-digit addition.',
    createdAt: new Date(),
    updatedAt: new Date(),
    objectives: [
      { id: 'obj-1', code: 'MATH.1', description: 'Add single digit numbers', complexityLevel: 1, bloomTaxonomy: 'UNDERSTAND' },
    ],
    outgoing: [],
    incoming: [],
    sourceChunks: [
      {
        chunk: {
          id: 'chunk-private-1',
          content: 'SENSITIVE PRIVATE TEXTBOOK PARAGRAPH THAT MUST NEVER BE LEAKED',
          document: {
            material: { learnerId: 'learner-user-a' },
          },
        },
      },
    ],
  };

  const mockConceptB = {
    id: 'concept-456',
    canonicalName: 'Multiplication',
    normalizedName: 'multiplication',
    conceptType: ConceptType.CONCEPT,
    domain: 'Mathematics',
    gradeBand: GradeBand.PRIMARY,
  };

  const mockPrisma = {
    learner: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'learner-user-a') return Promise.resolve(mockLearnerUserA);
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockResolvedValue([{ id: 'learner-user-a' }]),
    },
    child: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where.parentId === 'parent-user-a') return Promise.resolve(mockLearnerUserA.legacyChild);
        return Promise.resolve(null);
      }),
    },
    learningMaterial: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'mat-knowledge-a') return Promise.resolve(mockMaterialUserA);
        return Promise.resolve(null);
      }),
    },
    document: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'doc-a',
        chunks: [
          {
            id: 'chunk-1',
            content: 'Chapter 1: Single-Digit Addition\nContent for addition.',
            conceptLinks: [{ concept: mockConceptA }],
          },
        ],
      }),
    },
    conceptCandidate: {
      upsert: jest.fn().mockResolvedValue({ id: 'cand-1', candidateKey: 'key-1' }),
      findMany: jest.fn().mockResolvedValue([
        { id: 'cand-1', chunkId: 'chunk-1', rawLabel: 'Single-Digit Addition', normalizedLabel: 'single-digit addition', domain: 'Mathematics', gradeBand: GradeBand.PRIMARY, confidence: 0.9, status: 'PENDING' },
      ]),
      update: jest.fn().mockResolvedValue({ id: 'cand-1', status: 'RESOLVED' }),
    },
    concept: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'concept-123') return Promise.resolve(mockConceptA);
        if (where.id === 'concept-456') return Promise.resolve(mockConceptB);
        return Promise.resolve(null);
      }),
      upsert: jest.fn().mockResolvedValue(mockConceptA),
    },
    conceptChunk: {
      upsert: jest.fn().mockResolvedValue({ conceptId: 'concept-123', chunkId: 'chunk-1' }),
    },
    conceptRelationship: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({ id: 'rel-1', sourceId: 'concept-123', targetId: 'concept-456', relationshipType: ConceptRelationshipType.PREREQUISITE }),
    },
  };

  const mockStorageService = {
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
    tokenAdmin = jwtService.sign({ sub: 'admin-user', email: 'admin@test.com', role: 'ADMIN' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. POST /api/v2/learning-materials/:id/extract-concepts — 401 Unauthorized when missing JWT', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/learning-materials/mat-knowledge-a/extract-concepts')
      .expect(401);
  });

  it('2. POST /api/v2/learning-materials/:id/extract-concepts — Normal User A extracts candidates (PENDING_ADMIN_REVIEW, 0 auto-resolved concepts)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v2/learning-materials/mat-knowledge-a/extract-concepts')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(res.body.data.candidatesExtracted).toBeGreaterThanOrEqual(1);
    expect(res.body.data.conceptsResolved).toBe(0); // Non-admin cannot resolve canonical concepts
    expect(res.body.data.status).toBe('PENDING_ADMIN_REVIEW');
  });

  it('3. POST /api/v2/concepts/resolve-candidates — 403 Forbidden when Normal User A attempts resolving candidates', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/concepts/resolve-candidates')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ materialId: 'mat-knowledge-a' })
      .expect(403);
  });

  it('4. POST /api/v2/concepts/resolve-candidates — 200 OK when ADMIN resolves candidates into canonical concepts', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v2/concepts/resolve-candidates')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ materialId: 'mat-knowledge-a' })
      .expect(200);

    expect(res.body.data.conceptsResolved).toBeGreaterThanOrEqual(1);
  });

  it('5. POST /api/v2/concepts/relationships — 403 Forbidden when Normal User A attempts graph mutation', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/concepts/relationships')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        sourceId: 'concept-123',
        targetId: 'concept-456',
        relationshipType: 'PREREQUISITE',
      })
      .expect(403);
  });

  it('6. POST /api/v2/concepts/relationships — 201 Created when ADMIN mutates universal graph', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v2/concepts/relationships')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        sourceId: 'concept-123',
        targetId: 'concept-456',
        relationshipType: 'PREREQUISITE',
      })
      .expect(201);

    expect(res.body.data.sourceId).toBe('concept-123');
    expect(res.body.data.targetId).toBe('concept-456');
  });

  it('7. GET /api/v2/concepts/:id/graph — PRIVACY ISOLATION: Must return canonical graph without leaking private source text', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v2/concepts/concept-123/graph')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    const bodyStr = JSON.stringify(res.body);

    expect(res.body.data.concept.canonicalName).toBe('Single-Digit Addition');
    expect(res.body.data.evidenceSummary.totalSources).toBe(1);

    // PRIVACY VERIFICATION: Private chunk content must NEVER be present in public graph API response
    expect(bodyStr).not.toContain('SENSITIVE PRIVATE TEXTBOOK PARAGRAPH THAT MUST NEVER BE LEAKED');
    expect(bodyStr).not.toContain('chunk-private-1');
  });
});
