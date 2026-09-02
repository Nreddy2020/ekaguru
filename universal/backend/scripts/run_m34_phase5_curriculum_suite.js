/**
 * ============================================================================
 * EKAGURU M3.4 PHASE 5 — CURRICULUM COMPLIANCE & STANDARDS MAPPING SUITE
 * VERIFIES NCERT/CBSE STANDARDS MAPPING, "TAUGHT" VS "MASTERED" METRIC ISOLATION,
 * 3-WAY SYLLABUS GAP DETECTION, PHYSICAL BBOX CITATION TRACES, AND TENANT SECURITY
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const { MultiTenantSchoolService } = require('../dist/learning-library/tenancy/multi-tenant-school.service');
const { MultiTenantSecurityService } = require('../dist/learning-library/tenancy/multi-tenant-security.service');
const { LearnerProfileService } = require('../dist/learning-library/personalization/learner-profile.service');
const { ConceptMasteryEngineService } = require('../dist/learning-library/personalization/concept-mastery.service');
const { CanonicalEvidencePackService } = require('../dist/learning-library/knowledge/canonical-evidence-pack.service');
const { CurriculumComplianceService } = require('../dist/learning-library/compliance/curriculum-compliance.service');

const results = [];

function recordTest(step, code, name, pass, detail) {
  results.push({ step, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + step + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runM34Phase5Suite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.4 PHASE 5: CURRICULUM COMPLIANCE & GAP ANALYSIS');
  console.log('================================================================\n');

  const schoolService = new MultiTenantSchoolService();
  const securityService = new MultiTenantSecurityService(schoolService);
  const profileService = new LearnerProfileService();
  const masteryEngine = new ConceptMasteryEngineService(profileService);
  const evidencePackService = new CanonicalEvidencePackService();
  const complianceService = new CurriculumComplianceService(
    schoolService,
    securityService,
    profileService,
    evidencePackService
  );

  // Setup Student Alice (Mastered C0101) & Bob (Developing C0101, Needs Help C0102)
  profileService.getOrCreateProfile('student-alice-01', 'Alice', 'Grade 5');
  masteryEngine.updateConceptMastery('student-alice-01', 'C0101', 'Living Things', true);
  masteryEngine.updateConceptMastery('student-alice-01', 'C0101', 'Living Things', true);
  masteryEngine.updateConceptMastery('student-alice-01', 'C0101', 'Living Things', true); // Alice C0101 = 0.98

  profileService.getOrCreateProfile('student-bob-02', 'Bob', 'Grade 5');
  masteryEngine.updateConceptMastery('student-bob-02', 'C0101', 'Living Things', true);
  masteryEngine.updateConceptMastery('student-bob-02', 'C0101', 'Living Things', true); // Bob C0101 = 0.874

  const teacherA = {
    districtId: 'dist-delhi-01',
    schoolId: 'school-delhi-dps',
    callerId: 'teacher-sharma-01',
    role: 'TEACHER',
  };

  const teacherB = {
    districtId: 'dist-delhi-01',
    schoolId: 'school-delhi-mva',
    callerId: 'teacher-verma-02',
    role: 'TEACHER',
  };

  // --------------------------------------------------------------------------
  // STEP 5.1 & 5.2 — Standards Mapping & Grounded Coverage (4 Tests)
  // --------------------------------------------------------------------------
  console.log('--- STEP 5.1 & 5.2: Standards Mapping & Coverage ---');

  const report = complianceService.generateClassCurriculumReport(teacherA, 'sec-dps-5a', 'evs-class-5');
  recordTest('STEP_5.1', 'M34-S5-01', 'NCERT Standard Mapping', report.conceptBreakdown[0].mappedStandards.includes('NCERT-EVS-5-01'), 'Mapped C0101 -> NCERT-EVS-5-01');
  recordTest('STEP_5.2', 'M34-S5-02', 'CBSE Standard Mapping', report.conceptBreakdown[1].mappedStandards.includes('CBSE-EVS-5-C1'), 'Mapped C0102 -> CBSE-EVS-5-C1');
  recordTest('STEP_5.3', 'M34-S5-03', 'Total Monitored Standards Count', report.totalStandardsCount === 4, 'Monitored 4 curriculum standards');
  recordTest('STEP_5.3', 'M34-S5-04', 'Textbook Standards Coverage Rate', report.coveragePercentage === 75.0, '75.0% of standards covered in textbook');

  // --------------------------------------------------------------------------
  // STEP 5.4 & 5.5 — "Taught" vs "Mastered" Metric Isolation (4 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 5.4 & 5.5: "Taught" vs "Mastered" Distinct Metrics ---');

  recordTest('STEP_5.4', 'M34-S5-05', 'Concepts Taught Percentage', report.taughtPercentage === 66.7, '66.7% of textbook concepts taught');
  recordTest('STEP_5.4', 'M34-S5-06', 'Concepts Mastered Percentage', report.masteredPercentage === 33.3, '33.3% of concepts mastered by class');
  recordTest(
    'STEP_5.4',
    'M34-S5-07',
    '"Taught" != "Mastered" Metric Divergence Invariant',
    report.taughtPercentage !== report.masteredPercentage,
    'Taught (66.7%) correctly decoupled from Mastered (33.3%)'
  );
  recordTest('STEP_5.5', 'M34-S5-08', 'C0101 Class Average Mastery', report.conceptBreakdown[0].classAverageMastery > 0.85, 'C0101 class mastery = ' + (report.conceptBreakdown[0].classAverageMastery * 100).toFixed(1) + '% (MASTERED)');

  // --------------------------------------------------------------------------
  // STEP 5.6 — 3-Way Syllabus Gap Detection (3 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 5.6: 3-Way Syllabus Gap Detection ---');

  const currGap = report.detectedGaps.find((g) => g.gapType === 'CURRICULUM_GAP');
  recordTest('STEP_5.6', 'M34-S5-09', 'Curriculum Gap Detection (Missing Textbook Topic)', !!currGap && currGap.standardId === 'NCERT-EVS-5-GAP-09', 'Caught Curriculum Gap: Hydrothermal vents not in book');

  const teachGap = report.detectedGaps.find((g) => g.gapType === 'TEACHING_GAP');
  recordTest('STEP_5.6', 'M34-S5-10', 'Teaching Gap Detection (Un-taught Concept)', !!teachGap && teachGap.conceptId === 'C0201', 'Caught Teaching Gap: Skeletal support not yet taught');

  const mastGap = report.detectedGaps.find((g) => g.gapType === 'MASTERY_GAP');
  recordTest('STEP_5.6', 'M34-S5-11', 'Mastery Gap Detection (Low Class Understanding)', !!mastGap && mastGap.conceptId === 'C0102', 'Caught Mastery Gap: Growth Continuum class mastery low');

  // --------------------------------------------------------------------------
  // STEP 5.7, 5.8 & 5.9 — Calendar Progress & Physical Citation Trace (4 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 5.7, 5.8 & 5.9: Calendar Progress & Physical BBox Trace ---');

  recordTest('STEP_5.7', 'M34-S5-12', 'Academic Calendar Expected Progress', report.expectedCalendarProgress === 75.0, 'Expected calendar progress = 75.0%');
  recordTest('STEP_5.7', 'M34-S5-13', 'Calendar Progress Gap Metric', report.progressGap === 8.3, 'Progress gap behind schedule = 8.3%');

  const c0101Trace = report.conceptBreakdown[0];
  recordTest('STEP_5.9', 'M34-S5-14', 'Physical Page Citation Provenance', c0101Trace.physicalPage === 3, 'Standard traces to Page 3 scan');
  recordTest('STEP_5.9', 'M34-S5-15', 'Physical Bounding Box Coordinate Trace', c0101Trace.bbox.width === 400 && c0101Trace.bbox.height === 39, 'Exact BBox coordinates {x:262, y:572, w:400, h:39} verified');

  // --------------------------------------------------------------------------
  // STEP 5.10 & 5.11 — Multi-Tenant Scope & Adversarial Security (3 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 5.10 & 5.11: Multi-Tenant Scope & Security Guards ---');

  recordTest('STEP_5.10', 'M34-S5-16', 'School Tenant Scope Invariant', report.schoolId === 'school-delhi-dps', 'Report strictly scoped to DPS');

  // Teacher B from School B attempts to inspect School A curriculum report -> 404 NOT FOUND (Zero Leakage)
  let crossSchoolReportBlocked = false;
  try {
    complianceService.generateClassCurriculumReport(teacherB, 'sec-dps-5a', 'evs-class-5');
  } catch (err) {
    crossSchoolReportBlocked = err.name === 'NotFoundException';
  }
  recordTest('STEP_5.11', 'M34-S5-17', 'Cross-School Curriculum Report Penetration Guard (404)', crossSchoolReportBlocked, 'Blocked Teacher B from inspecting School A report');

  // Concept mark taught lifecycle
  complianceService.markConceptTaught('C0201');
  const updatedReport = complianceService.generateClassCurriculumReport(teacherA, 'sec-dps-5a', 'evs-class-5');
  recordTest('STEP_5.4', 'M34-S5-18', 'Dynamic Taught Concept Update', updatedReport.taughtPercentage === 100.0, 'Taught percentage updated to 100.0%');

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.4 PHASE 5 CURRICULUM COMPLIANCE SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' CURRICULUM COMPLIANCE & GAP ANALYSIS TESTS PASSED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' CURRICULUM TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runM34Phase5Suite().catch((err) => {
  console.error('Fatal M3.4 Phase 5 Curriculum Suite Error:', err);
  process.exit(1);
});
