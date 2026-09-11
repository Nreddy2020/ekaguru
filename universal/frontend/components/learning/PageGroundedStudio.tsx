"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Printer,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Layers,
} from "lucide-react";
import styles from "./ApprovedClassroom.module.css";
import {ConnectBookToGuru} from "./ConnectBookToGuru";
import { ClassroomDialog } from "./ClassroomDialog";
import { BookStorageService } from "../../lib/learning/book-storage.service";
import {
  readLocalPage,
  saveLocalPdf,
} from "../../lib/learning/local-book-source";
import { TeachingDepth } from "../../lib/learning/teaching-package.types";
import {
  PageEvidence,
  PageLesson,
  compilePageLesson,
} from "../../lib/learning/page-lesson-runtime";
import { PageTeachingBoard } from "./PageTeachingBoard";
import {
  GuruSessionSnapshot,
  GuruEvent,
  guruRequest,
  loadGuruLesson,
  waitForGuruJob,
  type GuruJob,
  describeGuruStage,
} from "../../lib/learning/guru-api";
export interface PageGroundedStudioProps {
  bookId?: string;
  sectionId?: string;
  physicalPage?: number;
  printedPage?: number | string;
  sectionTitle?: string;
  conceptName?: string;
  description?: string;
  className?: string;
}
/** Scroll the in-page container to a section; fragment navigation alone does not move the layout box. */
const jumpTo = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    history.replaceState(null, "", "#" + id);
  } catch {}
};
const builtin = [
  "evs-class-5",
  "maths-class-5",
  "science-class-6",
  "social-class-5",
];
const EVIDENCE_POLL_MS = 3000;
const EVIDENCE_DEADLINE_MS = 10 * 60 * 1000;
const DEPTH_TITLES: Record<TeachingDepth, string> = {
  basis: "Basis",
  developing: "Developing",
  proficient: "Proficient",
  advanced: "Advanced",
  deep: "Deep",
};
const depths: TeachingDepth[] = [
  "basis",
  "developing",
  "proficient",
  "advanced",
  "deep",
];
export function PageGroundedStudio({
  bookId = "evs-class-5",
  physicalPage = 1,
  className = "",
}: PageGroundedStudioProps) {
  const [connectOpen,setConnectOpen]=useState(false);
  const [rotation, setRotation] = useState(0);
  const [review, setReview] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [bookSubject, setBookSubject] = useState("");
  const [localMissing, setLocalMissing] = useState(false);
  const [question, setQuestion] = useState("");
  const [questionReply, setQuestionReply] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [questionBusy, setQuestionBusy] = useState(false);
  const questionIdentity = useRef("");
  useEffect(() => {
    const stored = BookStorageService.getBooks().find((b) => b.id === bookId || b.guruMaterial?.id===bookId);
    setBookTitle(stored?.title || "");
    setBookSubject(stored?.subject || "");
    questionIdentity.current = "";
    setQuestionBusy(false);
    setQuestionReply("");
    setQuestionError("");
  }, [bookId, physicalPage]);
  const restoreSource = async (file: File) => {
    try {
      await saveLocalPdf(bookId, file);
      setLocalMissing(false);
      setRetry((r) => r + 1);
    } catch (e: any) {
      setError(e.message);
    }
  };
  const [pageNumber, setPageNumber] = useState(physicalPage);
  const [depth, setDepth] = useState<TeachingDepth>("basis");
  const [language, setLanguage] = useState("en");
  const [age, setAge] = useState<number | undefined>();
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  // Learner profiles of the signed-in account; a chosen learner makes built-in-book sessions attributable.
  const [learners, setLearners] = useState<{ id: string; name: string }[]>([]);
  const [learnerId, setLearnerId] = useState("");
  const [guruLoading, setGuruLoading] = useState(false);
  const [guruStage, setGuruStage] = useState("");
  const [guruError, setGuruError] = useState("");
  const [guru, setGuru] = useState<{
    plan: PageLesson;
    page: PageEvidence;
    session: GuruSessionSnapshot;
    preferencesKey: string;
    legacyBlueprint?: boolean;
    requestedDepth?: TeachingDepth;
    servedDepth?: TeachingDepth;
    pendingJob?: GuruJob;
  } | null>(null);
  const [regenerate, setRegenerate] = useState(false);
  // Shown while the server's evidence worker reads a scanned page for the first time.
  const [evidenceNote, setEvidenceNote] = useState("");
  // The requested depth being prepared while the board teaches from another depth this page already has.
  const [pendingLesson, setPendingLesson] = useState<{
    depth: TeachingDepth;
    status: "preparing" | "ready" | "failed";
    stage: string;
    error?: string;
  } | null>(null);
  const sessionRef = useRef<GuruSessionSnapshot | null>(null);
  const pendingEvent = useRef<GuruEvent | null>(null);
  const preferencesKey = JSON.stringify([depth, language, age, learnerId]);
  // The teacher meets the learner where they are: suggest a depth from this learner's history in this book.
  useEffect(() => {
    if (!learnerId || !builtin.includes(bookId) || !localStorage.getItem("token")) return;
    let live = true;
    guruRequest<{ recommendedDepth: string | null }>(
      "/api/v2/guru/learners/" + encodeURIComponent(learnerId) + "/context?bookId=" + encodeURIComponent(bookId),
    )
      .then((ctx) => {
        if (!live || manualDepth.current) return;
        if (ctx.recommendedDepth && depths.includes(ctx.recommendedDepth as any)) setDepth(ctx.recommendedDepth as any);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [learnerId, bookId]);
  useEffect(() => {
    let live = true;
    if (localStorage.getItem("token")) {
      guruRequest<{ reasoningAvailable: boolean }>("/api/v2/guru/capabilities")
        .then((result) => {
          if (live) setReasoningEnabled(result.reasoningAvailable === true);
        })
        .catch(() => {});
      guruRequest<{ data: { id: string; name: string }[] }>(
        "/api/v2/learners?pageSize=100",
      )
        .then((result) => {
          if (!live || !Array.isArray(result.data)) return;
          const list = result.data.filter(
            (l) => typeof l.id === "string" && typeof l.name === "string",
          );
          setLearners(list);
          let remembered = "";
          try {
            remembered = localStorage.getItem("guru.learnerId") || "";
          } catch {}
          if (list.some((l) => l.id === remembered)) setLearnerId(remembered);
          else if (list.length === 1) setLearnerId(list[0].id);
        })
        .catch(() => {});
    }
    return () => {
      live = false;
    };
  }, []);
  const manualDepth = useRef(false);
  useEffect(() => {
    manualDepth.current = false;
    setDepth("basis");
  }, [bookId]);
  const [page, setPage] = useState<PageEvidence | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [highlight, setHighlight] = useState<string[]>([]);
  const [resourceOpen,setResourceOpen]=useState(false);
  const [tab, setTab] = useState("Teacher Explains");
  const [zoom, setZoom] = useState(100);
  const [full, setFull] = useState(false);
  const [index, setIndex] = useState(false);
  useEffect(() => {
    setPageNumber(physicalPage);
    setHighlight([]);
  }, [bookId, physicalPage]);
  useEffect(() => {
    const controller = new AbortController();
    let live = true;
    setPage(null);
    setLocalMissing(false);
    questionIdentity.current = "";
    setQuestionBusy(false);
    setQuestionReply("");
    setQuestionError("");
    setError("");
    setHighlight([]);
    const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:20000";
    const prefix = builtin.includes(bookId)
      ? "textbooks"
      : "learning-materials";
    const token = localStorage.getItem("token");
    setEvidenceNote("");
    const evidenceUrl =
      base + "/api/v2/" + prefix + "/" + encodeURIComponent(bookId) + "/pages/" + pageNumber + "/evidence";
    // The scan shows at once; a page whose text is still being read (202, PENDING) is polled until it is stored.
    const readServerEvidence = async (): Promise<PageEvidence> => {
      const started = Date.now();
      for (;;) {
        const response = await fetch(evidenceUrl, {
          signal: controller.signal,
          headers: token ? { Authorization: "Bearer " + token } : {},
        });
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "Sign in to open this textbook."
              : response.status === 403
                ? "You do not have access to this textbook."
                : "Page evidence is unavailable. Check the source and extraction service.",
          );
        const data = (await response.json()) as PageEvidence;
        if (response.status !== 202 && data.status !== "PENDING") return data;
        if (live) {
          setPage(data);
          setEvidenceNote(
            "Guru is reading this scanned page for the first time. The text and the lesson appear here shortly; you can look at the page meanwhile.",
          );
        }
        if (Date.now() - started > EVIDENCE_DEADLINE_MS)
          throw new Error("Reading this page is taking longer than expected. Reload in a moment.");
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, EVIDENCE_POLL_MS);
          controller.signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
            },
            { once: true },
          );
        });
      }
    };
    (bookId.startsWith("book-") ? readLocalPage(bookId, pageNumber) : readServerEvidence())
      .then((result: PageEvidence) => {
        if (result.bookId !== bookId || result.physicalPage !== pageNumber)
          throw new Error("The source does not match the opened page.");
        if (live) {
          setPage(result);
          setEvidenceNote("");
          if (
            !manualDepth.current &&
            result.recommendedDepth &&
            depths.includes(result.recommendedDepth)
          )
            setDepth(result.recommendedDepth);
        }
      })
      .catch((e) => {
        if (live && e.name !== "AbortError") {
          setError(e.message);
          setLocalMissing(e.code === "LOCAL_SOURCE_MISSING");
        }
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [bookId, pageNumber, retry]);
  const rawActive =
    page?.bookId === bookId && page.physicalPage === pageNumber ? page : null;
  useEffect(() => {
    const controller = new AbortController();
    let live = true;
    setGuru(null);
    setGuruError("");
    setGuruLoading(false);
    setPendingLesson(null);
    sessionRef.current = null;
    pendingEvent.current = null;
    if (reasoningEnabled && rawActive && rawActive.status !== "PENDING" && !bookId.startsWith("book-")) {
      setGuruLoading(true);
      setGuruStage("");
      loadGuruLesson(
        rawActive,
        depth,
        language,
        age,
        controller.signal,
        builtin.includes(bookId) && learnerId ? learnerId : undefined,
        (stage) => {
          if (live) setGuruStage(stage);
        },
        regenerate,
      )
        .then((result) => {
          if (!live) return;
          setGuru({ ...result, preferencesKey });
          sessionRef.current = result.session;
          if (result.pendingJob && result.servedDepth !== depth) {
            const requested = depth;
            setPendingLesson({ depth: requested, status: "preparing", stage: result.pendingJob.stage });
            waitForGuruJob(result.pendingJob, controller.signal, (stage) => {
              if (live) setPendingLesson((p) => (p ? { ...p, stage } : p));
            })
              .then(() => {
                if (live) setPendingLesson({ depth: requested, status: "ready", stage: "done" });
              })
              .catch((error) => {
                if (live && error.name !== "AbortError")
                  setPendingLesson({ depth: requested, status: "failed", stage: "failed", error: error.message });
              });
          }
        })
        .catch((error) => {
          if (live && error.name !== "AbortError") setGuruError(error.message);
        })
        .finally(() => {
          if (live) setGuruLoading(false);
        });
    }
    return () => {
      live = false;
      controller.abort();
    };
  }, [rawActive, reasoningEnabled, preferencesKey, retry]);
  const currentGuru =
    guru &&
    rawActive &&
    guru.page.sourceHash === rawActive.sourceHash &&
    guru.page.bookId === bookId &&
    guru.page.physicalPage === pageNumber &&
    guru.preferencesKey === preferencesKey
      ? guru
      : null;
  const active = currentGuru?.page || rawActive;
  const recordEvent = async (kind: GuruEvent["kind"], answer?: string) => {
    const session = sessionRef.current;
    if (!session) throw new Error("Reload Guru to resume this session.");
    if (
      pendingEvent.current &&
      (pendingEvent.current.kind !== kind ||
        pendingEvent.current.answer !== answer)
    )
      throw new Error(
        "Retry the previous action before sending another one, or reload Guru.",
      );
    const input = pendingEvent.current || {
      requestId: crypto.randomUUID(),
      revision: session.revision,
      kind,
      ...(answer === undefined ? {} : { answer }),
    };
    pendingEvent.current = input;
    const result = await guruRequest<GuruSessionSnapshot>(
      "/api/v2/guru/sessions/" + session.id + "/events",
      input,
    );
    if (sessionRef.current?.id === session.id) {
      sessionRef.current = result;
      pendingEvent.current = null;
    }
    return result;
  };
  const compiled = useMemo(() => {
    if (currentGuru) return currentGuru.plan;
    if (!active || active.status === "PENDING") return null;
    try {
      return compilePageLesson(active, depth);
    } catch {
      return null;
    }
  }, [active, depth, currentGuru]);

  const source = active ? (
    <div className={styles.imageScroll}>
      <div
        style={{
          width: zoom + "%",
          margin: "0 auto",
          position: "relative",
          aspectRatio:
            rotation % 180
              ? active.height / active.width
              : active.width / active.height,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width:
              rotation % 180
                ? (active.width / active.height) * 100 + "%"
                : "100%",
            transform: "translate(-50%,-50%) rotate(" + rotation + "deg)",
          }}
        >
          <img
            src={
              active.imageUrl
                ? (active.imageUrl.startsWith("/")
                    ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:20000") + active.imageUrl
                    : active.imageUrl)
                : active.imageDataUrl || ""
            }
            alt={"Original physical page " + pageNumber}
            className="block w-full rounded"
          />
          {active.blocks
            .filter((b) => highlight.includes(b.blockId))
            .map((b) => (
              <div
                key={b.blockId}
                data-testid="source-highlight"
                className="pointer-events-none absolute border-2 border-amber-500 bg-amber-300/25"
                style={{
                  left: (b.bbox.x / active.width) * 100 + "%",
                  top: (b.bbox.y / active.height) * 100 + "%",
                  width: (b.bbox.width / active.width) * 100 + "%",
                  height: (b.bbox.height / active.height) * 100 + "%",
                }}
              />
            ))}
        </div>
      </div>
    </div>
  ) : (
    <div className={styles.imageScroll}>
      <p className={styles.sourceNotice}>{error || "Opening your textbook…"}</p>
    </div>
  );
  const labels: Record<TeachingDepth, string> = {
    basis: "Start Here",
    developing: "Build Understanding",
    proficient: "Apply & Connect",
    advanced: "Analyse & Reason",
    deep: "Research & Explore",
  };
  const tabNames = [
    "Teacher Explains",
    "Visuals & Real World",
    "Real World Examples",
    "Key Points",
    "Board Summary",
    "Printable Notes",
  ];
  const changePage = (n: number) => {
    if (Number.isInteger(n) && n > 0 && (!active || n <= active.totalPages)) {
      setPageNumber(n);
      const url=new URL(window.location.href);url.searchParams.set("page",String(n));window.history.replaceState(window.history.state,"",url);
      setQuestion("");
      setQuestionReply("");
      setQuestionError("");
      setRotation(0);
    }
  };
  const askQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !active) return;
    const identity =
      active.bookId + ":" + active.physicalPage + ":" + active.sourceHash;
    questionIdentity.current = identity;
    setQuestionBusy(true);
    setQuestionError("");
    try {
      if (!currentGuru) {
        const words =
          question
            .toLowerCase()
            .match(new RegExp("[\\p{L}\\p{N}]{3,}", "gu")) || [];
        const matches = active.blocks
          .filter((b) => words.some((w) => b.text.toLowerCase().includes(w)))
          .slice(0, 3);
        setQuestionReply(
          matches.length
            ? "Relevant excerpts from this page:\n" +
                matches.map((b) => b.text).join("\n") +
                "\nEnable Guru reasoning for an explanation."
            : "I could not find a matching excerpt. Enable Guru reasoning to discuss this page.",
        );
        setHighlight(matches.map((b) => b.blockId));
      } else {
        const result = await recordEvent("question", question);
        if (questionIdentity.current === identity) {
          setQuestionReply(result.feedback || "");
          setHighlight(result.evidenceIds || []);
        }
      }
    } catch (e: any) {
      if (questionIdentity.current === identity) setQuestionError(e.message);
    } finally {
      if (questionIdentity.current === identity) setQuestionBusy(false);
    }
  };
  return (
    <div
      data-testid="approved-classroom"
      className={styles.studio + " " + className}
    >
      <header className={styles.toolbar}>
        <Link href="/learn" className={styles.back}>
          <ArrowLeft size={14} />
          Library
        </Link>
        <div className={styles.context}>
          <span className={styles.eyebrow}>FROM YOUR TEXTBOOK</span>
          <strong>{bookTitle || bookId}</strong>
        </div>
        <span className={styles.badge}>
          <ShieldCheck size={13} />
          {active ? "Source linked" : "Source pending"}
        </span>
        <button className={styles.tool} onClick={() => setReview(true)}>
          <Sparkles size={13} />
          Task Review
        </button>
        <button
          className={styles.tool}
          onClick={() => window.print()}
          disabled={!compiled}
        >
          <Printer size={13} />
          Print Notes
        </button>
      </header>
      <div className={styles.layout}>
        <aside className={styles.sidebar} id="textbook-source">
          <a href="#guru-board" className={styles.mobileJump} onClick={jumpTo("guru-board")}>
            Jump to the Guru board ↓
          </a>
          <div className={styles.sourceHeading}>
            <span className={styles.eyebrow}>FROM YOUR TEXTBOOK</span>
            <span className={styles.badge}>
              {active ? "Original source" : "Awaiting source"}
            </span>
          </div>
          <strong className="text-xs">
            Page {pageNumber}
            {bookSubject ? " · " + bookSubject : ""}
          </strong>
          <div className={styles.viewer}>
            <div className={styles.viewerTools}>
              <FileText size={15} className="text-rose-400" />
              <strong>
                Page {pageNumber}
                {active ? " of " + active.totalPages : ""}
              </strong>
              <button
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(60, z - 20))}
              >
                <ZoomOut size={14} />
              </button>
              <span>{zoom}%</span>
              <button
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(240, z + 20))}
              >
                <ZoomIn size={14} />
              </button>
              <button
                aria-label="Rotate page"
                onClick={() => setRotation((r) => (r + 90) % 360)}
              >
                <RotateCw size={14} />
              </button>
            </div>
            {source}
            <div className={styles.sourceFooter}>
              <span>◉ Original textbook page</span>
              <span>{active?.totalPages || "—"} pages</span>
            </div>
          </div>
          {active && (
            <p className={styles.sourceNotice}>
              {currentGuru
                ? "Model-assisted interpretation; highlights are estimated regions."
                : "Text excerpts linked to the original page."}{" "}
              {active.omittedBlockCount > 0
                ? active.omittedBlockCount + " uncertain regions need review."
                : ""}
            </p>
          )}
          {localMissing && (
            <label className={styles.sideButton}>
              Attach original PDF
              <input
                aria-label="Attach original PDF"
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void restoreSource(file);
                }}
              />
            </label>
          )}
          <div className={styles.pageNavigation}>
            <button
              aria-label="Previous page"
              disabled={pageNumber <= 1}
              onClick={() => changePage(pageNumber - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <label>
              Page{" "}
              <input
                aria-label="Physical page"
                type="number"
                key={pageNumber}
                min={1}
                max={active?.totalPages}
                defaultValue={pageNumber}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    changePage(Number(e.currentTarget.value));
                }}
              />
              {active ? " of " + active.totalPages : ""}
            </label>
            <button
              aria-label="Next page"
              disabled={!active || pageNumber >= active.totalPages}
              onClick={() => changePage(pageNumber + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <button
            className={styles.sideButton}
            disabled={!active}
            onClick={() => setFull(true)}
          >
            <BookOpen size={15} />
            View Full Page
          </button>
          <button
            className={styles.sideButton}
            disabled={!active}
            onClick={() => setIndex(true)}
          >
            <Layers size={15} />
            View Full Book Index
          </button>
        </aside>
        <main className={styles.main} id="guru-board">
          <a href="#textbook-source" className={styles.mobileJump} onClick={jumpTo("textbook-source")}>
            ↑ Back to the textbook page
          </a>
          <div className={styles.depthStrip}>
            <span className={styles.depthLabel}>
              <Sparkles size={14} />
              TEACHING DEPTH / LEVEL
            </span>
            <div className={styles.depths}>
              {depths.map((d) => (
                <button
                  key={d}
                  aria-label={d}
                  className={styles.depthButton}
                  aria-pressed={depth === d}
                  onClick={() => {
                    manualDepth.current = true;
                    setDepth(d);
                  }}
                >
                  {d}
                  <small>({labels[d]})</small>
                </button>
              ))}
            </div>
          </div>
          <details className={styles.notice}>
            <summary className="cursor-pointer">
              Guru settings ·{" "}
              {currentGuru ? "Progress saved" : "Source reading mode"}
            </summary>
            <div className={styles.preferences + " mt-3"}>
              <label>
                Teaching language
                <select
                  aria-label="Teaching language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {[
                    ["en", "English"],
                    ["hi", "हिन्दी"],
                    ["te", "తెలుగు"],
                    ["ta", "தமிழ்"],
                    ["es", "Español"],
                    ["fr", "Français"],
                    ["ar", "العربية"],
                  ].map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {builtin.includes(bookId) && learners.length > 0 && (
                <label>
                  Learner
                  <select
                    aria-label="Learner profile"
                    value={learnerId}
                    onChange={(e) => {
                      setLearnerId(e.target.value);
                      try {
                        localStorage.setItem("guru.learnerId", e.target.value);
                      } catch {}
                    }}
                  >
                    <option value="">Not attributed to a learner</option>
                    {learners.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Age (optional)
                <input
                  aria-label="Learner age"
                  type="number"
                  min={4}
                  max={120}
                  value={age ?? ""}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setAge(
                      e.target.value && n >= 4 && n <= 120 ? n : undefined,
                    );
                  }}
                />
              </label>
              <button
                className={styles.primary}
                disabled={!rawActive || guruLoading}
                onClick={() => {
                  if(bookId.startsWith("book-")){setConnectOpen(true);return;}
                  setReasoningEnabled(true);
                  setRetry((r) => r + 1);
                }}
              >
                {bookId.startsWith("book-")?"Connect to Guru":currentGuru ? "Reload Guru" : "Teach with Guru"}
              </button>
            </div>
          </details>
          {guruLoading && (
            <p role="status" className={styles.notice} data-testid="guru-stage">
              {guruStage
                ? describeGuruStage(guruStage) +
                  " You can keep reading the page; the lesson appears here when it is ready."
                : "Guru is studying this page, preparing diagrams and checking the lesson…"}
            </p>
          )}
          {guruError && (
            <p role="alert" className={styles.notice}>
              {guruError}
            </p>
          )}
          {currentGuru?.legacyBlueprint && !guruLoading && (
            <p role="status" className={styles.notice} data-testid="legacy-blueprint">
              This lesson was prepared before the current teaching blueprint (hook, prior knowledge, worked example, guided and independent practice).{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setRegenerate(true);
                  setRetry((r) => r + 1);
                }}
              >
                Prepare it again with the new methodology
              </button>
            </p>
          )}
          {currentGuru?.servedDepth &&
            currentGuru.requestedDepth &&
            currentGuru.servedDepth !== currentGuru.requestedDepth &&
            !guruLoading && (
              <p role="status" className={styles.notice} data-testid="depth-fallback">
                {pendingLesson?.status === "ready"
                  ? "The " + DEPTH_TITLES[currentGuru.requestedDepth] + " lesson for this page is ready. "
                  : pendingLesson?.status === "failed"
                    ? "The " +
                      DEPTH_TITLES[currentGuru.requestedDepth] +
                      " lesson could not be prepared now: " +
                      pendingLesson.error +
                      " Teaching from the " +
                      DEPTH_TITLES[currentGuru.servedDepth] +
                      " lesson instead."
                    : "Guru is preparing the " +
                      DEPTH_TITLES[currentGuru.requestedDepth] +
                      " lesson for this page (" +
                      describeGuruStage(pendingLesson?.stage || "queued").replace(/…$/, "") +
                      "). Teaching from the " +
                      DEPTH_TITLES[currentGuru.servedDepth] +
                      " lesson meanwhile."}
                {pendingLesson?.status === "ready" && (
                  <button type="button" className="underline" onClick={() => setRetry((r) => r + 1)}>
                    Open it
                  </button>
                )}
              </p>
            )}
          {compiled && active ? (
            <PageTeachingBoard
              key={compiled.id + ":" + retry}
              page={active}
              lesson={compiled}
              onHighlight={setHighlight}
              session={currentGuru?.session}
              onEvent={currentGuru ? recordEvent : undefined}
              suspended={questionBusy || full || index || review || connectOpen}
            />
          ) : (
            <section className={styles.board}>
              <header className={styles.boardHeader}>
                <div className={styles.boardIdentity}>
                  <span className="text-2xl">👨‍🏫</span>
                  <div>
                    <h2>GURU LIVE CLASSROOM</h2>
                    <p>
                      Page {pageNumber} · {depth}
                    </p>
                  </div>
                </div>
              </header>
              <div className={styles.canvas}>
                <div className={styles.welcome}>
                  <span className="text-4xl">👨‍🏫</span>
                  <h3>Welcome to Today’s Lesson</h3>
                  {evidenceNote && !error && (
                    <p role="status" data-testid="evidence-reading">
                      {evidenceNote}
                    </p>
                  )}
                  {error ? (
                    <div role="alert">
                      <p>{error}</p>
                      <button onClick={() => setRetry((r) => r + 1)}>
                        Retry
                      </button>
                    </div>
                  ) : evidenceNote ? null : (
                    <p role={active ? "alert" : "status"}>
                      {active
                        ? "This page needs extraction review before Guru can teach it."
                        : "Reading the opened page…"}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
          <nav
            role="tablist"
            aria-label="Lesson resources"
            className={styles.tabs}
          >
            {tabNames.map((name, i) => (
              <button
                key={name}
                role="tab"
                aria-selected={tab === name}
                aria-controls="classroom-resource-panel"
                id={"resource-tab-" + i}
                onClick={() => {setTab(name);setResourceOpen(true);}}
              >
                <BookOpen size={13} />
                {name}
              </button>
            ))}
          </nav>
          {compiled && resourceOpen && (
            <section
              id="classroom-resource-panel"
              role="tabpanel"
              aria-labelledby={"resource-tab-" + tabNames.indexOf(tab)}
              className={styles.tabPanel}
            >
              <h2>{tab}</h2>
              {tab === "Visuals & Real World" ? (
                <p>
                  Diagrams unfold on the board alongside the explanation. The
                  highlighted region shows their source in your textbook.
                </p>
              ) : tab === "Real World Examples" ? (
                <p>
                  Choose an idea from this page and describe where you have seen
                  it in daily life. Use the question bar to discuss your example
                  with Guru.
                </p>
              ) : (
                <ul className="list-disc pl-5 space-y-2">
                  {(tab === "Teacher Explains" && currentGuru
                    ? compiled.actions
                        .filter((a) => a.kind === "explain")
                        .map((a) => a.speech)
                    : compiled.notes
                  ).map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              )}
            </section>
          )}
          <div className={styles.question}>
            <form onSubmit={askQuestion}>
              <input
                aria-label="Ask about this page"
                placeholder={
                  "Ask a question about page " +
                  pageNumber +
                  " — Guru will use your textbook evidence…"
                }
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={6000}
              />
              <button
                className={styles.primary}
                disabled={!active || !question.trim() || questionBusy}
              >
                {questionBusy ? "Thinking…" : "✧ Ask"}
              </button>
            </form>
            {questionError && <p role="alert">{questionError}</p>}
            {questionReply && <p role="status">{questionReply}</p>}
          </div>
        </main>
      </div>
      {connectOpen&&<ConnectBookToGuru bookId={bookId} physicalPage={pageNumber} onClose={()=>setConnectOpen(false)} onConnected={id=>{window.location.assign("/library/"+encodeURIComponent(id)+"?page="+pageNumber);}}/>}
      {full && active && (
        <ClassroomDialog
          title="Full textbook page"
          onClose={() => setFull(false)}
        >
          {source}
        </ClassroomDialog>
      )}
      {index && active && (
        <ClassroomDialog title="Book index" onClose={() => setIndex(false)}>
          <p className="mb-4 text-sm">Physical pages of this textbook</p>
          <div className={styles.pageIndex}>
            {Array.from({ length: active.totalPages }, (_, i) => (
              <button
                key={i}
                aria-current={i + 1 === pageNumber ? "page" : undefined}
                onClick={() => {
                  changePage(i + 1);
                  setIndex(false);
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </ClassroomDialog>
      )}
      {review && (
        <ClassroomDialog title="Task Review" onClose={() => setReview(false)}>
          <dl className="space-y-3 break-all">
            <dt>Source</dt>
            <dd>
              {bookTitle || bookId} · Physical page {pageNumber}
            </dd>
            <dt>Extraction</dt>
            <dd>
              {active
                ? active.blocks.length +
                  " readable regions; " +
                  active.omittedBlockCount +
                  " regions omitted"
                : "Awaiting original source"}
            </dd>
            <dt>Source revision</dt>
            <dd>{active?.sourceHash || "Unavailable"}</dd>
            <dt>Teaching</dt>
            <dd>
              {currentGuru
                ? "Validated Guru lesson with saved session"
                : "Source reading; model reasoning is not active"}
            </dd>
            <dt>Mastery</dt>
            <dd>Watching the board does not award mastery.</dd>
          </dl>
        </ClassroomDialog>
      )}
      <article className={styles.printNotes}>
        <h1>
          {bookTitle || bookId} — Page {pageNumber}
        </h1>
        <p>
          {depth} · {currentGuru ? language : "Source excerpts"}
        </p>
        <ul>
          {compiled?.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
