import { longestSharedRun, notesDepthSection, notesPromptSection, readingLevelFor, validateGuruNotes } from "./guru-notes.schema";

const blocks = [
  { blockId: "b1", text: "Living things grow. A tiny seed grows into a big plant when it gets water, air and sunlight." },
  { blockId: "b2", text: "Learning outcomes: say what living things need to grow." },
  { blockId: "b3", text: "3" },
];
const ids = new Set(blocks.map((b) => b.blockId));
const paragraph = (n: number) =>
  "Here is thought number " + n + ". Think of the tulsi plant at home, the one your mother waters every morning. Every day it is a little taller, and that is because it is alive. Alive things eat, breathe and grow, so a seed is a baby plant waiting to wake up.";
const goodNotes = () => ({
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
      evidenceIds: ["b1", "b2"],
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
  omitted: [{ evidenceId: "b3", reason: "page number" }],
});

describe("Guru notes validation", () => {
  it("accepts complete teacher notes and records their identity", () => {
    const notes = validateGuruNotes(goodNotes(), ids, blocks, "en", "hash");
    expect(notes.topics[0].keyTerms[0].term).toBe("seed");
    expect(notes).toMatchObject({ language: "en", sourceHash: "hash", blueprint: "notes-v4" });
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
    thin.topics[0].explanation = ["Living things grow. This is very important.", "Seeds grow into plants. Remember this well."];
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
    const noQuiz: any = goodNotes();
    noQuiz.topics[0].quiz = { question: "Which?", options: ["Water", "Water"], answerIndex: 0, why: "Because it is so." };
    expect(() => validateGuruNotes(noQuiz, ids, blocks, "en", "hash")).toThrow(/quiz with exactly 3 options/);
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
    expect(topic.lookAt).toMatch(/Look at the small plant/);
    expect(topic.diagram).toHaveLength(3);
    expect(topic.diagram[0]).toMatchObject({ id: "shape-0", type: "circle", radius: 40, color: "yellow" });
    expect(topic.diagram[2].text).toBe("shoot grows up");
    expect(topic.tryNow.steps).toHaveLength(3);
    const noActivity: any = goodNotes();
    noActivity.topics[0].tryNow = { title: "x", steps: ["only one"], whatToNotice: "nothing" };
    expect(() => validateGuruNotes(noActivity, ids, blocks, "en", "hash")).toThrow(/tryNow activity with 2 to 5 steps/);
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

describe("Guru notes v4: written for a child", () => {
  it("rejects adult sentences a class 5 child cannot read, and long or wordy topics", () => {
    const adult: any = goodNotes();
    adult.topics[0].explanation[0] =
      "This comparison constitutes the foundational starting point for comprehending the developmental trajectory of your individual life journey, which continues throughout childhood and adolescence.";
    expect(() => validateGuruNotes(adult, ids, blocks, "en", "hash", 5)).toThrow(/sentence of \d+ words|reads at grade/);
    const wordy: any = goodNotes();
    wordy.topics[0].explanation = [paragraph(1), paragraph(2), paragraph(3), paragraph(1), paragraph(2)];
    expect(() => validateGuruNotes(wordy, ids, blocks, "en", "hash", 5)).toThrow(/too long for a child/);
    const longHook: any = goodNotes();
    longHook.topics[0].hook = "One. Two. Three. Four. Five sentences is too many for a hook.";
    expect(() => validateGuruNotes(longHook, ids, blocks, "en", "hash", 5)).toThrow(/hook must be 1 to 4/);
  });
  it("keeps the children's parts: hook, big idea, steps, chain, fun fact, quiz, and 'I can' objectives", () => {
    const notes = validateGuruNotes(goodNotes(), ids, blocks, "en", "hash", 5);
    const topic = notes.topics[0];
    expect(topic.bigIdea).toMatch(/baby plant/);
    expect(topic.steps).toHaveLength(4);
    expect(topic.chain.map((c) => c.label)).toEqual(["Seed", "Sprout", "Plant"]);
    expect(topic.quiz.answerIndex).toBe(0);
    expect(topic.didYouKnow).toMatch(/hundreds of years/);
    expect(notes.readingLevel).toBe(5);
    expect(notes.blueprint).toBe("notes-v4");
    const badChain: any = goodNotes();
    badChain.topics[0].chain = [{ label: "Seed", emoji: "🌰" }];
    expect(() => validateGuruNotes(badChain, ids, blocks, "en", "hash", 5)).toThrow(/chain must be empty or 3 to 6/);
  });
  it("reads the class from the book id", () => {
    expect(readingLevelFor("evs-class-5")).toBe(5);
    expect(readingLevelFor("science-class-6")).toBe(6);
    expect(readingLevelFor("m-2f1c")).toBe(6);
  });
});

describe("Guru notes by teaching depth", () => {
  it("records the depth in the notes and changes what the prompt asks for", () => {
    expect(validateGuruNotes(goodNotes(), ids, blocks, "en", "hash", 5).depth).toBe("basis");
    expect(validateGuruNotes(goodNotes(), ids, blocks, "en", "hash", 5, "deep").depth).toBe("deep");
    expect(() => validateGuruNotes(goodNotes(), ids, blocks, "en", "hash", 5, "expert" as any)).toThrow(/unknown depth/);
    expect(notesDepthSection("basis")).toMatch(/name and describe/);
    expect(notesDepthSection("advanced")).toMatch(/tempting wrong option/);
    expect(notesPromptSection("en", 5, "deep")).toMatch(/how could we find out/);
    // The reading level stays the child's class at every depth.
    expect(notesPromptSection("en", 5, "deep")).toMatch(/class 5 child/);
  });
  it("carries the poster parts: subtitle, topic icons, key points and a closing line", () => {
    const notes = validateGuruNotes(goodNotes(), ids, blocks, "en", "hash", 5);
    expect(notes.subtitle).toBe("Seeds, plants and what makes them alive");
    expect(notes.topics[0].icon).toBe("🌱");
    expect(notes.topics[0].keyPoints).toHaveLength(3);
    expect(notes.closingLine).toMatch(/small promise/);
    const noPoints: any = goodNotes();
    noPoints.topics[0].keyPoints = ["Only one"];
    expect(() => validateGuruNotes(noPoints, ids, blocks, "en", "hash", 5)).toThrow(/keyPoints must have 3 to 5/);
  });
});
