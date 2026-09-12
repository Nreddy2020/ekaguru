# Teacher Engine: architecture and ordered tasks (11 September 2026)

Owner's brief, in their words: once a book is uploaded, the app must prepare every page's topics by
itself and then teach on the board the way a teacher does. The teacher first says what the lesson
is about and what we will learn, explains each idea in depth (say "baby plant": how a baby plant is
born, how it grows), keeps checking whether the children are following, takes their doubts and
answers them, and carries on. A mutual conversation, not a bot reading a script. Completing this is
40 percent of what the app is for.

This document is the plan for that. Section 1 answers the question about free chat sessions.
Section 2 defines the teacher's behaviours as acceptance criteria. Section 3 is the architecture,
with what already exists marked. Section 4 is the ordered task list. Section 5 is cost and capacity.

## 1. The daily quota, and why "free chat sessions" is not the way out

**What is actually limited.** The Gemini free tier allows 20 requests per model per day. That
blocked *preparation* (writing a lesson costs three or four calls), not teaching: once a lesson is
prepared it is cached and every learner on that page uses it for nothing. A learner's own turns
(gradings, doubts) are one small call each. So the quota is a one-time cost per page, shared by all
users, never a per-user cost.

**Why not drive ChatGPT, Gemini or Claude chat windows from the app.** It is not a foundation a
product can stand on, and I will not build it:

- Automating the consumer chat sites with a bot breaks their terms of use; accounts get banned and
  the app stops for every learner at once.
- They put captchas, session limits and interface changes in the way; every change is an outage.
- Children's answers and uploaded textbooks would flow through a personal chat account, outside any
  contract about data handling.
- The consumer plans have their own hourly limits, so "as much data as we want" is not true either.

**What does remove the limit** (all official, all keyed by a server-side secret, none pasted in chat):

| Option | Cost | Limit | Quality | Fit |
| --- | --- | --- | --- | --- |
| Gemini pay-as-you-go on the same project | roughly 3 to 5 cents per prepared lesson at list prices; a 116-page book at five depths on the order of 20 to 30 dollars, once | none that matters | what we have verified | preparation and grading now |
| Official free API tiers pooled (Groq, OpenRouter free models, Mistral, Cerebras) | nothing | each has its own daily cap; together about ten times today's | varies by model; the validator and repair passes still apply | development and overflow |
| Local open-weight model through an OpenAI-compatible server (Ollama, vLLM, LM Studio) | nothing per call | unlimited, private | good enough for structured lesson JSON with 9B to 27B models; lower than Gemini | overnight book preparation; live turns only with a real GPU |
| Claude API (Anthropic) | per token | none that matters | strong at dialogue and grading | the conversation engine's doubt answering, if wanted |

This machine has a GeForce GT 730 (4 GB) and 48 GB of RAM: it cannot run a useful model on the GPU,
but the CPU can run a 4B to 9B model at a few tokens per second, enough to prepare pages overnight,
not enough for a live conversation turn. A 12 GB GPU or a cloud GPU changes that.

