# First teachable pages under the teaching methodology (11 September 2026)

Scope: the first two teachable pages of the built-in EVS Class 5 book. Physical page 1 is the
table of contents, so the pages are physical page 2 ("Festivals of India", the unit opener) and
physical page 3 ("Chapter 1: I am Growing Up", a chapter opener with learning outcomes and a
starting-point activity). Everything below was produced with `GURU_MODEL=gemini-3.5-flash`
on the free tier (20 requests per model per day), through the durable job path.

## Evidence tier

Tier B (live, single run per case, one educator-free walk-through in the browser). Educator
scoring of these lessons against rubric v1 is still open and is listed in the implementation plan.

## Generated lessons

| Page | Depth | Result | Time | Actions | Phases in order |
| --- | --- | --- | --- | --- | --- |
| 2 | basis | ok | 67 s | 9 | hook, prior, explain, explain (draw), reallife, model, guided, independent, summary |
| 2 | developing | ok | 85 s | 10 | blueprint satisfied (adds misconception) |
| 3 | basis | ok after one repair pass | 116 s | 11 | hook, prior, explain x3, explain (draw), reallife, model, guided, independent, summary |
| 3 | developing | not prepared | – | – | job failed: daily provider quota exhausted at 11:13 UTC; it stays queued for the next attempt |

Page 3, first attempt (before the fixes below): the first plan omitted 7 of 12 evidence blocks
(the learning outcomes, the starting-point header and the paste-a-picture table among them) and
the repair pass then dropped the real-life example phase, so both plans were rejected.

Page 3, after the fixes: only two blocks are omitted (the unit banner and the page number), the
learning outcomes are taught in the hook ("Why growing up matters") and the starting-point
activity becomes the prior-knowledge ask ("How have you changed?").

## Fixes made while preparing these pages

- Planner prompt: learning outcomes, starting-point activities, discussion questions, tables to
  fill and captions are instructional and must be taught; unit and chapter banners and page
  numbers may be omitted. The omission allowance is now the larger of 3 and 30 percent of the
  blocks, and the validator message names the allowance.
- Repair pass: the repair prompt now restates the full blueprint for the depth and instructs the
  model to keep every present phase, and up to two repair passes run before the case fails.
- Classroom board: moving on with Next always teaches the next step aloud (it used to leave the
  board paused and silent after an ask), and a shared prior-knowledge answer continues on its own
  once Guru has spoken the acknowledgement, which is what "Share and continue" promised.

## Live walk-through (page 2, basis, parent account with learner Asha)

Steps observed in the browser against the running backend, with voice on:

1. Lesson served from cache in about one second; a session was created for the learner and the
   header showed "Guru remembers: You have already worked through page 46".
2. Start: hook spoken by the orb (state `speaking`, word pulses counting up).
3. Prior knowledge: "What you already know" ask; the learner shared "My favourite festival is
   Diwali…"; Guru acknowledged it without a model call ("That sounds like a wonderful
   celebration!…") and moved on by itself to the explanation.
4. Explanations, "From your life" real-life example and the "Worked example (I do)" phase were
   narrated in turn; the phase label changed with each step.
5. Guided practice ("we do"): Next was disabled until the answer was discussed. The answer about
   Bathukamma was graded live by gemini-3.5-flash as correct, spoken back, and recorded as page
   practice (the mastery bridge is not enabled on this machine).
6. Independent practice ("you do"): the Bonalu answer was graded live as correct.
7. Summary: the review note read "Page practice recorded as partly secure. Guru will suggest
   reviewing this page in 2 days."

Page 3 opened with the learner's recommended depth (developing, because page 2 was completed
independently). That lesson was not cached and the provider quota was exhausted, so the studio
first showed the source-reading fallback with the quota message. With the cached-depth fallback
added the same day, reopening page 3 taught from the cached basis lesson at once ("basis · Action
1/11, Why this matters", hook spoken), the header read "Guru remembers: You have already worked
through page 2 (Festivals of India), page 46 (Places in a Neighbourhood)", and the notice said the
Developing lesson could not be prepared now because of the quota.

## Quota accounting for the day (gemini-3.5-flash)

Roughly 20 requests: page 2 basis (3), page 3 basis (two runs, 6), page 2 developing (2 to 3),
page 3 developing (partial, 2), two live gradings, plus vision extraction. The remaining depths
for both pages (proficient, advanced, deep) and page 3 developing run when the quota resets or
billing is enabled on the Gemini project; the prepare script stops cleanly on the quota error.
