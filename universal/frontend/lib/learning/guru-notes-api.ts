import { GuruJob, guruFetch, guruRequest, waitForGuruJob } from "./guru-api";
import type { PageEvidence } from "./page-lesson-runtime";
import type { TeachingDepth } from "./teaching-package.types";

/**
 * Guru Notes: a teacher's study notes for one page, prepared once, saved with the book,
 * printable, and extended by the questions readers ask under each topic.
 */
export interface NotesQA {
  question: string;
  answer: string;
}
export interface NotesScenePrimitive {
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
export interface NotesTryNow {
  title: string;
  steps: string[];
  whatToNotice: string;
}
export interface NotesChainLink {
  label: string;
  emoji: string;
}
export interface NotesQuiz {
  question: string;
  options: string[];
  answerIndex: number;
  why: string;
}
export interface NotesTopic {
  id: string;
  heading: string;
  /** One emoji standing for the topic on the learning ladder. */
  icon?: string;
  /** Three to five bullets: the topic on one card. */
  keyPoints?: string[];
  evidenceIds: string[];
  /** What to look at in the book's own region for this topic. */
  lookAt?: string;
  /** A short scene the child can picture (children's edition). */
  hook?: string;
  /** The idea in one sentence (children's edition). */
  bigIdea?: string;
  explanation: string[];
  /** How it happens step by step, when the idea is a process. */
  steps?: string[];
  /** A picture chain such as seed, sprout, plant. */
  chain?: NotesChainLink[];
  /** One surprising true fact. */
  didYouKnow?: string;
  /** Circle the correct answer. */
  quiz?: NotesQuiz;
  /** A simple labelled board drawing; may be empty. */
  diagram?: NotesScenePrimitive[];
  /** A two-minute activity the child can do right now with everyday things. */
  tryNow?: NotesTryNow;
  keyTerms: { term: string; meaning: string; example: string }[];
  example: { situation: string; explanation: string };
  rememberTip: string;
  commonDoubts: NotesQA[];
  checkYourself: NotesQA[];
}
export interface GuruNotesDocument {
  title: string;
  subtitle?: string;
  closingLine?: string;
  depth?: TeachingDepth;
  overview: string;
  objectives: string[];
  topics: NotesTopic[];
  summary: string[];
  omitted: { evidenceId: string; reason: string }[];
  language: string;
  sourceHash: string;
  blueprint: string;
}
export interface NotesExtension {
  id: string;
  topicId: string;
  question: string;
  answer: string;
  evidenceIds: string[];
  beyondPage: boolean;
  createdAt: string;
}
export interface GuruNotesView {
  id: string;
  bookId: string;
  physicalPage: number;
  sourceHash: string;
  language: string;
  depth?: TeachingDepth;
  blueprint: string;
  notes: GuruNotesDocument;
  extensions: NotesExtension[];
  createdAt: string;
}
export interface BookNotesStatus {
  bookId: string;
  language: string;
  ready: number[];
  readyCount: number;
  jobs: { physicalPage: number; status: string; stage: string; error: string | null }[];
}

const BUILTIN = ["evs-class-5", "maths-class-5", "science-class-6", "social-class-5"];
export function bookPath(bookId: string) {
  return "/api/v2/" + (BUILTIN.includes(bookId) ? "textbooks" : "learning-materials") + "/" + encodeURIComponent(bookId);
}

/** The prepared notes for a page, waiting once for a reading job and once for a notes job when needed. */
export async function loadGuruNotes(
  page: PageEvidence,
  language: string,
  depth: TeachingDepth,
  signal: AbortSignal,
  onStage?: (stage: string) => void,
): Promise<GuruNotesView> {
  const path = bookPath(page.bookId) + "/pages/" + page.physicalPage + "/notes";
  type Answer = GuruNotesView | { job: GuruJob };
  let response = await guruFetch<Answer>(path, { language, depth }, signal);
  for (let round = 0; response.status === 202 && response.data && "job" in response.data; round++) {
    if (round >= 3) throw new Error("Guru is still preparing these notes. Please retry in a moment.");
    await waitForGuruJob(response.data.job, signal, onStage);
    response = await guruFetch<Answer>(path, { language, depth }, signal);
  }
  if (!response.data || !("notes" in response.data)) throw new Error("Guru notes are not ready yet. Please retry.");
  const view = response.data;
  if (
    view.bookId !== page.bookId ||
    view.physicalPage !== page.physicalPage ||
    view.sourceHash !== page.sourceHash ||
    view.language !== language ||
    (view.depth !== undefined && view.depth !== depth) ||
    !Array.isArray(view.notes?.topics) ||
    !view.notes.topics.length
  )
    throw new Error("Guru notes do not match the opened page.");
  return view;
}

/** A reader's question under a topic; the answer is saved into the notes for everyone. */
export function askNotesQuestion(
  page: PageEvidence,
  language: string,
  depth: TeachingDepth,
  topicId: string,
  question: string,
  learnerId?: string,
  signal?: AbortSignal,
): Promise<{ extension: NotesExtension; reused: boolean }> {
  return guruRequest(
    bookPath(page.bookId) + "/pages/" + page.physicalPage + "/notes/questions",
    { language, depth, topicId, question, ...(learnerId ? { learnerId } : {}) },
    signal,
  );
}

export function prepareBookNotes(bookId: string, language: string, depth: TeachingDepth, signal?: AbortSignal) {
  return guruRequest<{ pagesTotal: number; from: number; to: number; ready: number; queued: number; reading: number; failed: { page: number; reason: string }[] }>(
    bookPath(bookId) + "/notes/prepare",
    { language, depth },
    signal,
  );
}

export function bookNotesStatus(bookId: string, language: string, depth: TeachingDepth, signal?: AbortSignal) {
  return guruRequest<BookNotesStatus>(
    bookPath(bookId) + "/notes/status?language=" + encodeURIComponent(language) + "&depth=" + encodeURIComponent(depth),
    undefined,
    signal,
  );
}
