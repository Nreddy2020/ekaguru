import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LearningLibraryModule } from '../learning-library.module';
import { PrismaService } from '../prisma.service';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { StorageService } from '../storage/storage.service';
import * as net from 'net';
import {
  GradeBand,
  ConceptStatus,
  ConceptType,
  CurriculumStatus,
  SessionStatus,
  AssessmentType,
  ScoringMethod,
  MasteryStatus
} from '@prisma/client';

const checkDbPort = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(5432, '127.0.0.1');
  });
};

describe('Phase 4 Socratic Tutor & ULM E2E Journey Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let tokenUser: string;
  let dbAvailable = false;

  const testId = `socratic${Date.now()}`;
  const parentId = `parent-${testId}`;
  const childId = `child-${testId}`;
  const learnerId = `learner-${testId}`;
  const conceptId = `concept-${testId}`;
  const loId = `lo-${testId}`;
  const structureId = `struct-${testId}`;
  const specId = `spec-${testId}`;
  let sessionId: string;
  let stepId: string;

  beforeAll(async () => {
    dbAvailable = await checkDbPort();
    if (!dbAvailable) {
      console.warn('⚠️ [INFO] PostgreSQL port 5432 is closed. Skipping real database test compilation.');
      return;
    }

    const secret = 'ekaguru-secret-key-change-in-production';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret,
          signOptions: { expiresIn: '1h' },
        }),
        LearningLibraryModule,
      ],
      providers: [JwtStrategy],
    })
      .overrideProvider(StorageService)
      .useValue({ fileExists: jest.fn().mockResolvedValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    tokenUser = jwtService.sign({
      sub: parentId,
      email: `${testId}@test.com`,
      role: 'PARENT',
    });

    // 1. Seed Parent, Child, Learner relationship
    await prisma.parent.create({
      data: { id: parentId, email: `${testId}@test.com`, name: 'Test Parent' }
    });

    await prisma.child.create({
      data: { id: childId, parentId, name: 'Arjun', age: 10 }
    });

    await prisma.learner.create({
      data: {
        id: learnerId,
        legacyChildId: childId,
        name: 'Arjun',
        learnerType: 'CHILD',
        preferredLanguage: 'en',
        dateOfBirth: new Date('2016-08-23')
      }
    });

    // 2. Seed Curriculum details
    await prisma.concept.create({
      data: {
        id: conceptId,
        canonicalName: `Adding Fractions ${testId}`,
        normalizedName: `adding fractions ${testId}`,
        status: ConceptStatus.ACTIVE,
        domain: 'Mathematics',
        gradeBand: GradeBand.PRIMARY,
        conceptType: ConceptType.CONCEPT
      }
    });

    await prisma.learningObjective.create({
      data: {
        id: loId,
        conceptId,
        code: `LO_FRAC_${testId}`,
        description: 'Fraction addition unlike denominators',
        complexityLevel: 1
      }
    });

    await prisma.curriculumStructure.create({
      data: { id: structureId, domain: 'Mathematics', version: 10001, status: CurriculumStatus.PUBLISHED }
    });

    await prisma.curriculumNode.create({
      data: { id: `node-${testId}`, structureId, conceptId, sequenceIndex: 1, gradeBand: GradeBand.PRIMARY }
    });

    await prisma.curriculumNodeObjective.create({
      data: { curriculumNodeId: `node-${testId}`, learningObjectiveId: loId }
    });

    await prisma.learnerCurriculumEnrollment.create({
      data: { learnerId, structureId, active: true }
    });

    await prisma.assessmentSpecification.create({
      data: {
        id: specId,
        learningObjectiveId: loId,
        assessmentType: AssessmentType.MULTIPLE_CHOICE,
        difficulty: 1,
        scoringMethod: ScoringMethod.EXACT_MATCH,
        passThreshold: 0.75,
        configuration: {
          question: 'What is 1/2 + 1/3?',
          options: ['5/6', '2/5', '3/6'],
          correctOption: '5/6'
        }
      }
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it('1. Should initialize and start a Socratic Teach Me session via REST API', async () => {
    if (!dbAvailable) return;

    // Create session
    const createRes = await request(app.getHttpServer())
      .post('/api/v2/sessions')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ learnerId, structureVersion: 10001, timeBudgetMinutes: 30 })
      .expect(201);

    sessionId = createRes.body.data.id;
    expect(sessionId).toBeDefined();

    // Start session
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    // Call Socratic start
    const startRes = await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/tutor/start`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    expect(startRes.body.data.statement).toContain('problem');
    expect(startRes.body.data.options).toContain('2/5 (Add numerators and denominators directly)');
  });

  it('2. Should detect direct denominator addition misconception', async () => {
    if (!dbAvailable) return;

    const res = await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/tutor/respond`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ response: '2/5', attempts: 1 })
      .expect(200);

    expect(res.body.data.detectedMisconception).toBe('ADD_DENOMINATORS_DIRECTLY');
    expect(res.body.data.statement).toContain('I see what you tried');

    // Inspect database ULM misconception state
    const mastery = await prisma.learnerObjectiveMastery.findFirst({
      where: { learnerId, learningObjectiveId: loId }
    });
    expect(mastery?.status).toBe(MasteryStatus.NEEDS_REMEDIATION);
  });

  it('3. Should serve progressive Socratic clues', async () => {
    if (!dbAvailable) return;

    const hint1 = await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/tutor/hint`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ level: 1 })
      .expect(200);

    expect(hint1.body.data.statement).toContain('denominators');

    const hint2 = await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/tutor/hint`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ level: 2 })
      .expect(200);

    expect(hint2.body.data.statement).toContain('sharing');
  });

  it('4. Should record correct response, update ULM concept mastery, and update Next Best Action', async () => {
    if (!dbAvailable) return;

    const res = await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/tutor/respond`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ response: '5/6', attempts: 2 })
      .expect(200);

    expect(res.body.data.nextBestAction).toBe('REMEDIATION');
    expect(res.body.data.statement).toContain('Mastered');

    // Inspect database to prove learning outcome updates
    const conceptMastery = await prisma.learnerConceptMastery.findUnique({
      where: { learnerId_conceptId: { learnerId, conceptId } }
    });
    expect(conceptMastery?.masteryScore).toBeCloseTo(0.87, 1);
    expect(conceptMastery?.status).toBe(MasteryStatus.MASTERED);

    // Verify session step status updated to COMPLETED
    const step = await prisma.sessionStep.findFirst({
      where: { sessionId }
    });
    expect(step?.status).toBe('COMPLETED');
  });
});
