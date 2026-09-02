/**
 * ============================================================================
 * EKAGURU M3.3 PHASE 2 — ADAPTIVE SESSION & SOCRATIC INTERACTION SUITE
 * VERIFIES ADAPTIVE DEPTH PACING, SOCRATIC MISCONCEPTION DIAGNOSTICS,
 * PERSONALIZED ARTIFACT SELECTION, AND 4-STEP SESSION PROGRESSION
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const { LearnerProfileService } = require('../dist/learning-library/personalization/learner-profile.service');
const { ConceptMasteryEngineService } = require('../dist/learning-library/personalization/concept-mastery.service');
const { AdaptivePacingEngineService } = require('../dist/learning-library/personalization/adaptive-pacing.service');
const { GroundedSocraticTutorService } = require('../dist/learning-library/personalization/grounded-socratic-tutor.service');
const { PersonalizedArtifactSelectorService } = require('../dist/learning-library/personalization/personalized-artifact-selector.service');
const { AdaptiveSessionManagerService } = require('../dist/learning-library/personalization/adaptive-session-manager.service');
const { CanonicalEvidencePackService } = require('../dist/learning-library/knowledge/canonical-evidence-pack.service');
const { ContentFactoryService } = require('../dist/learning-library/ai-factory/content-factory.service');

const results = [];

function recordTest(track, code, name, pass, detail) {
  results.push({ track, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + track + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runPhase2Suite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.3 PHASE 2: ADAPTIVE SESSION & SOCRATIC SUITE');
  console.log('================================================================\n');

  const profileService = new LearnerProfileService();
  const masteryEngine = new ConceptMasteryEngineService(profileService);
  const pacingEngine = new AdaptivePacingEngineService();
  const socraticTutor = new GroundedSocraticTutorService();
  const artifactSelector = new PersonalizedArtifactSelectorService();
  const evidencePackService = new CanonicalEvidencePackService();
  const contentFactory = new ContentFactoryService();

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
  // TRACK 3: Adaptive Depth Selection & Pacing Engine (5 Tests)
  // --------------------------------------------------------------------------
  console.log('--- TRACK 3: Adaptive Depth Selection & Pacing Engine ---');

  // Test 1: Remediation Drop (Proficient -> Developing)
  const drop1 = pacingEngine.evaluateDepthAdjustment('proficient', 0, 2);
  recordTest('PACING', 'T3-01', 'Remediation Depth Drop (Proficient -> Developing)', drop1.action === 'REMEDIATE' && drop1.newDepth === 'developing', 'Dropped depth on 2 wrong answers');

  // Test 2: Remediation Drop (Developing -> Basis)
  const drop2 = pacingEngine.evaluateDepthAdjustment('developing', 0, 2);
  recordTest('PACING', 'T3-02', 'Remediation Depth Drop (Developing -> Basis)', drop2.action === 'REMEDIATE' && drop2.newDepth === 'basis', 'Dropped depth to Basis on repeated struggle');

  // Test 3: Advancement Promotion (Developing -> Proficient)
  const adv1 = pacingEngine.evaluateDepthAdjustment('developing', 3, 0);
  recordTest('PACING', 'T3-03', 'Advancement Promotion (Developing -> Proficient)', adv1.action === 'ADVANCE' && adv1.newDepth === 'proficient', 'Promoted depth on 3 clean correct answers');

  // Test 4: Advancement Promotion (Proficient -> Advanced)
  const adv2 = pacingEngine.evaluateDepthAdjustment('proficient', 3, 0);
  recordTest('PACING', 'T3-04', 'Advancement Promotion (Proficient -> Advanced)', adv2.action === 'ADVANCE' && adv2.newDepth === 'advanced', 'Promoted depth to Advanced');

  // Test 5: Optimal Depth Maintenance
  const maint = pacingEngine.evaluateDepthAdjustment('proficient', 1, 0);
  recordTest('PACING', 'T3-05', 'Optimal Depth Maintenance', maint.action === 'MAINTAIN' && maint.newDepth === 'proficient', 'Maintained depth at Proficient');

  // --------------------------------------------------------------------------
  // TRACK 4: Grounded Socratic Tutor & Misconception Diagnostics (5 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 4: Grounded Socratic Tutor & Misconception Diagnostics ---');

  // Test 1: Accretion vs Biological Growth Misconception
  const misc1 = socraticTutor.diagnoseAnswer('C0101', 'A cloud grows in the sky so it must be living', evsPack);
  recordTest('SOCRATIC', 'T4-01', 'Accretion Misconception Detection', misc1.detected === true && misc1.misconceptionId === 'MISC_01', 'Caught misconception: ' + misc1.misconceptionName);
  recordTest('SOCRATIC', 'T4-02', 'Socratic Questioning Generation', misc1.socraticQuestion.includes('balloon') && misc1.socraticQuestion.includes('kitten'), 'Generated Socratic analogy prompt');
  recordTest('SOCRATIC', 'T4-03', 'Physical Page Citation Linkage', misc1.citationPageNumber === 3, 'Linked Socratic remediation to Page 3 citation');

  // Test 2: Valid Answer (No misconception)
  const validAns = socraticTutor.diagnoseAnswer('C0101', 'Living organisms develop internally through cellular growth.', evsPack);
  recordTest('SOCRATIC', 'T4-04', 'Valid Grounded Answer Pass', validAns.detected === false, 'Valid response cleared without false diagnosis');

  // Test 3: Static Adulthood Fallacy Misconception
  const misc2 = socraticTutor.diagnoseAnswer('C0102', 'When you become an adult you stop growing completely and never change.', evsPack);
  recordTest('SOCRATIC', 'T4-05', 'Static Adulthood Fallacy Detection', misc2.detected === true && misc2.misconceptionId === 'MISC_02', 'Caught misconception: ' + misc2.misconceptionName);

  // --------------------------------------------------------------------------
  // TRACK 7: Personalized Artifact Selection (5 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 7: Personalized Artifact Selection ---');

  const aliceProfile = profileService.getOrCreateProfile('student-alice-01', 'Alice', 'Class 5');
  profileService.updatePreferences('student-alice-01', 'VISUAL', 'GENTLE');

  const bobProfile = profileService.getOrCreateProfile('student-bob-02', 'Bob', 'Class 5');
  profileService.updatePreferences('student-bob-02', 'READING', 'ACCELERATED');

  // Visual Learner Artifacts
  const aliceArtifacts = artifactSelector.selectPersonalizedArtifacts(evsPackage, aliceProfile, 'developing');
  recordTest('SELECTOR', 'T7-01', 'Visual Learner Primary Artifact', aliceArtifacts.primaryArtifact.artifactType === 'boardSummary', 'Visual learner received boardSummary diagram');
  recordTest('SELECTOR', 'T7-02', 'Visual Learner Supporting Artifact', aliceArtifacts.supportingArtifact.artifactType === 'visuals', 'Visual learner received visuals interactive flow');

  // Reading Learner Artifacts
  const bobArtifacts = artifactSelector.selectPersonalizedArtifacts(evsPackage, bobProfile, 'developing');
  recordTest('SELECTOR', 'T7-03', 'Reading Learner Primary Artifact', bobArtifacts.primaryArtifact.artifactType === 'teacherExplanation', 'Reading learner received teacherExplanation text');
  recordTest('SELECTOR', 'T7-04', 'Reading Learner Supporting Artifact', bobArtifacts.supportingArtifact.artifactType === 'printableNotes', 'Reading learner received printableNotes');

  recordTest('SELECTOR', 'T7-05', 'Personalized Selection Modality Divergence', aliceArtifacts.primaryArtifact.artifactType !== bobArtifacts.primaryArtifact.artifactType, 'Artifacts personalized across student modalities');

  // --------------------------------------------------------------------------
  // TRACK 8: Student Learning Session & Step Progression (5 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 8: Student Learning Session & Step Progression ---');

  // Start active session for Alice
  const session = sessionManager.startSession('student-alice-01', 'evs-class-5', 1, 'developing');
  recordTest('SESSION', 'T8-01', 'Session Initialization (Step 1)', session.currentStepIndex === 1 && session.status === 'ACTIVE', 'Initialized session ' + session.sessionId + ' at Step 1');

  // Step 1: Alice submits answer with misconception
  const step1Result = sessionManager.processStudentStep(
    session.sessionId,
    'C0101',
    'Living Things',
    'A balloon grows when blown up so it is living',
    false,
    evsPack,
    evsPackage
  );
  recordTest('SESSION', 'T8-02', 'Step 1 Misconception Catch in Session', step1Result.misconception?.detected === true, 'Caught misconception during active step');
  recordTest('SESSION', 'T8-03', 'Step Index Increment (Step 1 -> 2)', step1Result.session.currentStepIndex === 2, 'Advanced to Step 2');

  // Step 2, 3, 4: Alice answers correctly 3 times -> Depth advances
  sessionManager.processStudentStep(session.sessionId, 'C0101', 'Living Things', 'Living things grow internally', true, evsPack, evsPackage);
  sessionManager.processStudentStep(session.sessionId, 'C0102', 'Growth', 'Growth is continuous development', true, evsPack, evsPackage);
  const finalStep = sessionManager.processStudentStep(session.sessionId, 'C0102', 'Growth', 'Cellular renewal continues into adulthood', true, evsPack, evsPackage);

  recordTest('SESSION', 'T8-04', 'Dynamic Depth Shift in Session', finalStep.session.currentDepth === 'proficient', 'Dynamic depth shift: developing -> proficient');
  recordTest('SESSION', 'T8-05', 'Session Completion Lifecycle', finalStep.session.status === 'COMPLETED' && finalStep.session.interactionHistory.length === 4, 'Session completed with 4 recorded interaction steps');

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.3 PHASE 2 ADAPTIVE SESSION SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' PHASE 2 ADAPTIVE SESSION TESTS PASSED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runPhase2Suite().catch((err) => {
  console.error('Fatal Phase 2 Adaptive Session Suite Error:', err);
  process.exit(1);
});
