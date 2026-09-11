import { PageEvidence, PageLesson } from "./page-lesson-runtime";
import { TeachingDepth } from "./teaching-package.types";
const base = () => process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:20000";
export interface GuruAssessmentOutcome {
  kind?: "PAGE_EXPLANATION" | "ASSISTED_PRACTICE" | "PRIOR_KNOWLEDGE" | "REFLECTION";
  passed?: boolean;
  masteryUpdated: boolean;
  conceptIds?: string[];
  masteryNote?: string;
}
export interface GuruReviewState {
  stage: number;
  label: string;
  nextReviewAt: string | null;
  due: boolean;
  lastOutcome: string | null;
  passedCheckpoints?: number;
  assistedCheckpoints?: number;
  firstCompletion?: boolean;
}
export interface GuruPersonalization {
  recommendedDepth: string | null;
  recommendationReason: string | null;
  priorPages: { bookId: string; physicalPage: number; title: string; depth: string; lastOutcome: string | null; stageLabel: string }[];
  knownConcepts: string[];
  misconceptions: string[];
  note: string;
}
/** Board labels for the teaching phases (mirrors the server blueprint). */
export function describePhase(phase?: string): string {
  const labels: Record<string, string> = {
    hook: "Why this matters",
    prior: "What you already know",
    explain: "Teacher explains",
    reallife: "From your life",
    model: "Worked example (I do)",
    guided: "Guided practice (we do)",
    independent: "Your turn (you do)",
    misconception: "Common mistake",
    transfer: "Use it somewhere new",
    reflection: "Reflect and teach back",
    summary: "Summary and notes",
  };
  return (phase && labels[phase]) || "";
}
export interface GuruSessionSnapshot {
  id: string;
  artifactId: string;
  learnerId?: string | null;
  cursor: number;
  revision: number;
  checkpointPassed: boolean;
  completedAt?: string | null;
  review?: GuruReviewState | null;
  personalization?: GuruPersonalization | null;
  feedback?: string;
  evidenceIds?: string[];
  assessment?: GuruAssessmentOutcome | null;
}
/** Plain-language review scheduling line for the learner. */
export function describeReview(review?: GuruReviewState | null): string {
  if (!review || !review.nextReviewAt) return "";
  const when = new Date(review.nextReviewAt);
  const days = Math.max(0, Math.round((when.getTime() - Date.now()) / 86400000));
  const stage = review.label === "introduced" ? "introduced" : review.label === "partial" ? "partly secure" : review.label === "understood" ? "understood" : "retained";
  if (review.due) return "This page is due for a review. Restart the lesson and try the checkpoints without help.";
  return (
    "Page practice recorded as " + stage + ". Guru will suggest reviewing this page " +
    (days <= 1 ? "tomorrow" : "in " + days + " days") +
    (review.lastOutcome === "ASSISTED" ? ", sooner because help was used this time." : ".")
  );
}
/** Plain-language, evidence-backed statement of what an assessed answer changed. */
export function describeMasteryOutcome(
  assessment?: GuruAssessmentOutcome | null,
): string {
  // Only graded page explanations carry a mastery outcome; assisted practice and ungraded asks do not.
  if (!assessment || assessment.kind !== "PAGE_EXPLANATION") return "";
  if (assessment.masteryUpdated)
    return (
      "Recorded toward concept mastery for " +
      (assessment.conceptIds?.length || 0) +
      " verified concept" +
      ((assessment.conceptIds?.length || 0) === 1 ? "" : "s") +
      " on this page."
    );
  const why: Record<string, string> = {
    "bridge-disabled":
      "Concept mastery is unchanged: the mastery bridge is not enabled on this server.",
    "no-learner":
      "Concept mastery is unchanged: open this book through a learner profile to record concept evidence.",
    "no-verified-mapping":
      "Concept mastery is unchanged: this page has no curator-verified concept mapping yet.",
    "evaluation-gate":
      "Concept mastery is unchanged: educator review of this teaching depth is not complete.",
    "ledger-error":
      "Concept mastery is unchanged: the mastery ledger could not be updated, but this attempt is saved.",
  };
  return (
    "Recorded as page practice. " +
    (why[assessment.masteryNote || ""] || "Concept mastery is unchanged.")
  );
}
export type GuruEvent = {
  requestId: string;
  revision: number;
  kind: "next" | "back" | "restart" | "answer" | "help" | "question";
  answer?: string;
};
export async function guruFetch<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<{ status: number; data: T }> {
  const token = localStorage.getItem("token");
  const response = await fetch(base() + path, {
    method: body === undefined ? "GET" : "POST",
    signal,
    headers: {
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      typeof payload?.message === "string"
        ? payload.message
        : "Guru service is unavailable. Your source reading remains available.",
    );
  }
  return { status: response.status, data: (await response.json()) as T };
}
export async function guruRequest<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  return (await guruFetch<T>(path, body, signal)).data;
}
export interface GuruJob {
  id: string;
  status: "QUEUED" | "RUNNING" | "DONE" | "FAILED";
  stage: string;
  artifactId: string;
  error?: string | null;
}
/** Human wording for generation stages reported by the server. */
export function describeGuruStage(stage: string): string {
  const text: Record<string, string> = {
    queued: "Waiting for Guru to start on this page…",
    starting: "Guru is opening the page…",
    evidence: "Guru is reading the page evidence…",
    vision: "Guru is reading the page…",
    plan: "Guru is planning the lesson…",
    repair: "Guru is fixing gaps the validator found…",
    review: "Guru is checking the lesson against the page…",
    persist: "Saving the lesson…",
    done: "Lesson ready.",
  };
  return text[stage] || "Guru is working on this page…";
}
function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    }
    signal?.addEventListener("abort", onAbort);
  });
}
export const GURU_POLL_INTERVAL_MS = 3000;
export const GURU_POLL_DEADLINE_MS = 20 * 60 * 1000;
/** Waits for a queued generation job, reporting stages; rejects on failure, abort or deadline. */
export async function waitForGuruJob(
  job: GuruJob,
  signal: AbortSignal | undefined,
  onStage?: (stage: string) => void,
): Promise<GuruJob> {
  let current = job;
  const started = Date.now();
  onStage?.(current.stage);
  while (current.status !== "DONE") {
    if (current.status === "FAILED")
      throw new Error(current.error || "Guru could not prepare this lesson. Source reading remains available.");
    if (Date.now() - started > GURU_POLL_DEADLINE_MS)
      throw new Error("Guru is taking longer than expected. Your request stays queued; reload later.");
    await delay(GURU_POLL_INTERVAL_MS, signal);
    current = await guruRequest<GuruJob>("/api/v2/guru/jobs/" + encodeURIComponent(current.id), undefined, signal);
    onStage?.(current.stage);
  }
  return current;
}
export async function loadGuruLesson(
  page: PageEvidence,
  depth: TeachingDepth,
  language: string,
  age: number | undefined,
  signal: AbortSignal,
  learnerId?: string,
  onStage?: (stage: string) => void,
  regenerate = false,
) {
  const prefix = [
    "evs-class-5",
    "maths-class-5",
    "science-class-6",
    "social-class-5",
  ].includes(page.bookId)
    ? "textbooks"
    : "learning-materials";
  const lessonPath =
    "/api/v2/" +
    prefix +
    "/" +
    encodeURIComponent(page.bookId) +
    "/pages/" +
    page.physicalPage +
    "/lesson" +
    (regenerate ? "?regenerate=1" : "");
  type LessonResponse = { plan: PageLesson; page: Partial<PageEvidence>; legacyBlueprint?: boolean } | { job: GuruJob };
  let response = await guruFetch<LessonResponse>(lessonPath, { depth, language, age }, signal);
  if (response.status === 202 && "job" in response.data) {
    await waitForGuruJob(response.data.job, signal, onStage);
    response = await guruFetch<LessonResponse>(lessonPath, { depth, language, age }, signal);
  }
  if (!("plan" in response.data))
    throw new Error("Guru lesson is not ready yet. Please retry.");
  const result = response.data;
  if (
    result.page.bookId !== page.bookId ||
    result.page.physicalPage !== page.physicalPage ||
    result.page.sourceHash !== page.sourceHash ||
    result.plan.sourceHash !== page.sourceHash ||
    result.plan.depth !== depth ||
    result.plan.language !== language ||
    !Array.isArray(result.plan.actions) ||
    !result.plan.actions.length
  )
    throw new Error(
      "Guru lesson does not match the opened page and learner preferences.",
    );
  const session = await guruRequest<GuruSessionSnapshot>(
    "/api/v2/guru/lessons/" + encodeURIComponent(result.plan.id) + "/sessions",
    learnerId ? { learnerId } : {},
    signal,
  );
  if (learnerId && session.learnerId !== learnerId)
    throw new Error("The Guru session is not bound to the selected learner.");
  return {
    plan: result.plan,
    page: { ...page, ...result.page } as PageEvidence,
    session,
    legacyBlueprint: result.legacyBlueprint === true,
  };
}
