import { GuruActivityService } from "./guru-activity.service";

const plan = {
  title: "Places in a Neighbourhood",
  depth: "basis",
  language: "en",
  actions: [{ id: "a0" }, { id: "a1" }, { id: "a2" }, { id: "a3" }],
};
const at = (m: number) => new Date(Date.UTC(2026, 8, 11, 8, m));

describe("GuruActivityService", () => {
  it("derives an honest, evidence-backed activity view from the session ledger", async () => {
    const prisma: any = {
      guruTeachingSession: {
        findMany: jest.fn(async () => [
          {
            id: "s1",
            cursor: 3,
            createdAt: at(0),
            updatedAt: at(9),
            artifact: { bookId: "evs-class-5", physicalPage: 46, payload: { plan } },
            events: [
              { createdAt: at(1), result: { kind: "next", cursor: 1, assessment: null } },
              {
                createdAt: at(2),
                result: {
                  kind: "answer",
                  actionId: "a1",
                  response: "Vegetables and medicines.",
                  feedback: "That's right!",
                  assessment: { kind: "PAGE_EXPLANATION", passed: true, confidence: 1, misconception: null, masteryUpdated: false, masteryNote: "bridge-disabled", conceptIds: [] },
                },
              },
              {
                createdAt: at(3),
                result: {
                  kind: "answer",
                  actionId: "a2",
                  response: "Banks give money away.",
                  feedback: "Not quite.",
                  assessment: { kind: "PAGE_EXPLANATION", passed: false, confidence: 0.9, misconception: "Banks give money away for free", masteryUpdated: false, masteryNote: "bridge-disabled", conceptIds: [] },
                },
              },
              { createdAt: at(4), result: { kind: "help", actionId: "a2", assessment: { kind: "ASSISTED_PRACTICE", passed: false, masteryUpdated: false } } },
              { createdAt: at(5), result: { kind: "question", response: "Why do parks have swings?", feedback: "Swings help children play.", evidenceIds: ["vision-6"], assessment: null } },
              {
                createdAt: at(6),
                // Legacy event without a stored kind: inferred from its assessment shape.
                result: { actionId: "a3", response: "Light gives energy", feedback: "Yes", assessment: { kind: "PAGE_EXPLANATION", passed: true, confidence: 0.95, misconception: "Banks give money away for free", masteryUpdated: true, masteryNote: "recorded", conceptIds: ["c1", "c2"] } },
              },
            ],
          },
          {
            id: "s2",
            cursor: 0,
            createdAt: at(10),
            updatedAt: at(10),
            artifact: { bookId: "evs-class-5", physicalPage: 47, payload: { plan: { ...plan, title: "Water", actions: [{ id: "a0" }] } } },
            events: [],
          },
        ]),
      },
    };
    const view = await new GuruActivityService(prisma).forLearner("learner-1");
    expect(prisma.guruTeachingSession.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { learnerId: "learner-1" } }));
    expect(view.summary).toEqual({
      sessions: 2,
      pagesPracticed: 2,
      checkpointsPassed: 2,
      assistedCheckpoints: 1,
      attempts: 3,
      questionsAsked: 1,
      masteryRecorded: 2,
      misconceptions: [{ text: "Banks give money away for free", count: 2 }],
    });
    const first = view.sessions[0];
    expect(first).toMatchObject({
      bookId: "evs-class-5",
      physicalPage: 46,
      title: "Places in a Neighbourhood",
      depth: "basis",
      progress: { position: 4, total: 4, completed: true },
      checkpoints: { passed: 2, assisted: 1, attempts: 3 },
      questions: 1,
      masteryRecorded: 2,
    });
    expect(first.events.map((e) => e.kind)).toEqual(["answer", "answer", "help", "question", "answer"]);
    expect(first.events[0]).toMatchObject({ passed: true, response: "Vegetables and medicines.", feedback: "That's right!", masteryNote: "bridge-disabled" });
    expect(first.events[4]).toMatchObject({ masteryUpdated: true, masteryNote: "recorded" });
    expect(view.sessions[1]).toMatchObject({ title: "Water", progress: { position: 1, total: 1, completed: true }, events: [] });
    expect(view.explanation.join(" ")).toMatch(/never count as independent understanding/);
  });
});
