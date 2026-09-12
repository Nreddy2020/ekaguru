# Guru Notes: first live results (12 September 2026)

Scope: the first two teachable pages of EVS Class 5 (physical pages 2 and 3), plus page 4 through
the whole-book preparation endpoint. Notes were written by `gemini-3.5-flash-lite` on the free
tier through the `GURU_NOTES_MODEL` role, because the lesson model's daily quota was exhausted and
the free-tier day resets at 07:00 UTC. Evidence tier B: live, single run, no educator score yet.

## Results

| Page | Blueprint | Result | Time | Topics | Words per topic | Omitted |
| --- | --- | --- | --- | --- | --- | --- |
| 3 | notes-v1 | ok | 30 s | 3 | 71, 83, 93 | unit banner, chapter number |
| 2 | notes-v1 | ok after one repair pass | 40 s | 5 | 70 to 97 | none |
| 3 | notes-v2 (depth rule) | ok | 30 s | 2 | 161, 144 | unit banner |
| 2 | notes-v2 | ok | 30 s | 5 | 155 to 185 | none |
| 4 | notes-v2, via `notes/prepare` from=4 to=4 | ok | under 30 s after queuing | | | |

The first attempts failed before any of this: the lite model's page transcription came back with
a malformed block, and the strict transcription check rejected the whole page twice. Two fixes
followed: the vision call now uses structured output, and geometry and confidence from the model
are normalised (coordinates clamped to the frame, percentages turned into fractions) instead of
rejecting the page; text is the only thing that cannot be repaired. A malformed transcription is
no longer reused by the next attempt.

The v1 notes read as a good summary rather than a teacher's explanation (two paragraphs and 70 to
97 words per topic), so the depth rule became blueprint v2: three to eight paragraphs and at least
120 words per topic, with the prompt asking for what it is, how and why it works step by step, and
how it connects to the child. The lite model met the rule on the first attempt for both pages.

## What the page 3 notes say (v2, excerpt)

Topic 2, "Living Things", second paragraph: "To understand how living things stay alive, look at
what they do every day. First, they take in air by breathing. Next, they take in food and water to
give their bodies energy. Because they get proper nourishment, they continuously grow larger in
size over time. Without air, food, and water, living things cannot survive or grow."

Words to know include "Living Things" and "Breathe" with child-level meanings and examples; the
everyday example is a potted money plant on a balcony; the doubts include "Do plants breathe like
we do?" with a grounded answer.

## Live walk-through in the classroom

- Page 3 opened as the parent account; the new **Guru Notes** tab loaded the notes in about a
  second (title, overview, objectives, three topics under v1, later two under v2), and the print
  article for the page switched to the full notes.
- Under "Living Things" the question "How is a baby plant born and how does it grow?" was asked
  from the notes. The answer came back in about three seconds, was saved into the notes for every
  later reader, and was shown with the marker "This answer goes beyond what this page says",
  which is correct: the page names living things but says nothing about seeds.
- The whole-book endpoint queued page 4 with one budget reservation; the worker prepared it and
  the status endpoint reported pages 2, 3 and 4 ready.

## Limits

- No educator has scored these notes; the "beyond this page" flag and the depth rule are
  validator judgements, not pedagogical ones.
- The v2 notes for page 3 start with no reader questions, because questions attach to a notes
  identity and the v1 notes were replaced. Carrying extensions across blueprint versions is a
  small follow-up.
- Only English, on one model, for three pages. Hindi and Telugu notes and a full book run wait
  for the next quota day or a paid or local model.

## Afternoon: the board becomes the notes (blueprint v3), and a whole book by accident

- Blueprint v3 adds, per topic, a "look at" caption for the book's own region, an optional labelled
  drawing, and a try-it-now activity. Page 3 regenerated in 50 s including a queue wait: two topics
  of 230 and 198 words, each with a 3-primitive drawing and a 3-step activity ("Shoe Size Check",
  "Breathe and Feel"); page 2 regenerated with five topics of 155 to 185 words.
- The new Guru Notes board rendered them in the browser: overview, topic headings with "Read this to
  me", the page region cut from the scan (both topics spanned most of the page, so the whole page
  showed; figures and tables are now framed first when a topic cites them), the drawing, words to
  know, the everyday example, the activity, the tip, doubts, check-yourself, the ask box. The live
  classroom did not load and its page-level ask box was hidden.
- A whole-book preparation for EVS Class 5 (116 pages) was queued from the browser during the
  session. The lite model prepared 26 pages in about 25 minutes before this note was written, at
  about 30 s a page, all within the free tier. Three pages failed the validator for rules that were
  too strict (a one-word check answer, an omission naming a region already set aside, an empty
  drawing list); the rules were relaxed and the pages re-queue on the next request. Because the
  queue was first-come, page 3's fresh notes waited behind the batch, which led to the priority
  column: an opened page now runs first, and asking again promotes a queued batch page.
- Drawings from the lite model were thin (two boxes and a line, no labels), so a drawing without a
  text label is now rejected and repaired.

## Evening: the children's edition and the one-page sheet

- The owner judged the v3 notes unreadable for children. The v4 children's edition enforces
  readability in the validator (sentence length, average, paragraph length, a Flesch-Kincaid grade
  cap of class plus 2 for English) and adds the parts children read: hook, big idea, steps, picture
  chain, fun fact, chant, quiz. Page 3 at basis, gemini-3.5-flash-lite, about 30 s: sentences
  averaging 11.7 and 11.0 words (longest 15 and 17), grade well under 7, every part present, both
  drawings labelled. The first v4 attempt failed on "topic 3 too thin" twice; the rule now counts
  the hook, big idea, paragraphs and steps together, and asks the model to merge thin topics.
- The one-page sheet rendered in the browser as a poster on the board: banner with topic icons,
  learning outcomes and starting point cards, a learning ladder with two step cards (icon, big
  idea, key points, chain), key takeaways, remember, check your understanding, a closing banner,
  then the detailed topics. It matches the owner's reference layout apart from illustrations, which
  are emoji and the book's own pictures rather than drawn art.
- Depth: opening page 3 as learner Asha (recommended depth developing) generated the developing
  notes through the board in about 60 s. Compared with basis they add "why" doubts and steps; the
  checks remain recall-level, so depth differentiation by the lite model is weak and needs the
  educator rubric or a stronger model for the higher depths.
- The whole-book batch from the afternoon finished under v3; those pages are superseded lazily
  when opened (an opened page runs first) and can be re-queued at any depth.
