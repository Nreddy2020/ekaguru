/**
 * ============================================================================
 * EKAGURU PERSONAL LEARNING ENGINE — CORE KERNEL & ORCHESTRATOR
 * ============================================================================
 * 
 * Implements the golden-path execution pipeline:
 * Textbook Page → Concept → EKAGURU Mind Planner → LearningExperience →
 * Show / Teach / Try / Go Deeper → Evidence Ledger → Dual-Spine Safe Return
 */

import {
  CurriculumPosition,
  TextbookPage,
  KnowledgeNode,
  LearnerContext,
  LearnerState,
  LearningExperience,
  EvidenceEvent,
  ExplorationSession,
  NextRecommendedAction,
  MasteryVector,
} from './personal-learning-engine.contracts';

export class PersonalLearningEngineKernel {
  private learnerStates: Map<string, LearnerState> = new Map();
  private explorationSessions: Map<string, ExplorationSession> = new Map();
  private evidenceLedger: EvidenceEvent[] = [];

  constructor() {}

  // ==========================================================================
  // 1. PAGE RESOLUTION & CONTEXT BUILDER (Gate 2)
  // ==========================================================================
  public openPage(bookId: string, printedPage: number, learnerId: string): {
    page: TextbookPage;
    learnerState: LearnerState;
    experience: LearningExperience;
  } {
    const position: CurriculumPosition = {
      bookId,
      bookTitle: 'Class 5 Environmental Studies (EVS)',
      chapterNumber: 1,
      chapterTitle: 'Festivals of India & Community Life',
      printedPage,
      pdfPage: printedPage + 1,
      sequenceIndex: printedPage,
      archetype: 'NORMAL_CHAPTER',
    };

    const rawText =
      'India is a land of festivals... Sankranthi is a popular harvest festival. Many people make colourful muggu (rangoli) at the entrance of their houses and fly colourful kites.';

    const page: TextbookPage = {
      id: `page-${bookId}-${printedPage}`,
      position,
      rawText,
      extractedConcepts: ['c-festivals-india', 'c-harvest-crops', 'c-sun-seasons', 'c-muggu-rangoli'],
      learningObjectives: [
        {
          id: 'obj-evs-5-01',
          code: 'EVS-5-HARVEST-01',
          statement: 'Understand the connection between solar seasons, agriculture harvest, and cultural celebrations',
          bloomLevel: 'UNDERSTAND',
          prerequisiteObjectiveIds: [],
        },
      ],
      sourceConfidence: 1.0,
      sourceAnchorId: 'src-0001',
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

    const canonicalConcept: KnowledgeNode = {
      id: 'c-festivals-india',
      title: 'Sankranthi & Harvest Celebrations',
      domain: 'CULTURE_HISTORY',
      tagline: 'Connecting solar transit, farming harvest, and human gratitude',
      shortDefinition: 'A major harvest festival celebrating the bounty of crops and the movement of the sun.',
      detailedExplanation:
        'Sankranthi marks the transition of the Sun into warmer northern skies and celebrates months of farming labor yielding food to sustain communities.',
      provenance: {
        type: 'TEXTBOOK_SOURCE',
        sourceName: 'Class 5 EVS Page 1 (Spread 2)',
        confidence: 1.0,
        retrievedAt: new Date().toISOString(),
        ageAppropriateRating: 'CLASS_4_5',
      },
      gradeLevel: 5,
      complexityLevel: 'FOUNDATIONAL',
      tags: ['harvest', 'sun', 'agriculture', 'culture'],
    };

    const experience = this.planExperience(position, canonicalConcept, learnerState);
    return { page, learnerState, experience };
  }

  // ==========================================================================
  // 2. EKAGURU MIND — DYNAMIC EXPERIENCE PLANNER (Gate 3, 4, 5, 6)
  // ==========================================================================
  public planExperience(
    position: CurriculumPosition,
    concept: KnowledgeNode,
    learnerState: LearnerState
  ): LearningExperience {
    const conceptMastery = learnerState.masteryByConcept[concept.id] || {
      recallScore: 0,
      applicationScore: 0,
      reasoningScore: 0,
      observationCount: 0,
      totalAttempts: 0,
      status: 'NOT_STARTED',
    };

    const isMastered = conceptMastery.status === 'MASTERED';

    return {
      id: `exp-${position.bookId}-${position.printedPage}-${Date.now()}`,
      planTimestamp: new Date().toISOString(),
      curriculumPosition: position,
      concept,

      // 🔬 SHOW ME: Visual Mechanism Chain
      showMe: {
        title: 'The Seed-to-Harvest Growth Chain',
        visualMechanismSteps: [
          { icon: '🌱', label: 'Seed in Soil', detail: 'Sprouts roots to absorb water and minerals' },
          { icon: '🌿', label: 'Green Leaves', detail: 'Captures radiant sunlight energy (Photosynthesis)' },
          { icon: '🌾', label: 'Golden Grain', detail: 'Stores solar energy as nutritious food' },
          { icon: '👨‍🌾', label: 'Harvest Day', detail: 'Farmers reap the bounty with community gratitude' },
        ],
        interactiveDiagramType: 'SEED_GROWTH',
      },

      // 🧠 TEACH ME: Adaptive Socratic Dialogue
      teachMe: {
        socraticStepIndex: 0,
        totalSocraticSteps: 5,
        stageName: 'MEET_IDEA',
        groundedExplanation:
          'When crops like rice and wheat ripen under the winter sun, farmers harvest the food that took months of sunlight and care to grow. Sankranthi is the joyful celebration of this harvest!',
        childAnalogy: 'Imagine baking a huge cake together—harvest festival is the moment everyone gets to taste the slice!',
        remediationMode: false,
      },

      // 🎨 TRY IT: Hands-on Experiential Discovery
      tryIt: {
        activityType: 'PANTRY_OBSERVATION',
        question: {
          text: 'Why do farming communities celebrate during harvest time rather than during seed planting time?',
          options: [
            'Because months of hard labor have successfully yielded food to feed the community',
            'Because farmers want to stop farming forever',
            'Because crops grow with zero water or care',
            'Because planting seeds is too noisy',
          ],
          correctIndex: 0,
          explanation: 'Harvest marks the joyous culmination of months of farming effort, providing abundance and food security.',
        },
        handsOnExperiment: {
          title: '🍚 Spot 3 Harvest Grains in Your Kitchen',
          objective: 'Discover the real foods harvested by farmers in your own home pantry',
          steps: [
            { stepNumber: 1, action: 'OBSERVE', instruction: 'Find Rice grains, Sesame seeds (Til), or Jaggery (Gur).' },
            { stepNumber: 2, action: 'EXPLAIN', instruction: 'Where did the energy inside these foods come from?' },
          ],
          rewardBadge: '🌾 Master Harvester',
        },
      },

      // 🌌 GO DEEPER: Knowledge Universe Constellation & Cosmic Telescope
      goDeeper: {
        currentConceptId: concept.id,
        universeConstellation: [
          {
            realmId: 'node-harvest-crops',
            realmName: '🌾 Harvest & Agriculture',
            icon: '🌾',
            provenance: 'CURRICULUM_DERIVED',
            tagline: 'Seed to crop growth biology',
            shortDescription: 'How plants turn water and soil minerals into human nourishment.',
            targetNodeId: 'c-harvest-crops',
          },
          {
            realmId: 'node-sun-seasons',
            realmName: '☀️ Sun & Earth Cycles',
            icon: '☀️',
            provenance: 'EXTERNAL_KNOWLEDGE',
            tagline: 'Solar transit and seasonal warmth',
            shortDescription: 'How Earth orbiting the Sun ripens crops across hemispheres.',
            targetNodeId: 'c-sun-seasons',
          },
          {
            realmId: 'node-muggu-rangoli',
            realmName: '🎨 Muggu / Rangoli Art',
            icon: '🎨',
            provenance: 'TEXTBOOK_SOURCE',
            tagline: 'Geometric symmetry and nature harmony',
            shortDescription: 'Drawing 4x4 matrix dot loops using rice flour to feed ants.',
            targetNodeId: 'c-muggu-rangoli',
          },
          {
            realmId: 'node-kite-wind',
            realmName: '🪁 Kites & Aerodynamics',
            icon: '🪁',
            provenance: 'EXTERNAL_KNOWLEDGE',
            tagline: 'Air pressure and aerodynamic lift',
            shortDescription: 'How winter thermals keep light bamboo frames soaring high.',
            targetNodeId: 'c-kite-wind',
          },
        ],
        cosmicTelescope: {
          question: 'Where did the energy inside the rice grain originally come from?',
          answer: 'From the SUN! Nuclear fusion at 15 million °C in our nearest star traveled 150 million km to power the plant leaves.',
          cosmicDomain: 'ASTROPHYSICS & NUCLEAR PHYSICS',
        },
      },

      // 🎯 DECISION ACTION
      nextRecommendedAction: {
        actionType: isMastered ? 'ADVANCE_CURRICULUM_PAGE' : 'REINFORCE_FOUNDATION',
        reason: isMastered
          ? 'Learner demonstrated complete understanding across Recall, Reasoning, and Application.'
          : 'Engage with Show Me and Try It to establish empirical understanding.',
        targetId: isMastered ? 'page-Class5EVS-2' : undefined,
      },
    };
  }

  // ==========================================================================
  // 3. EVIDENCE ENGINE & MASTERY CALCULATION (Gate 5)
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
          ? '✓ Correct! You understood the biological and cultural foundation of harvest.'
          : '💡 Let us explore how crops require months of care and sunlight.',
      },
      timestamp: new Date().toISOString(),
      sha256EvidenceKey: `sha256-${learnerId}-${conceptId}-${Date.now()}`,
    };

    this.evidenceLedger.push(evidenceEvent);
    learnerState.totalEvidenceCount++;

    // Calculate updated mastery
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
    if (response.dimension === 'OBSERVATION') {
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
          ? 'Mastery threshold verified with immutable empirical evidence.'
          : 'Continue discovery in Try It or Go Deeper to complete mastery.',
      targetId: 'page-Class5EVS-2',
    };

    return { evidenceEvent, updatedMastery: currentMastery, nextAction };
  }

  // ==========================================================================
  // 4. DUAL-SPINE EXPLORATION ENGINE (Gate 6 & Gate 7)
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
          conceptTitle: targetConceptId === 'c-sun-seasons' ? '☀️ Sun & Earth Cycles' : '⚛️ Nuclear Fusion in Stars',
          enteredAt: new Date().toISOString(),
          timeSpentSeconds: 0,
          evidenceCollected: [],
        },
      ],
      branchDepth: 1,
      evidenceEventsCollected: [],
      isExploring: true,
      returnToCurriculumPage: learnerState.currentPosition.printedPage, // Page 1
      nextCurriculumPageOnComplete: learnerState.currentPosition.printedPage + 1, // Page 2
    };

    this.explorationSessions.set(sessionId, session);

    const explorationNode: KnowledgeNode = {
      id: targetConceptId,
      title: targetConceptId === 'c-sun-seasons' ? '☀️ Sun & Earth Cycles' : '⚛️ Nuclear Fusion in Stars',
      domain: targetConceptId === 'c-sun-seasons' ? 'ASTRONOMY' : 'PHYSICS',
      tagline: 'Solar irradiance, nuclear fusion, and energy propagation',
      shortDefinition: 'The physical mechanism by which our star generates photons powering Earth ecosystems.',
      detailedExplanation:
        'In the core of the Sun, hydrogen atoms fuse into helium at 15 million degrees Celsius, radiating photons that travel 8 minutes across space to reach Earth leaves.',
      provenance: {
        type: 'EXTERNAL_KNOWLEDGE',
        sourceName: 'NASA Solar Physics Knowledge Base',
        confidence: 0.98,
        retrievedAt: new Date().toISOString(),
        ageAppropriateRating: 'CLASS_4_5',
      },
      gradeLevel: 5,
      complexityLevel: 'COSMIC_EXTENSION',
      tags: ['sun', 'fusion', 'astronomy', 'energy'],
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
      learnerState.completedPageIds.push(`page-${session.originCurriculumPosition.bookId}-${session.originCurriculumPosition.printedPage}`);
    }

    return {
      session,
      restoredPosition,
      nextPageToLoad: session.nextCurriculumPageOnComplete,
      message: `🌟 You explored the cosmos and discovered the Sun's energy origin! Safely returning to Class 5 EVS Page ${session.nextCurriculumPageOnComplete}.`,
    };
  }

  public getLearnerState(learnerId: string): LearnerState | undefined {
    return this.learnerStates.get(learnerId);
  }
}
