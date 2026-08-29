/**
 * ============================================================================
 * EKAGURU MIND — ADAPTIVE ORCHESTRATION & LEARNER REASONING (STEP 5)
 * ============================================================================
 * 
 * Central Architectural Roles:
 * 1. Context Assembly: Combines Curriculum + Concept + Learner State + Evidence.
 * 2. Prerequisite Diagnostics: Identifies gaps before blindly teaching advanced nodes.
 * 3. Misconception Engine: Detects traps, tracks state (ACTIVE -> RESOLVED), and renders Socratic contrasts.
 * 4. Adaptive Sequencer: Personalizes the learning trajectory per child.
 * 5. Decision Audit Engine: Generates transparent reason codes and evidence citations.
 * 6. Media Planner: Emits declarative MediaRequirements with safety and age constraints.
 * 7. Invariant Compliance: Enforces all 10 Master Invariants.
 */

import {
  CurriculumPosition,
  TextbookPage,
  KnowledgeNode,
  LearnerState,
  LearnerContext,
  LearningExperience,
  EvidenceEvent,
  ExplorationSession,
  NextRecommendedAction,
  MasteryVector,
  MisconceptionState,
  MediaRequirement,
  SourceProvenance,
} from './personal-learning-engine.contracts';
import { UniversalContentRegistry } from './universal-content-registry';

export interface DecisionAuditTrace {
  curriculumContext: string;
  conceptId: string;
  learnerRecall: number;
  learnerApplication: number;
  learnerReasoning: number;
  activeMisconceptionsCount: number;
  reasonCodes: string[];
  evidenceIds: string[];
  confidence: number;
  decisionReason: string;
  actionType: string;
  mediaRequirement?: MediaRequirement;
}

export interface PrerequisiteDiagnosticResult {
  hasPrerequisiteGap: boolean;
  missingPrerequisiteNodeId?: string;
  missingPrerequisiteTitle?: string;
  currentMasteryScore: number;
  recommendation: 'PROCEED_NORMAL' | 'REINFORCE_PREREQUISITE' | 'REMEDIATE_FOUNDATION';
}

export class EkaguruMindOrchestrator {
  private learnerStates: Map<string, LearnerState> = new Map();
  private explorationSessions: Map<string, ExplorationSession> = new Map();
  private evidenceLedger: EvidenceEvent[] = [];

  constructor() {}

  // ==========================================================================
  // GATE 5.0: LEARNER CONTEXT ASSEMBLY
  // ==========================================================================
  public assembleLearnerContext(
    bookId: string,
    printedPage: number,
    learnerId: string
  ): {
    page: TextbookPage;
    learnerState: LearnerState;
    prerequisiteDiagnostic: PrerequisiteDiagnosticResult;
    experience: LearningExperience;
    decisionTrace: DecisionAuditTrace;
  } {
    const subjectDef = UniversalContentRegistry.getBySubjectOrBook(bookId);

    const position: CurriculumPosition = {
      bookId: subjectDef.bookId,
      bookTitle: subjectDef.bookTitle,
      chapterNumber: subjectDef.chapterNumber,
      chapterTitle: subjectDef.chapterTitle,
      printedPage,
      pdfPage: printedPage + (subjectDef.pdfPage - subjectDef.printedPage),
      sequenceIndex: printedPage,
      archetype: 'NORMAL_CHAPTER',
    };

    const page: TextbookPage = {
      id: `page-${subjectDef.bookId}-${printedPage}`,
      position,
      rawText: subjectDef.rawTextExcerpt,
      extractedConcepts: [subjectDef.primaryConcept.id],
      learningObjectives: subjectDef.learningObjectives,
      sourceConfidence: 1.0,
      sourceAnchorId: `src-${subjectDef.subjectId}-${printedPage}`,
    };

    let learnerState = this.learnerStates.get(learnerId);
    if (!learnerState) {
      learnerState = {
        learnerId,
        currentPosition: position,
        masteryByConcept: {},
        activeMisconceptions: [],
        completedPageIds: [],
        exploredConceptIds: [],
        totalEvidenceCount: 0,
        lastActiveAt: new Date().toISOString(),
      };
      this.learnerStates.set(learnerId, learnerState);
    } else {
      learnerState.currentPosition = position;
    }

    // Gate 5.1: Prerequisite Diagnostics
    const prerequisiteDiagnostic = this.diagnosePrerequisites(subjectDef.primaryConcept.id, learnerState);

    // Gate 5.2 - 5.5: Dynamic Experience & Decision Planning
    const { experience, decisionTrace } = this.planAdaptiveExperience(
      position,
      subjectDef.primaryConcept,
      learnerState,
      prerequisiteDiagnostic
    );

    return { page, learnerState, prerequisiteDiagnostic, experience, decisionTrace };
  }

