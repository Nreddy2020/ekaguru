import { deriveTeacherParentEdition, loadTeacherParentEdition } from "./teacher-parent-api";

const page: any = { bookId: "evs-class-5", physicalPage: 3, sourceHash: "h", totalPages: 5, status: "READY", blocks: [] };

const view: any = {
  id: "n1",
  bookId: "evs-class-5",
  physicalPage: 3,
  sourceHash: "h",
  language: "en",
  notes: {
    title: "I am Growing Up",
    objectives: ["Explain what a seed needs to grow"],
    topics: [
      {
        id: "t1",
        heading: "A seed is a baby plant",
        bigIdea: "A seed is alive inside.",
        explanation: ["A seed sleeps until water wakes it up."],
        keyTerms: [],
        example: { situation: "Soaking a seed", explanation: "A root appears." },
        tryNow: { title: "Grow a seed", steps: ["Keep cloth wet"], whatToNotice: "Root grows first" },
        rememberTip: "Water, sun, air",
        commonDoubts: [{ question: "Does a stone grow?", answer: "No, a stone is not alive." }],
        quiz: { question: "What does a seed need?", options: ["Water", "Blanket", "Music"], answerIndex: 0, why: "Water wakes it up" },
        checkYourself: [{ question: "Name one need.", answer: "Water" }],
        buildsOn: [{ topicId: "p2-t1", heading: "Living Earth", page: 2, reason: "Soil nutrients" }],
      },
    ],
    summary: ["Living things grow."],
  },
};

beforeEach(() => localStorage.setItem("token", "t"));
afterEach(() => localStorage.clear());

describe("Teacher and Parent Edition API", () => {
  it("derives all 8 components synchronously from notes view", () => {
    const edition = deriveTeacherParentEdition(view);
    expect(edition.title).toBe("I am Growing Up");
    expect(edition.objectives).toContain("Explain what a seed needs to grow");
    expect(edition.prerequisites).toHaveLength(1);
    expect(edition.prerequisites[0].concept).toBe("Living Earth");
    expect(edition.boardPlan.steps.length).toBeGreaterThanOrEqual(1);
    expect(edition.homeExplanation.everydayAnalogy).toContain("Soaking a seed");
    expect(edition.activity.title).toBe("Grow a seed");
    expect(edition.questionsToAsk).toHaveLength(3);
    expect(edition.misconceptions.length).toBeGreaterThanOrEqual(1);
    expect(edition.assessment[0].correctAnswer).toBe("A. Water");
    expect(edition.homework.title).toContain("Observation Journal");
  });

  it("loads the edition from the server", async () => {
    const serverEdition = deriveTeacherParentEdition(view);
    (global as any).fetch = jest.fn(async (url: string, init: any) => {
      if (url.endsWith("/pages/3/teacher-edition")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ edition: serverEdition, reused: false }),
        };
      }
      throw new Error("unexpected " + url);
    });

    const loaded = await loadTeacherParentEdition(page, "en", "basis");
    expect(loaded.title).toBe("I am Growing Up");
    expect(loaded.page).toBe(3);
  });
});
