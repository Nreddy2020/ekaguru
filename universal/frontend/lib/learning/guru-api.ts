import { PageEvidence, PageLesson } from "./page-lesson-runtime";
import { TeachingDepth } from "./teaching-package.types";
const base = () => process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:20000";
export interface GuruAssessmentOutcome {
  kind?: "PAGE_EXPLANATION" | "ASSISTED_PRACTICE";
  passed?: boolean;
  masteryUpdated: boolean;
  conceptIds?: string[];
  masteryNote?: string;
}
export interface GuruSessionSnapshot {
  id: string;
  artifactId: string;
  learnerId?: string | null;
  cursor: number;
  revision: number;
  checkpointPassed: boolean;
  feedback?: string;
  evidenceIds?: string[];
  assessment?: GuruAssessmentOutcome | null;
}
/** Plain-language, evidence-backed statement of what an assessed answer changed. */
export function describeMasteryOutcome(
  assessment?: GuruAssessmentOutcome | null,
): string {
  if (!assessment || assessment.kind === "ASSISTED_PRACTICE") return "";
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
export async function guruRequest<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
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
  return response.json();
}
export async function loadGuruLesson(
  page: PageEvidence,
  depth: TeachingDepth,
  language: string,
  age: number | undefined,
  signal: AbortSignal,
  learnerId?: string,
) {
  const prefix = [
    "evs-class-5",
    "maths-class-5",
    "science-class-6",
    "social-class-5",
  ].includes(page.bookId)
    ? "textbooks"
    : "learning-materials";
  const result = await guruRequest<{
    plan: PageLesson;
    page: Partial<PageEvidence>;
  }>(
    "/api/v2/" +
      prefix +
      "/" +
      encodeURIComponent(page.bookId) +
      "/pages/" +
      page.physicalPage +
      "/lesson",
    { depth, language, age },
    signal,
  );
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
  };
}
