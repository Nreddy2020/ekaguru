import { validateLearningPackage, MasterLearningPackage } from './guru-learning-package.schema';

describe('MasterLearningPackage Schema & Validator', () => {
  const validPackage: MasterLearningPackage = {
    metadata: {
      bookId: 'evs-class-5',
      title: 'Our Living Environment',
      subject: 'Environmental Studies',
      grade: 'CLASS 5',
      targetAudience: 'child',
      blueprint: 'notes-v4',
      language: 'en',
      depth: 'basis',
      totalPages: 10,
      readyPagesCount: 2,
      generatedAt: '2026-09-16T00:00:00Z',
    },
    roadmap: [
      {
        chapterNumber: 1,
        title: 'Plant and Animal Life',
        pageRange: { from: 1, to: 5 },
        concepts: ['Germination', 'Roots'],
        objectives: ['Explain germination'],
      },
    ],
    conceptMap: {
      topics: [
        {
          topicId: 't1',
          title: 'Germination',
          physicalPage: 1,
          summary: 'Seeds grow',
          keyTerms: ['Seed'],
        },
      ],
      dependencies: [
        {
          id: 'dep-1',
          sourcePage: 1,
          sourceTopicId: 't1',
          sourceTopicTitle: 'Germination',
          targetPage: 2,
          targetTopicId: 't2',
          targetTopicTitle: 'Roots',
          strength: 'essential',
          reason: 'Seed must germinate before roots spread',
        },
      ],
    },
    chapterNotes: [
      {
        chapterNumber: 1,
        chapterTitle: 'Plant and Animal Life',
        pageRange: { from: 1, to: 5 },
        pages: [
          {
            physicalPage: 1,
            title: 'How Seeds Sprout',
            topics: [
              {
                id: 't1',
                heading: 'Germination',
                icon: '🌱',
                evidenceIds: ['e1'],
                explanation: ['Seeds need water and warmth to sprout.'],
                keyPoints: ['Seeds need water and warmth to sprout'],
                keyTerms: [{ term: 'Germination', meaning: 'Process of seeds developing into plants', example: 'Bean sprout' }],
                example: { situation: 'Soaking chana seeds', explanation: 'White shoots appear after 2 days' },
                rememberTip: 'Water, warmth, air',
                commonDoubts: [{ question: 'Do seeds need dirt to start?', answer: 'No, only moisture and warmth.' }],
                checkYourself: [{ question: 'What wakes a seed?', answer: 'Moisture' }],
              },
            ],
            summary: ['Seeds sprout when given water and warmth.'],
          },
        ],
      },
    ],
    examplesAndScenarios: [
      {
        chapterNumber: 1,
        page: 1,
        topic: 'Germination',
        situation: 'Soaking chana seeds overnight',
        explanation: 'The seed coat softens and embryo sprouts',
      },
    ],
    mistakesAndTroubleshooting: [
      {
        chapterNumber: 1,
        page: 1,
        topic: 'Germination',
        questionOrSymptom: 'Seeds drowned in water fail to sprout',
        explanationOrFix: 'Embryo suffocated; seeds need air in addition to water',
        kind: 'child_doubt',
      },
    ],
    memoryTricks: [
      {
        chapterNumber: 1,
        page: 1,
        topic: 'Germination',
        tip: 'W-W-A: Water, Warmth, Air',
        facts: ['Some seeds survive in ice for centuries.'],
      },
    ],
    exercisesAndLabs: [
      {
        chapterNumber: 1,
        page: 1,
        topic: 'Germination',
        title: 'Wet Cotton Seed Test',
        steps: ['Dampen cotton', 'Place bean', 'Observe for 3 days'],
        verificationOrNotice: 'A tiny white root should break out',
        kind: 'try_now',
      },
    ],
    questionBank: {
      easy: [
        {
          id: 'q-easy-1',
          chapterNumber: 1,
          page: 1,
          topic: 'Germination',
          difficulty: 'easy',
          question: 'What do seeds need to sprout?',
          options: ['Water, air, warmth', 'Only dark soil', 'Plastic sheet', 'Sugar'],
          answer: 'Water, air, warmth',
          marks: 1,
        },
      ],
      medium: [
        {
          id: 'q-med-1',
          chapterNumber: 1,
          page: 1,
          topic: 'Germination',
          difficulty: 'medium',
          question: 'Why do seeds in deep water not sprout well?',
          answer: 'Because they lack sufficient oxygen/air.',
          marks: 3,
        },
      ],
      extended: [
        {
          id: 'q-ext-1',
          chapterNumber: 1,
          page: 1,
          topic: 'Germination',
          difficulty: 'extended',
          question: 'Design an experiment to prove sunlight is not required for the initial sprouting stage.',
          answer: 'Place one cup with soaked seeds in a dark cupboard and one in sunlight. Both sprout.',
          marks: 5,
        },
      ],
    },
    mockTest: {
      title: 'Our Living Environment - Master Summative Mock Assessment',
      totalMarks: 9,
      timeBudgetMinutes: 30,
      instructions: ['Answer all questions', 'Section A is objective', 'Section B is short answer'],
      sections: [
        {
          sectionId: 'sec-a',
          name: 'Section A: Recall & Foundations',
          instructions: 'Choose the correct option.',
          totalMarks: 1,
          questions: [
            {
              id: 'q-easy-1',
              chapterNumber: 1,
              page: 1,
              topic: 'Germination',
              difficulty: 'easy',
              question: 'What do seeds need to sprout?',
              options: ['Water, air, warmth', 'Only dark soil', 'Plastic sheet', 'Sugar'],
              answer: 'Water, air, warmth',
              marks: 1,
            },
          ],
        },
        {
          sectionId: 'sec-b',
          name: 'Section B: Conceptual Reasoning',
          instructions: 'Answer in 2-3 sentences.',
          totalMarks: 3,
          questions: [
            {
              id: 'q-med-1',
              chapterNumber: 1,
              page: 1,
              topic: 'Germination',
              difficulty: 'medium',
              question: 'Why do seeds in deep water not sprout well?',
              answer: 'Because they lack sufficient oxygen/air.',
              marks: 3,
            },
          ],
        },
        {
          sectionId: 'sec-c',
          name: 'Section C: Extended Synthesis & Diagnostic Scenarios',
          instructions: 'Detailed analysis or experiment design.',
          totalMarks: 5,
          questions: [
            {
              id: 'q-ext-1',
              chapterNumber: 1,
              page: 1,
              topic: 'Germination',
              difficulty: 'extended',
              question: 'Design an experiment to prove sunlight is not required for the initial sprouting stage.',
              answer: 'Place one cup with soaked seeds in a dark cupboard and one in sunlight. Both sprout.',
              marks: 5,
            },
          ],
        },
      ],
      rubric: [
        {
          criteria: 'Section A Accuracy',
          marks: 1,
          description: 'Full credit for correct multiple-choice selection.',
        },
        {
          criteria: 'Section B Reasoning',
          marks: 3,
          description: 'Identifies oxygen limitation and connects it to embryo respiration.',
        },
        {
          criteria: 'Section C Scientific Method',
          marks: 5,
          description: 'Controlled experiment variables, clear procedure, valid observation criteria.',
        },
      ],
      answerKey: [
        {
          questionId: 'q-easy-1',
          questionText: 'What do seeds need to sprout?',
          modelAnswer: 'Water, air, warmth',
          markingGuide: '1 mark for selecting option A.',
        },
        {
          questionId: 'q-med-1',
          questionText: 'Why do seeds in deep water not sprout well?',
          modelAnswer: 'Because they lack sufficient oxygen/air.',
          markingGuide: '2 marks for mentioning oxygen/air absence, 1 mark for embryo effect.',
        },
        {
          questionId: 'q-ext-1',
          questionText: 'Design an experiment to prove sunlight is not required for the initial sprouting stage.',
          modelAnswer: 'Place one cup with soaked seeds in a dark cupboard and one in sunlight. Both sprout.',
          markingGuide: '2 marks setup, 2 marks control, 1 mark conclusion.',
        },
      ],
    },
    revisionSheets: {
      quickNotes: [
        {
          chapterNumber: 1,
          title: 'Plant and Animal Life',
          lines: ['Germination is the process of seeds waking up with water and warmth.'],
        },
      ],
      memoryDigest: [
        {
          chapterNumber: 1,
          terms: [{ term: 'Germination', meaning: 'Sprouting of a plant from a seed' }],
          tips: ['W-W-A: Water, Warmth, Air'],
        },
      ],
      onePageCheatSheet: {
        title: 'Master Cheat Sheet: Our Living Environment',
        summaryLines: ['Living organisms respond to their surroundings and need basic elements to grow.'],
        coreRules: ['Seeds need moisture and air before chlorophyll activation.'],
        examWarnings: ['Do not confuse sunlight requirement with water requirement during sprouting.'],
      },
    },
  };

  it('validates a complete, correctly structured master learning package', () => {
    const result = validateLearningPackage(validPackage);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing package metadata', () => {
    const invalid = { ...validPackage, metadata: null as any };
    const result = validateLearningPackage(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing package metadata');
  });

  it('detects missing question in mock test answer key', () => {
    const invalid: MasterLearningPackage = {
      ...validPackage,
      mockTest: {
        ...validPackage.mockTest,
        answerKey: validPackage.mockTest.answerKey.filter(a => a.questionId !== 'q-med-1'),
      },
    };
    const result = validateLearningPackage(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Mock test question "q-med-1" is missing an answer key entry');
  });

  it('detects negative totalMarks or invalid timeBudget', () => {
    const invalid: MasterLearningPackage = {
      ...validPackage,
      mockTest: {
        ...validPackage.mockTest,
        totalMarks: 0,
        timeBudgetMinutes: -5,
      },
    };
    const result = validateLearningPackage(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Mock test must have positive totalMarks');
    expect(result.errors).toContain('Mock test must have positive timeBudgetMinutes');
  });

  it('detects invalid questionBank structure', () => {
    const invalid = {
      ...validPackage,
      questionBank: { easy: [] } as any,
    };
    const result = validateLearningPackage(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Question bank must have easy, medium, and extended arrays');
  });
});
