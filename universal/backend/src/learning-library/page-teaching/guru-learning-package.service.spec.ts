import { Test, TestingModule } from '@nestjs/testing';
import { GuruLearningPackageService } from './guru-learning-package.service';
import { PrismaService } from '../prisma.service';
import { GuruBookMapService } from './guru-book-map.service';
import { GuruNotesService } from './guru-notes.service';
import { validateLearningPackage } from './guru-learning-package.schema';

describe('GuruLearningPackageService', () => {
  let service: GuruLearningPackageService;
  let prisma: any;
  let bookMapService: any;
  let notesService: any;

  const mockBookMap = {
    version: 'book-map-v1',
    bookId: 'evs-class-5',
    title: 'Our Living Environment',
    totalPages: 116,
    chapters: [
      {
        chapterNumber: 1,
        title: 'Super Senses & Animal Life',
        pageStart: 1,
        pageEnd: 10,
        topics: [
          {
            topicId: 'topic-senses',
            title: 'Animal Senses',
            physicalPage: 2,
            summary: 'How animals sense their environment',
            keyTerms: ['Silk moth', 'Ant trail'],
          },
        ],
      },
    ],
    keyTerms: [
      {
        term: 'Silk moth',
        definition: 'Can detect female from miles away',
        introducedOnPage: 2,
        chapterNumber: 1,
      },
    ],
    dependencies: [
      {
        id: 'dep-1',
        sourceTopicId: 'topic-senses',
        sourceTopicTitle: 'Animal Senses',
        sourcePage: 2,
        targetTopicId: 'topic-migration',
        targetTopicTitle: 'Migration Patterns',
        targetPage: 3,
        reason: 'Sense organs explain navigation during migration',
        strength: 'essential',
      },
    ],
    generatedAt: '2026-09-16T00:00:00Z',
  };

  const mockPageNotes = [
    {
      id: 'note-1',
      bookId: 'evs-class-5',
      physicalPage: 2,
      language: 'en',
      depth: 'basis',
      payload: {
        notes: {
          title: 'How Animals Sense the World',
          hook: 'Imagine smelling something miles away.',
          bigIdea: 'Animals possess specialized sensory organs for survival.',
          summary: ['Animals use sight, smell, and hearing adapted for survival.'],
          topics: [
            {
              id: 't-senses',
              heading: 'Super Senses of Animals',
              icon: '🐾',
              evidenceIds: ['ev-1'],
              explanation: ['Ants leave a chemical trail that other ants can follow.'],
              keyPoints: ['Ants use pheromone scent trails.'],
              keyTerms: [
                {
                  term: 'Pheromone',
                  meaning: 'Chemical scent left for communication',
                  example: 'Ant trail',
                },
              ],
              example: {
                situation: 'Ants marching in a straight line on the kitchen counter',
                explanation: 'They are following the scent path of the scout ant.',
              },
              commonDoubts: [
                {
                  question: 'Why do ants bump into each other?',
                  answer: 'They touch antennae to smell and identify nest mates.',
                },
              ],
              rememberTip: 'Smell, Sound, Sight — Animals sense light and night',
              didYouKnow: 'Silk moths can identify female scent from several kilometers away.',
              tryNow: {
                title: 'Ant Line Observation',
                steps: ['Drop a sugar crumb', 'Watch first ant', 'Observe the trail formation'],
                whatToNotice: 'Follow the single-file line of marching ants.',
              },
              quiz: [
                {
                  question: 'How do ants identify each other?',
                  options: ['By sight', 'By antennae touch & smell', 'By sound', 'By footprint'],
                  answerIndex: 1,
                  why: 'Ants communicate chemical signatures using antennae.',
                },
              ],
              checkYourself: [
                {
                  question: 'Why do ants walk in a line?',
                  answer: 'Each ant drops a scent that the following ants track.',
                },
              ],
              discussionPrompts: [
                {
                  prompt: 'How might human navigation systems mimic animal scent trails?',
                  guidance: 'Compare GPS waypoints and beacon signals to distributed pheromones.',
                },
              ],
            },
          ],
        },
      },
      extensions: [
        {
          id: 'ext-1',
          topicId: 't-senses',
          question: 'Can human noses smell what ants smell?',
          answer: 'No, ant pheromones exist in micro-concentrations below human olfactory thresholds.',
          evidenceIds: ['ev-1'],
          beyondPage: true,
          createdAt: new Date(),
        },
      ],
    },
  ];

  beforeEach(async () => {
    prisma = {
      guruPageNotes: {
        findMany: jest.fn().mockResolvedValue(mockPageNotes),
      },
      learningMaterial: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    bookMapService = {
      getOrBuildBookMap: jest.fn().mockResolvedValue(mockBookMap),
    };

    notesService = {
      getNotes: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuruLearningPackageService,
        { provide: PrismaService, useValue: prisma },
        { provide: GuruBookMapService, useValue: bookMapService },
        { provide: GuruNotesService, useValue: notesService },
      ],
    }).compile();

    service = module.get<GuruLearningPackageService>(GuruLearningPackageService);
  });

  it('builds a complete, validated master learning package for evs-class-5', async () => {
    const pkg = await service.buildPackage('evs-class-5', {
      language: 'en',
      depth: 'basis',
      audience: 'child',
    });

    expect(pkg).toBeDefined();
    expect(pkg.metadata.bookId).toBe('evs-class-5');
    expect(pkg.metadata.title).toBe('Our Living Environment');
    expect(pkg.metadata.targetAudience).toBe('child');
    expect(pkg.metadata.blueprint).toBe('notes-v4');
    expect(pkg.metadata.totalPages).toBe(116);
    expect(pkg.metadata.readyPagesCount).toBe(1);

    // Roadmap & Concept Map
    expect(pkg.roadmap).toHaveLength(1);
    expect(pkg.roadmap[0].chapterNumber).toBe(1);
    expect(pkg.conceptMap.topics).toHaveLength(1);
    expect(pkg.conceptMap.dependencies).toHaveLength(1);

    // Chapter notes aggregation
    expect(pkg.chapterNotes).toHaveLength(1);
    expect(pkg.chapterNotes[0].pages).toHaveLength(1);
    expect(pkg.chapterNotes[0].pages[0].physicalPage).toBe(2);

    // Rich learning assets
    expect(pkg.examplesAndScenarios).toHaveLength(1);
    expect(pkg.examplesAndScenarios[0].topic).toBe('Super Senses of Animals');

    expect(pkg.mistakesAndTroubleshooting).toHaveLength(1);
    expect(pkg.mistakesAndTroubleshooting[0].kind).toBe('child_doubt');

    expect(pkg.memoryTricks).toHaveLength(1);
    expect(pkg.memoryTricks[0].facts).toContain(
      'Silk moths can identify female scent from several kilometers away.',
    );

    expect(pkg.exercisesAndLabs).toHaveLength(1);
    expect(pkg.exercisesAndLabs[0].title).toBe('Ant Line Observation');

    // Question Bank
    expect(pkg.questionBank.easy.length).toBeGreaterThanOrEqual(1);
    expect(pkg.questionBank.medium.length).toBeGreaterThanOrEqual(1);
    expect(pkg.questionBank.extended.length).toBeGreaterThanOrEqual(2); // 1 prompt + 1 extension

    // Mock Test
    expect(pkg.mockTest).toBeDefined();
    expect(pkg.mockTest.sections).toHaveLength(3);
    expect(pkg.mockTest.totalMarks).toBeGreaterThan(0);
    expect(pkg.mockTest.answerKey.length).toBe(
      pkg.mockTest.sections.reduce((sum, s) => sum + s.questions.length, 0),
    );

    // Revision Sheets
    expect(pkg.revisionSheets.quickNotes).toHaveLength(1);
    expect(pkg.revisionSheets.memoryDigest).toHaveLength(1);
    expect(pkg.revisionSheets.onePageCheatSheet.summaryLines.length).toBeGreaterThan(0);

    // Validator check
    const validation = validateLearningPackage(pkg);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('handles empty page notes gracefully and provides robust fallback package', async () => {
    prisma.guruPageNotes.findMany.mockResolvedValue([]);

    const pkg = await service.buildPackage('evs-class-5', {
      language: 'en',
      depth: 'basis',
      audience: 'child',
    });

    expect(pkg).toBeDefined();
    expect(pkg.metadata.readyPagesCount).toBe(0);
    expect(pkg.questionBank.easy.length).toBeGreaterThan(0);
    expect(pkg.questionBank.medium.length).toBeGreaterThan(0);
    expect(pkg.questionBank.extended.length).toBeGreaterThan(0);
    expect(pkg.mockTest.totalMarks).toBeGreaterThan(0);

    const validation = validateLearningPackage(pkg);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('sources metadata from learningMaterial when available for custom uploads', async () => {
    prisma.learningMaterial.findUnique.mockResolvedValue({
      id: 'custom-physics-12',
      title: 'Advanced Quantum Mechanics',
      subjectName: 'Physics',
      gradeLevel: 'CLASS 12',
      documents: [{ pageCount: 250 }],
    });

    const pkg = await service.buildPackage('custom-physics-12', {
      audience: 'college_student',
      depth: 'advanced',
    });

    expect(pkg.metadata.title).toBe('Advanced Quantum Mechanics');
    expect(pkg.metadata.subject).toBe('Physics');
    expect(pkg.metadata.grade).toBe('CLASS 12');
    expect(pkg.metadata.totalPages).toBe(250);
  });

  it('selects correct blueprint according to target audience', async () => {
    const profPkg = await service.buildPackage('evs-class-5', {
      audience: 'it_professional',
    });
    expect(profPkg.metadata.targetAudience).toBe('it_professional');
    expect(profPkg.metadata.blueprint).toBe('notes-prof-v1');

    const acadPkg = await service.buildPackage('evs-class-5', {
      audience: 'professor',
    });
    expect(acadPkg.metadata.targetAudience).toBe('professor');
    expect(acadPkg.metadata.blueprint).toBe('notes-acad-v1');
  });
});
