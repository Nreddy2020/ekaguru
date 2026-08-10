import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LearningLibraryModule } from '../../learning-library.module';
import { PrismaService } from '../../prisma.service';
import { StorageService } from '../../storage/storage.service';
import { JwtStrategy } from '../../../auth/jwt.strategy';
import { LearnerType, MaterialType, MaterialStatus, ProcessingStatus, GradeBand, ConceptType, CandidateStatus, ProposalStatus } from '@prisma/client';

describe('Phase 2.5 Semantic Alignment HTTP Integration & Security Tests', () => {
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
    id: 'mat-align-a',
    learnerId: 'learner-user-a',
    title: 'Textbook A',
    materialType: MaterialType.TEXTBOOK,
    status: MaterialStatus.ACTIVE,
    processingStatus: ProcessingStatus.READY,
    storageKey: 'v2/source/parent-user-a/learner-user-a/mat-align-a/uuid.pdf',
    mimeType: 'application/pdf',
    originalFileName: 'textbook.pdf',
    documents: [
      {
        id: 'doc-a',
        chunks: [
          {
            id: 'chunk-1',
            content: 'PRIVATE TEXTBOOK CONTENT THAT MUST NEVER BE SENT TO EMBEDDING PROVIDERS',
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
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    objectives: [],
    outgoing: [],
    incoming: [],
    sourceChunks: [],
  };

  const mockPrisma = {
    learner: {
      findUnique: jest.fn().mockResolvedValue(mockLearnerUserA),
      findMany: jest.fn().mockResolvedValue([{ id: 'learner-user-a' }]),
    },
    learningMaterial: {
      findUnique: jest.fn().mockResolvedValue(mockMaterialUserA),
    },
    conceptCandidate: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'cand-1',
          chunkId: 'chunk-1',
          candidateKey: 'key-1',
          rawLabel: 'Single-Digit Addition',
          normalizedLabel: 'single-digit addition',
          domain: 'Mathematics',
          gradeBand: GradeBand.PRIMARY,
          confidence: 0.9,
          status: CandidateStatus.PENDING,
          chunk: { document: { materialId: 'mat-align-a' } },
        },
      ]),
      update: jest.fn().mockResolvedValue({ id: 'cand-1', status: CandidateStatus.SCORING }),
    },
    concept: {
      findMany: jest.fn().mockResolvedValue([mockConceptA]),
      findUnique: jest.fn().mockResolvedValue(mockConceptA),
    },
    semanticEmbedding: {
      findFirst: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ id: 'emb-1' }),
    },
    alignmentPolicy: {
      findFirst: jest.fn().mockResolvedValue({
        version: 1,
        cosineWeight: 0.40,
        gradeWeight: 0.25,
        domainWeight: 0.15,
        taxonomyWeight: 0.10,
        curatorWeight: 0.10,
        autoLinkThreshold: 0.88,
        reviewThreshold: 0.70,
      }),
      create: jest.fn(),
    },
    curatorRule: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'rule-1' }),
    },
    alignmentDecisionLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    conceptAlignmentProposal: {
      create: jest.fn().mockResolvedValue({ id: 'prop-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({
        id: 'prop-1',
        candidateId: 'cand-1',
        targetConceptId: 'concept-123',
        status: ProposalStatus.PENDING,
        candidate: { id: 'cand-1', chunkId: 'chunk-1', rawLabel: 'Single-Digit Addition', normalizedLabel: 'single-digit addition', domain: 'Mathematics', gradeBand: GradeBand.PRIMARY, confidence: 0.9 },
        targetConcept: mockConceptA,
      }),
      update: jest.fn().mockResolvedValue({ id: 'prop-1', status: ProposalStatus.APPROVED }),
    },
    conceptChunk: {
      upsert: jest.fn().mockResolvedValue({ conceptId: 'concept-123', chunkId: 'chunk-1' }),
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

  it('1. POST /api/v2/concepts/align — 403 Forbidden when non-ADMIN user attempts alignment execution', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/concepts/align')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ materialId: 'mat-align-a' })
      .expect(403);
  });

  it('2. POST /api/v2/concepts/align — 200 OK when ADMIN user executes semantic alignment', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v2/concepts/align')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ materialId: 'mat-align-a' })
      .expect(200);

    expect(res.body.data.candidatesProcessed).toBeGreaterThanOrEqual(1);
  });

  it('3. GET /api/v2/concepts/alignment-proposals — 403 Forbidden for non-ADMIN user', async () => {
    await request(app.getHttpServer())
      .get('/api/v2/concepts/alignment-proposals')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(403);
  });

  it('4. GET /api/v2/concepts/alignment-proposals — 200 OK for ADMIN user', async () => {
    await request(app.getHttpServer())
      .get('/api/v2/concepts/alignment-proposals')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
  });
});
