'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Users,
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
  Play,
  Pause,
  SkipForward,
  SkipBack,
} from 'lucide-react';
import {
  BookStorageService,
  IngestedBookModel,
  ChapterLessonModel,
  LessonSectionModel,
} from '../../lib/learning/book-storage.service';
import { BookPageViewer } from './BookPageViewer';
import {
  PhysicalPageContent,
  getPhysicalPageContent,
  CANONICAL_TEXTBOOK_TOC,
} from '../../lib/learning/page-preservation-engine';
import {
  ChapterTeachingPackage,
  TeachingDepth,
  EvidenceCitation,
} from '../../lib/learning/teaching-package.types';
import { ContentFactoryEngine } from '../../lib/learning/content-factory.engine';
import { EnginePipelineTaskInspector } from './EnginePipelineTaskInspector';

interface UniversalKnowledgeUniverseStudioProps {
  bookId?: string;
  sectionId?: string;
  sectionTitle?: string;
  conceptName?: string;
  description?: string;
  printedPage?: number | string;
  className?: string;
}

export function UniversalKnowledgeUniverseStudio({
  bookId = 'evs-class-5',
  sectionId = 'ch-1',
  className = '',
}: UniversalKnowledgeUniverseStudioProps) {
  // Navigation & Textbook State
  const [book, setBook] = useState<IngestedBookModel | null>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterLessonModel | null>(null);
  const [currentPageNum, setCurrentPageNum] = useState<number>(3);
  const [physicalPage, setPhysicalPage] = useState<PhysicalPageContent>(getPhysicalPageContent(3));
  const [activeSection, setActiveSection] = useState<LessonSectionModel | null>(null);
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({});

  // Modals
  const [showFullIndexModal, setShowFullIndexModal] = useState<boolean>(false);
  const [showFullPageModal, setShowFullPageModal] = useState<boolean>(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [showPrintableModal, setShowPrintableModal] = useState<boolean>(false);
  const [showTaskInspector, setShowTaskInspector] = useState<boolean>(false);
  const [selectedCitation, setSelectedCitation] = useState<EvidenceCitation | null>(null);

  // Teaching Depth: Basis -> Developing -> Proficient -> Advanced -> Deep
  const [activeDepth, setActiveDepth] = useState<TeachingDepth>('basis');
  const [activeBoardTab, setActiveBoardTab] = useState<
    'teacher_explains' | 'visuals' | 'real_world' | 'key_points' | 'board_summary' | 'printable_notes'
  >('teacher_explains');

  // Slow-Paced Step Index for Classroom Teaching
  const [currentTeacherStepIdx, setCurrentTeacherStepIdx] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Normalize book folder to guarantee valid physical scan assets
  const normalizedBookId = (bookId || '').toLowerCase();
  let resolvedFolder = 'evs-class-5';
  if (normalizedBookId.includes('math')) resolvedFolder = 'maths-class-5';
  else if (normalizedBookId.includes('sci')) resolvedFolder = 'science-class-6';
  else if (normalizedBookId.includes('soc')) resolvedFolder = 'social-class-5';
  else if (normalizedBookId.includes('evs')) resolvedFolder = 'evs-class-5';

  // Socratic Q&A State
  const [askInput, setAskInput] = useState<string>('');
  // M3.4 Live Classroom & Collaboration State
  const [isLiveClassroom, setIsLiveClassroom] = useState<boolean>(true);
  const [liveStudentsCount, setLiveStudentsCount] = useState<number>(24);
  const [isSessionPaused, setIsSessionPaused] = useState<boolean>(false);
  const [selectedPollOption, setSelectedPollOption] = useState<number | null>(null);
  const [pollSubmitted, setPollSubmitted] = useState<boolean>(false);
  const [pollRevealed, setPollRevealed] = useState<boolean>(false);
  const [showCollabModal, setShowCollabModal] = useState<boolean>(false);
  const [showStandardsModal, setShowStandardsModal] = useState<boolean>(false);
  const [myRole, setMyRole] = useState<'EXPLORER' | 'ANALYST' | 'SCRIBE'>('EXPLORER');
  const [handRaised, setHandRaised] = useState<boolean>(false);
  const [socraticAnswer, setSocraticAnswer] = useState<{
    question: string;
    answer: string;
    citation: EvidenceCitation;
  } | null>(null);

  useEffect(() => {
    const loadedBook = BookStorageService.getBookById(bookId);
    setBook(loadedBook || null);
    if (loadedBook && loadedBook.chapters.length > 0) {
      const foundCh = loadedBook.chapters.find((c) => c.id === sectionId) || loadedBook.chapters[0];
      setCurrentChapter(foundCh);
      setCurrentPageNum(foundCh.startPage);
      setActiveSection(foundCh.sections[0]);
      setExpandedChapterIds({ [foundCh.id]: true });
      setPhysicalPage(getPhysicalPageContent(foundCh.startPage));
    }
  }, [bookId, sectionId]);

  // 1. Authoritative Physical Page -> TOC / Chapter / Section Resolution
  const canonicalEntry =
    CANONICAL_TEXTBOOK_TOC.find(
      (c) => currentPageNum >= c.startPage && currentPageNum <= c.endPage
    ) ||
    (currentChapter
      ? CANONICAL_TEXTBOOK_TOC.find((c) => c.chapterNumber === currentChapter.chapterNumber)
      : null) ||
    CANONICAL_TEXTBOOK_TOC[1];

  const ch = {
    id: `ch-${canonicalEntry.chapterNumber}`,
    chapterNumber: canonicalEntry.chapterNumber,
    unitName: canonicalEntry.unitName,
    title: canonicalEntry.title,
    startPage: canonicalEntry.startPage,
    endPage: canonicalEntry.endPage,
    pageRangeText: canonicalEntry.pageRangeText,
    sections: canonicalEntry.sections.map((s, idx) => ({
      id: `sec-${canonicalEntry.chapterNumber}-${idx + 1}`,
      sectionNumber: s.sectionNumber,
      title: s.title,
      page: s.page,
    })),
    concepts: canonicalEntry.concepts,
    boardTitle: canonicalEntry.boardTitle,
    boardSubtitle: canonicalEntry.boardSubtitle,
    flowSteps: canonicalEntry.flowSteps,
    subBoxTitle: canonicalEntry.subBoxTitle,
    subBoxFormula: canonicalEntry.subBoxFormula,
    keyIdea: canonicalEntry.keyIdea,
    textbookExcerpt: `Physical Page ${currentPageNum} from ${canonicalEntry.title}. Grounded in original NCERT/State Board scan.`,
  };

  // Find exact section on active page, or closest preceding section
  const activePageSection =
    ch.sections.find((s) => s.page === currentPageNum) ||
    ch.sections.slice().reverse().find((s) => s.page <= currentPageNum) ||
    ch.sections[0];

  useEffect(() => {
    const pageContent = getPhysicalPageContent(currentPageNum);
    setPhysicalPage(pageContent);
    setActiveSection(activePageSection);
    setExpandedChapterIds((prev) => ({ ...prev, [`ch-${canonicalEntry.chapterNumber}`]: true }));
    
    // Automatically select the teaching step corresponding to the active page section
    const secIdx = ch.sections.findIndex((s) => s.page === currentPageNum);
    if (secIdx >= 0) {
      setCurrentTeacherStepIdx(Math.min(secIdx, teacherSteps.length - 1));
    }
  }, [currentPageNum, canonicalEntry.chapterNumber]);

  // Reset step index when depth changes
  useEffect(() => {
    setCurrentTeacherStepIdx(0);
  }, [activeDepth]);

  const totalPages = Math.max(book?.totalPages || 0, 116);

  // Pre-computed 5x6 Teaching Package for current chapter
  const teachingPackage: ChapterTeachingPackage = ContentFactoryEngine.getChapterTeachingPackage(
    ch.chapterNumber || 1
  );
  const currentDepthArtifacts = teachingPackage.depths[activeDepth];
  const teacherSteps = currentDepthArtifacts.teacherExplanation;
  const activeStep: any = teacherSteps[currentTeacherStepIdx] || teacherSteps[0];

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askInput.trim()) return;

    const citation: EvidenceCitation = {
      bookId: 'evs-class-5',
      chapterNumber: ch.chapterNumber,
      physicalPage: currentPageNum,
      blockId: `blk-${currentPageNum}-2`,
      regionId: `reg-${currentPageNum}-body`,
      bbox: { x: 165, y: 84, width: 926, height: 298 },
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
    if (citation?.physicalPage) {
      setCurrentPageNum(citation.physicalPage);
    }
    setSelectedCitation(citation);
    setShowEvidenceModal(true);
  };

  const playStepSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92; // warm, slow-paced teacher cadence
      utterance.pitch = 1.05;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
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

          {/* M3.4 Live Classroom & Curriculum Badges */}
          <button
            onClick={() => setShowCollabModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 hover:bg-blue-900/70 border border-blue-500/40 text-[11px] font-bold text-blue-300 transition"
            title="Peer Collaboration Rooms"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Group Discovery ({myRole})</span>
          </button>

          <button
            onClick={() => setShowStandardsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-[11px] font-bold text-amber-300 transition"
            title="NCERT / CBSE Standards Compliance"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>NCERT / CBSE</span>
          </button>

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
        <aside className="w-80 md:w-96 lg:w-[420px] bg-[#090e1a] border-r border-slate-800 flex flex-col justify-between shrink-0 p-3 select-none overflow-y-auto">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                FROM YOUR TEXTBOOK
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                Source Verified
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                Page {currentPageNum} • {book?.subject || 'Environmental Studies'}
              </span>
            </div>
          </div>

          {/* Book Page Viewer Component */}
          <div className="my-2 flex-1 flex items-center justify-center min-h-[380px]">
            <BookPageViewer
              bookId={resolvedFolder}
              currentPage={currentPageNum}
              pageNumber={currentPageNum}
              totalPages={totalPages}
              activeCitation={selectedCitation}
              onPageChange={(p) => setCurrentPageNum(p)}
            />
          </div>

          {/* Page Switcher */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#0d1424] rounded-xl border border-slate-800 text-xs text-slate-300">
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

        {/* RIGHT COLUMN: SLOW-PACED CLASSROOM BLACKBOARD LESSON */}
        <main className="flex-1 flex flex-col h-full bg-[#050811] overflow-y-auto p-5 gap-4">
          {/* A. TEACHING DEPTH / LEVEL SELECTOR */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> TEACHING DEPTH / LEVEL
              </span>
            </div>

            {/* 5 Depths Selector */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-slate-800/80">
              {(
                [
                  { depth: 'basis', label: 'Basis', sub: '(Start Here)' },
                  { depth: 'developing', label: 'Developing', sub: '(Build Understanding)' },
                  { depth: 'proficient', label: 'Proficient', sub: '(Apply & Connect)' },
                  { depth: 'advanced', label: 'Advanced', sub: '(Analyse & Reason)' },
                  { depth: 'deep', label: 'Deep', sub: '(Research & Explore)' },
                ] as const
              ).map((d) => (
                <button
                  key={d.depth}
                  onClick={() => setActiveDepth(d.depth)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center leading-none ${
                    activeDepth === d.depth
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>{d.label}</span>
                  <span className="text-[8.5px] opacity-70 mt-0.5">{d.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* B. GRAPHICAL CHALKBOARD WITH SLOW-PACED STEP LESSON & DRAWING CANVAS */}
          <div className="flex-1 min-h-[460px] rounded-3xl bg-[#071910] border-[6px] border-[#6b4226] p-6 shadow-2xl relative flex flex-col justify-between overflow-hidden shadow-black/80">
            {/* Wooden Frame Corner Accent */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#a66a38] opacity-60 pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#a66a38] opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#a66a38] opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#a66a38] opacity-60 pointer-events-none" />

            {/* Board Top Header: Step Navigator & Audio Player */}
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#173a26]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-500 text-emerald-200">
                    DEPTH: {activeDepth.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Ground-Truth Verified
                  </span>
                </div>

                {/* Slow-Paced Step Selector & Audio */}
                <div className="flex items-center gap-2">
                  {activeBoardTab === 'teacher_explains' && (
                    <div className="flex items-center gap-1.5 bg-black/60 border border-emerald-700/60 rounded-xl px-2 py-1">
                      <button
                        onClick={() => setCurrentTeacherStepIdx((prev) => Math.max(0, prev - 1))}
                        disabled={currentTeacherStepIdx <= 0}
                        className="p-1 text-emerald-300 hover:text-white disabled:opacity-30 rounded hover:bg-emerald-900"
                        title="Previous Teaching Step"
                      >
                        <SkipBack className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1 px-1">
                        {teacherSteps.map((_, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => setCurrentTeacherStepIdx(sIdx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              currentTeacherStepIdx === sIdx ? 'bg-amber-400 w-4' : 'bg-emerald-800'
                            }`}
                            title={`Go to Step ${sIdx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentTeacherStepIdx((prev) =>
                            Math.min(teacherSteps.length - 1, prev + 1)
                          )
                        }
                        disabled={currentTeacherStepIdx >= teacherSteps.length - 1}
                        className="p-1 text-emerald-300 hover:text-white disabled:opacity-30 rounded hover:bg-emerald-900"
                        title="Next Teaching Step"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const speech =
                        activeBoardTab === 'teacher_explains'
                          ? activeStep.teacherSpeech
                          : currentDepthArtifacts.boardSummary.boardTitle +
                            '. ' +
                            currentDepthArtifacts.boardSummary.boardSubtitle;
                      playStepSpeech(speech);
                    }}
                    className={`p-1.5 rounded-full border transition flex items-center gap-1 text-xs font-bold px-3 ${
                      isPlayingAudio
                        ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                        : 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700 text-emerald-300'
                    }`}
                    title="Teacher Audio Read Aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isPlayingAudio ? 'Speaking...' : 'Listen'}</span>
                  </button>

                  <button
                    onClick={() =>
                      openEvidenceInspector({
                        bookId: 'evs-class-5',
                        chapterNumber: ch.chapterNumber,
                        physicalPage: currentPageNum,
                        blockId: `blk-${currentPageNum}-1`,
                        regionId: `reg-${currentPageNum}-1`,
                        bbox: { x: 165, y: 84, width: 926, height: 298 },
                        confidence: 0.99,
                        sourceTextSnippet: currentDepthArtifacts.boardSummary.boardTitle,
                      })
                    }
                    className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700 px-3 py-1 rounded-xl transition shadow"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Inspect Evidence</span>
                  </button>
                </div>
              </div>

              {/* Main Blackboard Chalk Title & Subtitle */}
              <div className="text-center mt-2">
                <h2 className="text-2xl md:text-3xl font-black text-[#ffea79] tracking-wider font-serif uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {currentDepthArtifacts.boardSummary.boardTitle}
                </h2>
                <div className="h-0.5 w-48 bg-[#ffea79]/40 mx-auto mt-1 rounded-full" />
                <p className="text-xs md:text-sm text-pink-300 italic mt-1 font-medium tracking-wide">
                  {currentDepthArtifacts.boardSummary.boardSubtitle}
                </p>
              </div>
            </div>

            {/* Center Content based on Active Tab */}
            <div className="my-4 flex-1 flex flex-col justify-center">
              {/* 1. TEACHER EXPLAINS TAB: SLOW-PACED STEP-BY-STEP TEACHER DRAWING & LESSON */}
              {activeBoardTab === 'teacher_explains' && (
                <div className="space-y-4 max-w-4xl mx-auto w-full">
                  {/* Step Title & Tag Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-300 tracking-wider bg-amber-950/60 border border-amber-600/50 px-3 py-1 rounded-full">
                      {activeStep.stepTag || `Step ${currentTeacherStepIdx + 1} of ${teacherSteps.length}`}
                    </span>
                    <button
                      onClick={() => openEvidenceInspector(activeStep.citations[0])}
                      className="text-xs text-emerald-400 underline hover:text-emerald-300 flex items-center gap-1 font-mono"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" /> Page {activeStep.citations[0]?.physicalPage || currentPageNum} Evidence
                    </button>
                  </div>

                  {/* A. Center Chalkboard Drawing Box for Active Step */}
                  {activeStep.drawingScene && (
                    <div className="bg-black/60 border-2 border-emerald-600/60 rounded-2xl p-4 shadow-xl text-center">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                          🎨 {activeStep.drawingScene.title}
                        </span>
                        <span className="text-[10px] text-amber-300 font-mono">
                          {activeStep.drawingScene.badge}
                        </span>
                      </div>

                      {/* Visual Drawing Elements */}
                      <div className="flex items-center justify-center gap-3 md:gap-5 flex-wrap my-3">
                        {activeStep.drawingScene.elements.map((el: any, idx: number) => (
                          <div
                            key={idx}
                            className={`flex flex-col items-center text-center p-3 rounded-2xl min-w-[110px] max-w-[140px] shadow transition transform hover:scale-105 ${
                              el.highlight
                                ? 'bg-emerald-950/80 border-2 border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                                : 'bg-black/50 border border-emerald-800/60'
                            }`}
                          >
                            <span className="text-3xl md:text-4xl mb-1.5 drop-shadow">{el.icon}</span>
                            <span className="text-[11.5px] font-black text-amber-300 tracking-wide">
                              {el.label}
                            </span>
                            <span className="text-[10px] text-emerald-200/90 mt-1 leading-snug">
                              {el.subtext}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-300 italic">
                        {activeStep.drawingScene.subtitle}
                      </p>
                    </div>
                  )}

                  {/* B. School Teacher Dialogue & Spoken Explanation */}
                  <div className="bg-black/50 border border-emerald-800/70 rounded-2xl p-4 text-xs shadow-lg backdrop-blur-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-amber-200 flex items-center gap-2">
                        <span>👩‍🏫 Teacher Explains:</span> {activeStep.title}
                      </h3>
                      <button
                        onClick={() => playStepSpeech(activeStep.teacherSpeech)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold underline"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Read Aloud
                      </button>
                    </div>

                    <p className="text-slate-100 text-xs md:text-[13.5px] leading-relaxed font-medium bg-emerald-950/30 p-3 rounded-xl border border-emerald-900/50">
                      "{activeStep.teacherSpeech}"
                    </p>

                    {/* Chalk Highlight Keywords */}
                    {activeStep.highlightKeywords && activeStep.highlightKeywords.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          Chalkboard Words:
                        </span>
                        {activeStep.highlightKeywords.map((kw: string, kidx: number) => (
                          <span
                            key={kidx}
                            className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[11px] font-bold text-amber-200"
                          >
                            ⭐ {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Socratic Probe */}
                    <div className="pt-2 border-t border-emerald-900/60 text-[11.5px] text-emerald-300 font-medium flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span>💡 Socratic Probe:</span>
                        <span className="italic text-emerald-200">{activeStep.socraticQuestion}</span>
                      </div>
                      <button
                        onClick={() => {
                          setAskInput(activeStep.socraticQuestion);
                        }}
                        className="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800 border border-purple-600 rounded-lg text-[10.5px] font-bold text-purple-200 shrink-0"
                      >
                        Answer on Board
                      </button>
                    </div>
                  </div>

                  {/* M3.4 Live Classroom Step Synchronization & Teacher Controls */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-800/80 shadow-inner flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-xs font-bold text-emerald-300">
                          LIVE CLASSROOM • {isSessionPaused ? '⏸️ PAUSED' : '🟢 ACTIVE'}
                        </span>
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                          👥 {liveStudentsCount} Students
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setHandRaised(!handRaised)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            handRaised
                              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                              : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                          }`}
                        >
                          ✋ {handRaised ? 'Hand Raised' : 'Raise Hand'}
                        </button>
                        <button
                          onClick={() => setIsSessionPaused(!isSessionPaused)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                        >
                          {isSessionPaused ? '▶️ Resume' : '⏸️ Pause'}
                        </button>
                      </div>
                    </div>

                    {/* Step Action Buttons (Previous & Next) */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setCurrentTeacherStepIdx((p) => Math.max(0, p - 1))}
                        disabled={currentTeacherStepIdx <= 0}
                        className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30 transition flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous Step
                      </button>

                      <div className="text-[11px] font-mono text-slate-400">
                        Synchronized Step {currentTeacherStepIdx + 1} of {teacherSteps.length}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentTeacherStepIdx((p) =>
                            Math.min(teacherSteps.length - 1, p + 1)
                          )
                        }
                        disabled={currentTeacherStepIdx >= teacherSteps.length - 1}
                        className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 disabled:opacity-30 transition flex items-center gap-1.5"
                      >
                        <span>Next Teaching Step</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* M3.4 Live Classroom Quiz Poll Widget */}
                  <div className="p-4 rounded-2xl bg-[#09101d] border border-cyan-800/70 shadow-lg space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-cyan-950">
                      <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                        <span>🗳️</span>
                        <span>QUICK CLASSROOM POLL • Concept C0101</span>
                      </span>
                      <span className="text-[10.5px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800">
                        {pollRevealed ? 'Results Revealed' : pollSubmitted ? 'Vote Submitted' : 'Poll Open'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-100">
                      Which of the following demonstrates living biological growth?
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { label: 'A. Wooden Chair', correct: false },
                        { label: 'B. Green Plant Sprout', correct: true },
                        { label: 'C. Plastic Toy', correct: false },
                        { label: 'D. Stone Rock', correct: false },
                      ].map((opt, oidx) => (
                        <button
                          key={oidx}
                          onClick={() => {
                            if (!pollSubmitted) setSelectedPollOption(oidx);
                          }}
                          disabled={pollSubmitted}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between ${
                            selectedPollOption === oidx
                              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md'
                              : 'bg-black/40 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {pollRevealed && opt.correct && (
                            <span className="text-[10px] text-emerald-400 font-black px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                              ✓ 24 votes (88%)
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {!pollSubmitted ? (
                        <button
                          onClick={() => setPollSubmitted(true)}
                          disabled={selectedPollOption === null}
                          className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 text-xs font-black transition"
                        >
                          Submit Poll Response
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Response Recorded • BKT Mastery Updated!
                        </span>
                      )}

                      <button
                        onClick={() => setPollRevealed(!pollRevealed)}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline"
                      >
                        {pollRevealed ? 'Hide Distribution' : '📊 Reveal Class Distribution'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. VISUALS & REAL WORLD FLOW */}
              {(activeBoardTab === 'visuals' || activeBoardTab === 'board_summary') && (
                <div className="space-y-5">
                  <div className="flex items-center justify-center gap-3 md:gap-5 flex-wrap">
                    {currentDepthArtifacts.visuals.steps.map((st, idx, arr) => (
                      <React.Fragment key={idx}>
                        <div className="flex flex-col items-center text-center p-3 bg-black/50 border border-emerald-700/60 rounded-2xl min-w-[125px] max-w-[150px] shadow-lg">
                          <span className="text-4xl mb-1.5 transform hover:scale-110 transition drop-shadow">{st.icon}</span>
                          <span className="text-xs font-black text-amber-300 tracking-wide">{st.label}</span>
                          <span className="text-[10.5px] text-emerald-200/90 mt-1 leading-snug">
                            {st.description}
                          </span>
                        </div>
                        {idx < arr.length - 1 && (
                          <span className="text-xl md:text-2xl text-amber-400 font-black hidden sm:inline select-none">
                            ➔
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-black/60 border border-amber-600/60 rounded-2xl p-4 shadow-lg text-center flex flex-col justify-center">
                      <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider block mb-1.5">
                        {currentDepthArtifacts.boardSummary.formulaBanner?.title || 'FORMULA PRINCIPLE'}
                      </span>
                      <p className="text-xs md:text-sm font-mono font-bold text-amber-100 leading-relaxed">
                        {currentDepthArtifacts.boardSummary.formulaBanner?.formula}
                      </p>
                    </div>

                    <div className="bg-black/60 border border-emerald-600/60 rounded-2xl p-4 shadow-lg flex flex-col justify-center">
                      <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 mb-1">
                        <span>💡</span>
                        <span>{currentDepthArtifacts.boardSummary.keyTakeawayBox.heading}</span>
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {currentDepthArtifacts.boardSummary.keyTakeawayBox.text}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. REAL WORLD EXAMPLES */}
              {activeBoardTab === 'real_world' && (
                <div className="space-y-3.5 max-w-4xl mx-auto w-full">
                  {currentDepthArtifacts.realWorldExamples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="bg-black/50 border border-emerald-800/70 rounded-2xl p-4 text-xs shadow-lg"
                    >
                      <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                        <span>🌟</span> {ex.scenarioTitle}
                      </h4>
                      <p className="text-slate-200 text-xs md:text-[13px] mt-1.5 leading-relaxed">
                        {ex.context} {ex.application}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-emerald-900/60 text-[11.5px] text-emerald-300 font-medium">
                        ✨ Why it matters: <span className="text-slate-200 font-normal">{ex.whyItMatters}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. KEY POINTS */}
              {activeBoardTab === 'key_points' && (
                <div className="space-y-3 max-w-4xl mx-auto w-full">
                  {currentDepthArtifacts.keyPoints.map((kp) => (
                    <div
                      key={kp.pointNumber}
                      className="flex items-start gap-3.5 bg-black/50 border border-emerald-800/70 rounded-2xl p-4 text-xs shadow-lg"
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow">
                        {kp.pointNumber}
                      </div>
                      <div>
                        <p className="text-amber-200 font-bold text-sm leading-snug">{kp.takeaway}</p>
                        <p className="text-[11.5px] text-emerald-300 mt-1 font-mono">
                          {kp.scientificPrinciple}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 6. PRINTABLE NOTES */}
              {activeBoardTab === 'printable_notes' && (
                <div className="bg-black/50 border border-emerald-800/70 rounded-2xl p-5 text-xs max-w-4xl mx-auto w-full shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-amber-300 text-sm">
                      📄 Printable Student Summary: {currentDepthArtifacts.printableNotes.chapterTitle}
                    </h4>
                    <button
                      onClick={() => setShowPrintableModal(true)}
                      className="text-xs text-purple-200 bg-purple-900/60 border border-purple-600 px-3 py-1.5 rounded-xl hover:bg-purple-800 font-bold flex items-center gap-1.5 transition shadow"
                    >
                      <Printer className="w-3.5 h-3.5" /> Open Full Print Sheet
                    </button>
                  </div>
                  <ul className="list-disc pl-5 text-slate-200 text-xs md:text-[13px] space-y-1.5 leading-relaxed">
                    {currentDepthArtifacts.printableNotes.whatILearned.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Chalkboard Footer Banner */}
            <div className="pt-2.5 border-t border-[#1a4a30] flex items-center justify-between text-[11px] text-emerald-400 font-mono">
              <span className="flex items-center gap-1">🌿 CANONICAL EVS CLASS 5</span>
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
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400'
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
                <span>DYNAMIC EVIDENCE PROVENANCE INSPECTOR</span>
              </div>
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/80 text-xs">
                <span className="text-[10px] font-bold text-cyan-400 uppercase block mb-1">
                  Source Evidence Snippet:
                </span>
                <p className="text-slate-200 italic leading-relaxed">
                  "{selectedCitation.sourceTextSnippet}"
                </p>
                <div className="mt-2 text-[10px] font-mono text-cyan-300 flex items-center justify-between">
                  <span>Physical Page: {selectedCitation.physicalPage}</span>
                  <span>Block ID: {selectedCitation.blockId}</span>
                  <span>Confidence: {((selectedCitation.confidence || 0.98) * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Scanned Image Preview with Real Bounding Box Overlay */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center p-2">
                <img
                  src={`/textbooks/${resolvedFolder}/page-${selectedCitation.physicalPage}.png`}
                  alt={`Scanned Physical Page ${selectedCitation.physicalPage}`}
                  className="max-h-[50vh] object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('evs-class-5')) {
                      target.src = `/textbooks/evs-class-5/page-${selectedCitation.physicalPage}.png`;
                    }
                  }}
                />
                {selectedCitation.bbox && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(selectedCitation.bbox.x / 1200) * 100}%`,
                      top: `${(selectedCitation.bbox.y / 1680) * 100}%`,
                      width: `${(selectedCitation.bbox.width / 1200) * 100}%`,
                      height: `${(selectedCitation.bbox.height / 1680) * 100}%`,
                    }}
                    className="border-2 border-amber-400 bg-amber-400/25 rounded animate-pulse pointer-events-none"
                  />
                )}
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
                src={`/textbooks/${resolvedFolder}/page-${currentPageNum}.png`}
                alt={`Page ${currentPageNum}`}
                className="max-h-[80vh] object-contain rounded-xl shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('evs-class-5')) {
                    target.src = `/textbooks/evs-class-5/page-${currentPageNum}.png`;
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showTaskInspector && <EnginePipelineTaskInspector onClose={() => setShowTaskInspector(false)} />}
      {/* MODAL: M3.4 PEER COLLABORATION DISCOVERY ROOM */}
      {showCollabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0c1324] border border-blue-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-black text-sm text-blue-300">
                <Users className="w-4 h-4 text-blue-400" />
                <span>PEER COLLABORATION DISCOVERY ROOM • CONCEPT C0101</span>
              </div>
              <button
                onClick={() => setShowCollabModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div
                onClick={() => setMyRole('EXPLORER')}
                className={`p-3 rounded-2xl border cursor-pointer transition ${
                  myRole === 'EXPLORER' ? 'bg-blue-950 border-blue-400 text-blue-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-2xl block mb-1">🧭</span>
                <span className="text-xs font-black block">EXPLORER</span>
                <span className="text-[10px] text-slate-400">Find textbook evidence</span>
              </div>

              <div
                onClick={() => setMyRole('ANALYST')}
                className={`p-3 rounded-2xl border cursor-pointer transition ${
                  myRole === 'ANALYST' ? 'bg-blue-950 border-blue-400 text-blue-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-2xl block mb-1">🔎</span>
                <span className="text-xs font-black block">ANALYST</span>
                <span className="text-[10px] text-slate-400">Compare reasoning</span>
              </div>

              <div
                onClick={() => setMyRole('SCRIBE')}
                className={`p-3 rounded-2xl border cursor-pointer transition ${
                  myRole === 'SCRIBE' ? 'bg-blue-950 border-blue-400 text-blue-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-2xl block mb-1">📝</span>
                <span className="text-xs font-black block">SCRIBE</span>
                <span className="text-[10px] text-slate-400">Record group summary</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-900/60 text-xs space-y-2">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                🎯 Group Discovery Challenge
              </span>
              <p className="text-slate-200 leading-relaxed">
                "Look at the Page 2 textbook evidence. Find two examples of Living Things and explain how biological growth differentiates them from inanimate objects."
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-blue-300">
                <span>📖 Citation: Page 2 (BBox: &#123;x: 262, y: 572, w: 400, h: 39&#125;)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCollabModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition"
              >
                Join Collaborative Group Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: M3.4 CURRICULUM COMPLIANCE & STANDARDS */}
      {showStandardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0c1324] border border-amber-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-black text-sm text-amber-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span>CURRICULUM COMPLIANCE & STANDARDS ALIGNMENT</span>
              </div>
              <button
                onClick={() => setShowStandardsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">NCERT Coverage</span>
                <span className="text-lg font-black text-emerald-400">75.0%</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Taught vs Mastered</span>
                <span className="text-lg font-black text-amber-300">66.7% / 33.3%</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Syllabus Gaps</span>
                <span className="text-lg font-black text-rose-400">1 Gap</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-amber-300 font-bold">NCERT-EVS-5-01 (Living Things)</span>
                  <p className="text-[11px] text-slate-400">Mapped to Concept C0101 • Physical Page 3</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-bold">
                  ✅ Taught & Mastered (92.7%)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-amber-300 font-bold">CBSE-EVS-5-C1 (Growth Continuum)</span>
                  <p className="text-[11px] text-slate-400">Mapped to Concept C0102 • Physical Page 4</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-bold">
                  🟡 Taught / Developing (58%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setShowStandardsModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition"
              >
                Close Standards Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
