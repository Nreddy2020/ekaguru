"use client";
import React, { useEffect, useState } from "react";
import { describeGuruStage } from "../../lib/learning/guru-api";
import {
  GuruNotesView,
  NotesExtension,
  askNotesQuestion,
  bookNotesStatus,
  loadGuruNotes,
  prepareBookNotes,
} from "../../lib/learning/guru-notes-api";
import type { PageEvidence } from "../../lib/learning/page-lesson-runtime";

/**
 * The notes a teacher would write for this page, topic by topic: explanation in the teacher's own
 * words, words to know, an everyday example, a tip, the doubts children usually have, check-yourself
 * questions, and the questions readers have asked here before. Saved with the book; printable.
 */
export function GuruNotes({
  page,
  language,
  learnerId,
  onLoaded,
}: {
  page: PageEvidence;
  language: string;
  learnerId?: string;
  onLoaded?: (view: GuruNotesView | null) => void;
}) {
  const [view, setView] = useState<GuruNotesView | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [questions, setQuestions] = useState<Record<string, string>>({});
  const [busyTopic, setBusyTopic] = useState("");
  const [askError, setAskError] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [bookStatus, setBookStatus] = useState<{ readyCount: number; total?: number; note: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let live = true;
    setView(null);
    setError("");
    setStage("");
    setLoading(true);
    onLoaded?.(null);
    loadGuruNotes(page, language, controller.signal, (s) => {
      if (live) setStage(s);
    })
      .then((result) => {
        if (!live) return;
        setView(result);
        onLoaded?.(result);
      })
      .catch((e) => {
        if (live && e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.bookId, page.physicalPage, page.sourceHash, language, retry]);

  const ask = async (topicId: string) => {
    const question = (questions[topicId] || "").trim();
    if (!question || !view) return;
    setBusyTopic(topicId);
    setAskError((m) => ({ ...m, [topicId]: "" }));
    try {
      const result = await askNotesQuestion(page, language, topicId, question, learnerId);
      setView((v) =>
        v
          ? {
              ...v,
              extensions: v.extensions.some((e) => e.id === result.extension.id)
                ? v.extensions
                : [...v.extensions, result.extension],
            }
          : v,
      );
      setQuestions((q) => ({ ...q, [topicId]: "" }));
    } catch (e: any) {
      setAskError((m) => ({ ...m, [topicId]: e.message }));
    } finally {
      setBusyTopic("");
    }
  };

  const prepareBook = async () => {
    setBookStatus({ readyCount: 0, note: "Queuing every page of this book…" });
    try {
      const result = await prepareBookNotes(page.bookId, language);
      const status = await bookNotesStatus(page.bookId, language);
      setBookStatus({
        readyCount: status.readyCount,
        total: result.pagesTotal,
        note:
          status.readyCount + " of " + result.pagesTotal + " pages have notes; " + result.queued + " queued" +
          (result.reading ? ", " + result.reading + " being read for the first time" : "") +
          (result.failed.length ? "; " + result.failed.length + " could not be queued" : "") +
          ". Pages become ready one by one; reopen a page to see its notes.",
      });
    } catch (e: any) {
      setBookStatus({ readyCount: 0, note: e.message });
    }
  };

  if (loading)
    return (
      <p role="status" data-testid="notes-stage" className="text-sm">
        {stage ? describeGuruStage(stage) : "Guru is preparing the notes for page " + page.physicalPage + "…"} You can keep reading the page; the notes appear here when they are ready.
      </p>
    );
  if (error)
    return (
      <div role="alert" className="text-sm">
        <p>{error}</p>
        <button type="button" className="underline mt-2" onClick={() => setRetry((r) => r + 1)}>
          Try again
        </button>
      </div>
    );
  if (!view) return null;
  const notes = view.notes;
  const extensionsFor = (topicId: string): NotesExtension[] => view.extensions.filter((e) => e.topicId === topicId);
  return (
    <article data-testid="guru-notes" className="space-y-6 text-[15px] leading-relaxed" lang={language}>
      <header>
        <p className="text-xs uppercase tracking-wide opacity-70">Guru Notes · page {page.physicalPage}</p>
        <h3 className="text-xl font-bold mt-1">{notes.title}</h3>
        <p className="mt-2">{notes.overview}</p>
        <p className="mt-2 font-semibold">After reading this, you will be able to:</p>
        <ul className="list-disc pl-5">
          {notes.objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      </header>
      {notes.topics.map((topic, index) => (
        <section key={topic.id} data-testid="notes-topic" className="rounded-xl bg-black/10 p-4 space-y-3">
          <h4 className="text-lg font-bold">
            {index + 1}. {topic.heading}
          </h4>
          {topic.explanation.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
          {topic.keyTerms.length > 0 && (
            <div>
              <p className="font-semibold">Words to know</p>
              <dl className="mt-1 space-y-1">
                {topic.keyTerms.map((k) => (
                  <div key={k.term}>
                    <dt className="font-semibold inline">{k.term}: </dt>
                    <dd className="inline">
                      {k.meaning} <span className="opacity-80">For example, {k.example}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="rounded-lg bg-black/10 p-3">
            <p className="font-semibold">From everyday life</p>
            <p className="italic">{topic.example.situation}</p>
            <p>{topic.example.explanation}</p>
          </div>
          <p>
            <span className="font-semibold">To remember: </span>
            {topic.rememberTip}
          </p>
          <div>
            <p className="font-semibold">Doubts children often have</p>
            {topic.commonDoubts.map((d, i) => (
              <details key={i} className="mt-1">
                <summary className="cursor-pointer">{d.question}</summary>
                <p className="pl-4">{d.answer}</p>
              </details>
            ))}
          </div>
          <div>
            <p className="font-semibold">Check yourself</p>
            <ol className="list-decimal pl-5 space-y-1">
              {topic.checkYourself.map((c, i) => {
                const key = topic.id + ":" + i;
                return (
                  <li key={i}>
                    {c.question}{" "}
                    {revealed[key] ? (
                      <span data-testid="check-answer" className="block pl-2 opacity-90">
                        Answer: {c.answer}
                      </span>
                    ) : (
                      <button type="button" className="underline text-sm" onClick={() => setRevealed((r) => ({ ...r, [key]: true }))}>
                        Show answer
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          {extensionsFor(topic.id).length > 0 && (
            <div>
              <p className="font-semibold">Questions readers asked here</p>
              {extensionsFor(topic.id).map((e) => (
                <div key={e.id} data-testid="notes-extension" className="mt-2 border-l-2 border-sky-400 pl-3">
                  <p className="font-semibold">{e.question}</p>
                  <p>{e.answer}</p>
                  {e.beyondPage && <p className="text-xs opacity-80">This answer goes beyond what this page says.</p>}
                </div>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(topic.id);
            }}
            className="space-y-2"
          >
            <label className="block text-sm">
              Ask Guru about {topic.heading}
              <textarea
                aria-label={"Ask about " + topic.heading}
                value={questions[topic.id] || ""}
                onChange={(e) => setQuestions((q) => ({ ...q, [topic.id]: e.target.value }))}
                maxLength={1000}
                className="mt-1 block w-full rounded p-2 text-slate-900"
                rows={2}
              />
            </label>
            <button type="submit" disabled={busyTopic !== "" || !(questions[topic.id] || "").trim()} className="rounded bg-sky-700 px-3 py-1.5 text-sm">
              {busyTopic === topic.id ? "Guru is writing…" : "Ask Guru"}
            </button>
            {askError[topic.id] && (
              <p role="alert" className="text-xs">
                {askError[topic.id]}
              </p>
            )}
            <p className="text-xs opacity-80">The answer is added to these notes for everyone who reads this page.</p>
          </form>
        </section>
      ))}
      <section>
        <h4 className="text-lg font-bold">In short</h4>
        <ul className="list-disc pl-5">
          {notes.summary.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>
      <footer className="text-xs opacity-80 space-y-2">
        <p>These notes are saved with the book and can be printed with the Print Notes button.</p>
        <button type="button" className="underline" onClick={() => void prepareBook()}>
          Prepare notes for every page of this book
        </button>
        {bookStatus && (
          <p role="status" data-testid="book-notes-status">
            {bookStatus.note}
          </p>
        )}
      </footer>
    </article>
  );
}

/** Print-ready markup for the studio's print article. */
export function GuruNotesPrint({ view }: { view: GuruNotesView }) {
  const notes = view.notes;
  return (
    <div data-testid="guru-notes-print">
      <p>{notes.overview}</p>
      <p>
        <strong>After reading this, you will be able to:</strong>
      </p>
      <ul>
        {notes.objectives.map((o, i) => (
          <li key={i}>{o}</li>
        ))}
      </ul>
      {notes.topics.map((topic, index) => (
        <section key={topic.id}>
          <h2>
            {index + 1}. {topic.heading}
          </h2>
          {topic.explanation.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {topic.keyTerms.length > 0 && (
            <>
              <h3>Words to know</h3>
              <dl>
                {topic.keyTerms.map((k) => (
                  <div key={k.term}>
                    <dt>{k.term}</dt>
                    <dd>
                      {k.meaning} For example, {k.example}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          <h3>From everyday life</h3>
          <p>
            <em>{topic.example.situation}</em> {topic.example.explanation}
          </p>
          <p>
            <strong>To remember:</strong> {topic.rememberTip}
          </p>
          <h3>Doubts children often have</h3>
          {topic.commonDoubts.map((d, i) => (
            <p key={i}>
              <strong>{d.question}</strong> {d.answer}
            </p>
          ))}
          <h3>Check yourself</h3>
          <ol>
            {topic.checkYourself.map((c, i) => (
              <li key={i}>
                {c.question} <em>Answer: {c.answer}</em>
              </li>
            ))}
          </ol>
          {view.extensions.filter((e) => e.topicId === topic.id).length > 0 && (
            <>
              <h3>Questions readers asked</h3>
              {view.extensions
                .filter((e) => e.topicId === topic.id)
                .map((e) => (
                  <p key={e.id}>
                    <strong>{e.question}</strong> {e.answer}
                    {e.beyondPage ? " (Goes beyond this page.)" : ""}
                  </p>
                ))}
            </>
          )}
        </section>
      ))}
      <h2>In short</h2>
      <ul>
        {notes.summary.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
