/**
 * EKAGURU Module 06: Pedagogical & Knowledge Construction Engine Data Contracts
 * 
 * Invariants:
 * 1. EKAGURU Pedagogical Integrity: Every pedagogical asset belongs to a concept,
 *    and every concept is anchored to explicit Module 05 source regions.
 * 2. Canonical Section Invariant: All views, explanations, examples, practice,
 *    related concepts, and learning evidence derive from activeSectionId.
 * 3. Event-Based Mastery: Mastery is computed from explicit verification events.
 */

export interface SourceAnchor {
  sourceId: string;
  sequenceIndex: number;
  printedPage: number;
  pdfPage: number;
  side?: 'left' | 'right' | 'full';
  viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  snippetText: string;
  confidence: number;
}

export interface PedagogicalAssetProvenance {
  conceptId: string;
  sourceAnchors: SourceAnchor[];
  generatedFromVersion: string;
  status: 'draft' | 'verified' | 'published';
  groundingConfidence: number;
}

export interface ConceptExample {
  id: string;
  title: string;
  scenario: string;
  connection: string;
  iconType?: 'home' | 'nature' | 'observation' | 'science' | 'community' | 'body';
  provenance: PedagogicalAssetProvenance;
}

export type CognitiveSkill =
  | 'recall'
  | 'understanding'
  | 'application'
  | 'spatial_reasoning'
  | 'decision_making'
  | 'observation';

export interface PracticeQuestion {
  id: string;
  conceptId: string;
  question: string;
  cognitiveSkill: CognitiveSkill;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correctIndex: number;
  explanation: string;
  misconceptionTrap?: string;
  provenance: PedagogicalAssetProvenance;
}

export interface RelatedConceptLink {
  id: string;
  conceptId: string;
  title: string;
  relationship: 'prerequisite' | 'extension' | 'related' | 'real_world';
  targetUnitTitle?: string;
  targetChapterTitle?: string;
  description: string;
}

export interface LearningConcept {
  id: string;
  sectionId: string;
  title: string;
  category: string;
  sourceAnchors: SourceAnchor[];
  provenance: PedagogicalAssetProvenance;

  // 3-Level Progressive Depth Explanations
  pedagogy: {
    understand: {
      heading: string;
      content: string;
      keyTerms: string[];
    };
    simpleWords: {
      heading: string;
      content: string;
      analogy?: string;
    };
    deepDive: {
      heading: string;
      content: string;
      mechanism: string;
      curiosityPrompt?: string;
    };
  };

  examples: ConceptExample[];
  practice: PracticeQuestion[];
  relatedConcepts: RelatedConceptLink[];
  summary: {
    keyTakeaways: string[];
    quickTakeaway: string;
  };
}

export type MasteryEventType = 'seen' | 'understood' | 'practiced' | 'verified' | 'mastered';

export interface LearningEvidenceEvent {
  id: string;
  conceptId: string;
  sectionId: string;
  eventType: MasteryEventType;
  timestamp: string;
  score?: number;
  details?: string;
}

export interface ConceptMasteryState {
  conceptId: string;
  seen: boolean;
  understood: boolean;
  practiced: boolean;
  verified: boolean;
  mastered: boolean;
  scoreAvg?: number;
  events: LearningEvidenceEvent[];
}
