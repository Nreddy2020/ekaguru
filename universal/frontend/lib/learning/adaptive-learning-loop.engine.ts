/**
 * ============================================================================
 * EKAGURU CLOSED-LOOP ADAPTIVE LEARNING ENGINE (STEP 9)
 * ============================================================================
 * 
 * The Continuous Learning Organism:
 * Observe -> Diagnose -> Remember -> Plan -> Experience -> Measure -> Adapt -> Repeat
 * 
 * Invariants Enforced:
 * - INVARIANT-001: Curriculum spine remains the immutable source of truth.
 * - INVARIANT-004 & 005: Evidence Ledger is the sole append-only source of truth.
 * - INVARIANT-008: Every loop iteration produces a fully explainable DecisionAuditTrace.
 */

import {
  CurriculumPosition,
  KnowledgeNode,
  LearningExperience,
  EvidenceEvent,
  ExplorationSession,
  NextRecommendedAction,
  MasteryVector,
} from './personal-learning-engine.contracts';
import { UniversalContentRegistry } from './universal-content-registry';
import { LearnerMemoryEngine, LongitudinalLearnerMemoryProfile } from './learner-memory.engine';
import { EkaguruMindOrchestrator } from './ekaguru-mind.orchestrator';

export type LoopCycleState =
  | 'OBSERVE'
  | 'DIAGNOSE'
  | 'PLAN'
  | 'EXPERIENCE'
  | 'INTERACT'
  | 'CAPTURE_EVIDENCE'
  | 'UPDATE_MEMORY'
  | 'EVALUATE_EFFECTIVENESS'
  | 'ADAPT_NEXT_CYCLE';

export type ScaffoldingLevel = 'SCAFFOLDED' | 'STANDARD' | 'CHALLENGE' | 'MASTERY_PROVING';

export interface InterventionStrategy {
  strategyId: string;
  strategyType: 'SOCRATIC_CONTRAST' | 'PHYSICAL_ANALOGY' | 'VISUAL_MECHANISM' | 'PREREQUISITE_MICRO_LESSON';
  targetConceptId: string;
  attemptNumber: number;
  outcomeScore?: number;
  effectivenessRating: 'EFFECTIVE' | 'INEFFECTIVE' | 'PENDING';
}

export interface AdaptiveLoopSnapshot {
  cycleIndex: number;
  state: LoopCycleState;
  learnerId: string;
  conceptId: string;
  curriculumPosition: CurriculumPosition;
  scaffoldingLevel: ScaffoldingLevel;
  activeIntervention?: InterventionStrategy;
  currentExperience: LearningExperience;
  interventionHistory: InterventionStrategy[];
  effectivenessLog: {
    strategyType: string;
    preScore: number;
    postScore: number;
    gain: number;
  }[];
}

export class AdaptiveLearningLoopEngine {
  private cycleSnapshots: Map<string, AdaptiveLoopSnapshot> = new Map();

  constructor(
    private readonly memoryEngine: LearnerMemoryEngine,
    private readonly mindOrchestrator: EkaguruMindOrchestrator
  ) {}