**Decision I recommend.** Enable pay-as-you-go on the Gemini project for preparation and grading
(owner's decision, it is money), and build the provider fabric in Section 3.A so that the same code
runs on Gemini, on any OpenAI-compatible endpoint (which covers local models and every free tier
above) and on Claude, with automatic failover when one is out of quota. Prices above are list prices
from memory; check the current pricing page before deciding.

## 2. What "teach like a real teacher" means (acceptance criteria)

Using the owner's example, page 3 of EVS Class 5 ("I am Growing Up"), the teacher must:

1. **Open the lesson.** "Today's lesson is I am Growing Up. By the end you will be able to say what
   living things do that non-living things do not, and you will know three new words: seed, sprout,
   grow." The objectives come from the page's learning outcomes when it has them and from the
   prepared topic map when it does not.
2. **Explain each idea in depth, on the board.** Writes the heading, the keywords and a diagram
   while speaking; explains the concept in the Experience to Symbol order the blueprint already
   enforces; gives a real-life example from the child's world.
3. **Stop on every new word.** When "baby plant" appears, the teacher does not move on: how a baby
   plant is born (a seed with food inside, water, warmth, the root first, then the shoot), how it
   grows (light, water, soil, weeks to months), with a drawing of the stages. These "term ladders"
   are prepared in advance for every key term on the page.
4. **Check understanding after each idea, not only at the end.** "Are you with me? Tell me in your
   own words what a seed needs." The child answers by voice or typing. The teacher reads the answer:
   understood, partly, confused, a question, off topic, or silence, and responds accordingly.
5. **Re-explain differently when the child is lost.** Not the same sentence louder: a second
   explanation with a different analogy or a hands-on picture, then a third; each concept carries
   an explanation ladder of three prepared variants before a live model call is needed.
6. **Take doubts at any moment.** The child can interrupt ("Guru, what is a root?"). The teacher
   answers from the page and the prepared topic map, says plainly when the answer goes beyond this
   page, and returns to where the lesson was, with the board still showing where that is.
7. **Anticipate doubts.** Each page has a prepared doubt bank (the questions children of this age
   ask about this content) so common doubts are answered instantly and consistently.
8. **Practise, then summarise.** Worked example, guided practice, independent practice, summary in
   the page's words, and a teach-back ("now you explain it to me"), as the blueprint has today.
9. **Remember the child.** What was understood, what confused them and what they asked feeds the
   next page (the "Guru remembers" line exists; it must now carry check-in outcomes and doubts).
10. **Sound like a teacher.** One consistent persona, addressing the child by name, warm, never
    "as an AI"; every sentence spoken by the orb, captions under it.

A lesson that does all ten for any page of an uploaded book, without a human preparing anything, is
the definition of done for this stage.

## 3. Architecture

Five parts. Each lists what exists in the code today and what is new.

### 3.A Model Fabric (provider registry with roles, budgets and failover)

Exists: `GuruModelService` with Gemini (verified live) and an OpenAI path (mocked), structured
output schemas, retry on 429/503, daily-quota detection, per-account budgets (`GuruUsageService`).

New:
- **Providers** as a registry: `gemini`, `openai-compatible` (base URL + key + model; covers OpenAI,
  Ollama, vLLM, LM Studio, Groq, OpenRouter, Mistral, Cerebras, Together), `anthropic`.
- **Roles**: `vision` (page transcription), `prepare` (topic maps, lesson plans, board plans),
  `converse` (check-in classification, re-explanations beyond the ladder, doubt answers), `grade`.
  Each role has an ordered list of providers; the first one with quota answers.
- **Quota ledger per provider and day** (`GuruProviderUsage`): requests, tokens, last quota error;
  failover skips a provider until its window resets; the classroom never sees a quota error while
  any provider in the role's list still works.
- **Lesson identity** keeps the model in the hash for prepared artifacts (quality provenance), but
  cached lessons are served regardless of which provider is active today (already true for reads).
- Configuration by environment only: `GURU_PROVIDERS` (JSON list) and per-role orders; keys never in
  chat, logs or commits.

### 3.B Book Preparation Engine (curriculum compiler)

Exists: queued page reading (`GuruEvidenceJob`, first-time OCR in a worker), lesson planner with the
guru-v3 blueprint, validator and repair passes, durable lesson jobs (`GuruLessonJob`), evaluation
corpus scripts.

New:
- **Book preparation record** (`GuruBookPreparation`: bookId, sourceHash, pagesTotal, stage counts,
  status, startedAt, finishedAt, error) created when an upload completes or an admin queues a
  built-in book, visible to the owner ("Preparing your book: 34 of 116 pages ready").
- **Stage 1, read**: enqueue evidence jobs for every page (exists).
- **Stage 2, topic map per page** (`GuruPageTopicMap`, keyed by page revision):
  title; what this page teaches in one sentence; learning objectives; **key terms** each with a
  child-level definition, a **term ladder** (born, grows, why it matters) and a drawing spec;
  prerequisites (pages or concepts a child should already have); **doubt bank** (question, answer
  grounded in the page, "beyond this page" flag); misconceptions with counter-examples; real-life
  example seeds local to the learner's region and language; check-in questions with model answers.
  Validated against the page's evidence like lessons are (every claim cites block ids or is marked
  as beyond the page).
- **Stage 3, lesson plans**: the existing planner, extended to blueprint **guru-v4**: a new
  `orientation` phase (what the lesson is about, what we will learn, words we will meet) before the
  hook; `term` actions that pause on a key term with its ladder; `checkin` actions after every
  concept (ungraded, classified, branching); an **explanation ladder** of three variants per
  concept; a **board plan** per action (heading, keywords to write, diagram, what to circle when
  re-explaining). Generated for the five depths, each from the topic map plus the evidence.
