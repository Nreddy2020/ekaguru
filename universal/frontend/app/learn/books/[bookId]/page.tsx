'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Sparkles, Layers } from 'lucide-react';

export default function BookChaptersPage({ params }: { params: { bookId: string } }) {
  const chapters = [
    {
      id: 'festivals-of-india',
      number: 1,
      title: 'Festivals of India: Harvest & Nature',
      page: 2,
      concepts: ['Sankranthi', 'Harvest Cycles', 'Photosynthesis Connection', 'Community Values'],
      completed: true,
    },
    {
      id: 'living-creatures',
      number: 2,
      title: 'Our Living World: Animals and Habitats',
      page: 18,
      concepts: ['Ecosystems', 'Food Chains', 'Adaptation'],
      completed: false,
    },
    {
      id: 'water-life',
      number: 3,
      title: 'Water: The Elixir of Life',
      page: 34,
      concepts: ['Water Cycle', 'Conservation', 'Aquifers'],
      completed: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 max-w-4xl mx-auto flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <Link
          href="/learn"
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Books
        </Link>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Ingested & Verified
        </span>
      </div>

      <div>
        <span className="text-xs font-black uppercase tracking-wider text-purple-400">TEXTBOOK OVERVIEW</span>
        <h1 className="text-2xl font-black text-white mt-1">Environmental Studies Class 5</h1>
        <p className="text-xs text-slate-400 mt-1">
          Select a chapter or lesson to enter the EKAGURU Teaching Experience runtime.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" /> CHAPTERS & LESSONS
        </h3>

        <div className="flex flex-col gap-3">
          {chapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/learn/books/${params.bookId}/lessons/${ch.id}`}
              className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 hover:border-purple-500/60 transition flex items-center justify-between group shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 font-black text-sm flex items-center justify-center border border-purple-500/30">
                  {ch.number}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-purple-200 transition">
                    {ch.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>Page {ch.page}</span>
                    <span>•</span>
                    <span>{ch.concepts.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1.5 bg-purple-600 group-hover:bg-purple-500 text-white rounded-xl flex items-center gap-1 shadow-md">
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
