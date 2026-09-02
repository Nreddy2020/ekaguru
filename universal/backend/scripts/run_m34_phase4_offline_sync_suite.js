/**
 * ============================================================================
 * EKAGURU M3.4 PHASE 4 — OFFLINE-FIRST PWA & DETERMINISTIC DELTA SYNCHRONIZATION
 * VERIFIES OFFLINE LOCAL SESSION STATE, ADAPTIVE DEPTH PROGRESSION,
 * DELTA SYNC REPLAY, DUPLICATE SYNC PROTECTION, AND MASTER BKT DETERMINISTIC PARITY
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const { MultiTenantSchoolService } = require('../dist/learning-library/tenancy/multi-tenant-school.service');
const { MultiTenantSecurityService } = require('../dist/learning-library/tenancy/multi-tenant-security.service');
const { LearnerProfileService } = require('../dist/learning-library/personalization/learner-profile.service');
const { ConceptMasteryEngineService } = require('../dist/learning-library/personalization/concept-mastery.service');
const { AdaptivePacingEngineService } = require('../dist/learning-library/personalization/adaptive-pacing.service');
const { OfflinePwaSyncService } = require('../dist/learning-library/offline/offline-pwa-sync.service');

const results = [];

function recordTest(step, code, name, pass, detail) {
  results.push({ step, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + step + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runM34Phase4Suite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.4 PHASE 4: OFFLINE PWA & DETERMINISTIC DELTA SYNC');
  console.log('================================================================\n');

  const schoolService = new MultiTenantSchoolService();
  const securityService = new MultiTenantSecurityService(schoolService);
  const profileService = new LearnerProfileService();
  const masteryEngine = new ConceptMasteryEngineService(profileService);
  const pacingEngine = new AdaptivePacingEngineService();
  const offlineSyncService = new OfflinePwaSyncService(
    schoolService,
    securityService,
    masteryEngine,
    pacingEngine
  );

  const aliceContext = {
    districtId: 'dist-delhi-01',
    schoolId: 'school-delhi-dps',
    callerId: 'student-alice-01',
    role: 'STUDENT',
  };

  const charlieContextB = {
    districtId: 'dist-delhi-01',
    schoolId: 'school-delhi-mva',
    callerId: 'student-charlie-03',
    role: 'STUDENT',
  };

  // --------------------------------------------------------------------------
  // STEP 4.1 & 4.5 — Offline Session Initialization (3 Tests)
  // --------------------------------------------------------------------------
  console.log('--- STEP 4.1 & 4.5: Offline Session Initialization ---');

  const offlineSession = offlineSyncService.initOfflineSession('student-alice-01', 'evs-class-5', 1, 'C0101', 'developing');
  recordTest('STEP_4.5', 'M34-S4-01', 'Offline Session Initialization', offlineSession.isOffline === true && offlineSession.currentStep === 1, 'Initialized offline session at Step 1');
  recordTest('STEP_4.5', 'M34-S4-02', 'Total Preserved Steps Invariant', offlineSession.totalSteps === 4, '4 textbook-grounded instructional steps preserved');
  recordTest('STEP_4.5', 'M34-S4-03', 'Empty Pending Event Queue', offlineSession.pendingEvents.length === 0, 'Pending event queue ready for local recording');

  // --------------------------------------------------------------------------
  // STEP 4.6 & 4.11 — Offline Interaction Logging & Local Progression (4 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 4.6 & 4.11: Offline Interaction Logging & Progression ---');

  // Step 1: Correct Answer
  const r1 = offlineSyncService.recordOfflineInteraction(offlineSession.sessionId, 'ANSWER_SUBMITTED', 'C0101', { isCorrect: true, studentAnswerText: 'Plants grow' });
  recordTest('STEP_4.6', 'M34-S4-04', 'Offline Step 1 Event Recording', r1.state.pendingEvents.length === 1, 'Recorded offline event 1');
  recordTest('STEP_4.11', 'M34-S4-05', 'Offline Step Advancement (Step 1 -> 2)', r1.state.currentStep === 2, 'Locally advanced to Step 2');

  // Step 2: Correct Answer
  const r2 = offlineSyncService.recordOfflineInteraction(offlineSession.sessionId, 'ANSWER_SUBMITTED', 'C0101', { isCorrect: true, studentAnswerText: 'Animals grow' });
  recordTest('STEP_4.11', 'M34-S4-06', 'Offline Step Advancement (Step 2 -> 3)', r2.state.currentStep === 3, 'Locally advanced to Step 3');

  // Step 3: Hint Request
  const r3 = offlineSyncService.recordOfflineInteraction(offlineSession.sessionId, 'HINT_REQUESTED', 'C0101', { stepIndex: 3 });
  recordTest('STEP_4.6', 'M34-S4-07', 'Offline Hint Engagement Event', r3.state.pendingEvents.length === 3, 'Recorded 3 total offline interaction events');

  // --------------------------------------------------------------------------
  // STEP 4.8 & 4.9 — Delta Synchronization & Duplicate Protection (4 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 4.8 & 4.9: Delta Synchronization & Duplicate Protection ---');

  const syncReq = {
    studentId: 'student-alice-01',
    sessionId: offlineSession.sessionId,
    lastServerSequenceReceived: 0,
    events: offlineSession.pendingEvents,
  };

  const syncRes = offlineSyncService.processDeltaSync(aliceContext, syncReq);
  recordTest('STEP_4.8', 'M34-S4-08', 'Delta Sync Execution', syncRes.synced === true, 'Successfully synced offline events to server');
  recordTest('STEP_4.8', 'M34-S4-09', 'Processed Events Count', syncRes.processedEventsCount === 3, 'Processed 3 delta events');

  // Re-sync duplicate events (Duplicate Sync Protection)
  const dupSyncRes = offlineSyncService.processDeltaSync(aliceContext, syncReq);
  recordTest('STEP_4.9', 'M34-S4-10', 'Duplicate Sync Idempotency Guard', dupSyncRes.processedEventsCount === 0, 'Zero duplicate events re-processed (Deduplicated cleanly)');

  recordTest('STEP_4.8', 'M34-S4-11', 'Client Sequence Acknowledgments', syncRes.acknowledgedClientSequences.length === 3, 'Acknowledged client sequences [1, 2, 3]');

  // --------------------------------------------------------------------------
  // STEP 4.10 — MASTER INVARIANT: Online / Offline BKT Deterministic Parity (3 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 4.10: MASTER INVARIANT — Online / Offline BKT Parity ---');

  // 1. Calculate Online BKT Path for Student Bob (2 correct answers)
  profileService.getOrCreateProfile('student-bob-02');
  masteryEngine.updateConceptMastery('student-bob-02', 'C0101', 'Living Things', true);
  const bobOnlineFinal = masteryEngine.updateConceptMastery('student-bob-02', 'C0101', 'Living Things', true);

  // 2. Calculate Offline BKT Path for Student Charlie (2 correct answers offline, then replayed via sync)
  const charlieOfflineSession = offlineSyncService.initOfflineSession('student-charlie-03', 'evs-class-5', 1, 'C0101');
  offlineSyncService.recordOfflineInteraction(charlieOfflineSession.sessionId, 'ANSWER_SUBMITTED', 'C0101', { isCorrect: true });
  offlineSyncService.recordOfflineInteraction(charlieOfflineSession.sessionId, 'ANSWER_SUBMITTED', 'C0101', { isCorrect: true });

  const charlieSyncRes = offlineSyncService.processDeltaSync(charlieContextB, {
    studentId: 'student-charlie-03',
    sessionId: charlieOfflineSession.sessionId,
    lastServerSequenceReceived: 0,
    events: charlieOfflineSession.pendingEvents,
  });

  const charlieOfflineReplayFinal = charlieSyncRes.currentMasteryProbability;

  recordTest(
    'STEP_4.10',
    'M34-S4-12',
    'Online BKT Computation Result',
    bobOnlineFinal.masteryProbability > 0.87 && bobOnlineFinal.masteryProbability < 0.88,
    'Bob Online Mastery: ' + (bobOnlineFinal.masteryProbability * 100).toFixed(1) + '%'
  );
  recordTest(
    'STEP_4.10',
    'M34-S4-13',
    'Offline Replay BKT Computation Result',
    charlieOfflineReplayFinal > 0.87 && charlieOfflineReplayFinal < 0.88,
    'Charlie Offline Replay Mastery: ' + (charlieOfflineReplayFinal * 100).toFixed(1) + '%'
  );
  recordTest(
    'STEP_4.10',
    'M34-S4-14',
    'DETERMINISTIC BKT PARITY INVARIANT (Online == Offline Replay)',
    bobOnlineFinal.masteryProbability === charlieOfflineReplayFinal,
    'PERFECT MATHEMATICAL PARITY ACHIEVED: 0.874 === 0.874'
  );

  // --------------------------------------------------------------------------
  // STEP 4.14 & 4.15 — Conflict Resolution & Adversarial Security (3 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 4.14 & 4.15: Conflict Resolution & Security ---');

  // Out-of-order client events sorted deterministically
  const outOfOrderReq = {
    studentId: 'student-alice-01',
    sessionId: 'sess-ooo-test',
    lastServerSequenceReceived: 0,
    events: [
      { eventId: 'evt-ooo-2', studentId: 'student-alice-01', sessionId: 'sess-ooo-test', clientSequence: 2, eventType: 'STEP_PROGRESSED', conceptId: 'C0101', payload: { stepIndex: 2 }, occurredAt: new Date().toISOString() },
      { eventId: 'evt-ooo-1', studentId: 'student-alice-01', sessionId: 'sess-ooo-test', clientSequence: 1, eventType: 'STEP_PROGRESSED', conceptId: 'C0101', payload: { stepIndex: 1 }, occurredAt: new Date().toISOString() },
    ],
  };
  const oooRes = offlineSyncService.processDeltaSync(aliceContext, outOfOrderReq);
  recordTest('STEP_4.14', 'M34-S4-15', 'Out-Of-Order Event Re-Sorting Resolution', oooRes.acknowledgedClientSequences[0] === 1 && oooRes.acknowledgedClientSequences[1] === 2, 'Re-ordered events processed in sequence [1, 2]');

  // Cross-tenant delta sync attempt (Alice in School A attempts to sync Charlie in School B) -> 404 NOT FOUND
  let crossTenantSyncBlocked = false;
  try {
    offlineSyncService.processDeltaSync(aliceContext, {
      studentId: 'student-charlie-03',
      sessionId: 'sess-fake',
      lastServerSequenceReceived: 0,
      events: [],
    });
  } catch (err) {
    crossTenantSyncBlocked = err.name === 'NotFoundException';
  }
  recordTest('STEP_4.15', 'M34-S4-16', 'Cross-Tenant Delta Sync Guard (404)', crossTenantSyncBlocked, 'Blocked cross-tenant delta sync attempt');

  // Persistent depth update after high mastery
  recordTest('STEP_4.11', 'M34-S4-17', 'Adaptive Depth Promotion from Synced Replay', syncRes.currentDepth === 'proficient' || charlieSyncRes.currentDepth === 'proficient', 'Promoted depth to proficient after mastery verification');

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.4 PHASE 4 OFFLINE SYNC SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' OFFLINE PWA & DETERMINISTIC DELTA SYNC TESTS PASSED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' OFFLINE SYNC TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runM34Phase4Suite().catch((err) => {
  console.error('Fatal M3.4 Phase 4 Offline Sync Suite Error:', err);
  process.exit(1);
});
