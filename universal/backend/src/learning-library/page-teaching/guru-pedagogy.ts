/**
 * Teaching methodology for a Guru page lesson.
 *
 * A lesson follows how a good teacher takes a class through a textbook page, not a
 * read-aloud with a quiz at the end. The blueprint is data so it can be shown to the
 * model, enforced by the validator, displayed on the board, and revised by educators.
 *
 * Concept introduction follows the product's teaching layers in order:
 * Experience, Intuition, Story, Visual, Language, Symbol (formulas last).
 * Practice follows gradual release: I do (worked example), We do (guided), You do (independent).
 */
import { Depth } from "./guru-plan.schema";

export const GURU_PHASES = [
  "hook",
  "prior",
  "explain",
  "model",
  "guided",
  "independent",
  "misconception",
  "transfer",
  "reflection",
  "summary",
] as const;
export type GuruPhase = (typeof GURU_PHASES)[number];

export const PHASE_LABELS: Record<GuruPhase, string> = {
  hook: "Why this matters",
  prior: "What you already know",
  explain: "Teacher explains",
  model: "Worked example (I do)",
  guided: "Guided practice (we do)",
  independent: "Your turn (you do)",
  misconception: "Common mistake",
  transfer: "Use it somewhere new",
  reflection: "Reflect and teach back",
  summary: "Summary and notes",
};

/** Which action kinds a phase may use. */
export const PHASE_KINDS: Record<GuruPhase, readonly string[]> = {
  hook: ["write", "explain"],
  prior: ["ask"],
  explain: ["write", "draw", "explain"],
  model: ["write", "draw", "explain"],
  guided: ["ask"],
  independent: ["ask"],
  misconception: ["explain", "ask", "draw"],
  transfer: ["ask", "explain"],
  reflection: ["ask"],
  summary: ["summary"],
};

/** Asks in these phases invite thinking but never block progression or grade the learner. */
export const NON_GATING_PHASES: readonly GuruPhase[] = ["prior", "reflection"];

export interface LessonBlueprint {
  required: GuruPhase[];
  /** Cognitive demand the checkpoints must carry at this depth. */
  demand: string;
  /** How the concept introduction should feel at this depth. */
  introduction: string;
}

export const LESSON_BLUEPRINTS: Record<Depth, LessonBlueprint> = {
  basis: {
    required: ["hook", "prior", "explain", "model", "guided", "independent", "summary"],
    demand:
      "Checkpoints ask the learner to recognise, name and describe with the page's words and one concrete example of their own.",
    introduction:
      "Start from a concrete experience the learner has had, ask an intuition question, tell a short story or scenario, draw the picture, only then introduce the textbook terms; no formula before the idea is felt.",
  },
  developing: {
    required: ["hook", "prior", "explain", "model", "guided", "independent", "misconception", "summary"],
    demand:
      "Checkpoints ask the learner to connect two ideas on the page and explain how one leads to the other, in their own words.",
    introduction:
      "Experience, intuition question, story, drawing, then terms; make the causal links between parts of the page explicit, and name the common wrong idea.",
  },
  proficient: {
    required: ["hook", "prior", "explain", "model", "guided", "independent", "misconception", "transfer", "summary"],
    demand:
      "Checkpoints ask the learner to apply the idea to a situation not on the page and justify each step with page evidence.",
    introduction:
      "Brief experience and intuition, then a precise explanation with a drawing and terms; the worked example shows every step and the reason for it.",
  },
  advanced: {
    required: ["hook", "prior", "explain", "model", "guided", "independent", "misconception", "transfer", "reflection", "summary"],
    demand:
      "Checkpoints ask the learner to analyse: what evidence on the page supports the claim, what assumptions it rests on, and what would change if an assumption failed.",
    introduction:
      "Open with the question the page answers, expose the reasoning chain, draw the mechanism, and use terms precisely; examples should include a counter-case.",
  },
  deep: {
    required: ["hook", "prior", "explain", "model", "guided", "independent", "misconception", "transfer", "reflection", "summary"],
    demand:
      "Checkpoints demand first-principles inquiry: derive or reconstruct the idea, evaluate the page's evidence, propose an investigation that could test it, and connect it to another discipline. A question that only asks for recall is not acceptable at this depth.",
    introduction:
      "Begin from the underlying principle and its history or origin, let the learner reconstruct the idea from a minimal set of facts, then reconcile it with the textbook wording; drawings show mechanism, not decoration.",
  },
};