- **Stage 4, board plans and drawings** validated for the 1000 by 1000 canvas (exists in part).
- **Priority scheduling**: the page a learner opens first, then its neighbours, then the chapter,
  then the whole book; built-in books prepared the same way by a batch script; preparation runs on
  the `prepare` role, so it can use the cheapest or a local provider overnight.
- **Reuse across uploads**: identical page revisions (same hash) share topic maps and lessons.

### 3.C Teacher Dialogue Engine (the conversation)

Exists: server session runtime with a cursor over a linear action script, graded checkpoints,
ungraded prior-knowledge and reflection asks with acknowledgements, grounded page questions (the Ask
box), learner context, spaced reviews, cached-depth fallback.

New:
- **Beats instead of a straight line.** The prepared lesson is a sequence of beats (orientation,
  concept, term, example, check-in, practice, summary, teach-back). The session keeps a cursor plus
  a **stack** so a doubt or a re-explanation can be pushed and popped: the class returns to exactly
  where it was, and the board keeps a "we are here" marker.
- **Check-in loop.** At every check-in the teacher asks and listens (voice or text). A **response
  classifier** (rules first, then the `converse` role for anything unclear) labels the answer:
  `UNDERSTOOD`, `PARTIAL`, `CONFUSED`, `QUESTION`, `OFF_TOPIC`, `SILENT`. Policy per label:
  understood, praise in one line and continue; partial, address the missing piece; confused, next
  rung of the explanation ladder with its board change; question, answer and return; off topic, a
  gentle redirect; silent, one more invitation, then continue and note it.
- **Doubt answering.** Grounded first in the page evidence and the topic map (doubt bank), then the
  wider curriculum knowledge, with the "this goes beyond your page" marker spoken aloud. The answer
  cites what it used; anything unverifiable is said as such.
- **Interrupts.** The learner can speak or type at any time; a question during an explanation pauses
  speech, is answered, and the explanation resumes from the sentence it was in.
- **Persona and voice rules.** One teacher persona per language (name, tone, sentence length by
  age), address by name, no system talk. The same rules feed prepared text and live turns.
- **Cost discipline.** Prepared beats, acknowledgements, ladder rungs and doubt-bank hits cost no
  model call. Only unclear classifications, novel doubts and third-rung re-explanations call the
  `converse` role; every turn is bounded by the account budget that exists today.
- **Transcript ledger** (`GuruDialogueTurn`): who said what, label, beat, model or prepared; feeds
  the parent view, the learner context and the evaluations.

### 3.D Board and voice (the classroom surface)

Exists: `PageTeachingBoard` with progressive writing, `GuruScene` drawings, phase labels, voice orb
(speaking, listening, thinking), speech recognition for answers, pace control, captions.

New:
- **Board plan renderer**: writes the heading and keywords as the teacher says them, draws the
  diagram in stages, underlines or circles the part being re-explained, keeps a "we are here" marker
  and a board history a child can scroll back through.
- **Check-in mode**: the orb listens continuously for a bounded window at check-ins; barge-in stops
  speech when the child starts talking; an "I have a doubt" button and hotword for keyboards.
- **Doubt panel**: shows the question, the answer, the page lines it came from, and "beyond this
  page" when applicable; a "back to the lesson" control that pops the stack.
- **Preparation status** in the library ("Ready", "Preparing 34 of 116", "Reading page…") and in
  the classroom for a page still being prepared (teach from the nearest ready depth, which exists).

### 3.E Understanding, memory and quality

Exists: mastery bridge gate, spaced reviews, educator evaluation corpus and rubric, load test notes.

New:
- Check-in outcomes and doubts recorded per learner and concept; confusion on a concept lowers the
  suggested depth for the next page and adds a recap beat at the start of it.
- Parent view: "asked 3 doubts on page 3, understood seeds after the second explanation".
- **Persona replay evaluations**: scripted learners (confused, curious, silent, off-topic) run
  through prepared lessons against the dialogue engine without a human, and the pass criteria are
  written down (every confused turn gets a different explanation, every question gets an answer
  that cites the page, the lesson always returns to its beat).
