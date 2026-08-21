import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LearningLibraryModule } from '../learning-library.module';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { ParentController } from '../../domain/parent.controller';
import { ParentService } from '../../domain/parent.service';
import { PrismaService } from '../prisma.service';
import { OutboxWorkerService } from './outbox-worker.service';
import { StorageService } from '../storage/storage.service';
import { SessionLifecycleService } from './session-lifecycle.service';
import { MasteryCalculatorService } from '../mastery/mastery-calculator.service';
import { AssessmentEngineService } from './assessment-engine.service';
import {
  CurriculumStatus,
  SessionStatus,
  LearnerType,
  ConceptStatus,
  GradeBand,
  MasteryStatus,
} from '@prisma/client';

describe('Phase 3.2 Parent V2 API E2E & Security Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let tokenParentA: string;
  let tokenParentB: string;
  let tokenStudent: string;

  // In-memory Database Store
  let parents: any[] = [];
  let children: any[] = [];
  let learners: any[] = [];
  let curriculumStructures: any[] = [];
  let enrollments: any[] = [];
  let sessions: any[] = [];
  let steps: any[] = [];
  let frontiers: any[] = [];
  let masteries: any[] = [];
  let assessmentResponses: any[] = [];
  let learningObjectives: any[] = [];
  let assessmentSpecs: any[] = [];
  let assessmentInstances: any[] = [];
  let notificationEvents: any[] = [];
  let learningEvidences: any[] = [];
  let concepts: any[] = [];
  let objMasteries: any[] = [];
  let notifications: any[] = [];

  const mockPrisma = {
    parent: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = parents.find((p) => p.id === where.id);
        return Promise.resolve(item || null);
      }),
    },
    child: {
      findMany: jest.fn().mockImplementation(({ where, include }) => {
        let list = children.filter((c) => c.parentId === where.parentId);
        if (include?.learner) {
          list = list.map((c) => {
            const learner = learners.find((l) => l.legacyChildId === c.id);
            const learnerCopy = learner ? { ...learner } : null;
            if (learnerCopy && include.learner.include?.curriculumEnrollments) {
              const activeEnr = enrollments.filter(
                (e) => e.learnerId === learnerCopy.id && e.active === true
              );
              learnerCopy.curriculumEnrollments = activeEnr.map((e) => {
                const struct = curriculumStructures.find((s) => s.id === e.structureId);
                return { ...e, structure: struct };
              });
            }
            return { ...c, learner: learnerCopy };
          });
        }
        return Promise.resolve(list);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where?.learner?.id) {
          const l = learners.find((le) => le.id === where.learner.id);
          const c = children.find((ch) => (ch.id === l?.legacyChildId || ch.learnerId === l?.id) && (!where.parentId || ch.parentId === where.parentId));
          return Promise.resolve(c || null);
        }
        const item = children.find(
          (c) => c.parentId === where.parentId && c.learnerId === where.learner?.id
        );
        if (!item) {
          const l = learners.find((le) => le.id === where.learner?.id);
          const c = children.find((ch) => ch.id === l?.legacyChildId && ch.parentId === where.parentId);
          return Promise.resolve(c || null);
        }
        return Promise.resolve(item || null);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const item = {
          id: `child-${Date.now()}-${Math.random()}`,
          ...data,
          createdAt: new Date(),
        };
        children.push(item);
        return Promise.resolve(item);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = children.find((c) => c.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
    },
    learner: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = {
          id: `learner-${Date.now()}-${Math.random()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        learners.push(item);
        return Promise.resolve(item);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = learners.find((l) => l.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where, include }) => {
        const item = learners.find((l) => l.id === where.id);
        if (item) {
          const itemCopy = { ...item };
          if (include?.legacyChild) {
            itemCopy.legacyChild = children.find((c) => c.id === item.legacyChildId);
          }
          return Promise.resolve(itemCopy);
        }
        return Promise.resolve(null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = learners.find(
          (l) =>
            l.id === where.id &&
            (!where.legacyChild ||
              children.find(
                (ch) => ch.id === l.legacyChildId && ch.parentId === where.legacyChild.parentId
              ))
        );
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(() => {
        return Promise.resolve(learners);
      }),
    },
    curriculumStructure: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = curriculumStructures.find((s) => s.version === where.version || s.id === where.id);
        if (item) {
          return Promise.resolve({
            ...item,
            nodes: item.nodes || [],
            prerequisites: item.prerequisites || [],
          });
        }
        return Promise.resolve(null);
      }),
    },
    learningSession: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = sessions.find((s) => s.id === where.id);
        return Promise.resolve(item || null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = sessions.find(
          (s) => s.learnerId === where.learnerId && (!where.status || s.status === where.status)
        );
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where, include, orderBy, take }) => {
        let list = sessions.filter((s) => s.learnerId === where.learnerId);
        if (where.status?.in) {
          list = list.filter((s) => where.status.in.includes(s.status));
        }
        if (orderBy?.plannedAt === 'desc') {
          list.sort((a, b) => b.plannedAt.getTime() - a.plannedAt.getTime());
        }
        if (take) {
          list = list.slice(0, take);
        }
        if (include?.targets) {
          list = list.map((s) => ({
            ...s,
            targets: [
              {
                curriculumNode: {
                  concept: { canonicalName: 'Basic Addition' },
                },
              },
            ],
            steps: steps.filter((st) => st.sessionId === s.id),
          }));
        }
        return Promise.resolve(list);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = sessions.find((s) => s.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
    },
    learningEvidence: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = learningEvidences.find((e) => e.evidenceKey === where.evidenceKey);
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let list = learningEvidences;
        if (where?.evidenceKey?.in) {
          list = list.filter((e) => where.evidenceKey.in.includes(e.evidenceKey));
        }
        return Promise.resolve(list);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `ev-${Date.now()}`, ...data, createdAt: new Date() };
        learningEvidences.push(item);
        return Promise.resolve(item);
      }),
    },
    sessionStep: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        const list = steps.filter((s) => s.sessionId === where.sessionId);
        return Promise.resolve(list);
      }),
    },
    learnerConceptMastery: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const key = where.learnerId_conceptId;
        const item = masteries.find((m) => m.learnerId === key.learnerId && m.conceptId === key.conceptId);
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let list = masteries;
        if (where?.learnerId) {
          list = list.filter((m) => m.learnerId === where.learnerId);
        }
        return Promise.resolve(
          list.map((m) => {
            const conceptObj = concepts.find((c) => c.id === m.conceptId);
            return {
              ...m,
              concept: m.concept || conceptObj || { id: m.conceptId, canonicalName: 'Default Concept' },
            };
          })
        );
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }) => {
        const key = where.learnerId_conceptId;
        let item = masteries.find((m) => m.learnerId === key.learnerId && m.conceptId === key.conceptId);
        if (item) {
          Object.assign(item, update);
        } else {
          item = { id: `m-${Date.now()}`, ...create };
          masteries.push(item);
        }
        return Promise.resolve(item);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = masteries.find((m) => m.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
    },
    learnerObjectiveMastery: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const key = where.learnerId_learningObjectiveId;
        const item = objMasteries.find((m) => m.learnerId === key.learnerId && m.learningObjectiveId === key.learningObjectiveId);
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(objMasteries.filter((m) => m.learnerId === where.learnerId));
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }) => {
        const key = where.learnerId_learningObjectiveId;
        let item = objMasteries.find((m) => m.learnerId === key.learnerId && m.learningObjectiveId === key.learningObjectiveId);
        if (item) {
          Object.assign(item, update);
        } else {
          item = { id: `om-${Date.now()}`, ...create };
          objMasteries.push(item);
        }
        return Promise.resolve(item);
      }),
    },
    concept: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = concepts.find((c) => c.id === where.id);
        return Promise.resolve(item || null);
      }),
    },
    sessionEvidence: {
      create: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({ id: `se-${Date.now()}`, ...data });
      }),
    },
    masteryHistory: {
      create: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({ id: `h-${Date.now()}`, ...data });
      }),
    },
    learnerCurriculumEnrollment: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = enrollments.find((e) => e.learnerId === where.learnerId && e.active === true);
        if (item) {
          const struct = curriculumStructures.find((s) => s.id === item.structureId);
          return Promise.resolve({ ...item, structure: struct });
        }
        return Promise.resolve(null);
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }) => {
        enrollments
          .filter((e) => e.learnerId === where.learnerId)
          .forEach((e) => Object.assign(e, data));
        return Promise.resolve({ count: enrollments.length });
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }) => {
        const parts = where.learnerId_structureId;
        let item = enrollments.find(
          (e) => e.learnerId === parts.learnerId && e.structureId === parts.structureId
        );
        if (item) {
          Object.assign(item, update);
        } else {
          item = {
            id: `enr-${Date.now()}`,
            ...create,
            createdAt: new Date(),
          };
          enrollments.push(item);
        }
        return Promise.resolve(item);
      }),
    },
    learnerCurriculumFrontier: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        const list = frontiers.filter((f) => f.learnerId === where.learnerId && f.structureId === where.structureId);
        return Promise.resolve(list);
      }),
      deleteMany: jest.fn().mockImplementation(({ where }) => {
        frontiers = frontiers.filter(
          (f) =>
            f.learnerId !== where.learnerId ||
            f.structureId !== where.structureId ||
            (where.currentNodeId?.notIn && where.currentNodeId.notIn.includes(f.currentNodeId))
        );
        return Promise.resolve({ count: frontiers.length });
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }) => {
        const key = where.learnerId_structureId_currentNodeId;
        let item = frontiers.find(
          (f) =>
            f.learnerId === key.learnerId &&
            f.structureId === key.structureId &&
            f.currentNodeId === key.currentNodeId
        );
        if (item) {
          Object.assign(item, update);
        } else {
          item = { id: `f-${Date.now()}`, ...create };
          frontiers.push(item);
        }
        return Promise.resolve(item);
      }),
    },
    assessmentInstance: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = assessmentInstances.find(
          (inst) =>
            inst.id === where.id &&
            (!where.sessionStep ||
              steps.find((st) => st.id === inst.sessionStepId && st.sessionId === where.sessionStep.sessionId))
        );
        if (item) {
          const spec = assessmentSpecs.find((s) => s.id === item.assessmentSpecificationId);
          const step = steps.find((s) => s.id === item.sessionStepId);
          return Promise.resolve({
            ...item,
            assessmentSpecification: spec,
            sessionStep: {
              ...step,
              session: sessions.find((s) => s.id === step.sessionId),
            },
          });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = assessmentInstances.find((inst) => inst.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
    },
    assessmentResponse: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `resp-${Date.now()}`, ...data, scoredAt: new Date() };
        assessmentResponses.push(item);
        return Promise.resolve(item);
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        let list = assessmentResponses.filter((r) => r.passed === where.passed);
        if (where.scoredAt?.gte) {
          list = list.filter((r) => r.scoredAt >= where.scoredAt.gte);
        }
        if (where.assessmentInstance?.learnerId) {
          list = list.filter((r) => {
            const inst = assessmentInstances.find((ai) => ai.id === r.assessmentInstanceId);
            return inst && inst.learnerId === where.assessmentInstance.learnerId;
          });
        }
        if (where.assessmentInstance?.assessmentSpecification?.learningObjectiveId) {
          list = list.filter((r) => {
            const inst = assessmentInstances.find((ai) => ai.id === r.assessmentInstanceId);
            return (
              inst &&
              inst.assessmentSpecificationId ===
                assessmentSpecs.find(
                  (s) => s.learningObjectiveId === where.assessmentInstance.assessmentSpecification.learningObjectiveId
                )?.id
            );
          });
        }
        return Promise.resolve(list.length);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let list = assessmentResponses;
        if (where?.assessmentInstance?.learnerId) {
          list = list.filter((r) => {
            const inst = assessmentInstances.find((ai) => ai.id === r.assessmentInstanceId);
            return inst && inst.learnerId === where.assessmentInstance.learnerId;
          });
        }
        return Promise.resolve(
          list.map((r) => {
            const inst = assessmentInstances.find((ai) => ai.id === r.assessmentInstanceId);
            const spec = assessmentSpecs.find((s) => s.id === inst?.assessmentSpecificationId);
            return {
              ...r,
              assessmentInstance: {
                ...inst,
                assessmentSpecification: spec,
              },
            };
          })
        );
      }),
    },
    masteryPolicy: {
      findFirst: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          version: 1,
          recentWeight: 0.60,
          decayLambda: 0.001,
          masteryThreshold: 0.75,
          remediationThreshold: 0.50,
          confidenceThreshold: 0.70,
        });
      }),
    },
    learningObjective: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = learningObjectives.find((lo) => lo.id === where.id);
        return Promise.resolve(item || null);
      }),
    },
    notificationEvent: {
      create: jest.fn().mockImplementation(({ data }) => {
        const duplicate = notificationEvents.find((e) => e.eventKey === data.eventKey);
        if (duplicate) {
          const error = new Error('Unique constraint failed on eventKey');
          (error as any).code = 'P2002';
          return Promise.reject(error);
        }
        const item = { id: `event-${Date.now()}`, status: 'PENDING', ...data, createdAt: new Date() };
        if (!item.status) {
          item.status = 'PENDING';
        }
        notificationEvents.push(item);
        return Promise.resolve(item);
      }),
      findMany: jest.fn().mockImplementation(() => {
        return Promise.resolve(notificationEvents);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = notificationEvents.find((e) => e.id === where.id);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        notificationEvents.forEach((e) => {
          if (
            e.id === where.id &&
            (!where.status?.in || where.status.in.includes(e.status))
          ) {
            Object.assign(e, data);
            if (data.attempts?.increment) {
              e.attempts = (e.attempts || 0) + data.attempts.increment;
            }
            count++;
          }
        });
        return Promise.resolve({ count });
      }),
    },
    notification: {
      upsert: jest.fn().mockImplementation(({ where, create, update }) => {
        const key = where.eventId_deliveryType_parentId;
        let item = notifications.find(
          (n) =>
            n.eventId === key.eventId &&
            n.deliveryType === key.deliveryType &&
            n.parentId === key.parentId
        );
        if (item) {
          Object.assign(item, update);
        } else {
          item = { id: `notif-${Date.now()}-${Math.random()}`, ...create, createdAt: new Date() };
          notifications.push(item);
        }
        return Promise.resolve(item);
      }),
      findMany: jest.fn().mockImplementation(({ where, take, skip }) => {
        let list = notifications.filter(
          (n) => n.parentId === where.parentId && n.deliveryType === where.deliveryType
        );
        if (skip !== undefined) {
          list = list.slice(skip);
        }
        if (take !== undefined) {
          list = list.slice(0, take);
        }
        return Promise.resolve(list);
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        let list = notifications.filter(
          (n) => n.parentId === where.parentId && n.deliveryType === where.deliveryType
        );
        return Promise.resolve(list.length);
      }),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => {
      if (typeof fn === 'function') return fn(mockPrisma);
      return fn;
    }),
  };

  beforeAll(async () => {
    notificationEvents = [];
    learningEvidences = [];
    concepts = [
      { id: 'concept-mastery-achieved-id', canonicalName: 'Mastery Concept' },
      { id: 'concept-struggle-test', canonicalName: 'Struggle Concept' },
    ];
    objMasteries = [];
    notifications = [];
    // Seed Database state
    parents = [
      { id: 'parent-a', email: 'parentA@test.com', name: 'Parent Alice', consentGiven: true },
      { id: 'parent-b', email: 'parentB@test.com', name: 'Parent Bob', consentGiven: false },
    ];

    children = [
      { id: 'child-a1', parentId: 'parent-a', name: 'Learner Maya', age: 8 },
      { id: 'child-b1', parentId: 'parent-b', name: 'Learner Ben', age: 10 },
    ];

    learners = [
      {
        id: 'learner-maya',
        legacyChildId: 'child-a1',
        name: 'Learner Maya',
        learnerType: LearnerType.CHILD,
        preferredLanguage: 'en',
      },
      {
        id: 'learner-ben',
        legacyChildId: 'child-b1',
        name: 'Learner Ben',
        learnerType: LearnerType.CHILD,
        preferredLanguage: 'fr',
      },
    ];

    curriculumStructures = [
      { id: 'struct-1', version: 1, name: 'Curriculum Version 1', status: CurriculumStatus.PUBLISHED },
      { id: 'struct-2', version: 2, name: 'Curriculum Version 2', status: CurriculumStatus.PUBLISHED },
      { id: 'struct-3', version: 3, name: 'Curriculum Version 3', status: CurriculumStatus.DRAFT },
    ];

    enrollments = [
      { id: 'enr-1', learnerId: 'learner-maya', structureId: 'struct-1', active: true },
      { id: 'enr-2', learnerId: 'learner-ben', structureId: 'struct-2', active: true },
    ];

    const secret = 'ekaguru-secret-key-change-in-production';
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret, signOptions: { expiresIn: '1h' } }),
        LearningLibraryModule,
      ],
      controllers: [ParentController],
      providers: [JwtStrategy, ParentService],
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
    tokenParentA = jwtService.sign({ sub: 'parent-a', email: 'parentA@test.com', role: 'PARENT' });
    tokenParentB = jwtService.sign({ sub: 'parent-b', email: 'parentB@test.com', role: 'PARENT' });
    tokenStudent = jwtService.sign({ sub: 'learner-maya', email: 'maya@test.com', role: 'STUDENT' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v2/parent/profile', () => {
    it('should retrieve profile for authenticated parent Alice', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v2/parent/profile')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .expect(200);

      expect(res.body.data.id).toBe('parent-a');
      expect(res.body.data.name).toBe('Parent Alice');
      expect(res.body.data.consentGiven).toBe(true);
    });

    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/parent/profile')
        .expect(401);
    });
  });

  describe('GET /api/v2/parent/learners', () => {
    it('should retrieve learners linked exclusively to Parent A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v2/parent/learners')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe('learner-maya');
      expect(res.body.data[0].name).toBe('Learner Maya');
      expect(res.body.data[0].curriculumEnrollments[0].structure.version).toBe(1);
    });
  });

  describe('POST /api/v2/parent/learners', () => {
    it('should onboard a new learner under Parent A', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v2/parent/learners')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .send({
          name: 'Timmy',
          age: 6,
          preferredLanguage: 'es',
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Timmy');
      expect(res.body.data.preferredLanguage).toBe('es');

      // Assert linked Child/Learner were added in DB mocks
      const timmyLearner = learners.find((l) => l.name === 'Timmy');
      expect(timmyLearner).toBeDefined();
      const timmyChild = children.find((c) => c.name === 'Timmy');
      expect(timmyChild).toBeDefined();
      expect(timmyChild.parentId).toBe('parent-a');
      expect(timmyLearner.legacyChildId).toBe(timmyChild.id);
    });
  });

  describe('PATCH /api/v2/parent/learners/:learnerId', () => {
    it('should allow Parent A to update their learner Maya', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v2/parent/learners/learner-maya')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .send({
          name: 'Maya Updated',
          preferredLanguage: 'de',
        })
        .expect(200);

      expect(res.body.data.name).toBe('Maya Updated');
      expect(res.body.data.preferredLanguage).toBe('de');

      // Verify DB updates
      const l = learners.find((le) => le.id === 'learner-maya');
      expect(l.name).toBe('Maya Updated');
      const c = children.find((ch) => ch.id === 'child-a1');
      expect(c.name).toBe('Maya Updated');
    });

    it('should block Parent B from updating Parent A\'s learner (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .patch('/api/v2/parent/learners/learner-maya')
        .set('Authorization', `Bearer ${tokenParentB}`)
        .send({ name: 'HackAttempt' })
        .expect(403);
    });
  });

  describe('POST /api/v2/parent/learners/:learnerId/enroll', () => {
    beforeEach(() => {
      // Clear sessions & enrollments
      sessions = [];
      enrollments = [
        { id: 'enr-1', learnerId: 'learner-maya', structureId: 'struct-1', active: true },
      ];
    });

    it('should allow Parent A to switch Maya\'s enrollment to version 2 (PUBLISHED)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v2/parent/learners/learner-maya/enroll')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .send({ structureVersion: 2 })
        .expect(200);

      expect(res.body.data.structureId).toBe('struct-2');
      expect(res.body.data.active).toBe(true);

      const activeEnr = enrollments.find(
        (e) => e.learnerId === 'learner-maya' && e.structureId === 'struct-2'
      );
      expect(activeEnr.active).toBe(true);

      // Check version 1 is set to inactive
      const oldEnr = enrollments.find(
        (e) => e.learnerId === 'learner-maya' && e.structureId === 'struct-1'
      );
      expect(oldEnr.active).toBe(false);
    });

    it('should reject enrollment switches to DRAFT curriculum structures (403 or 400)', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/parent/learners/learner-maya/enroll')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .send({ structureVersion: 3 })
        .expect(400); // Rejects non-PUBLISHED versions
    });

    it('should reject parent enrolling a child owned by another parent (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/parent/learners/learner-maya/enroll')
        .set('Authorization', `Bearer ${tokenParentB}`)
        .send({ structureVersion: 2 })
        .expect(403);
    });

    it('should reject enrollment switch if learner has an ACTIVE session (409 Conflict)', async () => {
      sessions.push({
        id: 'sess-active',
        learnerId: 'learner-maya',
        status: SessionStatus.ACTIVE,
        plannedAt: new Date(),
      });

      await request(app.getHttpServer())
        .post('/api/v2/parent/learners/learner-maya/enroll')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .send({ structureVersion: 2 })
        .expect(409);
    });

    it('should auto-abandon a READY session when enrollment switches successfully', async () => {
      const readySess = {
        id: 'sess-ready',
        learnerId: 'learner-maya',
        status: SessionStatus.READY,
        sessionRequestFingerprint: 'fingerprint-123',
        plannedAt: new Date(),
      };
      sessions.push(readySess);

      await request(app.getHttpServer())
        .post('/api/v2/parent/learners/learner-maya/enroll')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .send({ structureVersion: 2 })
        .expect(200);

      expect(readySess.status).toBe(SessionStatus.ABANDONED);
      expect(readySess.sessionRequestFingerprint).toBeNull();
    });
  });

  describe('GET /api/v2/parent/learners/:learnerId/analytics', () => {
    beforeEach(() => {
      frontiers = [
        {
          id: 'f-1',
          learnerId: 'learner-maya',
          currentNode: {
            concept: { id: 'c-1', canonicalName: 'Basic Addition' },
          },
        },
      ];
      masteries = [
        { id: 'm-1', learnerId: 'learner-maya', status: 'MASTERED', masteryScore: 0.8 },
        { id: 'm-2', learnerId: 'learner-maya', status: 'IN_PROGRESS', masteryScore: 0.6 },
        { id: 'm-3', learnerId: 'learner-maya', status: 'NEEDS_REMEDIATION', masteryScore: 0.4 },
      ];
      sessions = [
        {
          id: 'sess-recent',
          learnerId: 'learner-maya',
          status: 'FINALIZED',
          actualDurationSeconds: 1200,
          plannedAt: new Date(),
          completedAt: new Date(),
        },
      ];
      assessmentResponses = [];
      assessmentInstances = [];
      assessmentSpecs = [];
      learningObjectives = [];
    });

    it('should retrieve parent analytics for learner Maya successfully', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v2/parent/learners/learner-maya/analytics')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .expect(200);

      expect(res.body.data.frontier.length).toBe(1);
      expect(res.body.data.frontier[0].canonicalName).toBe('Basic Addition');

      expect(res.body.data.mastery.masteredCount).toBe(1);
      expect(res.body.data.mastery.inProgressCount).toBe(1);
      expect(res.body.data.mastery.needsReviewCount).toBe(1);

      expect(res.body.data.recentActivity.length).toBe(1);
      expect(res.body.data.recentActivity[0].conceptName).toBe('Basic Addition');
    });

    it('should trigger ASSESSMENT_STALL alert when objective fails >=3 times in rolling 7 days', async () => {
      learningObjectives.push({ id: 'lo-1', description: 'Add 1+1' });
      assessmentSpecs.push({ id: 'spec-1', learningObjectiveId: 'lo-1' });
      assessmentInstances.push(
        { id: 'ai-1', learnerId: 'learner-maya', assessmentSpecificationId: 'spec-1' },
        { id: 'ai-2', learnerId: 'learner-maya', assessmentSpecificationId: 'spec-1' },
        { id: 'ai-3', learnerId: 'learner-maya', assessmentSpecificationId: 'spec-1' }
      );
      assessmentResponses.push(
        { id: 'r-1', assessmentInstanceId: 'ai-1', passed: false, scoredAt: new Date() },
        { id: 'r-2', assessmentInstanceId: 'ai-2', passed: false, scoredAt: new Date() },
        { id: 'r-3', assessmentInstanceId: 'ai-3', passed: false, scoredAt: new Date() }
      );

      const res = await request(app.getHttpServer())
        .get('/api/v2/parent/learners/learner-maya/analytics')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .expect(200);

      const stallAlert = res.body.data.attentionSignals.find((s) => s.type === 'ASSESSMENT_STALL');
      expect(stallAlert).toBeDefined();
      expect(stallAlert.description).toContain("failed assessment attempts");
    });

    it('should trigger SESSION_STUCK alert when ACTIVE session is older than 48 hours without progress', async () => {
      const activeSess = {
        id: 'sess-stuck',
        learnerId: 'learner-maya',
        status: SessionStatus.ACTIVE,
        plannedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        steps: [],
      };
      sessions.push(activeSess);

      const res = await request(app.getHttpServer())
        .get('/api/v2/parent/learners/learner-maya/analytics')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .expect(200);

      const stuckAlert = res.body.data.attentionSignals.find((s) => s.type === 'SESSION_STUCK');
      expect(stuckAlert).toBeDefined();
      expect(stuckAlert.description).toContain("active/paused for over 48 hours");
    });

    it('should trigger INACTIVITY alert when no sessions started/completed for >7 days', async () => {
      // Set recent session plannedAt/completedAt to 8 days ago
      sessions[0].plannedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      sessions[0].completedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      sessions[0].startedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      const res = await request(app.getHttpServer())
        .get('/api/v2/parent/learners/learner-maya/analytics')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .expect(200);

      const inactiveAlert = res.body.data.attentionSignals.find((s) => s.type === 'INACTIVITY');
      expect(inactiveAlert).toBeDefined();
      expect(inactiveAlert.description).toContain("No study session");
    });

    it('should trigger DECAY_WARNING alert when mastery decays below 50%', async () => {
      masteries[0].concept = { id: 'c-1', canonicalName: 'Basic Addition' };
      masteries[0].masteryScore = 0.6; // drops below 0.50 after ~180 hours (7.5 days) at lambda = 0.001
      masteries[0].lastAssessedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const res = await request(app.getHttpServer())
        .get('/api/v2/parent/learners/learner-maya/analytics')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .expect(200);

      const decayAlert = res.body.data.attentionSignals.find((s) => s.type === 'DECAY_WARNING');
      expect(decayAlert).toBeDefined();
      expect(decayAlert.description).toContain("decayed below 50%");
    });
  });

  describe('Phase 3.4 — Outbox & Event Triggers', () => {
    beforeEach(() => {
      notificationEvents.length = 0;
    });

    it('should create SESSION_COMPLETED outbox event when session is completed/finalized', async () => {
      const lifecycleService = app.get(SessionLifecycleService);

      const newSess = {
        id: 'sess-completed-trigger-test',
        learnerId: 'learner-maya',
        status: SessionStatus.ACTIVE,
        plannedAt: new Date(),
        startedAt: new Date(),
        sessionEvidences: [],
      };
      sessions.push(newSess);

      steps.push({
        id: 'step-comp-1',
        sessionId: 'sess-completed-trigger-test',
        stepType: 'READ',
        status: 'COMPLETED',
        assessmentInstances: [],
      });

      await lifecycleService.completeSession('sess-completed-trigger-test');

      const completedEvent = notificationEvents.find(e => e.eventType === 'SESSION_COMPLETED');
      expect(completedEvent).toBeDefined();
      expect(completedEvent.learnerId).toBe('learner-maya');
      expect(completedEvent.aggregateType).toBe('session');
      expect(completedEvent.aggregateId).toBe('sess-completed-trigger-test');
      expect(completedEvent.payload.sessionId).toBe('sess-completed-trigger-test');
    });

    it('should create MASTERY_ACHIEVED outbox event when a learner masters a concept', async () => {
      const masteryService = app.get(MasteryCalculatorService);

      await masteryService.recordEvidence({
        evidenceKey: 'mastery-achieved-trigger-evidence-key',
        learnerId: 'learner-maya',
        conceptId: 'concept-mastery-achieved-id',
        rawScore: 0.95,
      });

      const achievedEvent = notificationEvents.find(e => e.eventType === 'MASTERY_ACHIEVED');
      expect(achievedEvent).toBeDefined();
      expect(achievedEvent.learnerId).toBe('learner-maya');
      expect(achievedEvent.aggregateType).toBe('concept');
      expect(achievedEvent.aggregateId).toBe('concept-mastery-achieved-id');
      expect(achievedEvent.payload.conceptId).toBe('concept-mastery-achieved-id');
    });

    it('should create ASSESSMENT_STRUGGLE outbox event when rolling failures exceed threshold', async () => {
      const assessmentEngine = app.get(AssessmentEngineService);

      assessmentSpecs.push({
        id: 'spec-struggle-test',
        learningObjectiveId: 'obj-struggle-test',
        assessmentType: 'MULTIPLE_CHOICE',
        passThreshold: 0.75,
        configuration: { correctOption: 'A' },
        scoringMethod: 'EXACT_MATCH',
      });

      const activeSession = {
        id: 'sess-struggle-test',
        learnerId: 'learner-maya',
        status: SessionStatus.ACTIVE,
        plannedAt: new Date(),
        startedAt: new Date(),
      };
      sessions.push(activeSession);

      const targetId = 'target-struggle-test';
      steps.push({
        id: 'step-struggle-test',
        sessionId: 'sess-struggle-test',
        targetId,
        stepType: 'ASSESS',
        learningObjectiveId: 'obj-struggle-test',
        status: 'IN_PROGRESS',
        assessmentInstances: [],
        target: {
          id: targetId,
          curriculumNode: {
            id: 'node-struggle-test',
            concept: { id: 'concept-struggle-test' },
          },
        },
      });

      const inst1 = {
        id: 'inst-fail-1',
        sessionStepId: 'step-struggle-test',
        assessmentSpecificationId: 'spec-struggle-test',
        learnerId: 'learner-maya',
        attemptNumber: 1,
        status: 'PENDING',
      };
      const inst2 = {
        id: 'inst-fail-2',
        sessionStepId: 'step-struggle-test',
        assessmentSpecificationId: 'spec-struggle-test',
        learnerId: 'learner-maya',
        attemptNumber: 2,
        status: 'PENDING',
      };
      const inst3 = {
        id: 'inst-fail-3',
        sessionStepId: 'step-struggle-test',
        assessmentSpecificationId: 'spec-struggle-test',
        learnerId: 'learner-maya',
        attemptNumber: 3,
        status: 'PENDING',
      };
      assessmentInstances.push(inst1, inst2, inst3);

      await assessmentEngine.submitResponse('sess-struggle-test', 'inst-fail-1', { response: 'B' });
      await assessmentEngine.submitResponse('sess-struggle-test', 'inst-fail-2', { response: 'B' });
      await assessmentEngine.submitResponse('sess-struggle-test', 'inst-fail-3', { response: 'B' });

      const struggleEvent = notificationEvents.find(e => e.eventType === 'ASSESSMENT_STRUGGLE');
      expect(struggleEvent).toBeDefined();
      expect(struggleEvent.learnerId).toBe('learner-maya');
      expect(struggleEvent.aggregateType).toBe('objective');
      expect(struggleEvent.aggregateId).toBe('obj-struggle-test');
      expect(struggleEvent.payload.learningObjectiveId).toBe('obj-struggle-test');

      const initialCount = notificationEvents.filter(e => e.eventType === 'ASSESSMENT_STRUGGLE').length;
      
      const inst4 = {
        id: 'inst-fail-4',
        sessionStepId: 'step-struggle-test',
        assessmentSpecificationId: 'spec-struggle-test',
        learnerId: 'learner-maya',
        attemptNumber: 4,
        status: 'PENDING',
      };
      assessmentInstances.push(inst4);

      await assessmentEngine.submitResponse('sess-struggle-test', 'inst-fail-4', { response: 'B' });
      const finalCount = notificationEvents.filter(e => e.eventType === 'ASSESSMENT_STRUGGLE').length;
      expect(finalCount).toBe(initialCount);
    });

    it('should create MASTERY_DECAYED outbox event when decay worker runs and score decays below threshold', async () => {
      const outboxWorker = app.get(OutboxWorkerService);

      masteries.push({
        id: 'mastery-decay-id',
        learnerId: 'learner-maya',
        conceptId: 'concept-decay-id',
        concept: { id: 'concept-decay-id', canonicalName: 'Decayed Concept' },
        masteryScore: 0.6,
        status: 'MASTERED',
        lastAssessedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      });

      await outboxWorker.runDecayCheck();

      const decayEvent = notificationEvents.find(e => e.eventType === 'MASTERY_DECAYED');
      expect(decayEvent).toBeDefined();
      expect(decayEvent.learnerId).toBe('learner-maya');
      expect(decayEvent.payload.decayedScore).toBeLessThan(0.50);
    });

    it('should create LEARNER_INACTIVE outbox event when inactivity worker runs and learner is inactive', async () => {
      const outboxWorker = app.get(OutboxWorkerService);

      sessions.forEach(s => {
        s.plannedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        s.startedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        s.completedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      });

      await outboxWorker.runInactivityCheck();

      const inactiveEvent = notificationEvents.find(e => e.eventType === 'LEARNER_INACTIVE');
      expect(inactiveEvent).toBeDefined();
      expect(inactiveEvent.learnerId).toBe('learner-maya');
    });

    it('should process pending outbox events and allow parents to read in-app feed via GET /api/v2/parent/notifications', async () => {
      notificationEvents.push({
        id: 'event-manual-feed-test',
        learnerId: 'learner-maya',
        eventType: 'SESSION_COMPLETED',
        aggregateType: 'session',
        aggregateId: 'sess-manual-feed-test',
        eventKey: 'key-manual-feed-test',
        payload: { score: 1.0 },
        status: 'PENDING',
        attempts: 0,
        createdAt: new Date(),
      });

      const outboxWorker = app.get(OutboxWorkerService);

      await outboxWorker.dispatchPendingEvents();

      const res = await request(app.getHttpServer())
        .get('/api/v2/parent/notifications')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].deliveryType).toBe('IN_APP');
      expect(res.body.data[0].event).toBeDefined();
    });

    it('should prevent double claiming of the same event by concurrent workers', async () => {
      notificationEvents.push({
        id: 'event-concurrency-test',
        learnerId: 'learner-maya',
        eventType: 'SESSION_COMPLETED',
        aggregateType: 'session',
        aggregateId: 'sess-concurrency-test',
        eventKey: 'key-concurrency-test',
        payload: { score: 1.0 },
        status: 'PENDING',
        attempts: 0,
        createdAt: new Date(),
      });

      const outboxWorker = app.get(OutboxWorkerService);
      const initialNotifCount = notifications.length;

      // First worker run claims and dispatches
      await outboxWorker.dispatchPendingEvents();
      const preWorkerBNotifCount = notifications.length;

      // Second worker run (representing concurrent instance) sees status PROCESSING and skips
      await outboxWorker.dispatchPendingEvents();
      const postWorkerBNotifCount = notifications.length;

      expect(preWorkerBNotifCount - initialNotifCount).toBe(2); // 1 IN_APP, 1 EMAIL
      expect(postWorkerBNotifCount - preWorkerBNotifCount).toBe(0); // skipped
    });

    it('should recover stuck PROCESSING events and mark them PENDING or FAILED', async () => {
      const outboxWorker = app.get(OutboxWorkerService);

      // Stuck event with 1 attempt
      notificationEvents.push({
        id: 'event-stuck-1',
        learnerId: 'learner-maya',
        eventType: 'SESSION_COMPLETED',
        aggregateType: 'session',
        aggregateId: 'sess-stuck-1',
        eventKey: 'key-stuck-1',
        payload: {},
        status: 'PROCESSING',
        attempts: 1,
        lastAttemptAt: new Date(Date.now() - 20 * 60 * 1000), // 20 mins ago
        createdAt: new Date(),
      });

      // Stuck event with 3 attempts
      notificationEvents.push({
        id: 'event-stuck-3',
        learnerId: 'learner-maya',
        eventType: 'SESSION_COMPLETED',
        aggregateType: 'session',
        aggregateId: 'sess-stuck-3',
        eventKey: 'key-stuck-3',
        payload: {},
        status: 'PROCESSING',
        attempts: 3,
        lastAttemptAt: new Date(Date.now() - 20 * 60 * 1000), // 20 mins ago
        createdAt: new Date(),
      });

      await outboxWorker.recoverStuckEvents();

      const ev1 = notificationEvents.find(e => e.id === 'event-stuck-1');
      const ev3 = notificationEvents.find(e => e.id === 'event-stuck-3');

      expect(ev1.status).toBe('PENDING');
      expect(ev3.status).toBe('FAILED');
      expect(ev3.lastError).toContain('Max retry attempts exceeded');
    });

    it('should return paginated notification feed with metadata', async () => {
      // Clear previous notifications
      notifications.length = 0;

      // Seed 5 notifications for parent-a
      for (let i = 1; i <= 5; i++) {
        notifications.push({
          id: `notif-pag-${i}`,
          eventId: `event-pag-${i}`,
          deliveryType: 'IN_APP',
          parentId: 'parent-a',
          createdAt: new Date(),
        });
      }

      // Query page 1 (size 2)
      const res1 = await request(app.getHttpServer())
        .get('/api/v2/parent/notifications?take=2&skip=0')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .expect(200);

      expect(res1.body.data.length).toBe(2);
      expect(res1.body.meta.total).toBe(5);
      expect(res1.body.meta.take).toBe(2);
      expect(res1.body.meta.skip).toBe(0);
      expect(res1.body.meta.hasMore).toBe(true);

      // Query page 3 (size 2, skip 4)
      const res2 = await request(app.getHttpServer())
        .get('/api/v2/parent/notifications?take=2&skip=4')
        .set('Authorization', `Bearer ${tokenParentA}`)
        .expect(200);

      expect(res2.body.data.length).toBe(1);
      expect(res2.body.meta.total).toBe(5);
      expect(res2.body.meta.hasMore).toBe(false);
    });
  });
});
