/**
 * ============================================================================
 * EKAGURU M3.3 PHASE 3 — SPACED REINFORCEMENT & OBSERVABILITY DASHBOARD SUITE
 * VERIFIES EBBINGHAUS RETENTION SCHEDULING, CLASSROOM MASTERY HEATMAPS,
 * TEACHER MISCONCEPTION ALERTS, PARENT PROGRESS SUMMARIES, AND CITATION TRAILS
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const { LearnerProfileService } = require('../dist/learning-library/personalization/learner-profile.service');
const { ConceptMasteryEngineService } = require('../dist/learning-library/personalization/concept-mastery.service');
const { SpacedReinforcementSchedulerService } = require('../dist/learning-library/personalization/spaced-reinforcement.service');
const { TeacherDashboardService } = require('../dist/learning-library/personalization/teacher-dashboard.service');
const { ParentDashboardService } = require('../dist/learning-library/personalization/parent-dashboard.service');
const { CanonicalEvidencePackService } = require('../dist/learning-library/knowledge/canonical-evidence-pack.service');

const results = [];

function recordTest(track, code, name, pass, detail) {
  results.push({ track, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + track + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runPhase3Suite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.3 PHASE 3: SPACED REINFORCEMENT & DASHBOARD SUITE');
  console.log('================================================================\n');

  const profileService = new LearnerProfileService();
  const masteryEngine = new ConceptMasteryEngineService(profileService);
  const spacedScheduler = new SpacedReinforcementSchedulerService(profileService);
  const evidencePackService = new CanonicalEvidencePackService();
  const teacherDashboard = new TeacherDashboardService(profileService, evidencePackService);
  const parentDashboard = new ParentDashboardService(profileService);

  // Setup Profiles
  const alice = profileService.getOrCreateProfile('student-alice-01', 'Alice', 'Class 5');
  masteryEngine.updateConceptMastery('student-alice-01', 'C0101', 'Living Things', true);
  masteryEngine.updateConceptMastery('student-alice-01', 'C0101', 'Living Things', true);
  masteryEngine.updateConceptMastery('student-alice-01', 'C0101', 'Living Things', true); // Alice mastered C0101 (~0.98)
  profileService.updatePreferences('student-alice-01', 'VISUAL', 'GENTLE');
  profileService.recordLessonCompleted('student-alice-01', 'evs-class-5-ch1');

  const bob = profileService.getOrCreateProfile('student-bob-02', 'Bob', 'Class 5');
  masteryEngine.updateConceptMastery('student-bob-02', 'C0101', 'Living Things', false); // Bob developing C0101 (~0.16)
  profileService.updatePreferences('student-bob-02', 'READING', 'ACCELERATED');

  // --------------------------------------------------------------------------
  // TRACK 6: Spaced Reinforcement & Retention Scheduler (7 Tests)
  // --------------------------------------------------------------------------
  console.log('--- TRACK 6: Spaced Reinforcement & Retention Scheduler ---');

  // Test 1: High Retention (0 elapsed days) -> ~1.0
  const ret0 = spacedScheduler.calculateRetention(0, 0.95);
  recordTest('SPACED', 'T6-01', 'Immediate Retention Rate (0 Days)', ret0 === 1.0, 'Retention = 100% on day 0');

  // Test 2: Moderate Decay (7 elapsed days, high mastery) -> ~0.60 to 0.75
  const ret7 = spacedScheduler.calculateRetention(7, 0.90);
  recordTest('SPACED', 'T6-02', 'Decay Modeling (7 Days)', ret7 > 0.50 && ret7 < 0.80, 'Retention after 7 days = ' + (ret7 * 100).toFixed(1) + '%');

  // Test 3: Fast Decay on Low Mastery (7 elapsed days, low mastery) -> <0.40
  const retLow = spacedScheduler.calculateRetention(7, 0.20);
  recordTest('SPACED', 'T6-03', 'Low Mastery Fast Decay Invariant', retLow < 0.40, 'Low mastery concept retention = ' + (retLow * 100).toFixed(1) + '%');

  // Test 4: Review Scheduling Generation for Alice
  const aliceSchedule = spacedScheduler.generateSchedule('student-alice-01', { C0101: 10 });
  recordTest('SPACED', 'T6-04', 'Scheduled Review Item Generation', aliceSchedule.dueReviewsCount >= 1, 'Generated ' + aliceSchedule.dueReviewsCount + ' due review items');
  recordTest('SPACED', 'T6-05', 'Micro-Review Activity Assignment', aliceSchedule.reviewItems[0].recommendedActivity.includes('Page 3 visual scan'), 'Assigned targeted 3-minute review activity');

  // Test 5: Priority Assignment
  recordTest('SPACED', 'T6-06', 'Review Priority Assignment', !!aliceSchedule.reviewItems[0].priority, 'Priority assigned: ' + aliceSchedule.reviewItems[0].priority);

  // Test 6: Schedule Data Isolation
  const bobSchedule = spacedScheduler.generateSchedule('student-bob-02', { C0101: 2 });
  recordTest('SPACED', 'T6-07', 'Student Schedule Isolation', aliceSchedule.studentId !== bobSchedule.studentId, 'Alice and Bob schedules strictly isolated');

  // --------------------------------------------------------------------------
  // TRACK 9: Teacher Dashboard & Concept Mastery Heatmaps (7 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 9: Teacher Dashboard & Concept Mastery Heatmaps ---');

  const classroomReport = teacherDashboard.generateClassroomDashboard(
    ['student-alice-01', 'student-bob-02'],
    'evs-class-5',
    1
  );

  recordTest('TEACHER_DASH', 'T9-01', 'Enrolled Student Count', classroomReport.totalEnrolledStudents === 2, 'Class enrollment = 2 students');
  recordTest('TEACHER_DASH', 'T9-02', 'Mastery Heatmap Generation', classroomReport.masteryHeatmap.length === 2, 'Generated 2 student heatmap rows');
  recordTest('TEACHER_DASH', 'T9-03', 'Alice Mastered Concept Status', classroomReport.masteryHeatmap[0].concepts[0].status === 'MASTERED', 'Alice C0101 status = MASTERED');
  recordTest('TEACHER_DASH', 'T9-04', 'Bob Needs Help Concept Status', classroomReport.masteryHeatmap[1].concepts[0].status === 'NEEDS_HELP', 'Bob C0101 status = NEEDS_HELP');
  recordTest('TEACHER_DASH', 'T9-05', 'Class Average Mastery Metric', classroomReport.classAverageMastery > 0.30, 'Class average mastery = ' + (classroomReport.classAverageMastery * 100).toFixed(1) + '%');
  recordTest('TEACHER_DASH', 'T9-06', 'Active Misconception Alert Visibility', classroomReport.activeMisconceptions.length === 1 && classroomReport.activeMisconceptions[0].misconceptionId === 'MISC_01', 'Teacher alerted: Accretion vs Biological Growth');
  recordTest('TEACHER_DASH', 'T9-07', 'Physical Page Evidence Inspection Trail', classroomReport.evidenceInspectionTrail.length === 2 && classroomReport.evidenceInspectionTrail[0].physicalPage === 3, 'Evidence trail bound to Page 3 scan');

  // --------------------------------------------------------------------------
  // TRACK 10: Parent Progress Dashboard (6 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 10: Parent Progress Dashboard ---');

  const parentReport = parentDashboard.generateParentReport('student-alice-01');

  recordTest('PARENT_DASH', 'T10-01', 'Parent Summary Student Name', parentReport.studentName === 'Alice', 'Report for student: Alice');
  recordTest('PARENT_DASH', 'T10-02', 'Weekly Lessons Completed', parentReport.weeklySummary.lessonsCompletedThisWeek === 1, 'Lessons completed this week = 1');
  recordTest('PARENT_DASH', 'T10-03', 'Preferred Modality Reporting', parentReport.weeklySummary.preferredModality === 'VISUAL', 'Preferred modality: VISUAL');
  recordTest('PARENT_DASH', 'T10-04', 'Identified Strengths Summary', parentReport.strengths.length >= 1, 'Reported strength: ' + parentReport.strengths[0].conceptName);
  recordTest('PARENT_DASH', 'T10-05', 'Actionable Growth Tip', parentReport.growthAreas.length >= 1 && !!parentReport.growthAreas[0].actionableHomeTip, 'Growth tip: ' + parentReport.growthAreas[0].actionableHomeTip);
  recordTest('PARENT_DASH', 'T10-06', 'Recommended Home Practice Activity', parentReport.recommendedHomePractice.length === 1 && parentReport.recommendedHomePractice[0].durationMinutes === 5, 'Home practice: ' + parentReport.recommendedHomePractice[0].activityTitle + ' (5 mins)');

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.3 PHASE 3 DASHBOARD SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' PHASE 3 DASHBOARD & SPACED REVIEW TESTS PASSED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runPhase3Suite().catch((err) => {
  console.error('Fatal Phase 3 Dashboard Suite Error:', err);
  process.exit(1);
});
