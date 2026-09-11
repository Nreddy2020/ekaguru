import { PageEvidenceQueueService } from "./page-evidence-queue.service";

function memoryPrisma(stored: any[] = []) {
  const jobs: any[] = [];
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
    stored,
    guruPageEvidence: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id) return stored.find((s) => s.id === where.id) || null;
        const key = where.bookId_physicalPage_sourceHash;
        return stored.find((s) => s.bookId === key.bookId && s.physicalPage === key.physicalPage && s.sourceHash === key.sourceHash) || null;
      }),
    },
    guruEvidenceJob: {
      findFirst: jest.fn(async ({ where }: any) => {
        const row = jobs.filter((j) => matches(j, where)).sort((a, b) => a.createdAt - b.createdAt)[0];
        return row ? { ...row } : null;
      }),
      findMany: jest.fn(async ({ where }: any) => jobs.filter((j) => matches(j, where)).map((j) => ({ ...j }))),
      findUnique: jest.fn(async ({ where }: any) => {
        const row = jobs.find((j) => j.id === where.id);
        return row ? { ...row } : null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const row = { id: "e" + ++seq, status: "QUEUED", stage: "queued", attempts: 0, error: null, createdAt: new Date(Date.now() + seq), updatedAt: new Date(), startedAt: null, finishedAt: null, ...data };
        jobs.push(row);
        return row;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const rows = jobs.filter((j) => matches(j, where));
        rows.forEach((r) => apply(r, data));
        return { count: rows.length };
      }),
    },
  };
  return db;
}
const identity = { bookId: "evs-class-5", physicalPage: 9, sourceHash: "h9" };
const ready = { ...identity, status: "READY", blocks: [{ blockId: "b1" }] };

describe("PageEvidenceQueueService", () => {
  const env = { ...process.env };
  let db: any;
  let evidence: any;
  let service: PageEvidenceQueueService;
  beforeEach(() => {
    process.env = { ...env, NODE_ENV: "test", GURU_JOB_MAX_ATTEMPTS: "2" };
    db = memoryPrisma();
    evidence = { builtin: jest.fn(async () => ready), material: jest.fn(async () => ({ ...ready, bookId: "m1" })) };
    service = new PageEvidenceQueueService(db, evidence);
  });
  afterAll(() => {
    process.env = { ...env };
  });

  it("answers DONE without a job when the page text is already stored", async () => {
    db = memoryPrisma([{ id: "s1", ...identity, createdAt: new Date() }]);
    service = new PageEvidenceQueueService(db, evidence);
    const job = await service.enqueue(identity, { userId: "p1" });
    expect(job.status).toBe("DONE");
    expect(db.jobs).toHaveLength(0);
    expect((await service.status(job.id, { userId: "anyone" })).status).toBe("DONE");
  });
  it("creates one job per page revision and dedupes concurrent readers, anonymous ones included", async () => {
    const first = await service.enqueue(identity, undefined);
    const second = await service.enqueue(identity, { userId: "p1" });
    expect(first.id).toBe(second.id);
    expect(first.id.startsWith("evidence:")).toBe(true);
    expect(db.jobs).toHaveLength(1);
    expect(db.jobs[0].requestedBy).toBe("anonymous");
    // A public page's reading job is readable by anyone; a private one only by its requester or an admin.
    expect((await service.status(first.id, { userId: "stranger" })).status).toBe("QUEUED");
    const priv = await service.enqueue({ ...identity, bookId: "m1" }, { userId: "owner" });
    await expect(service.status(priv.id, { userId: "stranger", role: "PARENT" })).rejects.toThrow();
    expect((await service.status(priv.id, { userId: "curator", role: "ADMIN" })).id).toBe(priv.id);
    await expect(service.status("evidence:missing", { userId: "p1" })).rejects.toThrow("Job unavailable");
  });
  it("claims with compare-and-swap, runs OCR through the worker path and completes", async () => {
    await service.enqueue(identity, { userId: "p1" });
    const claimed = await service.claim();
    expect(claimed).toMatchObject({ status: "RUNNING", stage: "ocr", attempts: 1 });
    expect(await service.claim()).toBeNull();
    await service.run(claimed);
    expect(evidence.builtin).toHaveBeenCalledWith("evs-class-5", "9", { performOcr: true });
    expect(db.jobs[0]).toMatchObject({ status: "DONE", stage: "done", error: null });
  });
  it("reads uploaded materials through the material path", async () => {
    await service.enqueue({ ...identity, bookId: "m1" }, { userId: "owner" });
    await service.run(await service.claim());
    expect(evidence.material).toHaveBeenCalledWith("m1", "9", { performOcr: true });
    expect(db.jobs[0].status).toBe("DONE");
  });
  it("fails permanently when the source changed or the page is unavailable, re-queues transient errors once", async () => {
    evidence.builtin.mockResolvedValueOnce({ ...ready, sourceHash: "other" });
    await service.enqueue(identity, { userId: "p1" });
    await service.run(await service.claim());
    expect(db.jobs[0]).toMatchObject({ status: "FAILED" });
    expect(db.jobs[0].error).toMatch(/source changed/);

    evidence.builtin.mockRejectedValueOnce(Object.assign(new Error("Physical scan unavailable"), { status: 404 }));
    await service.enqueue({ ...identity, sourceHash: "h10" }, { userId: "p1" });
    await service.run(await service.claim());
    expect(db.jobs[1]).toMatchObject({ status: "FAILED", error: "Physical scan unavailable" });

    evidence.builtin.mockRejectedValueOnce(new Error("tesseract worker crashed"));
    await service.enqueue({ ...identity, sourceHash: "h11" }, { userId: "p1" });
    await service.run(await service.claim());
    expect(db.jobs[2]).toMatchObject({ status: "QUEUED", attempts: 1, error: "tesseract worker crashed" });
    evidence.builtin.mockRejectedValueOnce(new Error("tesseract worker crashed"));
    await service.run(await service.claim());
    expect(db.jobs[2]).toMatchObject({ status: "FAILED", attempts: 2 });
  });
  it("re-queues stale RUNNING jobs at startup and fails those out of attempts", async () => {
    await service.enqueue(identity, { userId: "p1" });
    const claimed = await service.claim();
    db.jobs[0].startedAt = new Date(Date.now() - 60 * 60000);
    expect(await service.recoverStale()).toBe(1);
    expect(db.jobs[0]).toMatchObject({ status: "QUEUED", stage: "queued" });
    const again = await service.claim();
    expect(again.attempts).toBe(2);
    db.jobs[0].startedAt = new Date(Date.now() - 60 * 60000);
    await service.recoverStale();
    expect(db.jobs[0].status).toBe("FAILED");
    expect(claimed.id).toBe(again.id);
  });
  it("runs nothing when the worker is disabled or concurrency is zero", async () => {
    process.env.GURU_WORKER = "disabled";
    expect(service.workerEnabled).toBe(false);
    process.env.GURU_WORKER = "enabled";
    process.env.GURU_OCR_WORKER_CONCURRENCY = "0";
    await service.enqueue(identity, { userId: "p1" });
    await service.tick();
    expect(db.jobs[0].status).toBe("QUEUED");
  });
});
