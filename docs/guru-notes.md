# Guru Notes: a teacher's study notes for every page

Owner's brief (12 September 2026): most parents cannot explain a lesson to their child. When a
book is given to Guru, it should prepare notes with a detailed explanation, topic by topic, the
way a teacher or professor would explain the lesson, not a copy of the book. A child should be
able to read and understand them, ask a question about a topic and see the explanation extended,
print them, and find them saved with the book whenever they want. This is the first product
surface of the Teacher Engine plan (docs/teacher-engine-plan.md); the live classroom reads from
the same prepared material later.

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
- Identity (`notes-v2` blueprint): page revision, language, model. Prepared once, served to all.

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
