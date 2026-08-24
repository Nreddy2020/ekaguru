import { EvidenceType, EvidenceOutcome } from '@prisma/client';

export type PedagogicalPhase =
  | 'ORIENTATION'
  | 'INSTRUCTION'
  | 'SOCRATIC_PROBING'
  | 'SCAFFOLDED_PRACTICE'
  | 'INDEPENDENT_CHECK'
  | 'SYNTHESIS';

export type PedagogicalStrategy =
  | 'DIRECT_INSTRUCTION'
  | 'SOCRATIC_QUESTION'
  | 'COUNTER_EXAMPLE'
  | 'FADED_WORKED_EXAMPLE'
  | 'CHECK_FOR_UNDERSTANDING'
  | 'REFLECTIVE_SYNTHESIS';

export type TutorTurnOutcome =
  | 'CORRECT'
  | 'PARTIAL'
  | 'INCORRECT'
  | 'UNCERTAIN'
  | 'NEEDS_CLARIFICATION'
  | 'OFF_TOPIC';

export interface SourceAnchor {
  chunkId: string;
  pageIndex: number;
  snippet: string;
}

export interface VisualReference {
  type: 'IMAGE' | 'TABLE' | 'DIAGRAM' | 'EQUATION';
  caption: string;
  sourcePath?: string;
}

export interface TutorTurn {
  sessionId: string;
  turnId: string;
  turnIndex: number;
  phase: PedagogicalPhase;
  conceptId: string;
  canonicalName: string;
  strategy: PedagogicalStrategy;
  sourceAnchors: SourceAnchor[];
  visualReferences?: VisualReference[];
  language: string;
  scaffoldingLevel: number; // 1 (minimal hints) to 5 (fully worked)
  tutorResponseText: string;
  options?: string[];
  expectedEvidenceType: EvidenceType;
  evaluationPolicy: {
    method: 'EXACT_MATCH' | 'NUMERIC_TOLERANCE' | 'SEMANTIC_CRITIC';
    expectedAnswer?: string;
    tolerancePercent?: number;
    distractorKeys?: string[];
  };
}

export interface BoundedContextMemory {
  learnerId: string;
  conceptId: string;
  canonicalName: string;
  sourceSnippet: string;
  sourceChunkId: string;
  pageIndex: number;
  visuals?: VisualReference[];
  pKnowledge: number;
  pRetrieval: number;
  confidence: number;
  activeMisconceptions: string[];
  unmasteredPrerequisites: string[];
  recentTurns: {
    turnIndex: number;
    phase: PedagogicalPhase;
    learnerResponse?: string;
    outcome?: TutorTurnOutcome;
  }[];
}

export interface EvaluationResult {
  rawScore: number; // 0.0 to 1.0
  outcome: TutorTurnOutcome;
  passed: boolean;
  criticFeedback?: string;
  detectedMisconception?: string;
  matchedDistractorId?: string;
}

export interface GeneratedQuestion {
  id: string;
  conceptId: string;
  bloomLevel: 1 | 2 | 3 | 4;
  prompt: string;
  options: { id: string; text: string; isCorrect: boolean; misconceptionType?: string }[];
  correctAnswer: string;
  explanation: string;
  sourceAnchor: SourceAnchor;
}
