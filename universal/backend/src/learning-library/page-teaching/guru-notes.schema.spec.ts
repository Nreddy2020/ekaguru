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
      explanation: [paragraph(1), paragraph(2), paragraph(3)],
      keyTerms: [{ term: "seed", meaning: "the small part of a plant that can grow into a new plant", example: "a bean you soak overnight" }],
      example: { situation: "Soaking a chana seed in a wet cloth", explanation: "After two days a white root pokes out because the seed drank water and woke up; that is growing." },
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
    expect(notes).toMatchObject({ language: "en", sourceHash: "hash", blueprint: "notes-v2" });
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