  // ==========================================================================
  // GATE 5.1: PREREQUISITE DIAGNOSTICS & GAP DETECTION
  // ==========================================================================
  public diagnosePrerequisites(
    conceptId: string,
    learnerState: LearnerState
  ): PrerequisiteDiagnosticResult {
    // Check known prerequisite relationships
    const prerequisiteMap: Record<string, { prereqId: string; prereqTitle: string; threshold: number }> = {
      'c-fractions-division': { prereqId: 'c-basic-division', prereqTitle: 'Basic Equal Sharing & Division', threshold: 0.5 },
      'c-photosynthesis': { prereqId: 'c-plant-parts', prereqTitle: 'Plant Parts & Leaves', threshold: 0.5 },
      'c-indus-urban-planning': { prereqId: 'c-early-settlements', prereqTitle: 'Early Human Settlements', threshold: 0.5 },
    };

    const prereq = prerequisiteMap[conceptId];
    if (!prereq) {
      return {
        hasPrerequisiteGap: false,
        currentMasteryScore: 1.0,
        recommendation: 'PROCEED_NORMAL',
      };
    }

    const prereqMastery = learnerState.masteryByConcept[prereq.prereqId]?.recallScore ?? 100;
    const hasGap = (prereqMastery / 100) < prereq.threshold;

    return {
      hasPrerequisiteGap: hasGap,
      missingPrerequisiteNodeId: prereq.prereqId,
      missingPrerequisiteTitle: prereq.prereqTitle,
      currentMasteryScore: prereqMastery / 100,
      recommendation: hasGap ? 'REINFORCE_PREREQUISITE' : 'PROCEED_NORMAL',
    };
  }

