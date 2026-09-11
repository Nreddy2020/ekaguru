import { BadRequestException } from "@nestjs/common";
import { NON_GATING_PHASES, validatePedagogy } from "./guru-pedagogy";

export const DEPTHS = [
  "basis",
  "developing",
  "proficient",
  "advanced",
  "deep",
] as const;
export type Depth = (typeof DEPTHS)[number];
export interface ScenePrimitive {
  id: string;
  type: "line" | "rect" | "circle" | "text";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  x2?: number;
  y2?: number;
  text?: string;
  color: "white" | "yellow" | "green" | "blue";
}
export interface GuruAction {
  id: string;
  kind: "write" | "draw" | "explain" | "ask" | "summary";
  /** Teaching phase from the lesson blueprint (guru-pedagogy.ts). */
  phase: string;
  /** Asks that invite thinking without grading or blocking progression (prior knowledge, reflection). */
  gating?: boolean;
  /** What Guru says after an ungraded ask, before moving on. */
  acknowledgement?: string;
  text: string;
  speech: string;
  evidenceIds: string[];
  durationMs: number;
  scene?: ScenePrimitive[];
  prompt?: string;
  rubric?: {
    expected: string;
    criteria: string[];
    hint: string;
    misconception: string;
  };
}
export interface GuruPlan {
  id: string;
  title: string;
  depth: Depth;
  language: string;
  mode: "guru";
  sourceHash: string;
  actions: GuruAction[];
  notes: string[];
  objectives: string[];
  coverage: string[];
  /** Blocks deliberately not taught, each with the model's stated reason; capped and reviewer-visible. */
  omitted: { evidenceId: string; reason: string }[];
}

/** Evidence IDs a raw plan neither teaches nor explicitly omits. */
export function uncoveredEvidence(raw: unknown, evidenceIds: Set<string>): string[] {
  const plan: any = raw && typeof raw === "object" ? raw : {};
  const seen = new Set<string>();
  for (const action of Array.isArray(plan.actions) ? plan.actions : [])
    for (const id of Array.isArray(action?.evidenceIds) ? action.evidenceIds : [])
      if (typeof id === "string") seen.add(id);
  for (const entry of Array.isArray(plan.omitted) ? plan.omitted : [])
    if (typeof entry?.evidenceId === "string") seen.add(entry.evidenceId);
  return [...evidenceIds].filter((id) => !seen.has(id));
}

const invalid = (message: string): never => {
  throw new BadRequestException("Invalid Guru plan: " + message);
};
function object(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid("expected object");
  return value as Record<string, any>;
}
function text(value: unknown, max = 2000, label = "text"): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    return invalid("invalid " + label + (typeof value === "string" ? " (length " + value.length + ", max " + max + ")" : " (missing)"));
  return value.trim();
}
function list(value: unknown, max = 80, label = "list"): unknown[] {
  if (!Array.isArray(value) || !value.length || value.length > max)
    return invalid("invalid " + label + (Array.isArray(value) ? " (length " + value.length + ", max " + max + ")" : " (missing)"));
  return value;
}
/**
 * Scene values are clamped into the 1000 by 1000 canvas. Slight overshoots from a model
 * are harmless once clamped; missing or non-numeric values are real errors and are named.
 */
function coordinate(value: unknown, label = "scene coordinate"): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    return invalid("invalid " + label + " (" + (value === null || value === undefined ? "missing" : String(value)) + ")");
  return Math.min(1000, Math.max(0, Math.round(value * 100) / 100));
}

