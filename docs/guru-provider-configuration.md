# Guru model provider configuration

Use the backend environment, never a browser field or committed key. Existing installations keep Gemini when GURU_PROVIDER is absent.

For OpenAI set GURU_PROVIDER=openai, OPENAI_API_KEY and GURU_MODEL to an image-capable model available to your API project. The official documentation currently demonstrates gpt-6-astra for image input. This is a candidate to evaluate, not a measured recommendation that it is best for every learner. The app uses the OpenAI API; a ChatGPT subscription is not the app's server credential.

OpenAI requests use the Responses endpoint with the original page image, high image detail, JSON mode, an output-token cap, a 90-second abort deadline and store=false. JSON mode does not guarantee the lesson schema: the existing source/plan/rubric validation remains mandatory. Refusals, incomplete responses, bad JSON and provider failures cannot produce accepted lessons. Provider plus model identity partitions the lesson cache. Transient provider errors (HTTP 429 rate limits and 503 high-demand responses) are retried at most twice with `GURU_RETRY_WAITS_MS` waits; nothing else is retried and there is no provider failover. The per-call deadline is `GURU_REQUEST_TIMEOUT_MS` (default 180 s) because deep-level lessons on dense pages exceed 90 s.

New page lessons make three model calls: visual interpretation, lesson planning and source review, plus one repair call when the validator rejects the first plan (the validator's exact complaint is fed back). Vision transcription is cached per page image and model, so the five depths of one page share a single vision call in the same process. Gemini structured output (`responseSchema`) is applied to planning, grading and page-question calls so shape errors are rare; content rules are still enforced server-side. Questions and assessed answers add calls. Configure account budgets and measure representative lessons before production use. No paid calls were made during implementation.

Official references checked 10 September 2026:
- [Image inputs](https://developers.openai.com/api/docs/guides/images-vision)
- [JSON mode and structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

Verification: 12 mocked provider tests cover original image input, request format, missing key, remote-image rejection, incomplete/failed/refused/invalid output, provider errors, rate limits and Gemini compatibility. Live factual quality, latency, account/model compatibility and cost remain unverified because no provider key is configured.

## First live results (11 September 2026, gemini-2.5-flash)

Verified with the Gemini key configured only in the ignored backend `.env`:

- The listed models included `gemini-3.8-flash`, which answered a trivial probe but returned HTTP 503 (high demand) for a real lesson, and `gemini-2.5-flash`, which was used for all results below.
- EVS Class 5 physical page 46 ("Places in a Neighbourhood"): vision transcription produced 15 blocks (5 headings, 6 paragraphs, 4 figure descriptions, minimum confidence 0.95). The basis-depth lesson was accepted after one repair pass: 17 actions (5 write, 4 explain, 3 draw, 4 ask, 1 summary), 14 of 15 blocks taught, the page number explicitly omitted, and the model review passed. Generation took about 117 s. The advanced-depth lesson was accepted with 17 actions in 172 s.
- Failure causes met and fixed on the way: `maxOutputTokens` 12000 truncated transcriptions (Gemini counts reasoning tokens against it; now 32000 and configurable), a 90 s deadline aborted deep-level planning (now 180 s), free-tier 429 throttling under concurrent generation (bounded retry), model plans that dropped a page-number block or omitted `height` on rectangles (explicit omissions with reasons, structured output, clamped geometry, one repair pass), and an empty `notes` list (prompt now defines notes).
- The accepted basis lesson played in the approved classroom in the in-app browser: progressive board, narration, and the checkpoint "What do you buy at a market?" blocked Next until answered.

These are engineering acceptance results, not educator judgements. Quality is decided by the evaluation corpus reviews.

## Quotas

The Gemini free tier enforces a per-model daily request quota (20 per day for `gemini-2.5-flash` on the project used on 11 September 2026). Each new lesson makes three calls plus at most one repair call; grading and page questions add one call each. Budget accordingly: the free tier supports demonstrations, not corpus preparation. A per-day quota error is reported to learners as "Guru's daily provider quota is exhausted for this model" and is never retried; source reading stays available. `GET /api/v2/guru/usage` shows the account-level ledger, which is separate from the provider quota.
