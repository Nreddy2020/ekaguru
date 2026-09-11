# Guru quality and mastery gates

Added 11 September 2026. This document describes the four server-side gates that stand between a Guru page lesson and any claim about a learner. All of them are implemented and unit-tested; the parts that need a live model or human educators are marked as such.

## 1. Model budget per account

Every paid model call reserves one unit from a per-account daily ledger (`GuruModelUsage`). Cached lessons cost nothing; a reservation happens only when a lesson must actually be generated, or when a learner asks a page question or submits an assessed answer.

| Variable | Default | Meaning |
| --- | --- | --- |
| `GURU_DAILY_LESSON_LIMIT` | 20 | New lesson generations per account per UTC day. `0` disables generation. |
| `GURU_DAILY_QUERY_LIMIT` | 200 | Page questions plus assessed answers per account per UTC day. `0` disables them. |

When a limit is reached the API returns HTTP 429 with a plain message and source reading remains available. `GET /api/v2/guru/usage` (signed in) reports the day's usage and remaining budget. `GET /api/v2/guru/capabilities` reports the configured limits and whether the mastery bridge is enabled.

## 2. Educator-reviewed evaluation corpus

The corpus is a set of `GuruEvaluationCase` rows, one per (page, depth, language). Educators score generated lessons against rubric v1 (`guru-evaluation.rubric.ts`), seven criteria scored 0 to 4:

1. Source coverage
2. Factual accuracy (gate)
3. Visual fidelity
4. Pedagogical progression
5. Checkpoint quality
6. Language and age fit
7. Safety and wellbeing (gate)

Verdict rules are enforced by the server: any criterion at 0 or any gate criterion below 3 is FAIL; all criteria at 3 or above is PASS; otherwise REVISE. A reviewer may record a stricter verdict than the scores imply, never a more lenient one. Reviews are stored per reviewer and rubric version; a case reaches consensus PASS only when every current-version review is PASS.

Workflow:

1. Seed the manifest: `node scripts/seed_guru_evaluation_corpus.js` from `universal/backend`. The v1 manifest (`docs/evaluation/guru-evaluation-corpus.v1.json`) samples 37 real built-in pages across four books at all five depths, 185 cases in total, including the previously verified EVS pages 44 to 47 and 73.
2. Prepare lessons: `POST /api/v2/guru/evaluation/cases/:id/prepare` (ADMIN) or, serially from `universal/backend`, `node scripts/prepare_guru_evaluation_corpus.js --limit N`. This uses the same planner learners use and therefore needs a configured provider key. As of 11 September 2026 the five depths of EVS page 46 are prepared; the Gemini free tier's 20-requests-per-day quota blocks the rest until billing is enabled.
3. Review: `GET /api/v2/guru/evaluation/cases/:id/packet.md` exports a Markdown packet with the rubric, the full lesson including server-held expected answers, and the source blocks. `POST /api/v2/guru/evaluation/cases/:id/reviews` records scores, verdict and notes.
4. Track: `GET /api/v2/guru/evaluation/summary` groups cases by subject, depth and language and lists which depths have reached the approval threshold.

`GURU_EVAL_MIN_PASSED_CASES` (default 20) is the number of consensus-PASS cases a depth and language pair needs before the mastery bridge will accept evidence at that depth.

## 3. Curator-verified concept mapping

`GuruConceptMapping` links a lesson artifact to canonical `Concept` rows. Proposals are deterministic and model-free:

- `CHUNK_PAGE_RANGE`: concepts whose extraction chunks cover the same physical page of the same material, scored by relevance times confidence.
- `OBJECTIVE_NAME`: concepts linked anywhere in the material whose canonical name overlaps a lesson objective (Jaccard over content tokens, threshold 0.34).
- `MANUAL`: a curator link, which is verified on creation.

Only ADMIN users can verify, reject or add mappings (`/api/v2/guru/lessons/:artifactId/concept-mappings…`), and only ADMIN users can search concepts for manual links (`GET /api/v2/guru/concepts?search=`). The evaluation page's "Concept mappings" panel exposes all of this per prepared lesson. A proposal never overwrites a VERIFIED or REJECTED decision.

## 4. Mastery bridge

