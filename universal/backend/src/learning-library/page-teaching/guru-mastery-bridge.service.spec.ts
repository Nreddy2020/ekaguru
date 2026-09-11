import { GuruMasteryBridgeService } from "./guru-mastery-bridge.service";

const input = (overrides: any = {}) => ({
  sessionId: "session",
  requestId: "request-1",
  learnerId: "learner",
  artifact: {
    id: "artifact",
    bookId: "material",
    physicalPage: 3,
    sourceHash: "hash",
    depth: "proficient",
    language: "en",
  },
  action: { id: "action-2", evidenceIds: ["vision-0"] },
  assessment: {
    criteriaMet: [true, true],
    confidence: 0.9,
    passed: true,
    misconception: null,
  },
  response: "Light supplies the energy plants store as sugar.",
  ...overrides,
});

describe("GuruMasteryBridgeService", () => {
  const env = { ...process.env };
  let mapping: any;
  let evaluation: any;
  let mastery: any;
  let service: GuruMasteryBridgeService;
  beforeEach(() => {
    process.env = { ...env, GURU_MASTERY_BRIDGE: "enabled" };
    mapping = { verifiedConceptIds: jest.fn().mockResolvedValue(["c1", "c2"]) };
    evaluation = { isDepthApproved: jest.fn().mockResolvedValue(true) };
    mastery = { recordEvidence: jest.fn().mockResolvedValue({}) };
    service = new GuruMasteryBridgeService(mapping, evaluation, mastery);
  });
  afterAll(() => {
    process.env = { ...env };
  });

  it("is disabled unless the server explicitly enables it", async () => {
    process.env.GURU_MASTERY_BRIDGE = "";
    expect(await service.record(input())).toEqual({
      masteryUpdated: false,
      conceptIds: [],
      reason: "bridge-disabled",
    });
    expect(mapping.verifiedConceptIds).not.toHaveBeenCalled();
    expect(mastery.recordEvidence).not.toHaveBeenCalled();
  });
  it("requires a learner, a verified mapping and an approved evaluation corpus", async () => {
    expect((await service.record(input({ learnerId: null }))).reason).toBe(
      "no-learner",
    );
    mapping.verifiedConceptIds.mockResolvedValueOnce([]);
    expect((await service.record(input())).reason).toBe("no-verified-mapping");
    evaluation.isDepthApproved.mockResolvedValueOnce(false);
    expect((await service.record(input())).reason).toBe("evaluation-gate");
    expect(evaluation.isDepthApproved).toHaveBeenCalledWith("proficient", "en");
    expect(mastery.recordEvidence).not.toHaveBeenCalled();
  });
  it("records deterministic explanation evidence for every verified concept", async () => {
    const result = await service.record(input());
    expect(result).toEqual({
      masteryUpdated: true,
      conceptIds: ["c1", "c2"],
      reason: "recorded",
    });
    expect(mastery.recordEvidence).toHaveBeenCalledTimes(2);
    const first = mastery.recordEvidence.mock.calls[0][0];
    expect(first).toMatchObject({
      evidenceKey: GuruMasteryBridgeService.evidenceKey("session", "request-1", "c1"),
      learnerId: "learner",
      conceptId: "c1",
      rawScore: 0.9,
      evidenceType: "EXPLANATION",
      outcome: "CORRECT",
      sourceReference: expect.objectContaining({
        kind: "GURU_PAGE_CHECKPOINT",
        artifactId: "artifact",
        sourceHash: "hash",
        actionId: "action-2",
      }),
    });
    expect(mastery.recordEvidence.mock.calls[1][0].evidenceKey).not.toBe(
      first.evidenceKey,
    );
    expect(
      GuruMasteryBridgeService.evidenceKey("session", "request-1", "c1"),
    ).toBe(first.evidenceKey);
  });
  it("scores partial answers proportionally and never as correct", async () => {
    await service.record(
      input({
        assessment: {
          criteriaMet: [true, false],
          confidence: 0.85,
          passed: false,
          misconception: "Plants eat soil.",
        },
      }),
    );
    const call = mastery.recordEvidence.mock.calls[0][0];
    expect(call.rawScore).toBeCloseTo(0.425);
    expect(call.outcome).toBe("INCORRECT");
    expect(call.misconception).toBe("Plants eat soil.");
    mastery.recordEvidence.mockClear();
    await service.record(
      input({
        assessment: {
          criteriaMet: [true, true, false],
          confidence: 0.9,
          passed: false,
          misconception: null,
        },
      }),
    );
    expect(mastery.recordEvidence.mock.calls[0][0].outcome).toBe("PARTIAL");
  });
  it("keeps checkpoint progress when the ledger write fails", async () => {
    mastery.recordEvidence.mockRejectedValueOnce(new Error("db down"));
    const result = await service.record(input());
    expect(result).toEqual({
      masteryUpdated: false,
      conceptIds: [],
      reason: "ledger-error",
    });
  });
});
