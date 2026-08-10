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
});
