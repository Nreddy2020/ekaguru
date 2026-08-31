'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Flame,
  Gem,
  Home,
  BookOpen,
  FileText,
  TrendingUp,
  Settings,
  Users,
  CheckCircle2,
  ChevronDown,
  UploadCloud,
  Plus,
  Book,
  X,
  Clock,
  Check,
  FileUp,
  ArrowRight,
  Loader2,
  LayoutGrid,
  List as ListIcon,
  BookCheck,
  Microscope,
  Calculator,
  Landmark,
  FileText as DocumentIcon,
} from 'lucide-react';

export interface BookModel {
  id: string;
  title: string;
  subject: string;
  grade: string;
  chaptersCount: number;
  conceptsCount: number;
  status: 'READY' | 'ANALYSING';
  progress?: number;
  currentStage?: string;
  cardGradient: string;
  iconType: 'book' | 'math' | 'science' | 'heritage';
  lastLessonId?: string;
}

const INITIAL_BOOKS: BookModel[] = [
  {
    id: 'f309dd23-dc84-4dfa-8a4c-94d0e0e09049',
    title: 'Environmental Studies: Festivals & Living Earth',
    subject: 'Environmental Studies',
    grade: 'CLASS 5',
    chaptersCount: 18,
    conceptsCount: 54,
    status: 'READY',
    cardGradient: 'from-[#b84218] via-[#851e18] to-[#14080a]',
    iconType: 'book',
    lastLessonId: 'festivals-of-india',
  },
  {
    id: 'math-class-5',
    title: 'Mathematics: Shapes, Fractions & Geometry',
    subject: 'Mathematics',
    grade: 'CLASS 5',
    chaptersCount: 18,
    conceptsCount: 72,
    status: 'READY',
    cardGradient: 'from-[#4338ca] via-[#2563eb] to-[#080e1e]',
    iconType: 'math',
    lastLessonId: 'angles-triangles',
  },
  {
    id: 'science-class-6',
    title: 'General Science: Living Systems & Matter',
    subject: 'Science',
    grade: 'CLASS 6',
    chaptersCount: 12,
    conceptsCount: 68,
    status: 'ANALYSING',
    progress: 68,
    currentStage: 'Building Knowledge Universe Graph (Step 5 of 7)',
    cardGradient: 'from-[#047857] via-[#065f46] to-[#041510]',
    iconType: 'science',
  },
  {
    id: 'heritage-class-5',
    title: 'Our Heritage: Social Studies & Civics',
    subject: 'Social Studies',
    grade: 'CLASS 5',
    chaptersCount: 10,
    conceptsCount: 40,
    status: 'READY',
    cardGradient: 'from-[#b45309] via-[#92400e] to-[#170e06]',
    iconType: 'heritage',
    lastLessonId: 'ancient-civilizations',
  },
];

const INGESTION_STAGES = [
  'UPLOADED',
  'READING BOOK',
  'EXTRACTING CONTENT',
  'UNDERSTANDING STRUCTURE',
  'ANALYSING CONTENT',
  'BUILDING KNOWLEDGE',
  'VERIFYING',
  'READY TO LEARN',
];