`GuruMasteryBridgeService` is the only path from a page checkpoint to the canonical mastery ledger. It records evidence only when all of the following hold:

1. `GURU_MASTERY_BRIDGE=enabled` on the server (default: disabled).
2. The session belongs to a learner profile, not only a parent account.
3. The lesson has at least one VERIFIED concept mapping.
4. The depth and language pair has passed the evaluation threshold.

When it records, it writes `LearningEvidence` of type EXPLANATION through the existing `MasteryCalculatorService`, one per verified concept, with a deterministic evidence key derived from session, request and concept. Retries therefore never double count. The raw score is model confidence times the fraction of rubric criteria met; the outcome is CORRECT only when the checkpoint passed. Assisted practice and page questions never reach the bridge.

Every assessed answer carries `assessment.masteryUpdated`, `assessment.conceptIds` and `assessment.masteryNote`, and the classroom board shows the learner a plain-language statement of what changed and why. A ledger failure keeps the checkpoint progress and reports `ledger-error`.

## Durable lesson generation

A lesson request never waits on the model. `POST …/pages/:page/lesson` returns the cached lesson with 200 when it exists; otherwise it returns 202 with a job (`GuruLessonJob`), reusing any live job for the same lesson identity so concurrent learners on the same page and depth share one generation. Clients poll `GET /api/v2/guru/jobs/:id` (requester or ADMIN only) and re-request the lesson when the job is DONE. The classroom shows the current stage (reading the page, planning, repairing, reviewing, saving) and the learner can keep reading the source meanwhile.

A worker inside each backend process claims jobs with compare-and-swap (`QUEUED` to `RUNNING`), so several processes can share the table without double generation. Stages are written as the planner progresses. Transient failures re-queue the job up to `GURU_JOB_MAX_ATTEMPTS`; validation failures, a changed page source and the provider's daily quota fail immediately. Jobs left `RUNNING` for more than `GURU_JOB_STALE_MINUTES` after a crash are re-queued at startup. Budget is reserved once per new job. When a job completes, evaluation-corpus cases waiting for exactly that page, depth and language are linked to the artifact.

| Variable | Default | Meaning |
| --- | --- | --- |
| `GURU_WORKER` | enabled outside tests | `disabled` turns the in-process worker off (for API-only replicas). |
| `GURU_WORKER_CONCURRENCY` | 1 | Simultaneous generations per process; keep at 1 on free-tier quotas. |
| `GURU_JOB_MAX_ATTEMPTS` | 2 | Attempts before a transient failure becomes permanent. |
| `GURU_JOB_STALE_MINUTES` | 15 | Age after which a RUNNING job is treated as abandoned. |

## Account recovery and email ownership

Password reset and email verification use single-use, hashed, expiring tokens (`ParentRecoveryToken`). A completed reset sets the password, increments `ParentCredential.credentialVersion` so older sessions are rejected, and marks the email verified, which is how legacy accounts without a credential are claimed. Delivery goes through `MailerService`:

| Variable | Meaning |
| --- | --- |
| `AUTH_MAIL_WEBHOOK_URL` | Trusted delivery endpoint that accepts JSON `{to, subject, text}`. Unset means messages are not sent and a redacted warning is logged. |
| `AUTH_MAIL_WEBHOOK_TOKEN` | Optional bearer token for that endpoint. |
| `APP_PUBLIC_URL` | Base URL used in emailed links (default `http://localhost:3000`). |

Endpoints: `POST /auth/recovery/request`, `POST /auth/recovery/confirm`, `POST /auth/verify-email/request` (signed in), `POST /auth/verify-email/confirm`. The request endpoints answer identically whether or not the account exists. The frontend page is `/login/recovery`.

## What remains unverified

- Live lessons exist only for one page so far (EVS page 46, five depths) and one live grading; lesson quality, drawing accuracy and grading fairness across the corpus are untested until billing allows preparation and educators score the cases.
- No educator has scored a case; the approval threshold has not been reached for any depth, so the bridge cannot record evidence yet even if enabled.
- Concept mappings depend on extraction provenance; built-in scans have no `ConceptChunk` rows and need manual curator links through the evaluation page's mapping panel.
- Mail delivery needs a real webhook; it has been exercised only with the in-memory test outbox.