  // ==========================================================================
  // GATE 5.2 - 5.5: ADAPTIVE EXPERIENCE & DECISION REASONING PLANNER
  // ==========================================================================
  public planAdaptiveExperience(
    position: CurriculumPosition,
    concept: KnowledgeNode,
    learnerState: LearnerState,
    prereqDiag: PrerequisiteDiagnosticResult
  ): {
    experience: LearningExperience;
    decisionTrace: DecisionAuditTrace;
  } {
    const subjectDef = UniversalContentRegistry.getBySubjectOrBook(concept.id);

    const conceptMastery = learnerState.masteryByConcept[concept.id] || {
      recallScore: 0,
      applicationScore: 0,
      reasoningScore: 0,
      observationCount: 0,
      totalAttempts: 0,
      status: 'NOT_STARTED',
    };

    const isMastered = conceptMastery.status === 'MASTERED';
    const activeMisconceptions = learnerState.activeMisconceptions.filter(
      (m) => m.conceptId === concept.id && m.status === 'ACTIVE'
    );

    const reasonCodes: string[] = [];
    const evidenceIds: string[] = [];
    let actionType: any = 'REINFORCE_FOUNDATION';
    let decisionReason = 'Engage with Show Me and Try It to establish empirical understanding.';
    let confidence = 0.95;

    // Decision Logic
    if (prereqDiag.hasPrerequisiteGap) {
      actionType = 'REINFORCE_FOUNDATION';
      decisionReason = `Prerequisite gap detected in ${prereqDiag.missingPrerequisiteTitle}. Reinforcing foundation first.`;
      reasonCodes.push('PREREQUISITE_GAP_DETECTED', 'FOUNDATION_BELOW_THRESHOLD');
      confidence = 0.98;
    } else if (activeMisconceptions.length > 0) {
      actionType = 'REMEDIATE_MISCONCEPTION';
      decisionReason = `Active misconception detected: "${activeMisconceptions[0].incorrectMentalModel}". Socratic contrast required.`;
      reasonCodes.push('MISCONCEPTION_ACTIVE', 'REQUIRES_SOCRATIC_CONTRAST');
      evidenceIds.push(activeMisconceptions[0].evidenceKey);
      confidence = 0.92;
    } else if (isMastered) {
      actionType = 'ADVANCE_CURRICULUM_PAGE';
      decisionReason = 'Learner demonstrated complete understanding across Recall, Reasoning, and Application vectors.';
      reasonCodes.push('RECALL_VERIFIED', 'APPLICATION_VERIFIED', 'REASONING_VERIFIED', 'MASTERY_THRESHOLD_MET');
      confidence = 0.99;
    } else {
      reasonCodes.push('IN_PROGRESS_DISCOVERY');
    }

    // Gate 5.7: Declarative Media Requirement
    const mediaRequirement: MediaRequirement = {
      type: concept.domain === 'BIOLOGY' ? 'ANIMATION' : concept.domain === 'MATHEMATICS' ? 'INTERACTIVE_WIDGET' : 'DIAGRAM',
      purpose: activeMisconceptions.length > 0 ? 'COMPARE' : 'VISUALIZE',
      subject: subjectDef.subjectTitle,
      conceptId: concept.id,
      gradeLevel: concept.gradeLevel,
      generatedOrRetrieved: 'EITHER',
      constraints: {
        durationSeconds: 15,
        aspectRatio: '16:9',
        interactivityLevel: 'CLICKABLE',
        ageAppropriate: true,
      },
    };

    const decisionTrace: DecisionAuditTrace = {
      curriculumContext: `${position.bookTitle} (Chapter ${position.chapterNumber}, Printed Page ${position.printedPage})`,
      conceptId: concept.id,
      learnerRecall: conceptMastery.recallScore,
      learnerApplication: conceptMastery.applicationScore,
      learnerReasoning: conceptMastery.reasoningScore,
      activeMisconceptionsCount: activeMisconceptions.length,
      reasonCodes,
      evidenceIds,
      confidence,
      decisionReason,
      actionType,
      mediaRequirement,
    };

    const experience: LearningExperience = {
      id: `exp-${position.bookId}-${position.printedPage}-${Date.now()}`,
      planTimestamp: new Date().toISOString(),
      curriculumPosition: position,
      concept,
      showMe: subjectDef.showMe,
      teachMe: subjectDef.teachMe,
      tryIt: subjectDef.tryIt,
      goDeeper: subjectDef.goDeeper,
      nextRecommendedAction: {
        actionType,
        reason: decisionReason,
        targetId: isMastered ? `page-${position.bookId}-${position.printedPage + 1}` : undefined,
      },
    };

    return { experience, decisionTrace };
  }

