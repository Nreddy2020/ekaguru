import { LearnerMemoryEngine } from './learner-memory.engine';
import { EvidenceEvent, CurriculumPosition } from './personal-learning-engine.contracts';

describe('EKAGURU Learner Memory & Longitudinal Intelligence Engine (Step 7)', () => {
  let memory: LearnerMemoryEngine;

  const mockPosition: CurriculumPosition = {
    bookId: 'Class5Science',
    bookTitle: 'Class 5 General Science',
    chapterNumber: 2,
    chapterTitle: 'How Plants Make Food',
    printedPage: 12,
    pdfPage: 13,
    sequenceIndex: 12,
    archetype: 'NORMAL_CHAPTER',
  };

  beforeEach(() => {
    memory = new LearnerMemoryEngine();
  });

  // --------------------------------------------------------------------------
  // Gates 7.0 & 7.1: Identity & Derived Longitudinal State
  // --------------------------------------------------------------------------
  it('Gates 7.0 & 7.1: Derives durable profile purely from append-only Evidence Ledger', () => {
    const learnerId = 'learner-long-001';

    const ev1: EvidenceEvent = {
      id: 'ev-001',
      learnerId,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPosition,
      dimension: 'RECALL',
      difficulty: 3,
      score: 1.0,
      confidence: 1.0,
      isCorrect: true,
      learnerResponse: { text: 'Sunlight powers plant leaves' },
      timestamp: new Date().toISOString(),
      sha256EvidenceKey: 'sha256-test-key-1',
    };

    memory.recordEvidence(ev1);
    const profile = memory.getProfile(learnerId);

    expect(profile.totalEvidenceRecords).toBe(1);
    expect(profile.activeCurriculumPositions['Class5Science'].printedPage).toBe(12);
    expect(profile.conceptProfiles['c-photosynthesis'].currentMastery.recallScore).toBe(100);
    expect(profile.conceptProfiles['c-photosynthesis'].currentMastery.status).toBe('IN_PROGRESS');
  });

  // --------------------------------------------------------------------------
  // Gate 7.2 & 7.3: Mastery Trajectory & Spaced Retrieval Review
  // --------------------------------------------------------------------------
  it('Gate 7.2 & 7.3: Tracks temporal trajectory and calculates spaced review triggers', () => {
    const learnerId = 'learner-spaced-002';

    // Complete all 3 dimensions to master photosynthesis
    memory.recordEvidence({
      id: 'ev-r',
      learnerId,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPosition,
      dimension: 'RECALL',
      difficulty: 3,
      score: 1.0,
      confidence: 1.0,
      isCorrect: true,
      learnerResponse: {},
      timestamp: new Date().toISOString(),
      sha256EvidenceKey: 'sha256-r',
    });

    memory.recordEvidence({
      id: 'ev-a',
      learnerId,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPosition,
      dimension: 'APPLICATION',
      difficulty: 3,
      score: 1.0,
      confidence: 1.0,
      isCorrect: true,
      learnerResponse: {},
      timestamp: new Date().toISOString(),
      sha256EvidenceKey: 'sha256-a',
    });

    memory.recordEvidence({
      id: 'ev-re',
      learnerId,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPosition,
      dimension: 'REASONING',
      difficulty: 3,
      score: 1.0,
      confidence: 1.0,
      isCorrect: true,
      learnerResponse: {},
      timestamp: new Date().toISOString(),
      sha256EvidenceKey: 'sha256-re',
    });

    const profile = memory.getProfile(learnerId);
    const conceptProfile = profile.conceptProfiles['c-photosynthesis'];

    expect(conceptProfile.currentMastery.status).toBe('MASTERED');
    expect(conceptProfile.masteryHistory.length).toBeGreaterThanOrEqual(3);

    // Simulate 7 days elapsed to test spaced retrieval trigger
    conceptProfile.lastReviewDate = new Date(Date.now() - 7 * 86400000).toISOString();
    conceptProfile.needsSpacedReview = true;

    const audit = memory.evaluateLongitudinalPedagogicalDecision(
      learnerId,
      'c-photosynthesis',
      mockPosition
    );

    expect(audit.decision).toBe('SPACED_RETRIEVAL_CHALLENGE');
    expect(audit.longitudinalReasons).toContain('RETENTION_INTERVAL_EXPIRED (7 days)');
  });

  // --------------------------------------------------------------------------
  // Gate 7.5: Misconception Lifecycle Memory (Active -> Resolved)
  // --------------------------------------------------------------------------
  it('Gate 7.5: Preserves complete misconception history across attempts and resolutions', () => {
    const learnerId = 'learner-mis-history';

    // 1. Trap triggered
    memory.recordEvidence({
      id: 'ev-mis-1',
      learnerId,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPosition,
      dimension: 'RECALL',
      difficulty: 3,
      score: 0.0,
      confidence: 1.0,
      isCorrect: false,
      misconceptionTriggeredId: 'MIS_PLANTS_EAT_SOIL',
      learnerResponse: {},
      timestamp: new Date().toISOString(),
      sha256EvidenceKey: 'sha256-m1',
    });

    let profile = memory.getProfile(learnerId);
    let conceptProfile = profile.conceptProfiles['c-photosynthesis'];
    expect(conceptProfile.misconceptionHistory).toHaveLength(1);
    expect(conceptProfile.misconceptionHistory[0].status).toBe('ACTIVE');

    // 2. Misconception resolved
    memory.recordEvidence({
      id: 'ev-mis-res',
      learnerId,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPosition,
      dimension: 'REASONING',
      difficulty: 3,
      score: 1.0,
      confidence: 1.0,
      isCorrect: true,
      misconceptionResolvedId: 'MIS_PLANTS_EAT_SOIL',
      learnerResponse: {},
      timestamp: new Date().toISOString(),
      sha256EvidenceKey: 'sha256-mres',
    });

    profile = memory.getProfile(learnerId);
    conceptProfile = profile.conceptProfiles['c-photosynthesis'];
    expect(conceptProfile.misconceptionHistory[0].status).toBe('RESOLVED');
  });

  // --------------------------------------------------------------------------
  // Gate 7.6: Cross-Subject Transfer Bridge Discovery
  // --------------------------------------------------------------------------
  it('Gate 7.6: Discovers cross-subject semantic transfer opportunities', () => {
    const learnerId = 'learner-bridge-004';

    memory.recordEvidence({
      id: 'ev-sci',
      learnerId,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPosition,
      dimension: 'RECALL',
      difficulty: 3,
      score: 1.0,
      confidence: 1.0,
      isCorrect: true,
      learnerResponse: {},
      timestamp: new Date().toISOString(),
      sha256EvidenceKey: 'sha256-sci',
    });

    const profile = memory.getProfile(learnerId);
    expect(profile.crossSubjectBridges).toHaveLength(1);
    expect(profile.crossSubjectBridges[0].targetSubjectTitle).toBe('Environmental Studies (EVS)');
    expect(profile.crossSubjectBridges[0].bridgingConceptDescription).toContain('Solar photon energy');
  });

  // --------------------------------------------------------------------------
  // Gate 7.9 & 7.10: Multi-Session Resumption & Explainable Audit
  // --------------------------------------------------------------------------
  it('Gate 7.9 & 7.10: Resumes exact multi-session position and generates longitudinal audit trail', () => {
    const learnerId = 'learner-session-resume';

    memory.recordEvidence({
      id: 'ev-pos',
      learnerId,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPosition,
      dimension: 'RECALL',
      difficulty: 3,
      score: 1.0,
      confidence: 1.0,
      isCorrect: true,
      learnerResponse: {},
      timestamp: new Date().toISOString(),
      sha256EvidenceKey: 'sha256-pos',
    });

    // Simulating next day session return
    const resumedPosition = memory.resumeSessionState(learnerId, 'Class5Science');
    expect(resumedPosition?.printedPage).toBe(12);
    expect(resumedPosition?.chapterTitle).toBe('How Plants Make Food');

    const audit = memory.evaluateLongitudinalPedagogicalDecision(
      learnerId,
      'c-photosynthesis',
      mockPosition
    );

    expect(audit.curriculumContext).toContain('Page 12');
    expect(audit.confidenceScore).toBeGreaterThanOrEqual(0.9);
  });
});