/** Whitelist the complete executable scene. Extra model fields never reach the renderer. */
export function validateGuruPlan(
  raw: unknown,
  evidenceIds: Set<string>,
  depth: Depth,
  language: string,
  sourceHash: string,
): GuruPlan {
  const plan = object(raw);
  const actions: GuruAction[] = list(plan.actions, 100, "actions").map((entry, index) => {
    const a = object(entry);
    if (!["write", "draw", "explain", "ask", "summary"].includes(a.kind))
      return invalid("unknown action");
    const anchors = list(a.evidenceIds, 100, "evidenceIds of action " + index + " (" + a.kind + ")").map((id) => text(id, 200, "evidence id"));
    if (anchors.some((id) => !evidenceIds.has(id)))
      return invalid("unknown evidence anchor");
    const phase = typeof a.phase === "string" ? a.phase.trim().toLowerCase() : "";
    const action: GuruAction = {
      id: "action-" + index,
      kind: a.kind,
      phase,
      text: text(a.text, 2000, "text of action " + index),
      speech: text(a.speech, 4000, "speech of action " + index),
      evidenceIds: anchors,
      durationMs: 0,
    };
    action.durationMs = Math.max(
      1800,
      action.speech.split(/\s+/).length * (depth === "basis" ? 600 : 450),
    );
    if (a.kind === "draw") {
      action.scene = list(a.scene, 40, "scene of action " + index).map((entry, i) => {
        const s = object(entry);
        if (!["line", "rect", "circle", "text"].includes(s.type))
          return invalid("unknown primitive");
        const where = "shape " + i + " (" + s.type + ") of action " + index;
        const shape: ScenePrimitive = {
          id: "shape-" + i,
          type: s.type,
          x: coordinate(s.x, "x of " + where),
          y: coordinate(s.y, "y of " + where),
          color: ["white", "yellow", "green", "blue"].includes(s.color)
            ? s.color
            : "white",
        };
        if (s.type === "line") {
          shape.x2 = coordinate(s.x2, "x2 of " + where);
          shape.y2 = coordinate(s.y2, "y2 of " + where);
        }
        if (s.type === "rect") {
          // Clamp the far edge into the canvas; a zero-size rectangle is an error.
          shape.width = Math.min(coordinate(s.width, "width of " + where), 1000 - shape.x);
          shape.height = Math.min(coordinate(s.height, "height of " + where), 1000 - shape.y);
          if (shape.width <= 0 || shape.height <= 0)
            return invalid("rectangle outside scene in " + where);
        }
        if (s.type === "circle") {
          shape.radius = Math.min(
            coordinate(s.radius, "radius of " + where),
            shape.x,
            shape.y,
            1000 - shape.x,
            1000 - shape.y,
          );
          if (shape.radius <= 0) return invalid("circle outside scene in " + where);
        }
        if (s.type === "text") shape.text = text(s.text, 120, "scene label of action " + index);
        return shape;
      });
    }
    if (a.kind === "ask") {
      action.prompt = text(a.prompt || a.text, 2000, "prompt of action " + index);
      if ((NON_GATING_PHASES as readonly string[]).includes(phase)) {
        // Prior-knowledge and reflection asks are heard and acknowledged, never graded.
        action.gating = false;
        action.acknowledgement =
          typeof a.acknowledgement === "string" && a.acknowledgement.trim()
            ? text(a.acknowledgement, 1000, "acknowledgement of action " + index)
            : "Thank you for sharing that. Keep it in mind as we work through the page together.";
      } else {
        action.gating = true;
        const rubric = object(a.rubric);
        action.rubric = {
          expected: text(rubric.expected, 2000, "rubric.expected of action " + index),
          criteria: list(rubric.criteria, 8, "rubric.criteria of action " + index).map((c) => text(c, 500, "rubric criterion")),
          hint: text(rubric.hint, 2000, "rubric.hint of action " + index),
          misconception: text(rubric.misconception, 2000, "rubric.misconception of action " + index),
        };
      }
    }
    return action;
  });
  const pedagogy = validatePedagogy(
    actions.map((a, index) => ({ phase: a.phase, kind: a.kind, index })),
    depth,
  );
  if (pedagogy.length)
    return invalid("teaching blueprint: " + pedagogy.map((i) => i.message).join("; "));
  const coverage = [...new Set(actions.flatMap((a) => a.evidenceIds))];
  // Omissions must be explicit, justified, few, and never overlap taught blocks.
  const omitted = (Array.isArray(plan.omitted) ? plan.omitted : []).map(
    (entry: unknown) => {
      const o = object(entry);
      const evidenceId = text(o.evidenceId, 200);
      if (!evidenceIds.has(evidenceId)) return invalid("unknown omitted evidence");
      if (coverage.includes(evidenceId)) return invalid("omitted block is also taught");
      return { evidenceId, reason: text(o.reason, 300) };
    },
  );
  if (new Set(omitted.map((o) => o.evidenceId)).size !== omitted.length)
    return invalid("duplicate omission");
  if (omitted.length > Math.max(2, Math.floor(evidenceIds.size * 0.25)))
    return invalid("too many omitted blocks");
  // Source coverage is explicit; a generator cannot silently drop part of a page.
  const missing = [...evidenceIds].filter(
    (id) => !coverage.includes(id) && !omitted.some((o) => o.evidenceId === id),
  );
  if (missing.length)
    return invalid("incomplete page coverage: " + missing.slice(0, 12).join(", "));
  return {
    id: "",
    title: text(plan.title, 200, "title"),
    depth,
    language,
    mode: "guru",
    sourceHash,
    actions,
    notes: list(plan.notes, 80, "notes").map((n) => text(n, 2000, "note")),
    objectives: list(plan.objectives, 8, "objectives").map((n) => text(n, 2000, "objective")),
    coverage,
    omitted,
  };
}