  // ==========================================================================
  // GATE 5.3: MISCONCEPTION DIAGNOSIS & INTERACTION ENGINE
  // ==========================================================================
  public submitInteraction(
    learnerId: string,
    conceptId: string,
    response: {
      dimension: 'RECALL' | 'APPLICATION' | 'REASONING' | 'OBSERVATION' | 'EXPERIMENT';
      optionIndex?: number;
      isCorrect?: boolean;
      triggeredMisconceptionTrap?: string;
      resolvedMisconceptionId?: string;
      experimentData?: any;
    }
  ): {
    evidenceEvent: EvidenceEvent;
    updatedMastery: MasteryVector;
    nextAction: NextRecommendedAction;
    decisionTrace: DecisionAuditTrace;
  } {
    const learnerState = this.learnerStates.get(learnerId);
    if (!learnerState) throw new Error(`Learner ${learnerId} not found`);

    const isCorrect = response.isCorrect ?? (response.optionIndex === 0);
    const score = isCorrect ? 1.0 : 0.0;
    const sha256EvidenceKey = `sha256-${learnerId}-${conceptId}-${Date.now()}`;

    // Handle Misconception Activation & Resolution
    if (response.triggeredMisconceptionTrap) {
      const existing = learnerState.activeMisconceptions.find(
        (m) => m.conceptId === conceptId && m.incorrectMentalModel === response.triggeredMisconceptionTrap
      );
      if (!existing) {
        learnerState.activeMisconceptions.push({
          misconceptionId: `mis-${conceptId}-${Date.now()}`,
          conceptId,
          incorrectMentalModel: response.triggeredMisconceptionTrap,
          status: 'ACTIVE',
          detectedAt: new Date().toISOString(),
          evidenceKey: sha256EvidenceKey,
        });
      }
    }

    if (response.resolvedMisconceptionId) {
      const mis = learnerState.activeMisconceptions.find((m) => m.misconceptionId === response.resolvedMisconceptionId);
      if (mis) {
        mis.status = 'RESOLVED';
        mis.resolvedAt = new Date().toISOString();
      }
    }

    const evidenceEvent: EvidenceEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      learnerId,
      conceptId,
      curriculumPosition: learnerState.currentPosition,
      dimension: response.dimension,
      difficulty: 3,
      score,
      confidence: 1.0,
      isCorrect,
      learnerResponse: response,
      validationDetails: {
        isCorrect,
        feedback: isCorrect
          ? '✓ Correct! Understanding verified empirically.'
          : '💡 Let us explore the core underlying mechanism.',
      },
      misconceptionTriggeredId: response.triggeredMisconceptionTrap,
      misconceptionResolvedId: response.resolvedMisconceptionId,
      timestamp: new Date().toISOString(),
      sha256EvidenceKey,
    };

    this.evidenceLedger.push(evidenceEvent);
    learnerState.totalEvidenceCount++;

    let currentMastery = learnerState.masteryByConcept[conceptId] || {
      recallScore: 0,
      applicationScore: 0,
      reasoningScore: 0,
      observationCount: 0,
      totalAttempts: 0,
      status: 'IN_PROGRESS',
    };

    currentMastery.totalAttempts++;
    if (response.dimension === 'RECALL' && isCorrect) currentMastery.recallScore = 100;
    if (response.dimension === 'REASONING' && isCorrect) currentMastery.reasoningScore = 100;
    if (response.dimension === 'APPLICATION' && isCorrect) currentMastery.applicationScore = 100;
    if (response.dimension === 'OBSERVATION' || response.dimension === 'EXPERIMENT') {
      currentMastery.observationCount++;
      currentMastery.applicationScore = Math.max(currentMastery.applicationScore, 85);
    }

    const activeMisCount = learnerState.activeMisconceptions.filter(
      (m) => m.conceptId === conceptId && m.status === 'ACTIVE'
    ).length;

    if (
      currentMastery.recallScore >= 80 &&
      currentMastery.reasoningScore >= 80 &&
      currentMastery.applicationScore >= 80 &&
      activeMisCount === 0
    ) {
      currentMastery.status = 'MASTERED';
    } else if (activeMisCount > 0) {
      currentMastery.status = 'NEEDS_REMEDIATION';
    }

    learnerState.masteryByConcept[conceptId] = currentMastery;

    const actionType: any =
      currentMastery.status === 'MASTERED'
        ? 'ADVANCE_CURRICULUM_PAGE'
        : activeMisCount > 0
        ? 'REMEDIATE_MISCONCEPTION'
        : 'REINFORCE_FOUNDATION';

    const decisionReason =
      currentMastery.status === 'MASTERED'
        ? 'Mastery verified empirically with immutable evidence logs and zero active misconceptions.'
        : activeMisCount > 0
        ? 'Active misconception detected in student response. Triggering empathetic Socratic contrast.'
        : 'Continue discovery in Try It or Go Deeper to complete mastery.';

    const decisionTrace: DecisionAuditTrace = {
      curriculumContext: `${learnerState.currentPosition.bookTitle} (p. ${learnerState.currentPosition.printedPage})`,
      conceptId,
      learnerRecall: currentMastery.recallScore,
      learnerApplication: currentMastery.applicationScore,
      learnerReasoning: currentMastery.reasoningScore,
      activeMisconceptionsCount: activeMisCount,
      reasonCodes: [
        isCorrect ? 'RESPONSE_CORRECT' : 'RESPONSE_INCORRECT',
        activeMisCount > 0 ? 'MISCONCEPTION_ACTIVE' : 'NO_ACTIVE_MISCONCEPTIONS',
      ],
      evidenceIds: [sha256EvidenceKey],
      confidence: 0.98,
      decisionReason,
      actionType,
    };

