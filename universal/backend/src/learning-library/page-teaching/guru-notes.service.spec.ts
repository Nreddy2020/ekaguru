import { GuruNotesService } from "./guru-notes.service";

const blocks = [
  { blockId: "vision-0", type: "heading", text: "How living things grow" },
  { blockId: "vision-1", type: "paragraph", text: "A tiny seed grows into a big plant when it gets water, air and sunlight." },
];
const source = { bookId: "evs-class-5", physicalPage: 4, sourceHash: "h4", width: 10, height: 10, blocks: [], imageDataUrl: "data:image/png;base64,AAAA" };
const paragraph = (n: number) =>
  "Here is thought number " + n + ". Think of the tulsi plant at home, the one your mother waters every morning. Every day it is a little taller, and that is because it is alive. Alive things eat, breathe and grow, so a seed is a baby plant waiting to wake up.";
const notesJson = () => ({
  title: "How living things grow",
  subtitle: "Seeds, plants and what makes them alive",
  overview:
    "This page is about one big idea: living things grow. You will see why a seed can become a plant. You will learn what it needs on the way. By the end you can explain growing in your own words.",
  objectives: ["I can say what living things need to grow"],
  topics: [
    {
      id: "t1",
      heading: "A seed is a baby plant",
      icon: "🌱",
      evidenceIds: ["vision-0", "vision-1"],
      lookAt: "Look at the small plant and the tall plant next to each other.",
      hook: "Close your eyes. Picture a tiny seed in your hand. It looks asleep. Is it?",
      bigIdea: "A seed is a baby plant waiting for water, air and light.",
      explanation: [paragraph(1), paragraph(2), paragraph(3)],
      keyPoints: ["A seed is a baby plant.", "It needs water, air and light.", "The root comes first."],
      steps: ["The seed drinks water and swells.", "A tiny root pushes down.", "A green shoot pushes up.", "Leaves open to catch light."],
      chain: [{ label: "Seed", emoji: "🌰" }, { label: "Sprout", emoji: "🌱" }, { label: "Plant", emoji: "🌿" }],
      diagram: [
        { type: "circle", x: 200, y: 700, radius: 40, color: "yellow", text: null, x2: null, y2: null, width: null, height: null },
        { type: "line", x: 200, y: 660, x2: 200, y2: 300, color: "green", text: null, width: null, height: null, radius: null },
        { type: "text", x: 260, y: 300, text: "shoot grows up", color: "white", x2: null, y2: null, width: null, height: null, radius: null },
      ],
      keyTerms: [{ term: "seed", meaning: "the small part of a plant that can grow into a new plant", example: "a bean you soak overnight" }],
      example: { situation: "Soaking a chana seed in a wet cloth", explanation: "After two days a white root pokes out because the seed drank water and woke up; that is growing." },
      tryNow: { title: "Grow a seed on a wet cloth", steps: ["Put three chana seeds on a wet cloth in a bowl.", "Keep the cloth wet for three days.", "Look every morning."], whatToNotice: "A white root comes out first, then a green shoot. The seed is alive." },
      didYouKnow: "Some seeds can sleep for hundreds of years and still wake up and grow.",
      rememberTip: "Seed, water, sun: a baby plant has begun.",
      commonDoubts: [{ question: "Does a stone grow?", answer: "No. A stone does not eat or breathe. It stays the same size for ever." }],
      quiz: { question: "What does a seed need first to wake up?", options: ["Water", "A blanket", "Music"], answerIndex: 0, why: "Water makes the seed swell and start to grow." },
      checkYourself: [{ question: "Name two things a seed needs to grow.", answer: "Water and sunlight (also air)." }],
    },
  ],
  summary: ["Living things grow.", "A seed is a baby plant.", "Growing needs water, air and sunlight."],
  closingLine: "Every seed is a small promise of a big tree.",
  omitted: [],
});

