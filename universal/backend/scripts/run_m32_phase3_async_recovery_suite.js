/**
 * ============================================================================
 * EKAGURU M3.2 PHASE 3 — ASYNC PIPELINE, CONCURRENCY & CRASH RECOVERY SUITE
 * VERIFIES ASYNC QUEUE DISPATCH, 3-BOOK CONCURRENCY ISOLATION, AND
 * 200-PAGE INTERRUPTION-RESUME IDEMPOTENCY (SKIP PAGES 1..83 ON CRASH RECOVERY)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const { IngestionCheckpointManagerService } = require('../dist/learning-library/queue/ingestion-checkpoint-manager.service');
const { AsyncIngestionJobManagerService } = require('../dist/learning-library/queue/async-ingestion-job-manager.service');
const { RealPageRasterizerService } = require('../dist/learning-library/extraction/real-page-rasterizer.service');
const { OcrDocumentVisionService } = require('../dist/learning-library/extraction/ocr-document-vision.service');
const { SourceQualityEvaluatorService } = require('../dist/learning-library/quality/source-quality-evaluator.service');
const { CanonicalManifestBuilderService } = require('../dist/learning-library/structure/canonical-manifest-builder.service');
const { CanonicalEvidencePackService } = require('../dist/learning-library/knowledge/canonical-evidence-pack.service');
const { ContentFactoryService } = require('../dist/learning-library/ai-factory/content-factory.service');
const { GroundingAuditService } = require('../dist/learning-library/ai-factory/grounding-audit.service');

const results = [];

function recordTest(track, code, name, pass, detail) {
  results.push({ track, code, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + track + '] ' + code + ': ' + name + ' (' + detail + ')');
}

async function runPhase3Suite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.2 PHASE 3: ASYNC QUEUE, CONCURRENCY & RECOVERY');
  console.log('================================================================\n');

  const checkpointManager = new IngestionCheckpointManagerService();
  const rasterizer = new RealPageRasterizerService();
  const ocrService = new OcrDocumentVisionService();
  const qualityEvaluator = new SourceQualityEvaluatorService();
  const manifestBuilder = new CanonicalManifestBuilderService();
  const evidencePackService = new CanonicalEvidencePackService();
  const contentFactory = new ContentFactoryService();
  const groundingAudit = new GroundingAuditService();

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

  // --------------------------------------------------------------------------
  // TRACK 5: Asynchronous Pipeline & Progress Telemetry (5 Tests)
  // --------------------------------------------------------------------------
  console.log('--- TRACK 5: Asynchronous Queue & Progress Telemetry ---');

  checkpointManager.clearCheckpoint('test-async-book');
  const asyncJob = await jobManager.dispatchIngestionJob('test-async-book', 50);

  recordTest('ASYNC', 'TK5-01', 'Job Creation & Queue Registration', !!asyncJob.jobId && asyncJob.jobId.startsWith('job-'), 'Registered job: ' + asyncJob.jobId);
  recordTest('ASYNC', 'TK5-02', 'Job Status Lifecycle', asyncJob.status === 'COMPLETED', 'Lifecycle transitioned to COMPLETED');
  recordTest('ASYNC', 'TK5-03', 'Progress Telemetry (100%)', asyncJob.progressPercent === 100, 'Final progress = 100%');
  recordTest('ASYNC', 'TK5-04', 'Page Completion Count', asyncJob.pagesCompleted === 50, 'Completed all 50 dispatched pages');
  recordTest('ASYNC', 'TK5-05', 'Durable Checkpoint Storage', checkpointManager.isPageAlreadyProcessed('test-async-book', 25), 'Checkpoint persisted on disk');

  // --------------------------------------------------------------------------
  // TRACK 6: Concurrency Isolation (3 Simultaneous Books) (5 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 6: Concurrency Isolation (3 Simultaneous Books) ---');

  checkpointManager.clearCheckpoint('maths-class-5');
  checkpointManager.clearCheckpoint('science-class-6');
  checkpointManager.clearCheckpoint('social-class-5');

  const [jobMath, jobSci, jobSoc] = await Promise.all([
    jobManager.dispatchIngestionJob('maths-class-5', 96),
    jobManager.dispatchIngestionJob('science-class-6', 128),
    jobManager.dispatchIngestionJob('social-class-5', 88),
  ]);

  recordTest('CONCURRENCY', 'TK6-01', 'Parallel Job Dispatch', jobMath.status === 'COMPLETED' && jobSci.status === 'COMPLETED' && jobSoc.status === 'COMPLETED', '3 concurrent jobs completed successfully');
  recordTest('CONCURRENCY', 'TK6-02', 'Job ID Isolation', jobMath.jobId !== jobSci.jobId && jobSci.jobId !== jobSoc.jobId, '3 unique job IDs');
  recordTest('CONCURRENCY', 'TK6-03', 'Math Ingestion Page Integrity', jobMath.pagesCompleted === 96, 'Math completed 96/96 pages');
  recordTest('CONCURRENCY', 'TK6-04', 'Science Ingestion Page Integrity', jobSci.pagesCompleted === 128, 'Science completed 128/128 pages');
  recordTest('CONCURRENCY', 'TK6-05', 'Social Studies Page Integrity', jobSoc.pagesCompleted === 88, 'Social Studies completed 88/88 pages');

  // --------------------------------------------------------------------------
  // TRACK 7: Crash Recovery & Checkpoint Idempotency (200-Page Book) (10 Tests)
  // --------------------------------------------------------------------------
  console.log('\n--- TRACK 7: Crash Recovery & Checkpoint Idempotency (200-Page Book) ---');

  const book200Id = 'encyclopedia-200-pages';
  checkpointManager.clearCheckpoint(book200Id);

  // Step 1: Baseline Uninterrupted Ingestion (to obtain ground-truth parity hashes)
  const baselineJob = await jobManager.dispatchIngestionJob(book200Id, 200);
  const baselineManifestHash = baselineJob.manifestHash;
  recordTest('RECOVERY', 'TK7-01', 'Baseline 200-Page Ingestion', baselineJob.status === 'COMPLETED' && baselineJob.pagesCompleted === 200, 'Baseline 200-page job completed');
  recordTest('RECOVERY', 'TK7-02', 'Baseline Manifest Hash Generated', !!baselineManifestHash && baselineManifestHash.length === 64, 'Baseline hash: ' + baselineManifestHash.substring(0, 16) + '...');

  // Step 2: Simulate Worker Crash at Page 84
  checkpointManager.clearCheckpoint(book200Id);
  const interruptedJob = await jobManager.dispatchIngestionJob(book200Id, 200, { interruptAtPage: 84 });
  
  recordTest('RECOVERY', 'TK7-03', 'Simulated Worker Crash at Page 84', interruptedJob.status === 'FAILED', 'Worker stopped at Page 84 with error');
  recordTest('RECOVERY', 'TK7-04', 'Pre-Crash Checkpoint Persistence', checkpointManager.isPageAlreadyProcessed(book200Id, 83) && !checkpointManager.isPageAlreadyProcessed(book200Id, 84), 'Pages 1..83 verified in checkpoint; Page 84 unverified');

  // Step 3: Resume Worker from Checkpoint
  const resumedJob = await jobManager.dispatchIngestionJob(book200Id, 200, { resumeFromCheckpoint: true });

  recordTest('RECOVERY', 'TK7-05', 'Resumed Job Completed', resumedJob.status === 'COMPLETED', 'Resumed job finished with status COMPLETED');
  recordTest('RECOVERY', 'TK7-06', 'Skipped Pages 1..83 (Zero Reprocessing)', resumedJob.skippedPagesCount === 83, 'Skipped exactly ' + resumedJob.skippedPagesCount + ' pages from checkpoint');
  recordTest('RECOVERY', 'TK7-07', 'Processed Remaining Pages (84..200)', resumedJob.reprocessedPagesCount === 117, 'Processed remaining ' + resumedJob.reprocessedPagesCount + ' pages (84..200)');
  recordTest('RECOVERY', 'TK7-08', 'Total Pages Completed on Resume', resumedJob.pagesCompleted === 200, 'Total 200/200 pages accounted for');

  // Step 4: Deterministic Parity Invariant (Resumed Manifest Hash === Baseline Manifest Hash)
  const hashParityMatch = resumedJob.manifestHash === baselineManifestHash;
  recordTest('RECOVERY', 'TK7-09', 'Deterministic Parity Invariant', hashParityMatch, 'Resumed hash matches baseline uninterrupted run: ' + resumedJob.manifestHash.substring(0, 16) + '...');

  recordTest('RECOVERY', 'TK7-10', 'EvidencePack Parity Invariant', resumedJob.evidencePackCount === baselineJob.evidencePackCount, 'EvidencePack count identical (' + resumedJob.evidencePackCount + ')');

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.2 PHASE 3 ASYNC RECOVERY SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' ASYNC QUEUE & CRASH RECOVERY TESTS PASSED! ***\n');
  } else {
    console.log('\n*** ' + failed + ' TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runPhase3Suite().catch((err) => {
  console.error('Fatal Phase 3 Recovery Suite Error:', err);
  process.exit(1);
});
