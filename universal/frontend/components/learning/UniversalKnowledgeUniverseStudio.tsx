'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Flame,
  Gem,
  Home,
  BookOpen,
  FileText,
  TrendingUp,
  Settings,
  Users,
  CheckCircle2,
  Volume2,
  Mic,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Layers,
  Menu,
  MessageCircleQuestion,
  ChevronLeft,
  X,
} from 'lucide-react';
import {
  BookStorageService,
  IngestedBookModel,
  ChapterLessonModel,
  LessonSectionModel,
} from '../../lib/learning/book-storage.service';
import {
  CANONICAL_TEXTBOOK_TOC,
  getPhysicalPageContent,
  PhysicalPageContent,
} from '../../lib/learning/page-preservation-engine';

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
  sectionId = 'ch-0',
  className = '',
}: UniversalKnowledgeUniverseStudioProps) {
  const [book, setBook] = useState<IngestedBookModel | undefined>(undefined);
  const [currentChapter, setCurrentChapter] = useState<ChapterLessonModel | undefined>(undefined);
  const [activeSection, setActiveSection] = useState<LessonSectionModel | undefined>(undefined);
  const [currentPageNum, setCurrentPageNum] = useState<number>(2);
  const [physicalPage, setPhysicalPage] = useState<PhysicalPageContent>(getPhysicalPageContent(2));
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({});

  // Modals
  const [showFullIndexModal, setShowFullIndexModal] = useState<boolean>(false);
  const [showFullPageModal, setShowFullPageModal] = useState<boolean>(false);

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

  const toggleChapterExpand = (chId: string) => {
    setExpandedChapterIds((prev) => ({
      ...prev,
      [chId]: !prev[chId],
    }));
  };

  const jumpToLesson = (chap: ChapterLessonModel, sec: LessonSectionModel) => {
    setCurrentChapter(chap);
    setActiveSection(sec);
    setCurrentPageNum(sec.page);
    setExpandedChapterIds((prev) => ({ ...prev, [chap.id]: true }));
    setShowFullIndexModal(false);
  };

  // Teaching Depth: Basis -> Developing -> Proficient -> Advanced -> Deep
  const [activeDepth, setActiveDepth] = useState<'basis' | 'developing' | 'proficient' | 'advanced' | 'deep'>('developing');
  const [activeBoardTab, setActiveBoardTab] = useState<'teacher_explains' | 'visuals' | 'real_world' | 'key_points' | 'summary'>('teacher_explains');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [askInput, setAskInput] = useState<string>('');
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [interruptionQuery, setInterruptionQuery] = useState<string | null>(null);

  const handleTriggerInterruption = (question: string) => {
    setInterruptionQuery(question);
  };

  const ch = currentChapter || {
    id: 'ch-0',
    chapterNumber: 0,
    unitName: 'Unit 1: About Me',
    title: 'Art Special: Festivals of India',
    startPage: 1,
    endPage: 2,
    pageRangeText: 'Pages 1–2',
    sections: [
      { id: 'sec-0-1', sectionNumber: '0.1', title: 'Table of Contents Overview', page: 1 },
      { id: 'sec-0-2', sectionNumber: '0.2', title: 'Festivals of India (Sankranthi, Bathukamma, Bonalu)', page: 2 },
    ],
    concepts: ['Sankranthi Harvest', 'Bathukamma Flowers', 'Bonalu Offering', 'Kite Flying & Rangoli'],
    boardTitle: 'FESTIVALS OF INDIA – HARVEST & NATURE',
    boardSubtitle: 'A festival of gratitude, nature and togetherness.',
    flowSteps: [
      { label: 'SUN', icon: '☀️', description: 'Gives us radiant light and solar energy' },
      { label: 'PLANTS', icon: '🌿', description: 'Use sunlight to make food (Photosynthesis)' },
      { label: 'CROPS', icon: '🌾', description: 'Plants grow and produce golden grains' },
      { label: 'HARVEST', icon: '🧑‍🌾', description: 'Farmers harvest mature crops' },
      { label: 'CELEBRATION', icon: '🎉', description: 'We celebrate with joy, rangoli, kites & feasts' },
    ],
    subBoxTitle: 'HOW PLANTS MAKE FOOD?',
    subBoxFormula: 'Sunlight + Water (H2O) + Carbon dioxide (CO2) ➔ Plant (Photosynthesis) ➔ Food (Glucose)',
    keyIdea: 'Plants use sunlight energy to make food through photosynthesis. When crops mature, farmers harvest them and communities celebrate Sankranthi.',
    textbookExcerpt: 'Textbook page extracted. Look at the structured patterns described in this section.',
  };

  const totalPages = book?.totalPages || 59;

  return (
    <div
      data-testid="universal-knowledge-universe-studio"
      className={`flex flex-col w-screen h-screen max-h-screen bg-[#070b14] text-slate-100 font-sans select-none overflow-hidden ${className}`}
    >
      {/* 1. TOP RUNTIME NAVBAR */}
      <header className="h-14 px-6 bg-[#0a0f1d] border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3.5">
          <Link
            href="/learn"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
            title="Back to Learn Home"
          >
            <Menu className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-wider text-white flex items-center gap-1 leading-tight">
                EKAGURU
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">From Textbook to Universe</p>
            </div>
          </div>
        </div>

        {/* Center: Context-Aware Search */}
        <div className="relative w-[420px] hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Ask EKAGURU about ${ch.title}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-2 bg-[#0d1424] border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            ⌘ K
          </span>
        </div>

        {/* Right Badges & Profile */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
            <Flame className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[8px] uppercase tracking-wider text-amber-400/90 font-bold block leading-none">Learning Streak</span>
              <span className="text-xs font-black text-amber-300">14 days</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-sm">
            <Gem className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <span className="text-[8px] uppercase tracking-wider text-purple-400/90 font-bold block leading-none">Explorer Level</span>
              <span className="text-xs font-black text-purple-300">Young Scientist</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pl-3.5 border-l border-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md ring-1 ring-emerald-300/30">
              A
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <span className="text-xs font-bold text-white block">Aarav</span>
              <span className="text-[10px] text-slate-400">Class 5</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </div>
        </div>
      </header>

      {/* 2. MAIN TEACHING WORKSPACE */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        {/* Left Global Rail */}
        <nav className="w-16 bg-[#080d19] border-r border-slate-800/80 flex flex-col items-center justify-between py-4 shrink-0 z-20">
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/learn"
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex flex-col items-center gap-1"
            >
              <Home className="w-4 h-4" />
              <span className="text-[9px] font-medium">Home</span>
            </Link>

            <Link
              href="/learn"
              className="p-2.5 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30 flex flex-col items-center gap-1"
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-[9px] font-medium">Learn</span>
            </Link>

            <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex flex-col items-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="text-[9px] font-medium">Notebook</span>
            </button>

            <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex flex-col items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[9px] font-medium">Progress</span>
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex flex-col items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="text-[9px] font-medium">Groups</span>
            </button>

            <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex flex-col items-center gap-1">
              <Settings className="w-4 h-4" />
              <span className="text-[9px] font-medium">Settings</span>
            </button>

            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center">
              A
            </div>
          </div>
        </nav>

        {/* LEFT COLUMN: REAL PDF VIEWER + 18-CHAPTER ACCORDION */}
        <aside className="w-[340px] xl:w-[360px] bg-[#080d19] border-r border-slate-800/80 p-4 flex flex-col justify-between overflow-y-auto shrink-0 gap-4 custom-scrollbar">
          <div className="flex flex-col gap-3.5">
            {/* Header & Source Verified Pill */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-white block">
                  FROM YOUR TEXTBOOK
                </span>
                <span className="text-xs text-slate-400">
                  Page {currentPageNum} • {book?.subject || 'Environmental Studies'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Source Verified
              </span>
            </div>

            {/* ============================================================ */}
            {/* 100% REAL PDF PAGE CANVAS (ORIGINAL PUBLISHED LAYOUT)       */}
            {/* ============================================================ */}
            <div className="rounded-2xl overflow-hidden border-2 border-amber-900/30 bg-[#fffefc] text-slate-900 p-4 shadow-2xl relative flex flex-col justify-between min-h-[300px] font-serif">
              {/* Top Textbook Header Strip */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                    {physicalPage.headerText}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-sans shadow">
                    {currentPageNum}
                  </span>
                </div>

                <h3 className="text-base font-black text-rose-950 leading-tight">
                  {physicalPage.pageTitle}
                </h3>

                {/* Published Textbook Paragraphs */}
                <div className="flex flex-col gap-1.5 mt-2">
                  {physicalPage.columns[0]?.paragraphs.slice(0, 3).map((p, idx) => (
                    <p key={idx} className="text-[11px] leading-relaxed text-slate-800">
                      {p}
                    </p>
                  ))}
                </div>

                {/* Published Callout Box */}
                {physicalPage.columns[0]?.callouts && physicalPage.columns[0].callouts.length > 0 && (
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-300 text-[10px] text-amber-950 font-sans font-bold leading-snug">
                    {physicalPage.columns[0].callouts[0]}
                  </div>
                )}
              </div>

              {/* Published Figure Caption */}
              <div className="mt-3 pt-2 border-t border-slate-200 text-center font-sans">
                <span className="text-[9.5px] font-bold text-slate-600">
                  {physicalPage.diagramCaption}
                </span>
              </div>
            </div>

            {/* Page Navigator [ ← ] Page X of 59 [ → ] */}
            <div className="flex items-center justify-between bg-[#0d1424] border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 shadow-inner font-sans">
              <button
                onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
                disabled={currentPageNum <= 1}
                className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono">Page {currentPageNum} of {totalPages}</span>
              <button
                onClick={() => setCurrentPageNum((p) => Math.min(totalPages, p + 1))}
                disabled={currentPageNum >= totalPages}
                className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowFullPageModal(true)}
              className="w-full py-2 rounded-xl bg-[#0d1424] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors shadow-md font-sans"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" /> View Full Page
            </button>

            {/* ============================================================ */}
            {/* CANONICAL 18 CHAPTERS ACCORDION (100% GAPLESS HIERARCHY)     */}
            {/* ============================================================ */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  CHAPTERS IN THIS BOOK ({(book?.chapters || []).length})
                </span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                {(book?.chapters || []).map((chap) => {
                  const isCurrent = chap.id === ch.id;
                  const isExpanded = !!expandedChapterIds[chap.id];

                  return (
                    <div key={chap.id} className="flex flex-col rounded-xl overflow-hidden border border-slate-800/60 bg-[#0b101d]">
                      <button
                        onClick={() => {
                          toggleChapterExpand(chap.id);
                          setCurrentChapter(chap);
                          setCurrentPageNum(chap.startPage);
                          setActiveSection(chap.sections[0]);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-all ${
                          isCurrent
                            ? 'bg-purple-950/80 text-purple-200 font-bold border-l-4 border-purple-500'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden pr-1">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span className="truncate">{chap.title}</span>
                        </div>
                        <span className="text-[9.5px] font-mono text-slate-400 shrink-0">
                          {chap.pageRangeText}
                        </span>
                      </button>

                      {/* Sub-lessons accordion dropdown */}
                      {isExpanded && (
                        <div className="pl-5 pr-2 py-1.5 bg-[#070c17] flex flex-col gap-1 border-t border-slate-800/50">
                          {chap.sections.map((sec) => (
                            <button
                              key={sec.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSection(sec);
                                setCurrentPageNum(sec.page);
                              }}
                              className={`w-full py-1 px-2 text-left text-[11px] rounded-lg transition flex items-center justify-between ${
                                activeSection?.id === sec.id
                                  ? 'bg-purple-600/30 text-purple-300 font-bold'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                              }`}
                            >
                              <span className="truncate">{sec.sectionNumber} {sec.title}</span>
                              <span className="text-[9px] font-mono text-slate-500">p.{sec.page}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowFullIndexModal(true)}
                className="mt-1 w-full py-2.5 rounded-xl bg-[#0d1424] hover:bg-purple-950/40 hover:border-purple-500 border border-slate-700 text-xs font-bold text-purple-300 flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" /> View Full Book Index
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER & RIGHT: TEACHING CHALKBOARD STAGE */}
        <main className="flex-1 flex flex-col p-6 bg-[#070b14] overflow-y-auto gap-4 custom-scrollbar">
          {/* Top Row: Engine Analysis */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-white tracking-wide flex items-center gap-2">
                EKAGURU ENGINE ANALYSIS
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AI
                </span>
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Page analysed in 1.1s
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300 font-bold">Concepts</span>
                <span className="text-emerald-300 font-black text-sm">{ch.concepts.length}</span>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-slate-300 font-bold">Key Ideas</span>
                <span className="text-blue-300 font-black text-sm">6</span>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="text-slate-300 font-bold">Connections</span>
                <span className="text-purple-300 font-black text-sm">18</span>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-300 font-bold">Questions</span>
                <span className="text-amber-300 font-black text-sm">5</span>
              </div>
            </div>
          </div>

          {/* Second Row: Teaching Depth */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1">
                TEACHING DEPTH
              </span>

              {[
                { id: 'basis', title: 'Basis', sub: '(Start Here)' },
                { id: 'developing', title: 'Developing', sub: '(Build Understanding)' },
                { id: 'proficient', title: 'Proficient', sub: '(Apply & Connect)' },
                { id: 'advanced', title: 'Advanced', sub: '(Analyse & Reason)' },
                { id: 'deep', title: 'Deep', sub: '(Research & Explore)' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setActiveDepth(lvl.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs text-center border transition-all flex flex-col items-center ${
                    activeDepth === lvl.id
                      ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-lg shadow-purple-600/30 ring-1 ring-purple-300'
                      : 'bg-[#0d1424] border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold">{lvl.title}</span>
                  <span className="text-[9px] opacity-80">{lvl.sub}</span>
                </button>
              ))}
            </div>

            <Link
              href={`/learn/books/${book?.id || bookId}`}
              className="px-4 py-2 rounded-xl bg-[#0d1424] border border-slate-700/80 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Chapters
            </Link>
          </div>

          {/* ================================================================ */}
          {/* THE TEACHING CHALKBOARD (DYNAMICALLY MATCHING THIS LESSON)       */}
          {/* ================================================================ */}
          <div className="relative rounded-3xl bg-[#08221b] border-[8px] border-[#4a3419] shadow-2xl p-8 overflow-hidden text-emerald-100 flex flex-col justify-between flex-1 min-h-[540px]">
            <div className="absolute inset-2.5 border-2 border-[#836336]/60 rounded-2xl pointer-events-none" />

            <button
              onClick={() => setAudioPlaying(!audioPlaying)}
              className={`absolute right-6 top-6 p-3 rounded-xl backdrop-blur-md transition z-20 ${
                audioPlaying ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300' : 'bg-slate-900/60 text-slate-300 hover:text-white'
              }`}
              title="Listen to Explanation"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            {/* Socratic Interruption Banner */}
            {interruptionQuery && (
              <div className="z-20 mb-4 p-4 rounded-2xl bg-amber-950/80 border-2 border-amber-500/60 text-amber-100 flex items-center justify-between shadow-2xl animate-in fade-in">
                <div className="flex items-center gap-3">
                  <MessageCircleQuestion className="w-6 h-6 text-amber-300 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                      EKAGURU Socratic Expansion (Paused Lesson)
                    </span>
                    <p className="text-xs font-bold">"{interruptionQuery}"</p>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      Explaining context for {ch.title}: foundational connections grounded in {book?.subject || 'this domain'}.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInterruptionQuery(null)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shrink-0"
                >
                  Resume Lesson ➔
                </button>
              </div>
            )}

            <div className="text-center z-10 mb-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-widest text-[#f5d061] font-mono drop-shadow-md uppercase">
                {ch.boardTitle}
              </h2>
              <p className="text-base md:text-lg font-serif text-[#f294b4] mt-2 tracking-wide font-medium">
                {ch.boardSubtitle}
              </p>
            </div>

            {/* 5-Step Visual Flowchart */}
            <div className="grid grid-cols-5 gap-6 items-center text-center z-10 my-4">
              {ch.flowSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center group relative">
                  {idx > 0 && (
                    <span className="absolute -left-6 top-10 text-purple-300 font-bold text-2xl hidden md:block">
                      ➔
                    </span>
                  )}
                  <div className="w-24 h-24 rounded-full bg-emerald-950/40 border-2 border-emerald-400/30 flex items-center justify-center text-4xl shadow-xl shadow-emerald-950/40 group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <h4 className="text-lg font-black text-amber-300 mt-2 uppercase font-mono tracking-wider">
                    {step.label}
                  </h4>
                  <p className="text-sm text-emerald-100/90 leading-snug mt-1 font-sans font-medium">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Chalkboard Sub-Panels */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 z-10 mt-6 pt-5 border-t-2 border-emerald-800/70">
              <div className="md:col-span-7 bg-[#051912]/95 border-2 border-emerald-600/50 rounded-2xl p-4 flex flex-col gap-2.5 shadow-inner">
                <span className="text-sm font-black text-amber-300 font-mono tracking-wider text-center">
                  {ch.subBoxTitle}
                </span>
                <p className="text-xs text-center font-mono text-emerald-200 font-bold">
                  {ch.subBoxFormula}
                </p>
              </div>

              <div className="md:col-span-5 bg-[#051912]/95 border-2 border-emerald-600/50 rounded-2xl p-4 flex flex-col justify-center gap-2 shadow-inner">
                <span className="text-sm font-black text-amber-300 font-mono tracking-wider flex items-center gap-2">
                  💡 KEY IDEA
                </span>
                <p className="text-xs md:text-sm leading-relaxed text-emerald-50 font-sans font-medium">
                  {ch.keyIdea}
                </p>
              </div>
            </div>
          </div>

          {/* Action Tabs below Blackboard */}
          <div className="flex items-center gap-3 overflow-x-auto pb-0.5 text-xs">
            {[
              { id: 'teacher_explains', label: '✨ Teacher Explains' },
              { id: 'visuals', label: '🌐 Visuals & Real World' },
              { id: 'real_world', label: '⭐ Real World Examples' },
              { id: 'key_points', label: '📌 Key Points' },
              { id: 'summary', label: '📋 Board Summary' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveBoardTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                  activeBoardTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-[#0d1424] border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ASK EKAGURU (CONTEXT-AWARE QUESTIONING) */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-white">Ask EKAGURU</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI
              </span>
            </div>

            <div className="relative flex items-center gap-3">
              <input
                type="text"
                placeholder={`Ask a question about ${ch.title} — EKAGURU will expand without losing your place...`}
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && askInput.trim()) {
                    handleTriggerInterruption(askInput.trim());
                    setAskInput('');
                  }
                }}
                className="flex-1 pl-4 pr-12 py-3 bg-[#080d19] border border-slate-700/80 rounded-xl text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-inner"
              />
              <button className="absolute right-28 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white">
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (askInput.trim()) {
                    handleTriggerInterruption(askInput.trim());
                    setAskInput('');
                  }
                }}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs md:text-sm rounded-xl flex items-center gap-2 shadow-md shadow-purple-600/30"
              >
                <Sparkles className="w-4 h-4" /> Ask
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* 3. BOTTOM PROGRESSION BAR */}
      <footer className="h-14 px-6 bg-[#080d19] border-t border-slate-800/80 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Source Verified
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Original textbook preserved from {book?.title || 'your uploaded PDF'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFullIndexModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/40 text-xs font-bold text-purple-300 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" /> Full Book Index
          </button>

          <Link
            href={`/learn/books/${book?.id || bookId}`}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Chapters
          </Link>
        </div>
      </footer>

      {/* ==================================================================== */}
      {/* 4. INTERACTIVE FULL BOOK INDEX MODAL (18 CHAPTERS, ZERO GAPS)        */}
      {/* ==================================================================== */}
      {showFullIndexModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b1120] border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/40 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {book?.title || 'Table of Contents'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    18 Chapters Across 5 Units • 59 Preserved Physical Pages • Click any lesson to jump
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFullIndexModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              {(book?.chapters || []).map((chap) => (
                <div
                  key={chap.id}
                  className="rounded-2xl border border-slate-800/80 bg-[#090f1d] p-4 flex flex-col gap-2.5 hover:border-purple-500/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {chap.unitName}
                      </span>
                      <h4 className="text-sm font-black text-white">{chap.title}</h4>
                    </div>
                    <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-md border border-purple-500/30">
                      {chap.pageRangeText}
                    </span>
                  </div>

                  {/* Clickable Sub-Lessons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                    {chap.sections.map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => jumpToLesson(chap, sec)}
                        className="p-2 rounded-xl bg-[#0d1424] hover:bg-purple-600/20 border border-slate-800 hover:border-purple-500/40 text-left transition flex items-center justify-between group"
                      >
                        <span className="text-xs text-slate-300 group-hover:text-purple-200">
                          {sec.sectionNumber} {sec.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-purple-400">
                          p.{sec.page}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#080d19] border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowFullIndexModal(false)}
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30"
              >
                Close Index
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. HIGH-RESOLUTION FULL TEXTBOOK PAGE INSPECTOR MODAL               */}
      {/* ==================================================================== */}
      {showFullPageModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b1120] border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow">
                  {currentPageNum}
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {physicalPage.pageTitle} — Page {currentPageNum} of {totalPages}
                  </h3>
                  <p className="text-[10.5px] text-emerald-400 font-mono">
                    ✓ Immutable Physical Page • Source Verified
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFullPageModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col items-center bg-[#151d30]/60">
              <div className="w-full max-w-2xl bg-[#fffefc] text-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-400 flex flex-col gap-4 font-serif">
                <div className="flex items-center justify-between border-b border-slate-300 pb-3 font-sans">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {physicalPage.headerText}
                  </span>
                  <span className="text-xs font-bold text-slate-500">Page {currentPageNum}</span>
                </div>

                <h2 className="text-xl font-black text-rose-950">
                  {physicalPage.pageTitle}
                </h2>

                <div className="flex flex-col gap-2.5">
                  {physicalPage.columns[0]?.paragraphs.map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed text-slate-800">
                      {p}
                    </p>
                  ))}
                </div>

                {physicalPage.columns[0]?.callouts && physicalPage.columns[0].callouts.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 font-sans text-xs text-amber-950 font-bold">
                    {physicalPage.columns[0].callouts[0]}
                  </div>
                )}

                <div className="my-2 p-4 bg-slate-100 rounded-xl border border-slate-300 text-center font-sans">
                  <span className="text-xs font-bold text-slate-700">
                    {physicalPage.diagramCaption}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 px-6 bg-[#080d19] border-t border-slate-800 flex items-center justify-between font-sans">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
                  disabled={currentPageNum <= 1}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40"
                >
                  ← Previous Page
                </button>
                <button
                  onClick={() => setCurrentPageNum((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPageNum >= totalPages}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40"
                >
                  Next Page →
                </button>
              </div>

              <button
                onClick={() => setShowFullPageModal(false)}
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
