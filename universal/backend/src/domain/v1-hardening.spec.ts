import { Test, TestingModule } from '@nestjs/testing';
import { TutorController } from './tutor.controller';
import { ParentController } from './parent.controller';
import { TutorService } from './tutor.service';
import { ParentService } from './parent.service';
import { PrismaService } from '../learning-library/prisma.service';
import { GoneException } from '@nestjs/common';

describe('V1 Route Hardening & Deprecation Tests', () => {
  let tutorController: TutorController;
  let parentController: ParentController;

  const mockTutorService = {
    getTopicExplanation: jest.fn(),
    getLearningGuidance: jest.fn(),
    getStudentProgress: jest.fn(),
    createLearningPath: jest.fn(),
  };

  const mockParentService = {};
  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TutorController, ParentController],
      providers: [
        { provide: TutorService, useValue: mockTutorService },
        { provide: ParentService, useValue: mockParentService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    tutorController = module.get<TutorController>(TutorController);
    parentController = module.get<ParentController>(ParentController);
  });

  it('should throw GoneException (410) when accessing legacy tutor analytics', async () => {
    await expect(tutorController.getAnalytics('student-123')).rejects.toThrow(GoneException);
  });

  it('should have no legacy endpoints defined in ParentController class', () => {
    const legacyMethods = ['getParent', 'getChildren', 'giveConsent'];
    const methods = Object.getOwnPropertyNames(ParentController.prototype);
    for (const m of legacyMethods) {
      expect(methods).not.toContain(m);
    }
  });
});
