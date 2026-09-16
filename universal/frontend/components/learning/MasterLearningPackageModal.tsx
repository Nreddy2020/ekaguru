"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Filter,
  HelpCircle,
  Layers,
  Lightbulb,
  Map as MapIcon,
  Printer,
  RefreshCw,
  Sparkles,
  Timer,
  AlertTriangle,
  Brain,
  ListOrdered,
} from "lucide-react";
import { ClassroomDialog } from "./ClassroomDialog";
import {
  BookAudience,
  MasterLearningPackage,
  PackageQuestionItem,
  fetchLearningPackage,
  refreshLearningPackage,
} from "../../lib/learning/guru-learning-package-api";
import styles from "./ApprovedClassroom.module.css";

export interface MasterLearningPackageModalProps {
  bookId: string;
  onClose: () => void;
  initialPackage?: MasterLearningPackage;
  initialAudience?: BookAudience;
  initialDepth?: string;
  initialLanguage?: string;
}

type TabType = "roadmap" | "notes" | "questions" | "mockTest" | "revision" | "print";

const AUDIENCE_OPTIONS: { label: string; value: BookAudience }[] = [
  { label: "Child (8-12 yrs)", value: "child" },
  { label: "School Student", value: "school_student" },
  { label: "College / Undergraduate", value: "college_student" },
  { label: "Teacher / Educator", value: "teacher" },
  { label: "Professor / Academic", value: "professor" },
  { label: "IT Professional / Engineer", value: "it_professional" },
  { label: "Manager / Executive", value: "manager" },
  { label: "Competitive Exam Aspirant", value: "competitive_exam" },
];

