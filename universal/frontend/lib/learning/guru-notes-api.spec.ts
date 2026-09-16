import { GURU_POLL_INTERVAL_MS } from "./guru-api";
import { askNotesQuestion, bookNotesStatus, bookPath, loadGuruNotes, prepareBookNotes, requestTopicLadder } from "./guru-notes-api";

const page: any = { bookId: "evs-class-5", physicalPage: 3, sourceHash: "hash", totalPages: 5, width: 10, height: 10, status: "READY", blocks: [], omittedBlockCount: 0, version: "v1" };
const view = {
  id: "n1",
  bookId: "evs-class-5",
  physicalPage: 3,
  sourceHash: "hash",
  language: "en",
  blueprint: "notes-v1",
  notes: { title: "I am Growing Up", overview: "o", objectives: ["x"], topics: [{ id: "t1", heading: "h", evidenceIds: ["b1"], explanation: ["p1", "p2"], keyTerms: [], example: { situation: "s", explanation: "e" }, rememberTip: "t", commonDoubts: [], checkYourself: [] }], summary: ["s"], omitted: [], language: "en", sourceHash: "hash", blueprint: "notes-v1" },
  extensions: [],
  createdAt: "2026-09-12T00:00:00Z",
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

it("addresses built-in books and uploads differently", () => {
  expect(bookPath("evs-class-5")).toBe("/api/v2/textbooks/evs-class-5");
  expect(bookPath("m 1")).toBe("/api/v2/learning-materials/m%201");
});

it("waits for the notes job, then loads the stored notes", async () => {
  const calls: string[] = [];
  (global as any).fetch = jest.fn(async (url: string) => {
    calls.push(url);
    if (url.endsWith("/pages/3/notes"))
      return calls.filter((u) => u.endsWith("/pages/3/notes")).length === 1
        ? respond(202, { job: { id: "job-n", kind: "notes", status: "QUEUED", stage: "queued", artifactId: "n1" } })
        : respond(200, view);
    if (url.endsWith("/jobs/job-n")) return respond(200, { id: "job-n", status: "DONE", stage: "done", artifactId: "n1" });
    throw new Error("unexpected " + url);
  });
  const stages: string[] = [];
  const pending = loadGuruNotes(page, "en", "basis", new AbortController().signal, (s) => stages.push(s));
  await jest.advanceTimersByTimeAsync(GURU_POLL_INTERVAL_MS + 5);
  const result = await pending;
  expect(result.notes.title).toBe("I am Growing Up");
  expect(JSON.parse(((global as any).fetch as jest.Mock).mock.calls[0][1].body)).toEqual({ language: "en", depth: "basis" });
  expect(stages).toEqual(["queued", "done"]);
  expect(calls.filter((u) => u.endsWith("/pages/3/notes"))).toHaveLength(2);
});

it("refuses notes that do not match the opened page", async () => {
  (global as any).fetch = jest.fn(async () => respond(200, { ...view, sourceHash: "other" }));
  await expect(loadGuruNotes(page, "en", "basis", new AbortController().signal)).rejects.toThrow(/do not match/);
});

it("posts a topic question, a whole-book preparation and reads the book status", async () => {
  const calls: { url: string; body?: any; method?: string }[] = [];
  (global as any).fetch = jest.fn(async (url: string, init: any) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined, method: init?.method });
    if (url.endsWith("/notes/questions")) return respond(201, { extension: { id: "x1", topicId: "t1", question: "q", answer: "a", evidenceIds: [], beyondPage: false, createdAt: "" }, reused: false });
    if (url.endsWith("/notes/prepare")) return respond(201, { pagesTotal: 5, from: 1, to: 5, ready: 1, queued: 4, reading: 0, failed: [] });
    if (url.includes("/notes/status?language=en&depth=developing")) return respond(200, { bookId: "evs-class-5", language: "en", ready: [3], readyCount: 1, jobs: [] });
    throw new Error("unexpected " + url);
  });
  const asked = await askNotesQuestion(page, "en", "developing", "t1", "How is a baby plant born?", "learner-1");
  expect(asked.extension.id).toBe("x1");
  expect(calls[0]).toMatchObject({ method: "POST", body: { language: "en", depth: "developing", topicId: "t1", question: "How is a baby plant born?", learnerId: "learner-1" } });
  const prepared = await prepareBookNotes("evs-class-5", "en", "developing");
  expect(prepared.queued).toBe(4);
  expect(calls[1].body).toEqual({ language: "en", depth: "developing" });
  const status = await bookNotesStatus("evs-class-5", "en", "developing");
  expect(status.readyCount).toBe(1);
  expect(calls[2].method).toBe("GET");
  expect(calls[2].url).toMatch(/depth=developing$/);
});

