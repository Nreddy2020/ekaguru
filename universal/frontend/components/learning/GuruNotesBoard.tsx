"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ApprovedClassroom.module.css";
import { GuruScene } from "./GuruScene";
import { GuruVoiceOrb } from "./GuruVoiceOrb";
import { describeGuruStage } from "../../lib/learning/guru-api";
import {
  BookAudience,
  GuruNotesView,
  LadderLevel,
  NotesExtension,
  NotesTopic,
  TopicLadderEntry,
  askNotesQuestion,
  bookNotesStatus,
  loadGuruNotes,
  prepareBookNotes,
  requestTopicLadder,
} from "../../lib/learning/guru-notes-api";
import { OrbState, speak, voiceSupported } from "../../lib/learning/guru-voice";
import type { PageEvidence } from "../../lib/learning/page-lesson-runtime";
import type { TeachingDepth } from "../../lib/learning/teaching-package.types";

const API_BASE = () => process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:20000";
const DEPTH_TITLES: Record<TeachingDepth, string> = {
  basis: "Basis · start here",
  developing: "Developing · build understanding",
  proficient: "Proficient · apply and connect",
  advanced: "Advanced · analyse and reason",
  deep: "Deep · research and explore",
};
const scrollToTopic = (id: string) => document.getElementById("notes-topic-" + id)?.scrollIntoView?.({ behavior: "smooth", block: "start" });

