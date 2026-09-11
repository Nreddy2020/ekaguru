import {
  describeGuruStage,
  loadGuruLesson,
  waitForGuruJob,
  GURU_POLL_INTERVAL_MS,
} from "./guru-api";

const page: any = {
  bookId: "evs-class-5",
  physicalPage: 46,
  sourceHash: "hash",
  blocks: [],
};
const plan = {
  id: "artifact-1",
  title: "T",
  depth: "basis",
  language: "en",
  mode: "guru",
  sourceHash: "hash",
  actions: [{ id: "a0", kind: "summary", text: "x", speech: "x", evidenceIds: [], durationMs: 1 }],
  notes: [],
};
function respond(status: number, body: any) {
  return { ok: status < 400, status, json: async () => body };
}
beforeEach(() => {
  jest.useFakeTimers();
  localStorage.setItem("token", "t");
});
afterEach(() => {
  jest.useRealTimers();
  localStorage.clear();
});

it("describes every known stage and falls back for unknown ones", () => {
  expect(describeGuruStage("plan")).toMatch(/planning/);
  expect(describeGuruStage("nonsense")).toMatch(/working on this page/);
});

it("polls a queued job until it is done, then loads the cached lesson and starts a session", async () => {
  const calls: string[] = [];
  (global as any).fetch = jest.fn(async (url: string) => {
    calls.push(url);
    if (url.endsWith("/pages/46/lesson"))
      return calls.filter((u) => u.endsWith("/lesson")).length === 1
        ? respond(202, { job: { id: "job-1", status: "QUEUED", stage: "queued", artifactId: "artifact-1" } })
        : respond(200, { plan, page: { bookId: "evs-class-5", physicalPage: 46, sourceHash: "hash" } });
    if (url.endsWith("/jobs/job-1"))
      return calls.filter((u) => u.endsWith("/jobs/job-1")).length === 1
        ? respond(200, { id: "job-1", status: "RUNNING", stage: "plan", artifactId: "artifact-1" })
        : respond(200, { id: "job-1", status: "DONE", stage: "done", artifactId: "artifact-1" });
    if (url.endsWith("/sessions"))
      return respond(201, { id: "s1", artifactId: "artifact-1", learnerId: null, cursor: 0, revision: 0, checkpointPassed: false });
    throw new Error("unexpected " + url);
  });
  const stages: string[] = [];
  const pending = loadGuruLesson(page, "basis", "en", undefined, new AbortController().signal, undefined, (s) => stages.push(s));
  await jest.advanceTimersByTimeAsync(GURU_POLL_INTERVAL_MS + 5);
  await jest.advanceTimersByTimeAsync(GURU_POLL_INTERVAL_MS + 5);
  const result = await pending;
  expect(result.plan.id).toBe("artifact-1");
  expect(result.session.id).toBe("s1");
  expect(stages).toEqual(["queued", "plan", "done"]);
  expect(calls.filter((u) => u.endsWith("/lesson"))).toHaveLength(2);
});

it("surfaces a failed job's reason and stops polling", async () => {
  (global as any).fetch = jest.fn(async (url: string) => {
    if (url.endsWith("/jobs/job-2"))
      return respond(200, { id: "job-2", status: "FAILED", stage: "failed", artifactId: "a", error: "Guru's daily provider quota is exhausted for this model." });
    throw new Error("unexpected " + url);
  });
  const pending = waitForGuruJob({ id: "job-2", status: "RUNNING", stage: "vision", artifactId: "a" }, undefined);
  const settled = pending.catch((e) => e);
  await jest.advanceTimersByTimeAsync(GURU_POLL_INTERVAL_MS + 5);
  expect((await settled).message).toMatch(/daily provider quota/);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("stops polling when the caller aborts", async () => {
  (global as any).fetch = jest.fn();
  const controller = new AbortController();
  const pending = waitForGuruJob({ id: "job-3", status: "QUEUED", stage: "queued", artifactId: "a" }, controller.signal);
  const settled = pending.catch((e) => e);
  controller.abort();
  await jest.advanceTimersByTimeAsync(10);
  expect((await settled).name).toBe("AbortError");
  expect(fetch).not.toHaveBeenCalled();
});
