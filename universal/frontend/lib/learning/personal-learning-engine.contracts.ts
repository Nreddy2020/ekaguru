/**
 * ============================================================================
 * EKAGURU PERSONAL LEARNING ENGINE — CANONICAL CONTRACTS (REFINED)
 * ============================================================================
 */

// ============================================================================
// 1. CURRICULUM SPINE (Immutable Textbook Truth)
// ============================================================================

export interface CurriculumPosition {
  bookId: string;
  bookTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  sectionId?: string;
  sectionTitle?: string;
  printedPage: number;
  pdfPage: number;
  sequenceIndex: number;
  isSpecialPage?: boolean;
  archetype?: 'NORMAL_CHAPTER' | 'ART_SPECIAL' | 'STORYTIME' | 'YOGA_FITNESS' | 'ASSESSMENT';
}

export interface LearningObjective {
  id: string;
  code: string; // e.g. "EVS-5-BIO-01"
  statement: string;
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  standardFramework?: string;
  prerequisiteObjectiveIds: string[];
}

export interface TextbookPage {
  id: string;
  position: CurriculumPosition;
  rawText: string;
  extractedConcepts: string[];
  learningObjectives: LearningObjective[];
  sourceConfidence: number;
  sourceAnchorId: string;
}

// ============================================================================
// 2. KNOWLEDGE UNIVERSE & GRAPH
// ============================================================================

export type ProvenanceType =
  | 'TEXTBOOK_SOURCE'
  | 'CURRICULUM_DERIVED'
  | 'EKAGURU_GENERATED'
  | 'EXTERNAL_KNOWLEDGE'
  | 'LEARNER_GENERATED';

export interface SourceProvenance {
  type: ProvenanceType;
  sourceName: string;
  sourceUrl?: string;
  confidence: number; // strictly 0.0 to 1.0
  retrievedAt: string;
  license?: string;
  ageAppropriateRating: 'CLASS_1_3' | 'CLASS_4_5' | 'CLASS_6_8' | 'ALL_AGES';
}

export interface KnowledgeNode {
  id: string;
  title: string;
  domain: 'BIOLOGY' | 'PHYSICS' | 'ASTRONOMY' | 'EARTH_SCIENCE' | 'MATHEMATICS' | 'CULTURE_HISTORY' | 'COMMUNITY_LIFE_SKILLS';
  tagline: string;
  shortDefinition: string;
  detailedExplanation: string;
  provenance: SourceProvenance;
  gradeLevel: number;
  complexityLevel: 'FOUNDATIONAL' | 'INTERMEDIATE' | 'ADVANCED' | 'COSMIC_EXTENSION';
  tags: string[];
}

export type RelationshipType =
  | 'PREREQUISITE_OF'
  | 'EXTENDS'
  | 'PART_OF'
  | 'CAUSES'
  | 'PRODUCES'
  | 'DEPENDS_ON'
  | 'APPLICATION_OF'
  | 'REAL_WORLD_EXAMPLE'
  | 'CROSS_DISCIPLINARY'
  | 'COSMIC_ORIGIN';

export interface KnowledgeEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationship: RelationshipType;
  description: string;
  strength: number; // 0.0 to 1.0
  provenance: SourceProvenance;
}

// ============================================================================
// 3. LEARNER MODEL & STRICT EVIDENCE LEDGER
// ============================================================================

export interface LearnerContext {
  learnerId: string;
  name: string;
  gradeLevel: number;
  age: number;
  preferredModality?: 'VISUAL' | 'EXPERIMENTAL' | 'SOCRATIC_TEXT';
  interests?: string[];
}

export interface MisconceptionState {
  misconceptionId: string;
  conceptId: string;
  incorrectMentalModel: string;
  status: 'ACTIVE' | 'IN_REMEDIATION' | 'RESOLVED';
  detectedAt: string;
  resolvedAt?: string;
  evidenceKey: string;
}

