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
  AssessmentType,
  ScoringMethod,
} from '@prisma/client';

describe('Phase 2.9 E2E Runtime Journey Integration Tests', () => {
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
        const authorizedLearners = learners.filter(l => {
          if (where?.id?.in) {
            return where.id.in.includes(l.id);
          }
          return true;
        });

        return Promise.resolve(
          authorizedLearners.map(l => ({
            ...l,
            curriculumEnrollments: enrollments
              .filter(e => e.learnerId === l.id && e.active)
              .map(e => ({
                ...e,
                structure: curriculumStructures.find(cs => cs.id === e.structureId),
              })),
          })),
        );
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = learners.find(l => l.id === where.id);
        return Promise.resolve(item || null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = learners.find(l => l.id === where.id);
        if (item) {
          return Promise.resolve({
            ...item,
            curriculumEnrollments: enrollments
              .filter(e => e.learnerId === item.id && e.active)
              .map(e => ({
                ...e,
                structure: curriculumStructures.find(cs => cs.id === e.structureId),
              })),
          });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = learners.find(l => l.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
      count: jest.fn().mockImplementation(() => {
        return Promise.resolve(learners.length);
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
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = concepts.find(c => c.id === where.id);
        return Promise.resolve(item || null);
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
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(curriculumPrerequisites.filter(p => p.structureId === where.structureId));
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `prereq-${curriculumPrerequisites.length + 1}`, ...data };
        curriculumPrerequisites.push(item);
        return Promise.resolve(item);
      }),
    },
    curriculumNodeObjective: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `cno-${curriculumNodeObjectives.length + 1}`, ...data };
        curriculumNodeObjectives.push(item);
        return Promise.resolve(item);
      }),
    },
    learningObjective: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `lo-${learningObjectives.length + 1}`, ...data };
        learningObjectives.push(item);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = learningObjectives.find(lo => lo.id === where.id);
        return Promise.resolve(item || null);
      }),
    },
    learnerCurriculumEnrollment: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = enrollments.find(e => e.learnerId === where.learnerId_structureId.learnerId && e.structureId === where.learnerId_structureId.structureId);
        return Promise.resolve(item || null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = enrollments.find(e => e.learnerId === where.learnerId && e.active === true);
        if (item) {
          const struct = curriculumStructures.find(s => s.id === item.structureId);
          return Promise.resolve({ ...item, structure: struct });
        }
        return Promise.resolve(null);
      }),
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        const parts = where.learnerId_structureId;
        let item = enrollments.find(e => e.learnerId === parts.learnerId && e.structureId === parts.structureId);
        if (item) {
          Object.assign(item, update);
        } else {
          item = { id: `enroll-${enrollments.length + 1}`, ...create, createdAt: new Date(), updatedAt: new Date() };
          enrollments.push(item);
        }
        return Promise.resolve(item);
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
              const aiCopy = { ...ai };
              aiCopy.assessmentSpecification = assessmentSpecs.find(as => as.id === ai.assessmentSpecificationId);
              return aiCopy;
            });
          return stepCopy;
        }));
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = steps.find(s => s.id === where.id);
        if (item) {
          const itemCopy = { ...item };
          const session = sessions.find(s => s.id === item.sessionId);
          itemCopy.session = session ? { id: session.id, learnerId: session.learnerId } : undefined;
          return Promise.resolve(itemCopy);
        }
        return Promise.resolve(null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = steps.find(s => s.id === where.id);
        if (item) {
          const itemCopy = { ...item };
          const session = sessions.find(s => s.id === item.sessionId);
          itemCopy.session = session ? { id: session.id, learnerId: session.learnerId } : undefined;
          return Promise.resolve(itemCopy);
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = steps.find(s => s.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
    },
    assessmentSpecification: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = assessmentSpecs.find(as => as.id === where.id || (as.learningObjectiveId === where.learningObjectiveId_version?.learningObjectiveId && as.version === where.learningObjectiveId_version?.version));
        return Promise.resolve(item || null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = assessmentSpecs.find(spec => {
          if (where.learningObjectiveId && typeof where.learningObjectiveId === 'object' && 'in' in where.learningObjectiveId) {
            return where.learningObjectiveId.in.includes(spec.learningObjectiveId);
          }
          return spec.learningObjectiveId === where.learningObjectiveId;
        });
        return Promise.resolve(item || null);
      }),
    },
    assessmentInstance: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `inst-${assessmentInstances.length + 1}`, ...data, status: AssessmentInstanceStatus.PENDING, createdAt: new Date() };
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
      findUnique: jest.fn().mockImplementation(({ where }) => {
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
        const item = { id: `resp-${assessmentResponses.length + 1}`, ...data, scoredAt: new Date() };
        assessmentResponses.push(item);
        return Promise.resolve(item);
      }),
      count: jest.fn().mockResolvedValue(0),
    },
    notificationEvent: {
      create: jest.fn().mockResolvedValue({ id: 'event-1' }),
    },
    sessionEvidence: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `se-${sessionEvidences.length + 1}`, ...data, createdAt: new Date() };
        sessionEvidences.push(item);
        return Promise.resolve(item);
      }),
    },
    learningEvidence: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `le-${learningEvidences.length + 1}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        learningEvidences.push(item);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = learningEvidences.find(le => le.evidenceKey === where.evidenceKey);
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(learningEvidences);
      }),
    },
    masteryPolicy: {
      findFirst: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          id: 'policy-1',
          evidenceWeight: 0.5,
          halflifeDays: 30,
          scoringMethod: 'EXACT_MATCH',
          version: 1,
          masteryThreshold: 0.85,
          remediationThreshold: 0.50,
          recentWeight: 0.60,
          decayLambda: 0.001,
          confidenceThreshold: 0.90,
        });
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
    $transaction: jest.fn().mockImplementation(async (cb) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return cb;
    }),
  };

  const mockStorageService = {
    saveFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeAll(async () => {
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
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create JWT Token matching parent strategy checks
    tokenUser = jwtService.sign({
      sub: 'parent-user-a',
      email: 'parentA@test.com',
      role: 'PARENT',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('Verify Dynamic Session Lifecycle and Real Active Enrollment Calculations', async () => {
    // 1. Seed dynamic concepts, curriculum nodes, and learning objectives
    concepts = [
      { id: 'concept-1', canonicalName: 'Basic Addition', domain: 'Mathematics', status: ConceptStatus.ACTIVE, type: ConceptType.CONCEPT },
      { id: 'concept-2', canonicalName: 'Basic Subtraction', domain: 'Mathematics', status: ConceptStatus.ACTIVE, type: ConceptType.CONCEPT },
    ];
    learningObjectives = [
      { id: 'lo-1', conceptId: 'concept-1', code: 'LO_ADD', name: 'Addition', complexityLevel: 1 },
      { id: 'lo-2', conceptId: 'concept-2', code: 'LO_SUB', name: 'Subtraction', complexityLevel: 1 },
    ];

    // Seed structure
    const struct = await mockPrisma.curriculumStructure.create({
      data: { domain: 'Mathematics', version: 2, status: CurriculumStatus.PUBLISHED, active: true }
    });

    // Seed nodes
    await mockPrisma.curriculumNode.create({
      data: { structureId: struct.id, conceptId: 'concept-1', sequenceIndex: 1, gradeBand: GradeBand.PRIMARY }
    });
    await mockPrisma.curriculumNode.create({
      data: { structureId: struct.id, conceptId: 'concept-2', sequenceIndex: 2, gradeBand: GradeBand.PRIMARY }
    });

    await mockPrisma.curriculumPrerequisite.create({
      data: {
        structureId: struct.id,
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
      }
    });

    await mockPrisma.curriculumNodeObjective.create({
      data: {
        curriculumNodeId: 'node-1',
        learningObjectiveId: 'lo-1',
      }
    });

    await mockPrisma.curriculumNodeObjective.create({
      data: {
        curriculumNodeId: 'node-2',
        learningObjectiveId: 'lo-2',
      }
    });

    // 2. Onboard learner
    await request(app.getHttpServer())
      .post('/api/v2/learners')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ name: 'Leo', learnerType: 'CHILD' })
      .expect(201);

    // Fetch learners via V2 GET endpoint (verifies Step 1 inclusion logic)
    const learnersRes = await request(app.getHttpServer())
      .get('/api/v2/learners')
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    expect(learnersRes.body.data.length).toBe(1);
    expect(learnersRes.body.data[0].id).toBe('learner-leo');
    // Initially, there is no active enrollment list returned
    expect(learnersRes.body.data[0].curriculumEnrollments.length).toBe(0);

    // Enroll the learner dynamically
    await request(app.getHttpServer())
      .post('/api/v2/curriculum/enroll')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ learnerId: 'learner-leo', structureVersion: 2 })
      .expect(201);

    // Call learners endpoint again and confirm the dynamic enrollment is correctly populated
    const learnersRes2 = await request(app.getHttpServer())
      .get('/api/v2/learners')
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    expect(learnersRes2.body.data[0].curriculumEnrollments.length).toBe(1);
    const resolvedEnrollment = learnersRes2.body.data[0].curriculumEnrollments[0];
    expect(resolvedEnrollment.structure.version).toBe(2);

    // 3. Query initial frontier
    const frontierRes = await request(app.getHttpServer())
      .get(`/api/v2/curriculum/frontier/learner-leo/2`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    expect(frontierRes.body.data.frontierNodes.length).toBe(1);
    expect(frontierRes.body.data.frontierNodes[0].conceptId).toBe('concept-1');

    // Seed mock assessment specs
    assessmentSpecs.push({
      id: 'spec-1',
      learningObjectiveId: 'lo-1',
      assessmentType: AssessmentType.MULTIPLE_CHOICE,
      difficulty: 1,
      scoringMethod: ScoringMethod.EXACT_MATCH,
      passThreshold: 0.75,
      configuration: { question: 'What is 1+1?', options: ['2', '3', '4'], correctOption: '2' },
      version: 1,
      active: true,
    });

    // 4. Plan dynamic session using user-defined budget
    const sessionRes = await request(app.getHttpServer())
      .post('/api/v2/sessions')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ learnerId: 'learner-leo', structureVersion: 2, timeBudgetMinutes: 45 })
      .expect(201);

    const sessionId = sessionRes.body.data.id;
    expect(sessionRes.body.data.status).toBe(SessionStatus.READY);

    // 5. Test explicit player session start control
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    const getSession1 = await request(app.getHttpServer())
      .get(`/api/v2/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);
    expect(getSession1.body.data.status).toBe(SessionStatus.ACTIVE);

    // 6. Test explicit player pause control
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/pause`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    const getSession2 = await request(app.getHttpServer())
      .get(`/api/v2/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);
    expect(getSession2.body.data.status).toBe(SessionStatus.PAUSED);

    // 7. Test explicit player resume control
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/resume`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    const getSession3 = await request(app.getHttpServer())
      .get(`/api/v2/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);
    expect(getSession3.body.data.status).toBe(SessionStatus.ACTIVE);

    // Complete READ/PRACTICE steps
    // Complete all steps except ASSESS steps
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

    // 8. Fetch assessment instance and verify safe configuration shape (no correctAnswer exposed)
    const inst = assessmentInstances.find(ai => ai.sessionStepId === assessStep.id);
    expect(inst).toBeDefined();

    const getAssessmentRes = await request(app.getHttpServer())
      .get(`/api/v2/sessions/${sessionId}/assessments/${inst.id}`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    expect(getAssessmentRes.body.data.instanceId).toBe(inst.id);
    expect(getAssessmentRes.body.data.configuration.question).toBe('What is 1+1?');
    // Ensure correctOption answer key is NOT present in configuration
    expect(getAssessmentRes.body.data.configuration.correctOption).toBeUndefined();

    // 9. Submit correct answer and complete step
    const respondRes = await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/assessments/${inst.id}/respond`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ response: '2' })
      .expect(200);

    expect(respondRes.body.data.passed).toBe(true);
    expect(respondRes.body.data.rawScore).toBe(1.0);

    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/steps/${assessStep.id}/complete`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    // 10. Complete session and verify concept mastery recalculations in database
    await request(app.getHttpServer())
      .post(`/api/v2/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    // Check concept mastery in Prisma
    const conceptMastery = conceptMasteries.find(cm => cm.learnerId === 'learner-leo' && cm.conceptId === 'concept-1');
    expect(conceptMastery).toBeDefined();
    expect(conceptMastery.status).toBe('MASTERED');

    // 11. Verify that next frontier calculation dynamically unlocks concept-2
    const nextFrontierRes = await request(app.getHttpServer())
      .get(`/api/v2/curriculum/frontier/learner-leo/2`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect(200);

    expect(nextFrontierRes.body.data.frontierNodes.length).toBe(1);
    expect(nextFrontierRes.body.data.frontierNodes[0].conceptId).toBe('concept-2');
  });
});