/** The methodology as instructions for the planner, for one depth. */
export function pedagogyPromptSection(depth: Depth): string {
  const b = LESSON_BLUEPRINTS[depth];
  return [
    "TEACHING METHODOLOGY. Teach this page the way an excellent classroom teacher would, in phases. Every action carries a phase from: " +
      GURU_PHASES.join(", ") + ".",
    "Required phases at depth '" + depth + "', in this order: " + b.required.join(" -> ") + ". Optional phases may be added where they help.",
    "hook: one action that says why this page matters to the learner's life, with a concrete situation. prior: one ask that activates what the learner already knows (it is not graded; give an acknowledgement sentence in acknowledgement). explain: introduce the concept using the layers Experience -> Intuition -> Story -> Visual (a draw action) -> Language (the page's terms) -> Symbol (formulas or notation, always last). " + b.introduction,
    "model: a worked example labelled 'Example' that shows every step and the reason for each step (I do). guided: an ask where the hint walks the learner through the same steps on a new case (we do). independent: an ask the learner must answer alone, graded by the rubric (you do). misconception: name the most likely wrong idea about this page and refute it with a counter-example. transfer: an ask that applies the idea to a situation not on the page. reflection: an ungraded ask for the learner to explain the idea in their own words or to say what they would investigate next (teach-back). summary: the last action, restating the key ideas in the page's words.",
    "Cognitive demand at this depth: " + b.demand,
    "Examples must build on knowledge a learner at this depth already has; say what prior idea each example rests on. Label invented examples as examples, never as quotations from the page. Never claim mastery.",
  ].join("\n");
}

export interface PedagogyIssue {
  message: string;
}

/**
 * Structural enforcement of the blueprint. Semantic quality (is the example really a
 * worked example?) is for educators; this guarantees the phases exist, use permitted
 * kinds, and follow the teacher's order.
 */
export function validatePedagogy(
  actions: { phase?: string; kind: string; index: number }[],
  depth: Depth,
): PedagogyIssue[] {
  const issues: PedagogyIssue[] = [];
  const b = LESSON_BLUEPRINTS[depth];
  const phases = actions.map((a) => a.phase);
  for (const a of actions) {
    if (!a.phase || !(GURU_PHASES as readonly string[]).includes(a.phase)) {
      issues.push({ message: "action " + a.index + " has no valid phase" });
      continue;
    }
    const allowed = PHASE_KINDS[a.phase as GuruPhase];
    if (!allowed.includes(a.kind))
      issues.push({ message: "action " + a.index + " (" + a.phase + ") cannot use kind " + a.kind + "; use " + allowed.join(" or ") });
  }
  if (issues.length) return issues;
  for (const phase of b.required)
    if (!phases.includes(phase)) issues.push({ message: "missing required phase '" + phase + "' (" + PHASE_LABELS[phase] + ")" });
  if (issues.length) return issues;
  const first = (phase: GuruPhase) => phases.indexOf(phase);
  const last = (phase: GuruPhase) => phases.lastIndexOf(phase);
  if (phases[0] !== "hook") issues.push({ message: "the first action must be the hook" });
  if (phases[phases.length - 1] !== "summary" || actions[actions.length - 1].kind !== "summary")
    issues.push({ message: "the last action must be the summary" });
  if (phases.filter((p) => p === "summary").length !== 1) issues.push({ message: "exactly one summary action" });
  if (first("prior") > first("model")) issues.push({ message: "activate prior knowledge before the worked example" });
  if (first("explain") > first("model")) issues.push({ message: "explain the concept before the worked example" });
  const firstDraw = actions.findIndex((a) => a.kind === "draw");
  if (firstDraw === -1 || firstDraw > first("independent"))
    issues.push({ message: "draw the visual before the independent checkpoint" });
  if (first("guided") !== -1 && first("guided") < last("model"))
    issues.push({ message: "guided practice comes after the worked example" });
  if (first("independent") < last("model")) issues.push({ message: "the independent checkpoint comes after the worked example" });
  if (first("guided") !== -1 && first("independent") < first("guided"))
    issues.push({ message: "guided practice comes before the independent checkpoint" });
  if (first("transfer") !== -1 && first("transfer") < first("independent"))
    issues.push({ message: "transfer comes after the independent checkpoint" });
  if (first("reflection") !== -1 && first("reflection") < first("independent"))
    issues.push({ message: "reflection comes after the independent checkpoint" });
  if (first("misconception") !== -1 && first("misconception") < first("model"))
    issues.push({ message: "address the misconception after the worked example" });
  return issues;
}
