import { ExplainabilityEngine } from './explainability.engine';
import { LearnerMemoryEngine } from './learner-memory.engine';
import { EvidenceEvent, CurriculumPosition } from './personal-learning-engine.contracts';

describe('EKAGURU Evidence-Based Explainability & Human Intelligence Engine (Step 8)', () => {
  let memory: LearnerMemoryEngine;
  let explainability: ExplainabilityEngine;

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
    explainability = new ExplainabilityEngine(memory);
  });

  // --------------------------------------------------------------------------
  // Gate 8.0 & 8.1: Learner Motivational View
  // --------------------------------------------------------------------------
  it('Gate 8.1: Generates motivational learner summary without confusing engine metrics', () => {
    const learnerId = 'learner-explain-001';

    // Master photosynthesis
    memory.recordEvidence({
      id: 'ev-1',
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
      sha256EvidenceKey: 'sha256-e1',
    });
    memory.recordEvidence({
      id: 'ev-2',
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
      sha256EvidenceKey: 'sha256-e2',
    });
    memory.recordEvidence({
      id: 'ev-3',
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
      sha256EvidenceKey: 'sha256-e3',
    });

    const report = explainability.generateCompleteReport(learnerId);
    const learnerView = report.learnerView;

    expect(learnerView.greetingTitle).toContain('Welcome back');
    expect(learnerView.accomplishedConcepts).toHaveLength(1);
    expect(learnerView.accomplishedConcepts[0].conceptTitle).toContain('How Plants Make Food');
    expect(learnerView.totalBadgesEarned).toBeGreaterThanOrEqual(1);
  });

  // --------------------------------------------------------------------------
  // Gate 8.2 & 8.4: Parent View with Evidence-Grounded "Why?" Citations
  // --------------------------------------------------------------------------
  it('Gate 8.2 & 8.4: Generates parent summary with traceable evidence counts and home prompts', () => {
    const learnerId = 'learner-parent-002';

    // Log evidence with misconception trap
    memory.recordEvidence({
      id: 'ev-sci-mis',
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
      sha256EvidenceKey: 'sha256-pmis',
    });

    const report = explainability.generateCompleteReport(learnerId);
    const parentView = report.parentView;

    expect(parentView.subjectOverviews.length).toBeGreaterThan(0);
    expect(parentView.subjectOverviews[0].traceableWhy.evidenceCount).toBeGreaterThan(0);
    expect(parentView.activeMisconceptionAlerts).toHaveLength(1);
    expect(parentView.activeMisconceptionAlerts[0].howParentsCanHelp).toContain('soil stays the same size');
    expect(parentView.learningModalityObservations.strongestActivityType).toContain('Hands-On');
  });

  // --------------------------------------------------------------------------
  // Gate 8.3 & 8.7: Teacher Classroom Diagnostics & Prerequisite Risk Matrix
  // --------------------------------------------------------------------------
  it('Gate 8.3 & 8.7: Generates classroom diagnostic matrix with prerequisite risk analysis', () => {
    const teacherSummary = explainability.generateTeacherClassroomSummary();

    expect(teacherSummary.classroomGrade).toBe(5);
    expect(teacherSummary.totalStudentsCount).toBe(28);
    expect(teacherSummary.conceptHealthMatrix).toHaveLength(4);
    
    // Prerequisite Bridge Check: Division -> Fractions
    expect(teacherSummary.prerequisiteRiskBridges).toHaveLength(1);
    expect(teacherSummary.prerequisiteRiskBridges[0].foundationalTitle).toContain('Division');
    expect(teacherSummary.prerequisiteRiskBridges[0].blockedAdvancedTitle).toContain('Fractional');
    expect(teacherSummary.topMisconceptionClusters.length).toBeGreaterThan(0);
    expect(teacherSummary.topMisconceptionClusters[0].recommendedSmallGroupIntervention).toBeDefined();
  });
});
