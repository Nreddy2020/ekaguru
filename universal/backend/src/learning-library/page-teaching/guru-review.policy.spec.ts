import { classifyRun, nextReviewDate, nextStage, stageLabel } from "./guru-review.policy";

describe("spaced review policy", () => {
  it("labels stages and clamps out-of-range values", () => {
    expect([0, 1, 2, 3].map(stageLabel)).toEqual(["introduced", "partial", "understood", "retained"]);
    expect(stageLabel(-1)).toBe("introduced");
    expect(stageLabel(9)).toBe("retained");
  });
  it("classifies a run as independent only when no help was used", () => {
    expect(classifyRun([])).toEqual({ outcome: "INDEPENDENT", passed: 0, assisted: 0 });
    expect(
      classifyRun([
        { result: { kind: "answer", assessment: { kind: "PAGE_EXPLANATION", passed: true } } },
        { result: { kind: "answer", assessment: { kind: "PAGE_EXPLANATION", passed: false } } },
        { result: { kind: "next" } },
      ]),
    ).toEqual({ outcome: "INDEPENDENT", passed: 1, assisted: 0 });
    expect(classifyRun([{ result: { assessment: { kind: "ASSISTED_PRACTICE" } } }])).toEqual({ outcome: "ASSISTED", passed: 0, assisted: 1 });
  });
  it("moves stages up on independent runs and down on assisted ones, within bounds", () => {
    expect(nextStage(0, true, "INDEPENDENT")).toBe(1);
    expect(nextStage(0, true, "ASSISTED")).toBe(0);
    expect(nextStage(1, false, "INDEPENDENT")).toBe(2);
    expect(nextStage(3, false, "INDEPENDENT")).toBe(3);
    expect(nextStage(2, false, "ASSISTED")).toBe(1);
    expect(nextStage(0, false, "ASSISTED")).toBe(0);
  });
  it("uses the product intervals of 1, 2, 7 and 21 days", () => {
    const from = new Date("2026-09-11T00:00:00Z");
    expect([0, 1, 2, 3].map((s) => (nextReviewDate(s, from).getTime() - from.getTime()) / 86400000)).toEqual([1, 2, 7, 21]);
  });
});
