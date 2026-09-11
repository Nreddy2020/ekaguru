# Page teaching validation

10 September 2026. Scope and remaining requirements: [architecture review](page-teaching-architecture-review.md).

| Check | Result |
| --- | --- |
| Complete frontend Jest suite | 22 suites, 107 tests passed |
| Complete backend Jest suite | 53 suites passed; 1 legacy suite failed. 328 tests passed, 3 failed, 331 total |
| Changed backend extraction/Guru suites | 5 suites, 38 tests passed |
| Frontend and backend TypeScript | Passed |
| Backend production build | Passed |
| Frontend production build | Passed; existing Browserslist staleness and analytics dynamic-render log remain |
| Real EVS page 46 | Correct source identity, dimensions 1389 × 1964, image hash; 16 reliable text blocks using automatic OCR layout |
| Real two-page PDF | Physical page 2 returned plant text, excluded page 1 triangle text; native coordinates and total pages correct |
| Real PostgreSQL Guru session | Saved assessment, idempotent replay, resume and checkpoint advance passed |
| Browser smoke check | Source page displayed, evidence highlight aligned, progressive playback reached a blocked checkpoint |
| Live model teaching | Not run: GEMINI_API_KEY and GURU_MODEL are not configured |

## What the checks establish

The active board preserves book/page/revision identity, cancels stale page requests, changes instructions and pacing with level, retains source-linked drawings and pauses for a learner response. Missing OCR regions cannot silently join otherwise separate excerpts.

Guru schema tests reject unknown evidence, missing coverage, unsafe primitives, out-of-bounds scenes and incomplete teaching cycles. Expected answers stay server-side. Runtime tests cover ownership, forged material/learner pairs, stale revisions, concurrent writes, uncertain/malformed judgments, assistance without mastery credit, and repeat network requests.

The database check uses actual local PostgreSQL and uniquely identified disposable test rows. Model responses in that check are deterministic test doubles. It proves persistence and event semantics, not model accuracy.

Automatic OCR layout improved the EVS test page from 1 retained line to 16 without lowering thresholds. Some regions remain omitted; this does not establish complete extraction. Model-vision boxes are estimates and the model review is not educator certification.

## Remaining backend test failures (resolved 11 September 2026)

Resolution: the legacy Socratic suite now asserts the current contract. The tutor turn exposes `tutorResponseText`; a first wrong answer is deliberately `UNATTRIBUTED_ERROR` (conservative attribution, consistent with the M3 learner-intelligence spec) and becomes `CONCEPTUAL_MISUNDERSTANDING` only when the same wrong answer repeats; one correct answer after two wrong ones scores 0.68 under the recent-weight policy and is `IN_PROGRESS`, a second correct answer reaches 0.872 and `MASTERED`. One production change was made while doing this: the tutor used to say "Fractions Mastered!" on any correct answer regardless of the ledger; it now announces mastery only when the recorded status is MASTERED and otherwise says the answer was correct and that mastery needs consistent work. The original notes follow for history.

The existing phase4-socratic-e2e.spec.ts assumes an older Socratic API:
- It expects data.statement on start, while the current TutorTurn returns tutorResponseText.
- It expects the hard-coded ADD_DENOMINATORS_DIRECTLY result, but the current evaluator returns UNATTRIBUTED_ERROR for its fixture.
- It expects mastery around 0.87/MASTERED after its two responses; the current ledger produces approximately 0.68.

Those production tutor/evaluator/mastery implementations were not changed by this work. The test fixture now uses a unique curriculum version/fingerprint and includes a definition so it reaches the actual contract assertions instead of failing on shared database state or missing grounding. No production score or mastery threshold was changed to force a green test.

An existing real-database curriculum test also reused a fixed version/fingerprint. Its fixture now uses a unique identity and passes. The observe health test now supplies explicit healthy memory rather than relying on the Jest process's fluctuating heap usage.

## Database rollout

The local database had existing application tables but no Prisma migration history. A read-only schema check confirmed that the new tables/columns were absent; the additive Guru migration SQL was then applied successfully. Historical migrations were not replayed or marked applied. A deployment must establish the correct baseline for its existing schema before using migrate deploy.

No database reset, source replacement, production deployment, merge or commit was performed.

## Reproduction

From universal/frontend: run Jest and TypeScript. From universal/backend: run Jest, npm run build, and:

~~~powershell
$env:TESSDATA_DIR='E:/Ekaguru'
node scripts/verify_page_evidence.js evs-class-5 46
node scripts/verify_uploaded_page_evidence.js
node scripts/verify_guru_runtime.js
~~~

Machine-readable Jest results are in page-teaching-test-results.json and guru-backend-results.json. The configuration template is universal/backend/guru.env.example.

Not yet validated: live multimodal factual quality, arbitrary diagram accuracy, multilingual speech availability, educator-assessed learning outcomes, distributed concurrency/load, offline use, source formats beyond PDF/images on the board, or canonical-mastery updates from Guru page responses.

## Approved classroom integration verification

The normal library Open Book action now targets /library/:bookId?page=1 and uses the approved classroom shell. Existing lesson links use the same runtime. The design preview query is no longer a separate UI.

Full frontend: 23 suites, 113 tests passed. Focused backend Guru runtime: 20 tests passed, including page questions without checkpoint advancement and rejection of unknown evidence IDs. Frontend TypeScript and backend build passed.

Actual in-app browser checks: EVS physical page 46 displays its original scan in the approved layout. The reported metadata-only book displays an attach-original-PDF recovery action without an inappropriate authorization prompt. A generated two-page PDF was uploaded through the existing library modal, opened, refreshed, advanced to physical page two, and refreshed again. The original and true two-page count persisted; the URL retained page=2. Progressive source reading showed plant content from page two and stopped at a recall checkpoint with Next disabled. Entering Plants enabled Next. This verifies browser storage and source-reading runtime, not paid model reasoning.

The optional standalone Puppeteer harness timed out before launching Chrome, so it is not reported as passed. A named classroom-test-source library entry was created for the in-app check; no pre-existing user books were replaced.

Production frontend build passed after the UI integration (the existing analytics route emits a dynamic-render diagnostic and remains dynamic). OpenAI/Gemini boundary: 12 mocked provider tests and 20 Guru runtime tests passed; backend build passed. No live provider calls were made. OpenAI is an optional server configuration, not an assertion that it has been validated for this learner population.

Final running service check: /api/v2/guru/capabilities returns reasoningAvailable=false and sourceReadingAvailable=true with no provider key configured. Both local servers restarted successfully with the verified changes.
