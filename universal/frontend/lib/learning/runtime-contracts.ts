/**
 * EKAGURU Module 06: Pedagogical Runtime Contracts (Behavioral Engine)
 */

export interface SourceAnchor {
  sourceId: string;
  sequenceIndex: number;
  printedPage: number;
  pdfPage: number;
  side?: 'left' | 'right' | 'full';
  snippetText: string;
  confidence: number;
}

export interface SourceFact {
  id: string;
  sourceAnchor: SourceAnchor;
  exactSnippet: string;
  statement: string;
  confidence: number;
}

export type PedagogicalArchetype =
  | 'NORMAL_CHAPTER'
  | 'ART_SPECIAL'
  | 'STORYTIME'
  | 'YOGA_FITNESS'
  | 'ASSESSMENT';

export type CognitiveDimension = 'RECALL' | 'APPLICATION' | 'REASONING' | 'OBSERVATION';

export interface SocraticStep {
  id: string;
  stepType: 'WHAT' | 'HOW' | 'WHY' | 'WHAT_IF' | 'TRANSFER';
  title: string;
  prompt: string;
  groundedExplanation: string;
  mentalModelDiagram?: string;
  cognitiveDimension: CognitiveDimension;
  difficulty: 1 | 2 | 3 | 4 | 5;
  question: {
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    misconceptionIdIfChosen?: Record<number, string>;
  };
}

export interface ObservationalTask {
  id: string;
  conceptId: string;
  title: string;
  objective: string;
  steps: {
    stepNumber: number;
    action: 'OBSERVE' | 'MEASURE' | 'ACT' | 'PREDICT' | 'EXPLAIN' | 'REFLECT';
    instruction: string;
    fieldKey?: string;
    unit?: string;
    defaultValue?: string;
  }[];
  validationLogic: (inputs: Record<string, string | number>) => {
    valid: boolean;
    reasoningScore: number;
    feedback: string;
  };
}

export interface MisconceptionPattern {
  id: string;
  conceptId: string;
  misconceptionType: 'FUNCTIONAL_CONFUSION' | 'CATEGORY_ERROR' | 'CAUSAL_INVERSION' | 'SCALE_ERROR';
  triggerPattern: string;
  incorrectMentalModel: string;
  correctMentalModel: string;
  socraticRemediation: string;
  independentVerificationChallenge: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface KnowledgeUnit {
  id: string;
  conceptId: string;
  title: string;
  archetype: PedagogicalArchetype;
  sourceFacts: SourceFact[];
  
  // Full 5-Step Socratic Dialogue Sequence
  socraticSteps: SocraticStep[];
  observationalTask?: ObservationalTask;
  misconceptions: MisconceptionPattern[];
  
  prerequisiteConceptIds: string[];
  extensionConceptIds: string[];
  realWorldTransfers: {
    title: string;
    scenario: string;
    connection: string;
  }[];
}

export interface EvidenceEvent {
  id: string;
  learnerId: string;
  conceptId: string;
  sectionId: string;
  dimension: CognitiveDimension;
  difficulty: 1 | 2 | 3 | 4 | 5;
  score: number; // 0.0 to 1.0
  isCorrect: boolean;
  misconceptionTriggered?: string;
  misconceptionResolved?: string;
  timestamp: string;
  details?: string;
}

export interface MasteryMetric {
  conceptId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'NEEDS_REMEDIATION' | 'MASTERED';
  recallScore: number;
  applicationScore: number;
  reasoningScore: number;
  observationCompleted: boolean;
  activeMisconceptions: string[];
  evidenceCount: {
    recall: number;
    application: number;
    reasoning: number;
    observation: number;
  };
  lastEvaluatedAt: string;
  nextPedagogicalAction: {
    type: 'TEACH_STEP' | 'OBSERVE_TASK' | 'APPLICATION_CHALLENGE' | 'REMEDIATE_MISCONCEPTION' | 'ADVANCE_EXTENSION';
    reason: string;
    stepIndex?: number;
    misconceptionId?: string;
    targetConceptId?: string;
  };
}
