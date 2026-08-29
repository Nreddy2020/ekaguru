import { AdaptiveLearningLoopEngine } from './adaptive-learning-loop.engine';
import { LearnerMemoryEngine } from './learner-memory.engine';
import { EkaguruMindOrchestrator } from './ekaguru-mind.orchestrator';

describe('EKAGURU Closed-Loop Adaptive Learning Engine (Step 9)', () => {
  let memory: LearnerMemoryEngine;
  let mind: EkaguruMindOrchestrator;
  let loopEngine: AdaptiveLearningLoopEngine;

  beforeEach(() => {
    memory = new LearnerMemoryEngine();
    mind = new EkaguruMindOrchestrator();
    loopEngine = new AdaptiveLearningLoopEngine(memory, mind);
  });

  // --------------------------------------------------------------------------
  // Gates 9.0, 9.1 & 9.2: Closed Loop Lifecycle & Scaffolding Transitions
  // --------------------------------------------------------------------------
  it('Gates 9.0, 9.1 & 9.2: Executes continuous closed loop and transitions scaffolding dynamically', () => {
    const learnerId = 'learner-loop-001';

    // 1. Initial Cycle: Not started -> Scaffolding = SCAFFOLDED
    const snap1 = loopEngine.startOrResumeLoopCycle(learnerId, 'Class5Science', 12);
    expect(snap1.state).toBe('EXPERIENCE');
    expect(snap1.scaffoldingLevel).toBe('SCAFFOLDED');
    expect(snap1.cycleIndex).toBe(1);

    // 2. First Interaction: Correct Recall
    const res1 = loopEngine.processInteractionAndAdapt(learnerId, 'c-photosynthesis', {
      dimension: 'RECALL',
      isCorrect: true,
    });
    expect(res1.evidenceEvent.score).toBe(1.0);
    expect(res1.nextLoopSnapshot.cycleIndex).toBe(2);

    // 3. Second Interaction: Correct Application
    const res2 = loopEngine.processInteractionAndAdapt(learnerId, 'c-photosynthesis', {
      dimension: 'APPLICATION',
      isCorrect: true,
    });
    expect(res2.nextLoopSnapshot.scaffoldingLevel).toBe('MASTERY_PROVING');

    // 4. Third Interaction: Correct Reasoning -> MASTERY ACHIEVED -> Next Action ADVANCE
    const res3 = loopEngine.processInteractionAndAdapt(learnerId, 'c-photosynthesis', {
      dimension: 'REASONING',
      isCorrect: true,
    });
    expect(res3.updatedMastery.status).toBe('MASTERED');
    expect(res3.nextAction.actionType).toBe('ADVANCE_CURRICULUM_PAGE');
    expect(res3.nextLoopSnapshot.scaffoldingLevel).toBe('CHALLENGE');
  });

  // --------------------------------------------------------------------------
  // Gate 9.3 & 9.7: Misconception Intervention Loop & Effectiveness Tracking
  // --------------------------------------------------------------------------
  it('Gate 9.3 & 9.7: Adapts remediation strategy when misconception recidivism is detected', () => {
    const learnerId = 'learner-loop-mis';

    // Cycle 1: Trap triggered
    loopEngine.startOrResumeLoopCycle(learnerId, 'Class5Science', 12);
    const r1 = loopEngine.processInteractionAndAdapt(learnerId, 'c-photosynthesis', {
      dimension: 'RECALL',
      isCorrect: false,
      triggeredMisconceptionTrap: 'MIS_PLANTS_EAT_SOIL',
    });

    expect(r1.updatedMastery.status).toBe('NEEDS_REMEDIATION');
    expect(r1.nextLoopSnapshot.activeIntervention?.strategyType).toBe('SOCRATIC_CONTRAST');

    // Cycle 2: Misconception remains -> Strategy shifts to PHYSICAL_ANALOGY
    const r2 = loopEngine.processInteractionAndAdapt(learnerId, 'c-photosynthesis', {
      dimension: 'APPLICATION',
      isCorrect: false,
      triggeredMisconceptionTrap: 'MIS_PLANTS_EAT_SOIL',
    });

    expect(r2.nextLoopSnapshot.activeIntervention?.strategyType).toBe('PHYSICAL_ANALOGY');

    // Cycle 3: Successful resolution through physical analogy
    const r3 = loopEngine.processInteractionAndAdapt(learnerId, 'c-photosynthesis', {
      dimension: 'REASONING',
      isCorrect: true,
      resolvedMisconceptionId: 'MIS_PLANTS_EAT_SOIL',
    });

    expect(r3.nextLoopSnapshot.effectivenessLog.length).toBeGreaterThan(0);
    expect(r3.nextLoopSnapshot.effectivenessLog.some((e) => e.gain > 0)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Gate 9.4: Prerequisite Micro-Intervention Loop
  // --------------------------------------------------------------------------
  it('Gate 9.4: Detects prerequisite gap and triggers targeted micro-remediation cycle', () => {
    const learnerId = 'learner-loop-prereq';

    // Inject Division deficit into memory profile
    const profile = memory.getProfile(learnerId);
    profile.conceptProfiles['c-basic-division'] = {
      conceptId: 'c-basic-division',
      firstEncounteredAt: new Date().toISOString(),
      lastAssessedAt: new Date().toISOString(),
      currentMastery: {
        recallScore: 20,
        applicationScore: 20,
        reasoningScore: 20,
        observationCount: 0,
        totalAttempts: 1,
        status: 'IN_PROGRESS',
      },
      masteryHistory: [],
      retentionStabilityDays: 1,
      lastReviewDate: new Date().toISOString(),
      nextScheduledReviewDate: new Date().toISOString(),
      needsSpacedReview: false,
      totalRecallAttempts: 1,
      totalApplicationAttempts: 0,
      totalReasoningAttempts: 0,
      misconceptionHistory: [],
    };

    const snapshot = loopEngine.startOrResumeLoopCycle(learnerId, 'Class5Math', 24);
    expect(snapshot.activeIntervention?.strategyType).toBe('PREREQUISITE_MICRO_LESSON');
    expect(snapshot.activeIntervention?.targetConceptId).toBe('c-basic-division');
  });
});