/** The one-page visual sheet: banner, outcomes, starting point, learning ladder, takeaways, remember, check, closing line. */
function NotesPoster({ view, page, onHighlight }: { view: GuruNotesView; page: PageEvidence; onHighlight?: (ids: string[]) => void }) {
  const notes = view.notes;
  if (!notes.topics.some((t) => t.keyPoints?.length)) return null;
  const first = notes.topics[0];
  const pictures = (page.blocks || []).filter((b) => b.type === "figure" || b.type === "table").map((b) => b.blockId);
  const banner = pictures.length ? cropStyle(page, pictures) : null;
  const isProf = view.blueprint === "notes-prof-v1" || view.targetAudience === "it_professional" || view.targetAudience === "manager" || view.targetAudience === "competitive_exam";
  const isAcad = view.blueprint === "notes-acad-v1" || view.targetAudience === "professor" || view.targetAudience === "college_student";
  return (
    <section className={styles.poster} data-testid="notes-poster" aria-label="One-page sheet">
      <header className={styles.posterBanner}>
        <div className={styles.posterIcons} aria-hidden="true">
          {notes.topics.map((t) => (
            <span key={t.id}>{t.icon || "📘"}</span>
          ))}
        </div>
        <div>
          <p className={styles.posterUnit}>
            Page {view.physicalPage}
            {isProf && <span className={styles.editionBadge} data-edition="professional" data-testid="poster-edition-badge">Professional Edition</span>}
            {isAcad && <span className={styles.editionBadge} data-edition="academic" data-testid="poster-edition-badge">Academic Edition</span>}
          </p>
          <h3>{notes.title}</h3>
          {notes.subtitle && <p className={styles.posterSubtitle}>{notes.subtitle}</p>}
        </div>
        {banner && !banner.whole && (
          <div role="img" aria-label="A picture from your textbook" className={styles.posterPicture} style={banner.style} onClick={() => onHighlight?.(pictures)} />
        )}
      </header>
      <div className={styles.posterRow}>
        <div className={styles.posterCard} data-tone="blue">
          <h4>🎯 Learning outcomes</h4>
          <p>After this page, you will be able to:</p>
          <ul>
            {notes.objectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
        <div className={styles.posterCard} data-tone="yellow">
          <h4>💡 Starting point</h4>
          <p>{first.hook || notes.overview}</p>
          {first.lookAt && <p className={styles.posterSmall}>{first.lookAt}</p>}
        </div>
      </div>
      <div className={styles.posterLadderHeader}>
        <h4>📊 Learning ladder</h4>
        <p>Let's climb the ladder and learn step by step.</p>
      </div>
      <ol className={styles.posterLadder}>
        {notes.topics.map((t, i) => (
          <li key={t.id} data-tone={["pink", "blue", "green", "orange", "purple", "teal"][i % 6]}>
            <button type="button" onClick={() => scrollToTopic(t.id)} aria-label={"Step " + (i + 1) + ": " + t.heading + ". Read more"}>
              <span className={styles.posterStep}>Step {i + 1}</span>
              <span className={styles.posterStepIcon} aria-hidden="true">
                {t.icon || "📘"}
              </span>
              <strong>{t.heading}</strong>
              {t.bigIdea && <em>{t.bigIdea}</em>}
              <ul>
                {(t.keyPoints || []).map((k, j) => (
                  <li key={j}>{k}</li>
                ))}
              </ul>
              {t.chain && t.chain.length > 0 && <span className={styles.posterChain}>{t.chain.map((c) => c.emoji + " " + c.label).join(" → ")}</span>}
            </button>
          </li>
        ))}
      </ol>
      <div className={styles.posterRow} data-columns="3">
        <div className={styles.posterCard} data-tone="blue">
          <h4>✅ Key takeaways</h4>
          <ul>
            {notes.summary.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className={styles.posterCard} data-tone="red">
          <h4>🧠 Remember</h4>
          <ul>
            {notes.topics.map((t) => (
              <li key={t.id}>{t.rememberTip}</li>
            ))}
          </ul>
        </div>
        <div className={styles.posterCard} data-tone="green">
          <h4>❓ Check your understanding</h4>
          <ol>
            {notes.topics.flatMap((t) => [t.quiz?.question, ...t.checkYourself.map((c) => c.question)].filter((q): q is string => Boolean(q))).slice(0, 6).map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </div>
      </div>
      {notes.closingLine && (
        <footer className={styles.posterClosing}>
          <span aria-hidden="true">🌱</span>
          <p>{notes.closingLine}</p>
          <span aria-hidden="true">🌍</span>
        </footer>
      )}
    </section>
  );
}

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
  depth = "basis",
  audience,
  learnerId,
  onLoaded,
  onHighlight,
  onSwitchToLive,
  onSelectPage,
}: {
  page: PageEvidence;
  language: string;
  depth?: TeachingDepth;
  audience?: BookAudience;
  learnerId?: string;
  onLoaded?: (view: GuruNotesView | null) => void;
  onHighlight?: (ids: string[]) => void;
  onSwitchToLive?: () => void;
  onSelectPage?: (page: number) => void;
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
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [bookNote, setBookNote] = useState("");
  const [busyLadder, setBusyLadder] = useState<{ topicId: string; level: LadderLevel } | null>(null);
  const [ladderError, setLadderError] = useState<Record<string, string>>({});
  const [activeLadder, setActiveLadder] = useState<Record<string, LadderLevel>>({});
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
    loadGuruNotes(page, language, depth, controller.signal, (s) => {
      if (live) setStage(s);
    }, audience)
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
  }, [page.bookId, page.physicalPage, page.sourceHash, language, depth, audience, retry]);

  const stopReading = () => {
    readQueue.current = [];
    voice.current?.cancel();
    voice.current = null;
    setReading(null);
    setOrb("idle");
  };
  useEffect(() => () => stopReading(), []);

  const spokenText = (topic: NotesTopic) =>
    [
      topic.heading,
      topic.hook || "",
      topic.bigIdea ? "The big idea: " + topic.bigIdea : "",
      ...topic.explanation,
      ...(topic.steps?.length ? ["Step by step. " + topic.steps.map((st, i) => "Step " + (i + 1) + ": " + st).join(" ")] : []),
      "From everyday life. " + topic.example.situation + " " + topic.example.explanation,
      topic.didYouKnow ? "Did you know? " + topic.didYouKnow : "",
      "To remember: " + topic.rememberTip,
    ]
      .filter(Boolean)
      .join(" ");
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
      const result = await askNotesQuestion(page, language, depth, topicId, question, learnerId);
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

  const requestLadder = async (topicId: string, level: LadderLevel) => {
    if (!view) return;
    if (activeLadder[topicId] === level) {
      setActiveLadder((m) => {
        const copy = { ...m };
        delete copy[topicId];
        return copy;
      });
      return;
    }
    setActiveLadder((m) => ({ ...m, [topicId]: level }));

    const topic = view.notes.topics.find((t) => t.id === topicId);
    if (topic?.ladder?.some((l) => l.level === level)) {
      return;
    }

    setBusyLadder({ topicId, level });
    setLadderError((m) => ({ ...m, [topicId + ":" + level]: "" }));
    try {
      const result = await requestTopicLadder(page, language, depth, topicId, level, learnerId);
      setView((v) => {
        if (!v) return v;
        const newTopics = v.notes.topics.map((t) => {
          if (t.id !== topicId) return t;
          const existingLadder = t.ladder || [];
          const updated = existingLadder.some((l) => l.level === level)
            ? existingLadder
            : [...existingLadder, { level: result.level, label: result.label, explanation: result.explanation }];
          return { ...t, ladder: updated };
        });
        return { ...v, notes: { ...v.notes, topics: newTopics } };
      });
    } catch (e: any) {
      setLadderError((m) => ({ ...m, [topicId + ":" + level]: e.message }));
    } finally {
      setBusyLadder(null);
    }
  };

  const prepareBook = async () => {
    setBookNote("Queuing every page of this book…");
    try {
      const result = await prepareBookNotes(page.bookId, language, depth);
      const status = await bookNotesStatus(page.bookId, language, depth);
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
            <p>
              EKAGURU Board · Page {page.physicalPage} · {DEPTH_TITLES[depth]}
            </p>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={styles.notesLabel}>Today's page</span>
                {(view?.blueprint === "notes-prof-v1" || view?.targetAudience === "it_professional" || view?.targetAudience === "manager" || view?.targetAudience === "competitive_exam") ? (
                  <span className={styles.editionBadge} data-edition="professional" data-testid="edition-badge">Professional Edition</span>
                ) : (view?.blueprint === "notes-acad-v1" || view?.targetAudience === "professor" || view?.targetAudience === "college_student") ? (
                  <span className={styles.editionBadge} data-edition="academic" data-testid="edition-badge">Academic Edition</span>
                ) : null}
              </div>
              <h3>{notes.title}</h3>
              <p>{notes.overview}</p>
              <p className={styles.notesLabel}>After reading this, you will be able to</p>
              <ul>
                {notes.objectives.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </section>
            <NotesPoster view={view} page={page} onHighlight={onHighlight} />
            {notes.topics.some((t) => t.keyPoints?.length) && (
              <p className={styles.notesLabel} data-testid="notes-read-more">
                Read more, topic by topic
              </p>
            )}
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
                {topic.guruRemembers && (
                  <aside className={styles.guruRemembers} data-testid="guru-remembers">
                    <span className={styles.guruRemembersIcon} aria-hidden="true">🧠</span>
                    <div className={styles.guruRemembersBody}>
                      <span className={styles.notesLabel}>Guru remembers</span>
                      <p>{topic.guruRemembers}</p>
                    </div>
                  </aside>
                )}
                {(Boolean(topic.buildsOn?.length) || Boolean(topic.leadsTo?.length)) && (
                  <nav aria-label="Cross-page concept links" className={styles.crossPageLinks} data-testid="cross-page-links">
                    {topic.buildsOn && topic.buildsOn.length > 0 && (
                      <div className={styles.crossPageGroup}>
                        <span className={styles.notesLabel}>Builds on:</span>
                        <div className={styles.crossPageBadges}>
                          {topic.buildsOn.map((link) => (
                            <button
                              key={link.topicId}
                              type="button"
                              onClick={() => onSelectPage?.(link.page)}
                              className={styles.crossPageBadge}
                              data-strength={link.strength || "essential"}
                              title={link.reason}
                            >
                              ← {link.heading} (Page {link.page})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {topic.leadsTo && topic.leadsTo.length > 0 && (
                      <div className={styles.crossPageGroup}>
                        <span className={styles.notesLabel}>Leads to:</span>
                        <div className={styles.crossPageBadges}>
                          {topic.leadsTo.map((link) => (
                            <button
                              key={link.topicId}
                              type="button"
                              onClick={() => onSelectPage?.(link.page)}
                              className={styles.crossPageBadge}
                              data-strength={link.strength || "supporting"}
                              title={link.reason}
                            >
                              → {link.heading} (Page {link.page})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </nav>
                )}
                {topic.hook && (
                  <p className={styles.notesHook} data-testid="notes-hook">
                    {topic.hook}
                  </p>
                )}
                {topic.bigIdea && (
                  <p className={styles.notesBigIdea} data-testid="notes-big-idea">
                    <span className={styles.notesLabel}>The big idea</span>
                    {topic.bigIdea}
                  </p>
                )}
                <div className={styles.notesTopicGrid}>
                  <PageCrop page={page} topic={topic} onHighlight={onHighlight} />
                  <div className={styles.notesExplanation}>
                    {topic.explanation.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
                {/* Step 4: "Explain it like I am..." ladder */}
                <div className={styles.notesLadderSection} data-testid="notes-ladder-section">
                  <div className={styles.notesLadderHeader}>
                    <span className={styles.notesLabel}>Explain it like I am…</span>
                    <div className={styles.notesLadderButtons}>
                      {(["younger", "analogy", "expert"] as LadderLevel[]).map((lvl) => {
                        const isSelected = activeLadder[topic.id] === lvl;
                        const isBusy = busyLadder?.topicId === topic.id && busyLadder?.level === lvl;
                        const hasRung = topic.ladder?.some((l) => l.level === lvl);
                        const label =
                          lvl === "younger"
                            ? "🧸 Younger (6-8 yrs)"
                            : lvl === "analogy"
                            ? "💡 Another analogy"
                            : "🔬 Expert depth";
                        return (
                          <button
                            key={lvl}
                            type="button"
                            className={styles.notesLadderBtn}
                            data-active={isSelected ? "true" : undefined}
                            data-testid={`notes-ladder-btn-${lvl}`}
                            disabled={isBusy}
                            onClick={() => void requestLadder(topic.id, lvl)}
                          >
                            {isBusy ? "Guru is explaining…" : label}
                            {hasRung && <span className={styles.notesLadderBadge} aria-hidden="true"> ✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {ladderError[topic.id + ":" + activeLadder[topic.id]] && (
                    <p role="alert" className={styles.notesAnswer}>
                      {ladderError[topic.id + ":" + activeLadder[topic.id]]}
                    </p>
                  )}
                  {activeLadder[topic.id] && (() => {
                    const rung = topic.ladder?.find((l) => l.level === activeLadder[topic.id]);
                    if (!rung) return null;
                    return (
                      <div className={styles.notesLadderCard} data-testid="notes-ladder-card" data-level={rung.level}>
                        <div className={styles.notesLadderCardHeader}>
                          <span className={styles.notesLadderCardTag}>
                            {rung.level === "younger" ? "🧸 Cheerful & Simple" : rung.level === "analogy" ? "💡 Fresh Analogy" : "🔬 Advanced Science"}
                          </span>
                          <strong>{rung.label}</strong>
                        </div>
                        <p className={styles.notesLadderExplanation}>{rung.explanation}</p>
                      </div>
                    );
                  })()}
                </div>
                {topic.chain && topic.chain.length > 0 && (
                  <ol className={styles.notesChain} data-testid="notes-chain" aria-label="Picture chain">
                    {topic.chain.map((link, i) => (
                      <li key={i}>
                        <span className={styles.notesChainEmoji} aria-hidden="true">
                          {link.emoji}
                        </span>
                        <span>{link.label}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {topic.steps && topic.steps.length > 0 && (
                  <div className={styles.notesSteps} data-testid="notes-steps">
                    <span className={styles.notesLabel}>Step by step</span>
                    <ol>
                      {topic.steps.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ol>
                  </div>
                )}
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
                {topic.didYouKnow && (
                  <p className={styles.notesFact} data-testid="notes-did-you-know">
                    <span className={styles.notesLabel}>Did you know?</span>
                    {topic.didYouKnow}
                  </p>
                )}
                <p className={styles.notesTip}>
                  <strong>To remember:</strong> {topic.rememberTip}
                </p>
                {topic.quiz && (
                  <div className={styles.notesQuiz} data-testid="notes-quiz">
                    <span className={styles.notesLabel}>Circle the correct answer</span>
                    <p>{topic.quiz.question}</p>
                    <div className={styles.notesQuizOptions}>
                      {topic.quiz.options.map((option, i) => {
                        const chosen = picked[topic.id];
                        const state = chosen === undefined ? "" : i === topic.quiz!.answerIndex ? "right" : i === chosen ? "wrong" : "";
                        return (
                          <button
                            key={i}
                            type="button"
                            data-state={state}
                            disabled={chosen !== undefined}
                            onClick={() => setPicked((m) => ({ ...m, [topic.id]: i }))}
                          >
                            {["A", "B", "C"][i]}. {option}
                          </button>
                        );
                      })}
                    </div>
                    {picked[topic.id] !== undefined && (
                      <p role="status" data-testid="quiz-result">
                        {picked[topic.id] === topic.quiz.answerIndex ? "Correct! " : "Not quite. The answer is " + ["A", "B", "C"][topic.quiz.answerIndex] + ". "}
                        {topic.quiz.why}
                      </p>
                    )}
                  </div>
                )}
                {topic.professional && (
                  <div data-testid="notes-professional-section">
                    {topic.professional.problemSolved && (
                      <div className={styles.profCard} data-testid="prof-problem-solved">
                        <span className={styles.notesLabel}>Problem solved in production</span>
                        <p>{topic.professional.problemSolved}</p>
                      </div>
                    )}
                    {topic.professional.architecture && (
                      <div className={styles.profCard} data-testid="prof-architecture">
                        <span className={styles.notesLabel}>Architecture & Data Flow</span>
                        <p><strong>Data Flow:</strong> {topic.professional.architecture.dataFlow}</p>
                        <ul className={styles.profComponentList}>
                          {topic.professional.architecture.components.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {topic.professional.implementation && (
                      <div className={styles.profCard} data-testid="prof-implementation">
                        <div className={styles.codeHeader}>
                          <span className={styles.notesLabel}>Implementation</span>
                          <span className={styles.codeLang}>{topic.professional.implementation.languageOrTool}</span>
                        </div>
                        <pre className={styles.codeBlock}>
                          <code>{topic.professional.implementation.codeSnippet}</code>
                        </pre>
                        <p className="mt-2 text-sm text-slate-300">{topic.professional.implementation.explanation}</p>
                      </div>
                    )}
                    {topic.professional.commands && topic.professional.commands.length > 0 && (
                      <div className={styles.profCard} data-testid="prof-commands">
                        <span className={styles.notesLabel}>Essential Commands</span>
                        <div className="space-y-2 mt-2">
                          {topic.professional.commands.map((cmd, i) => (
                            <div key={i} className={styles.commandItem}>
                              <code className={styles.inlineCode}>{cmd.command}</code>
                              <p className="text-sm text-slate-300">{cmd.description}</p>
                              {cmd.output && (
                                <pre className={styles.commandOutput}><code>{cmd.output}</code></pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {topic.professional.troubleshooting && topic.professional.troubleshooting.length > 0 && (
                      <div className={styles.profCard} data-testid="prof-troubleshooting">
                        <span className={styles.notesLabel}>Troubleshooting Guide</span>
                        <div className={styles.troubleshootTable}>
                          {topic.professional.troubleshooting.map((tr, i) => (
                            <div key={i} className={styles.troubleshootRow}>
                              <div><strong>Symptom:</strong> {tr.symptom}</div>
                              <div><strong>Cause:</strong> {tr.cause}</div>
                              <div className="text-emerald-300"><strong>Fix:</strong> {tr.fix}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {topic.professional.scenarios && topic.professional.scenarios.length > 0 && (
                      <div className={styles.profCard} data-testid="prof-scenarios">
                        <span className={styles.notesLabel}>Production Scenarios</span>
                        {topic.professional.scenarios.map((sc, i) => (
                          <details key={i} className={styles.scenarioDetails}>
                            <summary><strong>Scenario:</strong> {sc.title}</summary>
                            <p className="mt-1 text-sm text-slate-300"><strong>Context:</strong> {sc.context}</p>
                            <p className="mt-1 text-sm text-emerald-300"><strong>Solution:</strong> {sc.solution}</p>
                          </details>
                        ))}
                      </div>
                    )}
                    {topic.professional.labs && topic.professional.labs.length > 0 && (
                      <div className={styles.profCard} data-testid="prof-labs">
                        <span className={styles.notesLabel}>Hands-on Lab</span>
                        {topic.professional.labs.map((lab, i) => (
                          <div key={i} className="mt-2">
                            <p><strong>{lab.title}</strong> &mdash; {lab.objective}</p>
                            <ol className="list-decimal pl-5 mt-1 space-y-1 text-sm text-slate-300">
                              {lab.steps.map((st, j) => <li key={j}>{st}</li>)}
                            </ol>
                            <p className="mt-1 text-xs text-amber-200"><strong>Verification:</strong> {lab.verification}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {topic.professional.interviewQuestions && topic.professional.interviewQuestions.length > 0 && (
                      <div className={styles.profCard} data-testid="prof-interview-questions">
                        <span className={styles.notesLabel}>Technical Interview Questions</span>
                        {topic.professional.interviewQuestions.map((iq, i) => (
                          <details key={i} className={styles.scenarioDetails}>
                            <summary>
                              <span className={styles.diffBadge} data-diff={iq.difficulty}>{iq.difficulty}</span>
                              {" "}{iq.question}
                            </summary>
                            <p className="mt-1 text-sm text-emerald-300"><strong>Expected Answer:</strong> {iq.expectedAnswer}</p>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {topic.professor && (
                  <div data-testid="notes-professor-section">
                    {topic.professor.foundations && (
                      <div className={styles.acadCard} data-testid="acad-foundations">
                        <span className={styles.notesLabel}>Theoretical Foundations</span>
                        <p>{topic.professor.foundations.theoreticalBasis}</p>
                        {topic.professor.foundations.formalDefinitions.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs uppercase tracking-wider text-slate-400">Formal Definitions:</span>
                            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-slate-200">
                              {topic.professor.foundations.formalDefinitions.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {topic.professor.researchPerspective && (
                      <div className={styles.acadCard} data-testid="acad-research">
                        <span className={styles.notesLabel}>Research Perspective & Debates</span>
                        <p className="text-sm text-slate-300"><strong>Historical Context:</strong> {topic.professor.researchPerspective.historicalContext}</p>
                        <p className="mt-1 text-sm text-slate-300"><strong>Current Debates:</strong> {topic.professor.researchPerspective.currentDebates}</p>
                        {topic.professor.researchPerspective.openProblems.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs uppercase tracking-wider text-amber-300">Open Problems:</span>
                            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-slate-200">
                              {topic.professor.researchPerspective.openProblems.map((op, i) => <li key={i}>{op}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {topic.professor.caseStudies && topic.professor.caseStudies.length > 0 && (
                      <div className={styles.acadCard} data-testid="acad-case-studies">
                        <span className={styles.notesLabel}>Scholarly Case Studies</span>
                        {topic.professor.caseStudies.map((cs, i) => (
                          <div key={i} className="mt-2 p-2 rounded bg-slate-900/60 border border-slate-700">
                            <strong>{cs.title}</strong>
                            <p className="text-sm text-slate-300 mt-1"><strong>Methodology:</strong> {cs.methodology}</p>
                            <p className="text-sm text-slate-300 mt-1"><strong>Findings:</strong> {cs.findings}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {topic.professor.limitations && (
                      <div className={styles.acadCard} data-testid="acad-limitations">
                        <span className={styles.notesLabel}>Limitations & Boundary Conditions</span>
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-slate-200">
                          {topic.professor.limitations.boundaryConditions.map((b, i) => <li key={i}>{b}</li>)}
                          {topic.professor.limitations.critiques.map((c, i) => <li key={i}><em>Critique:</em> {c}</li>)}
                        </ul>
                      </div>
                    )}
                    {topic.professor.references && topic.professor.references.length > 0 && (
                      <div className={styles.acadCard} data-testid="acad-references">
                        <span className={styles.notesLabel}>References & Key Literature</span>
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-xs text-slate-300 font-mono">
                          {topic.professor.references.map((ref, i) => (
                            <li key={i}>{ref.citation} &mdash; <span className="text-slate-400 font-sans">{ref.relevance}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {topic.commonDoubts.length > 0 && (
                  <div>
                    <span className={styles.notesLabel}>{topic.professional || topic.professor ? "Common Doubts & Edge Cases" : "Doubts children often have"}</span>
                    {topic.commonDoubts.map((d, i) => (
                      <details key={i}>
                        <summary>{d.question}</summary>
                        <p>{d.answer}</p>
                      </details>
                    ))}
                  </div>
                )}
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
      {notes.subtitle && (
        <p>
          <em>{notes.subtitle}</em>
        </p>
      )}
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
          {topic.keyPoints && topic.keyPoints.length > 0 && (
            <ul>
              {topic.keyPoints.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          )}
          {topic.hook && <p>{topic.hook}</p>}
          {topic.bigIdea && (
            <p>
              <strong>The big idea:</strong> {topic.bigIdea}
            </p>
          )}
          {topic.explanation.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {topic.chain && topic.chain.length > 0 && <p>{topic.chain.map((c) => c.emoji + " " + c.label).join("  →  ")}</p>}
          {topic.steps && topic.steps.length > 0 && (
            <>
              <h3>Step by step</h3>
              <ol>
                {topic.steps.map((st, i) => (
                  <li key={i}>{st}</li>
                ))}
              </ol>
            </>
          )}
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
          {topic.didYouKnow && (
            <p>
              <strong>Did you know?</strong> {topic.didYouKnow}
            </p>
          )}
          <p>
            <strong>To remember:</strong> {topic.rememberTip}
          </p>
          {topic.quiz && (
            <p>
              <strong>Circle the correct answer:</strong> {topic.quiz.question} {topic.quiz.options.map((o, i) => ["A", "B", "C"][i] + ". " + o).join("  ")}{" "}
              <em>(Answer: {["A", "B", "C"][topic.quiz.answerIndex]})</em>
            </p>
          )}
          {topic.professional && (
            <>
              <h3>Professional Reference & Implementation</h3>
              <p><strong>Problem Solved:</strong> {topic.professional.problemSolved}</p>
              <p><strong>Architecture:</strong> {topic.professional.architecture.dataFlow}</p>
              <h4>Commands</h4>
              <ul>
                {topic.professional.commands.map((cmd, i) => (
                  <li key={i}><code>{cmd.command}</code>: {cmd.description}</li>
                ))}
              </ul>
              <h4>Troubleshooting</h4>
              <ul>
                {topic.professional.troubleshooting.map((tr, i) => (
                  <li key={i}><strong>{tr.symptom}:</strong> {tr.fix}</li>
                ))}
              </ul>
              <h4>Technical Interview Preparation</h4>
              <ul>
                {topic.professional.interviewQuestions.map((iq, i) => (
                  <li key={i}>[{iq.difficulty}] {iq.question} &mdash; <em>{iq.expectedAnswer}</em></li>
                ))}
              </ul>
            </>
          )}
          {topic.professor && (
            <>
              <h3>Theoretical Foundations & Research</h3>
              <p><strong>Basis:</strong> {topic.professor.foundations.theoreticalBasis}</p>
              <h4>Formal Definitions</h4>
              <ul>
                {topic.professor.foundations.formalDefinitions.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
              <h4>Case Studies</h4>
              <ul>
                {topic.professor.caseStudies.map((cs, i) => (
                  <li key={i}><strong>{cs.title}:</strong> {cs.findings}</li>
                ))}
              </ul>
              <h4>References</h4>
              <ul>
                {topic.professor.references.map((r, i) => (
                  <li key={i}>{r.citation} ({r.relevance})</li>
                ))}
              </ul>
            </>
          )}
          <h3>{topic.professional || topic.professor ? "Common Questions & Edge Cases" : "Doubts children often have"}</h3>
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
      {notes.closingLine && (
        <p>
          <strong>{notes.closingLine}</strong>
        </p>
      )}
    </div>
  );
}
