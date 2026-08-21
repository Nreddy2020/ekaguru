import { Test, TestingModule } from '@nestjs/testing';
import { LearningLibraryAuthGuard } from './learning-library-auth.guard';
import { PrismaService } from './prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('LearningLibraryAuthGuard Security Tests', () => {
  let guard: LearningLibraryAuthGuard;
  let prisma: any;

  const mockLearnerUserA = {
    id: 'learner-user-a',
    name: 'Child User A',
    legacyChildId: 'child-a',
    legacyChild: { id: 'child-a', parentId: 'parent-user-a' },
  };

  const mockLearnerUserB = {
    id: 'learner-user-b',
    name: 'Child User B',
    legacyChildId: 'child-b',
    legacyChild: { id: 'child-b', parentId: 'parent-user-b' },
  };

  const mockMaterialUserB = {
    id: 'mat-user-b',
    learnerId: 'learner-user-b',
    title: 'User B Secret Material',
  };

  const mockDocumentUserB = {
    id: 'doc-user-b',
    materialId: 'mat-user-b',
    material: { learnerId: 'learner-user-b' },
  };

  const mockSessionUserA = {
    id: 'session-user-a',
    learnerId: 'learner-user-a',
  };

  const mockSessionUserB = {
    id: 'session-user-b',
    learnerId: 'learner-user-b',
  };

  const mockStepUserA = {
    id: 'step-user-a',
    sessionId: 'session-user-a',
    session: {
      id: 'session-user-a',
      learnerId: 'learner-user-a',
    },
  };

  const mockStepUserB = {
    id: 'step-user-b',
    sessionId: 'session-user-b',
    session: {
      id: 'session-user-b',
      learnerId: 'learner-user-b',
    },
  };

  const mockAssessmentUserA = {
    id: 'assessment-user-a',
    sessionStepId: 'step-user-a',
    sessionStep: {
      id: 'step-user-a',
      session: {
        id: 'session-user-a',
        learnerId: 'learner-user-a',
      },
    },
  };

  const mockAssessmentUserB = {
    id: 'assessment-user-b',
    sessionStepId: 'step-user-b',
    sessionStep: {
      id: 'step-user-b',
      session: {
        id: 'session-user-b',
        learnerId: 'learner-user-b',
      },
    },
  };

  beforeEach(async () => {
    prisma = {
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
          return Promise.resolve(null);
        }),
      },
      learningMaterial: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'mat-user-b') return Promise.resolve(mockMaterialUserB);
          return Promise.resolve(null);
        }),
      },
      document: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'doc-user-b') return Promise.resolve(mockDocumentUserB);
          return Promise.resolve(null);
        }),
      },
      learningSession: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'session-user-a') return Promise.resolve(mockSessionUserA);
          if (where.id === 'session-user-b') return Promise.resolve(mockSessionUserB);
          return Promise.resolve(null);
        }),
      },
      sessionStep: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'step-user-a') return Promise.resolve(mockStepUserA);
          if (where.id === 'step-user-b') return Promise.resolve(mockStepUserB);
          return Promise.resolve(null);
        }),
      },
      assessmentInstance: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'assessment-user-a') return Promise.resolve(mockAssessmentUserA);
          if (where.id === 'assessment-user-b') return Promise.resolve(mockAssessmentUserB);
          return Promise.resolve(null);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningLibraryAuthGuard,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    guard = module.get<LearningLibraryAuthGuard>(LearningLibraryAuthGuard);
  });

  const createMockContext = (user: any, params: any = {}, body: any = {}, query: any = {}, path: string = '/api/v2/learners/') => ({
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        params,
        body,
        query,
        route: { path },
      }),
    }),
  });

  it('should allow ADMIN full access to any learner or material', async () => {
    const adminUser = { userId: 'admin-1', role: 'ADMIN' };
    const ctx = createMockContext(adminUser, { id: 'learner-user-b' });
    const result = await guard.canActivate(ctx as any);
    expect(result).toBe(true);
  });

  it('Scenario 1: Reject access if User A attempts to access User B learner profile', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    const ctx = createMockContext(userA, { id: 'learner-user-b' });

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 2: Allow User A to access User A learner profile', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    const ctx = createMockContext(userA, { id: 'learner-user-a' });

    const result = await guard.canActivate(ctx as any);
    expect(result).toBe(true);
  });

  it('Scenario 3: Reject User A from reading User B learning material', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    const ctx = createMockContext(userA, { id: 'mat-user-b' }, {}, {}, '/api/v2/learning-materials/:id');

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 4: Reject User A from creating material assigned to User B learnerId', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    const ctx = createMockContext(userA, {}, { learnerId: 'learner-user-b' }, {}, '/api/v2/learning-materials');

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 5: Reject User A from archiving/modifying User B material', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    const ctx = createMockContext(userA, { id: 'mat-user-b' }, {}, { action: 'archive' }, '/api/v2/learning-materials/:id');

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 6: Reject User A from accessing User B document', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    const ctx = createMockContext(userA, { id: 'doc-user-b' }, {}, {}, '/api/v2/documents/:id');

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 7: Return NotFoundException if target material does not exist', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    const ctx = createMockContext(userA, { id: 'non-existent-mat' }, {}, {}, '/api/v2/learning-materials/:id');

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(NotFoundException);
  });

  it('Scenario 8: Reject User A from accessing User B session', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    const ctx = createMockContext(userA, { sessionId: 'session-user-b' }, {}, {}, '/api/v2/sessions/:sessionId');

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 9: Allow User A to access User A session', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    const ctx = createMockContext(userA, { sessionId: 'session-user-a' }, {}, {}, '/api/v2/sessions/:sessionId');

    const result = await guard.canActivate(ctx as any);
    expect(result).toBe(true);
  });

  it('Scenario 10: Reject User A from accessing User B step', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    const ctx = createMockContext(userA, { sessionId: 'session-user-b', stepId: 'step-user-b' }, {}, {}, '/api/v2/sessions/:sessionId/steps/:stepId');

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 11: Reject User A from accessing step with mismatched session', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    // session-user-a is owned by A, but step-user-b belongs to user B's session. Mismatch!
    const ctx = createMockContext(userA, { sessionId: 'session-user-a', stepId: 'step-user-b' }, {}, {}, '/api/v2/sessions/:sessionId/steps/:stepId');

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 12: Reject User A from accessing User B assessment instance', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    const ctx = createMockContext(userA, { assessmentId: 'assessment-user-b' }, {}, {}, '/api/v2/sessions/:sessionId/assessments/:assessmentId');

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
  });

  it('Scenario 13: Reject User A from accessing assessment with mismatched step', async () => {
    const userA = { userId: 'parent-user-a', role: 'PARENT' };
    // step-user-a is owned by A, but assessment-user-b belongs to B. Mismatch!
    const ctx = createMockContext(userA, { stepId: 'step-user-a', assessmentId: 'assessment-user-b' }, {}, {}, '/api/v2/sessions/:sessionId/steps/:stepId/assessments/:assessmentId');

    await expect(guard.canActivate(ctx as any)).rejects.toThrow(ForbiddenException);
  });
});
