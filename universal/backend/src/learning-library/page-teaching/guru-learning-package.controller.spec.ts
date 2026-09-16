import { Test, TestingModule } from '@nestjs/testing';
import { GuruLearningPackageController } from './guru-learning-package.controller';
import { GuruLearningPackageService } from './guru-learning-package.service';

describe('GuruLearningPackageController', () => {
  let controller: GuruLearningPackageController;
  let service: any;

  const mockPackage = {
    metadata: {
      bookId: 'evs-class-5',
      title: 'Our Living Environment',
      subject: 'Environmental Studies',
      grade: 'CLASS 5',
      targetAudience: 'child',
      blueprint: 'notes-v4',
      language: 'en',
      depth: 'basis',
      totalPages: 116,
      readyPagesCount: 1,
      generatedAt: '2026-09-16T00:00:00Z',
    },
    roadmap: [],
    conceptMap: { topics: [], dependencies: [] },
    chapterNotes: [],
    examplesAndScenarios: [],
    mistakesAndTroubleshooting: [],
    memoryTricks: [],
    exercisesAndLabs: [],
    questionBank: { easy: [], medium: [], extended: [] },
    mockTest: {
      title: 'Mock Test',
      totalMarks: 9,
      timeBudgetMinutes: 30,
      instructions: [],
      sections: [],
      rubric: [],
      answerKey: [],
    },
    revisionSheets: {
      quickNotes: [],
      memoryDigest: [],
      onePageCheatSheet: {
        title: 'Cheat Sheet',
        summaryLines: [],
        coreRules: [],
        examWarnings: [],
      },
    },
  };

  beforeEach(async () => {
    service = {
      buildPackage: jest.fn().mockResolvedValue(mockPackage),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuruLearningPackageController],
      providers: [
        {
          provide: GuruLearningPackageService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<GuruLearningPackageController>(GuruLearningPackageController);
  });

  it('delegates getLearningPackage to service with parsed query parameters', async () => {
    const result = await controller.getLearningPackage(
      'evs-class-5',
      'hi',
      'developing',
      'school_student',
      '1',
    );

    expect(result).toEqual(mockPackage);
    expect(service.buildPackage).toHaveBeenCalledWith('evs-class-5', {
      language: 'hi',
      depth: 'developing',
      audience: 'school_student',
      forceRefreshMap: true,
    });
  });

  it('applies default parameters when none provided', async () => {
    await controller.getLearningPackage('evs-class-5');

    expect(service.buildPackage).toHaveBeenCalledWith('evs-class-5', {
      language: 'en',
      depth: 'basis',
      audience: 'child',
      forceRefreshMap: false,
    });
  });

  it('handles refreshLearningPackage with forceRefreshMap true', async () => {
    const result = await controller.refreshLearningPackage('evs-class-5', 'en', 'basis', 'child');

    expect(result).toEqual(mockPackage);
    expect(service.buildPackage).toHaveBeenCalledWith('evs-class-5', {
      language: 'en',
      depth: 'basis',
      audience: 'child',
      forceRefreshMap: true,
    });
  });
});
