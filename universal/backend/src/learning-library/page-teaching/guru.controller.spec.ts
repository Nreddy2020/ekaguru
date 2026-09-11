import { GuruController } from "./guru.controller";

/**
 * The lesson endpoint's three answers: a cached lesson (200), a queued job (202), and, with
 * cachedOnly, either the cached lesson or 204 with nothing queued so a client can teach from
 * another depth this page already has while the requested one is prepared.
 */
function controllerWith(cachedPlan: any | null) {
  const planner = { cached: jest.fn(async () => cachedPlan) };
  const queue = { enqueue: jest.fn(async () => ({ id: "job-1", status: "QUEUED", stage: "queued", artifactId: "a1" })) };
  const controller = new GuruController(
    {} as any,
    planner as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    queue as any,
    {} as any,
    {} as any,
  );
  return { controller, planner, queue };
}
const source = { bookId: "evs-class-5", physicalPage: 3, sourceHash: "h", blocks: [] };
const prefs = { depth: "developing", language: "en" } as any;
const user = { userId: "u1", role: "PARENT" };

describe("lesson endpoint answers", () => {
  it("serves a cached lesson with 200 whether or not cachedOnly is set", async () => {
    const cached = { plan: { id: "a1", actions: [], omitted: [], sourceHash: "h" }, page: { bookId: "evs-class-5", physicalPage: 3, sourceHash: "h" } };
    const { controller, queue } = controllerWith(cached);
    const res = { status: jest.fn() };
    const answer: any = await controller.plan(source, prefs, user, res, false, true);
    expect(answer.plan.id).toBe("a1");
    expect(res.status).not.toHaveBeenCalled();
    expect(queue.enqueue).not.toHaveBeenCalled();
  });
  it("answers 204 and queues nothing when cachedOnly finds no lesson", async () => {
    const { controller, queue } = controllerWith(null);
    const res = { status: jest.fn() };
    const answer = await controller.plan(source, prefs, user, res, false, true);
    expect(answer).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(204);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });
  it("queues a durable job and answers 202 without cachedOnly", async () => {
    const { controller, queue } = controllerWith(null);
    const res = { status: jest.fn() };
    const answer: any = await controller.plan(source, prefs, user, res, false, false);
    expect(answer.job.id).toBe("job-1");
    expect(res.status).toHaveBeenCalledWith(202);
    expect(queue.enqueue).toHaveBeenCalledWith(source, prefs, user);
  });
});
