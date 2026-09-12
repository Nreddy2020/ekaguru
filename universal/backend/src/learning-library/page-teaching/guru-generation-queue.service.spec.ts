import { GuruGenerationQueueService } from "./guru-generation-queue.service";
import { DAILY_QUOTA_MESSAGE } from "./guru-model.service";

function memoryPrisma(artifacts: Record<string, any> = {}) {
  const jobs: any[] = [];
  const cases: any[] = [];
  let seq = 0;
  const matches = (row: any, where: any) =>
    Object.entries(where).every(([k, v]: [string, any]) => {
      if (v && typeof v === "object" && "in" in v) return v.in.includes(row[k]);
      if (v && typeof v === "object" && "lt" in v) return row[k] && row[k] < v.lt;
      return row[k] === v;
    });
  const apply = (row: any, data: any) => {
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === "object" && "increment" in (v as any)) row[k] = (row[k] || 0) + (v as any).increment;
      else row[k] = v;
    }
    row.updatedAt = new Date();
  };
  const db: any = {
    jobs,
    cases,
    guruLessonArtifact: {
      findUnique: jest.fn(async ({ where }: any) => artifacts[where.id] || null),
    },
    guruPageNotes: {
      findUnique: jest.fn(async ({ where }: any) => (db.notes[where.id] ? { id: where.id, createdAt: new Date() } : null)),
    },
    notes: {} as Record<string, any>,
    guruLessonJob: {
      findFirst: jest.fn(async ({ where }: any) => {
        const row = jobs
          .filter((j) => matches(j, where))
          .sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.createdAt - b.createdAt)[0];
        return row ? { ...row } : null;
      }),
      findMany: jest.fn(async ({ where }: any) => jobs.filter((j) => matches(j, where)).map((j) => ({ ...j }))),
      findUnique: jest.fn(async ({ where }: any) => {
        const row = jobs.find((j) => j.id === where.id);
        return row ? { ...row } : null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const row = { id: "job-" + ++seq, status: "QUEUED", stage: "queued", attempts: 0, error: null, priority: 0, createdAt: new Date(Date.now() + seq), updatedAt: new Date(), startedAt: null, finishedAt: null, ...data };
        jobs.push(row);
        return row;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const rows = jobs.filter((j) => matches(j, where));
        rows.forEach((r) => apply(r, data));
        return { count: rows.length };
      }),
    },
    guruEvaluationCase: {
      updateMany: jest.fn(async ({ where, data }: any) => {
        const rows = cases.filter((c) => matches(c, where));
        rows.forEach((r) => apply(r, data));
        return { count: rows.length };
      }),
    },
  };
  db.$transaction = jest.fn(async (ops: any[]) => Promise.all(ops));
  return db;
}
const source = { bookId: "evs-class-5", physicalPage: 46, sourceHash: "hash", width: 10, height: 10, blocks: [], imageDataUrl: "" };
const prefs = { depth: "basis" as const, language: "en" };