export interface MasteryVector {
  recallScore: number;       // 0 - 100%
  applicationScore: number;  // 0 - 100%
  reasoningScore: number;    // 0 - 100%
  observationCount: number;
  totalAttempts: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'NEEDS_REMEDIATION' | 'MASTERED';
}

export interface LearnerState {
  learnerId: string;
  currentPosition: CurriculumPosition;
  masteryByConcept: Record<string, MasteryVector>;
  activeMisconceptions: MisconceptionState[];
  completedPageIds: string[];
  exploredConceptIds: string[];
  totalEvidenceCount: number;
  lastActiveAt: string;
}

export type CognitiveDimension = 'RECALL' | 'APPLICATION' | 'REASONING' | 'OBSERVATION' | 'EXPERIMENT';

export interface EvidenceEvent {
  id: string;
  learnerId: string;
  conceptId: string;
  curriculumPosition: CurriculumPosition;
  explorationNodeId?: string;
  dimension: CognitiveDimension;
  difficulty: 1 | 2 | 3 | 4 | 5;
  score: number; // strictly 0.0 to 1.0 float
  confidence: number; // 0.0 to 1.0
  isCorrect: boolean;
  learnerResponse: any;
  validationDetails: {
    isCorrect: boolean;
    feedback: string;
    rubricsMatched?: string[];
  };
  misconceptionTriggeredId?: string;
  misconceptionResolvedId?: string;
  timestamp: string;
  sha256EvidenceKey: string;
}

// ============================================================================
// 4. UNIFIED DECISION ACTION CONTRACT
// ============================================================================

export type NextActionType =
  | 'ADVANCE_CURRICULUM_PAGE'
  | 'REMEDIATE_MISCONCEPTION'
  | 'EXPLORE_UNIVERSE_REALM'
  | 'REINFORCE_FOUNDATION';

export interface NextRecommendedAction {
  actionType: NextActionType;
  reason: string;
  targetId?: string;
  stepIndex?: number;
}

// ============================================================================
// 5. MEDIA & EXTERNAL PROVIDER CONTRACTS WITH FALLBACKS
// ============================================================================

export type MediaAssetType =
  | 'IMAGE'
  | 'DIAGRAM'
  | 'ANIMATION'
  | 'VIDEO'
  | 'SIMULATION'
  | 'INTERACTIVE_WIDGET'
  | 'AUDIO_NARRATION';

export interface MediaRequirement {
  type: MediaAssetType;
  purpose: 'EXPLAIN' | 'COMPARE' | 'VISUALIZE' | 'DEMONSTRATE' | 'PREDICT' | 'EXPLORE';
  subject: string;
  conceptId: string;
  gradeLevel: number;
  generatedOrRetrieved: 'GENERATE' | 'RETRIEVE' | 'EITHER';
  constraints: {
    durationSeconds?: number;
    aspectRatio?: '1:1' | '16:9' | '4:3';
    interactivityLevel?: 'NONE' | 'CLICKABLE' | 'FULL_SIMULATION';
    ageAppropriate: boolean;
  };
}

export interface MediaAsset {
  id: string;
  requirementId?: string;
  type: MediaAssetType;
  url: string;
  altText: string;
  caption: string;
  provenance: SourceProvenance;
  cacheKey: string; // SHA256(type|subject|conceptId|gradeLevel)
  aspectRatio: string;
  thumbnailUrl?: string;
}

export interface KnowledgeRequest {
  query: string;
  targetConceptId: string;
  domain?: string;
  depthLevel: 'FOUNDATIONAL' | 'DEEP_SCIENCE' | 'COSMIC_ORIGIN';
  gradeLevel: number;
}

export interface KnowledgeResult {
  facts: string[];
  relationships: KnowledgeEdge[];
  provenance: SourceProvenance;
  safetyScore: number;
}

export interface IMediaProvider {
  resolveMedia(requirement: MediaRequirement): Promise<MediaAsset>;
  fallbackAsset?(requirement: MediaRequirement): MediaAsset;
  healthCheck(): Promise<boolean>;
}

