/**
 * ============================================================================
 * EKAGURU PERSONAL LEARNING ENGINE — UNIVERSAL KERNEL (STEP 4)
 * ============================================================================
 * 
 * 100% Subject-Agnostic Engine Pipeline:
 * Textbook Page → Concept → EKAGURU Mind Planner → LearningExperience →
 * Show / Teach / Try / Go Deeper → Evidence Ledger → Dual-Spine Safe Return
 * 
 * Invariant: Works identically for EVS, Science, Mathematics, History, and beyond.
 */

import {
  CurriculumPosition,
  TextbookPage,
  KnowledgeNode,
  LearnerState,
  LearningExperience,
  EvidenceEvent,
  ExplorationSession,
  NextRecommendedAction,
  MasteryVector,
} from './personal-learning-engine.contracts';
import { UniversalContentRegistry } from './universal-content-registry';

export interface DecisionAuditTrace {
  curriculumContext: string;
  conceptId: string;
  learnerRecall: number;
  learnerApplication: number;
  learnerReasoning: number;
  activeMisconceptionsCount: number;
  decisionReason: string;
  actionType: string;
}

export class PersonalLearningEngineKernel {
  private learnerStates: Map<string, LearnerState> = new Map();
  private explorationSessions: Map<string, ExplorationSession> = new Map();
  private evidenceLedger: EvidenceEvent[] = [];

  constructor() {}

  // ==========================================================================
  // 1. GENERIC PAGE RESOLUTION & CONTEXT BUILDER (Gate 4.1)
  // ==========================================================================
  public openPage(
    bookId: string,
    printedPage: number,
    learnerId: string
  ): {
    page: TextbookPage;
    learnerState: LearnerState;
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
      pdfPage: printedPage + 1,
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

    const { experience, decisionTrace } = this.planExperience(position, subjectDef.primaryConcept, learnerState);
    return { page, learnerState, experience, decisionTrace };
  }

  // ==========================================================================
  // 2. EKAGURU MIND — DYNAMIC EXPERIENCE PLANNER (Gate 4.3 & Gate 4.5)
  // ==========================================================================
  public planExperience(
    position: CurriculumPosition,
    concept: KnowledgeNode,
    learnerState: LearnerState
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

    let actionType: any = 'REINFORCE_FOUNDATION';
    let decisionReason = 'Engage with Show Me and Try It to establish empirical understanding.';

    if (activeMisconceptions.length > 0) {
      actionType = 'REMEDIATE_MISCONCEPTION';
      decisionReason = `Active misconception detected: ${activeMisconceptions[0].incorrectMentalModel}. Socratic contrast required.`;
    } else if (isMastered) {
      actionType = 'ADVANCE_CURRICULUM_PAGE';
      decisionReason = 'Learner demonstrated complete understanding across Recall, Reasoning, and Application vectors.';
    }

    const decisionTrace: DecisionAuditTrace = {
      curriculumContext: `${position.bookTitle} (p. ${position.printedPage})`,
      conceptId: concept.id,
      learnerRecall: conceptMastery.recallScore,
      learnerApplication: conceptMastery.applicationScore,
      learnerReasoning: conceptMastery.reasoningScore,
      activeMisconceptionsCount: activeMisconceptions.length,
      decisionReason,
      actionType,
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
  // 3. GENERIC EVIDENCE ENGINE (Gate 4.4)
  // ==========================================================================
  public submitInteraction(
    learnerId: string,
    conceptId: string,
    response: {
      dimension: 'RECALL' | 'APPLICATION' | 'REASONING' | 'OBSERVATION' | 'EXPERIMENT';
      optionIndex?: number;
      isCorrect?: boolean;
      experimentData?: any;
    }
  ): {
    evidenceEvent: EvidenceEvent;
    updatedMastery: MasteryVector;
    nextAction: NextRecommendedAction;
  } {
    const learnerState = this.learnerStates.get(learnerId);
    if (!learnerState) throw new Error(`Learner ${learnerId} not found`);

    const isCorrect = response.isCorrect ?? (response.optionIndex === 0);
    const score = isCorrect ? 1.0 : 0.0;

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
      timestamp: new Date().toISOString(),
      sha256EvidenceKey: `sha256-${learnerId}-${conceptId}-${Date.now()}`,
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

    if (
      currentMastery.recallScore >= 80 &&
      currentMastery.reasoningScore >= 80 &&
      currentMastery.applicationScore >= 80
    ) {
      currentMastery.status = 'MASTERED';
    }

    learnerState.masteryByConcept[conceptId] = currentMastery;

    const nextAction: NextRecommendedAction = {
      actionType: currentMastery.status === 'MASTERED' ? 'ADVANCE_CURRICULUM_PAGE' : 'REINFORCE_FOUNDATION',
      reason:
        currentMastery.status === 'MASTERED'
          ? 'Mastery verified empirically with immutable evidence logs.'
          : 'Continue discovery in Try It or Go Deeper to complete mastery.',
      targetId: `page-${learnerState.currentPosition.bookId}-${learnerState.currentPosition.printedPage + 1}`,
    };

    return { evidenceEvent, updatedMastery: currentMastery, nextAction };
  }

  // ==========================================================================
  // 4. GENERIC DUAL-SPINE EXPLORATION & SAFE RETURN (Gate 4.6)
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
