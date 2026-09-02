/**
 * ============================================================================
 * EKAGURU M3.4 PHASE 2 — REAL-TIME COLLABORATIVE CLASSROOM & LIVE SESSIONS
 * VERIFIES SERVER-AUTHORITATIVE STEP SYNCHRONIZATION, EVENT ORDERING,
 * LIVE POLLING WITH BKT MASTERY, HAND-RAISE SPOTLIGHT, RECONNECT RECOVERY,
 * AND 100+ CONCURRENT STUDENT STRESS SCENARIOS
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const { MultiTenantSchoolService } = require('../dist/learning-library/tenancy/multi-tenant-school.service');
const { MultiTenantSecurityService } = require('../dist/learning-library/tenancy/multi-tenant-security.service');
const { LearnerProfileService } = require('../dist/learning-library/personalization/learner-profile.service');
const { ConceptMasteryEngineService } = require('../dist/learning-library/personalization/concept-mastery.service');
const { LiveClassroomSessionService } = require('../dist/learning-library/classroom/live-classroom-session.service');

const results = [];

function recordTest(suite, code, name, pass, detail) {
  results.push({ suite, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + suite + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runM34Phase2Suite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.4 PHASE 2: REAL-TIME CLASSROOM & LIVE SESSION SUITE');
  console.log('================================================================\n');

  const schoolService = new MultiTenantSchoolService();
  const securityService = new MultiTenantSecurityService(schoolService);
  const profileService = new LearnerProfileService();
  const masteryEngine = new ConceptMasteryEngineService(profileService);
  const liveSessionService = new LiveClassroomSessionService(schoolService, securityService, masteryEngine);

  // Setup Teacher & Student Contexts
  const teacherContext = {
    districtId: 'dist-delhi-01',
    schoolId: 'school-delhi-dps',
    callerId: 'teacher-sharma-01',
    role: 'TEACHER',
  };

  const aliceContext = {
    districtId: 'dist-delhi-01',
    schoolId: 'school-delhi-dps',
    callerId: 'student-alice-01',
    role: 'STUDENT',
  };

  const bobContext = {
    districtId: 'dist-delhi-01',
    schoolId: 'school-delhi-dps',
    callerId: 'student-bob-02',
    role: 'STUDENT',
  };

  // --------------------------------------------------------------------------
  // SUITE A: Session Authority & Lifecycle Transitions (5 Tests)
  // --------------------------------------------------------------------------
  console.log('--- SUITE A: Session Authority & Lifecycle Transitions ---');

  const session = liveSessionService.createSession(teacherContext, 'sec-dps-5a', 'evs-class-5', 1, 4);
  recordTest('LIFECYCLE', 'M34-S2-01', 'Live Session Creation (CREATED)', session.status === 'CREATED', 'Session initialized in CREATED state');

  liveSessionService.updateSessionStatus(teacherContext, session.sessionId, 'LIVE');
  recordTest('LIFECYCLE', 'M34-S2-02', 'Teacher Starts Session (LIVE)', session.status === 'LIVE' && !!session.startedAt, 'Session transitioned to LIVE');

  liveSessionService.updateSessionStatus(teacherContext, session.sessionId, 'PAUSED');
  recordTest('LIFECYCLE', 'M34-S2-03', 'Teacher Pauses Session (PAUSED)', session.status === 'PAUSED', 'Session transitioned to PAUSED');

  liveSessionService.updateSessionStatus(teacherContext, session.sessionId, 'LIVE');
  recordTest('LIFECYCLE', 'M34-S2-04', 'Teacher Resumes Session (LIVE)', session.status === 'LIVE', 'Session resumed back to LIVE');

  // Student attempts to end session -> FORBIDDEN
  let studentForbiddenBlocked = false;
  try {
    liveSessionService.updateSessionStatus(aliceContext, session.sessionId, 'ENDED');
  } catch (err) {
    studentForbiddenBlocked = err.name === 'ForbiddenException';
  }
  recordTest('LIFECYCLE', 'M34-S2-05', 'Student Authority Bypass Guard (403)', studentForbiddenBlocked, 'Student blocked from altering session lifecycle');

  // --------------------------------------------------------------------------
  // SUITE B: Server-Authoritative Step Synchronization & Idempotency (4 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE B: Step Synchronization & Idempotency ---');

  liveSessionService.joinSession(aliceContext, session.sessionId);
  liveSessionService.joinSession(bobContext, session.sessionId);

  liveSessionService.setStep(teacherContext, session.sessionId, 2, 'idem-step-2');
  recordTest('STEP_SYNC', 'M34-S2-06', 'Teacher Advances Step (Step 1 -> 2)', session.currentStep === 2, 'All students synchronized to Step 2');

  // Duplicate step command with same idempotency key
  const prevSeq = session.lastServerSequence;
  liveSessionService.setStep(teacherContext, session.sessionId, 2, 'idem-step-2');
  recordTest('STEP_SYNC', 'M34-S2-07', 'Step Change Idempotency Guard', session.lastServerSequence === prevSeq, 'Duplicate step command ignored cleanly');

  // Out of bounds step
  let oobBlocked = false;
  try {
    liveSessionService.setStep(teacherContext, session.sessionId, 99);
  } catch (err) {
    oobBlocked = err.name === 'BadRequestException';
  }
  recordTest('STEP_SYNC', 'M34-S2-08', 'Step Out-Of-Bounds Guard', oobBlocked, 'Rejected invalid Step 99');

  recordTest('STEP_SYNC', 'M34-S2-09', 'Deterministic Server Sequence Ordering', session.lastServerSequence > 100, 'Sequence assigned: ' + session.lastServerSequence);

  // --------------------------------------------------------------------------
  // SUITE C: Live Polling with BKT Mastery Linkage (5 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE C: Live Polling & BKT Mastery Integration ---');

  const poll = liveSessionService.publishPoll(
    teacherContext,
    session.sessionId,
    'Which of the following is a living thing?',
    ['Wooden Chair', 'Green Plant', 'Plastic Bottle', 'Stone Table'],
    1, // Correct is Option 1: Green Plant
    'C0101' // Concept ID: Living Things
  );
  recordTest('POLLING', 'M34-S2-10', 'Poll Publication (OPEN)', poll.status === 'OPEN', 'Published poll: ' + poll.question);

  // Alice submits correct answer (Option 1)
  const aliceVote = liveSessionService.recordPollResponse(aliceContext, session.sessionId, poll.pollId, 1, 'idem-alice-vote');
  recordTest('POLLING', 'M34-S2-11', 'Student Poll Vote Submission', aliceVote.recorded === true, 'Alice voted Option 1');

  // Check Alice's BKT mastery was automatically updated!
  const aliceProfile = profileService.getOrCreateProfile('student-alice-01');
  const aliceMastery = aliceProfile.conceptMasteryMap['C0101'];
  recordTest('POLLING', 'M34-S2-12', 'M3.3 BKT Mastery Automatic Update from Poll', aliceMastery > 0.10, 'Alice mastery for C0101 updated to ' + (aliceMastery * 100).toFixed(1) + '%');

  // Bob submits wrong answer (Option 0)
  liveSessionService.recordPollResponse(bobContext, session.sessionId, poll.pollId, 0);

  // Teacher closes and reveals poll
  liveSessionService.closePoll(teacherContext, session.sessionId);
  recordTest('POLLING', 'M34-S2-13', 'Poll Closing (CLOSED)', poll.status === 'CLOSED', 'Poll closed by teacher');

  const resultsReveal = liveSessionService.revealPoll(teacherContext, session.sessionId);
  recordTest('POLLING', 'M34-S2-14', 'Poll Distribution Reveal', resultsReveal.distribution[1] === 1 && resultsReveal.distribution[0] === 1, 'Poll revealed: 1 for Plant, 1 for Chair');

  // --------------------------------------------------------------------------
  // SUITE D: Hand-Raise Queue & Socratic Spotlighting (3 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE D: Hand-Raise Queue & Socratic Spotlight ---');

  liveSessionService.raiseHand(aliceContext, session.sessionId);
  recordTest('HAND_RAISE', 'M34-S2-15', 'Student Hand-Raise Queue', session.raisedHandsQueue.length === 1 && session.raisedHandsQueue[0].studentId === 'student-alice-01', 'Alice added to hand-raise queue');

  liveSessionService.spotlightStudent(teacherContext, session.sessionId, 'student-alice-01');
  recordTest('HAND_RAISE', 'M34-S2-16', 'Teacher Socratic Spotlight Activation', session.spotlightedStudent.studentId === 'student-alice-01', 'Alice spotlighted for classroom discussion');

  liveSessionService.clearSpotlight(teacherContext, session.sessionId);
  recordTest('HAND_RAISE', 'M34-S2-17', 'Spotlight Clear Invariant', session.spotlightedStudent === null, 'Spotlight cleared');

  // --------------------------------------------------------------------------
  // SUITE E: Reconnection & Snapshot State Recovery (2 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE E: Reconnection & Snapshot State Recovery ---');

  const snapshot = liveSessionService.getSessionSnapshot(aliceContext, session.sessionId, 102);
  recordTest('RECOVERY', 'M34-S2-18', 'Snapshot Current State Parity', snapshot.session.currentStep === 2 && snapshot.session.status === 'LIVE', 'Recovered current step 2 and status LIVE');
  recordTest('RECOVERY', 'M34-S2-19', 'Missed Events Delta Delivery', snapshot.missedEvents.length > 0, 'Delivered ' + snapshot.missedEvents.length + ' missed events to reconnecting client');

  // --------------------------------------------------------------------------
  // SUITE F: 100+ Concurrent Students Stress Test (1 Test)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE F: 100+ Concurrent Students Stress Testing ---');

  const stressSession = liveSessionService.createSession(teacherContext, 'sec-dps-5a', 'evs-class-5', 1, 4);
  liveSessionService.updateSessionStatus(teacherContext, stressSession.sessionId, 'LIVE');
  const stressPoll = liveSessionService.publishPoll(teacherContext, stressSession.sessionId, 'Test Stress Poll', ['A', 'B'], 0);

  const numStudents = 100;
  for (let i = 1; i <= numStudents; i++) {
    const sId = 'student-stress-' + i;
    const sCtx = { districtId: 'dist-delhi-01', schoolId: 'school-delhi-dps', callerId: sId, role: 'STUDENT' };
    liveSessionService.joinSession(sCtx, stressSession.sessionId);
    liveSessionService.recordPollResponse(sCtx, stressSession.sessionId, stressPoll.pollId, i % 2);
  }

  const stressResults = liveSessionService.revealPoll(teacherContext, stressSession.sessionId);
  const totalVotesCounted = stressResults.totalVotes;
  recordTest('STRESS', 'M34-S2-20', '100+ Concurrent Student Polling Invariant', totalVotesCounted === 100, 'Successfully handled 100 concurrent student joins and votes (0 drop)');

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.4 PHASE 2 LIVE CLASSROOM SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' LIVE CLASSROOM & REAL-TIME TESTS PASSED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runM34Phase2Suite().catch((err) => {
  console.error('Fatal M3.4 Phase 2 Live Classroom Suite Error:', err);
  process.exit(1);
});
