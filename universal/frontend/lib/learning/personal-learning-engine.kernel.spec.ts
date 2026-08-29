import { PersonalLearningEngineKernel } from './personal-learning-engine.kernel';

describe('EKAGURU Personal Learning Engine Kernel (Step 3 Golden Path)', () => {
  let kernel: PersonalLearningEngineKernel;
  const learnerId = 'learner-sankranthi-001';
  const bookId = 'Class5EVS';

  beforeEach(() => {
    kernel = new PersonalLearningEngineKernel();
  });

  it('Gate 2: Opens textbook Page 1 and extracts canonical concept and objectives', () => {
    const { page, learnerState, experience } = kernel.openPage(bookId, 1, learnerId);

    expect(page.position.printedPage).toBe(1);
    expect(page.position.chapterNumber).toBe(1);
    expect(page.extractedConcepts).toContain('c-festivals-india');
    expect(page.learningObjectives[0].code).toBe('EVS-5-HARVEST-01');
    expect(learnerState.learnerId).toBe(learnerId);
    expect(experience.concept.id).toBe('c-festivals-india');
  });

  it('Gate 3 & 4: EKAGURU Mind generates dynamic Show Me, Teach Me, Try It, and Go Deeper plan', () => {
    const { experience } = kernel.openPage(bookId, 1, learnerId);

    // Show Me
    expect(experience.showMe.title).toBe('The Seed-to-Harvest Growth Chain');
    expect(experience.showMe.visualMechanismSteps).toHaveLength(4);
    expect(experience.showMe.visualMechanismSteps[0].label).toBe('Seed in Soil');

    // Teach Me
    expect(experience.teachMe.stageName).toBe('MEET_IDEA');
    expect(experience.teachMe.groundedExplanation).toContain('When crops like rice and wheat ripen');

    // Try It
    expect(experience.tryIt.question?.text).toContain('Why do farming communities celebrate during harvest time');
    expect(experience.tryIt.handsOnExperiment?.rewardBadge).toBe('🌾 Master Harvester');

    // Go Deeper
    expect(experience.goDeeper.universeConstellation).toHaveLength(4);
    expect(experience.goDeeper.cosmicTelescope?.cosmicDomain).toBe('ASTROPHYSICS & NUCLEAR PHYSICS');
  });

  it('Gate 5: Captures evidence events and recalculates multi-metric mastery vectors', () => {
    kernel.openPage(bookId, 1, learnerId);

    // 1. Submit Recall Evidence
    const r1 = kernel.submitInteraction(learnerId, 'c-festivals-india', {
      dimension: 'RECALL',
      optionIndex: 0,
      isCorrect: true,
    });
    expect(r1.evidenceEvent.score).toBe(1.0);
    expect(r1.updatedMastery.recallScore).toBe(100);
    expect(r1.updatedMastery.status).toBe('IN_PROGRESS');

    // 2. Submit Reasoning Evidence
    const r2 = kernel.submitInteraction(learnerId, 'c-festivals-india', {
      dimension: 'REASONING',
      optionIndex: 0,
      isCorrect: true,
    });
    expect(r2.updatedMastery.reasoningScore).toBe(100);

    // 3. Submit Application / Observation Evidence
    const r3 = kernel.submitInteraction(learnerId, 'c-festivals-india', {
      dimension: 'APPLICATION',
      optionIndex: 0,
      isCorrect: true,
    });
    expect(r3.updatedMastery.applicationScore).toBe(100);
    expect(r3.updatedMastery.status).toBe('MASTERED');
    expect(r3.nextAction.actionType).toBe('ADVANCE_CURRICULUM_PAGE');
  });

  it('Gate 6 & 7: Dual-Spine Exploration preserves origin curriculum position and safely returns to Page 2', () => {
    kernel.openPage(bookId, 1, learnerId);

    // Start exploration into Cosmic Sun & Fusion
    const { session, explorationNode } = kernel.startExploration(learnerId, 'c-sun-seasons');

    expect(session.status).toBe('ACTIVE');
    expect(session.originCurriculumPosition.printedPage).toBe(1);
    expect(session.currentExplorationNodeId).toBe('c-sun-seasons');
    expect(session.returnToCurriculumPage).toBe(1);
    expect(session.nextCurriculumPageOnComplete).toBe(2);
    expect(explorationNode.domain).toBe('ASTRONOMY');
    expect(explorationNode.provenance.type).toBe('EXTERNAL_KNOWLEDGE');

    // Return to curriculum
    const returnResult = kernel.returnToCurriculum(session.sessionId);

    expect(returnResult.session.status).toBe('COMPLETED');
    expect(returnResult.nextPageToLoad).toBe(2);
    expect(returnResult.restoredPosition.printedPage).toBe(2);
    expect(returnResult.message).toContain('Safely returning to Class 5 EVS Page 2');

    // Check learner state
    const finalState = kernel.getLearnerState(learnerId);
    expect(finalState?.currentPosition.printedPage).toBe(2);
    expect(finalState?.completedPageIds).toContain('page-Class5EVS-1');
  });
});
