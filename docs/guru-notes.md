# Guru Notes: a teacher's study notes for every page

Owner's brief (12 September 2026): most parents cannot explain a lesson to their child. When a
book is given to Guru, it should prepare notes with a detailed explanation, topic by topic, the
way a teacher or professor would explain the lesson, not a copy of the book. A child should be
able to read and understand them, ask a question about a topic and see the explanation extended,
print them, and find them saved with the book whenever they want. This is the first product
surface of the Teacher Engine plan (docs/teacher-engine-plan.md); the live classroom reads from
the same prepared material later.

## The board is the notes (12 September 2026, afternoon)

The owner's decision: the classroom board shows the notes; the live classroom stays behind a
"Live classroom (beta)" switch until it is ready. The **Guru Notes board** puts, for every topic:

- **the book's own picture**: the region of the scanned page the topic cites, cut out of the scan
  (figures and tables first when the topic has them, the whole page when it spans most of it), with a
  one-line "look at" caption; clicking it highlights the region in the page panel;
- **Guru's drawing**: a simple labelled board diagram the notes model draws for the idea (line, box,
  circle and text primitives on the 1000 by 1000 canvas, at most 40; a drawing without a label is
  rejected; a topic may have none);
- **Try this now**: a two-minute activity with everyday things, two to six steps and what to notice;
- the explanation, words to know, everyday example, tip, doubts, check-yourself and readers' questions
  as before;
- **voice**: "Read the notes to me" reads every topic through the Guru orb, topic by topic, or one
  topic at a time; the board scrolls along.

Nothing on the board comes from a stock image library or an image model: the pictures are the
child's own textbook, and the drawings are Guru's. This is blueprint `notes-v3`.

**Priority.** A page a learner opens runs before a whole-book batch (`GuruLessonJob.priority`,
10 versus 0), and asking for a queued batch page again promotes it. Whole-book preparation queues
at priority 0 with one budget reservation.

