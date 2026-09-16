import { BookAudience, BlueprintId, NotesTopic } from './guru-notes.schema';
import { ConceptDependencyLink, TopicNode } from './guru-book-map.schema';
import { Depth } from './guru-plan.schema';
export type TeachingDepth = Depth;

export interface PackageBookMetadata {
  bookId: string;
  title: string;
  subject: string;
  grade: string;
  curriculum?: string;
  targetAudience: BookAudience;
  blueprint: BlueprintId;
  language: string;
  depth: TeachingDepth;
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
  topics: NotesTopic[];
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
  scenario?: { title: string; context: string; solution: string };
}

export interface PackageMistakeItem {
  chapterNumber: number;
  page: number;
  topic: string;
  questionOrSymptom: string;
  explanationOrFix: string;
  kind: 'child_doubt' | 'troubleshooting' | 'misconception';
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
  kind: 'try_now' | 'lab';
}

export interface PackageQuestionItem {
  id: string;
  chapterNumber: number;
  page: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'extended';
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

export interface PackageValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateLearningPackage(pkg: any): PackageValidationResult {
  const errors: string[] = [];

  if (!pkg || typeof pkg !== 'object') {
    return { valid: false, errors: ['Learning package must be an object'] };
  }

  // Metadata checks
  if (!pkg.metadata || typeof pkg.metadata !== 'object') {
    errors.push('Missing package metadata');
  } else {
    if (!pkg.metadata.bookId) errors.push('Missing metadata.bookId');
    if (!pkg.metadata.title) errors.push('Missing metadata.title');
    if (typeof pkg.metadata.readyPagesCount !== 'number' || pkg.metadata.readyPagesCount < 0) {
      errors.push('Invalid metadata.readyPagesCount');
    }
  }

  // Roadmap checks
  if (!Array.isArray(pkg.roadmap)) {
    errors.push('Roadmap must be an array');
  }

  // Concept map checks
  if (!pkg.conceptMap || !Array.isArray(pkg.conceptMap.topics) || !Array.isArray(pkg.conceptMap.dependencies)) {
    errors.push('Concept map must have topics and dependencies arrays');
  }

  // Chapter notes checks
  if (!Array.isArray(pkg.chapterNotes)) {
    errors.push('Chapter notes must be an array');
  }

  // Question bank checks
  if (!pkg.questionBank || !Array.isArray(pkg.questionBank.easy) || !Array.isArray(pkg.questionBank.medium) || !Array.isArray(pkg.questionBank.extended)) {
    errors.push('Question bank must have easy, medium, and extended arrays');
  }

  // Mock test checks
  if (!pkg.mockTest || typeof pkg.mockTest !== 'object') {
    errors.push('Missing mockTest in package');
  } else {
    if (typeof pkg.mockTest.totalMarks !== 'number' || pkg.mockTest.totalMarks <= 0) {
      errors.push('Mock test must have positive totalMarks');
    }
    if (typeof pkg.mockTest.timeBudgetMinutes !== 'number' || pkg.mockTest.timeBudgetMinutes <= 0) {
      errors.push('Mock test must have positive timeBudgetMinutes');
    }
    if (!Array.isArray(pkg.mockTest.sections) || pkg.mockTest.sections.length === 0) {
      errors.push('Mock test must have at least one section');
    }
    if (!Array.isArray(pkg.mockTest.answerKey)) {
      errors.push('Mock test must have an answerKey array');
    } else {
      const allTestQuestions = (pkg.mockTest.sections || []).flatMap((s: any) => s.questions || []);
      const answerKeyIds = new Set(pkg.mockTest.answerKey.map((a: any) => a.questionId));
      for (const q of allTestQuestions) {
        if (!answerKeyIds.has(q.id)) {
          errors.push(`Mock test question "${q.id}" is missing an answer key entry`);
        }
      }
    }
  }

  // Revision sheets checks
  if (!pkg.revisionSheets || typeof pkg.revisionSheets !== 'object') {
    errors.push('Missing revisionSheets in package');
  } else {
    if (!Array.isArray(pkg.revisionSheets.quickNotes)) {
      errors.push('Revision sheets must have quickNotes array');
    }
    if (!pkg.revisionSheets.onePageCheatSheet || typeof pkg.revisionSheets.onePageCheatSheet !== 'object') {
      errors.push('Revision sheets must have onePageCheatSheet');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
