import { longestSharedRun, validateGuruNotes } from "./guru-notes.schema";

const blocks = [
  { blockId: "b1", text: "Living things grow. A tiny seed grows into a big plant when it gets water, air and sunlight." },
  { blockId: "b2", text: "Learning outcomes: say what living things need to grow." },
  { blockId: "b3", text: "3" },
];
const ids = new Set(blocks.map((b) => b.blockId));
const paragraph = (n: number) =>
  "Here is a thought for you, number " + n + ". Think of the tulsi plant at home. Every morning it is a little taller because it is alive; alive things feed, breathe and grow, and that is why we call the seed a baby plant that is waiting to wake up.";
const goodNotes = () => ({
  title: "How living things grow",
  overview:
    "This page is about one big idea: living things grow. You will see why a seed can become a plant, what it needs on the way, and how you can tell a living thing from a non-living one. By the end you will be able to explain growing in your own words.",
  objectives: ["Say what living things need to grow"],
  topics: [
    {
      id: "t1",
      heading: "A seed is a baby plant",
      evidenceIds: ["b1", "b2"],
      lookAt: "Look at the picture of the small plant and the tall plant next to each other.",
      explanation: [paragraph(1), paragraph(2), paragraph(3)],
      diagram: [
        { type: "circle", x: 200, y: 700, radius: 40, color: "yellow", text: null, x2: null, y2: null, width: null, height: null },
        { type: "line", x: 200, y: 660, x2: 200, y2: 300, color: "green", text: null, width: null, height: null, radius: null },
        { type: "text", x: 260, y: 300, text: "shoot grows up", color: "white", x2: null, y2: null, width: null, height: null, radius: null },
      ],
      keyTerms: [{ term: "seed", meaning: "the small part of a plant that can grow into a new plant", example: "a bean you soak overnight" }],
      example: { situation: "Soaking a chana seed in a wet cloth", explanation: "After two days a white root pokes out because the seed drank water and woke up; that is growing." },
      tryNow: { title: "Grow a seed on a wet cloth", steps: ["Put three chana seeds on a wet cloth in a bowl.", "Keep the cloth wet for three days.", "Look every morning."], whatToNotice: "A white root comes out first, then a green shoot; the seed is alive." },
      rememberTip: "Seed, water, sun: a baby plant has begun.",
      commonDoubts: [{ question: "Does a stone grow?", answer: "No. A stone does not feed or breathe, so it stays the same size for ever." }],
      checkYourself: [{ question: "Name two things a seed needs to grow.", answer: "Water and sunlight (also air)." }],
    },
  ],
  summary: ["Living things grow.", "A seed is a baby plant.", "Growing needs water, air and sunlight."],
  omitted: [{ evidenceId: "b3", reason: "page number" }],
});

describe("Guru notes validation", () => {
  it("accepts complete teacher notes and records their identity", () => {
    const notes = validateGuruNotes(goodNotes(), ids, blocks, "en", "hash");
    expect(notes.topics[0].keyTerms[0].term).toBe("seed");
    expect(notes).toMatchObject({ language: "en", sourceHash: "hash", blueprint: "notes-v3" });
  });
  it("measures the longest run of words shared with the page", () => {
    expect(longestSharedRun("A tiny seed grows into a big plant when it gets water.", blocks[0].text)).toBe(12);
    expect(longestSharedRun("Completely different words here.", blocks[0].text)).toBe(0);
  });
  it("rejects notes that copy the book instead of explaining", () => {
    const raw = goodNotes();
    raw.topics[0].explanation[0] = "Remember: " + blocks[0].text + " That is the whole idea of this page for you.";
    expect(() => validateGuruNotes(raw, ids, blocks, "en", "hash")).toThrow(/copies the book \(b1\)/);
  });
  it("rejects thin explanations, missing coverage and unknown citations", () => {
    const thin = goodNotes();
    thin.topics[0].explanation = ["Living things grow. This is very important for you to know.", "Seeds grow into plants. Please remember this fact well.", "Water helps them along the way, as you will see soon."];
    expect(() => validateGuruNotes(thin, ids, blocks, "en", "hash")).toThrow(/too thin/);
    const missing = goodNotes();
    missing.omitted = [];
    expect(() => validateGuruNotes(missing, ids, blocks, "en", "hash")).toThrow(/not explained or omitted: b3/);
    const unknown = goodNotes();
    unknown.topics[0].evidenceIds = ["b9"];
    expect(() => validateGuruNotes(unknown, ids, blocks, "en", "hash")).toThrow(/unknown evidence b9/);
  });
  it("requires doubts, checks, a real-life example and a bounded omission list", () => {
    const noDoubts = goodNotes();
    noDoubts.topics[0].commonDoubts = [];
    expect(() => validateGuruNotes(noDoubts, ids, blocks, "en", "hash")).toThrow(/commonDoubts/);
    const overlap = goodNotes();
    overlap.omitted = [{ evidenceId: "b1", reason: "dup" }, { evidenceId: "b3", reason: "page number" }];
    expect(() => validateGuruNotes(overlap, ids, blocks, "en", "hash")).toThrow(/also explained/);
    const many = goodNotes();
    many.topics[0].evidenceIds = ["b1"];
    many.omitted = [{ evidenceId: "b2", reason: "banner" }, { evidenceId: "b3", reason: "page number" }];
    // Two of three omitted is within the allowance of max(3, 30%), so only the overlap and reasons matter.
    expect(validateGuruNotes(many, ids, blocks, "en", "hash").omitted).toHaveLength(2);
  });
});

