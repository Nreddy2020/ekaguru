'use client';

import React, { useState } from 'react';
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
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Mic,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Layers,
  HelpCircle,
  Sun,
  Droplets,
  Cloud,
  Sprout,
  Wheat,
  Share2,
  Menu,
} from 'lucide-react';

export interface UniversalKnowledgeUniverseStudioProps {
  sectionId?: string;
  sectionTitle?: string;
  conceptName?: string;
  description?: string;
  printedPage?: number;
  className?: string;
}

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
  const [teachingStyle, setTeachingStyle] = useState<'graphical_board' | 'socratic' | 'story'>('graphical_board');
  const [activeBoardTab, setActiveBoardTab] = useState<'teacher_explains' | 'visuals' | 'real_world' | 'key_points' | 'summary'>('teacher_explains');
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [askInput, setAskInput] = useState<string>('');
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [showFullPageModal, setShowFullPageModal] = useState<boolean>(false);
  const [showIndexModal, setShowIndexModal] = useState<boolean>(false);

  const toggleAudio = () => {
    setAudioPlaying(!audioPlaying);
  };

  return (
    <div
      data-testid="universal-knowledge-universe-studio"
      className={`flex flex-col w-screen h-screen max-h-screen bg-[#070b14] text-slate-100 font-sans select-none overflow-hidden ${className}`}
    >
      {/* ==================================================================== */}
      {/* 1. TOP HEADER NAVBAR                                                 */}
      {/* ==================================================================== */}
      <header className="h-14 px-4 bg-[#0a0f1d] border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-white flex items-center gap-1 leading-tight">
                EKAGURU
              </h1>
              <p className="text-[9px] text-slate-400 font-medium">From Textbook to Universe</p>
            </div>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="relative w-96 hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder='Ask anything about "Sankranthi"...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-1.5 bg-[#0d1424] border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
            ⌘ K
          </span>
        </div>

        {/* Right: Badges & Profile */}
        <div className="flex items-center gap-3">
          {/* Learning Streak */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
            <Flame className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[7.5px] uppercase tracking-wider text-amber-400/80 font-bold block leading-none">Learning Streak</span>
              <span className="text-xs font-black text-amber-300">14 days</span>
            </div>
          </div>

          {/* Explorer Level */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-sm">
            <Gem className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <span className="text-[7.5px] uppercase tracking-wider text-purple-400/80 font-bold block leading-none">Explorer Level</span>
              <span className="text-xs font-black text-purple-300">Young Scientist</span>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md">
              A
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <span className="text-xs font-bold text-white block">Aarav</span>
              <span className="text-[9px] text-slate-400">Class 5</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. MAIN BODY: LEFT NAV + TEXTBOOK CARD + GRAPHICAL STAGE            */}
      {/* ==================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ------------------------------------------------------------------ */}
        {/* GLOBAL MINI SIDEBAR NAV                                            */}
        {/* ------------------------------------------------------------------ */}
        <nav className="w-16 bg-[#080d19] border-r border-slate-800/80 flex flex-col items-center justify-between py-3 shrink-0 z-20">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setActiveNav('home')}
              className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 ${
                activeNav === 'home' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[8px] font-medium">Home</span>
            </button>

            <button
              onClick={() => setActiveNav('learn')}
              className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 ${
                activeNav === 'learn' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-[8px] font-medium">Learn</span>
            </button>

            <button
              onClick={() => setActiveNav('notebook')}
              className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 ${
                activeNav === 'notebook' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-[8px] font-medium">Notebook</span>
            </button>

            <button
              onClick={() => setActiveNav('progress')}
              className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 ${
                activeNav === 'progress' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-[8px] font-medium">Progress</span>
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setActiveNav('settings')}
              className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 ${
                activeNav === 'settings' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-[8px] font-medium">Settings</span>
            </button>

            <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60">
              <Users className="w-4 h-4" />
            </button>

            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center">
              A
            </div>
          </div>
        </nav>

        {/* ------------------------------------------------------------------ */}
        {/* LEFT COLUMN: FROM YOUR TEXTBOOK + CHAPTER INDEX                    */}
        {/* ------------------------------------------------------------------ */}
        <aside className="w-[280px] lg:w-[300px] xl:w-[310px] bg-[#080d19] border-r border-slate-800/80 p-3.5 flex flex-col justify-between overflow-y-auto shrink-0 gap-3 custom-scrollbar">
          <div className="flex flex-col gap-3">
            {/* Header & Source Verified Pill */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-white block">
                  FROM YOUR TEXTBOOK
                </span>
                <span className="text-[9.5px] text-slate-400">Page 2 • Sankranthi</span>
              </div>
              <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Source Verified
              </span>
            </div>

            {/* High-Fidelity Textbook Card */}
            <div className="rounded-xl overflow-hidden border border-slate-700/80 bg-[#fffdfa] text-slate-900 p-3.5 shadow-xl relative">
              {/* Blue circular page badge */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shadow">
                  2
                </span>
                <span className="text-base">🪁</span>
              </div>

              <h3 className="text-xs font-black text-rose-800 mb-1.5">
                Festivals of India
              </h3>

              <p className="text-[9px] leading-relaxed text-slate-700 font-serif mb-2">
                India is a land of festivals. We celebrate different kinds of festivals in the country.
              </p>
              <p className="text-[9px] leading-relaxed text-slate-700 font-serif mb-3">
                <strong>Sankranthi</strong> is a popular harvest festival. Many people make colourful <em>muggulu (rangoli)</em> at the entrance of their houses. Many people also fly kites on Sankranthi. It is celebrated in many parts of India.
              </p>

              {/* Illustration */}
              <div className="w-full bg-amber-50 rounded-lg p-2 border border-amber-200/80 flex items-center justify-around text-2xl shadow-inner">
                <span title="Rangoli">🌸</span>
                <span title="Celebration">👩‍👧‍👦</span>
                <span title="Pot">🍯</span>
                <span title="Kite">🪁</span>
              </div>
            </div>

            {/* View Full Page Button */}
            <button
              onClick={() => setShowFullPageModal(true)}
              className="w-full py-1.5 rounded-lg bg-[#0d1424] hover:bg-slate-800 border border-slate-700/80 text-[10px] font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> View Full Page
            </button>

            {/* Index of this chapter */}
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                INDEX OF THIS CHAPTER
              </span>

              <div className="flex flex-col gap-1">
                {[
                  { id: 1, title: '1. Festivals of India', active: true },
                  { id: 2, title: '2. Harvest Festivals in India', hasSub: true },
                  { id: 3, title: '3. Regional Festivals', hasSub: true },
                  { id: 4, title: '4. Unity in Diversity', hasSub: true },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveChapterIndex(item.id)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-[10px] font-medium flex items-center justify-between transition-all ${
                      item.active || activeChapterIndex === item.id
                        ? 'bg-purple-950/60 border border-purple-500/50 text-purple-200 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                    }`}
                  >
                    <span>{item.title}</span>
                    {item.active || activeChapterIndex === item.id ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-slate-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* View Full Chapter Index */}
              <button
                onClick={() => setShowIndexModal(true)}
                className="mt-1 w-full py-1.5 rounded-lg bg-[#0d1424] hover:bg-slate-800 border border-slate-700/80 text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" /> View Full Chapter Index
              </button>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------------------ */}
        {/* CENTER & RIGHT: GRAPHICAL BOARD & INTERACTION STAGE                */}
        {/* ------------------------------------------------------------------ */}
        <main className="flex-1 flex flex-col p-4 bg-[#070b14] overflow-y-auto gap-3.5 custom-scrollbar">
          {/* Top Row: Engine Analysis & Stats */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
                EKAGURU ENGINE ANALYSIS
                <span className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AI
                </span>
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Page analysed in 1.2s
              </span>
            </div>

            {/* 4 Stat Badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400 font-bold">Concepts</span>
                <span className="text-emerald-300 font-black">12</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-slate-400 font-bold">Key Ideas</span>
                <span className="text-blue-300 font-black">6</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-slate-400 font-bold">Connections</span>
                <span className="text-purple-300 font-black">18</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-400 font-bold">Questions</span>
                <span className="text-amber-300 font-black">5</span>
              </div>
            </div>
          </div>

          {/* Second Row: Teaching Depth & Style */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
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
                  className={`px-3 py-1 rounded-xl text-[9.5px] text-center border transition-all flex flex-col items-center ${
                    activeDepth === lvl.id
                      ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-lg shadow-purple-600/30 ring-1 ring-purple-300'
                      : 'bg-[#0d1424] border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{lvl.title}</span>
                  <span className="text-[7.5px] opacity-75">{lvl.sub}</span>
                </button>
              ))}
            </div>

            {/* Teaching Style Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] text-slate-400 font-medium">Teaching Style</span>
              <div className="px-2.5 py-1 rounded-xl bg-[#0d1424] border border-slate-700/80 text-[10px] font-bold text-white flex items-center gap-1.5 cursor-pointer hover:border-slate-600 shadow-sm">
                <span>Graphical Board</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* THE GRAPHICAL CHALKBOARD / BLACKBOARD VIEW                       */}
          {/* ================================================================ */}
          <div className="relative rounded-2xl bg-[#061e16] border-[6px] border-[#3f2e18] shadow-2xl p-5 overflow-hidden text-emerald-100 flex flex-col justify-between min-h-[380px]">
            {/* Chalkboard Texture Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#143d2b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

            {/* Sound Icon in Top Right */}
            <button
              onClick={toggleAudio}
              className={`absolute right-3.5 top-3.5 p-2 rounded-xl backdrop-blur-md transition z-20 ${
                audioPlaying ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300' : 'bg-slate-900/60 text-slate-300 hover:text-white'
              }`}
              title="Listen to Explanation"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Chalkboard Titles */}
            <div className="text-center z-10 mb-4">
              <h2 className="text-lg md:text-xl font-black tracking-widest text-[#f7d070] font-mono drop-shadow">
                SANKRANTHI – THE HARVEST FESTIVAL
              </h2>
              <p className="text-xs font-serif text-[#f294b4] mt-0.5 tracking-wide">
                A festival of gratitude, nature and togetherness.
              </p>
            </div>

            {/* 5-Step Visual Flowchart */}
            <div className="grid grid-cols-5 gap-2 items-center text-center z-10 my-2">
              {/* STEP 1: SUN */}
              <div className="flex flex-col items-center group">
                <div className="w-12 h-12 rounded-full bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  ☀️
                </div>
                <h4 className="text-[11px] font-black text-amber-300 mt-1.5 uppercase font-mono">SUN</h4>
                <p className="text-[8.5px] text-emerald-200/90 leading-tight mt-0.5 font-sans">
                  Gives us light and energy
                </p>
              </div>

              {/* STEP 2: PLANTS */}
              <div className="flex flex-col items-center group relative">
                <span className="absolute -left-3.5 top-3 text-purple-300 font-bold text-sm hidden md:block">→</span>
                <div className="w-12 h-12 rounded-full bg-emerald-400/20 border-2 border-emerald-300 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  🌿
                </div>
                <h4 className="text-[11px] font-black text-emerald-300 mt-1.5 uppercase font-mono">PLANTS</h4>
                <p className="text-[8.5px] text-emerald-200/90 leading-tight mt-0.5 font-sans">
                  Use sunlight to make their own food (Photosynthesis)
                </p>
              </div>

              {/* STEP 3: CROPS */}
              <div className="flex flex-col items-center group relative">
                <span className="absolute -left-3.5 top-3 text-amber-300 font-bold text-sm hidden md:block">→</span>
                <div className="w-12 h-12 rounded-full bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  🌾
                </div>
                <h4 className="text-[11px] font-black text-amber-300 mt-1.5 uppercase font-mono">CROPS</h4>
                <p className="text-[8.5px] text-emerald-200/90 leading-tight mt-0.5 font-sans">
                  Plants grow and produce grains
                </p>
              </div>

              {/* STEP 4: HARVEST */}
              <div className="flex flex-col items-center group relative">
                <span className="absolute -left-3.5 top-3 text-cyan-300 font-bold text-sm hidden md:block">→</span>
                <div className="w-12 h-12 rounded-full bg-cyan-400/20 border-2 border-cyan-300 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                  🧑‍🌾
                </div>
                <h4 className="text-[11px] font-black text-cyan-300 mt-1.5 uppercase font-mono">HARVEST</h4>
                <p className="text-[8.5px] text-emerald-200/90 leading-tight mt-0.5 font-sans">
                  Farmers harvest the mature crops
                </p>
              </div>

              {/* STEP 5: CELEBRATION */}
              <div className="flex flex-col items-center group relative">
                <span className="absolute -left-3.5 top-3 text-pink-300 font-bold text-sm hidden md:block">→</span>
                <div className="w-12 h-12 rounded-full bg-pink-400/20 border-2 border-pink-300 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
                  🎉
                </div>
                <h4 className="text-[11px] font-black text-pink-300 mt-1.5 uppercase font-mono">CELEBRATION</h4>
                <p className="text-[8.5px] text-emerald-200/90 leading-tight mt-0.5 font-sans">
                  We celebrate with joy, rangoli, kites, feasts and gratitude
                </p>
              </div>
            </div>

            {/* Chalkboard Sub-Panels (Bottom Row) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 z-10 mt-3 pt-3 border-t border-emerald-800/60">
              {/* Left Sub-Box: HOW PLANTS MAKE FOOD? */}
              <div className="md:col-span-7 bg-[#041610]/80 border border-emerald-600/40 rounded-xl p-2.5 flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-amber-300 font-mono tracking-wide text-center">
                  HOW PLANTS MAKE FOOD?
                </span>

                <div className="flex items-center justify-around text-center text-[8.5px] pt-1">
                  <div className="flex flex-col items-center">
                    <span className="text-base">☀️</span>
                    <span className="font-bold text-amber-200 mt-0.5">Sunlight</span>
                  </div>
                  <span className="text-amber-400 font-bold text-xs">+</span>
                  <div className="flex flex-col items-center">
                    <span className="text-base">💧</span>
                    <span className="font-bold text-cyan-200 mt-0.5">Water (H2O)</span>
                  </div>
                  <span className="text-amber-400 font-bold text-xs">+</span>
                  <div className="flex flex-col items-center">
                    <span className="text-base">☁️</span>
                    <span className="font-bold text-slate-200 mt-0.5">Carbon dioxide (CO2)</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-xs">→</span>
                  <div className="flex flex-col items-center">
                    <span className="text-base">🌿</span>
                    <span className="font-bold text-emerald-300 mt-0.5">Plant (Photosynthesis)</span>
                  </div>
                  <span className="text-amber-400 font-bold text-xs">→</span>
                  <div className="flex flex-col items-center">
                    <span className="text-base">🍞</span>
                    <span className="font-bold text-amber-200 mt-0.5">Food (Glucose)</span>
                  </div>
                </div>
              </div>

              {/* Right Sub-Box: KEY IDEA */}
              <div className="md:col-span-5 bg-[#041610]/80 border border-emerald-600/40 rounded-xl p-2.5 flex flex-col justify-center gap-1">
                <span className="text-[10px] font-black text-amber-300 font-mono tracking-wide flex items-center gap-1">
                  💡 KEY IDEA
                </span>
                <p className="text-[9.5px] leading-relaxed text-emerald-100 font-sans">
                  Plants use sunlight energy to make their own food through <strong>photosynthesis</strong>. This food helps the plant grow. When the grain is mature, farmers harvest it.
                </p>
              </div>
            </div>
          </div>

          {/* Action Tabs below Blackboard */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
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
                className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all whitespace-nowrap ${
                  activeBoardTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-[#0d1424] border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ================================================================ */}
          {/* ASK EKAGURU ANYTHING AI+ PANEL                                   */}
          {/* ================================================================ */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2 shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-white">Ask EKAGURU Anything</span>
              <span className="text-[8.5px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI+
              </span>
            </div>

            {/* Input Row */}
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask a question about this topic..."
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                className="flex-1 pl-4 pr-10 py-2 bg-[#080d19] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white">
                <Mic className="w-4 h-4" />
              </button>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/30">
                <Sparkles className="w-3.5 h-3.5" /> Ask
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[9.5px] pt-0.5">
              {[
                'Why do farmers thank the Sun?',
                'How does photosynthesis work?',
                'What is rangoli?',
                'Why is harvest important?',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setAskInput(prompt)}
                  className="px-2.5 py-1 rounded-full bg-[#080d19] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 whitespace-nowrap transition-colors"
                >
                  {prompt}
                </button>
              ))}
              <button className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white">
                <ArrowRight className="w-3 h-3" />
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
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Source Verified
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Content is verified from your textbook
          </span>
        </div>

        {/* Center: Mastery Progress Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-left hidden md:block">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-200">Mastery Progress</span>
              <div className="w-28 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[66%]" />
              </div>
              <span className="text-xs font-black text-emerald-400">66%</span>
            </div>
            <span className="text-[9px] text-slate-400">3 of 5 key ideas understood</span>
          </div>

          <button className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300">
            View Details
          </button>
        </div>

        {/* Right: Back & Next Buttons */}
        <div className="flex items-center gap-2">
          <button className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Chapter
          </button>

          <button className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all">
            Continue to Next Lesson <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

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