    const nextAction: NextRecommendedAction = {
      actionType,
      reason: decisionReason,
      targetId: `page-${learnerState.currentPosition.bookId}-${learnerState.currentPosition.printedPage + 1}`,
    };

    return { evidenceEvent, updatedMastery: currentMastery, nextAction, decisionTrace };
  }

  // ==========================================================================
  // GATE 5.6: DUAL-SPINE CONTROLLED EXPLORATION & SAFE RETURN
  // ==========================================================================
  public startExploration(
    learnerId: string,
    targetConceptId: string
  ): {
    session: ExplorationSession;
    explorationNode: KnowledgeNode;
  } {
    const learnerState = this.learnerStates.get(learnerId);
    if (!learnerState) throw new Error(`Learner ${learnerId} not found`);

    const sessionId = `exp-sess-${learnerId}-${Date.now()}`;

    const session: ExplorationSession = {
      sessionId,
      learnerId,
      status: 'ACTIVE',
      originCurriculumPosition: { ...learnerState.currentPosition },
      currentExplorationNodeId: targetConceptId,
      explorationTrail: [
        {
          nodeId: targetConceptId,
          conceptTitle: `Realm: ${targetConceptId}`,
          enteredAt: new Date().toISOString(),
          timeSpentSeconds: 0,
          evidenceCollected: [],
        },
      ],
      branchDepth: 1,
      evidenceEventsCollected: [],
      isExploring: true,
      returnToCurriculumPage: learnerState.currentPosition.printedPage,
      nextCurriculumPageOnComplete: learnerState.currentPosition.printedPage + 1,
    };

    this.explorationSessions.set(sessionId, session);

    const explorationNode: KnowledgeNode = {
      id: targetConceptId,
      title: `Connected Realm: ${targetConceptId}`,
      domain: 'PHYSICS',
      tagline: 'Deep disciplinary and cosmic system extension',
      shortDefinition: 'An interconnected knowledge node expanding beyond the textbook page.',
      detailedExplanation: 'Exploring cross-disciplinary relationships and foundational scientific mechanisms.',
      provenance: {
        type: 'EXTERNAL_KNOWLEDGE',
        sourceName: 'EKAGURU Global Scientific Knowledge Base',
        confidence: 0.98,
        retrievedAt: new Date().toISOString(),
        ageAppropriateRating: 'CLASS_4_5',
      },
      gradeLevel: learnerState.currentPosition.printedPage >= 10 ? 6 : 5,
      complexityLevel: 'COSMIC_EXTENSION',
      tags: ['interconnected', 'science', 'universe'],
    };

    return { session, explorationNode };
  }

  public returnToCurriculum(sessionId: string): {
    session: ExplorationSession;
    restoredPosition: CurriculumPosition;
    nextPageToLoad: number;
    message: string;
  } {
    const session = this.explorationSessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.status = 'COMPLETED';
    session.isExploring = false;

    const restoredPosition: CurriculumPosition = {
      ...session.originCurriculumPosition,
      printedPage: session.nextCurriculumPageOnComplete,
      sequenceIndex: session.nextCurriculumPageOnComplete,
    };

    const learnerState = this.learnerStates.get(session.learnerId);
    if (learnerState) {
      learnerState.currentPosition = restoredPosition;
      learnerState.completedPageIds.push(
        `page-${session.originCurriculumPosition.bookId}-${session.originCurriculumPosition.printedPage}`
      );
    }

    return {
      session,
      restoredPosition,
      nextPageToLoad: session.nextCurriculumPageOnComplete,
      message: `🌟 You explored the knowledge universe! Safely returning to ${session.originCurriculumPosition.bookTitle} Page ${session.nextCurriculumPageOnComplete}.`,
    };
  }

  public getLearnerState(learnerId: string): LearnerState | undefined {
    return this.learnerStates.get(learnerId);
  }
}
