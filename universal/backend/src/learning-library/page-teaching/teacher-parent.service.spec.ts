import { TeacherParentService } from "./teacher-parent.service";
import { GuruNotesService } from "./guru-notes.service";

const blocks: any[] = [
  { blockId: "b1", text: "Living things grow and need water.", type: "paragraph", confidence: 1, readingOrderIndex: 0, bbox: { x: 100, y: 100, width: 300, height: 100 }, words: [] },
  { blockId: "b2", text: "Seeds need air, water and sun to grow into plants.", type: "paragraph", confidence: 1, readingOrderIndex: 1, bbox: { x: 100, y: 250, width: 400, height: 250 }, words: [] },
];

const source = {
  bookId: "evs-class-5",
  physicalPage: 3,
  sourceHash: "hash-p3",
  totalPages: 10,
  blocks,
  omittedBlockCount: 0,
  version: "v1",
};

const notesJson = () => ({
  title: "I am Growing Up",
  subtitle: "How seeds wake up and become plants",
  overview: "This page shows that living things grow, using a bean seed as the example.",
  objectives: ["Explain what a seed needs to grow", "Observe and describe a seedling"],
  topics: [
    {
      id: "t1",
      heading: "A seed is a baby plant",
      icon: "🌱",
      evidenceIds: ["b1", "b2"],
      hook: "Hold a bean in your hand. Inside, a baby plant is fast asleep.",
      bigIdea: "A seed wakes up and grows when it gets water, air and warmth.",
      explanation: [
        "A dry seed looks like a tiny pebble, but inside it is alive.",
        "When water enters, the seed swells up and its coat bursts open.",
        "The root pushes down into the soil to drink, then a pale green shoot reaches for the light.",
      ],
      steps: ["The seed drinks water and swells.", "A white root grows downwards.", "A green shoot grows upwards."],
      chain: [{ label: "Seed", emoji: "🌰" }, { label: "Sprout", emoji: "🌱" }, { label: "Plant", emoji: "🌿" }],
      diagram: [
        { type: "circle", x: 200, y: 700, radius: 40, color: "yellow" },
        { type: "line", x: 200, y: 660, x2: 200, y2: 300, color: "green" },
      ],
      keyTerms: [{ term: "seed", meaning: "the part that can grow into a new plant", example: "a bean you soak overnight" }],
      example: { situation: "Soaking a chana seed in a wet cloth", explanation: "After two days a white root pokes out because the seed drank water." },
      tryNow: { title: "Grow a seed on a wet cloth", steps: ["Put three chana seeds on a wet cloth.", "Keep the cloth wet for three days."], whatToNotice: "A white root comes out first, then a green shoot." },
      didYouKnow: "Some seeds can sleep for hundreds of years and still wake up.",
      rememberTip: "Seed, water, sun: a baby plant has begun.",
      commonDoubts: [{ question: "Does a stone grow?", answer: "No. A stone is not alive. It stays the same size forever." }],
      quiz: { question: "What does a seed need first to wake up?", options: ["Water", "A blanket", "Music"], answerIndex: 0, why: "Water makes the seed swell and start to grow." },
      checkYourself: [{ question: "Name two things a seed needs to grow.", answer: "Water and sunlight." }],
      buildsOn: [{ topicId: "p2-t1", heading: "Living Earth Foundations", page: 2, reason: "Seed germination depends on moist soil minerals." }],
    },
  ],
  summary: ["Living things grow.", "A seed is a baby plant."],
  closingLine: "Every seed is a small promise of a big tree.",
  omitted: [],
});

const lessonPlan = () => ({
  title: "A Seed Wakes Up",
  actions: [
    { kind: "write", phase: "concept", text: "Seeds need water to wake up", speech: "Look at this dry seed. It is waiting for water." },
    { kind: "draw", phase: "visual", text: "Draw seed and root", speech: "Watch how the root pushes downward into the soil." },
    {
      kind: "ask",
      phase: "check",
      text: "Does a stone grow?",
      speech: "Does a stone grow if you give it water?",
      rubric: {
        expected: "No, a stone is non-living",
        criteria: ["Identifies non-living"],
        hint: "Think about whether a stone needs to breathe or eat.",
        misconception: "Thinking everything that stays outdoors grows like plants.",
      },
    },
  ],
  objectives: ["Identify living needs of seeds"],
});

