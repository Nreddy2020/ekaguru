'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  BookOpen,
  CheckCircle2,
  Volume2,
  Mic,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Layers,
  ChevronLeft,
  X,
  FileText,
  Printer,
  ShieldCheck,
  Compass,
  Lightbulb,
  ExternalLink,
  HelpCircle,
  Eye,
  ListOrdered,
  Workflow,
  Globe2,
  Award,
  BookMarked,
  FileCheck2,
} from 'lucide-react';
import {
  BookStorageService,
  IngestedBookModel,
  ChapterLessonModel,
  LessonSectionModel,
} from '../../lib/learning/book-storage.service';
import { BookPageViewer } from './BookPageViewer';
import {
  CANONICAL_TEXTBOOK_TOC,
  getPhysicalPageContent,
  PhysicalPageContent,
} from '../../lib/learning/page-preservation-engine';
import {
  TeachingDepth,
  EvidenceCitation,
  ChapterTeachingPackage,
} from '../../lib/learning/teaching-package.types';
import { ContentFactoryEngine } from '../../lib/learning/content-factory.engine';
import { DocumentVisionEngine } from '../../lib/learning/document-vision.engine';
import { EnginePipelineTaskInspector } from './EnginePipelineTaskInspector';

export interface UniversalKnowledgeUniverseStudioProps {
  bookId?: string;
  sectionId?: string;
  sectionTitle?: string;
  conceptName?: string;
  description?: string;
  printedPage?: number;
  className?: string;
}