export function EkaguruLearnHome() {
  const router = useRouter();
  const [books, setBooks] = useState<BookModel[]>(INITIAL_BOOKS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('Science');
  const [uploadGrade, setUploadGrade] = useState('Class 5');
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadStageIndex, setCurrentUploadStageIndex] = useState(0);

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

  const handleStartIngestion = () => {
    if (!uploadFile && !uploadTitle) return;
    setIsUploading(true);
    setCurrentUploadStageIndex(0);

    let stage = 0;
    const interval = setInterval(() => {
      stage += 1;
      setCurrentUploadStageIndex(stage);
      if (stage >= INGESTION_STAGES.length - 1) {
        clearInterval(interval);
        setTimeout(() => {
          const newBook: BookModel = {
            id: `book-${Date.now()}`,
            title: uploadTitle || uploadFile?.name || 'New Textbook',
            subject: uploadSubject,
            grade: `CLASS ${uploadGrade.replace(/[^0-9]/g, '') || '5'}`,
            chaptersCount: 8,
            conceptsCount: 42,
            status: 'READY',
            cardGradient: 'from-[#6b21a8] via-[#4c1d95] to-[#12071f]',
            iconType: 'book',
            lastLessonId: 'chapter-1',
          };
          setBooks([newBook, ...books]);
          setIsUploading(false);
          setShowUploadModal(false);
          router.push(`/learn/books/${newBook.id}/lessons/${newBook.lastLessonId}`);
        }, 600);
      }
    }, 400);
  };

  const renderCardIcon = (type: 'book' | 'math' | 'science' | 'heritage') => {
    switch (type) {
      case 'book':
        return (
          <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-400/40 flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20">
            📖
          </div>
        );
      case 'math':
        return (
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-400/40 flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/20">
            📐
          </div>
        );
      case 'science':
        return (
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/20">
            🔬
          </div>
        );
      case 'heritage':
        return (
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/20">
            🏛️
          </div>
        );
    }
  };

  return (
    <div
      data-testid="ekaguru-learn-home"
      className="flex flex-col w-screen h-screen max-h-screen bg-[#070b14] text-slate-100 font-sans select-none overflow-hidden"
    >
      {/* ==================================================================== */}
      {/* 1. TOP NAVBAR HEADER                                                 */}
      {/* ==================================================================== */}
      <header className="h-16 px-6 bg-[#0a0f1d] border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-white leading-tight">EKAGURU</h1>
            <p className="text-[10px] text-slate-400 font-medium">From Textbook to Universe</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
            <Flame className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[8.5px] uppercase tracking-wider text-amber-400/90 font-black block leading-none">LEARNING STREAK</span>
              <span className="text-xs font-black text-amber-300">14 days</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-sm">
            <Gem className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <span className="text-[8.5px] uppercase tracking-wider text-purple-400/90 font-black block leading-none">EXPLORER LEVEL</span>
              <span className="text-xs font-black text-purple-300">Young Scientist</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pl-4 border-l border-slate-800/80">
            <div className="w-9 h-9 rounded-full bg-[#10b981] flex items-center justify-center font-bold text-slate-950 text-sm shadow-md">
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
      {/* 2. MAIN BODY: LEFT NAV + EXPANSIVE LEARN HOME STAGE                  */}
      {/* ==================================================================== */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        {/* Left Global Nav Rail */}
        <nav className="w-20 bg-[#080d19] border-r border-slate-800/80 flex flex-col items-center justify-between py-6 shrink-0 z-20">
          <div className="flex flex-col items-center gap-4">
            <button className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex flex-col items-center gap-1.5">
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium">Home</span>
            </button>

            <button className="p-3 rounded-2xl bg-[#6366f1] text-white shadow-lg shadow-indigo-600/30 flex flex-col items-center gap-1.5">
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-bold">Learn</span>
            </button>

            <button className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex flex-col items-center gap-1.5">
              <FileText className="w-5 h-5" />
              <span className="text-[10px] font-medium">Notebook</span>
            </button>

            <button className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex flex-col items-center gap-1.5">
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-medium">Progress</span>
            </button>

            <button className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex flex-col items-center gap-1.5">
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-medium">Groups</span>
            </button>
          </div>

          <button className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex flex-col items-center gap-1.5">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </nav>

        {/* Learn Home Stage */}
        <main className="flex-1 flex flex-col p-6 lg:p-8 bg-[#070b14] overflow-y-auto gap-6 custom-scrollbar justify-between">
          <div className="flex flex-col gap-6">
            {/* Header Title + Upload New Book Button */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#a855f7]">LEARN</span>
                <h2 className="text-2xl lg:text-3xl font-black text-white mt-0.5">
                  My Textbooks & Learning Universe
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload new textbooks for zero-code onboarding or continue your adaptive Socratic teaching experience.
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New Book</span>
              </button>
            </div>

            {/* Upload a New Textbook Banner Box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => setShowUploadModal(true)}
              className="w-full rounded-2xl border border-slate-800 bg-[#090f1d] hover:bg-[#0c1426] p-5 flex items-center justify-between cursor-pointer transition-all shadow-lg group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Upload a new textbook</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Drag & drop your PDF here, or click to browse
                  </p>
                  <p className="text-xs text-slate-500">
                    We'll analyse it and build your learning universe.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <button className="px-4 py-2 rounded-xl bg-[#11192e] hover:bg-[#18233d] border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 shadow-sm">
                  <DocumentIcon className="w-4 h-4 text-purple-400" />
                  <span>Browse Files</span>
                </button>
                <span className="text-[10px] text-slate-500">PDF up to 200MB</span>
              </div>
            </div>

            {/* MY BOOKS Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Book className="w-4 h-4 text-purple-400" />
                  MY BOOKS ({books.length})
                </h3>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-[#0d1424] border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-2 cursor-pointer">
                    <span>Sort by: Recent</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>

                  <div className="flex items-center bg-[#0d1424] border border-slate-800 rounded-xl p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Textbook Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {books.map((book) => (
                  <div
                    key={book.id}
                    className={`rounded-3xl bg-gradient-to-b ${book.cardGradient} border border-white/10 p-5 flex flex-col justify-between shadow-2xl min-h-[380px] relative overflow-hidden group hover:scale-[1.01] transition-transform`}
                  >
                    <div>
                      {/* Top Pills */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black tracking-wider bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur text-white/90">
                          {book.grade}
                        </span>

                        {book.status === 'READY' ? (
                          <span className="text-[9.5px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center gap-1 backdrop-blur">
                            <CheckCircle2 className="w-3 h-3" /> Ready to Learn
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center gap-1 backdrop-blur animate-pulse">
                            <Clock className="w-3 h-3" /> Analysing...
                          </span>
                        )}
                      </div>

                      {/* Center Glowing Icon */}
                      <div className="flex items-center justify-center my-3">
                        {renderCardIcon(book.iconType)}
                      </div>

                      {/* Title & Subject */}
                      <div className="text-center mt-3">
                        <h4 className="text-sm font-black text-white leading-tight">
                          {book.title}
                        </h4>
                        <span className="text-[11px] text-amber-200/80 font-medium mt-1 block">
                          {book.subject}
                        </span>
                      </div>
                    </div>

                    {/* Lower Info & Footer */}
                    <div className="flex flex-col gap-3 pt-3 border-t border-white/10 mt-2">
                      {book.status === 'READY' ? (
                        <>
                          <div className="flex items-center justify-around text-xs text-white/80">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 opacity-80" /> {book.chaptersCount} Chapters
                            </span>
                            <span>{book.conceptsCount} Concepts</span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <Link
                              href={`/learn/books/${book.id}`}
                              className="text-xs text-white/70 hover:text-white font-medium"
                            >
                              View Chapters
                            </Link>

                            <Link
                              href={`/learn/books/${book.id}/lessons/${book.lastLessonId || 'festivals-of-india'}`}
                              className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-lg shadow-purple-600/30"
                            >
                              {book.id === 'f309dd23-dc84-4dfa-8a4c-94d0e0e09049' ? (
                                <>
                                  <span>Continue Lesson</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </>
                              ) : (
                                <>
                                  <span>Open Book</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-around text-xs text-white/80">
                            <span>📖 {book.chaptersCount} Chapters</span>
                            <span>{book.conceptsCount} Concepts</span>
                          </div>

                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
                              <span>Processing Pipeline</span>
                              <span>{book.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400" style={{ width: `${book.progress}%` }} />
                            </div>
                            <span className="text-[9px] text-white/60 mt-0.5">{book.currentStage}</span>
                          </div>

                          <button
                            disabled
                            className="w-full py-2 bg-black/30 text-white/80 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-90 mt-1"
                          >
                            View Status ➔
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Banner: How EKAGURU Works */}
          <div className="w-full rounded-2xl bg-[#090f1d] border border-slate-800/80 px-6 py-4 flex items-center justify-between flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black text-white">How EKAGURU works</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs">
                    <FileUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block text-white">1. Upload</span>
                    <span className="text-[10px] text-slate-400">Add your textbook</span>
                  </div>
                </div>

                <span className="text-slate-600 font-bold">➔</span>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">
                    🧠
                  </div>
                  <div>
                    <span className="font-bold block text-white">2. Analyse</span>
                    <span className="text-[10px] text-slate-400">EKAGURU understands</span>
                  </div>
                </div>

                <span className="text-slate-600 font-bold">➔</span>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">
                    🌐
                  </div>
                  <div>
                    <span className="font-bold block text-white">3. Build Universe</span>
                    <span className="text-[10px] text-slate-400">Knowledge map created</span>
                  </div>
                </div>

                <span className="text-slate-600 font-bold">➔</span>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">
                    🧑‍🏫
                  </div>
                  <div>
                    <span className="font-bold block text-white">4. Teach & Learn</span>
                    <span className="text-[10px] text-slate-400">Adaptive Socratic experience</span>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/learn/about"
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition"
            >
              Learn more about EKAGURU ➔
            </Link>
          </div>
        </main>
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b1120] border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Upload New Textbook</h3>
                  <p className="text-[10px] text-slate-400">Zero-code onboarding into EKAGURU Mind Knowledge Universe</p>
                </div>
              </div>
              <button
                onClick={() => !isUploading && setShowUploadModal(false)}
                disabled={isUploading}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isUploading ? (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-600/20">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">
                    {INGESTION_STAGES[currentUploadStageIndex]}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Step {currentUploadStageIndex + 1} of {INGESTION_STAGES.length} • Extracting canonical source truth
                  </p>
                </div>

                <div className="w-full max-w-md h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${((currentUploadStageIndex + 1) / INGESTION_STAGES.length) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-2xl p-6 bg-[#0e1628]/60 hover:bg-purple-950/20 flex flex-col items-center justify-center text-center cursor-pointer transition group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.epub,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 group-hover:bg-purple-600/30 text-purple-400 flex items-center justify-center mb-2 transition">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-black text-white">
                    {uploadFile ? uploadFile.name : 'Click to browse or drag & drop textbook PDF'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Verified` : 'Supports NCERT, CBSE, ICSE & State Textbooks (up to 200MB)'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-3">
                    <label className="text-[10.5px] font-bold text-slate-300 block mb-1">Book Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Environmental Studies Class 5"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#080d19] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-300 block mb-1">Subject</label>
                    <select
                      value={uploadSubject}
                      onChange={(e) => setUploadSubject(e.target.value)}
                      className="w-full px-2.5 py-2 bg-[#080d19] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Environmental Studies">EVS</option>
                      <option value="Science">Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Social Studies">Social Studies</option>
                      <option value="English">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-300 block mb-1">Grade</label>
                    <select
                      value={uploadGrade}
                      onChange={(e) => setUploadGrade(e.target.value)}
                      className="w-full px-2.5 py-2 bg-[#080d19] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Class 3">Class 3</option>
                      <option value="Class 4">Class 4</option>
                      <option value="Class 5">Class 5</option>
                      <option value="Class 6">Class 6</option>
                      <option value="Class 7">Class 7</option>
                      <option value="Class 8">Class 8</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-300 block mb-1">Curriculum</label>
                    <select className="w-full px-2.5 py-2 bg-[#080d19] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                      <option value="NCERT">NCERT</option>
                      <option value="CBSE">CBSE</option>
                      <option value="State">State Board</option>
                      <option value="ICSE">ICSE</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartIngestion}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Start Ingestion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