function harness() {
  const store: Record<string, any> = {};
  const extensions: any[] = [];
  const prisma: any = {
    guruPageNotes: {
      findUnique: jest.fn(async ({ where }: any) => (store[where.id] ? { ...store[where.id], extensions: extensions.filter((e) => e.notesId === where.id) } : null)),
      findMany: jest.fn(async () => Object.values(store).map((r: any) => ({ physicalPage: r.physicalPage }))),
      upsert: jest.fn(async ({ where, create }: any) => {
        store[where.id] = { ...create, createdAt: new Date() };
        return { ...store[where.id], extensions: [] };
      }),
      update: jest.fn(async ({ where, data }: any) => {
        store[where.id] = { ...store[where.id], ...data, updatedAt: new Date() };
        return { ...store[where.id], extensions: [] };
      }),
    },
  };

  const model: any = { identity: "gemini:test", json: jest.fn() };
  const planner: any = {
    cached: jest.fn(async () => ({ plan: lessonPlan() })),
    pageBlocks: jest.fn(async () => ({ blocks, uncertain: [], extraction: {} })),
    dump: jest.fn(async () => {}),
  };
  const usage: any = { reserve: jest.fn(async () => {}), dump: jest.fn(async () => {}) };

  const notesService = new GuruNotesService(prisma, model, planner, usage);
  const teacherParentService = new TeacherParentService(prisma, notesService, planner, model, usage);

  return { prisma, model, planner, usage, store, notesService, teacherParentService };
}

describe("TeacherParentService", () => {
  it("synthesizes all 8 components from notes and lesson plan, caching it for future use", async () => {
    const { teacherParentService, notesService, store, usage } = harness();

    // Pre-populate notes in store
    const notesId = notesService.notesIdFor(source, "en", "basis");
    store[notesId] = {
      id: notesId,
      bookId: "evs-class-5",
      physicalPage: 3,
      sourceHash: "hash-p3",
      language: "en",
      depth: "basis",
      payload: {
        notes: notesJson(),
        page: source,
      },
    };

    // First request: assembles and saves
    const result = await teacherParentService.getOrGenerateEdition(source, "en", "basis", { userId: "teacher-1" });

    expect(result.reused).toBe(false);
    const edition = result.edition;
    expect(edition.title).toBe("I am Growing Up");
    expect(edition.page).toBe(3);

    // 1. Objectives
    expect(edition.objectives).toContain("Explain what a seed needs to grow");

    // 2. Prerequisites
    expect(edition.prerequisites).toHaveLength(1);
    expect(edition.prerequisites[0].concept).toBe("Living Earth Foundations");
    expect(edition.prerequisites[0].page).toBe(2);
    expect(edition.prerequisites[0].checkQuestion).toContain("Living Earth Foundations");

    // 3. Board plan
    expect(edition.boardPlan.title).toContain("Classroom Blackboard Layout");
    expect(edition.boardPlan.steps.length).toBeGreaterThanOrEqual(2);
    expect(edition.boardPlan.steps[0].whatToWriteOrDraw).toBeDefined();
    expect(edition.boardPlan.steps[0].teacherSpeechGuidance).toBeDefined();

    // 4. Home guide
    expect(edition.homeExplanation.everydayAnalogy).toContain("Soaking a chana seed");
    expect(edition.homeExplanation.conversationStarters.length).toBeGreaterThanOrEqual(2);
    expect(edition.homeExplanation.parentTips.length).toBeGreaterThanOrEqual(2);

    // 5. Activity
    expect(edition.activity.title).toBe("Grow a seed on a wet cloth");
    expect(edition.activity.materials.length).toBeGreaterThanOrEqual(1);
    expect(edition.activity.instructions).toContain("Put three chana seeds on a wet cloth.");
    expect(edition.activity.whatToNotice).toContain("A white root comes out first");

    // 6. Guided questions
    expect(edition.questionsToAsk).toHaveLength(3);
    expect(edition.questionsToAsk.map((q) => q.level)).toEqual(["recall", "understanding", "application"]);
    expect(edition.questionsToAsk[0].expectedAnswer).toBeDefined();

    // 7. Misconceptions
    expect(edition.misconceptions.length).toBeGreaterThanOrEqual(1);
    expect(edition.misconceptions[0].correctionStrategy).toBeDefined();

    // 8. Assessment & Answer Key
    expect(edition.assessment.length).toBeGreaterThanOrEqual(2);
    expect(edition.assessment[0].correctAnswer).toBe("A. Water");
    expect(edition.assessment[0].explanation).toBe("Water makes the seed swell and start to grow.");

    // 9. Homework
    expect(edition.homework.title).toContain("Home Discovery Mission");
    expect(edition.homework.parentRole).toBeDefined();

    // Usage was reserved
    expect(usage.reserve).toHaveBeenCalledWith("teacher-1", "queries");

    // Second request: served from cache with 0 re-computations
    const secondResult = await teacherParentService.getOrGenerateEdition(source, "en", "basis", { userId: "parent-2" });
    expect(secondResult.reused).toBe(true);
    expect(secondResult.edition.title).toBe(edition.title);
  });
});
