'use client';

import React, { useState, useRef } from 'react';
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
  UploadCloud,
  Plus,
  Book,
  X,
  Clock,
  ShieldCheck,
  Check,
  Library,
  FileUp,
} from 'lucide-react';

export interface UniversalKnowledgeUniverseStudioProps {
  sectionId?: string;
  sectionTitle?: string;
  conceptName?: string;
  description?: string;
  printedPage?: number;
  className?: string;
}

interface TextbookItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  pages: number;
  chapters: number;
  concepts: number;
  mastery: number;
  status: 'READY' | 'PROCESSING';
  coverBg: string;
  coverAccent: string;
  pageSnippet: string;
  topicTitle: string;
}

const INITIAL_BOOKS: TextbookItem[] = [
  {
    id: 'book-1',
    title: 'Festivals of India & Environmental Studies',
    subject: 'Environmental Studies',
    grade: 'Class 5',
    pages: 142,
    chapters: 8,
    concepts: 54,
    mastery: 66,
    status: 'READY',
    coverBg: 'from-amber-600 to-rose-700',
    coverAccent: '#f59e0b',
    pageSnippet: 'India is a land of festivals. Sankranthi is a popular harvest festival celebrated across the country.',
    topicTitle: 'Festivals of India - Sankranthi',
  },
  {
    id: 'book-2',
    title: 'Mathematics: Shapes, Fractions & Patterns',
    subject: 'Mathematics',
    grade: 'Class 5',
    pages: 180,
    chapters: 12,
    concepts: 72,
    mastery: 84,
    status: 'READY',
    coverBg: 'from-indigo-600 to-blue-700',
    coverAccent: '#6366f1',
    pageSnippet: 'Angles and triangles form the fundamental geometric basis of architecture and measurement.',
    topicTitle: 'Geometry & Fractions',
  },
  {
    id: 'book-3',
    title: 'General Science: Living Systems & Plants',
    subject: 'Science',
    grade: 'Class 5',
    pages: 160,
    chapters: 10,
    concepts: 68,
    mastery: 42,
    status: 'READY',
    coverBg: 'from-emerald-600 to-teal-700',
    coverAccent: '#10b981',
    pageSnippet: 'Photosynthesis is the process by which green plants transform sunlight into nourishment.',
    topicTitle: 'Plant Biology & Circulation',
  },
  {
    id: 'book-4',
    title: 'Our Heritage: Social Studies & Civics',
    subject: 'Social Studies',
    grade: 'Class 5',
    pages: 130,
    chapters: 7,
    concepts: 40,
    mastery: 90,
    status: 'READY',
    coverBg: 'from-orange-600 to-amber-700',
    coverAccent: '#f97316',
    pageSnippet: 'Ancient civilizations flourished along fertile river valleys, pioneering agriculture and trade.',
    topicTitle: 'Civilizations & Community',
  },
];