**Revision formats.** In notes mode the board's resource tabs are Quick notes, Memory notes, Flash
cards, Question bank and One-page sheet, all derived on the device from the same notes with no
model call: one line per topic; words, tricks and must-remember points; cards for words, checks,
doubts and readers' questions; questions sorted easy (check yourself), medium (doubts) and extended
(readers' questions) with answers; and everything essential on one sheet. The wider framework
(audience editions, book knowledge map, dependency map, explain-it-like-I-am ladder, teacher
edition, master package) is mapped and ordered in docs/learning-package-plan.md.

## Children's edition and the one-page sheet (12 September 2026, evening)

The owner's verdict on the first notes was that no child would read them: long paragraphs, an
adult's voice, an empty drawing. The children's edition (blueprint `notes-v4`) is written for the
class the book is for (from the book id, "evs-class-5" gives 5; uploads read as class 6) and the
validator enforces it, not just the prompt:

- **Readability**: every sentence under 22 words, an average under 14, at most 4 sentences a
  paragraph, 60 to 220 words of teaching per topic, and for English a Flesch-Kincaid grade of at
  most the class plus 2 (a Class 5 child gets grade 7 at most). Adult sentences are rejected with
  the offending length or grade named, and repaired.
- **Parts a child reads**: a hook (a scene to picture, 1 to 4 sentences), one big idea in one
  sentence, short paragraphs, steps when the idea happens in order, a picture chain with emoji
  (seed, sprout, plant), a labelled drawing, at most four words to know, an everyday example, a
  try-it-now activity, one "did you know" fact, a chant to remember, doubts, a "circle the correct
  answer" quiz with exactly three options and a one-line why, and one to three checks.
- **The one-page sheet**: a title and subtitle, an icon per topic, 3 to 5 key points per topic, and
  a closing line. The board renders them as a poster pinned above the detailed notes: banner,
  learning outcomes, starting point, a learning ladder of step cards (icon, big idea, key points,
  chain; a card scrolls to its topic), key takeaways, remember, check your understanding, closing
  banner. The same sheet prints.
- **Depth**: notes are written per teaching depth (basis, developing, proficient, advanced, deep),
  chosen with the depth selector. The reading level stays the child's class at every depth; what
  changes is the demand: name and describe at basis, how and why at developing, apply and
  connect at proficient, compare and justify with a tempting wrong option at advanced, questions
  the page does not answer and small investigations at deep. Identity includes the depth, so each
  depth is prepared once and shared.

Live on the free lite model, page 3 at basis: two topics of 70 and 55 teaching words, sentences
averaging 11 to 12 words (longest 17), chains "Baby, Child, Grown Up" and "Breathe, Need Food,
Grow", drawings labelled "Baby Picture, Latest Picture" and "Plants, Animals, Humans", the chant
"Eat, sleep, grow tall!", a quiz and a fun fact, in about 30 s. The developing depth added "why"
doubts and steps but its checks were still recall-level; the lite model differentiates depth
weakly, which the educator review must judge.

## What the notes contain

For one page, in one language, written as a caring, expert teacher speaking to the child:

- **Overview**: what this page is about, why it matters to the child, what they will be able to
  do after reading; **objectives** (the page's learning outcomes when it has them).
- **Topics**, in the page's own order, each with:
  - an **explanation in the teacher's own words**, at least three paragraphs and 120 words: what
    it is with a concrete picture, how and why it works step by step, and how it connects to
    what the child already knows and to the next idea;
  - **words to know**: every new term defined in a child's words, with a small example;
  - **from everyday life**: one real-life example from an Indian child's world and why it shows
    the idea; **to remember**: one tip;
  - **doubts children often have**, with answers; **check yourself** questions with answers;
  - **questions readers asked**: every question asked under the topic, with its answer, saved for
    everyone who reads the page after; marked when the answer goes beyond the page.
- **In short**: the summary in the page's key words.

## Rules the validator enforces

- Every source block is explained by a topic (cited by id) or listed as omitted with a reason;
  only page numbers, unit or chapter banners, running headers and decorative labels may be
  omitted, at most the larger of 3 and 30 percent of the blocks.
- **No copying**: any run of 14 or more consecutive words shared with the page rejects the notes
  ("explain in your own words instead"). Measured on explanations and everyday examples.
- Depth: three to eight paragraphs and at least 120 words per topic; one to six doubts; one to
  four check-yourself questions; three to ten summary points.
- Rejected notes go through up to two repair passes that carry the validator's reason; accepted
  notes then pass a source review by the model (factual support, nothing missing, child-suitable).
- Identity (`notes-v3` blueprint): page revision, language, model. Prepared once, served to all.
- Learned from the first whole-book run: a check answer may be one word, an omission naming a region
  already set aside for review is dropped, and an empty drawing list is allowed.

## How they are prepared and served

- `POST /api/v2/textbooks/:bookId/pages/:page/notes` and the `learning-materials` equivalent, body
  `{language}`: stored notes answer 200; an unread page answers 202 with a reading job; otherwise
  202 with a notes job on the durable queue (`GuruLessonJob` with `kind: "notes"`), polled at
  `GET /api/v2/guru/jobs/:id`. `?cachedOnly=1` never queues.
- `POST …/pages/:page/notes/questions` with `{language, topicId, question, learnerId?}`: the
  answer is grounded in the page and the topic notes, saved as a `GuruNotesExtension`, and the
  same question asked again by anyone is served from the saved answer with no model call.
- `POST …/notes/prepare` with `{language, from?, to?}`: queues every page of the book (pages
  already prepared are skipped) with one budget reservation; `GET …/notes/status?language=`
  reports ready pages and the latest job per page. The classroom's "Prepare notes for every page
  of this book" button uses it.
- The classroom's **Guru Notes** tab shows the notes; the **Print Notes** button prints the full
  notes for the open page; notes are stored in `GuruPageNotes` next to the book's evidence.
- Model role: notes are written by `GURU_NOTES_MODEL` when set (falling back to `GURU_MODEL`),
  including the page reading, so a cheaper or free model can prepare notes while lessons use
  another. Page reading uses structured output and normalises geometry and confidence from
  smaller vision models; a malformed transcription is never reused.

## Cost

A page's notes cost two to four model calls once (reading, writing, sometimes a repair, review).
A reader's new question costs one small call; a repeated question costs nothing. A whole
116-page book is roughly 350 calls, which the free tiers cover in a few days or a paid model in
an hour for a few dollars.

## Evidence

Live results and the first-pages walk-through are in docs/evaluation/guru-notes-2026-09-12.md.
Educator review of the notes against a rubric is still open, as for lessons.
