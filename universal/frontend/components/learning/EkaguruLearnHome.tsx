'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ChevronDown,
  Menu,
  UploadCloud,
  Plus,
  Book,
  X,
  Clock,
  ShieldCheck,
  Check,
  FileUp,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export interface BookModel {
  id: string;
  title: string;
  subject: string;
  grade: string;
  chaptersCount: number;
  conceptsCount: number;
  status: 'READY' | 'ANALYSING' | 'UPLOADED';
  progress?: number;
  currentStage?: string;
  coverBg: string;
  coverAccent: string;
  lastLessonTitle?: string;
  lastLessonId?: string;
}

const INITIAL_BOOKS: BookModel[] = [
  {
    id: 'f309dd23-dc84-4dfa-8a4c-94d0e0e09049',
    title: 'Environmental Studies: Festivals & Living Earth',
    subject: 'Environmental Studies',
    grade: 'Class 5',
    chaptersCount: 18,
    conceptsCount: 54,
    status: 'READY',
    coverBg: 'from-amber-600 to-rose-700',
    coverAccent: '#f59e0b',
    lastLessonTitle: 'Festivals of India - Sankranthi',
    lastLessonId: 'festivals-of-india',
  },
  {
    id: 'math-class-5',
    title: 'Mathematics: Shapes, Fractions & Geometry',
    subject: 'Mathematics',
    grade: 'Class 5',
    chaptersCount: 14,
    conceptsCount: 72,
    status: 'READY',
    coverBg: 'from-indigo-600 to-blue-700',
    coverAccent: '#6366f1',
    lastLessonTitle: 'Angles and Triangles',
    lastLessonId: 'angles-triangles',
  },
  {
    id: 'science-class-6',
    title: 'General Science: Living Systems & Matter',
    subject: 'Science',
    grade: 'Class 6',
    chaptersCount: 12,
    conceptsCount: 68,
    status: 'ANALYSING',
    progress: 68,
    currentStage: 'Building Knowledge Universe Graph (Step 5 of 7)',
    coverBg: 'from-emerald-600 to-teal-700',
    coverAccent: '#10b981',
  },
  {
    id: 'heritage-class-5',
    title: 'Our Heritage: Social Studies & Civics',
    subject: 'Social Studies',
    grade: 'Class 5',
    chaptersCount: 10,
    conceptsCount: 40,
    status: 'READY',
    coverBg: 'from-orange-600 to-amber-700',
    coverAccent: '#f97316',
    lastLessonTitle: 'Ancient Civilizations & Agriculture',
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
  const [searchQuery, setSearchQuery] = useState('');
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
            grade: uploadGrade,
            chaptersCount: 8,
            conceptsCount: 42,
            status: 'READY',
            coverBg: 'from-purple-600 to-indigo-700',
            coverAccent: '#a855f7',
            lastLessonTitle: 'Chapter 1: Foundations',
            lastLessonId: 'chapter-1',
          };
          setBooks([newBook, ...books]);
          setIsUploading(false);
          setShowUploadModal(false);
          router.push(`/learn/books/${newBook.id}/lessons/${newBook.lastLessonId}`);
        }, 800);
      }
    }, 450);
  };

  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-screen h-screen max-h-screen bg-[#070b14] text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 px-6 bg-[#0a0f1d] border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3.5">
          <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-wider text-white leading-tight">EKAGURU</h1>
              <p className="text-[10px] text-slate-400 font-medium">From Textbook to Universe</p>
            </div>
          </div>
        </div>

        <div className="relative w-[420px] hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search textbooks, chapters, or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-2 bg-[#0d1424] border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            ⌘ K
          </span>
        </div>

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

      {/* Main Container */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        {/* Left Global Nav */}
        <nav className="w-16 bg-[#080d19] border-r border-slate-800/80 flex flex-col items-center justify-between py-4 shrink-0 z-20">
          <div className="flex flex-col items-center gap-3">
            <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex flex-col items-center gap-1">
              <Home className="w-4 h-4" />
              <span className="text-[9px] font-medium">Home</span>
            </button>

            <button className="p-2.5 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30 flex flex-col items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-[9px] font-medium">Learn</span>
            </button>

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

        {/* Learn Home Stage */}
        <main className="flex-1 flex flex-col p-6 lg:p-8 bg-[#070b14] overflow-y-auto gap-6 custom-scrollbar">
          {/* Header Banner */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-purple-400">LEARN</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-medium">Your Learning Universe</span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">My Textbooks & Learning Universe</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Upload new textbooks for zero-code onboarding or continue your adaptive Socratic teaching experience.
              </p>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2.5 shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Book</span>
            </button>
          </div>

          {/* MY BOOKS Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Book className="w-4 h-4 text-purple-400" />
                MY BOOKS ({filteredBooks.length})
              </h3>
              <span className="text-xs text-slate-500">Source-verified canonical curriculum</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-[#0b1120] border border-slate-800/90 hover:border-purple-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-xl group hover:shadow-purple-950/20"
                >
                  <div>
                    {/* Book Cover Visual */}
                    <div className={`w-full h-36 rounded-xl bg-gradient-to-br ${book.coverBg} p-3.5 flex flex-col justify-between text-white shadow-md relative overflow-hidden`}>
                      <div className="flex items-center justify-between z-10">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-md backdrop-blur">
                          {book.grade}
                        </span>
                        {book.status === 'READY' ? (
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1 backdrop-blur">
                            <CheckCircle2 className="w-3 h-3" /> Ready to Learn
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 flex items-center gap-1 backdrop-blur animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" /> Analysing...
                          </span>
                        )}
                      </div>

                      <div className="z-10">
                        <h4 className="text-sm font-black leading-tight drop-shadow-md line-clamp-2">
                          {book.title}
                        </h4>
                        <span className="text-[10px] text-white/80 font-medium">{book.subject}</span>
                      </div>

                      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    </div>

                    {/* Book Metadata */}
                    <div className="pt-3.5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{book.chaptersCount} Chapters</span>
                        <span>•</span>
                        <span>{book.conceptsCount} Concepts</span>
                      </div>

                      {book.status === 'ANALYSING' && (
                        <div className="mt-2 flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
                            <span>Processing Pipeline</span>
                            <span>{book.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 animate-pulse" style={{ width: `${book.progress}%` }} />
                          </div>
                          <span className="text-[9.5px] text-slate-500 mt-0.5">{book.currentStage}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-800/80 mt-3 flex items-center justify-between">
                    {book.status === 'READY' ? (
                      <>
                        <Link
                          href={`/learn/books/${book.id}`}
                          className="text-xs text-slate-400 hover:text-white font-medium"
                        >
                          View Chapters
                        </Link>
                        <Link
                          href={`/learn/books/${book.id}/lessons/${book.lastLessonId || 'lesson-1'}`}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-colors"
                        >
                          <span>Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2 bg-slate-800 text-slate-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-75"
                      >
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ingestion in Progress
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* UPLOAD NEW BOOK MODAL WITH EXPLICIT PROCESSING PIPELINE */}
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
                    {uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Verified` : 'Supports NCERT, CBSE, ICSE & State Textbooks (up to 500MB)'}
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
