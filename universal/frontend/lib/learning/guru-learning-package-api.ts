import { guruFetch, guruRequest } from "./guru-api";
import { TopicNode, ConceptDependencyLink } from "./guru-book-map-api";

export type BookAudience =
  | "child"
  | "school_student"
  | "college_student"
  | "teacher"
  | "professor"
  | "it_professional"
  | "manager"
  | "competitive_exam";

export interface PackageBookMetadata {
  bookId: string;
  title: string;
  subject: string;
  grade: string;
  curriculum?: string;
  targetAudience: BookAudience;
  blueprint: string;
  language: string;
  depth: string;
  totalPages: number;
  readyPagesCount: number;
  generatedAt: string;
}

export interface PackageRoadmapChapter {
  chapterNumber: number;
  title: string;
  pageRange: { from: number; to: number };
  concepts: string[];
  objectives: string[];
}

export interface PackageConceptMap {
  topics: TopicNode[];
  dependencies: ConceptDependencyLink[];
}

export interface PackagePageNoteSummary {
  physicalPage: number;
  title: string;
  topics: any[];
  summary: string[];
}

export interface PackageChapterNotes {
  chapterNumber: number;
  chapterTitle: string;
  pageRange: { from: number; to: number };
  pages: PackagePageNoteSummary[];
}

export interface PackageExampleItem {
  chapterNumber: number;
  page: number;
  topic: string;
  situation: string;
  explanation: string;
  scenario?: any;
}

export interface PackageMistakeItem {
  chapterNumber: number;
  page: number;
  topic: string;
  questionOrSymptom: string;
  explanationOrFix: string;
  kind: "child_doubt" | "troubleshooting" | "misconception";
}

export interface PackageMemoryItem {
  chapterNumber: number;
  page: number;
  topic: string;
  tip: string;
  facts: string[];
  chain?: { label: string; emoji: string }[];
  bigIdea?: string;
}

export interface PackageExerciseItem {
  chapterNumber: number;
  page: number;
  topic: string;
  title: string;
  steps: string[];
  verificationOrNotice: string;
  kind: "try_now" | "lab";
}

export interface PackageQuestionItem {
  id: string;
  chapterNumber: number;
  page: number;
  topic: string;
  difficulty: "easy" | "medium" | "extended";
  question: string;
  options?: string[];
  answer: string;
  rationale?: string;
  marks?: number;
}

export interface PackageMockTestSection {
  sectionId: string;
  name: string;
  instructions: string;
  questions: PackageQuestionItem[];
  totalMarks: number;
}

export interface PackageMockTestRubricEntry {
  criteria: string;
  marks: number;
  description: string;
}

export interface PackageMockTestAnswerKeyEntry {
  questionId: string;
  questionText: string;
  modelAnswer: string;
  markingGuide: string;
}

export interface PackageMockTest {
  title: string;
  totalMarks: number;
  timeBudgetMinutes: number;
  instructions: string[];
  sections: PackageMockTestSection[];
  rubric: PackageMockTestRubricEntry[];
  answerKey: PackageMockTestAnswerKeyEntry[];
}

export interface PackageRevisionSheets {
  quickNotes: { chapterNumber: number; title: string; lines: string[] }[];
  memoryDigest: { chapterNumber: number; terms: { term: string; meaning: string }[]; tips: string[] }[];
  onePageCheatSheet: {
    title: string;
    summaryLines: string[];
    coreRules: string[];
    examWarnings: string[];
  };
}

export interface MasterLearningPackage {
  metadata: PackageBookMetadata;
  roadmap: PackageRoadmapChapter[];
  conceptMap: PackageConceptMap;
  chapterNotes: PackageChapterNotes[];
  examplesAndScenarios: PackageExampleItem[];
  mistakesAndTroubleshooting: PackageMistakeItem[];
  memoryTricks: PackageMemoryItem[];
  exercisesAndLabs: PackageExerciseItem[];
  questionBank: {
    easy: PackageQuestionItem[];
    medium: PackageQuestionItem[];
    extended: PackageQuestionItem[];
  };
  mockTest: PackageMockTest;
  revisionSheets: PackageRevisionSheets;
}

export interface FetchPackageOptions {
  language?: string;
  depth?: string;
  audience?: string;
  refresh?: boolean;
}

/**
 * Fetches the whole-book Master Learning Package for a textbook.
 */
export async function fetchLearningPackage(
  bookId: string,
  options: FetchPackageOptions = {},
  signal?: AbortSignal,
): Promise<MasterLearningPackage> {
  const params = new URLSearchParams();
  if (options.language) params.set("language", options.language);
  if (options.depth) params.set("depth", options.depth);
  if (options.audience) params.set("audience", options.audience);
  if (options.refresh) params.set("refresh", "1");

  const qs = params.toString() ? `?${params.toString()}` : "";
  const path = `/api/v2/guru/books/${encodeURIComponent(bookId)}/learning-package${qs}`;

  const res = await guruFetch<MasterLearningPackage>(path, undefined, signal);
  if (res.status >= 400 || !res.data) {
    throw new Error(`Failed to load master learning package: HTTP ${res.status}`);
  }
  return res.data;
}

/**
 * Forces regeneration of the Master Learning Package and underlying concept map.
 */
export async function refreshLearningPackage(
  bookId: string,
  options: FetchPackageOptions = {},
  signal?: AbortSignal,
): Promise<MasterLearningPackage> {
  const params = new URLSearchParams();
  if (options.language) params.set("language", options.language);
  if (options.depth) params.set("depth", options.depth);
  if (options.audience) params.set("audience", options.audience);

  const qs = params.toString() ? `?${params.toString()}` : "";
  const path = `/api/v2/guru/books/${encodeURIComponent(bookId)}/learning-package/refresh${qs}`;

  return guruRequest<MasterLearningPackage>(path, {}, signal);
}