/**
 * Provider structured-output schema for the plan call (Gemini responseSchema / OpenAPI subset).
 * It guarantees shape only; validateGuruPlan remains the authority on content rules.
 */
const STR = { type: "STRING" };
const NUM = { type: "NUMBER" };
export const GURU_PLAN_RESPONSE_SCHEMA: any = {
  type: "OBJECT",
  properties: {
    title: STR,
    objectives: { type: "ARRAY", items: STR },
    notes: { type: "ARRAY", items: STR },
    omitted: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { evidenceId: STR, reason: STR },
        required: ["evidenceId", "reason"],
      },
    },
    actions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          kind: { type: "STRING", description: "write | draw | explain | ask | summary" },
          phase: { type: "STRING", description: "hook | prior | explain | model | guided | independent | misconception | transfer | reflection | summary" },
          acknowledgement: { type: "STRING", nullable: true, description: "for prior and reflection asks only" },
          text: STR,
          speech: STR,
          evidenceIds: { type: "ARRAY", items: STR },
          scene: {
            type: "ARRAY",
            nullable: true,
            items: {
              type: "OBJECT",
              properties: {
                type: { type: "STRING", description: "line | rect | circle | text" },
                x: NUM,
                y: NUM,
                x2: { type: "NUMBER", nullable: true },
                y2: { type: "NUMBER", nullable: true },
                width: { type: "NUMBER", nullable: true },
                height: { type: "NUMBER", nullable: true },
                radius: { type: "NUMBER", nullable: true },
                text: { type: "STRING", nullable: true },
                color: { type: "STRING", description: "white | yellow | green | blue" },
              },
              required: ["type", "x", "y", "x2", "y2", "width", "height", "radius", "text", "color"],
            },
          },
          prompt: { type: "STRING", nullable: true },
          rubric: {
            type: "OBJECT",
            nullable: true,
            properties: {
              expected: STR,
              criteria: { type: "ARRAY", items: STR },
              hint: STR,
              misconception: STR,
            },
            required: ["expected", "criteria", "hint", "misconception"],
          },
        },
        required: ["kind", "phase", "acknowledgement", "text", "speech", "evidenceIds", "scene", "prompt", "rubric"],
      },
    },
  },
  required: ["title", "objectives", "notes", "actions", "omitted"],
};

/** Structured-output shape for checkpoint grading. Content rules stay in GuruSessionService. */
export const GURU_JUDGEMENT_RESPONSE_SCHEMA: any = {
  type: "OBJECT",
  properties: {
    criteriaMet: { type: "ARRAY", items: { type: "BOOLEAN" }, description: "One boolean per rubric criterion, in order" },
    confidence: { type: "NUMBER", description: "0 to 1" },
    feedback: { type: "STRING" },
    misconception: { type: "STRING", nullable: true },
  },
  required: ["criteriaMet", "confidence", "feedback", "misconception"],
};
/** Structured-output shape for page-grounded question answers. */
export const GURU_ANSWER_RESPONSE_SCHEMA: any = {
  type: "OBJECT",
  properties: {
    answer: { type: "STRING" },
    evidenceIds: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["answer", "evidenceIds"],
};
