import { GuruLearnerContextService } from "./guru-learner-context.service";

function prisma(sessions: any[], masteries: any[] = []) {
  return {
    guruTeachingSession: { findMany: jest.fn(async () => sessions) },
    learnerConceptMastery: { findMany: jest.fn(async () => masteries) },
  } as any;
}
const session = (page: number, depth: string, outcome: string | null, extra: any = {}) => ({
  id: "s" + page,
  completedAt: new Date("2026-09-10T08:00:00Z"),
  reviewStage: 1,
  lastReviewOutcome: outcome,
  artifact: { bookId: "evs-class-5", physicalPage: page, payload: { plan: { title: "Page " + page + " topic", depth } } },
  events: [],
  ...extra,
});

describe("GuruLearnerContextService", () => {
  it("returns an empty context without a learner and never queries", async () => {
    const db = prisma([]);
    const ctx = await new GuruLearnerContextService(db).forLearner(null, "evs-class-5");
    expect(ctx).toMatchObject({ learnerId: null, recommendedDepth: null, priorPages: [], note: "" });
    expect(db.guruTeachingSession.findMany).not.toHaveBeenCalled();
  });
  it("suggests the next depth after an independent completion and repeats it after an assisted one", async () => {
    const up = await new GuruLearnerContextService(prisma([session(46, "basis", "INDEPENDENT")])).forLearner("L", "evs-class-5");
    expect(up.recommendedDepth).toBe("developing");
    expect(up.recommendationReason).toContain("completed independently");
    const same = await new GuruLearnerContextService(prisma([session(46, "proficient", "ASSISTED")])).forLearner("L", "evs-class-5");
    expect(same.recommendedDepth).toBe("proficient");
    expect(same.recommendationReason).toContain("needed help");
    const top = await new GuruLearnerContextService(prisma([session(46, "deep", "INDEPENDENT")])).forLearner("L", "evs-class-5");
    expect(top.recommendedDepth).toBe("deep");
  });
  it("collects prior pages, known concepts and recent misconceptions into a plain note", async () => {
    const db = prisma(
      [
        session(47, "basis", "INDEPENDENT", {
          events: [
            { result: { assessment: { misconception: "Banks give money away for free" } } },
            { result: { assessment: { misconception: "Banks give money away for free" } } },
            { result: { assessment: { misconception: null } } },
          ],
        }),
        session(46, "basis", "ASSISTED"),
        { ...session(48, "basis", null), completedAt: null },
      ],
      [{ concept: { canonicalName: "Community Helpers" } }, { concept: { canonicalName: "Photosynthesis" } }],
    );
    const ctx = await new GuruLearnerContextService(db).forLearner("L", "evs-class-5");
    expect(db.guruTeachingSession.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { learnerId: "L", artifact: { bookId: "evs-class-5" } } }));
    expect(ctx.priorPages.map((p) => p.physicalPage)).toEqual([47, 46]);
    expect(ctx.priorPages[0]).toMatchObject({ title: "Page 47 topic", lastOutcome: "INDEPENDENT", stageLabel: "partial" });
    expect(ctx.knownConcepts).toEqual(["Community Helpers", "Photosynthesis"]);
    expect(ctx.misconceptions).toEqual(["Banks give money away for free"]);
    expect(ctx.note).toContain("page 47 (Page 47 topic), page 46 (Page 46 topic)");
    expect(ctx.note).toContain("Ideas you have practised: Community Helpers, Photosynthesis.");
    expect(ctx.note).toContain("Worth watching today: Banks give money away for free");
  });
});
