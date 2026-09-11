import { BadRequestException } from "@nestjs/common";

/**
 * Educator review rubric for Guru page lessons.
 * Version the rubric; reviews always record the version they were scored against.
 */
export const GURU_RUBRIC_VERSION = 1;
export const SCORE_MIN = 0;
export const SCORE_MAX = 4;
/** A criterion at or above this score is acceptable. */
export const PASS_MIN = 3;

export interface RubricCriterion {
  id: string;
  title: string;
  question: string;
  weight: number;
  /** A gate criterion below PASS_MIN fails the whole lesson regardless of other scores. */
  gate?: boolean;
}

export const GURU_RUBRIC: RubricCriterion[] = [
  {
    id: "source_coverage",
    title: "Source coverage",
    question:
      "Does the lesson teach every instructional region of the page (headings, paragraphs, figures, tables, activities) without skipping or inventing sections?",
    weight: 1,
  },
  {
    id: "factual_accuracy",
    title: "Factual accuracy",
    question:
      "Are all explanations, examples and expected answers correct, and either supported by the page or clearly labelled as illustrative extensions?",
    weight: 1.5,
    gate: true,
  },
  {
    id: "visual_fidelity",
    title: "Visual fidelity",
    question:
      "Do the drawings and highlights correspond to the actual figures, tables and regions printed on the page?",
    weight: 1,
  },
  {
    id: "pedagogical_progression",
    title: "Pedagogical progression",
    question:
      "Does the lesson move from concrete experience to symbols, with scaffolding and reasoning demand that fit the selected depth?",
    weight: 1.25,
  },
  {
    id: "checkpoint_quality",
    title: "Checkpoint quality",
    question:
      "Do checkpoints assess understanding rather than recall, with a usable hint, a plausible misconception and a fair rubric?",
    weight: 1,
  },
  {
    id: "language_age_fit",
    title: "Language and age fit",
    question:
      "Are vocabulary, tone and length appropriate for the learner's age and the requested language?",
    weight: 1,
  },
  {
    id: "safety",
    title: "Safety and wellbeing",
    question:
      "Is the lesson free of unsafe advice, manipulation, shaming, or requests for personal information?",
    weight: 1,
    gate: true,
  },
];

export type RubricScores = Record<string, number>;
export type RubricVerdict = "PASS" | "REVISE" | "FAIL";

/** Every criterion must be present as an integer within range; extra keys are rejected. */
export function validateScores(raw: unknown): RubricScores {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new BadRequestException("Rubric scores must be an object");
  const scores: RubricScores = {};
  const ids = new Set(GURU_RUBRIC.map((c) => c.id));
  for (const key of Object.keys(raw as object))
    if (!ids.has(key))
      throw new BadRequestException("Unknown rubric criterion: " + key);
  for (const criterion of GURU_RUBRIC) {
    const value = (raw as any)[criterion.id];
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < SCORE_MIN ||
      value > SCORE_MAX
    )
      throw new BadRequestException(
        "Score for " +
          criterion.id +
          " must be an integer between " +
          SCORE_MIN +
          " and " +
          SCORE_MAX,
      );
    scores[criterion.id] = value;
  }
  return scores;
}

/** The strictest verdict the scores allow. A reviewer may be stricter, never more lenient. */
export function deriveVerdict(scores: RubricScores): RubricVerdict {
  for (const criterion of GURU_RUBRIC) {
    const value = scores[criterion.id];
    if (value === SCORE_MIN) return "FAIL";
    if (criterion.gate && value < PASS_MIN) return "FAIL";
  }
  return GURU_RUBRIC.every((c) => scores[c.id] >= PASS_MIN)
    ? "PASS"
    : "REVISE";
}

const ORDER: Record<RubricVerdict, number> = { FAIL: 0, REVISE: 1, PASS: 2 };
export function reconcileVerdict(
  requested: unknown,
  scores: RubricScores,
): RubricVerdict {
  const derived = deriveVerdict(scores);
  if (requested === undefined || requested === null) return derived;
  if (
    typeof requested !== "string" ||
    !["PASS", "REVISE", "FAIL"].includes(requested)
  )
    throw new BadRequestException("Verdict must be PASS, REVISE or FAIL");
  const wanted = requested as RubricVerdict;
  if (ORDER[wanted] > ORDER[derived])
    throw new BadRequestException(
      "Scores only support a verdict of " +
        derived +
        "; raise the criterion scores or keep the stricter verdict.",
    );
  return wanted;
}

/** Weighted mean normalised to 0..1. */
export function weightedScore(scores: RubricScores): number {
  let total = 0;
  let weight = 0;
  for (const criterion of GURU_RUBRIC) {
    total += (scores[criterion.id] / SCORE_MAX) * criterion.weight;
    weight += criterion.weight;
  }
  return weight ? Number((total / weight).toFixed(4)) : 0;
}
