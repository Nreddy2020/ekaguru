/**
 * ============================================================================
 * EKAGURU M3.4 PHASE 3 — PEER COLLABORATION & GROUNDED SHARED ANNOTATIONS
 * VERIFIES TEXTBOOK-BOUND COLLABORATIVE ROOMS, ROLES (EXPLORER, ANALYST, SCRIBE),
 * SHARED BBOX EVIDENCE, GROUNDED DISCUSSIONS, BKT MASTERY LINK, AND TENANT SECURITY
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const { MultiTenantSchoolService } = require('../dist/learning-library/tenancy/multi-tenant-school.service');
const { MultiTenantSecurityService } = require('../dist/learning-library/tenancy/multi-tenant-security.service');
const { LearnerProfileService } = require('../dist/learning-library/personalization/learner-profile.service');
const { ConceptMasteryEngineService } = require('../dist/learning-library/personalization/concept-mastery.service');
const { CanonicalEvidencePackService } = require('../dist/learning-library/knowledge/canonical-evidence-pack.service');
const { PeerCollaborationService } = require('../dist/learning-library/collaboration/peer-collaboration.service');

const results = [];

function recordTest(step, code, name, pass, detail) {
  results.push({ step, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + step + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runM34Phase3Suite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.4 PHASE 3: PEER COLLABORATION & GROUNDED EVIDENCE');
  console.log('================================================================\n');

  const schoolService = new MultiTenantSchoolService();
  const securityService = new MultiTenantSecurityService(schoolService);
  const profileService = new LearnerProfileService();
  const masteryEngine = new ConceptMasteryEngineService(profileService);
  const evidencePackService = new CanonicalEvidencePackService();
  const collabService = new PeerCollaborationService(
    schoolService,
    securityService,
    masteryEngine,
    evidencePackService
  );

  const teacherA = {
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

  const charlieContextB = {
    districtId: 'dist-delhi-01',
    schoolId: 'school-delhi-mva',
    callerId: 'student-charlie-03',
    role: 'STUDENT',
  };

  // --------------------------------------------------------------------------
  // STEP 3.1 & 3.3 — Collaborative Room & Book-Grounded Task (3 Tests)
  // --------------------------------------------------------------------------
  console.log('--- STEP 3.1 & 3.3: Collaborative Room & Book-Grounded Task ---');

  const room = collabService.createRoom(teacherA, 'sec-dps-5a', 'evs-class-5', 1, 'C0101', 'developing', 2);
  recordTest('STEP_3.1', 'M34-S3-01', 'Curriculum-Bound Room Creation', room.conceptId === 'C0101' && room.physicalPage === 2, 'Room linked to C0101 & Page 2');
  recordTest('STEP_3.3', 'M34-S3-02', 'Grounded Task Challenge Generation', room.taskChallengePrompt.includes('Page 2'), 'Prompt: ' + room.taskChallengePrompt);
  recordTest('STEP_3.1', 'M34-S3-03', 'Active Room Status', room.status === 'ACTIVE', 'Room status: ACTIVE');

  // --------------------------------------------------------------------------
  // STEP 3.2 — Participant Roles (Explorer, Analyst, Scribe) (3 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 3.2: Participant Roles ---');

  const alicePart = collabService.joinRoom(aliceContext, room.roomId, 'EXPLORER');
  recordTest('STEP_3.2', 'M34-S3-04', 'Explorer Role Assignment', alicePart.role === 'EXPLORER' && alicePart.displayName === 'Alice Johnson', 'Alice joined as EXPLORER');

  const bobPart = collabService.joinRoom(bobContext, room.roomId, 'ANALYST');
  recordTest('STEP_3.2', 'M34-S3-05', 'Analyst Role Assignment', bobPart.role === 'ANALYST' && bobPart.displayName === 'Bob Smith', 'Bob joined as ANALYST');

  recordTest('STEP_3.2', 'M34-S3-06', 'Distinct Room Roles Verification', room.participants.size === 2, '2 distinct roles active in room');

  // --------------------------------------------------------------------------
  // STEP 3.4 — Shared Textbook Evidence & BBox Grounding (3 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 3.4: Shared Textbook Evidence ---');

  const evItem = collabService.addSharedEvidence(
    aliceContext,
    room.roomId,
    2,
    { x: 262, y: 572, width: 400, height: 39 },
    'Living things grow and change over time.'
  );
  recordTest('STEP_3.4', 'M34-S3-07', 'Physical Page Evidence Attachment', evItem.physicalPage === 2 && evItem.bbox.width === 400, 'Attached Page 2 BBox citation');

  // Invalid BBox coordinate rejection
  let invalidBBoxBlocked = false;
  try {
    collabService.addSharedEvidence(aliceContext, room.roomId, 2, { x: 0, y: 0, width: 0, height: 0 }, 'Fake');
  } catch (err) {
    invalidBBoxBlocked = err.name === 'BadRequestException';
  }
  recordTest('STEP_3.4', 'M34-S3-08', 'Invalid Spatial BBox Guard', invalidBBoxBlocked, 'Rejected invalid zero-size bounding box');

  recordTest('STEP_3.4', 'M34-S3-09', 'Attribution to Explorer Role', evItem.addedByRole === 'EXPLORER', 'Evidence attributed to EXPLORER (Alice)');

  // --------------------------------------------------------------------------
  // STEP 3.5 & 3.6 — Shared Annotations & Editing Rules (3 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 3.5 & 3.6: Shared Annotations & Editing Permissions ---');

  const annotation = collabService.addSharedAnnotation(
    aliceContext,
    room.roomId,
    evItem.evidenceId,
    'This paragraph proves that plants grow by adding new cells!'
  );
  recordTest('STEP_3.5', 'M34-S3-10', 'Shared Annotation Attachment', annotation.evidenceId === evItem.evidenceId, 'Annotation attached to evidence item');

  // Author edits own annotation
  const editedAnn = collabService.editAnnotation(aliceContext, room.roomId, annotation.annotationId, 'Updated: Plants grow internally!');
  recordTest('STEP_3.6', 'M34-S3-11', 'Author Annotation Edit', editedAnn.text.includes('Updated:'), 'Author updated annotation text');

  // Non-author attempts to edit -> FORBIDDEN
  let nonAuthorBlocked = false;
  try {
    collabService.editAnnotation(bobContext, room.roomId, annotation.annotationId, 'Malicious Edit');
  } catch (err) {
    nonAuthorBlocked = err.name === 'ForbiddenException';
  }
  recordTest('STEP_3.6', 'M34-S3-12', 'Non-Author Annotation Modification Guard (403)', nonAuthorBlocked, 'Bob blocked from editing Alice annotation');

  // --------------------------------------------------------------------------
  // STEP 3.7 & 3.8 — Discussion & Teacher Observation (2 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 3.7 & 3.8: Discussion & Teacher Observation ---');

  collabService.sendGroundedMessage(aliceContext, room.roomId, 'I found the evidence on Page 2!', evItem.evidenceId);
  collabService.sendGroundedMessage(bobContext, room.roomId, 'I agree, the definition is clear on Page 2.', evItem.evidenceId);

  const teacherSnapshot = collabService.getRoomSnapshot(teacherA, room.roomId);
  recordTest('STEP_3.7', 'M34-S3-13', 'Grounded Discussion Messages', teacherSnapshot.discussionThread.length === 2, '2 grounded messages recorded');
  recordTest('STEP_3.8', 'M34-S3-14', 'Teacher Real-Time Observation Snapshot', teacherSnapshot.sharedEvidenceList.length === 1 && teacherSnapshot.sharedAnnotations.length === 1, 'Teacher observed full room state');

  // --------------------------------------------------------------------------
  // STEP 3.9 & 3.10 — Room Completion & Personal BKT Mastery Update (3 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 3.9 & 3.10: Room Completion & BKT Mastery ---');

  const priorMasteryAlice = profileService.getOrCreateProfile('student-alice-01').conceptMasteryMap['C0101'] || 0.10;
  const completion = collabService.completeRoom(teacherA, room.roomId, 'Group successfully explained biological growth.', true);

  recordTest('STEP_3.10', 'M34-S3-15', 'Room Status COMPLETED', completion.room.status === 'COMPLETED', 'Room marked COMPLETED');

  const newMasteryAlice = profileService.getOrCreateProfile('student-alice-01').conceptMasteryMap['C0101'];
  recordTest('STEP_3.9', 'M34-S3-16', 'Alice M3.3 BKT Mastery Boost from Collaboration', newMasteryAlice > priorMasteryAlice, 'Alice mastery boosted from ' + (priorMasteryAlice * 100).toFixed(1) + '% to ' + (newMasteryAlice * 100).toFixed(1) + '%');

  const newMasteryBob = profileService.getOrCreateProfile('student-bob-02').conceptMasteryMap['C0101'];
  recordTest('STEP_3.9', 'M34-S3-17', 'Bob M3.3 BKT Mastery Boost from Collaboration', newMasteryBob > 0.10, 'Bob mastery updated to ' + (newMasteryBob * 100).toFixed(1) + '%');

  // --------------------------------------------------------------------------
  // STEP 3.11 & 3.12 — Adversarial Cross-Tenant Penetration Guards (3 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 3.11 & 3.12: Adversarial Cross-Tenant Penetration Guards ---');

  // Charlie (School B) attempts to join School A's room -> 404 NOT FOUND (Zero Leakage)
  let crossSchoolRoomJoinBlocked = false;
  try {
    collabService.joinRoom(charlieContextB, room.roomId, 'EXPLORER');
  } catch (err) {
    crossSchoolRoomJoinBlocked = err.name === 'NotFoundException';
  }
  recordTest('STEP_3.12', 'M34-S3-18', 'Cross-School Collaborative Room Join Guard (404)', crossSchoolRoomJoinBlocked, 'Returned 404 NOT FOUND for School B student');

  // Charlie attempts to query School A room snapshot -> 404
  let crossSchoolSnapshotBlocked = false;
  try {
    collabService.getRoomSnapshot(charlieContextB, room.roomId);
  } catch (err) {
    crossSchoolSnapshotBlocked = err.name === 'NotFoundException';
  }
  recordTest('STEP_3.12', 'M34-S3-19', 'Cross-School Snapshot Penetration Guard (404)', crossSchoolSnapshotBlocked, 'School B student blocked from inspecting School A room');

  // Recovery after completion
  const recoveredRoom = collabService.getRoomSnapshot(teacherA, room.roomId);
  recordTest('STEP_3.11', 'M34-S3-20', 'Persistent Collaboration Snapshot Recovery', recoveredRoom.status === 'COMPLETED' && !!recoveredRoom.groupConclusion, 'Recovered completed collaboration record with conclusion');

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.4 PHASE 3 COLLABORATION SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' PEER COLLABORATION TESTS PASSED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' COLLABORATION TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runM34Phase3Suite().catch((err) => {
  console.error('Fatal M3.4 Phase 3 Collaboration Suite Error:', err);
  process.exit(1);
});
