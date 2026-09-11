"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import styles from "./ApprovedClassroom.module.css";
import { GuruScene } from "./GuruScene";
import { GuruVoiceOrb } from "./GuruVoiceOrb";
import {
  OrbState,
  createRecognizer,
  recognitionSupported,
  speak,
  voiceSupported,
} from "../../lib/learning/guru-voice";
import {
  GuruSessionSnapshot,
  GuruEvent,
  describeMasteryOutcome,
  describeReview,
  describePhase,
} from "../../lib/learning/guru-api";
import {
  PageEvidence,
  PageLesson,
  RuntimeState,
  initialRuntime,
  transition,
  checkRecall,
} from "../../lib/learning/page-lesson-runtime";

export function PageTeachingBoard({
  page,
  lesson,
  onHighlight,
  session,
  onEvent,
  suspended = false,
}: {
  page: PageEvidence;
  lesson: PageLesson;
  onHighlight: (ids: string[]) => void;
  session?: GuruSessionSnapshot;
  suspended?: boolean;
  onEvent?: (
    kind: GuruEvent["kind"],
    answer?: string,
  ) => Promise<GuruSessionSnapshot>;
}) {
  const [state, setState] = useState<RuntimeState>({
    ...initialRuntime,
    index: session?.cursor || 0,
    feedback: session?.checkpointPassed ? "correct" : null,
  });
  const [started, setStarted] = useState(
    (session?.cursor || 0) > 0 || lesson.actions[0]?.kind === "ask",
  );
  useEffect(() => {
    if (suspended) setState((s) => ({ ...s, playing: false }));
  }, [suspended]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const liveRef = useRef(true);
  // A shared (ungraded) answer continues on its own once Guru has acknowledged it, like a teacher moving on.
  const continueAfterAck = useRef(false);
  useEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
    };
  }, []);
  const [serverFeedback, setServerFeedback] = useState("");
  const [masteryNote, setMasteryNote] = useState("");
  const [reviewNote, setReviewNote] = useState(describeReview(session?.review));
  const [saveError, setSaveError] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (window.matchMedia)
      setReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
  }, []);
  const [speed, setSpeed] = useState(1);
  // Voice-first: Guru speaks by default wherever the browser can; the toggle mutes.
  const [audio, setAudio] = useState(() => voiceSupported());
  const [voiceActive, setVoiceActive] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState("");
  const recognizerRef = useRef<ReturnType<typeof createRecognizer>>(null);
  const stopListening = () => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setMicActive(false);
  };
  const listenForAnswer = () => {
    if (micActive) {
      stopListening();
      return;
    }
    const recognizer = createRecognizer(lesson.language);
    if (!recognizer) {
      setMicError("This browser cannot hear you; please type your answer.");
      return;
    }
    setMicError("");
    recognizerRef.current = recognizer;
    setMicActive(true);
    const base = answer.trim();
    recognizer.start({
      onResult: (text) => setAnswer((base ? base + " " : "") + text),
      onEnd: () => {
        recognizerRef.current = null;
        setMicActive(false);
      },
      onError: (message) => setMicError(message === "not-allowed" ? "Microphone access was refused; please type your answer." : "Could not hear clearly; try again or type."),
    });
  };
  useEffect(() => () => stopListening(), []);
  const [answer, setAnswer] = useState("");
  const [reflection, setReflection] = useState("");
  const [progress, setProgress] = useState(0);
  const progressRef = useRef({ actionId: "", value: 0 });
  const action = lesson.actions[state.index];
  const drawing = lesson.actions
    .slice(0, state.index + 1)
    .reverse()
    .find((a) => a.kind === "draw");
  const remote = async (kind: GuruEvent["kind"], response?: string) => {
    if (!onEvent || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setSaveError("");
    try {
      const result = await onEvent(kind, response);
      if (!liveRef.current) return;
      if (kind === "restart") {
        setAnswer("");
        setReflection("");
        progressRef.current = { actionId: "", value: 0 };
        setProgress(0);
      }
      setServerFeedback(result.feedback || "");
      setMasteryNote(
        kind === "answer" ? describeMasteryOutcome(result.assessment) : "",
      );
      continueAfterAck.current =
        kind === "answer" && action.kind === "ask" && action.gating === false && result.cursor === state.index;
      if (kind === "next" || kind === "restart") setReviewNote(describeReview(result.review));
      setState((s) => ({
        ...s,
        index: result.cursor,
        feedback: result.checkpointPassed
          ? "correct"
          : kind === "answer"
            ? "retry"
            : null,
        // Moving on always teaches the next step aloud; going back or restarting waits for Play.
        playing:
          kind === "next"
            ? !["ask", "summary"].includes(lesson.actions[result.cursor].kind)
            : !["back", "restart"].includes(kind) &&
              s.playing &&
              !["ask", "summary"].includes(lesson.actions[result.cursor].kind),
      }));
    } catch (error: any) {
      setSaveError(error.message);
      setState((s) => ({ ...s, playing: false }));
    } finally {
      busyRef.current = false;
      if (liveRef.current) setBusy(false);
    }
  };
  const send = (event: Parameters<typeof transition>[1]) => {
    if (suspended) return;
    if (event === "play" || event === "next" || event === "back")
      setStarted(true);
    if (event === "restart") setStarted(false);
    if (onEvent && ["next", "back", "restart"].includes(event)) {
      void remote(event as GuruEvent["kind"]);
      return;
    }
    setState((s) => transition(s, event, lesson));
  };
  const orbState: OrbState = busy
    ? "thinking"
    : voiceActive
      ? "speaking"
      : micActive || (started && action.kind === "ask" && !state.playing)
        ? "listening"
        : "idle";
  const currentNotes = useMemo(
    () =>
      lesson.actions
        .slice(0, state.index + 1)
        .filter((a) => a.kind === "write"),
    [lesson, state.index],
  );
  useEffect(() => {
    setAnswer("");
    setReflection("");
    setProgress(0);
    onHighlight(action.evidenceIds);
  }, [action.id, lesson.id]);
  // One owner for narration, animation, and advancement. Cleanup invalidates callbacks on pause, navigation, and unmount.
  useEffect(() => {
    if (suspended) return;
    if (!state.playing) {
      if (action.kind !== "ask") return;
      const shouldContinue = continueAfterAck.current;
      let live = true;
      const moveOn = () => {
        if (!live || !continueAfterAck.current) return;
        continueAfterAck.current = false;
        send("next");
      };
      if (!audio || !("speechSynthesis" in window)) {
        if (!shouldContinue) return;
        const timer = setTimeout(moveOn, Math.max(1500, (serverFeedback || "").length * 35) / speed);
        return () => {
          live = false;
          clearTimeout(timer);
        };
      }
      const prompt =
        action.assessment && serverFeedback
          ? serverFeedback
          : state.feedback === "retry"
            ? "Let us revisit the source. " +
              page.blocks
                .filter((b) => action.evidenceIds.includes(b.blockId))
                .map((b) => b.text)
                .join(" ")
            : state.feedback === "correct"
              ? "Recall checked. " + action.prompt
              : action.speech;
      const handle = speak(prompt, {
        language: lesson.language,
        rate: (lesson.depth === "basis" ? 0.9 : 1) * speed,
        onStart: () => setVoiceActive(true),
        onBoundary: () => setPulse((n) => n + 1),
        onEnd: () => {
          setVoiceActive(false);
          if (shouldContinue) moveOn();
        },
      });
      return () => {
        live = false;
        handle.cancel();
        setVoiceActive(false);
      };
    }
    let live = true;
    let completed = false;
    let spoken = !audio;
    let drawn = false;
    const finish = () => {
      if (live && !completed && spoken && drawn) {
        completed = true;
        send("next");
      }
    };
    const duration =
      Math.max(
        1000,
        action.text.length * (lesson.depth === "basis" ? 38 : 23),
      ) / speed;
    const previousProgress =
      progressRef.current.actionId === action.id
        ? progressRef.current.value
        : 0;
    const started = Date.now() - previousProgress * duration;
    const interval = setInterval(() => {
      const next = Math.min(1, (Date.now() - started) / duration);
      progressRef.current = { actionId: action.id, value: next };
      setProgress(next);
      if (next === 1) {
        drawn = true;
        clearInterval(interval);
        finish();
      }
    }, 30);
    let speechTimer: ReturnType<typeof setTimeout> | undefined;
    let voice: { cancel: () => void } | undefined;
    if (audio && voiceSupported()) {
      voice = speak(action.speech, {
        language: lesson.language,
        rate: (lesson.depth === "basis" ? 0.9 : 1) * speed,
        onStart: () => setVoiceActive(true),
        onBoundary: () => setPulse((n) => n + 1),
        onEnd: () => {
          setVoiceActive(false);
          spoken = true;
          finish();
        },
      });
      // Browser engines occasionally omit end/error; allow a conservative spoken-duration fallback.
      speechTimer = setTimeout(
        () => {
          spoken = true;
          finish();
        },
        Math.max(15000, action.durationMs * 2),
      );
    } else {
      speechTimer = setTimeout(() => {
        spoken = true;
        finish();
      }, action.durationMs / speed);
      spoken = false;
    }
    return () => {
      live = false;
      clearInterval(interval);
      clearTimeout(speechTimer);
      voice?.cancel();
      setVoiceActive(false);
    };
  }, [
    suspended,
    state.playing,
    state.index,
    state.feedback,
    audio,
    lesson.id,
    speed,
    serverFeedback,
  ]);
  const amount = reducedMotion
    ? 1
    : state.playing || progress > 0
      ? progress
      : 1;
  const text = (value: string) =>
    value.slice(0, Math.ceil(value.length * amount));
  return (
    <section
      lang={lesson.language || "en"}
      data-testid="page-teaching-board"
      className={styles.board}
    >
      <header className={styles.boardHeader}>
        <div className={styles.boardIdentity}>
          <span className="text-2xl" aria-hidden="true">
            👨‍🏫
          </span>
          <div>
            <h2>GURU LIVE CLASSROOM</h2>
            <p>EKAGURU Board · Page {page.physicalPage}</p>
          </div>
        </div>
        <span>
          {lesson.depth} · Action {state.index + 1}/{lesson.actions.length}
          {describePhase(action.phase) && (
            <span data-testid="phase-label" className="ml-2 rounded bg-black/30 px-2 py-0.5 text-xs text-amber-100">
              {describePhase(action.phase)}
            </span>
          )}
        </span>
        <button
          onClick={() => send(state.playing ? "pause" : "play")}
          disabled={
            suspended ||
            busy ||
            action.kind === "ask" ||
            action.kind === "summary"
          }
        >
          {state.playing ? "Pause" : "Play Guru"}
        </button>
        <button
          onClick={() => send("back")}
          disabled={busy || state.index === 0}
        >
          Back
        </button>
        <button
          onClick={() => send("next")}
          disabled={
            busy ||
            state.index === lesson.actions.length - 1 ||
            (action.kind === "ask" && action.gating !== false && state.feedback !== "correct")
          }
        >
          Next
        </button>
        <button
          disabled={busy}
          onClick={() => {
            progressRef.current = { actionId: "", value: 0 };
            setProgress(0);
            send("restart");
          }}
        >
          Restart
        </button>
        <button aria-pressed={audio} onClick={() => setAudio((a) => !a)}>
          {audio ? "Mute voice" : "Enable voice"}
        </button>
        <label>
          Pace{" "}
          <select
            aria-label="Teaching pace"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bg-emerald-950"
          >
            <option value={0.75}>Slower</option>
            <option value={1}>Normal</option>
            <option value={1.25}>Faster</option>
          </select>
        </label>
        <button
          aria-pressed={reducedMotion}
          onClick={() => setReducedMotion((v) => !v)}
        >
          Reduce motion
        </button>
      </header>
      {saveError && (
        <p role="alert">
          {saveError} Your last confirmed progress is preserved. Retry the
          action.
        </p>
      )}
      {busy && <p role="status">Saving teaching progress…</p>}
      {state.index === 0 && session?.personalization?.note && (
        <p data-testid="guru-remembers" className="my-2 rounded bg-black/25 px-3 py-2 text-sm text-amber-100">
          Guru remembers: {session.personalization.note}
        </p>
      )}
      {reviewNote && (
        <p role="status" data-testid="review-note" className="my-2 rounded bg-black/25 px-3 py-2 text-xs text-emerald-100">
          {reviewNote}
        </p>
      )}
      {masteryNote && (
        <p
          role="status"
          data-testid="mastery-note"
          className="my-2 rounded bg-black/25 px-3 py-2 text-xs text-amber-100"
        >
          {masteryNote}
        </p>
      )}
      {serverFeedback && (
        <p role="status" className="my-3 border-l-4 border-sky-400 pl-3">
          {serverFeedback}
        </p>
      )}
      <div className={styles.narration}>
        <div className={styles.voiceRow}>
          <GuruVoiceOrb
            state={orbState}
            pulse={pulse}
            reducedMotion={reducedMotion}
            size={88}
          />
          <div className="min-w-0 flex-1">
            <div className={styles.narrationLabel}>
              <span>{audio ? "Guru speaks" : "Guru speaks (voice muted)"}</span>
              <span data-testid="orb-status" className="text-xs font-normal text-emerald-200">
                {orbState === "speaking"
                  ? "Speaking…"
                  : orbState === "listening"
                    ? micActive
                      ? "Listening to you…"
                      : "Waiting for your answer"
                    : orbState === "thinking"
                      ? "Thinking…"
                      : "Ready"}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.narrationLabel} style={{ display: "none" }}>Guru Speaks</div>
        <p aria-live="polite">
          {state.feedback === "retry"
            ? "Let us revisit the source: " +
              page.blocks
                .filter((b) => action.evidenceIds.includes(b.blockId))
                .map((b) => b.text)
                .join(" ")
            : action.speech}
        </p>
      </div>
      <div className={styles.canvas} data-testid="board-canvas">
        {!started ? (
          <div className={styles.welcome}>
            <span className="text-4xl" aria-hidden="true">
              👨‍🏫
            </span>
            <h3>Welcome to Today’s Lesson</h3>
            <p>
              Open your textbook to Page {page.physicalPage}. Press Play to
              follow this page on the blackboard.
            </p>

            <button disabled={suspended} onClick={() => send("play")}>
              ▶ Start Blackboard Teaching
            </button>
          </div>
        ) : (
          <>
            {currentNotes.slice(-3).map((note) => (
              <p key={note.id} className="text-xl text-amber-100">
                {note.id === action.id ? text(note.text) : note.text}
              </p>
            ))}
            {drawing?.scene && (
              <GuruScene
                scene={drawing.scene}
                progress={action.kind === "draw" ? amount : 1}
              />
            )}
            {drawing && !drawing.scene && (
              <svg
                viewBox="0 0 700 180"
                role="img"
                aria-label={
                  drawing.relation
                    ? "Relationship from the page"
                    : "Source evidence frame"
                }
                className="w-full max-h-52"
              >
                <rect
                  x="10"
                  y="15"
                  width="680"
                  height="150"
                  rx="12"
                  fill="none"
                  stroke="#fde68a"
                  strokeWidth="3"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={action.kind === "draw" ? 1 - amount : 0}
                />
                {drawing.relation ? (
                  <>
                    <foreignObject x="25" y="35" width="240" height="110">
                      <div className="text-lg text-center">
                        {drawing.relation.from}
                      </div>
                    </foreignObject>
                    <path
                      d="M 275 85 L 405 85 M 395 75 L 405 85 L 395 95"
                      stroke="#6ee7b7"
                      fill="none"
                      strokeWidth="3"
                      pathLength="1"
                      strokeDasharray="1"
                      strokeDashoffset={1 - amount}
                    />
                    <text
                      x="335"
                      y="0"
                      fill="white"
                      textAnchor="middle"
                      dy="60"
                    >
                      {drawing.relation.label}
                    </text>
                    <foreignObject x="425" y="35" width="250" height="110">
                      <div className="text-lg text-center">
                        {drawing.relation.to}
                      </div>
                    </foreignObject>
                  </>
                ) : (
                  <text x="350" y="95" textAnchor="middle" fill="#a7f3d0">
                    See the highlighted excerpt in your textbook
                  </text>
                )}
              </svg>
            )}
            {action.kind === "ask" && action.assessment && action.gating === false && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void remote("answer", answer);
                }}
                className="space-y-3 rounded-xl bg-black/20 p-4"
                data-testid="share-form"
              >
                <label className="block">
                  {action.prompt || action.text}
                  <textarea
                    aria-label="Share your thinking"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    maxLength={6000}
                    className="mt-3 block w-full rounded p-3 text-slate-900"
                  />
                </label>
                <button
                  disabled={busy || !answer.trim()}
                  type="submit"
                  className="rounded bg-sky-700 px-3 py-2"
                >
                  Share and continue
                </button>
                {recognitionSupported() && (
                  <button type="button" onClick={listenForAnswer} aria-pressed={micActive} className="ml-3 underline">
                    {micActive ? "Stop listening" : "Speak your answer"}
                  </button>
                )}
                {micError && <p role="alert" className="text-xs">{micError}</p>}
                <p className="text-xs">
                  Guru listens here; this is not graded and never counts against you. You can also press Next.
                </p>
              </form>
            )}
            {action.kind === "ask" && action.assessment && action.gating !== false && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void remote("answer", answer);
                }}
                className="space-y-3 rounded-xl bg-black/20 p-4"
              >
                <label className="block">
                  {action.prompt || action.text}
                  <textarea
                    aria-label="Explain your reasoning"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    maxLength={6000}
                    className="mt-3 block w-full rounded p-3 text-slate-900"
                  />
                </label>
                <button
                  disabled={busy || !answer.trim()}
                  type="submit"
                  className="rounded bg-emerald-700 px-3 py-2"
                >
                  Discuss my answer
                </button>
                {recognitionSupported() && (
                  <button type="button" onClick={listenForAnswer} aria-pressed={micActive} className="ml-3 underline">
                    {micActive ? "Stop listening" : "Speak your answer"}
                  </button>
                )}
                {micError && <p role="alert" className="text-xs">{micError}</p>}
                <button
                  disabled={busy}
                  type="button"
                  className="ml-3 underline"
                  onClick={() => void remote("help")}
                >
                  Teach this again with help
                </button>
                <p className="text-xs">
                  Guru checks your explanation against this page. Assisted
                  practice is recorded separately from independent
                  understanding.
                </p>
              </form>
            )}
            {action.kind === "ask" && !action.assessment && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(
                    checkRecall(answer, action.answer || "")
                      ? "correct"
                      : "wrong",
                  );
                }}
                className="space-y-3 rounded-xl bg-black/20 p-4"
              >
                <label className="block">
                  Complete from the source: <strong>{action.text}</strong>
                  <input
                    aria-label="Missing word"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="mt-2 block w-full rounded p-2 text-slate-900"
                    autoComplete="off"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!answer.trim()}
                  className="rounded bg-emerald-700 px-3 py-2"
                >
                  Check answer
                </button>
                {state.feedback && (
                  <p role="status">
                    {state.feedback === "correct"
                      ? "Recall checked. Explain the idea below, then choose Next."
                      : "Try again using the highlighted words. This is practice, not a mastery score."}
                  </p>
                )}
                <label className="block">
                  {action.prompt}
                  <textarea
                    aria-label="Your explanation"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    className="block w-full rounded p-2 text-slate-900"
                  />
                </label>
                <p className="text-xs">
                  Your explanation is for reflection; it is not automatically
                  graded.
                </p>
              </form>
            )}
            {action.kind === "summary" && (
              <div>
                <h3 className="text-xl">Page notes</h3>
                <ul className="list-disc pl-5">
                  {lesson.notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
                <p className="mt-4">
                  Page practice complete. Mastery requires a separate
                  assessment.
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <div className={styles.chalkTray}>
        Chalk Tray: <span style={{ color: "#fff" }}>━</span>
        <span style={{ color: "#fde047" }}>━</span>
        <span style={{ color: "#6ee7b7" }}>━</span>
        <span style={{ color: "#fb7185" }}>━</span>
        <span className="ml-auto">
          {lesson.mode === "guru"
            ? "Page-grounded Guru lesson"
            : "Source reading · guided practice"}
        </span>
      </div>
    </section>
  );
}
