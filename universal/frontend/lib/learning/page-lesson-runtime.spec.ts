import {
  PageEvidence,
  compilePageLesson,
  transition,
  initialRuntime,
  checkRecall,
} from "./page-lesson-runtime";
export const evidence: PageEvidence = {
  version: "page-evidence-v1",
  bookId: "maths-class-5",
  physicalPage: 46,
  totalPages: 96,
  sourceHash: "real-hash",
  width: 800,
  height: 1100,
  imageDataUrl: "data:image/png;base64,",
  status: "READY",
  omittedBlockCount: 0,
  blocks: [
    {
      blockId: "b1",
      physicalPageNumber: 46,
      text: "A triangle contains three sides.",
      type: "paragraph",
      confidence: 0.97,
      readingOrderIndex: 1,
      bbox: { x: 10, y: 20, width: 400, height: 50 },
    },
  ],
};
describe("page evidence to teaching actions", () => {
  it("teaches the supplied book and page, never the page-number demo", () => {
    const lesson = compilePageLesson(evidence, "basis");
    expect(JSON.stringify(lesson)).toContain("triangle");
    expect(JSON.stringify(lesson)).not.toMatch(/Police|Hospital|germination/);
    expect(lesson.id).toContain("maths-class-5:46");
  });
  it("changes identity on book, scan revision and depth changes", () => {
    const first = compilePageLesson(evidence, "basis");
    expect(
      compilePageLesson({ ...evidence, sourceHash: "new" }, "basis").id,
    ).not.toBe(first.id);
    expect(
      compilePageLesson({ ...evidence, bookId: "another" }, "basis").id,
    ).not.toBe(first.id);
    expect(compilePageLesson(evidence, "deep").id).not.toBe(first.id);
  });
  it("rejects unavailable and cross-page evidence", () => {
    expect(() =>
      compilePageLesson({ ...evidence, status: "NEEDS_REVIEW" }, "basis"),
    ).toThrow();
    expect(() =>
      compilePageLesson({ ...evidence, physicalPage: 47 }, "basis"),
    ).toThrow();
  });
  it("anchors every action to actual blocks", () => {
    for (const action of compilePageLesson(evidence, "basis").actions)
      expect(action.evidenceIds).toEqual(["b1"]);
  });
  it("only draws relationships stated in source", () => {
    const action = compilePageLesson(evidence, "basis").actions.find(
      (a) => a.kind === "draw",
    );
    expect(action?.relation).toEqual({
      from: "A triangle",
      label: "contains",
      to: "three sides",
    });
    const unrelated = {
      ...evidence,
      blocks: [
        { ...evidence.blocks[0], text: "Look carefully at the picture." },
      ],
    };
    expect(
      compilePageLesson(unrelated, "basis").actions.find(
        (a) => a.kind === "draw",
      )?.relation,
    ).toBeUndefined();
  });
  it("changes prompts and pacing across all five levels", () => {
    const levels = [
      "basis",
      "developing",
      "proficient",
      "advanced",
      "deep",
    ] as const;
    expect(
      new Set(
        levels.map(
          (d) =>
            compilePageLesson(evidence, d).actions.find((a) => a.kind === "ask")
              ?.prompt,
        ),
      ).size,
    ).toBe(5);
  });
  it("retains content beyond an arbitrary node cap", () => {
    const many = {
      ...evidence,
      blocks: Array.from({ length: 15 }, (_, i) => ({
        ...evidence.blocks[0],
        blockId: "b" + i,
        text: "Statement number " + i + ".",
        readingOrderIndex: i,
      })),
    };
    expect(compilePageLesson(many, "basis").notes).toHaveLength(15);
  });
});
describe("teaching runtime", () => {
  const lesson = compilePageLesson(evidence, "basis");
  const index = lesson.actions.findIndex((a) => a.kind === "ask");
  it("pauses at questions and disallows skipping unanswered checks", () => {
    const before = { ...initialRuntime, index: index - 1, playing: true };
    const state = transition(before, "next", lesson);
    expect(state.playing).toBe(false);
    // Stepping forward from a paused explanation resumes teaching on the next step.
    const explainIndex = lesson.actions.findIndex((a, i) => i > 0 && a.kind !== "ask" && a.kind !== "summary" && lesson.actions[i - 1].kind !== "ask");
    if (explainIndex > 0)
      expect(transition({ ...initialRuntime, index: explainIndex - 1, playing: false }, "next", lesson).playing).toBe(true);
    expect(transition(state, "next", lesson).index).toBe(index);
  });
  it("wrong response stays on source; correct response permits continuation", () => {
    const state = { ...initialRuntime, index };
    expect(
      transition(transition(state, "wrong", lesson), "next", lesson).index,
    ).toBe(index);
    expect(
      transition(transition(state, "correct", lesson), "next", lesson).index,
    ).toBe(index + 1);
  });
  it("restart clears answers and playback", () => {
    expect(
      transition(
        {
          ...initialRuntime,
          index,
          playing: true,
          feedback: "correct",
          attempts: 5,
        },
        "restart",
        lesson,
      ),
    ).toEqual(initialRuntime);
  });
  it("normalizes recall without pretending to grade free explanations", () => {
    expect(checkRecall(" TRIANGLE ", "triangle")).toBe(true);
    expect(checkRecall("three", "triangle")).toBe(false);
  });
});

it("does not join excerpts across an omitted OCR region",()=>{
 const first={...evidence.blocks[0],text:"Plants need",readingOrderIndex:1};
 const second={...first,blockId:"b3",text:"water",readingOrderIndex:3,bbox:{...first.bbox,y:75}};
 const lesson=compilePageLesson({...evidence,blocks:[first,second],omittedBlockCount:1},"basis");
 expect(lesson.notes).toEqual(["Plants need","water"]);
});