describe("Guru notes v3: pictures, drawings and try-now activities", () => {
  it("keeps the look-at caption, clamps the diagram and requires a try-now activity", () => {
    const notes = validateGuruNotes(goodNotes(), ids, blocks, "en", "hash");
    const topic = notes.topics[0];
    expect(topic.lookAt).toMatch(/Look at the picture/);
    expect(topic.diagram).toHaveLength(3);
    expect(topic.diagram[0]).toMatchObject({ id: "shape-0", type: "circle", radius: 40, color: "yellow" });
    expect(topic.diagram[2].text).toBe("shoot grows up");
    expect(topic.tryNow.steps).toHaveLength(3);
    const noActivity: any = goodNotes();
    noActivity.topics[0].tryNow = { title: "x", steps: ["only one"], whatToNotice: "nothing" };
    expect(() => validateGuruNotes(noActivity, ids, blocks, "en", "hash")).toThrow(/tryNow activity with 2 to 6 steps/);
    const badShape: any = goodNotes();
    badShape.topics[0].diagram = [{ type: "rect", x: 990, y: 990, width: 500, height: 500, color: "blue" }, { type: "text", x: 10, y: 10, text: "corner", color: "white" }];
    expect(validateGuruNotes(badShape, ids, blocks, "en", "hash").topics[0].diagram[0]).toMatchObject({ width: 10, height: 10 });
    const unlabelled: any = goodNotes();
    unlabelled.topics[0].diagram = [{ type: "rect", x: 100, y: 100, width: 300, height: 200, color: "green" }];
    expect(() => validateGuruNotes(unlabelled, ids, blocks, "en", "hash")).toThrow(/diagram has no labels/);
    const outside: any = goodNotes();
    outside.topics[0].diagram = [{ type: "rect", x: 1000, y: 10, width: 5, height: 5, color: "blue" }];
    expect(() => validateGuruNotes(outside, ids, blocks, "en", "hash")).toThrow(/rectangle outside scene/);
  });
});

describe("Guru notes validator tolerance learned from the first whole-book run", () => {
  it("accepts an empty diagram, a one-word check answer and an omission of a region set aside for review", () => {
    const raw: any = goodNotes();
    raw.topics[0].diagram = [];
    raw.topics[0].checkYourself = [{ question: "Is a stone alive?", answer: "No" }];
    raw.omitted = [{ evidenceId: "b3", reason: "page number" }, { evidenceId: "vision-99", reason: "faint region" }];
    const notes = validateGuruNotes(raw, ids, blocks, "en", "hash");
    expect(notes.topics[0].diagram).toEqual([]);
    expect(notes.topics[0].checkYourself[0].answer).toBe("No");
    expect(notes.omitted).toEqual([{ evidenceId: "b3", reason: "page number" }]);
  });
});
