"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  HelpCircle,
  Layers,
  Map as MapIcon,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { ClassroomDialog } from "./ClassroomDialog";
import {
  BookKnowledgeMap,
  DiagnosticRevisitGuidance,
  fetchBookKnowledgeMap,
  fetchRevisitGuidance,
  refreshBookKnowledgeMap,
  TopicNode,
} from "../../lib/learning/guru-book-map-api";

export interface BookKnowledgeMapModalProps {
  bookId: string;
  currentPage: number;
  onClose: () => void;
  onSelectPage: (page: number) => void;
  initialMap?: BookKnowledgeMap;
}

type TabType = "roadmap" | "dependencies" | "revisit" | "glossary";

export function BookKnowledgeMapModal({
  bookId,
  currentPage,
  onClose,
  onSelectPage,
  initialMap,
}: BookKnowledgeMapModalProps) {
  const [tab, setTab] = useState<TabType>("roadmap");
  const [map, setMap] = useState<BookKnowledgeMap | null>(initialMap || null);
  const [loading, setLoading] = useState(!initialMap);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Diagnostic revisit state
  const [revisitPage, setRevisitPage] = useState<number>(currentPage);
  const [revisitGuidance, setRevisitGuidance] = useState<DiagnosticRevisitGuidance | null>(null);
  const [revisitLoading, setRevisitLoading] = useState(false);

  useEffect(() => {
    if (initialMap) {
      setMap(initialMap);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");

    fetchBookKnowledgeMap(bookId)
      .then((data) => {
        if (!cancelled) {
          setMap(data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || "Could not load book knowledge map.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, initialMap]);

  // Load revisit guidance when tab is 'revisit' or revisitPage changes
  useEffect(() => {
    if (tab !== "revisit") return;
    let cancelled = false;
    setRevisitLoading(true);

    fetchRevisitGuidance(bookId, revisitPage)
      .then((data) => {
        if (!cancelled) {
          setRevisitGuidance(data);
          setRevisitLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRevisitLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, revisitPage, tab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const refreshed = await refreshBookKnowledgeMap(bookId);
      setMap(refreshed);
    } catch (err: any) {
      setError(err?.message || "Could not refresh book knowledge map.");
    } finally {
      setRefreshing(false);
    }
  };

  const filteredDependencies = useMemo(() => {
    if (!map?.dependencies) return [];
    if (!searchQuery.trim()) return map.dependencies;
    const q = searchQuery.toLowerCase();
    return map.dependencies.filter(
      (dep) =>
        dep.sourceTopicTitle.toLowerCase().includes(q) ||
        dep.targetTopicTitle.toLowerCase().includes(q) ||
        dep.reason.toLowerCase().includes(q)
    );
  }, [map?.dependencies, searchQuery]);

  const filteredKeyTerms = useMemo(() => {
    if (!map?.keyTerms) return [];
    if (!searchQuery.trim()) return map.keyTerms;
    const q = searchQuery.toLowerCase();
    return map.keyTerms.filter(
      (kt) =>
        kt.term.toLowerCase().includes(q) ||
        kt.definition.toLowerCase().includes(q)
    );
  }, [map?.keyTerms, searchQuery]);

  return (
    <ClassroomDialog title="Book Knowledge Map & Roadmap" onClose={onClose}>
      <div className="flex flex-col h-[75vh] max-h-[800px] w-full max-w-4xl text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* Subheader & Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm text-slate-600 dark:text-slate-300">
              {map?.title || bookId}
            </span>
            {map && (
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {map.totalPages} Pages • {map.chapters.length} Chapters
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setTab("roadmap")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 ${
                tab === "roadmap"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <MapIcon size={13} />
              <span>Roadmap</span>
            </button>
            <button
              onClick={() => setTab("dependencies")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 ${
                tab === "dependencies"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <GitBranch size={13} />
              <span>Dependencies</span>
            </button>
            <button
              onClick={() => setTab("revisit")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 ${
                tab === "revisit"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <HelpCircle size={13} />
              <span>Struggle Guidance</span>
            </button>
            <button
              onClick={() => setTab("glossary")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 ${
                tab === "glossary"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <BookOpen size={13} />
              <span>Key Terms</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              title="Refresh knowledge map"
              aria-label="Refresh knowledge map"
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 disabled:opacity-50 ml-1"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 space-y-2 text-slate-500">
              <RefreshCw size={24} className="animate-spin text-emerald-600" />
              <p className="text-sm">Synthesizing whole-book knowledge map...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-sm">
              <p className="font-medium">Notice</p>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && map && (
            <>
              {/* 1. ROADMAP VIEW */}
              {tab === "roadmap" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    A whole-book learning progression structured into chapters and core topics. Click any page to navigate directly.
                  </p>
                  <div className="space-y-4">
                    {map.chapters.map((ch) => (
                      <div
                        key={ch.chapterNumber}
                        className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded">
                              Chapter {ch.chapterNumber}
                            </span>
                            <h3 className="font-semibold text-sm">{ch.title}</h3>
                          </div>
                          <span className="text-xs text-slate-400">
                            Pages {ch.pageStart}–{ch.pageEnd}
                          </span>
                        </div>

                        {ch.topics.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No topics extracted yet for this chapter.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {ch.topics.map((topic) => (
                              <div
                                key={topic.topicId}
                                className={`p-3 rounded-lg border text-left transition-all ${
                                  topic.physicalPage === currentPage
                                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1 mb-1">
                                  <h4 className="text-xs font-semibold leading-snug line-clamp-1">
                                    {topic.title}
                                  </h4>
                                  <button
                                    onClick={() => {
                                      onSelectPage(topic.physicalPage);
                                      onClose();
                                    }}
                                    className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white transition-colors"
                                  >
                                    Page {topic.physicalPage}
                                  </button>
                                </div>
                                {topic.summary && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-1.5">
                                    {topic.summary}
                                  </p>
                                )}
                                {topic.keyTerms.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {topic.keyTerms.slice(0, 3).map((term, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[9px] px-1 py-0.2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded"
                                      >
                                        {term}
                                      </span>
                                    ))}
                                    {topic.keyTerms.length > 3 && (
                                      <span className="text-[9px] text-slate-400">
                                        +{topic.keyTerms.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. DEPENDENCIES VIEW */}
              {tab === "dependencies" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      Directed concept dependency graph (DAG): to master topic X on page B, prior foundational concept Y on page A is required.
                    </p>
                    <div className="relative w-48 shrink-0">
                      <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search dependencies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  {filteredDependencies.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No matching concept dependencies found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredDependencies.map((dep) => (
                        <div
                          key={dep.id}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          {/* Prerequisite -> Dependent */}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-amber-700 dark:text-amber-400">
                                {dep.sourceTopicTitle}
                              </span>
                              <span className="text-[10px] text-slate-400">(p. {dep.sourcePage})</span>
                              <ChevronRight size={14} className="text-slate-400 shrink-0" />
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                {dep.targetTopicTitle}
                              </span>
                              <span className="text-[10px] text-slate-400">(p. {dep.targetPage})</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                              {dep.reason}
                            </p>
                          </div>

                          {/* Controls & Badges */}
                          <div className="flex items-center space-x-2 shrink-0">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                dep.strength === "essential"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                              }`}
                            >
                              {dep.strength}
                            </span>
                            <button
                              onClick={() => {
                                onSelectPage(dep.sourcePage);
                                onClose();
                              }}
                              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[10px]"
                            >
                              Go to Prerequisite (p. {dep.sourcePage})
                            </button>
                            <button
                              onClick={() => {
                                onSelectPage(dep.targetPage);
                                onClose();
                              }}
                              className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-[10px]"
                            >
                              Go to Topic (p. {dep.targetPage})
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. DIAGNOSTIC REVISIT GUIDANCE VIEW */}
              {tab === "revisit" && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 font-semibold text-amber-800 dark:text-amber-300">
                      <Sparkles size={14} />
                      <span>Diagnostic Struggle Guidance</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      When a student struggles with comprehension on a page or fails practice questions, the Guru Engine diagnoses whether earlier foundational concepts should be revisited before retrying.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Evaluate struggle for page:
                    </label>
                    <select
                      value={revisitPage}
                      onChange={(e) => setRevisitPage(Number(e.target.value))}
                      className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 font-medium"
                    >
                      {Array.from({ length: map.totalPages }, (_, i) => i + 1).map((p) => (
                        <option key={p} value={p}>
                          Page {p} {p === currentPage ? "(Current)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {revisitLoading ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <RefreshCw size={18} className="animate-spin inline mr-2" />
                      Computing diagnostic revisit guidance...
                    </div>
                  ) : revisitGuidance ? (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">
                          Target: {revisitGuidance.currentTopicTitle} (Page {revisitGuidance.currentPage})
                        </span>
                        {revisitGuidance.hasPrerequisite ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                            Prerequisite Found
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                            Foundational Page
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {revisitGuidance.hasPrerequisite
                            ? `Struggling on Page ${revisitGuidance.currentPage}? Revisit Page ${revisitGuidance.recommendedPage}`
                            : `Foundational topic on Page ${revisitGuidance.currentPage}`}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {revisitGuidance.reason}
                        </p>
                        {revisitGuidance.prerequisiteTopicTitle && (
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                            Prior Foundation: "{revisitGuidance.prerequisiteTopicTitle}"
                          </p>
                        )}
                      </div>

                      <div className="pt-2 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onSelectPage(revisitGuidance.recommendedPage);
                            onClose();
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
                        >
                          {revisitGuidance.hasPrerequisite
                            ? `Jump to Prerequisite (Page ${revisitGuidance.recommendedPage})`
                            : `Review Page ${revisitGuidance.recommendedPage}`}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* 4. KEY TERMS GLOSSARY VIEW */}
              {tab === "glossary" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      Core vocabulary introduced throughout the textbook.
                    </p>
                    <div className="relative w-48 shrink-0">
                      <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search key terms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  {filteredKeyTerms.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No key terms found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredKeyTerms.map((kt, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white">
                              {kt.term}
                            </h4>
                            <button
                              onClick={() => {
                                onSelectPage(kt.introducedOnPage);
                                onClose();
                              }}
                              className="text-[10px] font-medium text-emerald-600 hover:underline"
                            >
                              Page {kt.introducedOnPage}
                            </button>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                            {kt.definition || "Concept definition tracked in chapter notes."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ClassroomDialog>
  );
}
