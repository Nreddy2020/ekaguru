# Guru quality and mastery gates

Added 11 September 2026. This document describes the four server-side gates that stand between a Guru page lesson and any claim about a learner. All of them are implemented and unit-tested; the parts that need a live model or human educators are marked as such.

## 0. Teaching methodology

Every Guru lesson follows a teacher's blueprint (`guru-pedagogy.ts`), enforced by the validator and shown on the board as phase labels:

1. **Hook**: why this page matters, with a concrete situation.
2. **Prior knowledge**: an ungraded ask that activates what the learner already knows; Guru acknowledges and moves on.
3. **Explain**: the concept in depth (at least two actions) in the product's layer order, Experience, Intuition, Story, Visual (a drawing, which must precede any symbol and the worked example), Language (the page's terms), Symbol last.
4. **From your life**: at least one concrete example from the learner's everyday world, current and local to their language and region, explained in depth: what happens, why, and how each part maps to the page's words. Scenes the learner can picture, not definitions.
5. **Worked example (I do)**: every step and the reason for it.
6. **Guided practice (we do)**: an ask whose hint walks the same steps on a new case.
7. **Independent (you do)**: a graded ask the learner answers alone.
8. **Misconception** (developing and above): the likely wrong idea, refuted with a counter-example.
9. **Transfer** (proficient and above): apply the idea to a situation not on the page.
10. **Reflection** (advanced and deep): an ungraded teach-back or "what would you investigate" ask.
11. **Summary**: last, in the page's words.

The order is checked (hook first; prior and explanation before the worked example; the real-life example after the introduction and before the worked example; a drawing before the worked example and the independent checkpoint; guided before independent; transfer and reflection after it; summary last), and each depth carries a stated cognitive demand, from recognise-and-describe at basis to first-principles inquiry at deep. Ungraded asks never block progression, cost no model calls and never reach the mastery bridge. Lessons generated before this blueprint keep serving (marked `legacyBlueprint`) and the classroom offers "Prepare it again with the new methodology", which requests the lesson with `?regenerate=1` and queues a `guru-v3` generation under the normal budget; nothing is regenerated silently.

