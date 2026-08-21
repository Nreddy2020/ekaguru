import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LearningLibraryModule } from '../../learning-library.module';
import { PrismaService } from '../../prisma.service';
import { StorageService } from '../../storage/storage.service';
import { JwtStrategy } from '../../../auth/jwt.strategy';
import { LearnerType, GradeBand, ConceptType, CurriculumStatus, BoardType } from '@prisma/client';

describe('Phase 2.6 Universal Curriculum HTTP Integration & Security Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  let tokenUserA: string;
  let tokenAdmin: string;

  const mockConcept1 = {
    id: 'c-1',
    canonicalName: 'Counting',
    normalizedName: 'counting',
    conceptType: ConceptType.CONCEPT,
    domain: 'General',
    gradeBand: GradeBand.EARLY_CHILDHOOD,
    status: 'ACTIVE',
    objectives: [{ id: 'obj-1', code: 'MATH.1', description: 'Count to 10', complexityLevel: 1 }],
    outgoing: [],
  };

  const mockConcept2 = {
    id: 'c-2',
    canonicalName: 'Addition',
    normalizedName: 'addition',
    conceptType: ConceptType.CONCEPT,
    domain: 'General',
    gradeBand: GradeBand.PRIMARY,
    status: 'ACTIVE',
    objectives: [{ id: 'obj-2', code: 'MATH.2', description: 'Add single digits', complexityLevel: 1 }],
    outgoing: [{ sourceId: 'c-2', targetId: 'c-1', relationshipType: 'PREREQUISITE', strength: 1.0 }],
  };

  const mockStructure = {
    id: 'struct-1',
    version: 1,
    name: 'EKAGURU Universal Curriculum (v1)',
    domain: 'General',
    status: CurriculumStatus.PUBLISHED,
    nodes: [
      {
        id: 'node-1',
        structureId: 'struct-1',
        conceptId: 'c-1',
        gradeBand: GradeBand.EARLY_CHILDHOOD,
        sequenceIndex: 1,
        concept: mockConcept1,
        nodeObjectives: [{ learningObjective: mockConcept1.objectives[0] }],
      },
      {
        id: 'node-2',
        structureId: 'struct-1',
        conceptId: 'c-2',
        gradeBand: GradeBand.PRIMARY,
        sequenceIndex: 2,
        concept: mockConcept2,
        nodeObjectives: [{ learningObjective: mockConcept2.objectives[0] }],
      },
    ],
    prerequisites: [
      {
        id: 'prereq-1',
        structureId: 'struct-1',
        sourceNodeId: 'node-2',
        targetNodeId: 'node-1',
        sourceNode: { concept: { canonicalName: 'Addition' } },
        targetNode: { concept: { canonicalName: 'Counting' } },
      },
    ],
    boardMappings: [],
  };

  const mockBoardMapping = {
    id: 'bm-1',
    structureId: 'struct-1',
    boardType: BoardType.CBSE,
    boardCode: 'CBSE_INDIA',
    jurisdiction: 'INDIA',
    academicYear: '2026-2027',
    boardGrade: 'Class 1',
    structure: mockStructure,
    nodeMappings: [
      { id: 'bnm-1', curriculumNodeId: 'node-1', boardSequenceIndex: 1, hasSequenceConflict: false },
    ],
  };

  const mockPrisma = {
    concept: {
      findMany: jest.fn().mockResolvedValue([mockConcept1, mockConcept2]),
    },
    curriculumStructure: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockStructure),
      findUnique: jest.fn().mockResolvedValue(mockStructure),
    },
    curriculumNode: {
      create: jest.fn().mockResolvedValue({ id: 'node-1' }),
    },
    curriculumNodeObjective: {
      create: jest.fn().mockResolvedValue({ id: 'cno-1' }),
    },
    curriculumPrerequisite: {
      create: jest.fn().mockResolvedValue({ id: 'cp-1' }),
    },
    boardCurriculumMapping: {
      create: jest.fn().mockResolvedValue(mockBoardMapping),
      findFirst: jest.fn().mockResolvedValue(mockBoardMapping),
    },
    boardNodeMapping: {
      create: jest.fn().mockResolvedValue({ id: 'bnm-1' }),
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

  it('1. POST /api/v2/curriculum/generate-backbone — 403 Forbidden for PARENT user', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/curriculum/generate-backbone')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ domain: 'General' })
      .expect(403);
  });

  it('2. POST /api/v2/curriculum/generate-backbone — 200 OK for ADMIN user generating backbone', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v2/curriculum/generate-backbone')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ domain: 'General' })
      .expect(200);

    expect(res.body.data.version).toBe(1);
    expect(res.body.data.nodes.length).toBe(2);
  });

  it('3. GET /api/v2/curriculum/backbone/:version — 200 OK retrieving published curriculum version', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v2/curriculum/backbone/1')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(res.body.data.version).toBe(1);
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  it('4. POST /api/v2/curriculum/board-mappings — 403 Forbidden for non-ADMIN user', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/curriculum/board-mappings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        structureVersion: 1,
        boardType: 'CBSE',
        boardCode: 'CBSE_INDIA',
        boardGrade: 'Class 1',
        nodeOrders: [{ curriculumNodeId: 'node-1', boardSequenceIndex: 1 }],
      })
      .expect(403);
  });
});