describe("GuruGenerationQueueService", () => {
  const env = { ...process.env };
  let db: any;
  let planner: any;
  let evidence: any;
  let usage: any;
  let notes: any;
  let service: GuruGenerationQueueService;
  beforeEach(() => {
    process.env = { ...env, NODE_ENV: "test", GURU_JOB_MAX_ATTEMPTS: "2" };
    db = memoryPrisma();
    planner = {
      artifactIdFor: jest.fn(() => "artifact-1"),
      build: jest.fn(async (_s: any, _p: any, _g: any, onStage: any) => {
        await onStage?.("plan");
        return { plan: { id: "artifact-1" }, page: {} };
      }),
    };
    evidence = { builtin: jest.fn(async () => source), material: jest.fn(async () => source) };
    usage = { reserve: jest.fn().mockResolvedValue(undefined) };
    notes = {
      notesIdFor: jest.fn(() => "notes-1"),
      build: jest.fn(async (_s: any, _l: string, onStage: any) => {
        onStage?.("notes");
        db.notes["notes-1"] = true;
        return { id: "notes-1" };
      }),
    };
    service = new GuruGenerationQueueService(db, planner, evidence, usage, notes);
  });
  afterAll(() => {
    process.env = { ...env };
  });

  it("returns DONE without a job when the lesson is already cached", async () => {
    db = memoryPrisma({ "artifact-1": { id: "artifact-1", createdAt: new Date() } });
    service = new GuruGenerationQueueService(db, planner, evidence, usage, notes);
    const job = await service.enqueue(source, prefs, { userId: "parent" });
    expect(job).toMatchObject({ status: "DONE", artifactId: "artifact-1" });
    expect(usage.reserve).not.toHaveBeenCalled();
    expect(db.jobs).toHaveLength(0);
    expect((await service.status(job.id, { userId: "anyone" })).status).toBe("DONE");
  });
  it("creates one job per lesson identity, reserving budget once, and dedupes concurrent requests", async () => {
    const first = await service.enqueue(source, prefs, { userId: "parent" });
    const second = await service.enqueue(source, prefs, { userId: "parent" });
    expect(first.id).toBe(second.id);
    expect(first.status).toBe("QUEUED");
    expect(usage.reserve).toHaveBeenCalledTimes(1);
    expect(db.jobs[0]).toMatchObject({ bookId: "evs-class-5", physicalPage: 46, depth: "basis", requestedBy: "parent" });
  });
  it("only the requester or an admin can read a job", async () => {
    const job = await service.enqueue(source, prefs, { userId: "parent" });
    await expect(service.status(job.id, { userId: "stranger", role: "PARENT" })).rejects.toThrow();
    expect((await service.status(job.id, { userId: "curator", role: "ADMIN" })).id).toBe(job.id);
    await expect(service.status("missing", { userId: "parent" })).rejects.toThrow("Job unavailable");
  });
  it("claims with compare-and-swap, records stages, completes and links waiting evaluation cases", async () => {
    db.cases.push({ id: "case-1", bookId: "evs-class-5", physicalPage: 46, depth: "basis", language: "en", artifactId: null });
    await service.enqueue(source, prefs, { userId: "parent" });
    const claimed = await service.claim();
    expect(claimed.status).toBe("RUNNING");
    expect(claimed.attempts).toBe(1);
    expect(await service.claim()).toBeNull();
    await service.run(claimed);
    expect(db.jobs[0]).toMatchObject({ status: "DONE", stage: "done", error: null });
    expect(planner.build).toHaveBeenCalledWith(source, prefs, undefined, expect.any(Function));
    expect(db.cases[0]).toMatchObject({ artifactId: "artifact-1", sourceHash: "hash" });
  });
  it("re-queues a transient failure once, then fails permanently", async () => {
    planner.build.mockRejectedValue(new Error("Guru could not complete a valid response."));
    await service.enqueue(source, prefs, { userId: "parent" });
    await service.run(await service.claim());
    expect(db.jobs[0]).toMatchObject({ status: "QUEUED", attempts: 1 });
    expect(db.jobs[0].error).toContain("could not complete");
    await service.run(await service.claim());
    expect(db.jobs[0]).toMatchObject({ status: "FAILED", attempts: 2, stage: "failed" });
  });
  it("fails immediately on permanent errors such as validation, quota or a changed source", async () => {
    await service.enqueue(source, prefs, { userId: "parent" });
    planner.build.mockRejectedValueOnce(new Error("Invalid Guru plan: incomplete page coverage"));
    await service.run(await service.claim());
    expect(db.jobs[0].status).toBe("FAILED");
    planner.artifactIdFor.mockReturnValue("artifact-2");
    await service.enqueue(source, { ...prefs, depth: "deep" }, { userId: "parent" });
    planner.build.mockRejectedValueOnce(new Error(DAILY_QUOTA_MESSAGE));
    const job2 = await service.claim();
    await service.run(job2);
    expect(db.jobs[1]).toMatchObject({ status: "FAILED", error: DAILY_QUOTA_MESSAGE });
    planner.artifactIdFor.mockReturnValue("artifact-3");
    await service.enqueue({ ...source, sourceHash: "changed" }, prefs, { userId: "parent" });
    const job3 = await service.claim();
    await service.run(job3);
    expect(db.jobs[2].status).toBe("FAILED");
    expect(db.jobs[2].error).toContain("source changed");
    expect(planner.build).toHaveBeenCalledTimes(2);
  });
  it("recovers stale RUNNING jobs after a crash and respects the concurrency limit", async () => {
    process.env.GURU_WORKER_CONCURRENCY = "1";
    await service.enqueue(source, prefs, { userId: "parent" });
    planner.artifactIdFor.mockReturnValue("artifact-9");
    await service.enqueue({ ...source, physicalPage: 47 }, prefs, { userId: "parent" });
    const dead = await service.claim();
    dead.startedAt = new Date(Date.now() - 60 * 60000);
    db.jobs.find((j: any) => j.id === dead.id).startedAt = dead.startedAt;
    expect(await service.recoverStale()).toBe(1);
    expect(db.jobs[0]).toMatchObject({ status: "QUEUED", error: "Worker did not finish; re-queued" });
    let resolveBuild: any;
    planner.build.mockImplementation(() => new Promise((r) => (resolveBuild = r)));
    const flush = async () => {
      for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
    };
    await service.tick();
    await flush();
    expect(db.jobs.filter((j: any) => j.status === "RUNNING")).toHaveLength(1);
    await service.tick();
    await flush();
    // Concurrency 1: the second job stays queued while the first is still generating.
    expect(db.jobs.filter((j: any) => j.status === "RUNNING")).toHaveLength(1);
    expect(db.jobs.filter((j: any) => j.status === "QUEUED")).toHaveLength(1);
    resolveBuild({ plan: { id: "x" } });
    await flush();
    expect(db.jobs.filter((j: any) => j.status === "DONE")).toHaveLength(1);
    await service.tick();
    await flush();
    expect(db.jobs.filter((j: any) => j.status === "RUNNING")).toHaveLength(1);
  });
  it("never starts the interval worker in tests unless explicitly enabled", () => {
    expect(service.workerEnabled).toBe(false);
    process.env.GURU_WORKER = "enabled";
    expect(service.workerEnabled).toBe(true);
    process.env.GURU_WORKER = "disabled";
    expect(service.workerEnabled).toBe(false);
  });
});