it("refuses notes written at another depth than the one asked for", async () => {
  (global as any).fetch = jest.fn(async () => respond(200, { ...view, depth: "deep" }));
  await expect(loadGuruNotes(page, "en", "basis", new AbortController().signal)).rejects.toThrow(/do not match/);
});

it("requests an alternative explanation ladder rung for a topic", async () => {
  const calls: { url: string; body?: any; method?: string }[] = [];
  (global as any).fetch = jest.fn(async (url: string, init: any) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined, method: init?.method });
    if (url.endsWith("/notes/ladder"))
      return respond(200, {
        topicId: "t1",
        level: "younger",
        label: "Explain like I'm younger",
        explanation: "Picture a tiny seed sleeping in soil like a blanket!",
        reused: false,
      });
    throw new Error("unexpected " + url);
  });

  const result = await requestTopicLadder(page, "en", "developing", "t1", "younger", "learner-1");
  expect(result.level).toBe("younger");
  expect(result.explanation).toContain("tiny seed sleeping");
  expect(calls[0]).toMatchObject({
    method: "POST",
    body: {
      language: "en",
      depth: "developing",
      topicId: "t1",
      level: "younger",
      learnerId: "learner-1",
    },
  });
});

it("maps audience types to appropriate blueprints", () => {
  const { blueprintForAudience, BLUEPRINTS } = require("./guru-notes-api");
  expect(blueprintForAudience("child")).toBe(BLUEPRINTS.CHILD);
  expect(blueprintForAudience("school_student")).toBe(BLUEPRINTS.CHILD);
  expect(blueprintForAudience("teacher")).toBe(BLUEPRINTS.CHILD);
  expect(blueprintForAudience("it_professional")).toBe(BLUEPRINTS.PROFESSIONAL);
  expect(blueprintForAudience("manager")).toBe(BLUEPRINTS.PROFESSIONAL);
  expect(blueprintForAudience("competitive_exam")).toBe(BLUEPRINTS.PROFESSIONAL);
  expect(blueprintForAudience("professor")).toBe(BLUEPRINTS.PROFESSOR);
  expect(blueprintForAudience("college_student")).toBe(BLUEPRINTS.PROFESSOR);
  expect(blueprintForAudience(undefined)).toBe(BLUEPRINTS.CHILD);
});

it("passes audience parameter to loadGuruNotes, prepareBookNotes, and bookNotesStatus", async () => {
  const calls: { url: string; body?: any }[] = [];
  (global as any).fetch = jest.fn(async (url: string, init: any) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined });
    if (url.endsWith("/pages/3/notes")) return respond(200, { ...view, targetAudience: "it_professional" });
    if (url.endsWith("/notes/prepare")) return respond(201, { pagesTotal: 5, from: 1, to: 5, ready: 1, queued: 4, reading: 0, failed: [] });
    if (url.includes("/notes/status")) return respond(200, { bookId: "evs-class-5", language: "en", ready: [3], readyCount: 1, jobs: [] });
    throw new Error("unexpected " + url);
  });

  await loadGuruNotes(page, "en", "basis", new AbortController().signal, undefined, "it_professional");
  expect(calls[0].body).toEqual({ language: "en", depth: "basis", audience: "it_professional" });

  await prepareBookNotes("evs-class-5", "en", "deep", undefined, "professor");
  expect(calls[1].body).toEqual({ language: "en", depth: "deep", audience: "professor" });

  await bookNotesStatus("evs-class-5", "en", "deep", undefined, "professor");
  expect(calls[2].url).toContain("audience=professor");
});

