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

describe('Phase 2.9 Real PostgreSQL DB E2E Runtime Journey Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let tokenUser: string;
  let dbAvailable = false;

  const testId = `reale2e${Date.now()}`;
  const parentId = `parent-${testId}`;
  const childId = `child-${testId}`;
  let learnerId = `learner-${testId}`;
  const conceptId1 = `concept1-${testId}`;
  const conceptId2 = `concept2-${testId}`;
  const loId1 = `lo1-${testId}`;
  const loId2 = `lo2-${testId}`;
  const structureId = `struct-${testId}`;
  const specId = `spec-${testId}`;

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

    // Seed real database records using the real prisma client
    // 1. Seed Concept 1 and Concept 2
    await prisma.concept.createMany({
      data: [
        { id: conceptId1, canonicalName: `Addition ${testId}`, normalizedName: `addition ${testId}`, status: ConceptStatus.ACTIVE, domain: 'Mathematics', gradeBand: GradeBand.PRIMARY, conceptType: ConceptType.CONCEPT },
        { id: conceptId2, canonicalName: `Subtraction ${testId}`, normalizedName: `subtraction ${testId}`, status: ConceptStatus.ACTIVE, domain: 'Mathematics', gradeBand: GradeBand.PRIMARY, conceptType: ConceptType.CONCEPT },
      ]
    });

    // 2. Seed Learning Objectives
    await prisma.learningObjective.createMany({
      data: [
        { id: loId1, conceptId: conceptId1, code: `LO_ADD_${testId}`, description: 'Addition Objective', complexityLevel: 1 },
        { id: loId2, conceptId: conceptId2, code: `LO_SUB_${testId}`, description: 'Subtraction Objective', complexityLevel: 1 },
      ]
    });

    // 3. Seed Curriculum Structure
    await prisma.curriculumStructure.create({
      data: { id: structureId, domain: 'Mathematics', version: 9999, status: CurriculumStatus.PUBLISHED }
    });

    // 4. Seed Curriculum Nodes
    await prisma.curriculumNode.createMany({
      data: [
        { id: `node1-${testId}`, structureId, conceptId: conceptId1, sequenceIndex: 1, gradeBand: GradeBand.PRIMARY },
        { id: `node2-${testId}`, structureId, conceptId: conceptId2, sequenceIndex: 2, gradeBand: GradeBand.PRIMARY },
      ]
    });

    // 5. Seed Prerequisites & Node Objective associations
    await prisma.curriculumPrerequisite.create({
      data: {
        structureId,
        sourceNodeId: `node1-${testId}`,
        targetNodeId: `node2-${testId}`,
      }
    });

    await prisma.curriculumNodeObjective.createMany({
      data: [
        { curriculumNodeId: `node1-${testId}`, learningObjectiveId: loId1 },
        { curriculumNodeId: `node2-${testId}`, learningObjectiveId: loId2 },
      ]
    });

    // 6. Seed Assessment Spec for the first objective
    await prisma.assessmentSpecification.create({
      data: {
        id: specId,
        learningObjectiveId: loId1,
        assessmentType: AssessmentType.MULTIPLE_CHOICE,
        difficulty: 1,
        scoringMethod: ScoringMethod.EXACT_MATCH,
        passThreshold: 0.75,
        configuration: { question: 'What is 1+1?', options: ['2', '3', '4'], correctOption: '2' },
        version: 1,
        active: true,
      }
    });

    // 7. Seed Parent & Child for relations E2E check
    await prisma.parent.create({
      data: { id: parentId, email: `${testId}@parent.com`, name: `Parent-${testId}`, consentGiven: true }
    });
    await prisma.child.create({
      data: { id: childId, parentId, name: `Child-${testId}`, age: 8 }
    });
  });

  afterAll(async () => {
    if (!dbAvailable) {
      if (app) await app.close();
      return;
    }
    try {
      await prisma.learningEvidence.deleteMany({ where: { learnerId } });
      await prisma.learnerCurriculumFrontier.deleteMany({ where: { learnerId } });
      await prisma.learnerCurriculumEnrollment.deleteMany({ where: { learnerId } });
      await prisma.learnerConceptMastery.deleteMany({ where: { learnerId } });
      await prisma.learnerObjectiveMastery.deleteMany({ where: { learnerId } });
      await prisma.learningSession.deleteMany({ where: { learnerId } });
      await prisma.assessmentSpecification.deleteMany({ where: { id: specId } });
      await prisma.curriculumNodeObjective.deleteMany({ where: { curriculumNodeId: { in: [`node1-${testId}`, `node2-${testId}`] } } });
      await prisma.curriculumPrerequisite.deleteMany({ where: { structureId } });
      await prisma.curriculumNode.deleteMany({ where: { structureId } });
      await prisma.curriculumStructure.deleteMany({ where: { id: structureId } });
      await prisma.learningObjective.deleteMany({ where: { id: { in: [loId1, loId2] } } });
      await prisma.concept.deleteMany({ where: { id: { in: [conceptId1, conceptId2] } } });
      await prisma.child.deleteMany({ where: { parentId } });
      await prisma.parent.deleteMany({ where: { id: parentId } });
      await prisma.learner.deleteMany({ where: { id: learnerId } });
    } catch (err) {
      console.error('Database cleanup error:', err);
    }
    if (app) await app.close();
  });

  it('Verify Dynamic Session Lifecycle and Real Active Enrollment Calculations against Live PostgreSQL', async () => {
    if (!dbAvailable) {
      console.warn('⚠️ [SKIPPED] PostgreSQL database is not running at localhost:5432. Skipping live DB E2E test.');
      return;
    }

    // 1. Onboard Learner Profile via real API
    const onboardRes = await request(app.getHttpServer())
      .post('/api/v2/learners')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ name: `RealLeo-${testId}`, learnerType: 'CHILD', legacyChildId: childId })
      .expect(201);

    // Set dynamic learnerId generated by database
    const dbLearnerId = onboardRes.body.data.id;
    // Map in memory for cleanup
    learnerId = dbLearnerId;

    // Verify GET learners includes curriculumEnrollments relation
    const listRes1 = await request(app.getHttpServer())
      .get('/api/v2/learners')
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    expect(listRes1.body.data.length).toBeGreaterThanOrEqual(1);
    const resolvedLearner = listRes1.body.data.find((l: any) => l.id === dbLearnerId);
    expect(resolvedLearner).toBeDefined();
    expect(resolvedLearner.curriculumEnrollments.length).toBe(0);

    // 2. Enroll learner in Mathematics V2 (version 9999)
    await request(app.getHttpServer())
      .post('/api/v2/curriculum/enroll')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ learnerId: dbLearnerId, structureVersion: 9999 })
      .expect(201);

    // Verify list endpoint dynamically resolves active enrollment version
    const listRes2 = await request(app.getHttpServer())
      .get('/api/v2/learners')
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    const resolvedLearner2 = listRes2.body.data.find((l: any) => l.id === dbLearnerId);
    expect(resolvedLearner2.curriculumEnrollments.length).toBe(1);
    expect(resolvedLearner2.curriculumEnrollments[0].structure.version).toBe(9999);

    // 3. Query initial frontier
    const frontierRes = await request(app.getHttpServer())
      .get(`/api/v2/curriculum/frontier/${dbLearnerId}/9999`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    expect(frontierRes.body.data.frontierNodes.length).toBe(1);
    expect(frontierRes.body.data.frontierNodes[0].conceptId).toBe(conceptId1);

    // 4. Plan session using user budget (45 mins)
    const sessionRes = await request(app.getHttpServer())
      .post('/api/v2/sessions')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ learnerId: dbLearnerId, structureVersion: 9999, timeBudgetMinutes: 45 })
      .expect(201);

    const sessionId = sessionRes.body.data.id;
    expect(sessionRes.body.data.status).toBe(SessionStatus.READY);

    // 5. Explicitly start session
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    const getSession1 = await request(app.getHttpServer())
      .get(`/api/v2/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);
    expect(getSession1.body.data.status).toBe(SessionStatus.ACTIVE);

    // 6. Explicitly pause session
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/pause`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    const getSession2 = await request(app.getHttpServer())
      .get(`/api/v2/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);
    expect(getSession2.body.data.status).toBe(SessionStatus.PAUSED);

    // 7. Explicitly resume session
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/resume`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    const getSession3 = await request(app.getHttpServer())
      .get(`/api/v2/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);
    expect(getSession3.body.data.status).toBe(SessionStatus.ACTIVE);

    // 8. Complete all steps except ASSESS steps
    const allSteps = getSession3.body.data.targets.flatMap((t: any) => t.steps);
    const assessStep = allSteps.find((s: any) => s.stepType === 'ASSESS');
    expect(assessStep).toBeDefined();

    for (const step of allSteps) {
      if (step.stepType !== 'ASSESS') {
        await request(app.getHttpServer())
          .post(`/api/v2/sessions/${sessionId}/steps/${step.id}/complete`)
          .set('Authorization', `Bearer ${tokenUser}`)
          .expect(200);
      }
    }

    // 9. Fetch assessment instance and verify safe configuration shape (no correctAnswer exposed)
    const getSession4 = await request(app.getHttpServer())
      .get(`/api/v2/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    const updatedSteps = getSession4.body.data.targets.flatMap((t: any) => t.steps);
    const updatedAssessStep = updatedSteps.find((s: any) => s.stepType === 'ASSESS');
    expect(updatedAssessStep).toBeDefined();

    // Query AssessmentInstance directly from PostgreSQL
    const inst = await prisma.assessmentInstance.findFirst({
      where: { sessionStepId: updatedAssessStep.id }
    });
    expect(inst).toBeDefined();

    const getAssessmentRes = await request(app.getHttpServer())
      .get(`/api/v2/sessions/${sessionId}/assessments/${inst.id}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    expect(getAssessmentRes.body.data.configuration.question).toBe('What is 1+1?');
    expect(getAssessmentRes.body.data.configuration.correctOption).toBeUndefined();

    // 10. Submit response and verify rawScore is returned
    const respondRes = await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/assessments/${inst.id}/respond`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ response: '2' })
      .expect(200);

    expect(respondRes.body.data.passed).toBe(true);
    expect(respondRes.body.data.rawScore).toBe(1.0);

    // Complete assessment step now that response is recorded
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/steps/${updatedAssessStep.id}/complete`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    // 11. Finalize session and verify PostgreSQL updates
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    // Verify concept mastery is now MASTERED in the live database
    const masteryList = await prisma.learnerConceptMastery.findMany({ where: { learnerId: dbLearnerId } });
    const cm = masteryList.find(c => c.conceptId === conceptId1);
    expect(cm).toBeDefined();
    expect(cm.status).toBe('MASTERED');

    // 12. Query subsequent frontier and verify conceptId2 is unlocked dynamically
    const nextFrontierRes = await request(app.getHttpServer())
      .get(`/api/v2/curriculum/frontier/${dbLearnerId}/9999`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    expect(nextFrontierRes.body.data.frontierNodes.length).toBe(1);
    expect(nextFrontierRes.body.data.frontierNodes[0].conceptId).toBe(conceptId2);
  });
});
