/**
 * ============================================================================
 * EKAGURU M3.2 PHASE 4 — OBSERVABILITY, DIAGNOSTICS & SECURITY ACCEPTANCE SUITE
 * VERIFIES STRUCTURED TRACE IDS, PIPELINE STAGE TELEMETRY, MAGIC-BYTE CHECKS,
 * PATH TRAVERSAL SANITIZATION, PAYLOAD LIMITS, AND RBAC AUTH GUARDS
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const { SecurityValidatorService } = require('../dist/learning-library/security/security-validator.service');
const { PipelineObservabilityService } = require('../dist/learning-library/telemetry/pipeline-observability.service');

const results = [];

function recordTest(track, code, name, pass, detail) {
  results.push({ track, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + track + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runPhase4Suite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.2 PHASE 4: OBSERVABILITY & SECURITY SUITE');
  console.log('================================================================\n');

  const securityService = new SecurityValidatorService();
  const observabilityService = new PipelineObservabilityService();

  const realPdfPath = 'E:/Ekaguru/universal/frontend/public/textbooks/evs-class-5.pdf';
  const validPdfBuffer = fs.existsSync(realPdfPath) ? fs.readFileSync(realPdfPath) : Buffer.from('%PDF-1.4 sample');
  const dummyBuffer = Buffer.from('GIF89a corrupted image buffer');

  // --------------------------------------------------------------------------
  // TRACK 9: Upload & Input Security Hardening (8 Tests)
  // --------------------------------------------------------------------------
  console.log('--- TRACK 9: Upload & Input Security Hardening ---');

  // Test 1: Valid PDF magic byte
  const validMagic = securityService.validatePdfMagicBytes(validPdfBuffer);
  recordTest('SECURITY', 'TK9-01', 'PDF Magic-Byte Validation (%PDF-)', validMagic, 'Valid %PDF- header detected');

  // Test 2: Invalid / Corrupted magic byte rejection
  const invalidMagic = securityService.validatePdfMagicBytes(dummyBuffer);
  recordTest('SECURITY', 'TK9-02', 'Non-PDF Buffer Rejection', invalidMagic === false, 'Blocked non-PDF buffer (GIF header)');

  // Test 3: Path traversal sanitization (UNIX / Windows)
  let traversalCaught1 = false;
  try {
    securityService.sanitizeBookId('../../etc/passwd');
  } catch (err) {
    traversalCaught1 = true;
  }
  recordTest('SECURITY', 'TK9-03', 'Path Traversal Guard (../../etc/passwd)', traversalCaught1, 'Rejected parent directory traversal');

  let traversalCaught2 = false;
  try {
    securityService.sanitizeBookId('..\\windows\\system32');
  } catch (err) {
    traversalCaught2 = true;
  }
  recordTest('SECURITY', 'TK9-04', 'Windows Traversal Guard (..\\windows)', traversalCaught2, 'Rejected Windows backslash traversal');

  // Test 5: Null byte injection guard
  let nullByteCaught = false;
  try {
    securityService.sanitizeBookId('book\0inject');
  } catch (err) {
    nullByteCaught = true;
  }
  recordTest('SECURITY', 'TK9-05', 'Null-Byte Injection Guard', nullByteCaught, 'Rejected null-byte in identifier');

  // Test 6: Valid sanitized bookId
  const sanitized = securityService.sanitizeBookId('Science_Class-6_NCERT');
  recordTest('SECURITY', 'TK9-06', 'BookId Sanitization Formatter', sanitized === 'science_class-6_ncert', 'Sanitized identifier: ' + sanitized);

  // Test 7: Full payload validation (valid PDF)
  const validUpload = securityService.validateUploadPayload('evs-class-5', validPdfBuffer);
  recordTest('SECURITY', 'TK9-07', 'Valid Upload Payload Evaluation', validUpload.valid === true && validUpload.pathSafe === true, 'Upload valid (' + (validUpload.fileSizeBytes / 1024 / 1024).toFixed(1) + 'MB)');

  // Test 8: Empty buffer rejection
  const emptyUpload = securityService.validateUploadPayload('evs-class-5', Buffer.from(''));
  recordTest('SECURITY', 'TK9-08', 'Zero-Byte Payload Rejection', emptyUpload.valid === false && emptyUpload.errors.length > 0, 'Rejected 0-byte upload');

  // --------------------------------------------------------------------------
  // TRACK 10: RBAC & API Authorization (4 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 10: Role-Based Access Control (RBAC) ---');

  // Test 1: ADMIN access for ingestion
  const adminAccess = securityService.validateRoleAccess('ADMIN', 'ADMIN');
  recordTest('RBAC', 'TK10-01', 'ADMIN Ingestion Authorization', adminAccess === true, 'ADMIN authorized for write/ingestion');

  // Test 2: STUDENT blocked from ingestion
  let studentBlocked = false;
  try {
    securityService.validateRoleAccess('STUDENT', 'ADMIN');
  } catch (err) {
    studentBlocked = true;
  }
  recordTest('RBAC', 'TK10-02', 'STUDENT Ingestion Block', studentBlocked, 'STUDENT blocked from triggering ingestion');

  // Test 3: TEACHER accessing classroom lesson
  const teacherAccess = securityService.validateRoleAccess('TEACHER', 'STUDENT');
  recordTest('RBAC', 'TK10-03', 'TEACHER Classroom Authorization', teacherAccess === true, 'TEACHER authorized for lesson studio');

  // Test 4: ANONYMOUS blocked from teacher actions
  let anonBlocked = false;
  try {
    securityService.validateRoleAccess('ANONYMOUS', 'TEACHER');
  } catch (err) {
    anonBlocked = true;
  }
  recordTest('RBAC', 'TK10-04', 'ANONYMOUS User Access Guard', anonBlocked, 'ANONYMOUS blocked from teacher permissions');

  // --------------------------------------------------------------------------
  // TRACK 8: Observability, Traceability & Telemetry (8 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 8: Observability, Traceability & Telemetry ---');

  const trace = observabilityService.startTrace('science-class-6');
  recordTest('TELEMETRY', 'TK8-01', 'Structured TraceId Creation', trace.traceId.startsWith('trace-science-class-6-'), 'Created trace: ' + trace.traceId);

  // Record Stage Events
  observabilityService.recordStageEvent(trace.traceId, 'Rasterization', 'SUCCESS', 120, { totalPages: 128 });
  observabilityService.recordStageEvent(trace.traceId, 'OcrVision', 'SUCCESS', 840, { blocksExtracted: 18 });
  observabilityService.recordStageEvent(trace.traceId, 'QualityGate', 'SUCCESS', 45, { score: 0.845 });
  observabilityService.recordStageEvent(trace.traceId, 'StructureManifest', 'SUCCESS', 30, { chapters: 16 });
  observabilityService.recordStageEvent(trace.traceId, 'EvidencePack', 'SUCCESS', 65, { evidencePacks: 16 });
  observabilityService.recordStageEvent(trace.traceId, 'ContentFactory', 'SUCCESS', 210, { artifacts: 30 });
  observabilityService.recordStageEvent(trace.traceId, 'GroundingAudit', 'SUCCESS', 55, { unsupportedClaims: 0 });

  const completedTrace = observabilityService.completeTrace(trace.traceId, 'SUCCESS');

  recordTest('TELEMETRY', 'TK8-02', 'Stage Event Logging (7 Stages)', completedTrace.events.length === 7, 'Logged all 7 pipeline stage events');
  recordTest('TELEMETRY', 'TK8-03', 'Monotonic Latency Tracking', completedTrace.totalDurationMs > 1000, 'Total pipeline duration = ' + completedTrace.totalDurationMs + 'ms');
  recordTest('TELEMETRY', 'TK8-04', 'Overall Pipeline Trace Status', completedTrace.overallStatus === 'SUCCESS', 'Trace finished with status SUCCESS');
  recordTest('TELEMETRY', 'TK8-05', 'Telemetry Diagnostics: OCR Confidence', completedTrace.diagnostics.meanOcrConfidence === 0.92, 'Diagnostic mean confidence = 92.0%');
  recordTest('TELEMETRY', 'TK8-06', 'Telemetry Diagnostics: CER Metric', completedTrace.diagnostics.cerPercent === 8.62, 'Diagnostic CER = 8.62%');
  recordTest('TELEMETRY', 'TK8-07', 'Telemetry Diagnostics: Zero Orphans', completedTrace.diagnostics.unassignedPagesCount === 0, 'Diagnostic unassigned pages = 0');
  recordTest('TELEMETRY', 'TK8-08', 'Telemetry Diagnostics: Zero False Claims', completedTrace.diagnostics.unsupportedClaimsCount === 0, 'Diagnostic unsupported claims = 0');

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.2 PHASE 4 SECURITY & OBSERVABILITY SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' SECURITY & OBSERVABILITY TESTS PASSED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runPhase4Suite().catch((err) => {
  console.error('Fatal Phase 4 Security Suite Error:', err);
  process.exit(1);
});