function harness(replies: any[]) {
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
    },
    guruNotesExtension: {
      create: jest.fn(async ({ data }: any) => {
        const row = { id: "x" + (extensions.length + 1), createdAt: new Date(), ...data };
        extensions.push(row);
        return row;
      }),
    },
  };
  const model: any = { identity: "gemini:test", json: jest.fn() };
  for (const r of replies) model.json.mockImplementationOnce(async () => r);
  const planner: any = { pageBlocks: jest.fn(async () => ({ blocks, uncertain: [], extraction: {} })), dump: jest.fn(async () => {}) };
  const usage: any = { reserve: jest.fn(async () => {}) };
  return { prisma, model, planner, usage, store, extensions, service: new GuruNotesService(prisma, model, planner, usage) };
}

describe("GuruNotesService", () => {
  it("prepares notes once per page revision and language: vision, notes, review, store", async () => {
    const { service, model, planner, prisma } = harness([notesJson(), { pass: true, issues: [] }]);
    const stages: string[] = [];
    const view = await service.build(source, "en", (s) => stages.push(s));
    expect(stages).toEqual(["vision", "notes", "review", "persist"]);
    expect(planner.pageBlocks).toHaveBeenCalledWith(source, expect.anything());
    expect(model.json).toHaveBeenCalledTimes(2);
    expect(model.json.mock.calls[0][0]).toMatch(/friendly teacher talking/);
    expect(model.json.mock.calls[0][0]).toMatch(/class 5 child/);
    expect(model.json.mock.calls[0][1]).toBe(source.imageDataUrl);
    expect(view.notes.topics[0].heading).toBe("A seed is a baby plant");
    expect(view.page.blocks).toHaveLength(2);
    expect(view.id).toBe(service.notesIdFor(source, "en"));
    expect(prisma.guruPageNotes.upsert).toHaveBeenCalledTimes(1);
    // A second build answers from the store without the model.
    const again = await service.build(source, "en");
    expect(again.id).toBe(view.id);
    expect(model.json).toHaveBeenCalledTimes(2);
    expect(service.notesIdFor(source, "hi")).not.toBe(view.id);
    expect(service.notesIdFor(source, "en", "deep")).not.toBe(view.id);
    expect(view.depth).toBe("basis");
  });
  it("repairs rejected notes with the validator's reason, then fails after two attempts", async () => {
    const copied = notesJson();
    copied.topics[0].explanation[0] = "Remember: " + blocks[1].text + " and that is all you need to know about this page.";
    const { service, model } = harness([copied, notesJson(), { pass: true, issues: [] }]);
    const stages: string[] = [];
    await service.build(source, "en", (s) => stages.push(s));
    expect(stages).toEqual(["vision", "notes", "repair", "review", "persist"]);
    expect(model.json.mock.calls[1][0]).toMatch(/copies the book/);
    const stubborn = harness([copied, copied, copied]);
    await expect(stubborn.service.build({ ...source, sourceHash: "h5" }, "en")).rejects.toThrow(/copies the book/);
    expect(stubborn.model.json).toHaveBeenCalledTimes(3);
  });
  it("refuses notes that fail the source review", async () => {
    const { service } = harness([notesJson(), { pass: false, issues: ["The stone example is wrong."] }]);
    await expect(service.build(source, "en")).rejects.toThrow(/did not pass source review/);
  });
  it("answers a question under a topic, saves it into the notes and reuses it for the same question", async () => {
    const { service, model, usage, extensions } = harness([
      notesJson(),
      { pass: true, issues: [] },
      { answer: "A baby plant is born when the seed drinks water, swells and pushes out a tiny root first, then a shoot.", evidenceIds: ["vision-1"], beyondPage: false },
    ]);
    await service.build(source, "en");
    const first = await service.extend(source, "en", { topicId: "t1", question: "How is a baby plant born?" }, { userId: "p1" });
    expect(first.reused).toBe(false);
    expect(first.extension).toMatchObject({ topicId: "t1", beyondPage: false, evidenceIds: ["vision-1"] });
    expect(usage.reserve).toHaveBeenCalledWith("p1", "queries");
    expect(model.json.mock.calls[2][0]).toMatch(/same caring teacher/);
    const again = await service.extend(source, "en", { topicId: "t1", question: "how is a baby plant born" }, { userId: "p2" });
    expect(again.reused).toBe(true);
    expect(again.extension.id).toBe(first.extension.id);
    expect(model.json).toHaveBeenCalledTimes(3);
    expect(extensions).toHaveLength(1);
    const view = await service.cached(source, "en");
    expect(view?.extensions).toHaveLength(1);
  });
  it("rejects questions for unknown topics, unprepared pages and answers that cannot be linked to the page", async () => {
    const { service } = harness([]);
    await expect(service.extend(source, "en", { topicId: "t1", question: "Why?" }, { userId: "p1" })).rejects.toThrow(/Prepare the notes/);
    const ready = harness([notesJson(), { pass: true, issues: [] }, { answer: "Because it is so and this answer is long enough.", evidenceIds: ["vision-9"], beyondPage: false }]);
    await ready.service.build(source, "en");
    await expect(ready.service.extend(source, "en", { topicId: "t9", question: "Why?" }, { userId: "p1" })).rejects.toThrow(/Unknown topic/);
    await expect(ready.service.extend(source, "en", { topicId: "t1", question: "Why does it grow?" }, { userId: "p1" })).rejects.toThrow(/could not be linked/);
  });
});

