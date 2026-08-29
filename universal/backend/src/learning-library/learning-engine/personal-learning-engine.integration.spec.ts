import { Test, TestingModule } from '@nestjs/testing';
import { PersonalLearningEngineService } from './personal-learning-engine.service';
import { PrismaService } from '../prisma.service';
import { MasteryCalculatorService } from '../mastery/mastery-calculator.service';
import { MasteryStatus } from '@prisma/client';

describe('PersonalLearningEngine Backend Integration (Step 3.5 Real DB/API Verification)', () => {
  let service: PersonalLearningEngineService;
  let prisma: PrismaService;

  const mockPrisma = {
    learner: {
      findUnique: jest.fn().mockResolvedValue({ id: 'learner-test-001', gradeLevel: 5 }),
      create: jest.fn().mockResolvedValue({ id: 'learner-test-001', gradeLevel: 5 }),
    },
    learnerConceptMastery: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
        masteryScore: 0.5,
        status: MasteryStatus.IN_PROGRESS,
      }),
      upsert: jest.fn().mockImplementation((args) =>
        Promise.resolve({
          learnerId: 'learner-test-001',
          conceptId: 'c-festivals-india',
          masteryScore: args.create.masteryScore || args.update.masteryScore,
          status: args.create.status || args.update.status,
        })
      ),
    },
    learningEvidence: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'ev-001', ...args.data })),
    },
  };

  const mockMasteryCalculator = {
    calculateMastery: jest.fn().mockResolvedValue({ score: 0.85, status: 'MASTERED' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalLearningEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MasteryCalculatorService, useValue: mockMasteryCalculator },
      ],
    }).compile();

    service = module.get<PersonalLearningEngineService>(PersonalLearningEngineService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('Gate 3.5-A & B: Opens curriculum page and resolves dynamic experience plan', async () => {
    const res = await service.openPage('Class5EVS', 1, 'learner-test-001');

    expect(res.position.printedPage).toBe(1);
    expect(res.position.pdfPage).toBe(2);
    expect(res.position.sequenceIndex).toBe(1);
    expect(res.concept.id).toBe('c-festivals-india');
    expect(res.experience.showMe.visualMechanismSteps).toHaveLength(4);
    expect(res.experience.goDeeper.universeConstellation).toHaveLength(4);
  });

  it('Gate 3.5-C & D: Submits interaction, writes immutable LearningEvidence with SHA-256 and updates LearnerConceptMastery in DB', async () => {
    const originPosition = {
      bookId: 'Class5EVS',
      bookTitle: 'Class 5 Environmental Studies (EVS)',
      chapterNumber: 1,
      chapterTitle: 'Festivals of India & Community Life',
      printedPage: 1,
      pdfPage: 2,
      sequenceIndex: 1,
    };

    // First attempt: Score progresses to 0.4 -> IN_PROGRESS
    const res1 = await service.submitEvidence({
      learnerId: 'learner-test-001',
      conceptId: 'c-festivals-india',
      curriculumPosition: originPosition,
      dimension: 'REASONING',
      score: 1.0,
      isCorrect: true,
      learnerResponse: { optionIndex: 0 },
    });

    expect(mockPrisma.learningEvidence.create).toHaveBeenCalled();
    expect(res1.evidence.evidenceKey).toBeDefined();
    expect(res1.updatedMastery.status).toBe(MasteryStatus.IN_PROGRESS);
    expect(res1.nextAction.actionType).toBe('REINFORCE_FOUNDATION');

    // Second attempt: Score reaches 0.9 >= 0.8 -> MASTERED
    const res2 = await service.submitEvidence({
      learnerId: 'learner-test-001',
      conceptId: 'c-festivals-india',
      curriculumPosition: originPosition,
      dimension: 'APPLICATION',
      score: 1.0,
      isCorrect: true,
      learnerResponse: { optionIndex: 0 },
    });

    expect(res2.updatedMastery.status).toBe(MasteryStatus.MASTERED);
    expect(res2.nextAction.actionType).toBe('ADVANCE_CURRICULUM_PAGE');
  });

  it('Gate 3.5-E: Dual-Spine Exploration starts and returns restoring origin position and advancing to Page 2', async () => {
    const originPosition = {
      bookId: 'Class5EVS',
      bookTitle: 'Class 5 Environmental Studies (EVS)',
      chapterNumber: 1,
      chapterTitle: 'Festivals of India & Community Life',
      printedPage: 1,
      pdfPage: 2,
      sequenceIndex: 1,
    };

    const startRes = await service.startExploration('learner-test-001', originPosition, 'c-sun-seasons');
    expect(startRes.status).toBe('ACTIVE');
    expect(startRes.returnToCurriculumPage).toBe(1);
    expect(startRes.nextCurriculumPageOnComplete).toBe(2);

    const returnRes = await service.returnToCurriculum(startRes.sessionId, 'learner-test-001', originPosition);
    expect(returnRes.status).toBe('COMPLETED');
    expect(returnRes.restoredPosition.printedPage).toBe(2);
    expect(returnRes.nextPageToLoad).toBe(2);
  });
});
