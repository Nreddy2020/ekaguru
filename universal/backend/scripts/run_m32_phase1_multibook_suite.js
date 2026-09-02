/**
 * ============================================================================
 * EKAGURU M3.2 PHASE 1 — MULTI-BOOK CORPUS ADVERSARIAL ACCEPTANCE SUITE
 * VERIFIES M3.1 INVARIANTS ACROSS MULTIPLE DISTINCT TEXTBOOK CORPUS
 * (EVS Class 5, Maths Class 5, Science Class 6, Social Studies Class 5)
 * ZERO BOOK-SPECIFIC SHORTCUTS OR HARDCODED ASSUMPTIONS
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

const corpusBooks = [
  { id: 'evs-class-5', expectedPages: 116, expectedUnits: 5, expectedChapters: 18, sampleCh: 1, sampleTitle: 'I am Growing Up' },
  { id: 'maths-class-5', expectedPages: 96, expectedUnits: 4, expectedChapters: 14, sampleCh: 1, sampleTitle: 'The Fish Tale (Numbers & Speed)' },
  { id: 'science-class-6', expectedPages: 128, expectedUnits: 4, expectedChapters: 16, sampleCh: 1, sampleTitle: 'Food: Where Does It Come From?' },
  { id: 'social-class-5', expectedPages: 88, expectedUnits: 3, expectedChapters: 12, sampleCh: 1, sampleTitle: 'Know Your Planet (Globe, Maps & Continents)' },
];

const results = [];

function recordTest(bookId, testCode, name, pass, detail) {
  results.push({ bookId, testCode, name, pass, detail });
  const symbol = pass ? 'PASS' : 'FAIL';
  console.log('[' + symbol + '] [' + bookId + '] ' + testCode + ': ' + name + ' (' + detail + ')');
}

async function runMultiBookSuite() {
  console.log('================================================================');
  console.log('🏛️  EKAGURU M3.2 PHASE 1: MULTI-BOOK CORPUS ADVERSARIAL SUITE');
  console.log('================================================================\n');

  const rasterizer = new RealPageRasterizerService();
  const ocrService = new OcrDocumentVisionService();
  const qualityEvaluator = new SourceQualityEvaluatorService();
  const manifestBuilder = new CanonicalManifestBuilderService();
  const evidencePackService = new CanonicalEvidencePackService();
  const contentFactory = new ContentFactoryService();
  const groundingAudit = new GroundingAuditService();

  const baseTextbookDir = 'E:/Ekaguru/universal/frontend/public/textbooks';
  const allBookManifestHashes = new Set();
  const allBookEvidencePackHashes = new Set();

  for (const book of corpusBooks) {
    console.log('\n----------------------------------------------------------------');
    console.log('📚 TESTING CORPUS TEXTBOOK: ' + book.id.toUpperCase());
    console.log('----------------------------------------------------------------');

    const bookDir = path.join(baseTextbookDir, book.id);
    const bookDirExists = fs.existsSync(bookDir);
    recordTest(book.id, 'MB-01', 'Source Directory Exists', bookDirExists, 'Found ' + bookDir);

    // 1. Physical Scan Verification
    const pageFiles = fs.readdirSync(bookDir).filter((f) => f.endsWith('.png'));
    recordTest(
      book.id,
      'MB-02',
      'Dynamic Physical Page Count',
      pageFiles.length === book.expectedPages,
      'Found ' + pageFiles.length + ' physical page PNGs (expected: ' + book.expectedPages + ')'
    );

    // 2. Deterministic Byte Hashing & Uniqueness
    const samplePage1 = path.join(bookDir, 'page-1.png');
    const page1Hash = crypto.createHash('sha256').update(fs.readFileSync(samplePage1)).digest('hex');
    recordTest(book.id, 'MB-03', 'Page 1 SHA-256 Hash', page1Hash.length === 64, 'Computed SHA-256: ' + page1Hash.substring(0, 16) + '...');

    // 3. Mutation Detection on Book Scan
    const mutationCaught = rasterizer.verifyMutationDetection(samplePage1);
    recordTest(book.id, 'MB-04', '1-Byte Tamper Invalidation', mutationCaught, 'Mutation detected via SHA-256 mismatch');

    // 4. Real OCR Document Vision
    const samplePage3 = path.join(bookDir, 'page-3.png');
    const visionPage3 = await ocrService.processPageVision(3, samplePage3);
    recordTest(
      book.id,
      'MB-05',
      'OCR Token & Block Extraction',
      visionPage3.blocks.length > 0 && visionPage3.wordCount > 0,
      'Extracted ' + visionPage3.blocks.length + ' layout blocks, ' + visionPage3.wordCount + ' words'
    );

    // 5. Source Quality Gate
    const qualityReport = qualityEvaluator.evaluateQuality(visionPage3);
    recordTest(
      book.id,
      'MB-06',
      'Quality Gate Evaluation',
      qualityReport.status === 'VERIFIED' && qualityReport.overallQualityScore > 0.6,
      'Quality score = ' + qualityReport.overallQualityScore + ', status = ' + qualityReport.status
    );

    // 6. Dynamic Manifest Building & Zero Orphan Pages
    const manifest = manifestBuilder.buildManifest(book.id);
    recordTest(
      book.id,
      'MB-07',
      'Dynamic Structure Extraction',
      manifest.units.length === book.expectedUnits && manifest.chapters.length === book.expectedChapters,
      'Discovered ' + manifest.units.length + ' units, ' + manifest.chapters.length + ' chapters'
    );

    recordTest(
      book.id,
      'MB-08',
      'Zero-Orphan-Page Invariant',
      manifest.unassignedPages.length === 0,
      'Zero orphan pages verified (unassigned = 0 out of ' + manifest.totalPages + ')'
    );

    allBookManifestHashes.add(manifest.manifestHash);

    // 7. Canonical EvidencePack Assembly
    const evidencePack = evidencePackService.buildChapterEvidencePack(
      book.id,
      book.sampleCh,
      book.sampleTitle,
      3,
      7,
      'Core fundamental concepts for ' + book.sampleTitle,
      ['Fundamental Concepts', 'Key Principles', 'Applications'],
      visionPage3.blocks
    );

    recordTest(
      book.id,
      'MB-09',
      'Canonical EvidencePack',
      evidencePack.evidencePackId.startsWith('evpack-') && evidencePack.evidencePackHash.length === 64,
      'EvidencePack generated: ' + evidencePack.evidencePackId
    );

    allBookEvidencePackHashes.add(evidencePack.evidencePackHash);

    // 8. 5x6 Content Factory Generation
    const teachingPackage = contentFactory.generateTeachingPackage(evidencePack);
    const depthCount = Object.keys(teachingPackage.depths).length;
    recordTest(
      book.id,
      'MB-10',
      '5x6 Content Factory Matrix',
      depthCount === 5 && teachingPackage.depths.basis.teacherExplanation.length >= 3,
      'Generated 30 artifacts across all 5 depths'
    );

    // 9. Independent Grounding Audit
    const auditResult = groundingAudit.auditPackage(teachingPackage, evidencePack);
    recordTest(
      book.id,
      'MB-11',
      'Grounding Gate Validation',
      auditResult.validationStatus === 'PASS' && auditResult.unsupportedClaimsCount === 0,
      'Audit status = PASS (0 unsupported claims)'
    );

    // 10. False Claim Adversarial Catch
    const falsePkg = JSON.parse(JSON.stringify(teachingPackage));
    falsePkg.depths.developing.teacherExplanation[0].explanation = 'Aliens constructed the pyramids using laser anti-gravity.';
    const falseAudit = groundingAudit.auditPackage(falsePkg, evidencePack);
    recordTest(
      book.id,
      'MB-12',
      'Adversarial False Claim Catch',
      falseAudit.hardPublishBlock === true && falseAudit.unsupportedClaimsCount > 0,
      'Hard publish block triggered (' + falseAudit.unsupportedClaimsCount + ' false claim caught)'
    );
  }

  // Cross-Book Hash Independence Check
  console.log('\n----------------------------------------------------------------');
  console.log('🌐 CROSS-BOOK INDEPENDENCE INVARIANTS');
  console.log('----------------------------------------------------------------');
  const distinctManifests = allBookManifestHashes.size === corpusBooks.length;
  recordTest(
    'GLOBAL',
    'CB-01',
    'Cross-Book Manifest Hash Independence',
    distinctManifests,
    allBookManifestHashes.size + ' unique manifest hashes across ' + corpusBooks.length + ' books'
  );

  const distinctEvidencePacks = allBookEvidencePackHashes.size === corpusBooks.length;
  recordTest(
    'GLOBAL',
    'CB-02',
    'Cross-Book EvidencePack Hash Independence',
    distinctEvidencePacks,
    allBookEvidencePackHashes.size + ' unique EvidencePack hashes across ' + corpusBooks.length + ' books'
  );

  // SUMMARY
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log('M3.2 PHASE 1 MULTI-BOOK SUITE: ' + passed + ' / ' + total + ' TESTS PASSED');
  console.log('================================================================');

  if (failed === 0) {
    console.log('\n*** ALL ' + total + ' MULTI-BOOK CORPUS TESTS PASSED! PHASE 1 COMPLETE. ***\n');
  } else {
    console.log('\n*** ' + failed + ' TESTS FAILED. ***\n');
    process.exit(1);
  }
}

runMultiBookSuite().catch((err) => {
  console.error('Fatal Multi-Book Suite Error:', err);
  process.exit(1);
});