**Coverage on chapter openers.** Learning outcomes, starting-point activities, discussion questions, tables to fill and captions are instructional and must be taught (the outcomes become the hook's goal, a starting-point activity becomes the prior-knowledge ask); only page numbers, unit or chapter banners, running headers, decorative labels and duplicated text may be listed in `omitted`, at most the larger of 3 and 30 percent of the blocks. When the validator rejects a plan, up to two repair passes restate the full blueprint for the depth so a repair cannot drop a required phase (the first page 3 attempt lost the real-life example that way).

**Classroom flow.** Pressing Next always teaches the next step aloud; Back and Restart wait for Play. A shared prior-knowledge or reflection answer continues on its own once Guru has spoken the acknowledgement (or after a short reading pause with voice muted), so "Share and continue" means what it says. Graded asks still block Next until the answer has been discussed.

**Grounding in the learner's knowledge.** `GuruLearnerContextService` derives, from the ledger only, the pages this learner has completed in the same book and how each run went, canonical concepts with recorded mastery, and misconceptions Guru stated on earlier answers. Session start returns it as `personalization` and the board shows "Guru remembers …" before the lesson; a completed independent run suggests the next depth for the next page (`GET /api/v2/guru/learners/:id/context?bookId=`), an assisted run keeps the depth; and the grader is told this learner's earlier misconceptions so feedback can name a repeated one gently. None of this costs a model call or labels the learner.

## 0b. Voice presence

Guru teaches by voice first. The board shows a voice orb that breathes when idle, kicks on every spoken word (from the synthesis engine's word boundaries), ripples while it waits for or listens to the learner, and turns while the server grades. Voice is on by default wherever the browser can synthesise speech, with a mute toggle; the best available voice for the lesson language is chosen (region first, natural or neural engines preferred, novelty voices excluded) and the pace control changes speaking rate. Captions of what Guru says stay under the orb. At any checkpoint the learner can answer by speaking; the transcript lands in the answer box and is graded exactly like typed text. No audio is sent to the server: synthesis and recognition run in the browser, so this costs nothing and works offline. A server-side neural voice (for example a Gemini TTS model) can be added later behind the same `speak()` boundary; it is not implemented.

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

**Teaching from another depth while one is prepared.** When the requested depth is not cached, the client asks `POST …/lesson?cachedOnly=1` for the nearest depths this page already has (foundations before stretch: for developing, basis first, then proficient and so on); the server answers the cached lesson or 204 and never queues anything for that probe. If a lesson is found, the board teaches from it at once, the header shows the depth actually taught, and a notice tracks the requested depth's job ("Guru is preparing the Developing lesson… Teaching from the Basis lesson meanwhile"); when the job finishes the notice offers "Open it", and if it fails (for example on the daily quota) the notice says so and the class continues. A learner who asked to regenerate a specific depth waits for that job instead. Verified live on EVS page 3 with a learner whose history recommended developing while only basis was cached.

A worker inside each backend process claims jobs with compare-and-swap (`QUEUED` to `RUNNING`), so several processes can share the table without double generation. Stages are written as the planner progresses. Transient failures re-queue the job up to `GURU_JOB_MAX_ATTEMPTS`; validation failures, a changed page source and the provider's daily quota fail immediately. Jobs left `RUNNING` for more than `GURU_JOB_STALE_MINUTES` after a crash are re-queued at startup. Budget is reserved once per new job. When a job completes, evaluation-corpus cases waiting for exactly that page, depth and language are linked to the artifact.

| Variable | Default | Meaning |
| --- | --- | --- |
| `GURU_WORKER` | enabled outside tests | `disabled` turns the in-process worker off (for API-only replicas). |
| `GURU_WORKER_CONCURRENCY` | 1 | Simultaneous generations per process; keep at 1 on free-tier quotas. |
| `GURU_JOB_MAX_ATTEMPTS` | 2 | Attempts before a transient failure becomes permanent. |
| `GURU_JOB_STALE_MINUTES` | 15 | Age after which a RUNNING job is treated as abandoned. |

## Persisted page evidence

`GuruPageEvidence` stores the reliable blocks, dimensions, status and provenance for each (book, physical page, source hash), never the image. Evidence responses no longer embed the scan either: they carry an `imageUrl`. Built-in scans come from `GET /api/v2/textbooks/:bookId/pages/:page/image` with an immutable cache policy and an ETag equal to the source hash; private uploads come from a signed, expiring URL issued with the evidence (`exp` and an HMAC `sig` over material, page and expiry, keyed by the server signing secret), because an `<img>` cannot carry a bearer token. OCR and native-PDF extraction run once per page revision across restarts and replicas; the image is regenerated from the source bytes on every read, so the source of truth stays the original file. Cache reads and writes are best effort: if the table is unreachable the evidence is computed as before and the lesson never depends on the write.

## Spaced review of practised pages

When a run of a lesson reaches the summary, the session records a completion and schedules the next review from what that run actually showed in the ledger: no assisted checkpoints means an independent run. Stages are introduced, partial, understood and retained with intervals of 1, 2, 7 and 21 days (the product requirement); an independent run moves a page up one stage, an assisted run moves it down one, and a restart starts a new run so only events after it count. This is page-practice scheduling, kept separate from canonical concept mastery and never described as mastery. The classroom shows the scheduling line after a completed run, and the parent activity view lists reviews that are due with a link to the page.

## Parent visibility

`GET /api/v2/guru/learners/:learnerId/activity` (owner or ADMIN, enforced by the learning-library guard) derives a parent-facing view from the idempotent session ledger: pages practised, checkpoints passed independently, attempts, assisted checkpoints, page questions, mastery evidence recorded, and Guru's stated misconceptions with counts, plus per-session progress and the last events with the learner's own words and Guru's feedback. Session events now store their kind. The parent dashboard shows this as "Guru classroom activity" with a plain-language explanation of how each number is counted; assisted practice never counts as independent understanding and mastery stays at zero until the bridge gates open.

## Account recovery and email ownership

Password reset and email verification use single-use, hashed, expiring tokens (`ParentRecoveryToken`). A completed reset sets the password, increments `ParentCredential.credentialVersion` so older sessions are rejected, and marks the email verified, which is how legacy accounts without a credential are claimed. Delivery goes through `MailerService`:

| Variable | Meaning |
| --- | --- |
| `AUTH_MAIL_WEBHOOK_URL` | Trusted delivery endpoint that accepts JSON `{to, subject, text}`. Unset means messages are not sent and a redacted warning is logged. |
| `AUTH_MAIL_WEBHOOK_TOKEN` | Optional bearer token for that endpoint. |
| `APP_PUBLIC_URL` | Base URL used in emailed links (default `http://localhost:3000`). |

Endpoints: `POST /auth/recovery/request`, `POST /auth/recovery/confirm`, `POST /auth/verify-email/request` (signed in), `POST /auth/verify-email/confirm`. The request endpoints answer identically whether or not the account exists. The frontend page is `/login/recovery`.

## What remains unverified

- Live `guru-v3` lessons exist for EVS pages 2 (basis, developing) and 3 (basis), plus the earlier `guru-v2` lessons for page 46 (five depths); four answers have been graded live. Lesson quality, drawing accuracy and grading fairness across the corpus are untested until billing allows preparation and educators score the cases. See evaluation/first-pages-2026-09-11.md.
- No educator has scored a case; the approval threshold has not been reached for any depth, so the bridge cannot record evidence yet even if enabled.
- Concept mappings depend on extraction provenance; built-in scans have no `ConceptChunk` rows and need manual curator links through the evaluation page's mapping panel.
- Mail delivery needs a real webhook; it has been exercised only with the in-memory test outbox.