export function UniversalKnowledgeUniverseStudio({
  sectionId = 'festivals-of-india',
  sectionTitle = 'Festivals of India',
  conceptName = 'Sankranthi & Harvest Festivals',
  description = '',
  printedPage = 2,
  className = '',
}: UniversalKnowledgeUniverseStudioProps) {
  // State
  const [activeNav, setActiveNav] = useState<'home' | 'learn' | 'notebook' | 'progress' | 'settings'>('learn');
  const [activeDepth, setActiveDepth] = useState<'basis' | 'developing' | 'proficient' | 'advanced' | 'deep'>('developing');
  const [activeBoardTab, setActiveBoardTab] = useState<'teacher_explains' | 'visuals' | 'real_world' | 'key_points' | 'summary'>('teacher_explains');
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [askInput, setAskInput] = useState<string>('');
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [showFullPageModal, setShowFullPageModal] = useState<boolean>(false);
  const [showIndexModal, setShowIndexModal] = useState<boolean>(false);

  // Books & Upload Management State
  const [showLearnModal, setShowLearnModal] = useState<boolean>(false);
  const [learnTab, setLearnTab] = useState<'my_books' | 'upload_new'>('my_books');
  const [booksList, setBooksList] = useState<TextbookItem[]>(INITIAL_BOOKS);
  const [selectedBook, setSelectedBook] = useState<TextbookItem>(INITIAL_BOOKS[0]);

  // Upload Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadSubject, setUploadSubject] = useState<string>('Science');
  const [uploadGrade, setUploadGrade] = useState<string>('Class 5');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const handleNavClick = (nav: 'home' | 'learn' | 'notebook' | 'progress' | 'settings') => {
    setActiveNav(nav);
    if (nav === 'learn') {
      setShowLearnModal(true);
    }
  };

  const handleBookSelect = (book: TextbookItem) => {
    setSelectedBook(book);
    setShowLearnModal(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleStartUpload = () => {
    if (!uploadFile && !uploadTitle) return;
    setIsUploading(true);

    setTimeout(() => {
      const newBook: TextbookItem = {
        id: `book-${Date.now()}`,
        title: uploadTitle || uploadFile?.name || 'New Textbook',
        subject: uploadSubject,
        grade: uploadGrade,
        pages: 120,
        chapters: 6,
        concepts: 36,
        mastery: 0,
        status: 'READY',
        coverBg: 'from-purple-600 to-indigo-700',
        coverAccent: '#a855f7',
        pageSnippet: 'Textbook indexed and processed successfully with verified canonical knowledge graph.',
        topicTitle: uploadTitle || 'Chapter 1: Overview',
      };

      setBooksList([newBook, ...booksList]);
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setLearnTab('my_books');
        setSelectedBook(newBook);
      }, 1200);
    }, 1500);
  };

  return (
    <div
      data-testid="universal-knowledge-universe-studio"
      className={`flex flex-col w-screen h-screen max-h-screen bg-[#070b14] text-slate-100 font-sans select-none overflow-hidden ${className}`}
    >
      {/* ==================================================================== */}
      {/* 1. TOP NAVBAR HEADER                                                 */}
      {/* ==================================================================== */}
      <header className="h-14 px-6 bg-[#0a0f1d] border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setShowLearnModal(true)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
            title="Book Library & Upload"
          >
            <Menu className="w-5 h-5" />
          </button>

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

        {/* Center: Search input */}
        <div className="relative w-[420px] hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder='Ask anything about "Sankranthi"...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-2 bg-[#0d1424] border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            ⌘ K
          </span>
        </div>

        {/* Right: Badges & Profile */}
        <div className="flex items-center gap-3.5">
          {/* Quick Book Selector / Upload Button */}
          <button
            onClick={() => {
              setLearnTab('upload_new');
              setShowLearnModal(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5 text-purple-300" />
            <span>Upload Book</span>
          </button>

          {/* Learning Streak */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
            <Flame className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[8px] uppercase tracking-wider text-amber-400/90 font-bold block leading-none">Learning Streak</span>
              <span className="text-xs font-black text-amber-300">14 days</span>
            </div>
          </div>

          {/* Explorer Level */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-sm">
            <Gem className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <span className="text-[8px] uppercase tracking-wider text-purple-400/90 font-bold block leading-none">Explorer Level</span>
              <span className="text-xs font-black text-purple-300">Young Scientist</span>
            </div>
          </div>

          {/* User Profile */}
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

      {/* ==================================================================== */}
      {/* 2. FULL VIEWPORT EDGE-TO-EDGE WORKSPACE                              */}
      {/* ==================================================================== */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        {/* GLOBAL MINI SIDEBAR NAV */}
        <nav className="w-16 bg-[#080d19] border-r border-slate-800/80 flex flex-col items-center justify-between py-4 shrink-0 z-20">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => handleNavClick('home')}
              className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 ${
                activeNav === 'home' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[9px] font-medium">Home</span>
            </button>

            {/* LEARN BUTTON - OPENS LIBRARY & UPLOAD MODAL */}
            <button
              onClick={() => handleNavClick('learn')}
              className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 ${
                activeNav === 'learn' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Click to view existing books or upload new books"
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-[9px] font-medium">Learn</span>
            </button>

            <button
              onClick={() => handleNavClick('notebook')}
              className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 ${
                activeNav === 'notebook' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-[9px] font-medium">Notebook</span>
            </button>

            <button
              onClick={() => handleNavClick('progress')}
              className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 ${
                activeNav === 'progress' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-[9px] font-medium">Progress</span>
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => handleNavClick('settings')}
              className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 ${
                activeNav === 'settings' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-[9px] font-medium">Settings</span>
            </button>

            <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60">
              <Users className="w-4 h-4" />
            </button>

            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center">
              A
            </div>
          </div>
        </nav>

        {/* LEFT COLUMN: FROM YOUR TEXTBOOK + CHAPTER INDEX */}
        <aside className="w-[320px] xl:w-[340px] bg-[#080d19] border-r border-slate-800/80 p-4 flex flex-col justify-between overflow-y-auto shrink-0 gap-4 custom-scrollbar">
          <div className="flex flex-col gap-4">
            {/* Header & Source Verified Pill */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-white block">
                  FROM YOUR TEXTBOOK
                </span>
                <span className="text-xs text-slate-400">Page 2 • Sankranthi</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Source Verified
              </span>
            </div>

            {/* High-Fidelity Textbook Card */}
            <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-[#fffdfa] text-slate-900 p-4 shadow-2xl relative flex flex-col gap-2.5">
              {/* Blue circular page badge + Flying Kite */}
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow">
                  2
                </span>
                {/* SVG Kite with Tail */}
                <svg className="w-8 h-8" viewBox="0 0 40 40">
                  <polygon points="20,2 38,18 20,38 2,18" fill="#f43f5e" stroke="#be123c" strokeWidth="1.5" />
                  <polygon points="20,2 38,18 20,18" fill="#fbbf24" />
                  <polygon points="2,18 20,18 20,38" fill="#3b82f6" />
                  <line x1="20" y1="2" x2="20" y2="38" stroke="#ffffff" strokeWidth="1" />
                  <line x1="2" y1="18" x2="38" y2="18" stroke="#ffffff" strokeWidth="1" />
                  <path d="M20,38 Q28,42 24,48 Q18,52 26,58" stroke="#f43f5e" strokeWidth="2" fill="none" />
                </svg>
              </div>

              <h3 className="text-base font-black text-rose-800 font-serif leading-tight">
                Festivals of India
              </h3>

              <p className="text-xs leading-relaxed text-slate-800 font-serif">
                India is a land of festivals. We celebrate different kinds of festivals in the country.
              </p>
              <p className="text-xs leading-relaxed text-slate-800 font-serif">
                <strong>Sankranthi</strong> is a popular harvest festival. Many people make colourful <em>muggulu (rangoli)</em> at the entrance of their houses. Many people also fly kites on Sankranthi. It is celebrated in many parts of India.
              </p>

              {/* Family & Rangoli Illustrated Scene */}
              <div className="w-full bg-gradient-to-b from-amber-50 to-orange-100/80 rounded-xl p-3 border border-amber-200 flex flex-col items-center shadow-inner relative overflow-hidden mt-1">
                {/* Family Row */}
                <div className="flex items-end justify-center gap-3 mb-2 z-10">
                  <div className="text-center">
                    <span className="text-2xl block leading-none">👵</span>
                    <span className="text-[9px] text-amber-950 font-bold">Dadi</span>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl block leading-none">👩</span>
                    <span className="text-[9px] text-amber-950 font-bold">Amma</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xl block leading-none">👧</span>
                    <span className="text-[9px] text-amber-950 font-bold">Anu</span>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl block leading-none">👨</span>
                    <span className="text-[9px] text-amber-950 font-bold">Appa</span>
                  </div>
                </div>

                {/* Big Circular Rangoli Mandala + Bonam Pongal Pot */}
                <div className="flex items-center justify-center gap-4 z-10">
                  <svg className="w-20 h-20" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="38" fill="#fbcfe8" stroke="#ec4899" strokeWidth="2" strokeDasharray="3 3" />
                    <circle cx="50" cy="50" r="28" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
                    <circle cx="50" cy="50" r="18" fill="#bbf7d0" stroke="#16a34a" strokeWidth="2" />
                    <circle cx="50" cy="50" r="7" fill="#f43f5e" />
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                      <circle
                        key={i}
                        cx={50 + 28 * Math.cos((angle * Math.PI) / 180)}
                        cy={50 + 28 * Math.sin((angle * Math.PI) / 180)}
                        r="4.5"
                        fill="#6366f1"
                      />
                    ))}
                  </svg>

                  <div className="flex flex-col items-center">
                    <span className="text-3xl leading-none">🏺</span>
                    <span className="text-[9.5px] font-bold text-amber-900 mt-1">Bonam</span>
                  </div>
                </div>
              </div>
            </div>

            {/* View Full Page Button */}
            <button
              onClick={() => setShowFullPageModal(true)}
              className="w-full py-2.5 rounded-xl bg-[#0d1424] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" /> View Full Page
            </button>

            {/* Index of this chapter */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                INDEX OF THIS CHAPTER
              </span>

              <div className="flex flex-col gap-1.5">
                {[
                  { id: 1, title: '1. Festivals of India', active: true },
                  { id: 2, title: '2. Harvest Festivals in India', hasSub: true },
                  { id: 3, title: '3. Regional Festivals', hasSub: true },
                  { id: 4, title: '4. Unity in Diversity', hasSub: true },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveChapterIndex(item.id)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-all ${
                      item.active || activeChapterIndex === item.id
                        ? 'bg-purple-950/60 border border-purple-500/50 text-purple-200 font-bold shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                    }`}
                  >
                    <span>{item.title}</span>
                    {item.active || activeChapterIndex === item.id ? (
                      <span className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* View Full Chapter Index */}
              <button
                onClick={() => setShowIndexModal(true)}
                className="mt-1 w-full py-2.5 rounded-xl bg-[#0d1424] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors"
              >
                <Layers className="w-4 h-4 text-purple-400" /> View Full Chapter Index
              </button>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------------------ */}
        {/* EXPANSIVE TEACHER GRAPHICAL CHALKBOARD STAGE                       */}
        {/* ------------------------------------------------------------------ */}
        <main className="flex-1 flex flex-col p-6 bg-[#070b14] overflow-y-auto gap-4 custom-scrollbar">
          {/* Top Row: Engine Analysis & Stats */}
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

            {/* 4 Stat Badges */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300 font-bold">Concepts</span>
                <span className="text-emerald-300 font-black text-sm">12</span>
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

          {/* Second Row: Teaching Depth & Style */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1">
                TEACHING DEPTH / LEVEL
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

            {/* Teaching Style Dropdown */}
            <div className="flex items-center gap-2.5 text-xs">
              <span className="text-xs text-slate-400 font-medium">Teaching Style</span>
              <div className="px-4 py-2 rounded-xl bg-[#0d1424] border border-slate-700/80 text-xs font-bold text-white flex items-center gap-2 cursor-pointer hover:border-slate-600 shadow-sm">
                <span>Graphical Board</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* THE EXPANSIVE GRAPHICAL CHALKBOARD (READABLE TYPOGRAPHY)         */}
          {/* ================================================================ */}
          <div className="relative rounded-3xl bg-[#08221b] border-[8px] border-[#4a3419] shadow-2xl p-8 overflow-hidden text-emerald-100 flex flex-col justify-between flex-1 min-h-[540px]">
            {/* Wooden frame inner gold line */}
            <div className="absolute inset-2.5 border-2 border-[#836336]/60 rounded-2xl pointer-events-none" />

            {/* Sound Icon in Top Right */}
            <button
              onClick={() => setAudioPlaying(!audioPlaying)}
              className={`absolute right-6 top-6 p-3 rounded-xl backdrop-blur-md transition z-20 ${
                audioPlaying ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300' : 'bg-slate-900/60 text-slate-300 hover:text-white'
              }`}
              title="Listen to Explanation"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            {/* Chalkboard Titles */}
            <div className="text-center z-10 mb-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-widest text-[#f5d061] font-mono drop-shadow-md">
                SANKRANTHI – THE HARVEST FESTIVAL
              </h2>
              <p className="text-base md:text-lg font-serif text-[#f294b4] mt-2 tracking-wide font-medium">
                A festival of gratitude, nature and togetherness.
              </p>
            </div>

            {/* 5-Step Visual Flowchart */}
            <div className="grid grid-cols-5 gap-6 items-center text-center z-10 my-4">
              {/* STEP 1: SUN */}
              <div className="flex flex-col items-center group">
                <div className="w-24 h-24 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-22 h-22" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="26" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3.5" />
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, idx) => (
                      <line
                        key={idx}
                        x1={50 + 30 * Math.cos((deg * Math.PI) / 180)}
                        y1={50 + 30 * Math.sin((deg * Math.PI) / 180)}
                        x2={50 + 46 * Math.cos((deg * Math.PI) / 180)}
                        y2={50 + 46 * Math.sin((deg * Math.PI) / 180)}
                        stroke="#f59e0b"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    ))}
                  </svg>
                </div>
                <h4 className="text-lg font-black text-amber-300 mt-2 uppercase font-mono tracking-wider">SUN</h4>
                <p className="text-sm text-emerald-100/90 leading-snug mt-1 font-sans font-medium">
                  Gives us light and energy
                </p>
              </div>

              {/* STEP 2: PLANTS */}
              <div className="flex flex-col items-center group relative">
                <span className="absolute -left-6 top-10 text-purple-300 font-bold text-2xl hidden md:block">➔</span>
                <div className="w-24 h-24 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-22 h-22" viewBox="0 0 100 100">
                    <path d="M15,85 Q50,80 85,85" stroke="#78350f" strokeWidth="4.5" fill="none" />
                    <path d="M50,85 Q50,45 50,18" stroke="#15803d" strokeWidth="5" fill="none" strokeLinecap="round" />
                    <path d="M50,55 Q22,40 18,28 Q38,28 50,55" fill="#22c55e" stroke="#15803d" strokeWidth="2.5" />
                    <path d="M50,45 Q78,28 82,18 Q62,18 50,45" fill="#4ade80" stroke="#15803d" strokeWidth="2.5" />
                    <path d="M50,18 Q40,3 50,-2 Q60,3 50,18" fill="#86efac" stroke="#15803d" strokeWidth="2.5" />
                  </svg>
                </div>
                <h4 className="text-lg font-black text-emerald-300 mt-2 uppercase font-mono tracking-wider">PLANTS</h4>
                <p className="text-sm text-emerald-100/90 leading-snug mt-1 font-sans font-medium">
                  Use sunlight to make their own food (Photosynthesis)
                </p>
              </div>

              {/* STEP 3: CROPS */}
              <div className="flex flex-col items-center group relative">
                <span className="absolute -left-6 top-10 text-amber-300 font-bold text-2xl hidden md:block">➔</span>
                <div className="w-24 h-24 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-22 h-22" viewBox="0 0 100 100">
                    <path d="M50,90 L50,10" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
                    <path d="M50,90 L28,18" stroke="#ca8a04" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M50,90 L72,18" stroke="#ca8a04" strokeWidth="3.5" strokeLinecap="round" />
                    {[18, 30, 42, 54, 66].map((y, i) => (
                      <g key={i}>
                        <ellipse cx="40" cy={y} rx="7" ry="4" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" transform={`rotate(-25 40 ${y})`} />
                        <ellipse cx="60" cy={y} rx="7" ry="4" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" transform={`rotate(25 60 ${y})`} />
                      </g>
                    ))}
                  </svg>
                </div>
                <h4 className="text-lg font-black text-amber-300 mt-2 uppercase font-mono tracking-wider">CROPS</h4>
                <p className="text-sm text-emerald-100/90 leading-snug mt-1 font-sans font-medium">
                  Plants grow and produce grains
                </p>
              </div>

              {/* STEP 4: HARVEST */}
              <div className="flex flex-col items-center group relative">
                <span className="absolute -left-6 top-10 text-cyan-300 font-bold text-2xl hidden md:block">➔</span>
                <div className="w-24 h-24 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-24 h-22" viewBox="0 0 130 100">
                    {/* Farmer */}
                    <circle cx="35" cy="28" r="10" fill="#fbcfe8" />
                    <path d="M20,25 Q35,12 50,25" fill="#ca8a04" />
                    <path d="M35,38 L35,68 M35,46 L16,58 M35,46 L54,58" stroke="#0284c7" strokeWidth="4" />
                    <line x1="35" y1="68" x2="24" y2="88" stroke="#0284c7" strokeWidth="4" />
                    <line x1="35" y1="68" x2="46" y2="88" stroke="#0284c7" strokeWidth="4" />
                    {/* White Oxen Pair */}
                    <ellipse cx="82" cy="55" rx="18" ry="12" fill="#f8fafc" stroke="#64748b" strokeWidth="2.5" />
                    <circle cx="102" cy="45" r="9.5" fill="#f8fafc" stroke="#64748b" strokeWidth="2.5" />
                    <line x1="74" y1="67" x2="74" y2="86" stroke="#64748b" strokeWidth="3.5" />
                    <line x1="90" y1="67" x2="90" y2="86" stroke="#64748b" strokeWidth="3.5" />
                    <path d="M104,40 Q112,30 108,22" stroke="#334155" strokeWidth="3" fill="none" />
                  </svg>
                </div>
                <h4 className="text-lg font-black text-cyan-300 mt-2 uppercase font-mono tracking-wider">HARVEST</h4>
                <p className="text-sm text-emerald-100/90 leading-snug mt-1 font-sans font-medium">
                  Farmers harvest the mature crops
                </p>
              </div>

              {/* STEP 5: CELEBRATION */}
              <div className="flex flex-col items-center group relative">
                <span className="absolute -left-6 top-10 text-pink-300 font-bold text-2xl hidden md:block">➔</span>
                <div className="w-24 h-24 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-22 h-22" viewBox="0 0 100 100">
                    <circle cx="50" cy="65" r="32" fill="#f43f5e" stroke="#fbbf24" strokeWidth="3" />
                    <circle cx="50" cy="65" r="22" fill="#8b5cf6" stroke="#fbbf24" strokeWidth="2" />
                    <circle cx="50" cy="65" r="11" fill="#10b981" />
                    <polygon points="70,6 90,22 70,38 50,22" fill="#38bdf8" stroke="#0284c7" strokeWidth="2.5" />
                    <line x1="70" y1="38" x2="80" y2="52" stroke="#f43f5e" strokeWidth="2.5" />
                    <circle cx="30" cy="50" r="10" fill="#b45309" />
                    <path d="M23,43 Q30,36 37,43" stroke="#fef08a" strokeWidth="3" fill="none" />
                  </svg>
                </div>
                <h4 className="text-lg font-black text-pink-300 mt-2 uppercase font-mono tracking-wider">CELEBRATION</h4>
                <p className="text-sm text-emerald-100/90 leading-snug mt-1 font-sans font-medium">
                  We celebrate with joy, rangoli, kites, feasts and gratitude
                </p>
              </div>
            </div>

            {/* Chalkboard Sub-Panels (Bottom Row) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 z-10 mt-6 pt-5 border-t-2 border-emerald-800/70">
              {/* Left Sub-Box: HOW PLANTS MAKE FOOD? */}
              <div className="md:col-span-7 bg-[#051912]/95 border-2 border-emerald-600/50 rounded-2xl p-4 flex flex-col gap-2.5 shadow-inner">
                <span className="text-sm font-black text-amber-300 font-mono tracking-wider text-center">
                  HOW PLANTS MAKE FOOD?
                </span>

                <div className="flex items-center justify-around text-center text-xs pt-1">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">☀️</span>
                    <span className="text-xs font-bold text-amber-200 mt-1">Sunlight</span>
                  </div>
                  <span className="text-amber-400 font-black text-lg">+</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">💧</span>
                    <span className="text-xs font-bold text-cyan-200 mt-1">Water (H2O)</span>
                  </div>
                  <span className="text-amber-400 font-black text-lg">+</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">☁️</span>
                    <span className="text-xs font-bold text-slate-200 mt-1">Carbon dioxide (CO2)</span>
                  </div>
                  <span className="text-emerald-400 font-black text-lg">➔</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">🌿</span>
                    <span className="text-xs font-bold text-emerald-300 mt-1">Plant (Photosynthesis)</span>
                  </div>
                  <span className="text-amber-400 font-black text-lg">➔</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">🍞</span>
                    <span className="text-xs font-bold text-amber-200 mt-1">Food (Glucose)</span>
                  </div>
                </div>
              </div>

              {/* Right Sub-Box: KEY IDEA */}
              <div className="md:col-span-5 bg-[#051912]/95 border-2 border-emerald-600/50 rounded-2xl p-4 flex flex-col justify-center gap-2 shadow-inner">
                <span className="text-sm font-black text-amber-300 font-mono tracking-wider flex items-center gap-2">
                  💡 KEY IDEA
                </span>
                <p className="text-xs md:text-sm leading-relaxed text-emerald-50 font-sans font-medium">
                  Plants use sunlight energy to make their own food through <strong className="text-amber-300">photosynthesis</strong>. This food helps the plant grow. When the grain is mature, farmers <strong className="text-amber-300">harvest</strong> it.
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

          {/* ASK EKAGURU ANYTHING AI+ PANEL */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-white">Ask EKAGURU Anything</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI+
              </span>
            </div>

            <div className="relative flex items-center gap-3">
              <input
                type="text"
                placeholder="Ask a question about this topic..."
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                className="flex-1 pl-4 pr-12 py-3 bg-[#080d19] border border-slate-700/80 rounded-xl text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-inner"
              />
              <button className="absolute right-28 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white">
                <Mic className="w-5 h-5" />
              </button>
              <button className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs md:text-sm rounded-xl flex items-center gap-2 shadow-md shadow-purple-600/30">
                <Sparkles className="w-4 h-4" /> Ask
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex items-center gap-2.5 overflow-x-auto text-xs pt-1">
              {[
                'Why do farmers thank the Sun?',
                'How does photosynthesis work?',
                'What is rangoli?',
                'Why is harvest important?',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setAskInput(prompt)}
                  className="px-4 py-2 rounded-full bg-[#080d19] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 whitespace-nowrap transition-colors text-xs font-medium"
                >
                  {prompt}
                </button>
              ))}
              <button className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* 3. BOTTOM PROGRESSION & NAVIGATION BAR                               */}
      {/* ==================================================================== */}
      <footer className="h-14 px-6 bg-[#080d19] border-t border-slate-800/80 flex items-center justify-between z-30 shrink-0">
        {/* Left: Source Verified Notice */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Source Verified
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Content is verified from your textbook
          </span>
        </div>

        {/* Center: Mastery Progress Indicator */}
        <div className="flex items-center gap-3.5">
          <div className="text-left hidden md:block">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black text-slate-200">Mastery Progress</span>
              <div className="w-36 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[66%]" />
              </div>
              <span className="text-xs font-black text-emerald-400">66%</span>
            </div>
            <span className="text-[10px] text-slate-400">3 of 5 key ideas understood</span>
          </div>

          <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300">
            View Details
          </button>
        </div>

        {/* Right: Back & Next Buttons */}
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Chapter
          </button>

          <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all">
            Continue to Next Lesson <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ==================================================================== */}
      {/* 4. LEARN & BOOK UPLOAD / SELECTION MODAL                             */}
      {/* ==================================================================== */}
      {showLearnModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b1120] border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Textbook Library & Ingestion Center
                  </h3>
                  <p className="text-xs text-slate-400">Choose an existing book from your list or upload a new textbook</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowLearnModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selection */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setLearnTab('my_books')}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  learnTab === 'my_books'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Book className="w-4 h-4" /> My Existing Books ({booksList.length})
              </button>

              <button
                onClick={() => setLearnTab('upload_new')}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  learnTab === 'upload_new'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UploadCloud className="w-4 h-4" /> Upload New Textbook
              </button>
            </div>

            {/* TAB 1: MY EXISTING BOOKS */}
            {learnTab === 'my_books' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[55vh] p-1 custom-scrollbar">
                {booksList.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => handleBookSelect(book)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-3.5 group hover:scale-[1.01] ${
                      selectedBook.id === book.id
                        ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/40'
                        : 'bg-[#0e1628] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Book Cover Thumbnail */}
                    <div
                      className={`w-20 h-28 rounded-xl bg-gradient-to-br ${book.coverBg} p-2 flex flex-col justify-between text-white shadow-md shrink-0`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider opacity-80">{book.subject.slice(0, 4)}</span>
                        <Book className="w-3.5 h-3.5 opacity-80" />
                      </div>
                      <div className="text-center">
                        <span className="text-[11px] font-black leading-tight block drop-shadow-sm">{book.title.split(':')[0]}</span>
                        <span className="text-[8px] opacity-75 font-semibold">{book.grade}</span>
                      </div>
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white" style={{ width: `${book.mastery}%` }} />
                      </div>
                    </div>

                    {/* Book Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {book.subject} • {book.grade}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-white mt-1.5 group-hover:text-purple-200 transition">
                          {book.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed font-serif">
                          {book.pageSnippet}
                        </p>
                      </div>

                      {/* Stats & Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2">
                        <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
                          <span>{book.chapters} Chapters</span>
                          <span>•</span>
                          <span>{book.concepts} Concepts</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">{book.mastery}% Mastered</span>
                        </div>

                        <button className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm">
                          Open <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: UPLOAD NEW TEXTBOOK */}
            {learnTab === 'upload_new' && (
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[55vh] p-1 custom-scrollbar">
                {uploadSuccess ? (
                  <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                      <Check className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-black text-white">Textbook Uploaded & Ingested Successfully!</h4>
                    <p className="text-xs text-slate-300 max-w-md">
                      The textbook knowledge universe has been extracted and grounded to source pages. Loading your book into the Classroom Studio...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Drag and Drop Zone */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-2xl p-8 bg-[#0e1628]/60 hover:bg-purple-950/20 flex flex-col items-center justify-center text-center cursor-pointer transition group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.epub,.txt"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="w-14 h-14 rounded-2xl bg-purple-600/20 group-hover:bg-purple-600/30 text-purple-400 flex items-center justify-center mb-3 transition">
                        <FileUp className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-black text-white">
                        {uploadFile ? uploadFile.name : 'Click to browse or drag & drop your textbook PDF'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for processing` : 'Supports NCERT, CBSE, State Board and ICSE textbooks (PDF up to 500MB)'}
                      </p>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">Textbook Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Science Class 5 - Nature"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-[#080d19] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">Subject</label>
                        <select
                          value={uploadSubject}
                          onChange={(e) => setUploadSubject(e.target.value)}
                          className="w-full px-3 py-2 bg-[#080d19] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="Science">General Science</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Environmental Studies">Environmental Studies</option>
                          <option value="Social Studies">Social Studies / Heritage</option>
                          <option value="English">English Literature</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">Grade / Class</label>
                        <select
                          value={uploadGrade}
                          onChange={(e) => setUploadGrade(e.target.value)}
                          className="w-full px-3 py-2 bg-[#080d19] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="Class 3">Class 3</option>
                          <option value="Class 4">Class 4</option>
                          <option value="Class 5">Class 5</option>
                          <option value="Class 6">Class 6</option>
                          <option value="Class 7">Class 7</option>
                          <option value="Class 8">Class 8</option>
                        </select>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setLearnTab('my_books')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleStartUpload}
                        disabled={isUploading}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Ingesting & Processing Textbook...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" /> Start AI Knowledge Ingestion
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Page Textbook Modal */}
      {showFullPageModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1424] border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">📖 Textbook Page 2: Festivals of India</h3>
              <button onClick={() => setShowFullPageModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 bg-amber-50 text-slate-900 rounded-xl font-serif text-xs leading-relaxed max-h-96 overflow-y-auto">
              <h4 className="font-bold text-rose-800 mb-2">Festivals of India</h4>
              <p>India is a land of festivals. We celebrate different kinds of festivals in the country.</p>
              <p className="mt-2">Sankranthi is a popular harvest festival. Many people make colourful muggu (rangoli) at the entrance of their houses. Many people also fly kites on Sankranthi.</p>
            </div>
            <button
              onClick={() => setShowFullPageModal(false)}
              className="py-2 px-4 rounded-xl bg-purple-600 text-white font-bold text-xs self-end"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Full Chapter Index Modal */}
      {showIndexModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1424] border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">📑 Unit 1: Chapter Index</h3>
              <button onClick={() => setShowIndexModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-300">
              <div className="p-2 rounded bg-purple-950/50 border border-purple-500/40 text-purple-200 font-bold">1. Festivals of India (Page 2)</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">2. Harvest Festivals in India (Page 5)</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">3. Regional Festivals (Page 9)</div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">4. Unity in Diversity (Page 13)</div>
            </div>
            <button
              onClick={() => setShowIndexModal(false)}
              className="py-2 px-4 rounded-xl bg-slate-800 text-white font-bold text-xs self-end"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