export interface IKnowledgeProvider {
  retrieveKnowledge(request: KnowledgeRequest): Promise<KnowledgeResult>;
  healthCheck(): Promise<boolean>;
}

// ============================================================================
// 6. DYNAMIC LEARNING EXPERIENCE (SHOW / TEACH / TRY / GO DEEPER)
// ============================================================================

export interface ShowMeExperience {
  title: string;
  visualMechanismSteps: {
    icon: string;
    label: string;
    detail: string;
  }[];
  mediaAsset?: MediaAsset;
  interactiveDiagramType?: 'SEED_GROWTH' | 'SOLAR_TRANSIT' | 'HYDRAULIC_HEART' | 'RANGOLI_GRID' | 'AERODYNAMIC_LIFT';
}

export interface TeachMeExperience {
  socraticStepIndex: number;
  totalSocraticSteps: number;
  stageName: 'MEET_IDEA' | 'SEE_MECHANISM' | 'BIG_PURPOSE' | 'THINK_SCIENTIST' | 'SUPERPOWER_TRANSFER';
  groundedExplanation: string;
  childAnalogy: string;
  mentalModelText?: string;
  remediationMode: boolean;
  remediationDetails?: {
    socraticContrast: string;
    organComparisonCards?: { title: string; icon: string; description: string }[];
  };
}

export interface TryItExperience {
  activityType: 'SOCRATIC_QUESTION' | 'HANDS_ON_EXPERIMENT' | 'PREDICTION_CHALLENGE' | 'CREATIVE_DRAWING' | 'PANTRY_OBSERVATION';
  question?: {
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    misconceptionTrapByOption?: Record<number, string>;
  };
  handsOnExperiment?: {
    title: string;
    objective: string;
    steps: {
      stepNumber: number;
      action: 'OBSERVE' | 'MEASURE' | 'ACT' | 'PREDICT' | 'EXPLAIN';
      instruction: string;
      fieldKey?: string;
      unit?: string;
      defaultValue?: string;
    }[];
    rewardBadge: string;
  };
}

export interface GoDeeperExperience {
  currentConceptId: string;
  universeConstellation: {
    realmId: string;
    realmName: string;
    icon: string;
    provenance: ProvenanceType;
    tagline: string;
    shortDescription: string;
    targetNodeId: string;
  }[];
  cosmicTelescope?: {
    question: string;
    answer: string;
    cosmicDomain: string;
  };
}

export interface LearningExperience {
  id: string;
  planTimestamp: string;
  curriculumPosition: CurriculumPosition;
  concept: KnowledgeNode;
  
  // The 4 Modalities
  showMe: ShowMeExperience;
  teachMe: TeachMeExperience;
  tryIt: TryItExperience;
  goDeeper: GoDeeperExperience;

  // Next Decision from EKAGURU Mind
  nextRecommendedAction: NextRecommendedAction;
}

// ============================================================================
// 7. DUAL-SPINE EXPLORATION SESSION (STRICT STATE MACHINE)
// ============================================================================

export type ExplorationSessionStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'RETURNING'
  | 'COMPLETED'
  | 'ABANDONED';

export interface ExplorationNode {
  nodeId: string;
  conceptTitle: string;
  enteredAt: string;
  timeSpentSeconds: number;
  evidenceCollected: EvidenceEvent[];
}

export interface ExplorationSession {
  sessionId: string;
  learnerId: string;
  status: ExplorationSessionStatus;
  
  // Anchors
  originCurriculumPosition: CurriculumPosition;
  currentExplorationNodeId: string;
  parentExplorationNodeId?: string;
  explorationTrail: ExplorationNode[];
  branchDepth: number;
  
  // Evidence
  evidenceEventsCollected: EvidenceEvent[];
  
  // Return Point
  isExploring: boolean;
  returnToCurriculumPage: number; // e.g. Page 1
  nextCurriculumPageOnComplete: number; // e.g. Page 2
}
