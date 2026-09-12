"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ApprovedClassroom.module.css";
import { GuruScene } from "./GuruScene";
import { GuruVoiceOrb } from "./GuruVoiceOrb";
import { describeGuruStage } from "../../lib/learning/guru-api";
import {
  GuruNotesView,
  NotesExtension,
  NotesTopic,
  askNotesQuestion,
  bookNotesStatus,
  loadGuruNotes,
  prepareBookNotes,
} from "../../lib/learning/guru-notes-api";
import { OrbState, speak, voiceSupported } from "../../lib/learning/guru-voice";
import type { PageEvidence } from "../../lib/learning/page-lesson-runtime";

const API_BASE = () => process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:20000";

/**
 * The region of the scanned page a topic explains, cut out with pure CSS so it prints and needs
 * no canvas: the union of the cited blocks with a little padding; the whole page when the topic
 * spans most of it.
 */
export function cropStyle(page: PageEvidence, evidenceIds: string[]): { style: React.CSSProperties; whole: boolean } | null {
  const src = page.imageUrl ? (page.imageUrl.startsWith("/") ? API_BASE() + page.imageUrl : page.imageUrl) : page.imageDataUrl;
  if (!src || !page.width || !page.height) return null;
  const cited = (page.blocks || []).filter((b) => evidenceIds.includes(b.blockId));
  // The picture a child should look at: the topic's figures and tables when it has any, else everything it cites.
  const pictures = cited.filter((b) => b.type === "figure" || b.type === "table");
  const boxes = (pictures.length ? pictures : cited).map((b) => b.bbox);
  let x = 0;
  let y = 0;
  let w = page.width;
  let h = page.height;
  let whole = true;
  if (boxes.length) {
    const left = Math.min(...boxes.map((b) => b.x));
    const top = Math.min(...boxes.map((b) => b.y));
    const right = Math.max(...boxes.map((b) => b.x + b.width));
    const bottom = Math.max(...boxes.map((b) => b.y + b.height));
    const pad = Math.max(page.width, page.height) * 0.03;
    x = Math.max(0, left - pad);
    y = Math.max(0, top - pad);
    w = Math.min(page.width, right + pad) - x;
    h = Math.min(page.height, bottom + pad) - y;
    whole = (w * h) / (page.width * page.height) > 0.7;
    if (whole) {
      x = 0;
      y = 0;
      w = page.width;
      h = page.height;
    }
  }
  const sizeX = (page.width / w) * 100;
  const sizeY = (page.height / h) * 100;
  const posX = page.width === w ? 0 : (x / (page.width - w)) * 100;
  const posY = page.height === h ? 0 : (y / (page.height - h)) * 100;
  return {
    whole,
    style: {
      aspectRatio: w + " / " + h,
      backgroundImage: "url(" + JSON.stringify(src) + ")",
      backgroundSize: sizeX + "% " + sizeY + "%",
      backgroundPosition: posX + "% " + posY + "%",
      backgroundRepeat: "no-repeat",
    },
  };
}

function PageCrop({ page, topic, onHighlight }: { page: PageEvidence; topic: NotesTopic; onHighlight?: (ids: string[]) => void }) {
  const crop = useMemo(() => cropStyle(page, topic.evidenceIds), [page, topic.evidenceIds]);
  if (!crop) return null;
  return (
    <figure className={styles.notesFigure} data-testid="notes-page-crop">
      <div
        role="img"
        aria-label={(crop.whole ? "The whole page" : "The part of the page") + " for " + topic.heading}
        className={styles.notesCrop}
        style={crop.style}
        onClick={() => onHighlight?.(topic.evidenceIds)}
      />
      <figcaption>
        <span className={styles.notesLabel}>From your textbook</span>
        {topic.lookAt && <span> {topic.lookAt}</span>}
      </figcaption>
    </figure>
  );
}

