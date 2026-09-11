import {
  GURU_PHASES,
  LESSON_BLUEPRINTS,
  NON_GATING_PHASES,
  PHASE_LABELS,
  pedagogyPromptSection,
  validatePedagogy,
} from "./guru-pedagogy";

const seq = (...items: [string, string][]) => items.map(([phase, kind], index) => ({ phase, kind, index }));
const basisLesson = () =>
  seq(
    ["hook", "write"],
    ["prior", "ask"],
    ["explain", "explain"],
    ["explain", "draw"],
    ["model", "explain"],
    ["guided", "ask"],
    ["independent", "ask"],
    ["summary", "summary"],
  );

describe("teaching methodology blueprint", () => {
  it("names every phase for the board and covers all depths", () => {
    for (const phase of GURU_PHASES) expect(PHASE_LABELS[phase]).toBeTruthy();
    for (const depth of ["basis", "developing", "proficient", "advanced", "deep"] as const) {
      expect(LESSON_BLUEPRINTS[depth].required[0]).toBe("hook");
      expect(LESSON_BLUEPRINTS[depth].required.at(-1)).toBe("summary");
      expect(LESSON_BLUEPRINTS[depth].required).toEqual(expect.arrayContaining(["prior", "model", "independent"]));
    }
    expect(LESSON_BLUEPRINTS.deep.required).toEqual(expect.arrayContaining(["misconception", "transfer", "reflection"]));
    expect(NON_GATING_PHASES).toEqual(["prior", "reflection"]);
  });
  it("tells the planner the teaching layers, gradual release and the depth's cognitive demand", () => {
    const text = pedagogyPromptSection("deep");
    expect(text).toContain("Experience -> Intuition -> Story -> Visual");
    expect(text).toContain("Symbol (formulas or notation, always last)");
    expect(text).toContain("(I do)");
    expect(text).toContain("(we do)");
    expect(text).toContain("(you do)");
    expect(text).toContain("first-principles inquiry");
    expect(pedagogyPromptSection("basis")).toContain("no formula before the idea is felt");
  });
  it("accepts a well-formed basis lesson", () => {
    expect(validatePedagogy(basisLesson(), "basis")).toEqual([]);
  });
  it("names missing phases, wrong kinds and ordering mistakes", () => {
    const missing = basisLesson().filter((a) => a.phase !== "prior");
    expect(validatePedagogy(missing, "basis").map((i) => i.message)).toEqual(["missing required phase 'prior' (What you already know)"]);
    const wrongKind = basisLesson();
    wrongKind[1] = { phase: "prior", kind: "write", index: 1 };
    expect(validatePedagogy(wrongKind, "basis")[0].message).toContain("cannot use kind write");
    const noPhase = basisLesson();
    delete (noPhase[3] as any).phase;
    expect(validatePedagogy(noPhase, "basis")[0].message).toContain("no valid phase");
    const disordered = seq(
      ["hook", "write"],
      ["model", "explain"],
      ["prior", "ask"],
      ["explain", "explain"],
      ["independent", "ask"],
      ["explain", "draw"],
      ["guided", "ask"],
      ["summary", "summary"],
    );
    const messages = validatePedagogy(disordered, "basis").map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        "activate prior knowledge before the worked example",
        "explain the concept before the worked example",
        "draw the visual before the independent checkpoint",
        "guided practice comes before the independent checkpoint",
      ]),
    );
    const noSummaryLast = [...basisLesson(), { phase: "explain", kind: "explain", index: 8 }];
    expect(validatePedagogy(noSummaryLast, "basis").map((i) => i.message)).toContain("the last action must be the summary");
  });
  it("requires misconception, transfer and reflection as depth rises", () => {
    const messages = validatePedagogy(basisLesson(), "deep").map((i) => i.message);
    expect(messages).toEqual([
      "missing required phase 'misconception' (Common mistake)",
      "missing required phase 'transfer' (Use it somewhere new)",
      "missing required phase 'reflection' (Reflect and teach back)",
    ]);
    const deep = seq(
      ["hook", "write"],
      ["prior", "ask"],
      ["explain", "explain"],
      ["explain", "draw"],
      ["model", "explain"],
      ["misconception", "explain"],
      ["guided", "ask"],
      ["independent", "ask"],
      ["transfer", "ask"],
      ["reflection", "ask"],
      ["summary", "summary"],
    );
    expect(validatePedagogy(deep, "deep")).toEqual([]);
  });
});
