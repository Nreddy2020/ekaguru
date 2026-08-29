import { EkaguruMindOrchestrator } from './ekaguru-mind.orchestrator';

describe('EKAGURU Mind: Adaptive Orchestration & Learner Reasoning Engine (Step 5)', () => {
  let mind: EkaguruMindOrchestrator;

  beforeEach(() => {
    mind = new EkaguruMindOrchestrator();
  });

  // --------------------------------------------------------------------------
  // Gate 5.0: Context Assembly & Gate 5.5: Decision Audit Trace
  // --------------------------------------------------------------------------
  it('Gate 5.0 & 5.5: Assembles complete learner context and generates transparent DecisionAuditTrace', () => {
    const { page, learnerState, experience, decisionTrace } = mind.assembleLearnerContext(
      'Class5Science',
      12,
      'learner-mind-001'
    );

    expect(page.position.bookTitle).toContain('General Science');
    expect(page.extractedConcepts).toContain('c-photosynthesis');
    expect(learnerState.learnerId).toBe('learner-mind-001');
    expect(experience.concept.id).toBe('c-photosynthesis');

    // Decision Audit Trace Verification
    expect(decisionTrace.curriculumContext).toContain('Class 5 General Science');
    expect(decisionTrace.conceptId).toBe('c-photosynthesis');
    expect(decisionTrace.reasonCodes).toContain('IN_PROGRESS_DISCOVERY');
    expect(decisionTrace.confidence).toBeGreaterThanOrEqual(0.9);
    expect(decisionTrace.mediaRequirement?.type).toBe('ANIMATION');
  });

  // --------------------------------------------------------------------------
  // Gate 5.1: Prerequisite Diagnostics & Gap Detection
  // --------------------------------------------------------------------------
  it('Gate 5.1: Detects prerequisite gap when learner lacks foundational division before fractions', () => {
    const learnerId = 'learner-mind-gap';

    // 1. Initial state without Division mastery -> Prerequisite diagnostic detects gap
    const initialContext = mind.assembleLearnerContext('Class5Math', 24, learnerId);
    
    // Simulate prerequisite gap in Basic Division (score = 20%)
    initialContext.learnerState.masteryByConcept['c-basic-division'] = {
      recallScore: 20,
      applicationScore: 20,
      reasoningScore: 20,
      observationCount: 0,
      totalAttempts: 1,
      status: 'IN_PROGRESS',
    };

    const recheck = mind.assembleLearnerContext('Class5Math', 24, learnerId);
    expect(recheck.prerequisiteDiagnostic.hasPrerequisiteGap).toBe(true);
    expect(recheck.prerequisiteDiagnostic.missingPrerequisiteNodeId).toBe('c-basic-division');
    expect(recheck.decisionTrace.reasonCodes).toContain('PREREQUISITE_GAP_DETECTED');
    expect(recheck.decisionTrace.actionType).toBe('REINFORCE_FOUNDATION');
  });

  // --------------------------------------------------------------------------
  // Gate 5.3: Misconception Diagnosis & Persistent Tracking
  // --------------------------------------------------------------------------
  it('Gate 5.3: Detects misconception trap, prevents premature mastery, and triggers Socratic contrast', () => {
    const learnerId = 'learner-mis-003';
    mind.assembleLearnerContext('Class5Science', 12, learnerId);

    // Learner selects misconception: "Plants get food from soil"
    const r1 = mind.submitInteraction(learnerId, 'c-photosynthesis', {
      dimension: 'RECALL',
      isCorrect: false,
      triggeredMisconceptionTrap: 'MIS_PLANTS_EAT_SOIL',
    });

    expect(r1.updatedMastery.status).toBe('NEEDS_REMEDIATION');
    expect(r1.nextAction.actionType).toBe('REMEDIATE_MISCONCEPTION');
    expect(r1.decisionTrace.reasonCodes).toContain('MISCONCEPTION_ACTIVE');

    // Verify persistent tracking in learner state
    const state = mind.getLearnerState(learnerId);
    expect(state?.activeMisconceptions).toHaveLength(1);
    expect(state?.activeMisconceptions[0].incorrectMentalModel).toBe('MIS_PLANTS_EAT_SOIL');

    // Resolve misconception through Socratic contrast challenge
    const misId = state?.activeMisconceptions[0].misconceptionId;
    const r2 = mind.submitInteraction(learnerId, 'c-photosynthesis', {
      dimension: 'REASONING',
      isCorrect: true,
      resolvedMisconceptionId: misId,
    });

    expect(state?.activeMisconceptions[0].status).toBe('RESOLVED');

    // Complete remaining dimensions to achieve empirical mastery
    mind.submitInteraction(learnerId, 'c-photosynthesis', { dimension: 'RECALL', isCorrect: true });
    const r3 = mind.submitInteraction(learnerId, 'c-photosynthesis', { dimension: 'APPLICATION', isCorrect: true });
    expect(r3.updatedMastery.status).toBe('MASTERED');
    expect(r3.nextAction.actionType).toBe('ADVANCE_CURRICULUM_PAGE');
  });

  // --------------------------------------------------------------------------
  // Gate 5.6: Dual-Spine Exploration & Safe Return
  // --------------------------------------------------------------------------
  it('Gate 5.6: Controlled exploration preserves origin anchor and safe return point', () => {
    const learnerId = 'learner-dual-spine';
    mind.assembleLearnerContext('Class6History', 8, learnerId);

    const { session, explorationNode } = mind.startExploration(learnerId, 'c-civil-engineering');
    expect(session.status).toBe('ACTIVE');
    expect(session.originCurriculumPosition.printedPage).toBe(8);
    expect(session.nextCurriculumPageOnComplete).toBe(9);
    expect(explorationNode.provenance.type).toBe('EXTERNAL_KNOWLEDGE');

    const returnResult = mind.returnToCurriculum(session.sessionId);
    expect(returnResult.session.status).toBe('COMPLETED');
    expect(returnResult.nextPageToLoad).toBe(9);
    expect(returnResult.restoredPosition.printedPage).toBe(9);
  });
});
