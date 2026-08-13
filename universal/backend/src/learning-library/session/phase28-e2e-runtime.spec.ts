import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LearningLibraryModule } from '../learning-library.module';
import { PrismaService } from '../prisma.service';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { StorageService } from '../storage/storage.service';
import {
  GradeBand,
  ConceptStatus,
  ConceptType,
  LearnerType,
  CurriculumStatus,
  SessionStatus,
  SessionStepStatus,
  AssessmentInstanceStatus,
} from '@prisma/client';

describe('Phase 2.8 E2E Runtime Journey Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let tokenUser: string;

  // In-memory Database Store
  let learners: any[] = [];
  let children: any[] = [];
  let concepts: any[] = [];
  let curriculumStructures: any[] = [];
  let curriculumNodes: any[] = [];
  let curriculumPrerequisites: any[] = [];
  let curriculumNodeObjectives: any[] = [];
  let learningObjectives: any[] = [];
  let enrollments: any[] = [];
  let conceptMasteries: any[] = [];
  let objectiveMasteries: any[] = [];
  let frontiers: any[] = [];
  let sessions: any[] = [];
  let steps: any[] = [];
  let targets: any[] = [];
  let assessmentSpecs: any[] = [];
  let assessmentInstances: any[] = [];
  let assessmentResponses: any[] = [];
  let sessionEvidences: any[] = [];
  let learningEvidences: any[] = [];
  let learningMaterials: any[] = [];
  let masteryHistories: any[] = [];
  let masteryPolicies: any[] = [];

  const mockPrisma = {
    learner: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `learner-leo`, ...data, createdAt: new Date(), updatedAt: new Date() };
        learners.push(item);
        // Link to parent
        children.push({ id: `child-leo`, parentId: 'parent-user-a', learnerId: item.id });
        return Promise.resolve(item);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where?.legacyChild?.parentId === 'parent-user-a') {
          const lIds = children.filter(c => c.parentId === 'parent-user-a').map(c => c.learnerId);
          return Promise.resolve(learners.filter(l => lIds.includes(l.id)));
        }
        return Promise.resolve(learners);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = learners.find(l => l.id === where.id);
        return Promise.resolve(item || null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = learners.find(l => l.id === where.id);
        return Promise.resolve(item || null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = learners.find(l => l.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
    },
    child: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = children.find(c => c.parentId === where.parentId && c.learnerId === where.learner?.id);
        return Promise.resolve(item || null);
      }),
    },
    concept: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        const filtered = concepts.filter(c => (!where?.domain || c.domain === where.domain) && (!where?.status || c.status === where.status));
        return Promise.resolve(filtered.map(c => ({
          ...c,
          objectives: learningObjectives.filter(lo => lo.conceptId === c.id),
          outgoing: c.id === 'concept-1' ? [
            { sourceId: 'concept-1', targetId: 'concept-2', relationshipType: 'PREREQUISITE' }
          ] : c.id === 'concept-2' ? [
            { sourceId: 'concept-2', targetId: 'concept-3', relationshipType: 'PREREQUISITE' }
          ] : []
        })));
      }),
    },
    curriculumStructure: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `struct-1`, ...data, createdAt: new Date(), updatedAt: new Date() };
        curriculumStructures.push(item);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = curriculumStructures.find(c => c.version === where.version || c.id === where.id);
        if (item) {
          // Join nodes and prerequisites
          const nodesList = curriculumNodes.filter(n => n.structureId === item.id).map(n => ({
            ...n,
            concept: concepts.find(c => c.id === n.conceptId),
            nodeObjectives: curriculumNodeObjectives.filter(cno => cno.curriculumNodeId === n.id).map(cno => ({
              ...cno,
              learningObjective: learningObjectives.find(lo => lo.id === cno.learningObjectiveId)
            }))
          }));
          return Promise.resolve({
            ...item,
            nodes: nodesList,
            prerequisites: curriculumPrerequisites.filter(p => p.structureId === item.id)
          });
        }
        return Promise.resolve(null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = curriculumStructures.find(c => !where.domain || c.domain === where.domain);
        return Promise.resolve(item || null);
      }),
    },
    curriculumNode: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `node-${curriculumNodes.length + 1}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        curriculumNodes.push(item);
        return Promise.resolve(item);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        const list = curriculumNodes.filter(n => !where.structureId || n.structureId === where.structureId || (where.id?.in && where.id.in.includes(n.id)));
        return Promise.resolve(list.map(n => ({
          ...n,
          concept: concepts.find(c => c.id === n.conceptId),
          nodeObjectives: curriculumNodeObjectives.filter(cno => cno.curriculumNodeId === n.id).map(cno => ({
            ...cno,
            learningObjective: learningObjectives.find(lo => lo.id === cno.learningObjectiveId)
          }))
        })));
      }),
    },
    curriculumPrerequisite: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `prereq-${Date.now()}`, ...data };
        curriculumPrerequisites.push(item);
        return Promise.resolve(item);
      }),
    },
    curriculumNodeObjective: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `cno-${Date.now()}`, ...data };
        curriculumNodeObjectives.push(item);
        return Promise.resolve(item);
      }),
    },
    learningObjective: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = learningObjectives.find(lo => lo.id === where.id);
        return Promise.resolve(item || null);
      }),
    },
    learnerCurriculumEnrollment: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `enroll-1`, ...data, createdAt: new Date(), updatedAt: new Date() };
        enrollments.push(item);
        return Promise.resolve(item);
      }),
      upsert: jest.fn().mockImplementation(({ create }) => {
        const item = { id: `enroll-1`, ...create, createdAt: new Date(), updatedAt: new Date() };
        enrollments.push(item);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const parts = where.learnerId_structureId;
        const item = enrollments.find(e => e.learnerId === parts.learnerId && e.structureId === parts.structureId);
        return Promise.resolve(item || null);
      }),
    },
    learnerConceptMastery: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(conceptMasteries.filter(cm => cm.learnerId === where.learnerId));
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const parts = where.learnerId_conceptId;
        const item = conceptMasteries.find(cm => cm.learnerId === parts.learnerId && cm.conceptId === parts.conceptId);
        return Promise.resolve(item || null);
      }),
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        const parts = where.learnerId_conceptId;
        let item = conceptMasteries.find(cm => cm.learnerId === parts.learnerId && cm.conceptId === parts.conceptId);
        if (item) {
          Object.assign(item, update);
        } else {
          item = { id: `cm-${conceptMasteries.length + 1}`, ...create };
          conceptMasteries.push(item);
        }
        return Promise.resolve(item);
      }),
    },
    learnerObjectiveMastery: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(objectiveMasteries.filter(om => om.learnerId === where.learnerId));
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const parts = where.learnerId_learningObjectiveId;
        const item = objectiveMasteries.find(om => om.learnerId === parts.learnerId && om.learningObjectiveId === parts.learningObjectiveId);
        return Promise.resolve(item || null);
      }),
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        const parts = where.learnerId_learningObjectiveId;
        let item = objectiveMasteries.find(om => om.learnerId === parts.learnerId && om.learningObjectiveId === parts.learningObjectiveId);
        if (item) {
          Object.assign(item, update);
        } else {
          item = { id: `om-${objectiveMasteries.length + 1}`, ...create };
          objectiveMasteries.push(item);
        }
        return Promise.resolve(item);
      }),
    },
    learnerCurriculumFrontier: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(frontiers.filter(f => f.learnerId === where.learnerId));
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `front-${frontiers.length + 1}`, ...data };
        frontiers.push(item);
        return Promise.resolve(item);
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }) => {
        const parts = where.learnerId_structureId_currentNodeId;
        let item = frontiers.find(f => f.learnerId === parts.learnerId && f.structureId === parts.structureId && f.currentNodeId === parts.currentNodeId);
        if (item) {
          Object.assign(item, update);
        } else {
          item = { id: `front-${frontiers.length + 1}`, ...create };
          frontiers.push(item);
        }
        return Promise.resolve(item);
      }),
      deleteMany: jest.fn().mockImplementation(({ where }) => {
        frontiers = frontiers.filter(f => f.learnerId !== where.learnerId);
        return Promise.resolve({ count: frontiers.length });
      }),
    },
    learningSession: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `session-1`, ...data, status: SessionStatus.READY, plannedAt: new Date(), startedAt: null, pausedAt: null, finalizedAt: null, sessionEvidences: [] };
        sessions.push(item);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = sessions.find(s => s.id === where.id);
        if (item) {
          item.sessionEvidences = sessionEvidences.filter(se => se.sessionId === item.id);
          item.targets = targets.filter(t => t.sessionId === item.id).map(t => ({
            ...t,
            curriculumNode: curriculumNodes.find(n => n.id === t.curriculumNodeId),
            steps: steps.filter(s => s.targetId === t.id).map(s => ({
              ...s,
              learningObjective: learningObjectives.find(lo => lo.id === s.learningObjectiveId)
            }))
          }));
        }
        return Promise.resolve(item || null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = sessions.find(s => s.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
    },
    sessionTarget: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `target-${targets.length + 1}`, ...data };
        targets.push(item);
        return Promise.resolve(item);
      }),
    },
    sessionStep: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `step-${steps.length + 1}`, ...data, status: SessionStepStatus.PENDING, startedAt: null, completedAt: null };
        steps.push(item);
        return Promise.resolve(item);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        const list = steps.filter(s => s.sessionId === where.sessionId);
        return Promise.resolve(list.map(s => {
          const stepCopy = { ...s };
          stepCopy.assessmentInstances = assessmentInstances
            .filter(ai => ai.sessionStepId === s.id)
            .map(ai => {
              const { sessionStep: _, ...aiCopy } = ai;
              return aiCopy;
            });
          return stepCopy;
        }));
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = steps.find(s => s.id === where.id);
        return Promise.resolve(item || null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = steps.find(s => s.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
    },
    assessmentSpecification: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = assessmentSpecs.find(spec => {
          if (where.learningObjectiveId && typeof where.learningObjectiveId === 'object' && 'in' in where.learningObjectiveId) {
            return where.learningObjectiveId.in.includes(spec.learningObjectiveId);
          }
          return spec.learningObjectiveId === where.learningObjectiveId;
        });
        return Promise.resolve(item || null);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `spec-${assessmentSpecs.length + 1}`, ...data };
        assessmentSpecs.push(item);
        return Promise.resolve(item);
      }),
    },
    assessmentInstance: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `inst-1`, ...data, status: AssessmentInstanceStatus.PENDING };
        assessmentInstances.push(item);
        return Promise.resolve(item);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = assessmentInstances.find(ai => ai.id === where.id);
        if (item) {
          const itemCopy = { ...item };
          const step = steps.find(s => s.id === item.sessionStepId);
          if (step) {
            const { assessmentInstances: _, ...stepCopy } = step;
            const session = sessions.find(s => s.id === step.sessionId);
            const sessionCopy = session ? { ...session, targets: undefined, sessionEvidences: undefined } : undefined;
            const targetItem = targets.find(t => t.id === step.targetId);
            const targetCopy = targetItem ? {
              ...targetItem,
              curriculumNode: curriculumNodes.find(n => n.id === targetItem.curriculumNodeId)
            } : undefined;
            if (targetCopy && targetCopy.curriculumNode) {
              targetCopy.curriculumNode.concept = concepts.find(c => c.id === targetCopy.curriculumNode.conceptId);
            }
            itemCopy.sessionStep = {
              ...stepCopy,
              session: sessionCopy,
              target: targetCopy
            };
          }
          itemCopy.assessmentSpecification = assessmentSpecs.find(spec => spec.id === item.assessmentSpecificationId);
          return Promise.resolve(itemCopy);
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = assessmentInstances.find(ai => ai.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
    },
    assessmentResponse: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `resp-${assessmentResponses.length + 1}`, ...data };
        assessmentResponses.push(item);
        return Promise.resolve(item);
      }),
    },
    sessionEvidence: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `se-${sessionEvidences.length + 1}`, ...data };
        sessionEvidences.push(item);
        return Promise.resolve(item);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(sessionEvidences.filter(se => se.sessionId === where.sessionId));
      }),
    },
    learningEvidence: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = learningEvidences.find(le => le.evidenceKey === where.evidenceKey);
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where?.evidenceKey?.in) {
          return Promise.resolve(learningEvidences.filter(le => where.evidenceKey.in.includes(le.evidenceKey)));
        }
        return Promise.resolve(learningEvidences);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `le-${learningEvidences.length + 1}`, ...data, createdAt: new Date() };
        learningEvidences.push(item);
        return Promise.resolve(item);
      }),
    },
    learningMaterial: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(learningMaterials);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `lm-${learningMaterials.length + 1}`, ...data };
        learningMaterials.push(item);
        return Promise.resolve(item);
      }),
    },
    masteryPolicy: {
      findFirst: jest.fn().mockImplementation(() => {
        if (masteryPolicies.length === 0) return Promise.resolve(null);
        return Promise.resolve(masteryPolicies[masteryPolicies.length - 1]);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `policy-1`, ...data };
        masteryPolicies.push(item);
        return Promise.resolve(item);
      }),
    },
    masteryHistory: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `hist-${masteryHistories.length + 1}`, ...data, createdAt: new Date() };
        masteryHistories.push(item);
        return Promise.resolve(item);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = masteryHistories.find(h => h.evidenceKey === where.evidenceKey);
        return Promise.resolve(item || null);
      }),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => {
      if (typeof fn === 'function') return fn(mockPrisma);
      return fn;
    }),
  };

  beforeAll(async () => {
    // Seed in-memory Concepts & Objectives
    concepts = [
      { id: 'concept-1', canonicalName: 'Basic Fractions', normalizedName: 'basic fractions', status: ConceptStatus.ACTIVE, domain: 'Mathematics', gradeBand: GradeBand.PRIMARY },
      { id: 'concept-2', canonicalName: 'Adding Fractions', normalizedName: 'adding fractions', status: ConceptStatus.ACTIVE, domain: 'Mathematics', gradeBand: GradeBand.PRIMARY },
      { id: 'concept-3', canonicalName: 'Multiplying Fractions', normalizedName: 'multiplying fractions', status: ConceptStatus.ACTIVE, domain: 'Mathematics', gradeBand: GradeBand.PRIMARY },
    ];

    learningObjectives = [
      { id: 'obj-1', conceptId: 'concept-1', code: 'OBJ-1', complexityLevel: 1, description: 'Identify basic fractions.' },
      { id: 'obj-2', conceptId: 'concept-2', code: 'OBJ-2', complexityLevel: 1, description: 'Add simple fractions.' },
      { id: 'obj-3', conceptId: 'concept-3', code: 'OBJ-3', complexityLevel: 1, description: 'Multiply simple fractions.' },
    ];

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
      .useValue({ fileExists: jest.fn().mockResolvedValue(true) })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);
    tokenUser = jwtService.sign({ sub: 'parent-user-a', email: 'parentA@test.com', role: 'PARENT' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('Verify E2E Runtime Learner Journey', async () => {
    // 1. Onboard / create a learner
    const learnerRes = await request(app.getHttpServer())
      .post('/api/v2/learners')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ name: 'Leo', learnerType: 'CHILD' })
      .expect(201);

    const learnerId = learnerRes.body.data.id;
    expect(learnerId).toBe('learner-leo');

    // 2. Generate Universal Curriculum Backbone for Mathematics
    const backboneRes = await request(app.getHttpServer())
      .post('/api/v2/curriculum/generate-backbone')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ domain: 'Mathematics' })
      .expect(200);

    const structure = backboneRes.body.data;
    expect(structure.id).toBe('struct-1');
    expect(structure.version).toBe(1);
    expect(structure.nodes.length).toBe(3);

    // Create an assessment specification for Basic Fractions objective
    const loId = 'obj-1';
    assessmentSpecs.push({
      id: 'spec-1',
      learningObjectiveId: loId,
      complexityLevel: 1,
      scoringMethod: 'EXACT_MATCH',
      passThreshold: 0.75,
      configuration: { question: 'What is 1/2?', options: ['0.5', '2', '0.25'], correctOption: '0.5' },
      version: 1,
      active: true,
    });

    // 3. Enroll the learner in the curriculum version
    await request(app.getHttpServer())
      .post('/api/v2/curriculum/enroll')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ learnerId, structureVersion: structure.version })
      .expect(201);

    // 4. Calculate initial frontier (only concept-1 is ready since concept-2/3 have unmastered prereqs)
    const initFrontierRes = await request(app.getHttpServer())
      .get(`/api/v2/curriculum/frontier/${learnerId}/${structure.version}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    const frontierNodes = initFrontierRes.body.data.frontierNodes;
    expect(frontierNodes.length).toBe(1);
    expect(frontierNodes[0].id).toBe('node-3'); // concept-1 node

    // 5. Plan and launch a learning session
    const sessionRes = await request(app.getHttpServer())
      .post('/api/v2/sessions')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ learnerId, structureVersion: structure.version, timeBudgetMinutes: 45 })
      .expect(201);

    const sessionId = sessionRes.body.data.id;
    expect(sessionId).toBe('session-1');

    // Verify scheduled steps: 1 READ, 1 PRACTICE, 1 ASSESS
    const getSessionRes = await request(app.getHttpServer())
      .get(`/api/v2/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    const sessionData = getSessionRes.body.data;
    expect(sessionData.status).toBe(SessionStatus.READY);
    const targetSteps = sessionData.targets[2].steps;
    expect(targetSteps.length).toBe(3);
    const step1 = targetSteps[0]; // READ
    const step2 = targetSteps[1]; // PRACTICE
    const step3 = targetSteps[2]; // ASSESS

    // 6. Start the session
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    // 7. Complete READ and PRACTICE steps for all targets
    const allSteps = sessionData.targets.flatMap((t: any) => t.steps);
    for (const step of allSteps) {
      if (step.stepType !== 'ASSESS') {
        await request(app.getHttpServer())
          .post(`/api/v2/sessions/${sessionId}/steps/${step.id}/complete`)
          .set('Authorization', `Bearer ${tokenUser}`)
          .expect(200);
      }
    }

    // 8. Try to finalize the session with incomplete ASSESS step (should fail)
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(400);

    // 9. Submit a correct answer to the ASSESS step to trigger mastery recalculation
    const inst = assessmentInstances.find(ai => ai.sessionStepId === step3.id);
    expect(inst).toBeDefined();

    const respondRes = await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/assessments/${inst.id}/respond`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ response: '0.5' }) // correct option
      .expect(200);

    expect(respondRes.body.data.rawScore).toBe(1.0);
    expect(respondRes.body.data.passed).toBe(true);

    // Complete the ASSESS step since response was successfully submitted
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/steps/${step3.id}/complete`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    // 10. Complete/finalize the session successfully now
    const finalizeRes = await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    expect(finalizeRes.body.data.status).toBe(SessionStatus.FINALIZED);

    // 11. Recalculate frontier and verify it advanced to concept-2
    const updatedFrontierRes = await request(app.getHttpServer())
      .get(`/api/v2/curriculum/frontier/${learnerId}/${structure.version}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    const newFrontierNodes = updatedFrontierRes.body.data.frontierNodes;
    expect(newFrontierNodes.length).toBe(1);
    expect(newFrontierNodes[0].id).toBe('node-2'); // advanced to concept-2 because concept-1 is mastered!
  });
});
