/**
 * ============================================================================
 * EKAGURU M3.4 PHASE 1 — MULTI-TENANT SCHOOL FOUNDATION & SECURITY SUITE
 * VERIFIES TENANT OWNERSHIP HIERARCHY, INTRA-TENANT ACCESS, AND ADVERSARIAL
 * ZERO-LEAKAGE CROSS-TENANT PENETRATION GUARDS ACROSS SCHOOLS & DISTRICTS
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const { MultiTenantSchoolService } = require('../dist/learning-library/tenancy/multi-tenant-school.service');
const { MultiTenantSecurityService } = require('../dist/learning-library/tenancy/multi-tenant-security.service');

const results = [];

function recordTest(category, code, name, pass, detail) {
  results.push({ category, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + category + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runM34Phase1Suite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.4 PHASE 1: MULTI-TENANT SCHOOL & SECURITY SUITE');
  console.log('================================================================\n');

  const schoolService = new MultiTenantSchoolService();
  const securityService = new MultiTenantSecurityService(schoolService);

  // --------------------------------------------------------------------------
  // TRACK 1: Multi-Tenant Hierarchy Structure (5 Tests)
  // --------------------------------------------------------------------------
  console.log('--- TRACK 1: Multi-Tenant Hierarchy Structure ---');

  const schoolA = schoolService.getSchool('school-delhi-dps');
  const schoolB = schoolService.getSchool('school-delhi-mva');
  recordTest('TENANCY', 'T1-01', 'School Entity Registration', !!schoolA && !!schoolB, 'Registered School A (DPS) and School B (MVA)');

  const secA = schoolService.getSection('sec-dps-5a');
  const secB = schoolService.getSection('sec-mva-5a');
  recordTest('TENANCY', 'T1-02', 'Grade Section Allocation', secA.gradeLevel === 'Grade 5' && secB.gradeLevel === 'Grade 5', 'Created Grade 5 sections in both schools');

  const teacherA = schoolService.getTeacher('teacher-sharma-01');
  const teacherB = schoolService.getTeacher('teacher-verma-02');
  recordTest('TENANCY', 'T1-03', 'Teacher Roster Allocation', teacherA.schoolId === 'school-delhi-dps' && teacherB.schoolId === 'school-delhi-mva', 'Assigned teachers to respective schools');

  const alice = schoolService.getStudent('student-alice-01');
  const charlie = schoolService.getStudent('student-charlie-03');
  recordTest('TENANCY', 'T1-04', 'Student Tenant Scoping', alice.schoolId === 'school-delhi-dps' && charlie.schoolId === 'school-delhi-mva', 'Scoped Alice to School A and Charlie to School B');

  recordTest('TENANCY', 'T1-05', 'Shared District Aggregation', schoolA.districtId === schoolB.districtId, 'Both schools aggregate under Delhi Central District (dist-delhi-01)');

  // --------------------------------------------------------------------------
  // TRACK 2: Intra-Tenant Authorized Access (3 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 2: Intra-Tenant Authorized Access ---');

  // Teacher A accessing Student Alice (Same School)
  const teacherContextA = {
    districtId: 'dist-delhi-01',
    schoolId: 'school-delhi-dps',
    callerId: 'teacher-sharma-01',
    role: 'TEACHER',
  };

  const validStudentAccess = securityService.validateStudentAccess(teacherContextA, 'student-alice-01');
  recordTest('AUTH', 'T2-01', 'Intra-School Teacher -> Student Access', validStudentAccess.studentId === 'student-alice-01', 'Teacher A authorized to access Student A');

  // Teacher A accessing Section 5A (Same School)
  const validSectionAccess = securityService.validateSectionAccess(teacherContextA, 'sec-dps-5a');
  recordTest('AUTH', 'T2-02', 'Intra-School Teacher -> Section Access', validSectionAccess.sectionId === 'sec-dps-5a', 'Teacher A authorized to access assigned Section 5A');

  // Student Alice accessing self
  const aliceContext = {
    districtId: 'dist-delhi-01',
    schoolId: 'school-delhi-dps',
    callerId: 'student-alice-01',
    role: 'STUDENT',
  };
  const aliceSelfAccess = securityService.validateStudentAccess(aliceContext, 'student-alice-01');
  recordTest('AUTH', 'T2-03', 'Student Self-Profile Access', aliceSelfAccess.studentId === 'student-alice-01', 'Alice authorized to access own profile');

  // --------------------------------------------------------------------------
  // TRACK 3: Adversarial Zero-Leakage Cross-Tenant Penetration (7 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 3: Adversarial Cross-Tenant Penetration Guards ---');

  // Test 1: Teacher A attempts to access Student Charlie (School B) -> 404 NOT FOUND (No existence leak)
  let crossSchoolStudentBlocked = false;
  try {
    securityService.validateStudentAccess(teacherContextA, 'student-charlie-03');
  } catch (err) {
    crossSchoolStudentBlocked = err.name === 'NotFoundException';
  }
  recordTest(
    'PENETRATION',
    'T3-01',
    'Cross-School Student Access Block (Zero Leakage)',
    crossSchoolStudentBlocked,
    'Returned 404 NOT FOUND without revealing Charlie exists in School B'
  );

  // Test 2: Teacher B attempts to access Student Alice (School A) -> 404 NOT FOUND
  const teacherContextB = {
    districtId: 'dist-delhi-01',
    schoolId: 'school-delhi-mva',
    callerId: 'teacher-verma-02',
    role: 'TEACHER',
  };
  let teacherBCrossAccessBlocked = false;
  try {
    securityService.validateStudentAccess(teacherContextB, 'student-alice-01');
  } catch (err) {
    teacherBCrossAccessBlocked = err.name === 'NotFoundException';
  }
  recordTest(
    'PENETRATION',
    'T3-02',
    'Teacher B -> School A Student Penetration Block',
    teacherBCrossAccessBlocked,
    'Returned 404 NOT FOUND for Teacher B querying School A student'
  );

  // Test 3: Cross-School Section Access Block
  let crossSchoolSectionBlocked = false;
  try {
    securityService.validateSectionAccess(teacherContextA, 'sec-mva-5a');
  } catch (err) {
    crossSchoolSectionBlocked = err.name === 'NotFoundException';
  }
  recordTest(
    'PENETRATION',
    'T3-03',
    'Cross-School Section Penetration Block',
    crossSchoolSectionBlocked,
    'Teacher A blocked from querying School B Section 5A'
  );

  // Test 4: Student Alice attempts to access Student Bob's private record -> 403 FORBIDDEN
  let studentPeerSnoopBlocked = false;
  try {
    securityService.validateStudentAccess(aliceContext, 'student-bob-02');
  } catch (err) {
    studentPeerSnoopBlocked = err.name === 'ForbiddenException';
  }
  recordTest(
    'PENETRATION',
    'T3-04',
    'Peer Student Snooping Guard',
    studentPeerSnoopBlocked,
    'Alice blocked from accessing Bob private educational record (403)'
  );

  // Test 5: Teacher A attempts to access unassigned Section in School A -> 403 FORBIDDEN
  let unassignedSectionBlocked = false;
  try {
    const unassignedContext = { ...teacherContextA, callerId: 'teacher-unassigned-99' };
    securityService.validateSectionAccess(unassignedContext, 'sec-dps-5a');
  } catch (err) {
    unassignedSectionBlocked = err.name === 'ForbiddenException';
  }
  recordTest(
    'PENETRATION',
    'T3-05',
    'Unassigned Teacher Section Guard',
    unassignedSectionBlocked,
    'Unassigned teacher blocked from accessing Section 5A (403)'
  );

  // Test 6: Cross-District Tampering Attack
  const fakeDistrictContext = {
    districtId: 'dist-mumbai-99',
    schoolId: 'school-delhi-dps',
    callerId: 'teacher-sharma-01',
    role: 'TEACHER',
  };
  let crossDistrictBlocked = false;
  try {
    securityService.validateStudentAccess(fakeDistrictContext, 'student-alice-01');
  } catch (err) {
    crossDistrictBlocked = err.name === 'NotFoundException';
  }
  recordTest(
    'PENETRATION',
    'T3-06',
    'Cross-District Tenant Injection Guard',
    crossDistrictBlocked,
    'Cross-district spoofing rejected with 404'
  );

  // Test 7: Non-existent Student Query
  let nonExistentBlocked = false;
  try {
    securityService.validateStudentAccess(teacherContextA, 'student-ghost-999');
  } catch (err) {
    nonExistentBlocked = err.name === 'NotFoundException';
  }
  recordTest(
    'PENETRATION',
    'T3-07',
    'Non-Existent Student Query Guard',
    nonExistentBlocked,
    'Non-existent student query safely returned 404'
  );

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.4 PHASE 1 TENANCY SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' MULTI-TENANT FOUNDATION TESTS PASSED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' TENANCY TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runM34Phase1Suite().catch((err) => {
  console.error('Fatal M3.4 Phase 1 Tenancy Suite Error:', err);
  process.exit(1);
});
