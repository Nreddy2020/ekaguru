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
  strength: 'essential' | 'supporting';
}

export interface BookKnowledgeMap {
  version: 'book-map-v1';
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
    strength: 'essential' | 'supporting';
  }[];
  dependents: {
    topicId: string;
    topicTitle: string;
    page: number;
    reason: string;
    strength: 'essential' | 'supporting';
  }[];
  revisitRecommendation?: {
    page: number;
    topicId: string;
    topicTitle: string;
    reason: string;
  };
}

export interface BookMapValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that a BookKnowledgeMap satisfies structural invariants:
 * 1. Correct version and metadata.
 * 2. Proper chapter page intervals (pageStart <= pageEnd).
 * 3. Unique topic IDs and topic presence.
 * 4. Dependency links point to existing topics.
 * 5. Monotonicity: prerequisite page <= dependent page.
 * 6. Directed Acyclic Graph (DAG): zero cycles.
 */
export function validateBookKnowledgeMap(input: any): BookMapValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Input must be a valid object'] };
  }

  if (input.version !== 'book-map-v1') {
    errors.push('version must be "book-map-v1"');
  }

  if (typeof input.bookId !== 'string' || !input.bookId.trim()) {
    errors.push('bookId is required');
  }

  if (typeof input.title !== 'string' || !input.title.trim()) {
    errors.push('title is required');
  }

  if (typeof input.totalPages !== 'number' || input.totalPages < 1) {
    errors.push('totalPages must be a positive number');
  }

  if (!Array.isArray(input.chapters)) {
    errors.push('chapters must be an array');
  }

  const topicRegistry = new Map<string, { title: string; page: number }>();

  if (Array.isArray(input.chapters)) {
    for (let cIdx = 0; cIdx < input.chapters.length; cIdx++) {
      const ch = input.chapters[cIdx];
      if (!ch || typeof ch !== 'object') {
        errors.push(`chapter[${cIdx}] is invalid`);
        continue;
      }
      if (typeof ch.chapterNumber !== 'number') {
        errors.push(`chapter[${cIdx}].chapterNumber must be a number`);
      }
      if (typeof ch.title !== 'string' || !ch.title.trim()) {
        errors.push(`chapter[${cIdx}].title is required`);
      }
      if (typeof ch.pageStart !== 'number' || typeof ch.pageEnd !== 'number' || ch.pageStart > ch.pageEnd) {
        errors.push(`chapter[${cIdx}] invalid page interval (${ch.pageStart}..${ch.pageEnd})`);
      }
      if (Array.isArray(ch.topics)) {
        for (let tIdx = 0; tIdx < ch.topics.length; tIdx++) {
          const t = ch.topics[tIdx];
          if (!t || typeof t.topicId !== 'string' || !t.topicId.trim()) {
            errors.push(`chapter[${cIdx}].topics[${tIdx}] missing topicId`);
            continue;
          }
          if (topicRegistry.has(t.topicId)) {
            errors.push(`Duplicate topicId "${t.topicId}" found in chapter ${ch.chapterNumber}`);
          }
          topicRegistry.set(t.topicId, { title: t.title || t.topicId, page: t.physicalPage });
        }
      }
    }
  }

  // Validate dependencies
  const adj = new Map<string, string[]>();
  for (const topicId of topicRegistry.keys()) {
    adj.set(topicId, []);
  }

  if (Array.isArray(input.dependencies)) {
    for (let dIdx = 0; dIdx < input.dependencies.length; dIdx++) {
      const dep = input.dependencies[dIdx];
      if (!dep || typeof dep !== 'object') {
        errors.push(`dependencies[${dIdx}] is invalid`);
        continue;
      }
      if (!topicRegistry.has(dep.sourceTopicId)) {
        errors.push(`dependencies[${dIdx}] unknown sourceTopicId "${dep.sourceTopicId}"`);
      }
      if (!topicRegistry.has(dep.targetTopicId)) {
        errors.push(`dependencies[${dIdx}] unknown targetTopicId "${dep.targetTopicId}"`);
      }
      if (dep.sourceTopicId === dep.targetTopicId) {
        errors.push(`dependencies[${dIdx}] self-dependency loop on "${dep.sourceTopicId}"`);
      }
      if (typeof dep.sourcePage === 'number' && typeof dep.targetPage === 'number' && dep.sourcePage > dep.targetPage) {
        errors.push(
          `dependencies[${dIdx}] violates prerequisite ordering: source page ${dep.sourcePage} > target page ${dep.targetPage}`
        );
      }

      if (topicRegistry.has(dep.sourceTopicId) && topicRegistry.has(dep.targetTopicId)) {
        adj.get(dep.sourceTopicId)?.push(dep.targetTopicId);
      }
    }
  }

  // DAG Cycle Detection (DFS with 3 colors: 0=unvisited, 1=visiting, 2=visited)
  const visited = new Map<string, number>();
  for (const topicId of topicRegistry.keys()) {
    visited.set(topicId, 0);
  }

  function hasCycle(node: string): boolean {
    visited.set(node, 1); // currently visiting
    const neighbors = adj.get(node) || [];
    for (const next of neighbors) {
      const state = visited.get(next) ?? 0;
      if (state === 1) return true; // back-edge = cycle!
      if (state === 0 && hasCycle(next)) return true;
    }
    visited.set(node, 2); // finished
    return false;
  }

  for (const topicId of topicRegistry.keys()) {
    if (visited.get(topicId) === 0) {
      if (hasCycle(topicId)) {
        errors.push('Cycle detected in concept dependency graph: graph must be a Directed Acyclic Graph (DAG)');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Traverses dependencies for a specific topic, returning prerequisites, downstream impacts, and revisit suggestions.
 */
export function queryTopicDependencies(
  map: BookKnowledgeMap,
  targetTopicId: string
): TopicDependencyView | null {
  let foundTopic: TopicNode | null = null;

  for (const ch of map.chapters) {
    for (const t of ch.topics) {
      if (t.topicId === targetTopicId) {
        foundTopic = t;
        break;
      }
    }
    if (foundTopic) break;
  }

  if (!foundTopic) return null;

  const prerequisites: TopicDependencyView['prerequisites'] = [];
  const dependents: TopicDependencyView['dependents'] = [];

  for (const dep of map.dependencies) {
    if (dep.targetTopicId === targetTopicId) {
      prerequisites.push({
        topicId: dep.sourceTopicId,
        topicTitle: dep.sourceTopicTitle,
        page: dep.sourcePage,
        reason: dep.reason,
        strength: dep.strength,
      });
    }
    if (dep.sourceTopicId === targetTopicId) {
      dependents.push({
        topicId: dep.targetTopicId,
        topicTitle: dep.targetTopicTitle,
        page: dep.targetPage,
        reason: dep.reason,
        strength: dep.strength,
      });
    }
  }

  // Sort prerequisites: most foundational first (earliest page, essential first)
  prerequisites.sort((a, b) => (a.strength === 'essential' && b.strength !== 'essential' ? -1 : a.page - b.page));

  let revisitRecommendation: TopicDependencyView['revisitRecommendation'];
  if (prerequisites.length > 0) {
    const primary = prerequisites[0];
    revisitRecommendation = {
      page: primary.page,
      topicId: primary.topicId,
      topicTitle: primary.topicTitle,
      reason: primary.reason,
    };
  }

  return {
    topicId: foundTopic.topicId,
    topicTitle: foundTopic.title,
    physicalPage: foundTopic.physicalPage,
    prerequisites,
    dependents,
    revisitRecommendation,
  };
}
