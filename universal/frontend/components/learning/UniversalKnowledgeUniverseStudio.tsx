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
  Layers,
  Menu,
  MessageCircleQuestion,
} from 'lucide-react';
import {
  BookStorageService,
  IngestedBookModel,
  ChapterLessonModel,
} from '../../lib/learning/book-storage.service';

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
  sectionId = 'festivals-of-india',
  className = '',
}: UniversalKnowledgeUniverseStudioProps) {
  const [book, setBook] = useState<IngestedBookModel | undefined>(undefined);
  const [currentChapter, setCurrentChapter] = useState<ChapterLessonModel | undefined>(undefined);

  useEffect(() => {
    const loadedBook = BookStorageService.getBookById(bookId);
    setBook(loadedBook);
    if (loadedBook) {
      const foundCh = loadedBook.chapters.find((c) => c.id === sectionId) || loadedBook.chapters[0];
      setCurrentChapter(foundCh);
    }
  }, [bookId, sectionId]);

  // Teaching Depth: Basis -> Developing -> Proficient -> Advanced -> Deep
  const [activeDepth, setActiveDepth] = useState<'basis' | 'developing' | 'proficient' | 'advanced' | 'deep'>('developing');
  const [activeBoardTab, setActiveBoardTab] = useState<'teacher_explains' | 'visuals' | 'real_world' | 'key_points' | 'summary'>('teacher_explains');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [askInput, setAskInput] = useState<string>('');
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [showFullPageModal, setShowFullPageModal] = useState<boolean>(false);
  const [showIndexModal, setShowIndexModal] = useState<boolean>(false);

  // Socratic Interruption State (Teacher/Student question in between)
  const [interruptionQuery, setInterruptionQuery] = useState<string | null>(null);

  const handleTriggerInterruption = (question: string) => {
    setInterruptionQuery(question);
  };

  const ch = currentChapter || {
    id: 'lesson-1',
    chapterNumber: 1,
    title: 'Lesson 1: Foundations',
    printedPage: 2,
    concepts: ['Core Concepts', 'Mechanisms', 'Applications'],
    boardTitle: 'FOUNDATIONS OF LEARNING',
    boardSubtitle: 'A structured Socratic exploration grounded in verified textbook truth.',
    flowSteps: [
      { label: 'INPUT', icon: '☀️', description: 'Core observations and sensory inputs' },
      { label: 'PROCESS', icon: '🌿', description: 'Underlying biological/mathematical mechanism' },
      { label: 'OUTPUT', icon: '🌾', description: 'Observable results and structured products' },
      { label: 'HARVEST', icon: '🧑‍🌾', description: 'Practical utilization and mastery' },
      { label: 'SYNTHESIS', icon: '🎉', description: 'Celebration of understanding and insight' },
    ],
    subBoxTitle: 'HOW THE MECHANISM WORKS?',
    subBoxFormula: 'Observation + Reasoning ➔ Concept ➔ Verified Knowledge',
    keyIdea: 'Learning occurs when foundational observations connect with underlying mechanisms.',
    textbookExcerpt: 'Source extracted directly from your verified textbook page.',
  };

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
            placeholder={`Ask EKAGURU about ${book?.title || 'this lesson'}...`}
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

        {/* LEFT COLUMN: FROM YOUR TEXTBOOK (GROUNDED IN SELECTED BOOK) */}
        <aside className="w-[320px] xl:w-[340px] bg-[#080d19] border-r border-slate-800/80 p-4 flex flex-col justify-between overflow-y-auto shrink-0 gap-4 custom-scrollbar">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-white block">
                  FROM YOUR TEXTBOOK
                </span>
                <span className="text-xs text-slate-400">
                  Page {ch.printedPage} • {book?.subject || 'Curriculum'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Source Verified
              </span>
            </div>

            {/* Grounded Textbook Card */}
            <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-[#fffdfa] text-slate-900 p-4 shadow-2xl relative flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow">
                  {ch.printedPage}
                </span>
                <span className="text-xs font-bold text-slate-500">{book?.curriculum || 'NCERT'}</span>
              </div>

              <h3 className="text-base font-black text-rose-800 font-serif leading-tight">
                {ch.title}
              </h3>

              <p className="text-xs leading-relaxed text-slate-800 font-serif">
                {ch.textbookExcerpt}
              </p>

              {/* Concepts discovered */}
              <div className="w-full bg-slate-50 rounded-xl p-2.5 border border-slate-200 mt-1 flex flex-wrap gap-1.5">
                {ch.concepts.map((c, i) => (
                  <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowFullPageModal(true)}
              className="w-full py-2.5 rounded-xl bg-[#0d1424] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" /> View Full Page
            </button>

            {/* Chapter Index */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                CHAPTERS IN THIS BOOK
              </span>
              <div className="flex flex-col gap-1.5">
                {(book?.chapters || [ch]).map((c) => (
                  <Link
                    key={c.id}
                    href={`/learn/books/${book?.id || bookId}/lessons/${c.id}`}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-all ${
                      c.id === ch.id
                        ? 'bg-purple-950/60 border border-purple-500/50 text-purple-200 font-bold shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                    }`}
                  >
                    <span>{c.title}</span>
                    {c.id === ch.id ? (
                      <span className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </Link>
                ))}
              </div>
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
                Page analysed in 1.2s
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
            Content is verified from {book?.title || 'your textbook'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/learn/books/${book?.id || bookId}`}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Chapters
          </Link>
        </div>
      </footer>
    </div>
  );
}
