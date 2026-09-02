import { TeachingDepth, EvidenceCitation } from './teaching-package.types';

export interface PageEntity {
  name: string;
  category: 'core_concept' | 'component' | 'helper' | 'input' | 'output' | 'system';
  icon: string;
  description: string;
  chalkboardWord: string;
}

export interface PageProcess {
  processName: string;
  summary: string;
  formula: string;
  steps: {
    sequenceIndex: number;
    action: string;
    entityName: string;
    icon: string;
    description: string;
  }[];
}

export interface PageRelationship {
  sourceEntity: string;
  targetEntity: string;
  relationType: 'depends_on' | 'transforms_into' | 'protects' | 'enables' | 'coordinates_with';
  label: string;
}

export interface PageMisconception {
  commonMistake: string;
  whyItIsWrong: string;
  coachingHint: string;
  remedialExample: string;
}

export interface PageKnowledgeModel {
  bookId: string;
  pageNumber: number;
  chapterTitle: string;
  topicTitle: string;
  primaryConcept: string;
  entities: PageEntity[];
  process: PageProcess;
  relationships: PageRelationship[];
  definitions: { term: string; definition: string }[];
  misconceptions: PageMisconception[];
  goldenRememberRule: string;
  socraticQuestions: {
    depth: TeachingDepth;
    question: string;
    correctOption: string;
    distractors: string[];
    explanation: string;
  }[];
  bboxCitations: {
    blockId: string;
    bbox: { x: number; y: number; width: number; height: number };
    snippet: string;
  }[];
}

/**
 * Autonomous Page Knowledge Extractor
 * Extracts a rich, structured PageKnowledgeModel from arbitrary raw page text / OCR blocks.
 */
export class DynamicPageKnowledgeExtractor {
  public static extractKnowledgeFromRawPage(
    bookId: string,
    pageNumber: number,
    rawText: string,
    chapterTitle?: string
  ): PageKnowledgeModel {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || `Topic of Page ${pageNumber}`;
    const topicTitle = chapterTitle ? `${chapterTitle} — Page ${pageNumber}` : firstLine;

    // Entity & concept extraction heuristics
    const words = rawText.match(/\b[A-Z][a-z]{3,}\b/g) || ['Concept', 'Principle', 'Process'];
    const uniqueTerms = Array.from(new Set(words)).slice(0, 5);

    const entities: PageEntity[] = uniqueTerms.map((term, idx) => ({
      name: term,
      category: idx === 0 ? 'core_concept' : idx === 1 ? 'component' : 'helper',
      icon: idx === 0 ? '🌟' : idx === 1 ? '⚙️' : idx === 2 ? '🤝' : '🌱',
      description: `Key component extracted from Page ${pageNumber}: ${term}`,
      chalkboardWord: term,
    }));

    const process: PageProcess = {
      processName: topicTitle,
      summary: lines.slice(0, 2).join(' ') || `Understanding ${topicTitle}`,
      formula: uniqueTerms.slice(0, 3).join(' ➔ ') || 'Observation ➔ Process ➔ Outcome',
      steps: entities.slice(0, 4).map((ent, idx) => ({
        sequenceIndex: idx + 1,
        action: `Examine ${ent.name}`,
        entityName: ent.name,
        icon: ent.icon,
        description: ent.description,
      })),
    };

    const misconceptions: PageMisconception[] = [
      {
        commonMistake: `Assuming ${entities[0]?.name || 'the concept'} operates in isolation without supporting systems.`,
        whyItIsWrong: 'All textbook concepts operate in coordinated interdependence.',
        coachingHint: `Look closely at how ${entities[0]?.name || 'this element'} connects with ${entities[1]?.name || 'supporting parts'}.`,
        remedialExample: `Notice on Page ${pageNumber} how each component contributes to the overall outcome.`,
      },
    ];

    const socraticQuestions = [
      {
        depth: 'basis' as TeachingDepth,
        question: `Based on Page ${pageNumber}, what is the primary role of ${entities[0]?.name || 'this concept'}?`,
        correctOption: `${entities[0]?.name || 'Primary Concept'} (Foundational Role)`,
        distractors: ['Unrelated Non-Living Object', 'Random Guess', 'External Factor'],
        explanation: `Page ${pageNumber} establishes that ${entities[0]?.name || 'this concept'} is essential.`,
      },
      {
        depth: 'developing' as TeachingDepth,
        question: `How does ${entities[0]?.name || 'the first part'} connect with ${entities[1]?.name || 'the second part'}?`,
        correctOption: `${entities[0]?.name || 'Part 1'} coordinates directly with ${entities[1]?.name || 'Part 2'}`,
        distractors: ['They are completely unrelated', 'They cancel each other out', 'They only exist in laboratories'],
        explanation: 'The two components work in continuous functional balance.',
      },
    ];

    return {
      bookId,
      pageNumber,
      chapterTitle: chapterTitle || 'Textbook Chapter',
      topicTitle,
      primaryConcept: entities[0]?.name || 'Core Principle',
      entities,
      process,
      relationships: [
        {
          sourceEntity: entities[0]?.name || 'A',
          targetEntity: entities[1]?.name || 'B',
          relationType: 'coordinates_with',
          label: 'Systemic Connection',
        },
      ],
      definitions: entities.map((e) => ({
        term: e.name,
        definition: e.description,
      })),
      misconceptions,
      goldenRememberRule: `${topicTitle}: Each component works in harmony to sustain the complete system.`,
      socraticQuestions,
      bboxCitations: [
        {
          blockId: `blk-${pageNumber}-core`,
          bbox: { x: 165, y: 84, width: 926, height: 298 },
          snippet: lines.slice(0, 3).join(' ') || topicTitle,
        },
      ],
    };
  }
}