it("writes deeper notes as a separate artifact with the depth in the prompt", async () => {
  const { service, model, prisma } = harness([notesJson(), { pass: true, issues: [] }]);
  const view = await service.build(source, "en", undefined, "developing");
  expect(view.depth).toBe("developing");
  expect(model.json.mock.calls[0][0]).toMatch(/Depth developing/);
  expect(prisma.guruPageNotes.upsert.mock.calls[0][0].create.depth).toBe("developing");
});

it("enriches topics with buildsOn, leadsTo and Guru remembers from the whole-book map", async () => {
  const mockBookMapService: any = {
    getOrBuildBookMap: jest.fn(async () => ({
      version: "book-map-v1",
      bookId: "evs-class-5",
      title: "Looking Around",
      totalPages: 10,
      chapters: [],
      keyTerms: [],
      dependencies: [
        {
          id: "dep-1",
          sourceTopicId: "topic-p2-1",
          sourceTopicTitle: "Animal Senses",
          sourcePage: 2,
          targetTopicId: "t1",
          targetTopicTitle: "A seed is a baby plant",
          targetPage: 4,
          reason: "Seed sensing of moisture connects to animal sensitivity.",
          strength: "essential",
        },
        {
          id: "dep-2",
          sourceTopicId: "t1",
          sourceTopicTitle: "A seed is a baby plant",
          sourcePage: 4,
          targetTopicId: "topic-p6-1",
          targetTopicTitle: "Forest Trees",
          targetPage: 6,
          reason: "Growing trees begins with seed sprouting.",
          strength: "supporting",
        },
      ],
      generatedAt: new Date().toISOString(),
    })),
  };

  const { prisma, model, planner, usage } = harness([notesJson(), { pass: true, issues: [] }]);
  const serviceWithMap = new GuruNotesService(prisma, model, planner, usage, mockBookMapService);
  const view = await serviceWithMap.build(source, "en");

  const topic = view.notes.topics[0];
  expect(topic.buildsOn).toBeDefined();
  expect(topic.buildsOn).toHaveLength(1);
  expect(topic.buildsOn![0].heading).toBe("Animal Senses");
  expect(topic.buildsOn![0].page).toBe(2);
  expect(topic.leadsTo).toBeDefined();
  expect(topic.leadsTo).toHaveLength(1);
  expect(topic.leadsTo![0].heading).toBe("Forest Trees");
  expect(topic.leadsTo![0].page).toBe(6);
  expect(topic.guruRemembers).toContain("Guru remembers: on page 2 you learned about 'Animal Senses'");
});

