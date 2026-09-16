import { guruFetch, guruRequest } from "./guru-api";

export interface TopicNode {
  topicId: string;
  title: string;
  physicalPage: number;
  summary: string;
  keyTerms: string[];
}

export interface ChapterMapSummary {
  chapterNumber: number;
  title: string;
  pageStart: number;
  pageEnd: number;
  topics: TopicNode[];
}

export interface KeyTermEntry {
  term: string;
  definition: string;
  introducedOnPage: number;
  chapterNumber: number;
  page?: number;
}

export interface ConceptDependencyLink {
  id: string;
  sourceTopicId: string;
  sourceTopicTitle: string;
  sourcePage: number;
  targetTopicId: string;
  targetTopicTitle: string;
  targetPage: number;
  reason: string;
  strength: "essential" | "supporting";
}

export interface BookKnowledgeMap {
  version: "book-map-v1";
  bookId: string;
  title: string;
  totalPages: number;
  chapters: ChapterMapSummary[];
  keyTerms: KeyTermEntry[];
  dependencies: ConceptDependencyLink[];
  generatedAt: string;
}

export interface TopicDependencyView {
  topicId: string;
  topicTitle: string;
  physicalPage: number;
  prerequisites: {
    topicId: string;
    topicTitle: string;
    page: number;
    reason: string;
    strength: "essential" | "supporting";
  }[];
  dependents: {
    topicId: string;
    topicTitle: string;
    page: number;
    reason: string;
    strength: "essential" | "supporting";
  }[];
  revisitRecommendation?: {
    page: number;
    topicId: string;
    topicTitle: string;
    reason: string;
  };
}

export interface DiagnosticRevisitGuidance {
  currentPage: number;
  currentTopicTitle: string;
  hasPrerequisite: boolean;
  recommendedPage: number;
  prerequisiteTopicId?: string;
  prerequisiteTopicTitle?: string;
  reason: string;
}

/**
 * Fetches the whole-book knowledge map with chapters, topics, glossary terms, and concept dependencies.
 */
export async function fetchBookKnowledgeMap(
  bookId: string,
  refresh = false,
  signal?: AbortSignal,
): Promise<BookKnowledgeMap> {
  const query = refresh ? "?refresh=1" : "";
  return guruRequest<BookKnowledgeMap>(
    `/api/v2/guru/books/${encodeURIComponent(bookId)}/map${query}`,
    undefined,
    signal,
  );
}

/**
 * Queries concept dependencies (prerequisites and downstream impacts) for a specific topic.
 */
export async function fetchTopicDependencies(
  bookId: string,
  topicId: string,
  signal?: AbortSignal,
): Promise<TopicDependencyView> {
  return guruRequest<TopicDependencyView>(
    `/api/v2/guru/books/${encodeURIComponent(bookId)}/topics/${encodeURIComponent(topicId)}/dependencies`,
    undefined,
    signal,
  );
}

/**
 * Requests diagnostic revisit guidance when a student struggles on a page/topic.
 */
export async function fetchRevisitGuidance(
  bookId: string,
  page: number,
  topicId?: string,
  signal?: AbortSignal,
): Promise<DiagnosticRevisitGuidance> {
  const query = topicId ? `?topicId=${encodeURIComponent(topicId)}` : "";
  return guruRequest<DiagnosticRevisitGuidance>(
    `/api/v2/guru/books/${encodeURIComponent(bookId)}/pages/${page}/revisit${query}`,
    undefined,
    signal,
  );
}

/**
 * Triggers re-synthesis of the whole-book knowledge map.
 */
export async function refreshBookKnowledgeMap(
  bookId: string,
  signal?: AbortSignal,
): Promise<BookKnowledgeMap> {
  return guruRequest<BookKnowledgeMap>(
    `/api/v2/guru/books/${encodeURIComponent(bookId)}/map/refresh`,
    {},
    signal,
  );
}
