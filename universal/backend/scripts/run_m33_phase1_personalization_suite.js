/**
 * ============================================================================
 * EKAGURU M3.3 PHASE 1 — COGNITIVE STATE & LEARNER PROFILE ACCEPTANCE SUITE
 * VERIFIES LEARNER PROFILE ISOLATION, DIAGNOSTIC STARTING DEPTH PLACEMENT,
 * BAYESIAN KNOWLEDGE TRACING (BKT) MASTERY ENGINE, AND CROSS-CHAPTER GRAPH
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const { LearnerProfileService } = require('../dist/learning-library/personalization/learner-profile.service');
const { DiagnosticAssessmentService } = require('../dist/learning-library/personalization/diagnostic-assessment.service');
const { ConceptMasteryEngineService } = require('../dist/learning-library/personalization/concept-mastery.service');
const { CrossChapterConceptKnowledgeGraphService } = require('../dist/learning-library/personalization/concept-knowledge-graph.service');

const results = [];

function recordTest(track, code, name, pass, detail) {
  results.push({ track, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + track + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runPhase1Suite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.3 PHASE 1: PERSONALIZATION & MASTERY SUITE');
  console.log('================================================================\n');

  const profileService = new LearnerProfileService();
  const diagnosticService = new DiagnosticAssessmentService(profileService);
  const masteryEngine = new ConceptMasteryEngineService(profileService);
  const knowledgeGraph = new CrossChapterConceptKnowledgeGraphService();

  // --------------------------------------------------------------------------
  // TRACK 1: Learner Profile & Modality Modeling (5 Tests)
  // --------------------------------------------------------------------------
  console.log('--- TRACK 1: Learner Profile & Modality Modeling ---');

  const alice = profileService.getOrCreateProfile('student-alice-01', 'Alice', 'Class 5');
  const bob = profileService.getOrCreateProfile('student-bob-02', 'Bob', 'Class 5');

  recordTest('PROFILE', 'T1-01', 'Profile Creation & ID Assignment', alice.studentId === 'student-alice-01' && bob.studentId === 'student-bob-02', 'Created profiles for Alice and Bob');
  
  profileService.updatePreferences('student-alice-01', 'VISUAL', 'GENTLE');
  profileService.updatePreferences('student-bob-02', 'READING', 'ACCELERATED');

  recordTest('PROFILE', 'T1-02', 'Alice Modality & Pace Configuration', alice.preferredModality === 'VISUAL' && alice.targetPace === 'GENTLE', 'Alice preferences: VISUAL / GENTLE');
  recordTest('PROFILE', 'T1-03', 'Bob Modality & Pace Configuration', bob.preferredModality === 'READING' && bob.targetPace === 'ACCELERATED', 'Bob preferences: READING / ACCELERATED');

  // Student Data Isolation Invariant
  recordTest('PROFILE', 'T1-04', 'Student Profile Isolation Invariant', alice.preferredModality !== bob.preferredModality && alice.targetPace !== bob.targetPace, 'Alice and Bob profiles strictly isolated');

  profileService.recordLessonCompleted('student-alice-01', 'evs-ch1');
  recordTest('PROFILE', 'T1-05', 'Historical Engagement Tracking', alice.totalLessonsCompleted === 1 && bob.totalLessonsCompleted === 0, 'Alice completed 1 lesson; Bob completed 0');

  // --------------------------------------------------------------------------
  // TRACK 2: Diagnostic Assessment & Starting Depth Placement (5 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 2: Diagnostic Assessment & Starting Depth Placement ---');

  // Alice scores 4/4 (100% readiness) -> Advanced
  const aliceDiag = diagnosticService.evaluateReadiness('student-alice-01', 'evs-class-5', 1, [
    { questionId: 'q1', conceptId: 'C0101', isCorrect: true },
    { questionId: 'q2', conceptId: 'C0102', isCorrect: true },
    { questionId: 'q3', conceptId: 'C0103', isCorrect: true },
    { questionId: 'q4', conceptId: 'C0104', isCorrect: true },
  ]);

  recordTest('DIAGNOSTIC', 'T2-01', 'High Readiness Score (100%)', aliceDiag.readinessScore === 1.0, 'Readiness score = 100%');
  recordTest('DIAGNOSTIC', 'T2-02', 'Advanced Starting Depth Placement', aliceDiag.assignedStartingDepth === 'advanced', 'Placed into starting depth: ADVANCED');

  // Bob scores 1/4 (25% readiness) -> Basis
  const bobDiag = diagnosticService.evaluateReadiness('student-bob-02', 'evs-class-5', 1, [
    { questionId: 'q1', conceptId: 'C0101', isCorrect: true },
    { questionId: 'q2', conceptId: 'C0102', isCorrect: false },
    { questionId: 'q3', conceptId: 'C0103', isCorrect: false },
    { questionId: 'q4', conceptId: 'C0104', isCorrect: false },
  ]);

  recordTest('DIAGNOSTIC', 'T2-03', 'Low Readiness Score (25%)', bobDiag.readinessScore === 0.25, 'Readiness score = 25%');
  recordTest('DIAGNOSTIC', 'T2-04', 'Basis Starting Depth Placement', bobDiag.assignedStartingDepth === 'basis', 'Placed into starting depth: BASIS');
  recordTest('DIAGNOSTIC', 'T2-05', 'Diagnostic Depth Profile Recording', alice.startingDepths['evs-class-5-ch1'] === 'advanced' && bob.startingDepths['evs-class-5-ch1'] === 'basis', 'Starting depths recorded in respective learner profiles');

  // --------------------------------------------------------------------------
  // TRACK 5: Concept Mastery Engine — Bayesian Knowledge Tracing (BKT) (6 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 5: Concept Mastery Engine — BKT ---');

  const prior = masteryEngine.getConceptMastery('student-alice-01', 'C0101');
  recordTest('MASTERY', 'T5-01', 'BKT Initial Prior (pL0 = 0.10)', prior === 0.10, 'Initial mastery probability = 10.0% (UNEXPLORED)');

  // Step 1: Alice answers correctly
  const step1 = masteryEngine.updateConceptMastery('student-alice-01', 'C0101', 'Living Things', true);
  recordTest('MASTERY', 'T5-02', 'BKT 1st Correct Update (Acquiring)', step1.masteryProbability > 0.40 && step1.masteryState === 'ACQUIRING', 'p(L_1) = ' + (step1.masteryProbability * 100).toFixed(1) + '% (ACQUIRING)');

  // Step 2: Alice answers correctly 2nd time -> MASTERED (p >= 0.85)
  const step2 = masteryEngine.updateConceptMastery('student-alice-01', 'C0101', 'Living Things', true);
  recordTest('MASTERY', 'T5-03', 'BKT 2nd Correct Update (Mastered)', step2.masteryProbability >= 0.85 && step2.masteryState === 'MASTERED', 'p(L_2) = ' + (step2.masteryProbability * 100).toFixed(1) + '% (MASTERED)');

  // Step 3: Alice answers correctly 3rd time -> RETAINED (p >= 0.95)
  const step3 = masteryEngine.updateConceptMastery('student-alice-01', 'C0101', 'Living Things', true);
  recordTest('MASTERY', 'T5-04', 'BKT 3rd Correct Update (Retained)', step3.masteryProbability >= 0.95 && step3.masteryState === 'RETAINED', 'p(L_3) = ' + (step3.masteryProbability * 100).toFixed(1) + '% (RETAINED)');

  // Struggling Concept Invariant: Bob answers incorrectly
  const bobStep1 = masteryEngine.updateConceptMastery('student-bob-02', 'C0101', 'Living Things', false);
  recordTest('MASTERY', 'T5-05', 'BKT Incorrect Update Resistance', bobStep1.masteryProbability < 0.20, 'Bob p(L_1) after incorrect = ' + (bobStep1.masteryProbability * 100).toFixed(1) + '%');
  recordTest('MASTERY', 'T5-06', 'Cross-Student BKT Isolation', alice.conceptMasteryMap['C0101'] > 0.90 && bob.conceptMasteryMap['C0101'] < 0.20, 'Alice mastered C0101 while Bob is acquiring C0101');

  // --------------------------------------------------------------------------
  // TRACK 11: Cross-Chapter Concept Knowledge Graph (4 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 11: Cross-Chapter Concept Knowledge Graph ---');

  const topology = knowledgeGraph.getTopology();
  recordTest('GRAPH', 'T11-01', 'Knowledge Graph Topology Nodes', topology.totalNodes >= 5, 'Found ' + topology.totalNodes + ' concept nodes');
  recordTest('GRAPH', 'T11-02', 'Knowledge Graph Topology Edges', topology.totalEdges >= 4, 'Found ' + topology.totalEdges + ' dependency edges');

  const c0102Prereqs = knowledgeGraph.getPrerequisites('C0102');
  recordTest('GRAPH', 'T11-03', 'Prerequisite Query (C0101 -> C0102)', c0102Prereqs.some((p) => p.conceptId === 'C0101'), 'C0101 (Living Things) is prerequisite of C0102 (Growth Continuum)');

  const c0101Dependents = knowledgeGraph.getDependents('C0101');
  recordTest('GRAPH', 'T11-04', 'Cross-Chapter Dependent Query', c0101Dependents.length >= 3, 'C0101 connects to 3 dependent concepts across EVS and Science');

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.3 PHASE 1 PERSONALIZATION SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' PHASE 1 PERSONALIZATION TESTS PASSED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runPhase1Suite().catch((err) => {
  console.error('Fatal Phase 1 Personalization Suite Error:', err);
  process.exit(1);
});