describe("notes jobs on the same queue", () => {
  const env = { ...process.env };
  let db: any;
  let notes: any;
  let service: GuruGenerationQueueService;
  const usage = { reserve: jest.fn().mockResolvedValue(undefined) };
  beforeEach(() => {
    process.env = { ...env, NODE_ENV: "test" };
    usage.reserve.mockClear();
    db = memoryPrisma();
    notes = {
      notesIdFor: jest.fn(() => "notes-1"),
      build: jest.fn(async (_s: any, _l: string, onStage: any) => {
        onStage?.("notes");
        db.notes["notes-1"] = true;
        return { id: "notes-1" };
      }),
    };
    const evidence = { builtin: jest.fn(async () => source), material: jest.fn(async () => source) };
    service = new GuruGenerationQueueService(db, {} as any, evidence as any, usage as any, notes);
  });
  afterAll(() => {
    process.env = { ...env };
  });
  it("queues one notes job per page revision and language, reserving budget unless told it is covered", async () => {
    const first = await service.enqueueNotes(source, "en", { userId: "parent" });
    const second = await service.enqueueNotes(source, "en", { userId: "parent" }, { reserved: true });
    expect(first.id).toBe(second.id);
    expect(first).toMatchObject({ kind: "notes", status: "QUEUED", artifactId: "notes-1" });
    expect(usage.reserve).toHaveBeenCalledTimes(1);
    expect(db.jobs[0]).toMatchObject({ kind: "notes", depth: "notes", language: "en", bookId: "evs-class-5" });
    const third = await service.enqueueNotes(source, "en", { userId: "other" }, { reserved: true });
    expect(third.id).toBe(first.id);
  });
  it("runs a claimed notes job through the notes service and completes it", async () => {
    await service.enqueueNotes(source, "en", { userId: "parent" });
    const claimed = await service.claim();
    await service.run(claimed);
    expect(notes.build).toHaveBeenCalledWith(source, "en", expect.any(Function));
    expect(db.jobs[0]).toMatchObject({ status: "DONE", stage: "done", kind: "notes" });
    const done = await service.enqueueNotes(source, "en", { userId: "parent" });
    expect(done).toMatchObject({ status: "DONE", id: "notes:notes-1" });
    expect((await service.status(done.id, { userId: "anyone" })).status).toBe("DONE");
    await expect(service.status("notes:missing", { userId: "parent" })).rejects.toThrow("Notes unavailable");
  });
  it("fails a notes job permanently on invalid notes or failed review", async () => {
    notes.build.mockRejectedValueOnce(new Error("Invalid Guru notes: topic 1 copies the book"));
    await service.enqueueNotes(source, "en", { userId: "parent" });
    await service.run(await service.claim());
    expect(db.jobs[0]).toMatchObject({ status: "FAILED" });
    expect(db.jobs[0].error).toMatch(/copies the book/);
  });
  it("lists the latest notes job per page for a book", async () => {
    await service.enqueueNotes(source, "en", { userId: "parent" });
    notes.notesIdFor.mockReturnValueOnce("notes-47");
    await service.enqueueNotes({ ...source, physicalPage: 47, sourceHash: "h47" }, "en", { userId: "parent" }, { reserved: true });
    const jobs = await service.notesJobs("evs-class-5", "en");
    expect(jobs.map((j: any) => j.physicalPage)).toEqual([46, 47]);
  });
});

describe("queue priority", () => {
  const env = { ...process.env };
  let db: any;
  let service: GuruGenerationQueueService;
  const usage = { reserve: jest.fn().mockResolvedValue(undefined) };
  beforeEach(() => {
    process.env = { ...env, NODE_ENV: "test" };
    db = memoryPrisma();
    const notes = { notesIdFor: jest.fn((s: any) => "notes-" + s.physicalPage), build: jest.fn(async () => ({})) };
    service = new GuruGenerationQueueService(db, {} as any, {} as any, usage as any, notes as any);
  });
  afterAll(() => {
    process.env = { ...env };
  });
  it("runs an opened page before a whole-book batch, and promotes a batch job the learner asks for", async () => {
    await service.enqueueNotes({ ...source, physicalPage: 1 }, "en", { userId: "p" }, { reserved: false, priority: 0 });
    await service.enqueueNotes({ ...source, physicalPage: 2 }, "en", { userId: "p" }, { reserved: true, priority: 0 });
    await service.enqueueNotes({ ...source, physicalPage: 9 }, "en", { userId: "p" });
    expect((await service.claim()).physicalPage).toBe(9);
    const promoted = await service.enqueueNotes({ ...source, physicalPage: 2 }, "en", { userId: "q" });
    expect(promoted.status).toBe("QUEUED");
    expect(db.jobs.find((j: any) => j.physicalPage === 2).priority).toBe(10);
    expect((await service.claim()).physicalPage).toBe(2);
    expect((await service.claim()).physicalPage).toBe(1);
  });
});