/**
 * The Guru Notes board: the teacher's study notes for the open page, on the blackboard, with the
 * book's own pictures, a Guru drawing, a try-it-now activity, voice reading, and questions that
 * grow the notes for everyone. Replaces the live classroom as the default board.
 */
export function GuruNotesBoard({
  page,
  language,
  learnerId,
  onLoaded,
  onHighlight,
  onSwitchToLive,
}: {
  page: PageEvidence;
  language: string;
  learnerId?: string;
  onLoaded?: (view: GuruNotesView | null) => void;
  onHighlight?: (ids: string[]) => void;
  onSwitchToLive?: () => void;
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
  const [bookNote, setBookNote] = useState("");
  const [reading, setReading] = useState<{ topicId: string; text: string } | null>(null);
  const [orb, setOrb] = useState<OrbState>("idle");
  const [pulse, setPulse] = useState(0);
  const voice = useRef<{ cancel: () => void } | null>(null);
  const readQueue = useRef<NotesTopic[]>([]);

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

  const stopReading = () => {
    readQueue.current = [];
    voice.current?.cancel();
    voice.current = null;
    setReading(null);
    setOrb("idle");
  };
  useEffect(() => () => stopReading(), []);

  const spokenText = (topic: NotesTopic) =>
    [topic.heading, ...topic.explanation, "From everyday life. " + topic.example.situation + " " + topic.example.explanation, "To remember: " + topic.rememberTip].join(" ");
  const readNext = () => {
    const topic = readQueue.current.shift();
    if (!topic) {
      setReading(null);
      setOrb("idle");
      return;
    }
    const text = spokenText(topic);
    setReading({ topicId: topic.id, text });
    document.getElementById("notes-topic-" + topic.id)?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    voice.current = speak(text, {
      language,
      rate: 0.95,
      onStart: () => setOrb("speaking"),
      onBoundary: () => setPulse((n) => n + 1),
      onEnd: () => {
        voice.current = null;
        readNext();
      },
    });
  };
  const readTopic = (topic: NotesTopic) => {
    stopReading();
    readQueue.current = [topic];
    readNext();
  };
  const readAll = () => {
    if (!view) return;
    stopReading();
    readQueue.current = [...view.notes.topics];
    readNext();
  };

  const ask = async (topicId: string) => {
    const question = (questions[topicId] || "").trim();
    if (!question || !view) return;
    setBusyTopic(topicId);
    setAskError((m) => ({ ...m, [topicId]: "" }));
    try {
      const result = await askNotesQuestion(page, language, topicId, question, learnerId);
      setView((v) =>
        v ? { ...v, extensions: v.extensions.some((e) => e.id === result.extension.id) ? v.extensions : [...v.extensions, result.extension] } : v,
      );
      setQuestions((q) => ({ ...q, [topicId]: "" }));
    } catch (e: any) {
      setAskError((m) => ({ ...m, [topicId]: e.message }));
    } finally {
      setBusyTopic("");
    }
  };

  const prepareBook = async () => {
    setBookNote("Queuing every page of this book…");
    try {
      const result = await prepareBookNotes(page.bookId, language);
      const status = await bookNotesStatus(page.bookId, language);
      setBookNote(
        status.readyCount + " of " + result.pagesTotal + " pages have notes; " + result.queued + " queued" +
          (result.reading ? ", " + result.reading + " being read for the first time" : "") +
          (result.failed.length ? "; " + result.failed.length + " could not be queued" : "") +
          ". Pages become ready one by one.",
      );
    } catch (e: any) {
      setBookNote(e.message);
    }
  };

  const extensionsFor = (topicId: string): NotesExtension[] => (view?.extensions || []).filter((e) => e.topicId === topicId);
  const notes = view?.notes;
  return (
    <section className={styles.board} data-testid="guru-notes-board" lang={language}>
      <header className={styles.boardHeader}>
        <div className={styles.boardIdentity}>
          <span className="text-2xl" aria-hidden="true">
            📘
          </span>
          <div>
            <h2>GURU NOTES BOARD</h2>
            <p>EKAGURU Board · Page {page.physicalPage}</p>
          </div>
        </div>
        {notes && voiceSupported() && (
          <button type="button" onClick={reading ? stopReading : readAll}>
            {reading ? "Stop reading" : "Read the notes to me"}
          </button>
        )}
        {notes &&
          notes.topics.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={styles.notesChip}
              aria-current={reading?.topicId === t.id ? "true" : undefined}
              onClick={() => document.getElementById("notes-topic-" + t.id)?.scrollIntoView?.({ behavior: "smooth", block: "start" })}
            >
              {i + 1}. {t.heading}
            </button>
          ))}
        {onSwitchToLive && (
          <button type="button" onClick={onSwitchToLive} title="The live classroom is still being built; the notes board is the main way to learn a page.">
            Live classroom (beta)
          </button>
        )}
      </header>
      {reading && (
        <div className={styles.narration}>
          <div className={styles.voiceRow}>
            <GuruVoiceOrb state={orb} pulse={pulse} size={72} />
            <div className="min-w-0 flex-1">
              <div className={styles.narrationLabel}>
                <span>Guru reads</span>
                <span data-testid="orb-status" className="text-xs font-normal text-emerald-200">
                  {orb === "speaking" ? "Speaking…" : "Ready"}
                </span>
              </div>
              <p>{reading.text.slice(0, 280)}…</p>
            </div>
          </div>
        </div>
      )}
      <div className={styles.canvas}>
        {loading && (
          <div className={styles.welcome}>
            <span className="text-4xl" aria-hidden="true">
              📘
            </span>
            <h3>Guru is writing the notes for page {page.physicalPage}</h3>
            <p role="status" data-testid="notes-stage">
              {stage ? describeGuruStage(stage) : "Reading the page and preparing the notes…"} You can look at the page meanwhile; the notes appear here when ready.
            </p>
          </div>
        )}
        {error && (
          <div className={styles.welcome} role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setRetry((r) => r + 1)}>
              Try again
            </button>
          </div>
        )}
        {notes && (
          <article className={styles.notesBoard} data-testid="guru-notes">
            <section className={styles.notesOverview}>
              <span className={styles.notesLabel}>Today's page</span>
              <h3>{notes.title}</h3>
              <p>{notes.overview}</p>
              <p className={styles.notesLabel}>After reading this, you will be able to</p>
              <ul>
                {notes.objectives.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </section>
            {notes.topics.map((topic, index) => (
              <section key={topic.id} id={"notes-topic-" + topic.id} data-testid="notes-topic" className={styles.notesTopic}>
                <h4>
                  {index + 1}. {topic.heading}
                  {voiceSupported() && (
                    <button type="button" className={styles.notesReadButton} onClick={() => (reading?.topicId === topic.id ? stopReading() : readTopic(topic))}>
                      {reading?.topicId === topic.id ? "Stop" : "Read this to me"}
                    </button>
                  )}
                </h4>
                <div className={styles.notesTopicGrid}>
                  <PageCrop page={page} topic={topic} onHighlight={onHighlight} />
                  <div className={styles.notesExplanation}>
                    {topic.explanation.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
                {topic.diagram && topic.diagram.length > 0 && (
                  <figure className={styles.notesDiagram} data-testid="notes-diagram">
                    <GuruScene scene={topic.diagram as any} progress={1} />
                    <figcaption>
                      <span className={styles.notesLabel}>Guru's drawing</span>
                    </figcaption>
                  </figure>
                )}
                <div className={styles.notesTopicGrid}>
                  {topic.keyTerms.length > 0 && (
                    <div>
                      <span className={styles.notesLabel}>Words to know</span>
                      <dl>
                        {topic.keyTerms.map((k) => (
                          <div key={k.term}>
                            <dt>{k.term}</dt>
                            <dd>
                              {k.meaning} <em>For example, {k.example}</em>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                  <div className={styles.notesExample}>
                    <span className={styles.notesLabel}>From everyday life</span>
                    <p>
                      <em>{topic.example.situation}</em>
                    </p>
                    <p>{topic.example.explanation}</p>
                  </div>
                </div>
                {topic.tryNow && (
                  <div className={styles.notesTryNow} data-testid="notes-try-now">
                    <span className={styles.notesLabel}>Try this now</span>
                    <p>
                      <strong>{topic.tryNow.title}</strong>
                    </p>
                    <ol>
                      {topic.tryNow.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                    <p>
                      <strong>What to notice:</strong> {topic.tryNow.whatToNotice}
                    </p>
                  </div>
                )}
                <p className={styles.notesTip}>
                  <strong>To remember:</strong> {topic.rememberTip}
                </p>
                <div>
                  <span className={styles.notesLabel}>Doubts children often have</span>
                  {topic.commonDoubts.map((d, i) => (
                    <details key={i}>
                      <summary>{d.question}</summary>
                      <p>{d.answer}</p>
                    </details>
                  ))}
                </div>
                <div>
                  <span className={styles.notesLabel}>Check yourself</span>
                  <ol>
                    {topic.checkYourself.map((c, i) => {
                      const key = topic.id + ":" + i;
                      return (
                        <li key={i}>
                          {c.question}{" "}
                          {revealed[key] ? (
                            <span data-testid="check-answer" className={styles.notesAnswer}>
                              Answer: {c.answer}
                            </span>
                          ) : (
                            <button type="button" className={styles.notesLink} onClick={() => setRevealed((r) => ({ ...r, [key]: true }))}>
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
                    <span className={styles.notesLabel}>Questions readers asked here</span>
                    {extensionsFor(topic.id).map((e) => (
                      <div key={e.id} data-testid="notes-extension" className={styles.notesAsked}>
                        <p>
                          <strong>{e.question}</strong>
                        </p>
                        <p>{e.answer}</p>
                        {e.beyondPage && <p className={styles.notesAnswer}>This answer goes beyond what this page says.</p>}
                      </div>
                    ))}
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void ask(topic.id);
                  }}
                  className={styles.notesAsk}
                >
                  <label>
                    Ask Guru about {topic.heading}
                    <textarea
                      aria-label={"Ask about " + topic.heading}
                      value={questions[topic.id] || ""}
                      onChange={(e) => setQuestions((q) => ({ ...q, [topic.id]: e.target.value }))}
                      maxLength={1000}
                      rows={2}
                    />
                  </label>
                  <button type="submit" disabled={busyTopic !== "" || !(questions[topic.id] || "").trim()}>
                    {busyTopic === topic.id ? "Guru is writing…" : "Ask Guru"}
                  </button>
                  {askError[topic.id] && (
                    <p role="alert" className={styles.notesAnswer}>
                      {askError[topic.id]}
                    </p>
                  )}
                  <p className={styles.notesAnswer}>The answer is added to these notes for everyone who reads this page.</p>
                </form>
              </section>
            ))}
            <section className={styles.notesOverview}>
              <span className={styles.notesLabel}>In short</span>
              <ul>
                {notes.summary.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <p className={styles.notesAnswer}>
                These notes are saved with the book. Print them with the Print Notes button.{" "}
                <button type="button" className={styles.notesLink} onClick={() => void prepareBook()}>
                  Prepare notes for every page of this book
                </button>
              </p>
              {bookNote && (
                <p role="status" data-testid="book-notes-status" className={styles.notesAnswer}>
                  {bookNote}
                </p>
              )}
            </section>
          </article>
        )}
      </div>
    </section>
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
          {topic.lookAt && (
            <p>
              <em>On the page: {topic.lookAt}</em>
            </p>
          )}
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
          {topic.tryNow && (
            <>
              <h3>Try this now: {topic.tryNow.title}</h3>
              <ol>
                {topic.tryNow.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <p>What to notice: {topic.tryNow.whatToNotice}</p>
            </>
          )}
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
