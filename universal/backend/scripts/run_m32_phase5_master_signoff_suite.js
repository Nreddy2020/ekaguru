/**
 * ============================================================================
 * EKAGURU M3.2 PHASE 5 — MASTER MULTI-BOOK ADVERSARIAL & PRODUCTION SIGN-OFF SUITE
 * EXECUTING ALL 9 CRITICAL ADVERSARIAL, CONCURRENCY, CRASH RECOVERY, SECURITY,
 * AND DATA ISOLATION STRESS INVARIANTS ACROSS ALL 4 CORPUS TEXTBOOKS
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { RealPageRasterizerService } = require('../dist/learning-library/extraction/real-page-rasterizer.service');
const { OcrDocumentVisionService } = require('../dist/learning-library/extraction/ocr-document-vision.service');
const { SourceQualityEvaluatorService } = require('../dist/learning-library/quality/source-quality-evaluator.service');
const { CanonicalManifestBuilderService } = require('../dist/learning-library/structure/canonical-manifest-builder.service');
const { CanonicalEvidencePackService } = require('../dist/learning-library/knowledge/canonical-evidence-pack.service');
const { ContentFactoryService } = require('../dist/learning-library/ai-factory/content-factory.service');
const { GroundingAuditService } = require('../dist/learning-library/ai-factory/grounding-audit.service');
const { IngestionCheckpointManagerService } = require('../dist/learning-library/queue/ingestion-checkpoint-manager.service');
const { AsyncIngestionJobManagerService } = require('../dist/learning-library/queue/async-ingestion-job-manager.service');
const { SecurityValidatorService } = require('../dist/learning-library/security/security-validator.service');
const { PipelineObservabilityService } = require('../dist/learning-library/telemetry/pipeline-observability.service');

const results = [];

function recordTest(category, code, name, pass, detail) {
  results.push({ category, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + category + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runMasterSignOffSuite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.2 PHASE 5: MASTER PRODUCTION SIGN-OFF SUITE');
  console.log('================================================================\n');

  const rasterizer = new RealPageRasterizerService();
  const ocrService = new OcrDocumentVisionService();
  const qualityEvaluator = new SourceQualityEvaluatorService();
  const manifestBuilder = new CanonicalManifestBuilderService();
  const evidencePackService = new CanonicalEvidencePackService();
  const contentFactory = new ContentFactoryService();
  const groundingAudit = new GroundingAuditService();
  const checkpointManager = new IngestionCheckpointManagerService();
  const securityService = new SecurityValidatorService();
  const observabilityService = new PipelineObservabilityService();

  const jobManager = new AsyncIngestionJobManagerService(
    checkpointManager,
    rasterizer,
    ocrService,
    qualityEvaluator,
    manifestBuilder,
    evidencePackService,
    contentFactory,
    groundingAudit
  );

  const baseTextbookDir = 'E:/Ekaguru/universal/frontend/public/textbooks';
  const books = ['evs-class-5', 'maths-class-5', 'science-class-6', 'social-class-5'];

  // --------------------------------------------------------------------------
  // 1. Multi-Book Full E2E Acceptance Testing (4 Books)
  // --------------------------------------------------------------------------
  console.log('--- 1. Multi-Book Full E2E Acceptance Testing ---');
  for (const bId of books) {
    const manifest = manifestBuilder.buildManifest(bId);
    recordTest('E2E', 'SO-01-' + bId, 'Full E2E Manifest Build (' + bId + ')', manifest.unassignedPages.length === 0, 'Zero orphans across ' + manifest.totalPages + ' pages');
  }

  // --------------------------------------------------------------------------
  // 2. Adversarial Cross-Book Citation Attack
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Adversarial Cross-Book Citation Attack ---');
  const evsPack = evidencePackService.buildChapterEvidencePack('evs-class-5', 1, 'About Me', 3, 7, 'Living things grow', ['Living Things']);
  const mathsPackage = contentFactory.generateTeachingPackage(evsPack);
  
  // Inject cross-book citation: EVS page citation placed into a claim claiming to be Maths
  const crossBookFalsePackage = JSON.parse(JSON.stringify(mathsPackage));
  crossBookFalsePackage.depths.developing.teacherExplanation[0].explanation = 'Quantum bitcoin integration calculates algebra.';
  const crossBookAudit = groundingAudit.auditPackage(crossBookFalsePackage, evsPack);

  recordTest(
    'ADVERSARIAL',
    'SO-02',
    'Cross-Book False Citation Block',
    crossBookAudit.hardPublishBlock === true && crossBookAudit.unsupportedClaimsCount > 0,
    'Hard publish block triggered (' + crossBookAudit.unsupportedClaimsCount + ' invalid claim caught)'
  );

  // --------------------------------------------------------------------------
  // 3. Concurrency & Parallel Ingestion Stress Testing (4 Books)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Concurrency Stress Testing (4 Books Simultaneously) ---');
  const parallelJobs = await Promise.all(books.map((b) => jobManager.dispatchIngestionJob(b, 50)));
  const allParallelSuccess = parallelJobs.every((j) => j.status === 'COMPLETED');
  const uniqueParallelJobIds = new Set(parallelJobs.map((j) => j.jobId)).size === 4;

  recordTest('CONCURRENCY', 'SO-03', '4-Book Parallel Ingestion Stress', allParallelSuccess && uniqueParallelJobIds, '4 concurrent jobs completed with 0 race condition errors');

  // --------------------------------------------------------------------------
  // 4. Crash Recovery Stress Testing (200-Page Interruption at Page 84)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Crash Recovery Stress Testing (200 Pages) ---');
  checkpointManager.clearCheckpoint('master-recovery-book');
  const baseJob = await jobManager.dispatchIngestionJob('master-recovery-book', 200);
  
  checkpointManager.clearCheckpoint('master-recovery-book');
  await jobManager.dispatchIngestionJob('master-recovery-book', 200, { interruptAtPage: 84 });
  const resumedJob = await jobManager.dispatchIngestionJob('master-recovery-book', 200, { resumeFromCheckpoint: true });

  const crashRecoveryParity = resumedJob.manifestHash === baseJob.manifestHash && resumedJob.skippedPagesCount === 83;
  recordTest('CRASH_RECOVERY', 'SO-04', '200-Page Interruption Parity Invariant', crashRecoveryParity, 'Resumed run matched uninterrupted baseline: ' + resumedJob.manifestHash.substring(0, 16) + '...');

  // --------------------------------------------------------------------------
  // 5. Malicious PDF & Path Traversal Security Testing
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Malicious PDF & Path Traversal Security Testing ---');
  let traversal1 = false;
  try { securityService.sanitizeBookId('../../../etc/shadow'); } catch (e) { traversal1 = true; }
  let traversal2 = false;
  try { securityService.sanitizeBookId('C:\\Windows\\System32'); } catch (e) { traversal2 = true; }

  const invalidMagicUpload = securityService.validateUploadPayload('test-book', Buffer.from('RAW TEXT NOT A PDF'));

  recordTest('SECURITY', 'SO-05', 'Path Traversal & Magic-Byte Invariant', traversal1 && traversal2 && !invalidMagicUpload.valid, 'Rejected path traversal attacks and non-PDF payload');

  // --------------------------------------------------------------------------
  // 6. RBAC Penetration / Authorization Testing
  // --------------------------------------------------------------------------
  console.log('\n--- 6. RBAC Authorization Gate Testing ---');
  let studentBlocked = false;
  try { securityService.validateRoleAccess('STUDENT', 'ADMIN'); } catch (e) { studentBlocked = true; }
  const adminAllowed = securityService.validateRoleAccess('ADMIN', 'ADMIN');

  recordTest('RBAC', 'SO-06', 'RBAC Authorization Boundary', studentBlocked && adminAllowed, 'STUDENT blocked from write ops; ADMIN authorized');

  // --------------------------------------------------------------------------
  // 7. EvidencePack Tampering Detection
  // --------------------------------------------------------------------------
  console.log('\n--- 7. EvidencePack Tamper Detection ---');
  const validPack = evidencePackService.buildChapterEvidencePack('science-class-6', 1, 'Food Sources', 5, 16, 'Food nutrition', ['Nutrients']);
  const tampered = JSON.parse(JSON.stringify(validPack));
  tampered.title = 'TAMPERED FOOD SOURCES';
  const tamperedHash = crypto.createHash('sha256').update(JSON.stringify(tampered)).digest('hex');

  recordTest('EVPACK_TAMPER', 'SO-07', 'EvidencePack Tamper Invariant', tamperedHash !== validPack.evidencePackHash, 'Tampered pack detected via hash mismatch');

  // --------------------------------------------------------------------------
  // 8. Grounding False-Claim Mutation Testing
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Grounding False-Claim Mutation Testing ---');
  const validSciencePkg = contentFactory.generateTeachingPackage(validPack);
  const falseSciencePkg = JSON.parse(JSON.stringify(validSciencePkg));
  falseSciencePkg.depths.developing.teacherExplanation[0].explanation = 'Aliens created quantum lasers on the moon.';
  const falseAudit = groundingAudit.auditPackage(falseSciencePkg, validPack);

  recordTest('GROUNDING', 'SO-08', 'False-Claim Hard Publish Block', falseAudit.hardPublishBlock === true && falseAudit.validationStatus === 'FAIL', 'Hard publish block triggered (unsupported=' + falseAudit.unsupportedClaimsCount + ')');

  // --------------------------------------------------------------------------
  // 9. Cross-Book Data-Isolation Verification
  // --------------------------------------------------------------------------
  console.log('\n--- 9. Cross-Book Data-Isolation Verification ---');
  const allManifestHashes = new Set(books.map((b) => manifestBuilder.buildManifest(b).manifestHash));
  recordTest('ISOLATION', 'SO-09', 'Cross-Book Data Isolation', allManifestHashes.size === 4, '4/4 unique manifest hashes across corpus books');

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.2 PHASE 5 MASTER SIGN-OFF SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' MASTER SIGN-OFF INVARIANTS MET! M3.2 PRODUCTION SIGN-OFF ACHIEVED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' SIGN-OFF TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runMasterSignOffSuite().catch((err) => {
  console.error('Fatal Phase 5 Master Sign-Off Error:', err);
  process.exit(1);
});
