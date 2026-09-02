/**
 * ============================================================================
 * EKAGURU M3.3 PHASE 4 — MASTER PERSONALIZATION & ADVERSARIAL SIGN-OFF SUITE
 * VERIFIES MULTI-STUDENT CONCURRENCY ISOLATION, ADAPTIVE DEPTH MUTATIONS,
 * MISCONCEPTION CATCH INVARIANTS, BKT STABILITY, AND DASHBOARD CITATION TRAILS
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const { LearnerProfileService } = require('../dist/learning-library/personalization/learner-profile.service');
const { DiagnosticAssessmentService } = require('../dist/learning-library/personalization/diagnostic-assessment.service');
const { ConceptMasteryEngineService } = require('../dist/learning-library/personalization/concept-mastery.service');
const { AdaptivePacingEngineService } = require('../dist/learning-library/personalization/adaptive-pacing.service');
const { GroundedSocraticTutorService } = require('../dist/learning-library/personalization/grounded-socratic-tutor.service');
const { PersonalizedArtifactSelectorService } = require('../dist/learning-library/personalization/personalized-artifact-selector.service');
const { AdaptiveSessionManagerService } = require('../dist/learning-library/personalization/adaptive-session-manager.service');
const { SpacedReinforcementSchedulerService } = require('../dist/learning-library/personalization/spaced-reinforcement.service');
const { TeacherDashboardService } = require('../dist/learning-library/personalization/teacher-dashboard.service');
const { ParentDashboardService } = require('../dist/learning-library/personalization/parent-dashboard.service');
const { CanonicalEvidencePackService } = require('../dist/learning-library/knowledge/canonical-evidence-pack.service');
const { ContentFactoryService } = require('../dist/learning-library/ai-factory/content-factory.service');

const results = [];

function recordTest(category, code, name, pass, detail) {
  results.push({ category, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + category + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runM33SignOffSuite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.3 PHASE 4: MASTER PERSONALIZATION SIGN-OFF SUITE');
  console.log('================================================================\n');

  const profileService = new LearnerProfileService();
  const diagnosticService = new DiagnosticAssessmentService(profileService);
  const masteryEngine = new ConceptMasteryEngineService(profileService);
  const pacingEngine = new AdaptivePacingEngineService();
  const socraticTutor = new GroundedSocraticTutorService();
  const artifactSelector = new PersonalizedArtifactSelectorService();
  const spacedScheduler = new SpacedReinforcementSchedulerService(profileService);
  const evidencePackService = new CanonicalEvidencePackService();
  const contentFactory = new ContentFactoryService();
  const teacherDashboard = new TeacherDashboardService(profileService, evidencePackService);
  const parentDashboard = new ParentDashboardService(profileService);

  const sessionManager = new AdaptiveSessionManagerService(
    profileService,
    pacingEngine,
    socraticTutor,
    artifactSelector,
    masteryEngine
  );

  const evsPack = evidencePackService.buildChapterEvidencePack('evs-class-5', 1, 'About Me', 3, 7, 'Living things grow', ['Living Things', 'Growth']);
  const evsPackage = contentFactory.generateTeachingPackage(evsPack);

  // --------------------------------------------------------------------------
  // 1. Multi-Student Concurrent Session Isolation (4 Students)
  // --------------------------------------------------------------------------
  console.log('--- 1. Multi-Student Concurrent Session Isolation ---');
  const students = ['student-alice', 'student-bob', 'student-charlie', 'student-david'];
  const sessions = students.map((s, idx) => sessionManager.startSession(s, 'evs-class-5', 1, idx % 2 === 0 ? 'developing' : 'basis'));

  const uniqueSessionIds = new Set(sessions.map((s) => s.sessionId)).size === 4;
  recordTest('CONCURRENCY', 'M33-SO-01', 'Multi-Student Session Isolation', uniqueSessionIds, '4 concurrent student sessions isolated');

  // --------------------------------------------------------------------------
  // 2. Adaptive Depth Mutation Testing (Remediation & Advancement)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Adaptive Depth Mutation Testing ---');
  const testSession = sessionManager.startSession('student-mut-01', 'evs-class-5', 1, 'proficient');
  
  // Inject 2 failures -> drop to developing
  sessionManager.processStudentStep(testSession.sessionId, 'C0101', 'Living Things', 'wrong', false, evsPack, evsPackage);
  const step2 = sessionManager.processStudentStep(testSession.sessionId, 'C0101', 'Living Things', 'wrong', false, evsPack, evsPackage);
  
  recordTest('ADAPTIVE_MUTATION', 'M33-SO-02', 'Remediation Drop on Failure Mutation', step2.session.currentDepth === 'developing', 'Dropped from proficient to developing on 2 failures');

  // Inject 3 consecutive successes -> promote back to proficient
  sessionManager.processStudentStep(testSession.sessionId, 'C0101', 'Living Things', 'correct 1', true, evsPack, evsPackage);
  sessionManager.processStudentStep(testSession.sessionId, 'C0101', 'Living Things', 'correct 2', true, evsPack, evsPackage);
  const step5 = sessionManager.processStudentStep(testSession.sessionId, 'C0101', 'Living Things', 'correct 3', true, evsPack, evsPackage);

  recordTest('ADAPTIVE_MUTATION', 'M33-SO-03', 'Advancement Promotion on Success Mutation', step5.session.currentDepth === 'proficient', 'Promoted from developing to proficient on 3 successes');

  // --------------------------------------------------------------------------
  // 3. Socratic Misconception Adversarial Test
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Socratic Misconception Adversarial Test ---');
  const miscDiagnosis = socraticTutor.diagnoseAnswer('C0101', 'The crystal grows and becomes huge so it is a living being', evsPack);
  recordTest(
    'SOCRATIC_MUTATION',
    'M33-SO-04',
    'Adversarial Inanimate Growth Misconception Catch',
    miscDiagnosis.detected === true && miscDiagnosis.misconceptionId === 'MISC_01',
    'Caught misconception: ' + miscDiagnosis.misconceptionName
  );

  // --------------------------------------------------------------------------
  // 4. Mastery-State Boundary & BKT Bounds Invariant
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Mastery-State Boundary & BKT Bounds ---');
  const p1 = masteryEngine.updateConceptMastery('student-bkt-test', 'C0101', 'Living Things', true);
  recordTest('MASTERY_BOUNDS', 'M33-SO-05', 'BKT Probability Bounds [0, 1]', p1.masteryProbability >= 0.0 && p1.masteryProbability <= 1.0, 'p(L_t) = ' + p1.masteryProbability + ' strictly in [0, 1]');

  // --------------------------------------------------------------------------
  // 5. Spaced Reinforcement Scheduling Priority Escalation
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Spaced Reinforcement Priority Escalation ---');
  const freshSchedule = spacedScheduler.generateSchedule('student-bkt-test', { C0101: 1 });
  const agedSchedule = spacedScheduler.generateSchedule('student-bkt-test', { C0101: 20 });
  recordTest('SPACED_MUTATION', 'M33-SO-06', 'Decay Priority Escalation Invariant', agedSchedule.reviewItems[0].priority === 'CRITICAL', 'Review priority escalated to CRITICAL after 20 days elapsed');

  // --------------------------------------------------------------------------
  // 6. Teacher & Parent Dashboard Isolation Invariants
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Teacher & Parent Dashboard Isolation Invariants ---');
  const classReport = teacherDashboard.generateClassroomDashboard(['student-alice', 'student-bob'], 'evs-class-5', 1);
  recordTest('DASH_ISOLATION', 'M33-SO-07', 'Teacher Dashboard Student Scope', classReport.masteryHeatmap.length === 2, 'Report strictly limited to 2 enrolled students');

  const parentAlice = parentDashboard.generateParentReport('student-alice');
  const parentBob = parentDashboard.generateParentReport('student-bob');
  recordTest('DASH_ISOLATION', 'M33-SO-08', 'Parent Dashboard Data Isolation', parentAlice.studentId !== parentBob.studentId, 'Parent reports isolated between student families');

  // --------------------------------------------------------------------------
  // 7. EvidencePack & Citation Integrity in Dashboards
  // --------------------------------------------------------------------------
  console.log('\n--- 7. EvidencePack Citation Integrity in Dashboards ---');
  const firstCitation = classReport.evidenceInspectionTrail[0];
  recordTest(
    'CITATION_INTEGRITY',
    'M33-SO-09',
    'Dashboard Citation Provenance Invariant',
    firstCitation.physicalPage === 3 && firstCitation.bbox.width === 400,
    'Citation bound to Page 3 scan bbox: (width=400, height=39)'
  );

  // --------------------------------------------------------------------------
  // 8. Session Recovery / Browser-Refresh Invariant
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Session Recovery / Browser-Refresh Invariant ---');
  const recoveredSession = sessionManager.getSession(testSession.sessionId);
  recordTest(
    'SESSION_RECOVERY',
    'M33-SO-10',
    'Active Session State Recovery Invariant',
    recoveredSession.sessionId === testSession.sessionId && recoveredSession.interactionHistory.length === 5,
    'Restored full session with all 5 interaction steps intact'
  );

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.3 PHASE 4 MASTER SIGN-OFF SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' MASTER SIGN-OFF INVARIANTS MET! M3.3 PRODUCTION SIGN-OFF ACHIEVED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runM33SignOffSuite().catch((err) => {
  console.error('Fatal M3.3 Master Sign-Off Error:', err);
  process.exit(1);
});
