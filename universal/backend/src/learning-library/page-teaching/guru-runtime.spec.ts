import { validateGuruPlan } from "./guru-plan.schema";
import { publicGuruPlan, GuruPlannerService } from "./guru-planner.service";
import { GuruSessionService } from "./guru-session.service";
import { LearningLibraryAuthGuard } from "../learning-library-auth.guard";

function rawPlan() {
  const base = {
    text: "Sunlight helps plants make food.",
    speech: "Let us trace how sunlight supports a plant.",
    evidenceIds: ["vision-0"],
  };
  const rubric = {
    expected: "Light supplies energy.",
    criteria: ["Connect light and energy"],
    hint: "Think about energy.",
    misconception: "Plants eat soil.",
  };
  return {
    title: "Plants",
    objectives: ["Explain the role of sunlight"],
    notes: ["Plants use light."],
    actions: [
      { ...base, kind: "write", phase: "hook" },
      { ...base, kind: "ask", phase: "prior", prompt: "What have you seen plants do in the sun?", acknowledgement: "Good noticing. Keep that in mind." },
      { ...base, kind: "explain", phase: "explain" },
      {
        ...base,
        kind: "draw",
        phase: "explain",
        scene: [
          { type: "circle", x: 100, y: 100, radius: 40, color: "yellow" },
        ],
      },
      { ...base, kind: "explain", phase: "reallife", text: "Think of the tulsi plant at home: it leans to the window because light is its food." },
      { ...base, kind: "explain", phase: "model", text: "Example: a plant on a windowsill." },
      { ...base, kind: "ask", phase: "guided", prompt: "Explain the role of sunlight.", rubric },
      { ...base, kind: "ask", phase: "independent", prompt: "Explain it for a plant in a dark room.", rubric },
      { ...base, kind: "summary", phase: "summary" },
    ],
  };
}
// Fixture positions used by the runtime tests
const PRIOR = 1;
const DRAW = 3;
const GUIDED = 6;
const LAST = 8;
const plan = () => ({
  ...validateGuruPlan(rawPlan(), new Set(["vision-0"]), "basis", "en", "hash"),
  id: "artifact",
});
describe("Guru plan contract", () => {
  it("keeps assessment rubrics on the server", () => {
    const publicPlan = publicGuruPlan(plan());
    expect(publicPlan.actions[GUIDED].assessment).toBe(true);
    expect(publicPlan.actions[GUIDED].gating).toBe(true);
    expect(publicPlan.actions[PRIOR]).toMatchObject({ gating: false, assessment: true, acknowledgement: "Good noticing. Keep that in mind." });
    expect(publicPlan.actions.map((a: any) => a.phase)).toEqual(["hook", "prior", "explain", "explain", "reallife", "model", "guided", "independent", "summary"]);
    expect(JSON.stringify(publicPlan)).not.toContain("Light supplies energy.");
  });
  it.each([
    "unknown-anchor",
    "incomplete-coverage",
    "unsafe-scene",
    "out-of-bounds",
    "missing-checkpoint",
  ])("rejects %s", (failure) => {
    const raw: any = rawPlan();
    let ids = new Set(["vision-0"]);
    if (failure === "unknown-anchor") raw.actions[0].evidenceIds = ["made-up"];
    if (failure === "incomplete-coverage") ids.add("vision-1");
    if (failure === "unsafe-scene")
      raw.actions[DRAW].scene = [{ type: "html", x: 0, y: 0, text: "<script/>" }];
    if (failure === "out-of-bounds") raw.actions[DRAW].scene[0].radius = null;
    if (failure === "missing-checkpoint") raw.actions.splice(7, 1);
    expect(() => validateGuruPlan(raw, ids, "basis", "en", "hash")).toThrow(
      "Invalid Guru plan",
    );
  });
  it("clamps overshooting geometry into the canvas instead of failing the lesson", () => {
    const raw: any = rawPlan();
    raw.actions[DRAW].scene = [
      { type: "circle", x: 100, y: 100, radius: 200, color: "yellow" },
      { type: "rect", x: 900, y: 950, width: 400, height: 80.126, color: "white" },
      { type: "line", x: -5, y: 10, x2: 1200, y2: 20, color: "green" },
    ];
    const plan = validateGuruPlan(raw, new Set(["vision-0"]), "basis", "en", "hash");
    expect(plan.actions[DRAW].scene).toEqual([
      expect.objectContaining({ type: "circle", radius: 100 }),
      expect.objectContaining({ type: "rect", width: 100, height: 50 }),
      expect.objectContaining({ type: "line", x: 0, x2: 1000 }),
    ]);
  });
  it("never persists a lesson rejected by source review", async () => {
    const model: any = {
      json: jest
        .fn()
        .mockResolvedValueOnce({
          readable: true,
          blocks: [
            {
              text: "Plants use light.",
              type: "paragraph",
              bbox: [0, 0, 500, 100],
              confidence: 0.95,
            },
          ],
        })
        .mockResolvedValueOnce(rawPlan())
        .mockResolvedValueOnce({
          pass: false,
          issues: ["Unsupported diagram"],
        }),
    };
    const prisma: any = {
      guruLessonArtifact: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
    };
    await expect(
      new GuruPlannerService(model, prisma).build(
        {
          bookId: "b",
          physicalPage: 2,
          sourceHash: "hash",
          width: 1000,
          height: 1000,
          blocks: [],
          imageDataUrl: "image",
        },
        { depth: "basis", language: "en" },
      ),
    ).rejects.toThrow("source review");
    expect(prisma.guruLessonArtifact.upsert).not.toHaveBeenCalled();
  });
});
describe("Lesson blueprint versions", () => {
  const source = { bookId: "b", physicalPage: 2, sourceHash: "hash" };
  const prefs = { depth: "basis" as const, language: "en" };
  it("serves an earlier-blueprint lesson only when allowed, and marks it", async () => {
    const planner = new GuruPlannerService({ identity: "gemini:m" } as any, {} as any);
    const current = planner.artifactIdFor(source, prefs);
    const legacy = planner.artifactIdFor(source, prefs, "guru-v2");
    expect(current).not.toBe(legacy);
    const prisma: any = {
      guruLessonArtifact: {
        findUnique: jest.fn(async ({ where }: any) => (where.id === legacy ? { payload: { plan: { id: legacy } } } : null)),
      },
    };
    const withDb = new GuruPlannerService({ identity: "gemini:m" } as any, prisma);
    expect(await withDb.cached(source, prefs)).toBeNull();
    expect(await withDb.cached(source, prefs, true)).toMatchObject({ blueprint: "guru-v2", legacyBlueprint: true });
    prisma.guruLessonArtifact.findUnique.mockImplementation(async ({ where }: any) => (where.id === current ? { payload: { plan: { id: current } } } : null));
    expect(await withDb.cached(source, prefs, true)).toMatchObject({ blueprint: "guru-v3" });
  });
});
describe("Durable Guru runtime", () => {
  let service: GuruSessionService;
  let db: any;
  let model: any;
  let session: any;
  let events: Map<string, any>;
  let usage: any;
  let bridge: any;
  let learnerContext: any;
  const user = { userId: "owner" };
  const input = (kind: any, answer?: string) => ({
    requestId: "request-123",
    revision: 0,
    kind,
    answer,
  });
  beforeEach(() => {
    events = new Map();
    session = {
      id: "session",
      userId: "owner",
      artifactId: "artifact",
      learnerId: null,
      cursor: GUIDED,
      revision: 0,
      checkpointPassed: false,
      artifact: {
        sourceHash: "hash",
        bookId: "book-x",
        physicalPage: 2,
        payload: {
          plan: plan(),
          page: {
            blocks: [{ blockId: "vision-0", text: "Plants use light." }],
          },
        },
      },
    };
    db = {
      guruTeachingSession: {
        findUnique: jest.fn(async () => session),
        updateMany: jest.fn(async ({ where, data }) => {
          if (where.revision !== session.revision) return { count: 0 };
          session = { ...session, ...data, revision: session.revision + 1 };
          return { count: 1 };
        }),
      },
      guruTeachingEvent: {
        findUnique: jest.fn(async ({ where }) =>
          events.get(where.sessionId_requestId.requestId),
        ),
        create: jest.fn(async ({ data }) => {
          events.set(data.requestId, data);
          return data;
        }),
      },
    };
    db.guruTeachingEvent.findMany = jest.fn(async () => [...events.values()]);
    db.$transaction = jest.fn(async (fn) => fn(db));
    model = {
      json: jest.fn().mockResolvedValue({
        criteriaMet: [true],
        confidence: 0.9,
        feedback: "You connected light to energy.",
        misconception: null,
      }),
    };
    usage = { reserve: jest.fn().mockResolvedValue(undefined) };
    learnerContext = { forLearner: jest.fn().mockResolvedValue({ misconceptions: [], priorPages: [], knownConcepts: [], note: "", recommendedDepth: null }) };
    bridge = {
      record: jest.fn().mockResolvedValue({
        masteryUpdated: false,
        conceptIds: [],
        reason: "bridge-disabled",
      }),
    };
    service = new GuruSessionService(
      db,
      model,
      { verifyUserLearnerOwnership: jest.fn().mockResolvedValue(true) } as any,
      usage,
      bridge,
      learnerContext,
    );
  });
  it("hears a prior-knowledge answer without a model call, acknowledges it and lets the learner continue", async () => {
    session.cursor = PRIOR;
    const heard: any = await service.event("session", input("answer", "Plants bend toward the window."), user);
    expect(model.json).not.toHaveBeenCalled();
    expect(usage.reserve).not.toHaveBeenCalled();
    expect(heard.feedback).toBe("Good noticing. Keep that in mind.");
    expect(heard.checkpointPassed).toBe(true);
    expect(heard.assessment).toMatchObject({ kind: "PRIOR_KNOWLEDGE", passed: null, masteryUpdated: false, masteryNote: "not-assessed" });
    expect(bridge.record).not.toHaveBeenCalled();
    await expect(service.event("session", { ...input("help"), requestId: "request-help-prior", revision: 1 }, user)).rejects.toThrow("No active checkpoint");
  });
  it("lets the learner pass an ungraded ask without answering, but not a graded one", async () => {
    session.cursor = PRIOR;
    const moved: any = await service.event("session", input("next"), user);
    expect(moved.cursor).toBe(PRIOR + 1);
    session.cursor = GUIDED;
    session.revision = 1;
    await expect(service.event("session", { ...input("next"), requestId: "request-next-guided", revision: 1 }, user)).rejects.toThrow("Complete this checkpoint");
  });
  it("tells the grader about misconceptions this learner showed on earlier pages", async () => {
    session.learnerId = "learner-1";
    learnerContext.forLearner.mockResolvedValueOnce({ misconceptions: ["Plants eat soil."] });
    await service.event("session", input("answer", "Light gives energy."), user);
    expect(learnerContext.forLearner).toHaveBeenCalledWith("learner-1", "book-x");
    expect(model.json.mock.calls[0][0]).toContain("Misconceptions this learner showed on earlier pages");
    expect(model.json.mock.calls[0][0]).toContain("Plants eat soil.");
  });
  it("reserves query budget before every paid model call and stops when exhausted", async () => {
    usage.reserve.mockRejectedValueOnce(
      Object.assign(new Error("Daily Guru question limit reached"), { status: 429 }),
    );
    await expect(
      service.event("session", input("question", "Why?"), user),
    ).rejects.toThrow("limit reached");
    expect(model.json).not.toHaveBeenCalled();
    expect(events.size).toBe(0);
    await service.event("session", input("answer", "Light gives energy."), user);
    expect(usage.reserve).toHaveBeenLastCalledWith("owner", "queries");
  });
  it("reports the mastery bridge outcome honestly on the stored assessment", async () => {
    bridge.record.mockResolvedValueOnce({
      masteryUpdated: true,
      conceptIds: ["concept-1"],
      reason: "recorded",
    });
    const result: any = await service.event(
      "session",
      input("answer", "Light gives the plant energy."),
      user,
    );
    expect(bridge.record).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session",
        requestId: "request-123",
        artifact: expect.objectContaining({ id: "artifact", depth: "basis" }),
        assessment: expect.objectContaining({ passed: true, confidence: 0.9 }),
        response: "Light gives the plant energy.",
      }),
    );
    expect(result.assessment).toMatchObject({
      masteryUpdated: true,
      conceptIds: ["concept-1"],
      masteryNote: "recorded",
    });
    expect(events.get("request-123").result.assessment.masteryUpdated).toBe(true);
  });
  it("schedules the first spaced review when a run reaches the summary, from what the run showed", async () => {
    // Session fixture sits at the checkpoint (index 2 of 4); pass it, then advance to the summary.
    await service.event("session", input("answer", "Light gives energy."), user);
    session.cursor = LAST - 1;
    session.checkpointPassed = true;
    session.revision = 1;
    const result: any = await service.event(
      "session",
      { ...input("next"), requestId: "request-next-1", revision: 1 },
      user,
    );
    expect(result.cursor).toBe(LAST);
    expect(result.review).toMatchObject({ stage: 1, label: "partial", lastOutcome: "INDEPENDENT", passedCheckpoints: 1, assistedCheckpoints: 0, firstCompletion: true });
    const scheduled = new Date(result.review.nextReviewAt).getTime() - Date.now();
    expect(scheduled).toBeGreaterThan(1.9 * 24 * 3600 * 1000);
    expect(scheduled).toBeLessThanOrEqual(2 * 24 * 3600 * 1000);
    const write = db.guruTeachingSession.updateMany.mock.calls.pop()[0];
    expect(write.data).toMatchObject({ reviewStage: 1, lastReviewOutcome: "INDEPENDENT" });
    expect(write.data.completedAt).toBeInstanceOf(Date);
  });
  it("moves a page down a stage when a review run needed help, and up when it did not", async () => {
    await service.event("session", input("help"), user);
    session.cursor = LAST - 1;
    session.checkpointPassed = true;
    session.revision = 1;
    session.completedAt = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    session.reviewStage = 2;
    const assisted: any = await service.event("session", { ...input("next"), requestId: "request-next-2", revision: 1 }, user);
    expect(assisted.review).toMatchObject({ stage: 1, label: "partial", lastOutcome: "ASSISTED", firstCompletion: false });
    // A later independent run from a restart counts only events after the restart.
    events.clear();
    session.cursor = 0;
    session.revision = 2;
    session.reviewStage = 1;
    const restarted: any = await service.event("session", { ...input("restart"), requestId: "request-restart", revision: 2 }, user);
    expect(db.guruTeachingSession.updateMany.mock.calls.pop()[0].data.runStartedAt).toBeInstanceOf(Date);
    expect(restarted.review.stage).toBe(1);
    session.runStartedAt = new Date();
    session.cursor = GUIDED;
    session.checkpointPassed = false;
    session.revision = 3;
    await service.event("session", { ...input("answer", "Light gives energy."), requestId: "request-answer-2", revision: 3 }, user);
    session.cursor = LAST - 1;
    session.checkpointPassed = true;
    session.revision = 4;
    const independent: any = await service.event("session", { ...input("next"), requestId: "request-next-3", revision: 4 }, user);
    expect(independent.review).toMatchObject({ stage: 2, label: "understood", lastOutcome: "INDEPENDENT", assistedCheckpoints: 0 });
  });
  it("never calls the bridge for assisted practice or questions", async () => {
    await service.event("session", input("help"), user);
    model.json.mockResolvedValue({ answer: "Plants use light.", evidenceIds: ["vision-0"] });
    await service.event(
      "session",
      { ...input("question", "How?"), requestId: "request-456", revision: 1 },
      user,
    );
    expect(bridge.record).not.toHaveBeenCalled();
  });
  it("refuses access to another user before evaluating or writing", async () => {
    await expect(
      service.event("session", input("answer", "answer"), { userId: "other" }),
    ).rejects.toThrow("Session unavailable");
    expect(model.json).not.toHaveBeenCalled();
  });
  it("answers a page question without advancing or passing the checkpoint", async () => {
    model.json.mockResolvedValue({
      answer: "Plants use light.",
      evidenceIds: ["vision-0"],
    });
    const result: any = await service.event(
      "session",
      input("question", "How do plants use light?"),
      user,
    );
    expect(result.cursor).toBe(GUIDED);
    expect(result.checkpointPassed).toBe(false);
    expect(result.evidenceIds).toEqual(["vision-0"]);
    expect(result.assessment).toBeNull();
  });
  it("rejects question answers citing another source without saving", async () => {
    model.json.mockResolvedValue({
      answer: "Unsupported.",
      evidenceIds: ["another-page"],
    });
    await expect(
      service.event("session", input("question", "Why?"), user),
    ).rejects.toThrow("linked to this page");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("blocks checkpoint skipping", async () => {
    await expect(service.event("session", input("next"), user)).rejects.toThrow(
      "checkpoint",
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("persists answer evidence exactly once across network retries", async () => {
    const event = input("answer", "Light gives energy.");
    const first: any = await service.event("session", event, user);
    const replay: any = await service.event("session", event, user);
    expect(first.checkpointPassed).toBe(true);
    expect(replay.revision).toBe(1);
    expect(first.assessment.masteryUpdated).toBe(false);
    expect(model.json).toHaveBeenCalledTimes(1);
    expect(db.guruTeachingEvent.create).toHaveBeenCalledTimes(1);
    expect([...events.values()][0].result.sourceHash).toBe("hash");
  });
  it("rejects a request ID reused with a different answer", async () => {
    await service.event("session", input("answer", "one"), user);
    await expect(
      service.event("session", input("answer", "two"), user),
    ).rejects.toThrow("Request ID");
  });
  it("rejects stale revisions before model work", async () => {
    await expect(
      service.event("session", { ...input("answer", "a"), revision: 5 }, user),
    ).rejects.toThrow("Session changed");
    expect(model.json).not.toHaveBeenCalled();
  });
  it("keeps uncertain answers at the checkpoint", async () => {
    model.json.mockResolvedValue({
      criteriaMet: [true],
      confidence: 0.5,
      feedback: "maybe",
    });
    const result: any = await service.event(
      "session",
      input("answer", "a"),
      user,
    );
    expect(result.checkpointPassed).toBe(false);
  });
  it("rejects malformed assessments without changing progress", async () => {
    model.json.mockResolvedValue({
      criteriaMet: [true],
      confidence: NaN,
      feedback: "yes",
    });
    await expect(
      service.event("session", input("answer", "a"), user),
    ).rejects.toThrow("validated");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("records assistance without awarding independent understanding", async () => {
    const result: any = await service.event("session", input("help"), user);
    expect(result.checkpointPassed).toBe(true);
    expect(result.assessment).toMatchObject({
      kind: "ASSISTED_PRACTICE",
      passed: false,
      masteryUpdated: false,
    });
    expect(model.json).not.toHaveBeenCalled();
  });
  it("detects concurrent updates at the transaction boundary", async () => {
    db.guruTeachingSession.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.event("session", input("answer", "a"), user),
    ).rejects.toThrow("Another response");
    expect(db.guruTeachingEvent.create).not.toHaveBeenCalled();
  });
});
describe("Production learner isolation", () => {
  it("does not permit demo-parent identity to bypass ownership", async () => {
    const old = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const db: any = {
        learner: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ legacyChild: { parentId: "someone-else" } }),
        },
        child: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      expect(
        await new LearningLibraryAuthGuard(db).verifyUserLearnerOwnership(
          { role: "PARENT", userId: "parent-001", email: "demo@ekaguru.com" },
          "private",
        ),
      ).toBe(false);
    } finally {
      process.env.NODE_ENV = old;
    }
  });
});

describe("Session start with a chosen learner", () => {
  const artifact = (bookId: string) => ({ id: "artifact", bookId, payload: {} });
  function build(bookId: string, owned: boolean) {
    const created: any[] = [];
    const db: any = {
      guruLessonArtifact: { findUnique: jest.fn().mockResolvedValue(artifact(bookId)) },
      learningMaterial: {
        findUnique: jest.fn().mockResolvedValue({ id: bookId, learnerId: "material-learner" }),
      },
      guruTeachingSession: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(async ({ data }: any) => {
          const row = { id: "s" + created.length, cursor: 0, revision: 0, checkpointPassed: false, ...data };
          created.push(row);
          return row;
        }),
      },
    };
    const access = { verifyUserLearnerOwnership: jest.fn().mockResolvedValue(owned) };
    const learnerContext = { forLearner: jest.fn().mockResolvedValue({ recommendedDepth: "developing", priorPages: [], knownConcepts: [], misconceptions: [], note: "You have already worked through page 45." }) };
    return { db, access, created, learnerContext, service: new GuruSessionService(db, {} as any, access as any, {} as any, {} as any, learnerContext as any) };
  }
  it("binds a built-in textbook session to an owned learner and keeps learners separate", async () => {
    const { db, access, service, learnerContext } = build("evs-class-5", true);
    const first: any = await service.start("artifact", { userId: "parent" }, "child-a");
    expect(access.verifyUserLearnerOwnership).toHaveBeenCalledWith({ userId: "parent" }, "child-a");
    expect(first.learnerId).toBe("child-a");
    expect(learnerContext.forLearner).toHaveBeenCalledWith("child-a", "evs-class-5");
    expect(first.personalization).toMatchObject({ recommendedDepth: "developing", note: "You have already worked through page 45." });
    expect(db.guruTeachingSession.findFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { userId: "parent", artifactId: "artifact", learnerId: "child-a" } }),
    );
    const anonymous = await service.start("artifact", { userId: "parent" });
    expect(anonymous.learnerId).toBeNull();
    expect(db.guruTeachingSession.findFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { userId: "parent", artifactId: "artifact", learnerId: null } }),
    );
  });
  it("refuses a learner the account does not own without creating a session", async () => {
    const { db, service } = build("evs-class-5", false);
    await expect(service.start("artifact", { userId: "parent" }, "someone-elses-child")).rejects.toThrow(
      "belongs to your account",
    );
    expect(db.guruTeachingSession.create).not.toHaveBeenCalled();
  });
  it("always binds private material sessions to the material's learner", async () => {
    const { service } = build("material-1", true);
    const session = await service.start("artifact", { userId: "parent" }, "material-learner");
    expect(session.learnerId).toBe("material-learner");
    await expect(service.start("artifact", { userId: "parent" }, "other-learner")).rejects.toThrow(
      "different learner profile",
    );
  });
});
it("does not let a supplied learner ID override private material ownership", async () => {
  const guard = new LearningLibraryAuthGuard({
    learningMaterial: {
      findUnique: jest.fn().mockResolvedValue({ learnerId: "victim" }),
    },
  } as any);
  const request = {
    user: { userId: "attacker", role: "PARENT" },
    params: { materialId: "private" },
    body: { learnerId: "owned-by-attacker" },
  };
  await expect(
    guard.canActivate({
      switchToHttp: () => ({ getRequest: () => request }),
    } as any),
  ).rejects.toThrow("Resource mismatch");
});