- Educator spot checks of topic maps (definitions and ladders) as a second rubric.
- Latency budgets: a prepared beat starts speaking within 300 ms; a live turn answers within 4 s at
  the 95th percentile; measured and shown on the curator page.

### Data and API additions (summary)

Tables: `GuruProviderUsage`, `GuruBookPreparation`, `GuruPageTopicMap`, `GuruDialogueTurn`; lesson
artifacts gain blueprint `guru-v4` fields (orientation, term, checkin, ladder, boardPlan).
Endpoints: `POST /api/v2/books/:id/prepare` and `GET …/preparation` (status), `GET
…/pages/:page/topic-map`, session events gain `checkin`, `doubt`, `resume`, `interrupt`; `GET
/api/v2/guru/providers` (ADMIN, health and quota per provider).

## 4. Ordered tasks

Each task has an acceptance line. "Owner" marks decisions or accounts only the owner can make.
Order matters: each phase unblocks the next.

### Phase 0: capacity (this unblocks everything)

- [ ] 0.1 **Owner**: enable pay-as-you-go on the Gemini project (or decide against it and accept
  local-only preparation speed). Acceptance: a prepared lesson no longer fails on the daily quota.
- [ ] 0.2 Provider registry with roles (`vision`, `prepare`, `converse`, `grade`) and the
  `openai-compatible` provider. Acceptance: the same lesson prepares on Gemini and on a local
  Ollama model with no code change; unit tests for routing and failover.
- [ ] 0.3 Per-provider daily quota ledger and failover. Acceptance: with the first provider out of
  quota, generation continues on the next and the classroom shows no quota error; test covers it.
- [ ] 0.4 Anthropic provider for the `converse` and `grade` roles. Acceptance: a doubt answered
  live through Claude with the same grounding rules; a live check recorded.
- [ ] 0.5 Local-model smoke test on this machine (CPU, 4B to 9B model): pass rate of the validator
  on ten pages, time per lesson, written into docs/evaluation. Acceptance: numbers recorded, and a
  recommendation on hardware.

### Phase 1: Book Preparation Engine

- [ ] 1.1 Topic map schema, prompt, validator and storage (`GuruPageTopicMap`), generated for a page
  revision once and shared. Acceptance: EVS pages 2 to 5 have topic maps whose every claim cites
  evidence or is flagged as beyond the page; unit tests on the validator.
- [ ] 1.2 Term ladders and doubt bank inside the topic map, with drawing specs. Acceptance: "baby
  plant" on page 3 yields a ladder (born, grows, why) with a staged drawing, and the doubt bank has
  at least eight child questions with grounded answers.
- [ ] 1.3 Blueprint guru-v4: `orientation` phase, `term` actions, `checkin` actions, explanation
  ladders, board plans; validator rules for their order. Acceptance: pages 2 and 3 regenerate under
  v4 and pass; the board shows the orientation first.
- [ ] 1.4 Book preparation job and status (`GuruBookPreparation`): on upload complete, read every
  page, build topic maps, then lessons for the five depths with priority scheduling. Acceptance: a
  freshly uploaded 20-page PDF is fully prepared with no manual step; the library shows progress.
- [ ] 1.5 Batch preparation of the built-in books with the same pipeline (script plus admin
  button). Acceptance: EVS Class 5 fully prepared at basis and developing; per-page cost and time
  recorded.
- [ ] 1.6 Curator page: view a page's topic map, mark a definition or doubt answer as wrong,
  regenerate that piece only. Acceptance: one correction round-trips without regenerating the page.

### Phase 2: Teacher Dialogue Engine

- [ ] 2.1 Beats and the stack in the session runtime; `checkin`, `doubt`, `resume`, `interrupt`
  events; transcript ledger. Acceptance: a doubt in the middle of an explanation is answered and
  the lesson resumes from the same beat; runtime tests cover push and pop.
- [ ] 2.2 Response classifier (rules, then the `converse` role) with the six labels and policies.
  Acceptance: a labelled set of 60 child answers (typed and transcribed) classifies at 90 percent
  agreement with two educators; unit tests on the rules.
- [ ] 2.3 Re-explanation from the ladder, then live, with the board change (circle or underline the
  part being re-taught). Acceptance: a "confused" answer produces a visibly different explanation
  each time, three times, before any repeat.