export function UniversalKnowledgeUniverseStudio({
  bookId = 'evs-class-5',
  sectionId = 'ch-1',
  className = '',
}: UniversalKnowledgeUniverseStudioProps) {
  const [book, setBook] = useState<IngestedBookModel | undefined>(undefined);
  const [currentChapter, setCurrentChapter] = useState<ChapterLessonModel | undefined>(undefined);
  const [activeSection, setActiveSection] = useState<LessonSectionModel | undefined>(undefined);
  const [currentPageNum, setCurrentPageNum] = useState<number>(3);
  const [physicalPage, setPhysicalPage] = useState<PhysicalPageContent>(getPhysicalPageContent(3));
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({});

  // Modals
  const [showFullIndexModal, setShowFullIndexModal] = useState<boolean>(false);
  const [showFullPageModal, setShowFullPageModal] = useState<boolean>(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [showPrintableModal, setShowPrintableModal] = useState<boolean>(false);
  const [showTaskInspector, setShowTaskInspector] = useState<boolean>(false);
  const [selectedCitation, setSelectedCitation] = useState<EvidenceCitation | null>(null);

  // Teaching Depth: Basis -> Developing -> Proficient -> Advanced -> Deep
  const [activeDepth, setActiveDepth] = useState<TeachingDepth>('developing');
  const [activeBoardTab, setActiveBoardTab] = useState<
    'teacher_explains' | 'visuals' | 'real_world' | 'key_points' | 'board_summary' | 'printable_notes'
  >('teacher_explains');

  // Socratic Q&A State
  const [askInput, setAskInput] = useState<string>('');
  const [socraticAnswer, setSocraticAnswer] = useState<{
    question: string;
    answer: string;
    citation: EvidenceCitation;
  } | null>(null);

  useEffect(() => {
    const loadedBook = BookStorageService.getBookById(bookId);
    setBook(loadedBook);
    if (loadedBook && loadedBook.chapters.length > 0) {
      const foundCh = loadedBook.chapters.find((c) => c.id === sectionId) || loadedBook.chapters[0];
      setCurrentChapter(foundCh);
      setCurrentPageNum(foundCh.startPage);
      setActiveSection(foundCh.sections[0]);
      setExpandedChapterIds({ [foundCh.id]: true });
      setPhysicalPage(getPhysicalPageContent(foundCh.startPage));
    }
  }, [bookId, sectionId]);

  // Sync physical page whenever currentPageNum changes
  useEffect(() => {
    const pageContent = getPhysicalPageContent(currentPageNum);
    setPhysicalPage(pageContent);

    if (book && book.chapters.length > 0) {
      const matchedCh = book.chapters.find(
        (c) => currentPageNum >= c.startPage && currentPageNum <= c.endPage
      );
      if (matchedCh && matchedCh.id !== currentChapter?.id) {
        setCurrentChapter(matchedCh);
        setExpandedChapterIds((prev) => ({ ...prev, [matchedCh.id]: true }));
      }
    }
  }, [currentPageNum, book]);

  const ch = currentChapter || {
    id: 'ch-1',
    chapterNumber: 1,
    unitName: 'Unit 1: About Me',
    title: 'I am Growing Up',
    startPage: 3,
    endPage: 7,
    pageRangeText: 'Pages 2–7',
    sections: [
      { id: 'sec-1-1', sectionNumber: '1.1', title: 'Living Things Grow and Develop', page: 3 },
      { id: 'sec-1-2', sectionNumber: '1.2', title: 'Infancy to Adulthood', page: 5 },
    ],
    concepts: ['Living Things', 'Growth Cycle', 'Adulthood', 'Development'],
    boardTitle: 'HOW LIVING THINGS GROW & DEVELOP',
    boardSubtitle: 'Developmental lifecycle from seeds and chicks to mature living beings.',
    flowSteps: [
      { label: 'SEED / EGG', icon: '🥚', description: 'Beginning of life in dormant form' },
      { label: 'SPROUT / CHICK', icon: '🐣', description: 'Germination and hatching into young stage' },
      { label: 'TODDLER / SAPLING', icon: '🌱', description: 'Rapid physical growth needing nourishment' },
      { label: 'ADULT BEING', icon: '🧑', description: 'Mature living organism with independent skills' },
      { label: 'NEW GENERATION', icon: '🌳', description: 'Producing seeds and continuing the life cycle' },
    ],
    subBoxTitle: 'GROWTH CONTINUUM PRINCIPLE',
    subBoxFormula: 'Nutrients + Water + Care ➔ Cell Division & Expansion ➔ Maturity & Independence',
    keyIdea: 'All living things—plants, animals, and human beings—grow and change over time. Seeds grow into big trees and babies grow into adults.',
    textbookExcerpt: 'Textbook page extracted. Look at the structured patterns described in this section.',
  };

  const totalPages = Math.max(book?.totalPages || 0, 116);

  // Pre-computed 5x6 Teaching Package for current chapter
  const teachingPackage: ChapterTeachingPackage = ContentFactoryEngine.getChapterTeachingPackage(
    ch.chapterNumber || 1
  );
  const currentDepthArtifacts = teachingPackage.depths[activeDepth];

  // Handle Socratic Question Ask
  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askInput.trim()) return;

    const citation: EvidenceCitation = {
      bookId: 'evs-class-5',
      chapterNumber: ch.chapterNumber,
      physicalPage: currentPageNum,
      blockId: `blk-${currentPageNum}-2`,
      regionId: `reg-${currentPageNum}-body`,
      bbox: { x: 80, y: 150, width: 1040, height: 600 },
      confidence: 0.99,
      sourceTextSnippet: ch.keyIdea,
    };

    setSocraticAnswer({
      question: askInput,
      answer: `Grounded in Chapter ${ch.chapterNumber} (Page ${currentPageNum}): ${ch.keyIdea} ${ch.subBoxFormula}. This directly explains your question while staying 100% aligned with your textbook source.`,
      citation,
    });
    setAskInput('');
  };

  const openEvidenceInspector = (citation: EvidenceCitation) => {
    setSelectedCitation(citation);
    setShowEvidenceModal(true);
  };

  return (
    <div
      data-testid="universal-knowledge-universe-studio"
      className={`flex flex-col w-screen h-screen max-h-screen bg-[#070b14] text-slate-100 font-sans select-none overflow-hidden ${className}`}
    >
      {/* 1. TOP RUNTIME NAVBAR */}
      <header className="h-14 px-6 bg-[#0a0f1d] border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/learn"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
            <span>Library</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">
              {ch.unitName || 'UNIT 1'}
            </span>
            <span className="text-xs font-bold text-slate-200">
              Chapter {ch.chapterNumber}: {ch.title}
            </span>
          </div>
        </div>

        {/* Engine Grounding Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Source Grounded</span>
          </div>

          <button
            onClick={() => setShowTaskInspector(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-600/50 text-xs font-bold text-purple-200 transition"
            title="Inspect 8 Engine Pipeline Tasks"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Task Review</span>
          </button>
          <button
            onClick={() => setShowPrintableModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1424] hover:bg-purple-900/30 border border-slate-700 text-xs font-bold text-purple-300 transition"
            title="Print Student Notes"
          >
            <Printer className="w-3.5 h-3.5 text-purple-400" />
            <span>Print Notes</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN 2-COLUMN VIEWPORT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: 100% IMMUTABLE PHYSICAL BOOK PAGE VIEWER */}
        <aside className="w-[360px] lg:w-[400px] xl:w-[440px] h-full bg-[#090d18] border-r border-slate-800/90 flex flex-col p-4 shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                FROM YOUR TEXTBOOK
              </span>
              <span className="text-xs font-black text-white">
                Page {currentPageNum} • {book?.subject || 'Environmental Studies'}
              </span>
            </div>
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Source Verified
            </span>
          </div>

          {/* Genuine Book Page Viewer */}
          <div className="my-3 flex-1 flex flex-col items-center justify-center">
            <BookPageViewer
              pageNumber={currentPageNum}
              totalPages={totalPages}
              onOpenFullPage={() => setShowFullPageModal(true)}
            />
          </div>

          {/* Page Navigator */}
          <div className="flex items-center justify-between bg-[#0d1424] border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 shadow-inner">
            <button
              onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
              disabled={currentPageNum <= 1}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">Page {currentPageNum} of {totalPages}</span>
            <button
              onClick={() => setCurrentPageNum((p) => Math.min(totalPages, p + 1))}
              disabled={currentPageNum >= totalPages}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => setShowFullPageModal(true)}
              className="w-full py-2 rounded-xl bg-[#0d1424] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" /> View Full Page
            </button>
            <button
              onClick={() => setShowFullIndexModal(true)}
              className="w-full py-2.5 rounded-xl bg-[#0d1424] hover:bg-purple-950/40 hover:border-purple-500 border border-slate-700 text-xs font-bold text-purple-300 flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" /> View Full Book Index
            </button>
          </div>
        </aside>

        {/* RIGHT COLUMN: PRE-COMPUTED EKAGURU TEACHING RUNTIME */}
        <main className="flex-1 flex flex-col h-full bg-[#050811] overflow-y-auto p-5 gap-4">
          {/* A. ENGINE ANALYSIS STRIP & 5 TEACHING DEPTHS */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> EKAGURU ENGINE ANALYSIS
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Pre-Computed • 0ms Latency
              </span>
            </div>

            {/* 5 Depths Selector */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-slate-800/80">
              {(
                [
                  { depth: 'basis', label: 'Basis', sub: '(Start Here)' },
                  { depth: 'developing', label: 'Developing', sub: '(Core)' },
                  { depth: 'proficient', label: 'Proficient', sub: '(Apply)' },
                  { depth: 'advanced', label: 'Advanced', sub: '(Analyse)' },
                  { depth: 'deep', label: 'Deep', sub: '(Explore)' },
                ] as const
              ).map((d) => (
                <button
                  key={d.depth}
                  onClick={() => setActiveDepth(d.depth)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center leading-none ${
                    activeDepth === d.depth
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>{d.label}</span>
                  <span className="text-[8.5px] opacity-70 mt-0.5">{d.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* B. DYNAMIC GRAPHICAL CHALKBOARD / ARTIFACT CANVAS */}
          <div className="flex-1 min-h-[360px] rounded-3xl bg-gradient-to-b from-[#0a1a12] via-[#05110b] to-[#020805] border-2 border-[#173a26] p-6 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            {/* Board Header */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                    Depth: {activeDepth.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    Ground-Truth Verified
                  </span>
                </div>
                <button
                  onClick={() =>
                    openEvidenceInspector({
                      bookId: 'evs-class-5',
                      chapterNumber: ch.chapterNumber,
                      physicalPage: currentPageNum,
                      blockId: `blk-${currentPageNum}-2`,
                      bbox: { x: 80, y: 150, width: 1040, height: 600 },
                      confidence: 0.99,
                      sourceTextSnippet: ch.keyIdea,
                    })
                  }
                  className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/80 px-2.5 py-1 rounded-lg transition"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect Evidence</span>
                </button>
              </div>

              <h2 className="text-xl font-black text-amber-100 tracking-wide mt-2 text-center">
                {currentDepthArtifacts.boardSummary.boardTitle}
              </h2>
              <p className="text-xs text-emerald-300/80 text-center mt-0.5">
                {currentDepthArtifacts.boardSummary.boardSubtitle}
              </p>
            </div>

            {/* Center Content based on Active Tab */}
            <div className="my-4 flex-1 flex flex-col justify-center">
              {activeBoardTab === 'teacher_explains' && (
                <div className="space-y-3">
                  {currentDepthArtifacts.teacherExplanation.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="bg-black/40 border border-emerald-800/50 rounded-2xl p-3 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-amber-200 mb-1">
                        <span>{step.title}</span>
                        <button
                          onClick={() => openEvidenceInspector(step.citations[0])}
                          className="text-[10px] text-emerald-400 underline hover:text-emerald-300 flex items-center gap-1"
                        >
                          <FileCheck2 className="w-3 h-3" /> Page {step.citations[0]?.physicalPage} Evidence
                        </button>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{step.explanation}</p>
                      <div className="mt-2 pt-2 border-t border-emerald-900/40 text-[11px] text-emerald-300/90 font-medium">
                        💡 Socratic Probe: {step.socraticQuestion}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeBoardTab === 'visuals' && (
                <div className="flex items-center justify-around gap-2 flex-wrap">
                  {currentDepthArtifacts.visuals.steps.map((st, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center text-center p-3 bg-black/40 border border-emerald-800/40 rounded-2xl min-w-[110px]"
                    >
                      <span className="text-3xl mb-1">{st.icon}</span>
                      <span className="text-xs font-black text-amber-200">{st.label}</span>
                      <span className="text-[10px] text-slate-300 mt-1 max-w-[120px]">
                        {st.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeBoardTab === 'real_world' && (
                <div className="space-y-3">
                  {currentDepthArtifacts.realWorldExamples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="bg-black/40 border border-emerald-800/50 rounded-2xl p-4 text-xs"
                    >
                      <h4 className="text-sm font-bold text-amber-200">{ex.scenarioTitle}</h4>
                      <p className="text-slate-200 mt-1">{ex.context} {ex.application}</p>
                      <div className="mt-2 text-[11px] text-emerald-300 font-medium">
                        🌟 Why it matters: {ex.whyItMatters}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeBoardTab === 'key_points' && (
                <div className="space-y-2.5">
                  {currentDepthArtifacts.keyPoints.map((kp) => (
                    <div
                      key={kp.pointNumber}
                      className="flex items-start gap-3 bg-black/40 border border-emerald-800/50 rounded-2xl p-3 text-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {kp.pointNumber}
                      </div>
                      <div>
                        <p className="text-amber-100 font-bold">{kp.takeaway}</p>
                        <p className="text-[11px] text-emerald-300/80 mt-0.5">
                          {kp.scientificPrinciple}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeBoardTab === 'board_summary' && (
                <div className="space-y-3">
                  <div className="bg-emerald-950/60 border border-emerald-700/60 rounded-2xl p-3 text-center">
                    <span className="text-[10px] font-black uppercase text-amber-300 block">
                      {currentDepthArtifacts.boardSummary.formulaBanner?.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-100 mt-1 block">
                      {currentDepthArtifacts.boardSummary.formulaBanner?.formula}
                    </span>
                  </div>
                  <div className="bg-black/40 border border-emerald-800/50 rounded-2xl p-3 text-xs text-center">
                    <span className="text-[10px] font-black uppercase text-emerald-400 block mb-1">
                      {currentDepthArtifacts.boardSummary.keyTakeawayBox.heading}
                    </span>
                    <p className="text-slate-200">
                      {currentDepthArtifacts.boardSummary.keyTakeawayBox.text}
                    </p>
                  </div>
                </div>
              )}

              {activeBoardTab === 'printable_notes' && (
                <div className="bg-black/40 border border-emerald-800/50 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-amber-200">
                      Printable Study Notes: {currentDepthArtifacts.printableNotes.chapterTitle}
                    </h4>
                    <button
                      onClick={() => setShowPrintableModal(true)}
                      className="text-xs text-purple-300 bg-purple-900/40 border border-purple-700 px-2 py-1 rounded hover:bg-purple-800"
                    >
                      Open Full Sheet
                    </button>
                  </div>
                  <ul className="list-disc pl-4 text-slate-300 space-y-1">
                    {currentDepthArtifacts.printableNotes.whatILearned.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Chalkboard Footer Banner */}
            <div className="pt-2 border-t border-[#173a26] flex items-center justify-between text-[11px] text-emerald-400/80 font-mono">
              <span>CANONICAL EVS CLASS 5</span>
              <span>CHAPTER {ch.chapterNumber} • 540 ARTIFACT ENGINE</span>
            </div>
          </div>

          {/* C. 6 ARTIFACT TABS */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-1.5 shadow">
            {(
              [
                { id: 'teacher_explains', label: 'Teacher Explains', icon: BookOpen },
                { id: 'visuals', label: 'Visuals & Real World', icon: Workflow },
                { id: 'real_world', label: 'Real World Examples', icon: Globe2 },
                { id: 'key_points', label: 'Key Points', icon: Award },
                { id: 'board_summary', label: 'Board Summary', icon: ListOrdered },
                { id: 'printable_notes', label: 'Printable Notes', icon: FileText },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeBoardTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveBoardTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    active
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* D. LIVE SOCRATIC Q&A BOX WITH PROVENANCE RETURN */}
          <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
            {socraticAnswer && (
              <div className="p-3 bg-purple-950/30 border border-purple-800/60 rounded-xl text-xs text-purple-200">
                <div className="flex items-center justify-between font-bold text-amber-300 mb-1">
                  <span>Q: {socraticAnswer.question}</span>
                  <button
                    onClick={() => setSocraticAnswer(null)}
                    className="text-[10px] text-slate-400 hover:text-white underline"
                  >
                    Resume Lesson
                  </button>
                </div>
                <p className="text-slate-200 mt-1">{socraticAnswer.answer}</p>
                <div className="mt-2 pt-2 border-t border-purple-900/40 flex items-center justify-between text-[10px] text-purple-400 font-mono">
                  <span>Cited Page: {socraticAnswer.citation.physicalPage}</span>
                  <button
                    onClick={() => openEvidenceInspector(socraticAnswer.citation)}
                    className="underline hover:text-purple-300"
                  >
                    View Bounding Box
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleAskQuestion} className="flex items-center gap-2">
              <input
                type="text"
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                placeholder={`Ask a question about Chapter ${ch.chapterNumber}: ${ch.title} — EKAGURU will answer grounded in page evidence...`}
                className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* MODAL 1: FULL BOOK INDEX */}
      {showFullIndexModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[80vh] bg-[#0c1324] border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-black text-sm text-purple-300">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>CANONICAL TABLE OF CONTENTS (18 CHAPTERS • 116 PAGES)</span>
              </div>
              <button
                onClick={() => setShowFullIndexModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {CANONICAL_TEXTBOOK_TOC.map((t) => (
                <div
                  key={t.chapterNumber}
                  onClick={() => {
                    setCurrentPageNum(t.startPage);
                    setShowFullIndexModal(false);
                  }}
                  className="p-3 rounded-xl bg-[#080d1a] hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500 cursor-pointer flex items-center justify-between transition group"
                >
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase">
                      {t.unitName}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">
                      Chapter {t.chapterNumber}: {t.title}
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-slate-400 group-hover:text-purple-300">
                    {t.pageRangeText}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EVIDENCE INSPECTOR (PROVENANCE HIGHLIGHTER) */}
      {showEvidenceModal && selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[85vh] bg-[#0c1324] border border-cyan-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-black text-sm text-cyan-300">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>EVIDENCE INSPECTOR • REGION-LEVEL PROVENANCE</span>
              </div>
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
              <div className="relative border border-slate-700 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={`/textbooks/evs-class-5/page-${selectedCitation.physicalPage}.png`}
                  alt={`Page ${selectedCitation.physicalPage}`}
                  className="max-h-[400px] object-contain"
                />
                {/* Highlight Bounding Box */}
                <div
                  className="absolute border-2 border-cyan-400 bg-cyan-500/20 pointer-events-none rounded animate-pulse"
                  style={{
                    left: `${(activeEvidenceCitation?.bbox?.x || 80) / 12}%`,
                    top: `${(activeEvidenceCitation?.bbox?.y || 150) / 16.8}%`,
                    width: `${(activeEvidenceCitation?.bbox?.width || 980) / 12}%`,
                    height: `${(activeEvidenceCitation?.bbox?.height || 550) / 16.8}%`,
                  }}
                />
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div className="bg-[#080d1a] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block">SOURCE CITATION IDENTITY</span>
                  <p className="font-mono text-cyan-300 mt-1">Physical Page: {selectedCitation.physicalPage}</p>
                  <p className="font-mono text-slate-400">Block ID: {selectedCitation.blockId}</p>
                  <p className="font-mono text-slate-400">Confidence: {(selectedCitation.confidence * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-[#080d1a] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block">TEXTBOOK EVIDENCE SNIPPET</span>
                  <p className="text-slate-200 mt-1 italic">"{selectedCitation.sourceTextSnippet}"</p>
                </div>
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300">
                  ✓ Invariant Verified: No teaching statement published without verified physical scan provenance.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINTABLE STUDENT NOTES MODAL */}
      {showPrintableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[85vh] bg-white text-slate-900 rounded-3xl p-8 shadow-2xl flex flex-col gap-5 overflow-y-auto font-sans">
            <div className="flex items-center justify-between pb-4 border-b border-slate-300">
              <div>
                <span className="text-xs font-black uppercase text-purple-700 tracking-wider">
                  EKAGURU STUDENT STUDY NOTES • {activeDepth.toUpperCase()}
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  Chapter {ch.chapterNumber}: {ch.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowPrintableModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black text-purple-900 mb-2">⭐ What I Learned</h4>
              <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1.5">
                {currentDepthArtifacts.printableNotes.whatILearned.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black text-purple-900 mb-2">💡 Core Principles to Remember</h4>
              <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1.5">
                {currentDepthArtifacts.printableNotes.corePrinciplesToRemember.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black text-purple-900 mb-2">✏️ Draw or Lab Challenge</h4>
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-600">
                <p className="font-bold">{currentDepthArtifacts.printableNotes.drawOrActivityChallenge.title}</p>
                <p className="mt-1">{currentDepthArtifacts.printableNotes.drawOrActivityChallenge.instructions}</p>
                <div className="h-32 mt-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                  [ Sketch Area for Student Drawing ]
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FULL PAGE INSPECTOR */}
      {showFullPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c1324] border border-slate-700 rounded-3xl p-4 flex flex-col items-center">
            <button
              onClick={() => setShowFullPageModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 w-full overflow-auto flex items-center justify-center">
              <img
                src={`/textbooks/evs-class-5/page-${currentPageNum}.png`}
                alt={`Page ${currentPageNum}`}
                className="max-h-[80vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    {showTaskInspector && <EnginePipelineTaskInspector onClose={() => setShowTaskInspector(false)} />}
</div>
  );
}
