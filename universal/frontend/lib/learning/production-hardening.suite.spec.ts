import { ProductionHardeningEngine } from './production-hardening.suite';
import { UniversalContentCompiler, RawTextbookInput } from './universal-content-compiler';
import { CurriculumPosition, EvidenceEvent } from './personal-learning-engine.contracts';

describe('EKAGURU Production Hardening & Invariant Certification Suite (Step 10)', () => {
  let engine: ProductionHardeningEngine;

  const mockPositionScience: CurriculumPosition = {
    bookId: 'Class5Science',
    bookTitle: 'Class 5 General Science',
    chapterNumber: 2,
    chapterTitle: 'How Plants Make Food',
    printedPage: 12,
    pdfPage: 13,
    sequenceIndex: 12,
    archetype: 'NORMAL_CHAPTER',
  };

  const mockPositionMath: CurriculumPosition = {
    bookId: 'Class5Math',
    bookTitle: 'Class 5 Mathematics',
    chapterNumber: 4,
    chapterTitle: 'Parts and Wholes',
    printedPage: 24,
    pdfPage: 25,
    sequenceIndex: 24,
    archetype: 'NORMAL_CHAPTER',
  };

  beforeEach(() => {
    engine = new ProductionHardeningEngine();
  });

  // ==========================================================================
  // Gate 10.0: Multi-Learner Isolation (Learner A vs Learner B)
  // ==========================================================================
  it('Gate 10.0: Strict Multi-Learner Isolation — Learner A state NEVER leaks into Learner B', () => {
    const learnerA = 'learner-alpha';
    const learnerB = 'learner-beta';

    // Learner A has weak division and active photosynthesis misconception
    engine.submitEvidenceIdempotent({
      clientInteractionId: 'client-tx-a1',
      learnerId: learnerA,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPositionScience,
      dimension: 'RECALL',
      score: 0.0,
      isCorrect: false,
      misconceptionTriggeredId: 'MIS_PLANTS_EAT_SOIL',
    });

    // Learner B has strong photosynthesis mastery
    engine.submitEvidenceIdempotent({
      clientInteractionId: 'client-tx-b1',
      learnerId: learnerB,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPositionScience,
      dimension: 'RECALL',
      score: 1.0,
      isCorrect: true,
    });
    engine.submitEvidenceIdempotent({
      clientInteractionId: 'client-tx-b2',
      learnerId: learnerB,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPositionScience,
      dimension: 'APPLICATION',
      score: 1.0,
      isCorrect: true,
    });
    engine.submitEvidenceIdempotent({
      clientInteractionId: 'client-tx-b3',
      learnerId: learnerB,
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPositionScience,
      dimension: 'REASONING',
      score: 1.0,
      isCorrect: true,
    });

    const memoryEngine = engine.getMemoryEngine();
    const profileA = memoryEngine.getProfile(learnerA);
    const profileB = memoryEngine.getProfile(learnerB);

    // Assert Learner A state
    expect(profileA.totalEvidenceRecords).toBe(1);
    expect(profileA.conceptProfiles['c-photosynthesis'].currentMastery.status).toBe('NEEDS_REMEDIATION');
    expect(profileA.conceptProfiles['c-photosynthesis'].misconceptionHistory).toHaveLength(1);

    // Assert Learner B state is completely unpolluted
    expect(profileB.totalEvidenceRecords).toBe(3);
    expect(profileB.conceptProfiles['c-photosynthesis'].currentMastery.status).toBe('MASTERED');
    expect(profileB.conceptProfiles['c-photosynthesis'].misconceptionHistory).toHaveLength(0);
  });

  // ==========================================================================
  // Gate 10.1: Concurrent Sessions on the Same Textbook
  // ==========================================================================
  it('Gate 10.1: Concurrent sessions on identical textbook preserve isolated exploration anchors', () => {
    const mind = engine.getMindOrchestrator();

    mind.assembleLearnerContext('Class5Science', 12, 'learner-1');
    mind.assembleLearnerContext('Class5Science', 12, 'learner-2');
    const sessA = mind.startExploration('learner-1', 'c-sun-seasons');
    const sessB = mind.startExploration('learner-2', 'c-sun-seasons');

    expect(sessA.session.sessionId).not.toBe(sessB.session.sessionId);
    expect(sessA.session.learnerId).toBe('learner-1');
    expect(sessB.session.learnerId).toBe('learner-2');

    const retA = mind.returnToCurriculum(sessA.session.sessionId);
    expect(retA.session.status).toBe('COMPLETED');

    const stateB = mind.getLearnerState('learner-2');
    expect(stateB?.currentPosition.printedPage).toBe(sessB.session.originCurriculumPosition.printedPage);
  });

  // ==========================================================================
  // Gate 10.2: Evidence Idempotency & Deduplication
  // ==========================================================================
  it('Gate 10.2: Idempotent evidence ingestion deduplicates retried client interactions', () => {
    const req = {
      clientInteractionId: 'client-nonce-xyz-123',
      learnerId: 'learner-idem',
      conceptId: 'c-photosynthesis',
      curriculumPosition: mockPositionScience,
      dimension: 'RECALL' as const,
      score: 1.0,
      isCorrect: true,
    };

    // First attempt: records new evidence
    const r1 = engine.submitEvidenceIdempotent(req);
    expect(r1.isDuplicate).toBe(false);
    expect(r1.auditStatus).toBe('RECORDED_NEW');

    // Network retry attempt: deduplicates without double-counting
    const r2 = engine.submitEvidenceIdempotent(req);
    expect(r2.isDuplicate).toBe(true);
    expect(r2.auditStatus).toBe('DEDUPLICATED_EXISTING');
    expect(r2.evidenceEvent.sha256EvidenceKey).toBe(r1.evidenceEvent.sha256EvidenceKey);

    const profile = engine.getMemoryEngine().getProfile('learner-idem');
    expect(profile.totalEvidenceRecords).toBe(1);
  });

  // ==========================================================================
  // Gate 10.3: Race-Condition Burst Safety
  // ==========================================================================
  it('Gate 10.3: Rapid burst of 20 concurrent interactions produces mathematically valid mastery', () => {
    const learnerId = 'learner-burst';

    for (let i = 0; i < 20; i++) {
      engine.submitEvidenceIdempotent({
        clientInteractionId: `burst-tx-${i}`,
        learnerId,
        conceptId: 'c-photosynthesis',
        curriculumPosition: mockPositionScience,
        dimension: i % 3 === 0 ? 'RECALL' : i % 3 === 1 ? 'APPLICATION' : 'REASONING',
        score: 1.0,
        isCorrect: true,
      });
    }

    const profile = engine.getMemoryEngine().getProfile(learnerId);
    expect(profile.totalEvidenceRecords).toBe(20);
    expect(profile.conceptProfiles['c-photosynthesis'].currentMastery.status).toBe('MASTERED');
    expect(profile.conceptProfiles['c-photosynthesis'].currentMastery.recallScore).toBe(100);
    expect(profile.conceptProfiles['c-photosynthesis'].currentMastery.applicationScore).toBe(100);
    expect(profile.conceptProfiles['c-photosynthesis'].currentMastery.reasoningScore).toBe(100);
  });

  // ==========================================================================
  // Gate 10.6: Compiler Adversarial Validation
  // ==========================================================================
  it('Gate 10.6: Compiler rejects malformed, ungrounded, or corrupt textbook packages', () => {
    const invalidInput: RawTextbookInput = {
      bookId: 'CorruptBook',
      bookTitle: 'Corrupt Book',
      subjectName: 'Unknown',
      domain: 'PHYSICS',
      gradeLevel: 5,
      chapterNumber: 1,
      chapterTitle: 'Bad Chapter',
      printedPage: -5, // Invalid negative page
      pdfPage: 0, // Invalid zero page
      sequenceIndex: 0,
      rawText: 'Too short', // Fails text length check
    };

    expect(() => {
      UniversalContentCompiler.compileAndPublish({
        raw: invalidInput,
        conceptCandidate: {
          conceptId: 'c-bad',
          title: 'Bad',
          tagline: 'Bad',
          shortDefinition: 'Bad',
          detailedExplanation: 'Bad',
          tags: [],
          complexityLevel: 'FOUNDATIONAL',
          provenanceType: 'TEXTBOOK_SOURCE',
          sourceConfidence: 0.1,
        },
        learningObjectives: [],
        showMe: { title: 'Bad', visualMechanismSteps: [] },
        teachMe: { socraticStepIndex: 0, totalSocraticSteps: 5, stageName: 'MEET_IDEA', groundedExplanation: '', childAnalogy: '', remediationMode: false },
        tryIt: { activityType: 'SOCRATIC_QUESTION' },
        goDeeper: { currentConceptId: 'c-bad', universeConstellation: [], cosmicTelescope: { question: '', answer: '', cosmicDomain: '' } },
      });
    }).toThrow();
  });

  // ==========================================================================
  // Gate 10.7: Longitudinal Memory Reconstruction Equivalence
  // ==========================================================================
  it('Gate 10.7: Reconstructing memory from raw Evidence Ledger yields exact state equivalence', () => {
    const learnerId = 'learner-recon';

    const events: EvidenceEvent[] = [];
    for (let i = 0; i < 5; i++) {
      const res = engine.submitEvidenceIdempotent({
        clientInteractionId: `recon-tx-${i}`,
        learnerId,
        conceptId: 'c-photosynthesis',
        curriculumPosition: mockPositionScience,
        dimension: i % 2 === 0 ? 'RECALL' : 'APPLICATION',
        score: 1.0,
        isCorrect: true,
      });
      events.push(res.evidenceEvent);
    }

    const liveProfile = engine.getMemoryEngine().getProfile(learnerId);
    const reconstructedProfile = engine.reconstructMemoryFromLedger(learnerId, events);

    expect(reconstructedProfile.totalEvidenceRecords).toBe(liveProfile.totalEvidenceRecords);
    expect(reconstructedProfile.conceptProfiles['c-photosynthesis'].currentMastery.recallScore).toBe(
      liveProfile.conceptProfiles['c-photosynthesis'].currentMastery.recallScore
    );
    expect(reconstructedProfile.conceptProfiles['c-photosynthesis'].currentMastery.status).toBe(
      liveProfile.conceptProfiles['c-photosynthesis'].currentMastery.status
    );
  });

  // ==========================================================================
  // Gate 10.9: Security Boundary & IDOR Prevention
  // ==========================================================================
  it('Gate 10.9: Blocks unauthorized cross-tenant learner access (IDOR protection)', () => {
    const studentContext = {
      requesterId: 'student-101',
      role: 'STUDENT' as const,
      authorizedLearnerIds: ['student-101'],
    };

    // Student accessing own state: Authorized
    const selfAccess = engine.verifyAccess(studentContext, 'student-101');
    expect(selfAccess.isAuthorized).toBe(true);

    // Student attempting to access another student's state: Blocked
    const idorAccess = engine.verifyAccess(studentContext, 'student-999');
    expect(idorAccess.isAuthorized).toBe(false);
    expect(idorAccess.reason).toContain('FORBIDDEN');
  });

  // ==========================================================================
  // Gate 10.F: Master Invariant Destruction Attack Suite
  // ==========================================================================
  it('Gate 10.F: Neutralizes attacks attempting to break the 10 Master Invariants', () => {
    // Attack 1: Attempt to mutate curriculum sequence index (INVARIANT-001)
    const atk1 = engine.executeInvariantAttack('ATTACK_INVARIANT_001_MUTATE_CURRICULUM', {
      position: { ...mockPositionScience },
    });
    expect(atk1.attackBlocked).toBe(true);

    // Attack 2: Attempt to manufacture mastery without evidence (INVARIANT-004)
    const atk2 = engine.executeInvariantAttack('ATTACK_INVARIANT_004_MANUFACTURE_MASTERY', {
      learnerId: 'unproven-learner',
      conceptId: 'c-photosynthesis',
    });
    expect(atk2.attackBlocked).toBe(true);

    // Attack 3: Attempt to mutate frozen evidence ledger (INVARIANT-005)
    const atk3 = engine.executeInvariantAttack('ATTACK_INVARIANT_005_MUTATE_EVIDENCE_RECORD', {});
    expect(atk3.attackBlocked).toBe(true);

    // Attack 4: Attempt to publish knowledge without provenance (INVARIANT-007)
    const atk4 = engine.executeInvariantAttack('ATTACK_INVARIANT_007_PUBLISH_UNPROVENANCED_KNOWLEDGE', {
      node: { id: 'c-fake', title: 'Fake Node' },
    });
    expect(atk4.attackBlocked).toBe(true);
  });
});
