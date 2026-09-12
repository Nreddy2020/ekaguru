import { GuruNotesController } from "./guru-notes.controller";

function controllerWith(cachedNotes: any | null, evidenceStatus = "READY") {
  const source = { bookId: "evs-class-5", physicalPage: 3, sourceHash: "h", totalPages: 5, status: evidenceStatus, blocks: [] };
  const evidence = { builtin: jest.fn(async (_b: string, page: string) => ({ ...source, physicalPage: Number(page) })), material: jest.fn(async () => source) };
  const notes = {
    cached: jest.fn(async () => cachedNotes),
    extend: jest.fn(async () => ({ extension: { id: "x1" }, reused: false })),
    readyPages: jest.fn(async () => [1, 2]),
  };
  const queue = {
    enqueueNotes: jest.fn(async () => ({ id: "job-n", kind: "notes", status: "QUEUED", stage: "queued", artifactId: "n1" })),
    notesJobs: jest.fn(async () => [{ physicalPage: 3, status: "QUEUED" }]),
  };
  const evidenceQueue = { enqueue: jest.fn(async () => ({ id: "evidence:e1", status: "QUEUED", stage: "queued" })) };
  const controller = new GuruNotesController(evidence as any, notes as any, queue as any, evidenceQueue as any);
  return { controller, evidence, notes, queue, evidenceQueue, source };
}
const user = { userId: "u1", role: "PARENT" };

describe("Guru notes endpoints", () => {
  it("serves stored notes with 200 and never runs OCR in the request", async () => {
    const { controller, evidence, queue } = controllerWith({ id: "n1", notes: { title: "t" } });
    const res = { status: jest.fn() };
    const answer: any = await controller.builtin("evs-class-5", "3", { language: "en" }, { user }, res);
    expect(answer.id).toBe("n1");
    expect(res.status).not.toHaveBeenCalled();
    expect(evidence.builtin).toHaveBeenCalledWith("evs-class-5", "3", { performOcr: false });
    expect(queue.enqueueNotes).not.toHaveBeenCalled();
  });
  it("queues a notes job and answers 202, or 204 with cachedOnly", async () => {
    const { controller, queue } = controllerWith(null);
    const res = { status: jest.fn() };
    const answer: any = await controller.builtin("evs-class-5", "3", { language: "en" }, { user }, res);
    expect(answer.job.id).toBe("job-n");
    expect(res.status).toHaveBeenCalledWith(202);
    expect(queue.enqueueNotes).toHaveBeenCalledWith(expect.objectContaining({ physicalPage: 3 }), "en", user);
    const peek = { status: jest.fn() };
    expect(await controller.builtin("evs-class-5", "3", { language: "en" }, { user }, peek, "1")).toBeUndefined();
    expect(peek.status).toHaveBeenCalledWith(204);
  });
  it("answers the reading job first while the page text is unread", async () => {
    const { controller, evidenceQueue, queue } = controllerWith(null, "PENDING");
    const res = { status: jest.fn() };
    const answer: any = await controller.builtin("evs-class-5", "3", { language: "en" }, { user }, res);
    expect(answer.job.id).toBe("evidence:e1");
    expect(res.status).toHaveBeenCalledWith(202);
    expect(evidenceQueue.enqueue).toHaveBeenCalled();
    expect(queue.enqueueNotes).not.toHaveBeenCalled();
  });
  it("routes a topic question to the notes service with the page source", async () => {
    const { controller, notes } = controllerWith({ id: "n1" });
    const body = { language: "en", topicId: "t1", question: "How is a baby plant born?" };
    const answer: any = await controller.askBuiltin("evs-class-5", "3", body, { user });
    expect(answer.extension.id).toBe("x1");
    expect(notes.extend).toHaveBeenCalledWith(expect.objectContaining({ physicalPage: 3 }), "en", body, user);
  });
  it("queues a whole book page by page with one budget reservation and reports progress", async () => {
    const { controller, queue, evidence } = controllerWith(null);
    const result = await controller.prepareBuiltin("evs-class-5", { language: "en" }, { user });
    expect(result).toMatchObject({ pagesTotal: 5, from: 1, to: 5, queued: 5, ready: 0, reading: 0, failed: [] });
    expect(evidence.builtin).toHaveBeenCalledTimes(5);
    const calls = queue.enqueueNotes.mock.calls as any[][];
    expect(calls[0][3]).toEqual({ reserved: false, priority: 0 });
    expect(calls[1][3]).toEqual({ reserved: true, priority: 0 });
    const status = await controller.statusBuiltin("evs-class-5", "en");
    expect(status).toMatchObject({ language: "en", ready: [1, 2], readyCount: 2 });
    expect(status.jobs[0].physicalPage).toBe(3);
  });
});