- [ ] 2.4 Grounded doubt answering: doubt bank first, then page plus topic map, then curriculum
  knowledge with the "beyond this page" marker spoken. Acceptance: ten doubts on page 3 answered
  with citations; the marker appears exactly on the ones beyond the page.
- [ ] 2.5 Teacher persona per language (name, tone, sentence length by age) applied to prepared text
  and live turns; address by name. Acceptance: a transcript review finds no system talk and a
  consistent voice across prepared and live turns.
- [ ] 2.6 Check-in outcomes and doubts into the learner ledger and "Guru remembers". Acceptance:
  confusion on "seed" on page 3 produces a recap beat at the start of page 4 for that learner.

### Phase 3: Board and voice

- [ ] 3.1 Board plan renderer: headings and keywords written as spoken, staged diagrams, circle and
  underline on re-explain, "we are here" marker, scrollable board history. Acceptance: page 3 plays
  with the board matching speech beat by beat; reduced-motion respected.
- [ ] 3.2 Check-in listening mode with barge-in and a bounded window; "I have a doubt" button and
  hotword. Acceptance: speaking while Guru talks pauses it within 300 ms; silence for the window
  yields the `SILENT` policy.
- [ ] 3.3 Doubt panel with citations and "back to the lesson". Acceptance: usable by keyboard and
  screen reader; verified in the in-app browser.
- [ ] 3.4 Preparation status in the library and classroom. Acceptance: a page still being prepared
  teaches from the nearest ready depth and says so.

### Phase 4: quality, cost and evidence

- [ ] 4.1 Persona replay evaluations (confused, curious, silent, off-topic learners) run in CI
  against prepared lessons with written pass criteria. Acceptance: green on pages 2 to 5.
- [ ] 4.2 Educator spot checks of topic maps and ladders (second rubric). Acceptance: 20 pages
  scored; corrections fed back through 1.6.
- [ ] 4.3 Latency and cost dashboard on the curator page: per-turn latency percentiles, model calls
  avoided by prepared material, cost per lesson and per learner-hour. Acceptance: numbers visible
  for a week of dev use.
- [ ] 4.4 A five-learner pilot on one chapter with the owner watching: transcripts, doubts, where
  the teacher failed. Acceptance: a written findings note and the next task list.

## 5. Cost and capacity at a glance

| Activity | When | Calls | Provider role | Cost order of magnitude |
| --- | --- | --- | --- | --- |
| Read a page (OCR) | once per page revision | 0 model calls | local Tesseract | nothing |
| Topic map | once per page revision | 1 to 2 | prepare | about a cent |
| Lesson plan, one depth | once per page, depth, language | 2 to 4 | prepare (vision shared) | 3 to 5 cents |
| Whole 116-page book, five depths | once | about 2,000 | prepare | tens of dollars, once |
| Check-in classification | per learner turn | 0 when rules decide, else 1 small | converse | well under a tenth of a cent |
| Doubt answer | per novel doubt | 1 | converse | well under a tenth of a cent |
| Grading | per graded answer | 1 | grade | under a cent |

Prepared material is what makes teaching cheap: a class of a thousand children on the same chapter
costs the preparation once plus their own turns. The fabric in 3.A lets each row use the cheapest
provider that meets its quality bar, including a local one for preparation.

## 6. What "40 percent" means here

This stage is complete when a book uploaded by a parent is prepared end to end with no human step,
any of its pages opens with the orientation, the ideas are taught on the board with new words
explained in depth, the teacher checks understanding after each idea and reacts to the answer,
doubts are taken and answered at any moment with the lesson resuming where it was, and all of it
works by voice, on more than one provider, at a cost that does not grow with the number of learners.
Evidence for each of those is the acceptance line of the tasks above, recorded in docs/evaluation.

## Addendum, 12 September 2026: notes first

The owner redirected the order: before the live conversation, Guru must produce the teacher's study
notes for every page (detailed explanation topic by topic, extended by readers' questions, printable,
saved with the book), because most parents cannot explain a lesson themselves. That surface is built
(docs/guru-notes.md) and becomes the first output of the Book Preparation Engine in 3.B; the
dialogue engine in 3.C later reads from the same prepared material. The provider fabric's first
piece, role models (`GURU_NOTES_MODEL`), also landed with it.