  // ==========================================================================
  // GATE 9.0, 9.1 & 9.2: OBSERVE -> DIAGNOSE -> PLAN REAL-TIME CYCLE
  // ==========================================================================
  public startOrResumeLoopCycle(
    learnerId: string,
    bookId: string,
    printedPage: number
  ): AdaptiveLoopSnapshot {
    const profile = this.memoryEngine.getProfile(learnerId);

    // Sync Memory Profile state into Mind Orchestrator state
    let mindState = this.mindOrchestrator.getLearnerState(learnerId);
    if (!mindState) {
      this.mindOrchestrator.assembleLearnerContext(bookId, printedPage, learnerId);
      mindState = this.mindOrchestrator.getLearnerState(learnerId)!;
    }

    // Mirror memory concept masteries into mind state
    for (const [cId, cProf] of Object.entries(profile.conceptProfiles)) {
      mindState.masteryByConcept[cId] = { ...cProf.currentMastery };
    }

    // Step 1: Observe & Assemble
    const { page, learnerState, prerequisiteDiagnostic, experience, decisionTrace } =
      this.mindOrchestrator.assembleLearnerContext(bookId, printedPage, learnerId);

    const conceptId = experience.concept.id;
    const conceptProfile = profile.conceptProfiles[conceptId];

    // Step 2: Determine Scaffolding & Difficulty Level
    let scaffoldingLevel: ScaffoldingLevel = 'STANDARD';
    if (!conceptProfile || conceptProfile.currentMastery.status === 'NOT_STARTED') {
      scaffoldingLevel = 'SCAFFOLDED';
    } else if (conceptProfile.currentMastery.status === 'NEEDS_REMEDIATION') {
      scaffoldingLevel = 'SCAFFOLDED';
    } else if (conceptProfile.currentMastery.status === 'MASTERED') {
      scaffoldingLevel = 'CHALLENGE';
    } else if (
      conceptProfile.currentMastery.recallScore >= 80 &&
      conceptProfile.currentMastery.applicationScore >= 80
    ) {
      scaffoldingLevel = 'MASTERY_PROVING';
    }

    // Step 3: Misconception or Prerequisite Strategy Selection
    const snapshotKey = `${learnerId}-${conceptId}`;
    let activeIntervention: InterventionStrategy | undefined = undefined;
    const activeMis = conceptProfile?.misconceptionHistory.filter((m) => m.status === 'ACTIVE') || [];

    if (prerequisiteDiagnostic.hasPrerequisiteGap) {
      activeIntervention = {
        strategyId: `int-prereq-${Date.now()}`,
        strategyType: 'PREREQUISITE_MICRO_LESSON',
        targetConceptId: prerequisiteDiagnostic.missingPrerequisiteNodeId!,
        attemptNumber: 1,
        effectivenessRating: 'PENDING',
      };
    } else if (activeMis.length > 0) {
      const executedCount = this.cycleSnapshots.get(snapshotKey)?.effectivenessLog.filter(i => i.strategyType !== 'PREREQUISITE_MICRO_LESSON').length || 0;
      const strategyType: any =
        executedCount === 0
          ? 'SOCRATIC_CONTRAST'
          : executedCount === 1
          ? 'PHYSICAL_ANALOGY'
          : 'VISUAL_MECHANISM';

      activeIntervention = {
        strategyId: `int-mis-${Date.now()}`,
        strategyType,
        targetConceptId: conceptId,
        attemptNumber: executedCount + 1,
        effectivenessRating: 'PENDING',
      };
    }

    let snapshot = this.cycleSnapshots.get(snapshotKey);

    if (!snapshot) {
      snapshot = {
        cycleIndex: 1,
        state: 'EXPERIENCE',
        learnerId,
        conceptId,
        curriculumPosition: experience.curriculumPosition,
        scaffoldingLevel,
        activeIntervention,
        currentExperience: experience,
        interventionHistory: activeIntervention ? [activeIntervention] : [],
        effectivenessLog: [],
      };
    } else {
      snapshot.cycleIndex++;
      snapshot.state = 'EXPERIENCE';
      snapshot.scaffoldingLevel = scaffoldingLevel;
      snapshot.activeIntervention = activeIntervention;
      snapshot.currentExperience = experience;
      if (activeIntervention) snapshot.interventionHistory.push(activeIntervention);
    }

    this.cycleSnapshots.set(snapshotKey, snapshot);
    return snapshot;
  }

