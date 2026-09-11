import {
  GURU_RUBRIC,
  deriveVerdict,
  reconcileVerdict,
  validateScores,
  weightedScore,
} from "./guru-evaluation.rubric";
import { GuruEvaluationService } from "./guru-evaluation.service";

const full = (value: number) =>
  Object.fromEntries(GURU_RUBRIC.map((c) => [c.id, value]));

describe("Guru evaluation rubric", () => {
  it("requires every criterion as an integer in range and rejects unknown keys", () => {
    expect(() => validateScores({ ...full(3), extra: 3 })).toThrow("Unknown rubric criterion");
    const missing: any = full(3);
    delete missing.safety;
    expect(() => validateScores(missing)).toThrow("safety");
    expect(() => validateScores({ ...full(3), safety: 4.5 })).toThrow("integer");
    expect(() => validateScores({ ...full(3), safety: 5 })).toThrow("between");
    expect(validateScores(full(3))).toEqual(full(3));
  });
  it("derives the strictest verdict the scores allow", () => {
    expect(deriveVerdict(full(3))).toBe("PASS");
    expect(deriveVerdict({ ...full(4), source_coverage: 2 })).toBe("REVISE");
    expect(deriveVerdict({ ...full(4), factual_accuracy: 2 })).toBe("FAIL");
    expect(deriveVerdict({ ...full(4), visual_fidelity: 0 })).toBe("FAIL");
  });
  it("lets a reviewer be stricter but never more lenient than the scores", () => {
    expect(reconcileVerdict(undefined, full(4))).toBe("PASS");
    expect(reconcileVerdict("REVISE", full(4))).toBe("REVISE");
    expect(() => reconcileVerdict("PASS", { ...full(4), source_coverage: 2 })).toThrow(
      "only support a verdict of REVISE",
    );
    expect(() => reconcileVerdict("MAYBE", full(4))).toThrow("PASS, REVISE or FAIL");
  });
  it("weights the mean score into 0..1", () => {
    expect(weightedScore(full(4))).toBe(1);
    expect(weightedScore(full(2))).toBe(0.5);
  });
});

function makeCase(overrides: any = {}) {
  return {
    id: "case-1",
    bookId: "evs-class-5",
    physicalPage: 46,
    sourceHash: "hash",
    subject: "Environmental Studies",
    gradeBand: "PRIMARY",
    language: "en",
    depth: "basis",
    artifactId: "artifact",
    reviews: [],
    artifact: {
      payload: {
        plan: {
          objectives: ["Explain seed germination"],
          actions: [
            {
              kind: "ask",
              text: "Why does a seed need water?",
              speech: "Think about it.",
              evidenceIds: ["vision-0"],
              rubric: {
                expected: "Water softens the seed coat",
                criteria: ["Mentions water"],
                hint: "Look at the picture",
                misconception: "Seeds drink like animals",
              },
            },
          ],
        },
        page: { blocks: [{ blockId: "vision-0", type: "paragraph", confidence: 0.95, text: "Seeds need water." }] },
        audit: { method: "model-review" },
      },
    },
    ...overrides,
  };
}

