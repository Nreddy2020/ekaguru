import {
  GuruConceptMappingService,
  jaccard,
  tokens,
} from "./guru-concept-mapping.service";

describe("concept name matching", () => {
  it("tokenises across scripts and drops stop words", () => {
    expect([...tokens("How do Plants make Food?")]).toEqual([
      "plants",
      "make",
      "food",
    ]);
    expect(tokens("पौधे भोजन बनाते हैं").size).toBe(4);
  });
  it("computes Jaccard overlap", () => {
    expect(jaccard(tokens("Photosynthesis in plants"), tokens("plants"))).toBeCloseTo(
      0.5,
    );
    expect(jaccard(new Set(), tokens("plants"))).toBe(0);
  });
});

function prisma(overrides: any = {}) {
  const upsert = jest.fn(async ({ create }: any) => create);
  return {
    upsert,
    guruLessonArtifact: {
      findUnique: jest.fn(async () => ({
        id: "artifact",
        bookId: "material-1",
        physicalPage: 2,
        payload: {
          plan: { objectives: ["Explain how plants make food with sunlight"] },
        },
      })),
    },
    conceptChunk: {
      findMany: jest
        .fn()
        .mockResolvedValueOnce([
          {
            conceptId: "c1",
            relevance: 0.9,
            confidence: 0.8,
            concept: { canonicalName: "Photosynthesis", status: "ACTIVE" },
          },
          {
            conceptId: "c3",
            relevance: 1,
            confidence: 1,
            concept: { canonicalName: "Retired", status: "DEPRECATED" },
          },
        ])
        .mockResolvedValueOnce([
          {
            conceptId: "c2",
            concept: { canonicalName: "Plants make food", status: "ACTIVE" },
          },
          {
            conceptId: "c1",
            concept: { canonicalName: "Photosynthesis", status: "ACTIVE" },
          },
          {
            conceptId: "c4",
            concept: { canonicalName: "Volcanoes", status: "ACTIVE" },
          },
        ]),
    },
    guruConceptMapping: {
      findUnique: jest.fn(async ({ where }: any) =>
        where.artifactId_conceptId.conceptId === "c1"
          ? { status: "REJECTED" }
          : null,
      ),
      upsert,
      findMany: jest.fn(async () => [{ conceptId: "c2" }]),
      update: jest.fn(async ({ data }: any) => ({ id: "m1", ...data })),
    },
    concept: { findUnique: jest.fn(async () => ({ id: "c9" })) },
    ...overrides,
  };
}

describe("GuruConceptMappingService", () => {
  it("proposes page-range and objective-name links without touching human decisions", async () => {
    const db = prisma();
    const service = new GuruConceptMappingService(db as any);
    const proposals = await service.proposeFor("artifact");
    expect(proposals.map((p) => p.conceptId)).toEqual(["c1", "c2"]);
    expect(proposals[0]).toMatchObject({ method: "CHUNK_PAGE_RANGE", score: 0.72 });
    expect(proposals[1].method).toBe("OBJECTIVE_NAME");
    // c1 was REJECTED by a curator: proposals never overwrite it.
    expect(db.upsert).toHaveBeenCalledTimes(1);
    expect(db.upsert.mock.calls[0][0].create).toMatchObject({
      artifactId: "artifact",
      conceptId: "c2",
      method: "OBJECTIVE_NAME",
    });
    // deprecated concept and unrelated objective are ignored
    expect(proposals.some((p) => p.conceptId === "c3" || p.conceptId === "c4")).toBe(false);
  });
  it("fails clearly for an unknown lesson", async () => {
    const db = prisma({
      guruLessonArtifact: { findUnique: jest.fn(async () => null) },
    });
    await expect(
      new GuruConceptMappingService(db as any).proposeFor("missing"),
    ).rejects.toThrow("Lesson unavailable");
  });
  it("only lets ADMIN curators verify, reject or add mappings", async () => {
    const db = prisma({
      guruConceptMapping: {
        findUnique: jest.fn(async () => ({ id: "m1", rationale: "old" })),
        update: jest.fn(async ({ data }: any) => ({ id: "m1", ...data })),
        upsert: jest.fn(async ({ create }: any) => create),
        findMany: jest.fn(async () => []),
      },
    });
    const service = new GuruConceptMappingService(db as any);
    await expect(
      service.review("m1", "VERIFIED", { userId: "p", role: "PARENT" }),
    ).rejects.toThrow("Only curators");
    await expect(
      service.addManual("artifact", "c9", { userId: "p", role: "PARENT" }, ""),
    ).rejects.toThrow("Only curators");
    const reviewed = await service.review(
      "m1",
      "VERIFIED",
      { userId: "admin", role: "ADMIN" },
      "Matches chapter concept",
    );
    expect(reviewed).toMatchObject({
      status: "VERIFIED",
      reviewedBy: "admin",
      rationale: "Matches chapter concept",
    });
    const manual = await service.addManual(
      "artifact",
      "c9",
      { userId: "admin", role: "ADMIN" },
      "",
    );
    expect(manual).toMatchObject({
      method: "MANUAL",
      status: "VERIFIED",
      score: 1,
      rationale: "Manual curator link",
    });
    await expect(
      service.review("m1", "BOGUS" as any, { userId: "admin", role: "ADMIN" }),
    ).rejects.toThrow("Unknown mapping status");
  });
  it("lists only verified concept IDs for the bridge", async () => {
    const service = new GuruConceptMappingService(prisma() as any);
    expect(await service.verifiedConceptIds("artifact")).toEqual(["c2"]);
  });
});
