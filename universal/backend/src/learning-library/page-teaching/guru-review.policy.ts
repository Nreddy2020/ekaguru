/**
 * Spaced review of practised pages. This is page practice scheduling, deliberately separate
 * from canonical concept mastery: it never claims mastery, it decides when a page is worth
 * revisiting. Intervals follow the product requirement: introduced +1 day, partial +2 days,
 * understood +7 days, retained +21 days.
 */
export const REVIEW_STAGES = ["introduced", "partial", "understood", "retained"] as const;
export type ReviewStageLabel = (typeof REVIEW_STAGES)[number];
export const REVIEW_INTERVAL_DAYS = [1, 2, 7, 21] as const;
export type RunOutcome = "INDEPENDENT" | "ASSISTED";

export function stageLabel(stage: number): ReviewStageLabel {
  return REVIEW_STAGES[Math.min(REVIEW_STAGES.length - 1, Math.max(0, stage))];
}

/** Outcome of one complete pass through a lesson, from the ledger events of that run. */
export function classifyRun(events: { result: any }[]): { outcome: RunOutcome; passed: number; assisted: number } {
  let passed = 0;
  let assisted = 0;
  for (const event of events) {
    const result: any = event.result || {};
    const kind = result.kind || result.assessment?.kind;
    if (kind === "help" || result.assessment?.kind === "ASSISTED_PRACTICE") assisted++;
    else if ((kind === "answer" || result.assessment?.kind === "PAGE_EXPLANATION") && result.assessment?.passed) passed++;
  }
  return { outcome: assisted === 0 ? "INDEPENDENT" : "ASSISTED", passed, assisted };
}

/** Next stage after a completed run: independent work moves up, assisted work moves down. */
export function nextStage(previousStage: number, firstCompletion: boolean, outcome: RunOutcome): number {
  if (firstCompletion) return outcome === "INDEPENDENT" ? 1 : 0;
  return outcome === "INDEPENDENT"
    ? Math.min(REVIEW_STAGES.length - 1, previousStage + 1)
    : Math.max(0, previousStage - 1);
}

export function nextReviewDate(stage: number, from: Date): Date {
  const days = REVIEW_INTERVAL_DAYS[Math.min(REVIEW_INTERVAL_DAYS.length - 1, Math.max(0, stage))];
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}