describe("GuruEvaluationService", () => {
  const env = { ...process.env };
  let prisma: any;
  let evidence: any;
  let planner: any;
  let model: any;
  let queue: any;
  let service: GuruEvaluationService;
  beforeEach(() => {
    process.env = { ...env, GURU_EVAL_MIN_PASSED_CASES: "2" };
    prisma = {
      guruEvaluationCase: {
        create: jest.fn(async ({ data }: any) => ({ id: "new", ...data })),
        createMany: jest.fn(async ({ data }: any) => ({ count: data.length - 1 })),
        findMany: jest.fn(async () => []),
        findUnique: jest.fn(async () => makeCase()),
        update: jest.fn(async ({ data }: any) => data),
      },
      guruEvaluationReview: {
        upsert: jest.fn(async ({ create }: any) => ({ id: "review", ...create })),
      },
    };
    evidence = {
      builtin: jest.fn(async () => ({ sourceHash: "hash", imageDataUrl: "data:image/png;base64,AAAA" })),
      material: jest.fn(),
    };
    planner = { build: jest.fn(async () => ({ plan: { id: "artifact" } })) };
    model = { configured: true };
    queue = { enqueue: jest.fn(async () => ({ id: "job-1", status: "QUEUED", stage: "queued", artifactId: "artifact" })) };
    service = new GuruEvaluationService(prisma, evidence, planner, model, queue);
  });
  afterAll(() => {
    process.env = { ...env };
  });

  it("validates cases and reports duplicates as conflicts", async () => {
    await expect(
      service.createCase({ bookId: "x", physicalPage: 0, subject: "S", gradeBand: "PRIMARY", depth: "basis" }, "admin"),
    ).rejects.toThrow("Invalid physical page");
    await expect(
      service.createCase({ bookId: "x", physicalPage: 1, subject: "S", gradeBand: "PRIMARY", depth: "extreme" }, "admin"),
    ).rejects.toThrow("Invalid depth");
    const created = await service.createCase(
      { bookId: "evs-class-5", physicalPage: 46, subject: " EVS ", gradeBand: "PRIMARY", depth: "basis" },
      "admin",
    );
    expect(created).toMatchObject({ subject: "EVS", language: "en", createdBy: "admin" });
    prisma.guruEvaluationCase.create.mockRejectedValueOnce({ code: "P2002" });
    await expect(
      service.createCase({ bookId: "evs-class-5", physicalPage: 46, subject: "EVS", gradeBand: "PRIMARY", depth: "basis" }, "admin"),
    ).rejects.toThrow("already has a case");
  });
  it("imports a manifest with duplicate skipping", async () => {
    const rows = [1, 2, 3].map((p) => ({ bookId: "evs-class-5", physicalPage: p, subject: "EVS", gradeBand: "PRIMARY", depth: "basis" }));
    expect(await service.importCases(rows, "admin")).toEqual({ created: 2, skipped: 1 });
    expect(prisma.guruEvaluationCase.createMany.mock.calls[0][0].skipDuplicates).toBe(true);
    await expect(service.importCases([], "admin")).rejects.toThrow("between 1 and 2000");
  });
  it("prepares lessons only with a configured provider and stores the artifact identity", async () => {
    model.configured = false;
    await expect(service.prepare("case-1", "admin")).rejects.toThrow("Configure the Guru provider");
    model.configured = true;
    const prepared = await service.prepare("case-1", "admin");
    expect(prepared).toMatchObject({ artifactId: "artifact", sourceHash: "hash" });
    expect(planner.build).toHaveBeenCalledWith(
      expect.objectContaining({ sourceHash: "hash" }),
      { depth: "basis", language: "en" },
      expect.any(Function),
    );
    expect(prisma.guruEvaluationCase.update).toHaveBeenCalledWith({
      where: { id: "case-1" },
      data: { artifactId: "artifact", sourceHash: "hash" },
    });
  });
  it("queues HTTP preparation instead of blocking, and links a case when the lesson already exists", async () => {
    const queued = await service.enqueuePrepare("case-1", { userId: "admin", role: "ADMIN" });
    expect(queued).toEqual({ caseId: "case-1", job: expect.objectContaining({ id: "job-1", status: "QUEUED" }) });
    expect(queue.enqueue).toHaveBeenCalledWith(expect.objectContaining({ sourceHash: "hash" }), { depth: "basis", language: "en" }, { userId: "admin", role: "ADMIN" });
    expect(prisma.guruEvaluationCase.update).not.toHaveBeenCalled();
    queue.enqueue.mockResolvedValueOnce({ id: "artifact:artifact", status: "DONE", stage: "done", artifactId: "artifact" });
    await service.enqueuePrepare("case-1", { userId: "admin", role: "ADMIN" });
    expect(prisma.guruEvaluationCase.update).toHaveBeenCalledWith({ where: { id: "case-1" }, data: { artifactId: "artifact", sourceHash: "hash" } });
  });
  it("refuses reviews of unprepared cases and reconciles verdicts", async () => {
    prisma.guruEvaluationCase.findUnique.mockResolvedValueOnce(makeCase({ artifactId: null }));
    await expect(service.review("case-1", "educator", { scores: full(4) })).rejects.toThrow("Prepare the lesson");
    const review = await service.review("case-1", "educator", {
      scores: { ...full(4), factual_accuracy: 1 },
      notes: "Diagram mislabels the root.",
    });
    expect(review).toMatchObject({ verdict: "FAIL", rubricVersion: 1, weightedScore: 0.8548 });
    await expect(
      service.review("case-1", "educator", { scores: { ...full(4), source_coverage: 2 }, verdict: "PASS" }),
    ).rejects.toThrow("only support a verdict of REVISE");
  });
  it("computes consensus per case and the depth approval gate", async () => {
    const pass = { rubricVersion: 1, verdict: "PASS", scores: full(4) };
    const revise = { rubricVersion: 1, verdict: "REVISE", scores: { ...full(4), source_coverage: 2 } };
    const old = { rubricVersion: 0, verdict: "FAIL", scores: full(0) };
    prisma.guruEvaluationCase.findMany.mockResolvedValue([
      makeCase({ id: "a", reviews: [pass, old] }),
      makeCase({ id: "b", physicalPage: 47, reviews: [pass, revise] }),
      makeCase({ id: "c", physicalPage: 48, reviews: [] }),
      makeCase({ id: "d", physicalPage: 49, depth: "deep", reviews: [pass] }),
    ]);
    const cases = await service.listCases();
    expect(cases.map((c) => c.consensus)).toEqual(["PASS", "REVISE", "UNREVIEWED", "PASS"]);
    expect(cases[0].meanWeightedScore).toBe(1);
    const summary = await service.summary();
    expect(summary.groups.find((g: any) => g.depth === "basis")).toMatchObject({ cases: 3, reviewed: 2, passed: 1 });
    expect(summary.approvedDepths).toEqual([]);
    prisma.guruEvaluationCase.findMany.mockResolvedValue([
      makeCase({ id: "a", reviews: [pass] }),
      makeCase({ id: "b", physicalPage: 47, reviews: [pass, pass] }),
      makeCase({ id: "c", physicalPage: 48, reviews: [pass, revise] }),
    ]);
    expect(await service.isDepthApproved("basis", "en")).toBe(true);
    expect(prisma.guruEvaluationCase.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { depth: "basis", language: "en" } }),
    );
    process.env.GURU_EVAL_MIN_PASSED_CASES = "3";
    expect(await service.isDepthApproved("basis", "en")).toBe(false);
  });
  it("exports a reviewer packet with the rubric and server-held expected answers", async () => {
    const markdown = await service.packetMarkdown("case-1");
    expect(markdown).toContain("# Guru evaluation packet");
    expect(markdown).toContain("Factual accuracy");
    expect(markdown).toContain("Expected: Water softens the seed coat");
    expect(markdown).toContain("vision-0 [paragraph, 95%]: Seeds need water.");
    const packet = await service.packet("case-1");
    expect(packet.lesson.actions[0].rubric.expected).toBe("Water softens the seed coat");
    expect(packet.page.imageDataUrl).toBeNull();
    expect(evidence.builtin).not.toHaveBeenCalled();
  });
});