export function MasterLearningPackageModal({
  bookId,
  onClose,
  initialPackage,
  initialAudience = "child",
  initialDepth = "basis",
  initialLanguage = "en",
}: MasterLearningPackageModalProps) {
  const [tab, setTab] = useState<TabType>("roadmap");
  const [pkg, setPkg] = useState<MasterLearningPackage | null>(initialPackage || null);
  const [loading, setLoading] = useState(!initialPackage);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [audience, setAudience] = useState<BookAudience>(initialAudience);
  const [depth, setDepth] = useState(initialDepth);
  const [language, setLanguage] = useState(initialLanguage);

  // Notes tab state
  const [selectedChapter, setSelectedChapter] = useState<number | "all">("all");

  // Question bank tab state
  const [questionDifficulty, setQuestionDifficulty] = useState<"all" | "easy" | "medium" | "extended">("all");
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Mock test tab state
  const [showRubric, setShowRubric] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const loadPackage = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const fn = isRefresh ? refreshLearningPackage : fetchLearningPackage;
      const data = await fn(bookId, { audience, depth, language });
      setPkg(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load master learning package.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialPackage) {
      loadPackage(false);
    }
  }, [bookId, audience, depth, language]);

  const toggleAnswer = (id: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allQuestions: PackageQuestionItem[] = useMemo(() => {
    if (!pkg?.questionBank) return [];
    const easy = pkg.questionBank.easy || [];
    const medium = pkg.questionBank.medium || [];
    const extended = pkg.questionBank.extended || [];
    if (questionDifficulty === "easy") return easy;
    if (questionDifficulty === "medium") return medium;
    if (questionDifficulty === "extended") return extended;
    return [...easy, ...medium, ...extended];
  }, [pkg?.questionBank, questionDifficulty]);

  const displayedChapterNotes = useMemo(() => {
    if (!pkg?.chapterNotes) return [];
    if (selectedChapter === "all") return pkg.chapterNotes;
    return pkg.chapterNotes.filter((c) => c.chapterNumber === selectedChapter);
  }, [pkg?.chapterNotes, selectedChapter]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <ClassroomDialog title="Master Learning Package" onClose={onClose}>
      <div className="flex flex-col h-[82vh] max-h-[900px] w-full max-w-5xl text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* Header Bar: Audience Selector & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-base text-purple-700 dark:text-purple-300">
              {pkg?.metadata.title || bookId}
            </span>
            {pkg && (
              <span className="text-xs bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 font-medium">
                {pkg.metadata.totalPages} Pages • {pkg.metadata.readyPagesCount} Ready Pages
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <label className="flex items-center space-x-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span>Audience:</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as BookAudience)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-purple-500"
              >
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={() => loadPackage(true)}
              disabled={refreshing || loading}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700"
              title="Re-synthesize package"
              aria-label="Refresh package"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-purple-600" : ""} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setTab("roadmap")}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              tab === "roadmap"
                ? "bg-purple-600 text-white shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <MapIcon size={14} />
            <span>Roadmap & Concepts</span>
          </button>

          <button
            onClick={() => setTab("notes")}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              tab === "notes"
                ? "bg-purple-600 text-white shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FileText size={14} />
            <span>Chapter Study Notes</span>
          </button>

          <button
            onClick={() => setTab("questions")}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              tab === "questions"
                ? "bg-purple-600 text-white shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <HelpCircle size={14} />
            <span>Question Bank</span>
          </button>

          <button
            onClick={() => setTab("mockTest")}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              tab === "mockTest"
                ? "bg-purple-600 text-white shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Timer size={14} />
            <span>Mock Examination</span>
          </button>

          <button
            onClick={() => setTab("revision")}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              tab === "revision"
                ? "bg-purple-600 text-white shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Brain size={14} />
            <span>Memory & Cheat Sheet</span>
          </button>

          <button
            onClick={() => setTab("print")}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              tab === "print"
                ? "bg-purple-600 text-white shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Printer size={14} />
            <span>Printable Package</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assembling whole-book master learning package...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-300 text-xs">
              <p className="font-bold mb-1">Package Loading Error</p>
              <p>{error}</p>
            </div>
          ) : !pkg ? null : (
            <>
              {/* TAB 1: ROADMAP & CONCEPTS */}
              {tab === "roadmap" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center space-x-1.5">
                      <ListOrdered size={16} className="text-purple-600" />
                      <span>Chapter Progression & Competencies</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pkg.roadmap.map((ch) => (
                        <div
                          key={ch.chapterNumber}
                          className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 rounded-lg p-3 shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-purple-700 dark:text-purple-300">
                              Chapter {ch.chapterNumber}: {ch.title}
                            </span>
                            <span className="text-[11px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                              Pages {ch.pageRange.from}–{ch.pageRange.to}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              Concepts:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {ch.concepts.map((c, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-900"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center space-x-1.5">
                      <Sparkles size={16} className="text-purple-600" />
                      <span>Prerequisites & Concept Dependencies</span>
                    </h3>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="p-2.5">Prerequisite Topic</th>
                              <th className="p-2.5">Target Topic</th>
                              <th className="p-2.5">Relationship Strength</th>
                              <th className="p-2.5">Curricular Rationale</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {pkg.conceptMap.dependencies.map((dep) => (
                              <tr key={dep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                                  {dep.sourceTopicTitle} (p. {dep.sourcePage})
                                </td>
                                <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                                  {dep.targetTopicTitle} (p. {dep.targetPage})
                                </td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                      dep.strength === "essential"
                                        ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300"
                                        : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                                    }`}
                                  >
                                    {dep.strength}
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-600 dark:text-slate-400">
                                  {dep.reason}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CHAPTER STUDY NOTES */}
              {tab === "notes" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-medium text-slate-500">Filter by Chapter:</span>
                    <button
                      onClick={() => setSelectedChapter("all")}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                        selectedChapter === "all"
                          ? "bg-purple-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      All Chapters
                    </button>
                    {pkg.chapterNotes.map((ch) => (
                      <button
                        key={ch.chapterNumber}
                        onClick={() => setSelectedChapter(ch.chapterNumber)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          selectedChapter === ch.chapterNumber
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        Ch {ch.chapterNumber}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {displayedChapterNotes.map((ch) => (
                      <div
                        key={ch.chapterNumber}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800/80 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                          <h4 className="font-bold text-sm text-purple-700 dark:text-purple-300">
                            Chapter {ch.chapterNumber}: {ch.chapterTitle}
                          </h4>
                          <span className="text-xs text-slate-400">
                            Pages {ch.pageRange.from}–{ch.pageRange.to}
                          </span>
                        </div>

                        {ch.pages.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            Notes for this chapter are currently queued or being synthesized.
                          </p>
                        ) : (
                          ch.pages.map((p) => (
                            <div
                              key={p.physicalPage}
                              className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                                  Page {p.physicalPage} • {p.title}
                                </span>
                              </div>

                              {p.summary && p.summary.length > 0 && (
                                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-4">
                                  {p.summary.map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ))}
                                </ul>
                              )}

                              {p.topics.map((t: any, tIdx: number) => (
                                <div
                                  key={tIdx}
                                  className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1"
                                >
                                  <div className="flex items-center space-x-1.5 font-medium text-purple-600 dark:text-purple-400">
                                    <span>{t.icon || "📌"}</span>
                                    <span>{t.heading}</span>
                                  </div>
                                  {t.bigIdea && (
                                    <p className="text-slate-700 dark:text-slate-300 italic">
                                      {t.bigIdea}
                                    </p>
                                  )}
                                  {Array.isArray(t.explanation) && (
                                    <div className="text-slate-600 dark:text-slate-400 space-y-1">
                                      {t.explanation.map((e: string, eIdx: number) => (
                                        <p key={eIdx}>{e}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: QUESTION BANK */}
              {tab === "questions" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
                      <button
                        onClick={() => setQuestionDifficulty("all")}
                        className={`px-2.5 py-1 rounded-md transition-colors ${
                          questionDifficulty === "all"
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        All ({pkg.questionBank.easy.length + pkg.questionBank.medium.length + pkg.questionBank.extended.length})
                      </button>
                      <button
                        onClick={() => setQuestionDifficulty("easy")}
                        className={`px-2.5 py-1 rounded-md transition-colors ${
                          questionDifficulty === "easy"
                            ? "bg-white dark:bg-slate-700 text-green-700 dark:text-green-300 shadow-xs font-semibold"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        Easy / Recall ({pkg.questionBank.easy.length})
                      </button>
                      <button
                        onClick={() => setQuestionDifficulty("medium")}
                        className={`px-2.5 py-1 rounded-md transition-colors ${
                          questionDifficulty === "medium"
                            ? "bg-white dark:bg-slate-700 text-yellow-700 dark:text-yellow-300 shadow-xs font-semibold"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        Medium / Reasoning ({pkg.questionBank.medium.length})
                      </button>
                      <button
                        onClick={() => setQuestionDifficulty("extended")}
                        className={`px-2.5 py-1 rounded-md transition-colors ${
                          questionDifficulty === "extended"
                            ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-semibold"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        Extended / Synthesis ({pkg.questionBank.extended.length})
                      </button>
                    </div>

                    <span className="text-xs text-slate-500">
                      Showing {allQuestions.length} Questions
                    </span>
                  </div>

                  <div className="space-y-3">
                    {allQuestions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 bg-white dark:bg-slate-800/80 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-500">Q{idx + 1}.</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {q.topic} (p. {q.page})
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                q.difficulty === "easy"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                                  : q.difficulty === "medium"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                              }`}
                            >
                              {q.difficulty}
                            </span>
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                              [{q.marks || 1} mark{q.marks !== 1 ? "s" : ""}]
                            </span>
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {q.question}
                        </p>

                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 my-2">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300"
                              >
                                <span className="font-bold mr-1.5">
                                  {String.fromCharCode(65 + oIdx)}.
                                </span>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <button
                            onClick={() => toggleAnswer(q.id || String(idx))}
                            className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
                          >
                            <span>{revealedAnswers[q.id || String(idx)] ? "Hide Model Answer" : "Reveal Model Answer"}</span>
                            <ChevronDown
                              size={13}
                              className={`transition-transform ${
                                revealedAnswers[q.id || String(idx)] ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </div>

                        {revealedAnswers[q.id || String(idx)] && (
                          <div className="mt-2 p-2.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-md text-xs space-y-1 animate-fadeIn">
                            <p className="font-bold text-purple-900 dark:text-purple-200">
                              Model Answer:
                            </p>
                            <p className="text-slate-700 dark:text-slate-200">{q.answer}</p>
                            {q.rationale && (
                              <p className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                                Rationale: {q.rationale}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: BALANCED MOCK EXAMINATION */}
              {tab === "mockTest" && (
                <div className="space-y-4">
                  {/* Test Header Card */}
                  <div className="border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200">
                          {pkg.mockTest.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Standardized balanced examination across all ready chapters
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-bold">
                        <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          ⏱️ {pkg.mockTest.timeBudgetMinutes} Mins
                        </span>
                        <span className="bg-purple-600 text-white px-2.5 py-1 rounded shadow-xs">
                          💯 {pkg.mockTest.totalMarks} Marks Total
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded border border-purple-100 dark:border-purple-900/40">
                      <span className="font-bold block mb-1">Instructions to Candidates:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {pkg.mockTest.instructions.map((ins, i) => (
                          <li key={i}>{ins}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => setShowRubric(!showRubric)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors flex items-center space-x-1 ${
                          showRubric
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <ClipboardCheck size={13} />
                        <span>{showRubric ? "Hide Scoring Rubric" : "View Scoring Rubric"}</span>
                      </button>

                      <button
                        onClick={() => setShowAnswerKey(!showAnswerKey)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors flex items-center space-x-1 ${
                          showAnswerKey
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>{showAnswerKey ? "Hide Full Answer Key" : "View Full Answer Key"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Rubric View */}
                  {showRubric && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 space-y-2">
                      <h4 className="font-bold text-xs text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                        Assessment Grading Rubric
                      </h4>
                      <div className="space-y-2 text-xs">
                        {pkg.mockTest.rubric.map((r, i) => (
                          <div key={i} className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between font-semibold">
                              <span>{r.criteria}</span>
                              <span className="text-purple-600">{r.marks} Marks</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">{r.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Answer Key View */}
                  {showAnswerKey && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 space-y-2">
                      <h4 className="font-bold text-xs text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                        Complete Model Answer Key & Marking Guide
                      </h4>
                      <div className="space-y-2 text-xs">
                        {pkg.mockTest.answerKey.map((a, i) => (
                          <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700 space-y-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {a.questionText}
                            </p>
                            <p className="text-green-700 dark:text-green-400 font-medium">
                              Model Answer: {a.modelAnswer}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                              Marking Guide: {a.markingGuide}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sections List */}
                  <div className="space-y-4">
                    {pkg.mockTest.sections.map((sec) => (
                      <div
                        key={sec.sectionId}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800/80 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                          <div>
                            <h4 className="font-bold text-xs text-purple-700 dark:text-purple-300">
                              {sec.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {sec.instructions}
                            </p>
                          </div>
                          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                            {sec.totalMarks} Marks
                          </span>
                        </div>

                        <div className="space-y-2">
                          {sec.questions.map((q, qIdx) => (
                            <div
                              key={q.id || qIdx}
                              className="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded border border-slate-100 dark:border-slate-800 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between font-semibold">
                                <span className="text-slate-800 dark:text-slate-200">
                                  {qIdx + 1}. {q.question}
                                </span>
                                <span className="text-purple-600 dark:text-purple-400 font-bold ml-2 shrink-0">
                                  [{q.marks || 1} mark{q.marks !== 1 ? "s" : ""}]
                                </span>
                              </div>

                              {q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                                  {q.options.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className="text-[11px] px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                    >
                                      <span className="font-bold mr-1">
                                        {String.fromCharCode(65 + oIdx)}.
                                      </span>
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: MEMORY TRICKS & REVISION CHEAT SHEETS */}
              {tab === "revision" && (
                <div className="space-y-4">
                  {/* Master Cheat Sheet Card */}
                  <div className="border-2 border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2 text-purple-900 dark:text-purple-200">
                      <Sparkles size={18} className="text-purple-600" />
                      <h3 className="font-bold text-sm">
                        {pkg.revisionSheets.onePageCheatSheet.title}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1.5 bg-white dark:bg-slate-900/60 p-3 rounded border border-purple-200 dark:border-purple-800">
                        <span className="font-bold text-purple-700 dark:text-purple-300 block uppercase tracking-wide text-[10px]">
                          Core Principles & Laws:
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                          {pkg.revisionSheets.onePageCheatSheet.coreRules.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5 bg-white dark:bg-slate-900/60 p-3 rounded border border-red-200 dark:border-red-900/60">
                        <span className="font-bold text-red-700 dark:text-red-300 block uppercase tracking-wide text-[10px]">
                          Common Pitfalls & Exam Warnings:
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-red-700 dark:text-red-300">
                          {pkg.revisionSheets.onePageCheatSheet.examWarnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Memory Tricks & Mnemonics */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center space-x-1.5">
                      <Lightbulb size={16} className="text-yellow-500" />
                      <span>Memory Tricks, Mnemonics & Picture Chains</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pkg.memoryTricks.map((m, i) => (
                        <div
                          key={i}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 space-y-1.5 text-xs shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {m.topic} (p. {m.page})
                            </span>
                            <span className="text-[10px] bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 px-1.5 py-0.5 rounded font-medium">
                              Ch {m.chapterNumber}
                            </span>
                          </div>
                          <p className="text-purple-700 dark:text-purple-300 font-semibold">
                            💡 {m.tip}
                          </p>
                          {m.facts && m.facts.length > 0 && (
                            <p className="text-slate-600 dark:text-slate-400 italic">
                              Did you know? {m.facts[0]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mistakes & Troubleshooting */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center space-x-1.5">
                      <AlertTriangle size={16} className="text-red-500" />
                      <span>Misconceptions & Troubleshooting Traps</span>
                    </h3>
                    <div className="space-y-2">
                      {pkg.mistakesAndTroubleshooting.map((m, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-lg text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-red-900 dark:text-red-200 block">
                              ⚠️ {m.questionOrSymptom}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300 block">
                              Fix: {m.explanationOrFix}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 self-start md:self-auto shrink-0">
                            {m.kind}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: PRINTABLE PACKAGE DOCUMENT */}
              {tab === "print" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Ready for High-Quality Export & Physical Handout
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Optimized with clean margins, black-and-white readable typography, and page-break rules.
                      </p>
                    </div>
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
                    >
                      <Printer size={14} />
                      <span>Print Master Package</span>
                    </button>
                  </div>

                  {/* Print Document Shell */}
                  <div className={`border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 rounded-lg text-slate-900 dark:text-slate-100 space-y-6 ${styles.printMasterPackage}`}>
                    <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 text-center space-y-1">
                      <h1 className="text-xl font-bold uppercase tracking-wider">
                        {pkg.metadata.title}
                      </h1>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Master Learning Package • Subject: {pkg.metadata.subject} • Grade: {pkg.metadata.grade}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Audience: {pkg.metadata.targetAudience} • Blueprint: {pkg.metadata.blueprint} • Total Pages: {pkg.metadata.totalPages}
                      </p>
                    </div>

                    {/* Section 1: Roadmap */}
                    <div className="space-y-2">
                      <h2 className="text-sm font-bold border-b border-slate-300 dark:border-slate-700 pb-1 uppercase tracking-wide">
                        1. Curricular Roadmap & Chapter Bounds
                      </h2>
                      <div className="space-y-2 text-xs">
                        {pkg.roadmap.map((ch) => (
                          <div key={ch.chapterNumber} className="flex items-start justify-between">
                            <div>
                              <span className="font-bold">Chapter {ch.chapterNumber}: {ch.title}</span>
                              <p className="text-slate-600 dark:text-slate-400">
                                Concepts: {ch.concepts.join(", ")}
                              </p>
                            </div>
                            <span className="font-mono font-medium text-slate-500">
                              Pages {ch.pageRange.from}–{ch.pageRange.to}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 2: Mock Exam */}
                    <div className="space-y-2">
                      <h2 className="text-sm font-bold border-b border-slate-300 dark:border-slate-700 pb-1 uppercase tracking-wide">
                        2. Summative Mock Examination ({pkg.mockTest.totalMarks} Marks • {pkg.mockTest.timeBudgetMinutes} Mins)
                      </h2>
                      {pkg.mockTest.sections.map((sec) => (
                        <div key={sec.sectionId} className="space-y-1 pt-1">
                          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {sec.name} ({sec.totalMarks} Marks)
                          </h3>
                          <div className="space-y-1.5 pl-2 text-xs">
                            {sec.questions.map((q, qIdx) => (
                              <div key={q.id || qIdx}>
                                <span>{qIdx + 1}. {q.question} [{q.marks || 1} mark{q.marks !== 1 ? "s" : ""}]</span>
                                {q.options && q.options.length > 0 && (
                                  <div className="grid grid-cols-2 gap-1 pl-3 text-[11px] text-slate-600 dark:text-slate-400">
                                    {q.options.map((opt, oIdx) => (
                                      <span key={oIdx}>({String.fromCharCode(65 + oIdx)}) {opt}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Section 3: One Page Cheat Sheet */}
                    <div className="space-y-2 pt-2">
                      <h2 className="text-sm font-bold border-b border-slate-300 dark:border-slate-700 pb-1 uppercase tracking-wide">
                        3. Master Cheat Sheet & Exam Rules
                      </h2>
                      <div className="text-xs space-y-1">
                        <p className="font-bold">Core Rules:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {pkg.revisionSheets.onePageCheatSheet.coreRules.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ClassroomDialog>
  );
}