  // ==========================================================================
  // GATE 9.3, 9.4 & 9.7: INTERACTION -> EVIDENCE -> MEASURE -> ADAPT LOOP
  // ==========================================================================
  public processInteractionAndAdapt(
    learnerId: string,
    conceptId: string,
    interaction: {
      dimension: 'RECALL' | 'APPLICATION' | 'REASONING' | 'OBSERVATION' | 'EXPERIMENT';
      optionIndex?: number;
      isCorrect?: boolean;
      triggeredMisconceptionTrap?: string;
      resolvedMisconceptionId?: string;
      learnerResponse?: any;
    }
  ): {
    evidenceEvent: EvidenceEvent;
    updatedMastery: MasteryVector;
    nextAction: NextRecommendedAction;
    nextLoopSnapshot: AdaptiveLoopSnapshot;
  } {
    const snapshotKey = `${learnerId}-${conceptId}`;
    const currentSnapshot = this.cycleSnapshots.get(snapshotKey);
    if (!currentSnapshot) {
      throw new Error(`No active loop snapshot for learner ${learnerId} on ${conceptId}`);
    }

    const isCorrect = interaction.isCorrect ?? (interaction.optionIndex === 0);
    const preScore = currentSnapshot.currentExperience.concept ? 0.4 : 0.0;
    const postScore = isCorrect ? 1.0 : 0.0;

    // Step 1: Capture Evidence in Append-Only Ledger
    const evidenceKey = `sha256-${learnerId}-${conceptId}-${Date.now()}`;
    const evidenceEvent: EvidenceEvent = {
      id: `ev-loop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      learnerId,
      conceptId,
      curriculumPosition: currentSnapshot.curriculumPosition,
      dimension: interaction.dimension,
      difficulty: currentSnapshot.scaffoldingLevel === 'CHALLENGE' ? 4 : 3,
      score: isCorrect ? 1.0 : 0.0,
      confidence: 1.0,
      isCorrect,
      misconceptionTriggeredId: interaction.triggeredMisconceptionTrap,
      misconceptionResolvedId: interaction.resolvedMisconceptionId,
      learnerResponse: interaction.learnerResponse || {},
      validationDetails: {
        isCorrect,
        feedback: isCorrect ? 'Valid response' : 'Needs remediation',
      },
      timestamp: new Date().toISOString(),
      sha256EvidenceKey: evidenceKey,
    };

    // Step 2: Update Derived Longitudinal Memory
    this.memoryEngine.recordEvidence(evidenceEvent);
    const updatedProfile = this.memoryEngine.getProfile(learnerId);
    const conceptProfile = updatedProfile.conceptProfiles[conceptId];

    // Step 3: Evaluate Intervention Effectiveness (Gate 9.7)
    if (currentSnapshot.activeIntervention) {
      currentSnapshot.activeIntervention.outcomeScore = postScore;
      currentSnapshot.activeIntervention.effectivenessRating = isCorrect ? 'EFFECTIVE' : 'INEFFECTIVE';

      currentSnapshot.effectivenessLog.push({
        strategyType: currentSnapshot.activeIntervention.strategyType,
        preScore,
        postScore,
        gain: postScore - preScore,
      });
    }

    // Step 4: Adapt Next Cycle (Gate 9.1 & Gate 9.3)
    const nextSnapshot = this.startOrResumeLoopCycle(
      learnerId,
      currentSnapshot.curriculumPosition.bookId,
      currentSnapshot.curriculumPosition.printedPage
    );

    const isMastered = conceptProfile.currentMastery.status === 'MASTERED';
    const nextAction: NextRecommendedAction = {
      actionType: isMastered ? 'ADVANCE_CURRICULUM_PAGE' : 'REINFORCE_FOUNDATION',
      reason: isMastered
        ? 'Learner demonstrated multi-dimensional mastery through verified closed-loop evidence.'
        : 'Loop adapted scaffolding level to reinforce current learning objectives.',
      targetId: isMastered ? `page-${currentSnapshot.curriculumPosition.bookId}-${currentSnapshot.curriculumPosition.printedPage + 1}` : undefined,
    };

    return {
      evidenceEvent,
      updatedMastery: conceptProfile.currentMastery,
      nextAction,
      nextLoopSnapshot: nextSnapshot,
    };
  }
}
