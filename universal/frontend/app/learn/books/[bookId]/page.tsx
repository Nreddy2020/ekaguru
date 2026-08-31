'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronRight, Layers, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { BookStorageService, IngestedBookModel } from '../../../../lib/learning/book-storage.service';

export default function BookChaptersPage({ params }: { params: { bookId: string } }) {
  const [book, setBook] = useState<IngestedBookModel | undefined>(undefined);

  useEffect(() => {
    const loaded = BookStorageService.getBookById(params.bookId);
    setBook(loaded);
  }, [params.bookId]);

  if (!book) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 p-8 max-w-4xl mx-auto flex flex-col gap-6 font-sans">
        <Link href="/learn" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to My Books
        </Link>
        <div className="p-12 rounded-3xl bg-[#090f1d] border border-slate-800 text-center">
          <h2 className="text-lg font-black text-white">Book Not Found</h2>
          <p className="text-xs text-slate-400 mt-1">This book has not been ingested yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 lg:p-8 max-w-4xl mx-auto flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <Link
          href="/learn"
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Books
        </Link>

        {book.status === 'READY_TO_LEARN' ? (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ingested & Verified
          </span>
        ) : (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> {book.status.replace('_', ' ')}
          </span>
        )}
      </div>

      <div>
        <span className="text-xs font-black uppercase tracking-wider text-purple-400">
          {book.grade} • {book.subject}
        </span>
        <h1 className="text-2xl lg:text-3xl font-black text-white mt-1">{book.title}</h1>
        <p className="text-xs text-slate-400 mt-1">
          Select a chapter or lesson to enter the EKAGURU Teaching Experience runtime.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" /> CHAPTERS & LESSONS ({book.chapters.length})
        </h3>

        <div className="flex flex-col gap-3">
          {book.chapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/learn/books/${book.id}/lessons/${ch.id}`}
              className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 hover:border-purple-500/60 transition flex items-center justify-between group shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 font-black text-sm flex items-center justify-center border border-purple-500/30">
                  {ch.chapterNumber}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-purple-200 transition">
                    {ch.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="font-mono text-purple-300 font-bold">{ch.pageRangeText}</span>
                    <span>•</span>
                    <span>{ch.sections.length} Lessons</span>
                    <span>•</span>
                    <span>{ch.concepts.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-4 py-2 bg-purple-600 group-hover:bg-purple-500 text-white rounded-xl flex items-center gap-1 shadow-md">
                  Enter Lesson <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
