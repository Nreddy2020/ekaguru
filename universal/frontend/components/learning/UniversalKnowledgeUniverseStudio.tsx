'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Flame,
  Gem,
  BookOpen,
  CheckCircle2,
  Telescope,
  Compass,
  Plus,
  Minus,
  Maximize2,
  RotateCcw,
  Sun,
  Activity,
  Award,
  HelpCircle,
  Lightbulb,
  FileText,
  ChevronRight,
  X,
  Share2,
  Atom,
  Zap,
  Sprout,
  Users,
  Heart,
  Palette,
  Wind,
} from 'lucide-react';
import { LearnerMemoryEngine } from '@/lib/learning/learner-memory.engine';
import { EkaguruMindOrchestrator } from '@/lib/learning/ekaguru-mind.orchestrator';
import { ExplainabilityEngine } from '@/lib/learning/explainability.engine';

export interface UniversalKnowledgeUniverseStudioProps {
  bookTitle?: string;
  chapterTitle?: string;
  printedPage?: number;
  className?: string;
}

export function UniversalKnowledgeUniverseStudio({
  bookTitle = 'MY BODY & LIVING WORLD (EVS Class 5)',
  chapterTitle = 'Festivals of India',
  printedPage = 2,
  className = '',
}: UniversalKnowledgeUniverseStudioProps) {
  // Core Engine instances
  const memoryEngine = useMemo(() => new LearnerMemoryEngine(), []);
  const mindOrchestrator = useMemo(() => new EkaguruMindOrchestrator(), []);
  const explainabilityEngine = useMemo(() => new ExplainabilityEngine(memoryEngine), [memoryEngine]);

  const learnerId = 'aarav-class5';

  // Navigation & Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeNodeId, setActiveNodeId] = useState<string>('crop-growth');
  const [activeTriadTab, setActiveTriadTab] = useState<'SHOW_ME' | 'TEACH_ME' | 'TRY_IT' | 'GO_DEEPER'>('SHOW_ME');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tryItAnswer, setTryItAnswer] = useState<number | null>(null);
  const [tryItFeedback, setTryItFeedback] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Dynamic Nodes in the Universe
  const nodes = [
    { id: 'sankranthi-center', title: 'Sankranthi', subtitle: 'Harvest Festival', category: 'CORE', x: 50, y: 50, color: 'from-amber-400 to-amber-600', icon: '🌾' },
    { id: 'harvest', title: 'Harvest', subtitle: 'Reaping the crops', category: 'NATURE', parent: 'sankranthi-center', x: 45, y: 32, color: 'from-emerald-400 to-emerald-600', icon: '🚜' },
    { id: 'agriculture', title: 'Agriculture', subtitle: 'Farming systems', category: 'NATURE', parent: 'harvest', x: 43, y: 22, color: 'from-emerald-500 to-emerald-700', icon: '🌾' },
    { id: 'crops', title: 'Crops', subtitle: 'Paddy & Wheat', category: 'NATURE', parent: 'harvest', x: 52, y: 23, color: 'from-emerald-500 to-emerald-700', icon: '🌱' },
    { id: 'crop-growth', title: 'Plant Growth', subtitle: 'Seed to harvest', category: 'NATURE', parent: 'sankranthi-center', x: 25, y: 42, color: 'from-emerald-400 to-emerald-600', icon: '🌱' },
    { id: 'photosynthesis', title: 'Photosynthesis', subtitle: 'Solar food making', category: 'SCIENCE', parent: 'crop-growth', x: 33, y: 42, color: 'from-cyan-400 to-cyan-600', icon: '🍃' },
    { id: 'seed', title: 'Seed', subtitle: 'Dormancy & water', category: 'NATURE', parent: 'crop-growth', x: 27, y: 32, color: 'from-emerald-400 to-emerald-600', icon: '🌰' },
    { id: 'sunlight', title: 'Sunlight', subtitle: 'Photons energy', category: 'SCIENCE', parent: 'photosynthesis', x: 25, y: 52, color: 'from-amber-400 to-amber-500', icon: '☀️' },
    { id: 'sun', title: 'The Sun', subtitle: 'Star of solar system', category: 'COSMOS', parent: 'sankranthi-center', x: 34, y: 58, color: 'from-amber-500 to-orange-600', icon: '☀️' },
    { id: 'energy', title: 'Energy', subtitle: 'Radiation waves', category: 'SCIENCE', parent: 'sun', x: 26, y: 62, color: 'from-amber-400 to-amber-600', icon: '⚡' },
    { id: 'nuclear-fusion', title: 'Nuclear Fusion', subtitle: 'Hydrogen to Helium', category: 'COSMOS', parent: 'sun', x: 32, y: 70, color: 'from-blue-500 to-indigo-600', icon: '⚛️' },
    { id: 'atoms', title: 'Atoms', subtitle: 'Protons & Plasma', category: 'SCIENCE', parent: 'nuclear-fusion', x: 39, y: 70, color: 'from-cyan-500 to-blue-600', icon: '🔬' },
    { id: 'people', title: 'People', subtitle: 'Farmers & Families', category: 'COMMUNITY', parent: 'sankranthi-center', x: 55, y: 32, color: 'from-amber-500 to-amber-700', icon: '👥' },
    { id: 'traditions', title: 'Traditions', subtitle: 'Ancestral lore', category: 'COMMUNITY', parent: 'people', x: 63, y: 32, color: 'from-amber-500 to-amber-700', icon: '🪔' },
    { id: 'gratitude', title: 'Gratitude', subtitle: 'Honoring nature', category: 'COMMUNITY', parent: 'sankranthi-center', x: 57, y: 43, color: 'from-orange-400 to-amber-600', icon: '🙏' },
    { id: 'community', title: 'Community', subtitle: 'Village unity', category: 'COMMUNITY', parent: 'gratitude', x: 63, y: 44, color: 'from-orange-500 to-amber-700', icon: '🏡' },
    { id: 'celebration', title: 'Celebration', subtitle: 'Feasts & Joy', category: 'COMMUNITY', parent: 'sankranthi-center', x: 64, y: 52, color: 'from-rose-400 to-rose-600', icon: '🎉' },
    { id: 'rangoli', title: 'Rangoli / Muggu', subtitle: 'Rice flour geometry', category: 'ART', parent: 'sankranthi-center', x: 52, y: 64, color: 'from-pink-400 to-rose-600', icon: '🌸' },
    { id: 'patterns', title: 'Patterns', subtitle: 'Dot matrices', category: 'ART', parent: 'rangoli', x: 47, y: 70, color: 'from-purple-400 to-pink-600', icon: '❄️' },
    { id: 'symmetry', title: 'Symmetry', subtitle: 'Mirror planes', category: 'ART', parent: 'rangoli', x: 54, y: 70, color: 'from-purple-400 to-indigo-600', icon: '🦋' },
    { id: 'creativity', title: 'Creativity', subtitle: 'Color blending', category: 'ART', parent: 'rangoli', x: 61, y: 70, color: 'from-amber-400 to-rose-600', icon: '🎨' },
    { id: 'kite-flying', title: 'Kite Flying', subtitle: 'Aerodynamics', category: 'ART', parent: 'sankranthi-center', x: 61, y: 60, color: 'from-purple-400 to-pink-500', icon: '🪁' },
  ];

  const activeNode = nodes.find((n) => n.id === activeNodeId) || nodes[4];

  // Try It Submission
  const handleOptionSubmit = (idx: number) => {
    setTryItAnswer(idx);
    const isCorrect = idx === 1; // Option 2 is correct
    if (isCorrect) {
      setTryItFeedback('🌟 Brilliant! Chlorophyll in green leaves captures sunlight energy to turn water and CO2 into sweet glucose food!');
      memoryEngine.recordEvidence({
        id: `ev-aarav-${Date.now()}`,
        learnerId,
        conceptId: 'c-photosynthesis',
        curriculumPosition: {
          bookId: 'Class5EVS',
          bookTitle: 'EVS Class 5',
          chapterNumber: 1,
          chapterTitle: 'Festivals of India',
          printedPage: 2,
          pdfPage: 2,
          sequenceIndex: 2,
          archetype: 'NORMAL_CHAPTER',
        },
        dimension: 'APPLICATION',
        difficulty: 3,
        score: 1.0,
        confidence: 1.0,
        isCorrect: true,
        learnerResponse: { selectedOption: idx },
        validationDetails: {
          isCorrect: true,
          feedback: 'Correct application of photosynthesis mechanism',
        },
        timestamp: new Date().toISOString(),
        sha256EvidenceKey: `sha256-aarav-${Date.now()}`,
      });
    } else {
      setTryItFeedback('💡 Almost! Remember: leaves use their green chlorophyll like solar panels to bake food from sunlight.');
    }
  };

  const report = explainabilityEngine.generateCompleteReport(learnerId);

  return (
    <div
      data-testid="universal-knowledge-universe-studio"
      className={`flex flex-col w-full min-h-[92vh] bg-slate-950 text-slate-100 font-sans select-none overflow-hidden rounded-2xl border border-slate-800 shadow-2xl ${className}`}
    >
      {/* ==================================================================== */}
      {/* 1. TOP NAVBAR HEADER                                                 */}
      {/* ==================================================================== */}
      <header className="h-16 px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-white flex items-center gap-1.5">
              EKAGURU
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">From Textbook to Universe</p>
          </div>
        </div>

        {/* Global Ask Search Bar */}
        <div className="relative w-96 hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder='Ask anything about "Sankranthi"...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* User Progression & Profile */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <div className="text-left">
              <span className="text-[9px] uppercase tracking-wider text-amber-400/80 font-bold block leading-none">Learning Streak</span>
              <span className="text-xs font-black text-amber-300">14 days</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Gem className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <span className="text-[9px] uppercase tracking-wider text-purple-400/80 font-bold block leading-none">Explorer Level</span>
              <span className="text-xs font-black text-purple-300">Young Scientist</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md">
              A
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <span className="text-xs font-bold text-white block">Aarav</span>
              <span className="text-[10px] text-slate-400">Class 5</span>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. MAIN THREE-COLUMN DESKTOP WORKSPACE                               */}
      {/* ==================================================================== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* ------------------------------------------------------------------ */}
        {/* LEFT COLUMN: FROM YOUR TEXTBOOK (SOURCE GROUNDED)                  */}
        {/* ------------------------------------------------------------------ */}
        <aside className="lg:col-span-3 bg-slate-900/60 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              From Your Textbook
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Source Grounded
            </span>
          </div>

          {/* Textbook Visual Canvas Card */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-semibold text-white">EVS Class 5 — Page 2</span>
              <span className="text-slate-400">Festivals of India</span>
            </div>

            {/* Embedded Textbook Page Graphics */}
            <div className="p-4 bg-amber-50/95 text-slate-900 rounded-b-xl flex flex-col gap-3 font-serif">
              <div className="flex justify-around items-center border-b border-amber-200 pb-2">
                <span className="text-xl">💃</span>
                <span className="text-xl">☀️</span>
                <span className="text-xl">🧑‍🌾</span>
                <span className="text-xl">🪁</span>
                <span className="text-xl">🌾</span>
              </div>
              <h3 className="text-center font-bold text-amber-900 text-sm tracking-wide">
                Festivals of India
              </h3>
              <p className="text-[11px] leading-relaxed text-slate-800">
                India is a land of festivals. We celebrate different kinds of festivals in the country.
              </p>
              <p className="text-[11px] leading-relaxed text-slate-800">
                <strong>Sankranthi</strong> is a popular harvest festival. Many people make colourful muggu (rangoli) at the entrance of their houses. Many people also fly kites on Sankranthi. It is celebrated in many parts of India.
              </p>
              <div className="flex justify-center items-center gap-2 pt-1 border-t border-amber-200">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
                <span className="text-2xl">🌸</span>
                <span className="text-2xl">🪁</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Page 2 (Spread 1 of 116)</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Source Verified
              </span>
            </div>
          </div>

          {/* What is Sankranthi Summary */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-white">What is Sankranthi?</h4>
            <ul className="text-[11px] text-slate-300 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400">•</span> A harvest festival
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400">•</span> People make muggu / rangoli
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400">•</span> People fly kites
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400">•</span> Celebrated in many parts of India
              </li>
            </ul>
            <button className="mt-2 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> View in Book
            </button>
          </div>

          {/* EKAGURU Engine Callout */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/70 via-purple-950/40 to-slate-950 border border-indigo-500/30 flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">EKAGURU Engine</span>
            <p className="text-[11px] text-slate-300 leading-snug">
              We don't stop at the book. We explore the whole universe behind this topic.
            </p>
            <button
              onClick={() => setActiveNodeId('crop-growth')}
              className="mt-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-black text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" /> Start Exploring
            </button>
          </div>
        </aside>

        {/* ------------------------------------------------------------------ */}
        {/* CENTER COLUMN: KNOWLEDGE UNIVERSE CONSTELLATION                    */}
        {/* ------------------------------------------------------------------ */}
        <main className="lg:col-span-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 flex flex-col justify-between relative overflow-hidden">
          {/* Constellation Title & Category Filter Tabs */}
          <div className="z-10 flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                🌌 EKAGURU Knowledge Universe: Sankranthi
              </h2>
              <p className="text-[11px] text-slate-400">From the Seed to the Stars</p>
            </div>

            {/* Filter Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'NATURE', label: '🌱 Nature & Agriculture', border: 'border-emerald-500/30', text: 'text-emerald-300' },
                { id: 'COMMUNITY', label: '👥 Community & Culture', border: 'border-amber-500/30', text: 'text-amber-300' },
                { id: 'SCIENCE', label: '⚔️ Science & The World', border: 'border-cyan-500/30', text: 'text-cyan-300' },
                { id: 'ART', label: '🎨 Art & Expressions', border: 'border-pink-500/30', text: 'text-pink-300' },
                { id: 'COSMOS', label: '🌌 Beyond & Cosmos', border: 'border-purple-500/30', text: 'text-purple-300' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(selectedCategory === tab.id ? 'ALL' : tab.id)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap border text-[10px] font-bold transition-all ${
                    selectedCategory === tab.id
                      ? 'bg-slate-800 border-white text-white shadow-md'
                      : `bg-slate-950/60 ${tab.border} ${tab.text} hover:bg-slate-900`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Universe Canvas with Nodes */}
          <div className="flex-1 relative my-2 rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-hidden flex items-center justify-center">
            {/* Background Constellation Star Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            {/* SVG Connecting Lines between Nodes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="50%" y1="50%" x2="45%" y2="32%" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
              <line x1="45%" y1="32%" x2="43%" y2="22%" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />
              <line x1="45%" y1="32%" x2="52%" y2="23%" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />
              <line x1="50%" y1="50%" x2="25%" y2="42%" stroke="#10b981" strokeWidth="2" opacity="0.8" />
              <line x1="25%" y1="42%" x2="33%" y2="42%" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
              <line x1="25%" y1="42%" x2="27%" y2="32%" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="34%" y2="58%" stroke="#f59e0b" strokeWidth="2" opacity="0.8" />
              <line x1="34%" y1="58%" x2="26%" y2="62%" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />
              <line x1="34%" y1="58%" x2="32%" y2="70%" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />
              <line x1="32%" y1="70%" x2="39%" y2="70%" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="55%" y2="32%" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />
              <line x1="55%" y1="32%" x2="63%" y2="32%" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="57%" y2="43%" stroke="#f97316" strokeWidth="1.5" opacity="0.6" />
              <line x1="57%" y1="43%" x2="63%" y2="44%" stroke="#f97316" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="64%" y2="52%" stroke="#f43f5e" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="52%" y2="64%" stroke="#ec4899" strokeWidth="2" opacity="0.8" />
              <line x1="52%" y1="64%" x2="47%" y2="70%" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />
              <line x1="52%" y1="64%" x2="54%" y2="70%" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />
              <line x1="52%" y1="64%" x2="61%" y2="70%" stroke="#ec4899" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="61%" y2="60%" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />
            </svg>

            {/* Nodes Render Loop */}
            {nodes.map((node) => {
              const isSelected = activeNodeId === node.id;
              const isCore = node.id === 'sankranthi-center';

              return (
                <button
                  key={node.id}
                  onClick={() => setActiveNodeId(node.id)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all z-10 ${
                    isSelected ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  <div
                    className={`rounded-full flex items-center justify-center shadow-lg transition-all ${
                      isCore
                        ? 'w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-600 text-2xl border-2 border-amber-200 ring-4 ring-amber-500/20'
                        : isSelected
                        ? 'w-10 h-10 bg-gradient-to-tr from-cyan-400 to-indigo-600 text-base border-2 border-white ring-4 ring-cyan-500/40 shadow-cyan-500/30'
                        : `w-8 h-8 bg-gradient-to-tr ${node.color} text-sm border border-white/40`
                    }`}
                  >
                    <span>{node.icon}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1 text-center whitespace-nowrap px-1.5 py-0.5 rounded-md backdrop-blur-md ${
                      isCore
                        ? 'text-amber-300 bg-amber-950/80 font-black'
                        : isSelected
                        ? 'text-white bg-cyan-950/90 border border-cyan-500/40'
                        : 'text-slate-300 bg-slate-950/80'
                    }`}
                  >
                    {node.title}
                  </span>
                </button>
              );
            })}

            {/* Canvas Floating Controls */}
            <div className="absolute right-3 bottom-3 flex flex-col gap-1 z-20 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-xl">
              <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Exploration Path Breadcrumbs (Bottom) */}
          <div className="z-10 bg-slate-950/90 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" /> Your Exploration Path
            </span>

            <div className="flex items-center justify-between text-[10px] overflow-x-auto gap-1">
              {[
                { name: 'Discover', icon: '🔭', done: true },
                { name: 'Connect', icon: '🔗', done: true },
                { name: 'Explore', icon: '🚀', active: true },
                { name: 'Experience', icon: '🌾' },
                { name: 'Understand', icon: '🧠' },
                { name: 'Apply', icon: '🔬' },
                { name: 'Inspire', icon: '⭐' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-1 shrink-0">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-bold transition-colors ${
                      step.active
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                        : step.done
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span>{step.icon}</span>
                    <span>{step.name}</span>
                  </div>
                  {idx < 6 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT COLUMN: LEARNING EXPERIENCE STUDIO                           */}
        {/* ------------------------------------------------------------------ */}
        <aside className="lg:col-span-4 bg-slate-900/80 border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto gap-4">
          <div className="flex flex-col gap-3">
            {/* Header with Close and Title */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black text-white">Exploring: How Does a Crop Grow?</h3>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Socratic Triad Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              {[
                { id: 'SHOW_ME', label: '✨ Show Me' },
                { id: 'TEACH_ME', label: '🗣️ Teach Me' },
                { id: 'TRY_IT', label: '🎯 Try It' },
                { id: 'GO_DEEPER', label: '🌌 Go Deeper' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTriadTab(tab.id as any)}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    activeTriadTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Triad Content Section: SHOW ME */}
            {activeTriadTab === 'SHOW_ME' && (
              <div className="flex flex-col gap-3">
                {/* Visual Journey: Seed to Harvest */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-slate-300">
                    Visual Journey: From Seed to Harvest
                  </span>

                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[
                      { step: 'Seed in Soil', icon: '🌰', sub: 'Sprouts roots' },
                      { step: 'Sprout', icon: '🌱', sub: 'Reaches light' },
                      { step: 'Green Plant', icon: '🌿', sub: 'Photosynthesis' },
                      { step: 'Golden Crop', icon: '🌾', sub: 'Ripe Grain' },
                      { step: 'Harvest Day', icon: '🧑‍🌾', sub: 'Farmer reaps' },
                    ].map((st, i) => (
                      <div
                        key={i}
                        className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center text-center gap-1"
                      >
                        <span className="text-xl">{st.icon}</span>
                        <span className="text-[9px] font-bold text-white leading-tight">{st.step}</span>
                        <span className="text-[8px] text-slate-400">{st.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Insight Card */}
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Key Insight
                  </span>
                  <p className="text-[11px] text-emerald-200 leading-relaxed">
                    Plants use sunlight energy to make their own food through <strong>photosynthesis</strong>. This food helps the plant grow. When the grain is mature, farmers harvest it.
                  </p>
                </div>

                {/* Amazing Fact Card */}
                <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-500/30 flex flex-col gap-1 relative">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                    Amazing Fact <span>☀️</span>
                  </span>
                  <p className="text-[11px] text-amber-200 leading-relaxed">
                    A single rice grain contains energy from the Sun that is <strong>150 million kilometers</strong> away! That's the distance from Earth to Sun.
                  </p>
                </div>

                {/* Think About It Card */}
                <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-500/30 flex flex-col gap-1 relative">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center justify-between">
                    Think About It <span>❓</span>
                  </span>
                  <p className="text-[11px] text-purple-200 leading-relaxed">
                    If there was no Sun for even one day, what would happen to all the crops on Earth?
                  </p>
                </div>
              </div>
            )}

            {/* Triad Content Section: TRY IT */}
            {activeTriadTab === 'TRY_IT' && (
              <div className="flex flex-col gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-3">
                  <span className="text-xs font-bold text-white">
                    Where does a paddy crop get the energy to grow golden grains?
                  </span>

                  <div className="flex flex-col gap-2">
                    {[
                      { text: 'From the soil minerals only', isTrap: true },
                      { text: 'From sunlight converted by green leaves (Photosynthesis)', isCorrect: true },
                      { text: 'From the cold winter winds', isTrap: true },
                    ].map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionSubmit(idx)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                          tryItAnswer === idx
                            ? idx === 1
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>

                  {tryItFeedback && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200">
                      {tryItFeedback}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Triad Content Section: TEACH ME */}
            {activeTriadTab === 'TEACH_ME' && (
              <div className="flex flex-col gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-cyan-400">🌱 Socratic Dialogue</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Imagine a kitchen inside every leaf! The chef is chlorophyll, and the oven is powered by golden rays of sunshine."
                </p>
              </div>
            )}

            {/* Triad Content Section: GO DEEPER */}
            {activeTriadTab === 'GO_DEEPER' && (
              <div className="flex flex-col gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-purple-400">🌌 Cosmic Bridge</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Did you know? The solar photons warming the harvest fields were born 100,000 years ago inside the Sun's nuclear core!"
                </p>
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* YOUR UNDERSTANDING (MASTERY METRICS & EVIDENCE COUNTERS)          */}
          {/* ---------------------------------------------------------------- */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                👤 Your Understanding
              </span>
              <button
                onClick={() => setShowReportModal(true)}
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                View Report <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Mastery Score Rings */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-xs text-emerald-400">
                  85%
                </div>
                <span className="text-[9px] text-slate-400 mt-1 font-bold">Recall</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-cyan-500 flex items-center justify-center font-black text-xs text-cyan-400">
                  78%
                </div>
                <span className="text-[9px] text-slate-400 mt-1 font-bold">Application</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-purple-500 flex items-center justify-center font-black text-xs text-purple-400">
                  82%
                </div>
                <span className="text-[9px] text-slate-400 mt-1 font-bold">Reasoning</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-slate-700 flex items-center justify-center font-black text-xs text-slate-400">
                  0
                </div>
                <span className="text-[9px] text-slate-400 mt-1 font-bold">Misconceptions</span>
              </div>
            </div>

            {/* Ledger Proof Counters */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-bold">
              <span className="flex items-center gap-1 text-slate-300">
                📋 Evidence Events: <strong className="text-white">42</strong>
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                🏆 Badges Earned: <strong className="text-amber-300">12</strong>
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* ==================================================================== */}
      {/* 3. EXPLAINABILITY MODAL OVERLAY                                      */}
      {/* ==================================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                🌟 Learning Journey & Explainability
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-slate-300">
              <p className="text-slate-200">
                <strong>Grounded Reason:</strong> You are exploring <em>Plant Growth & Photosynthesis</em> because your recent recall and application evidence confirmed high retention of agriculture cycles.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Active Mission
                </span>
                <p className="text-slate-300">
                  {report.learnerView.accomplishedConcepts[0]?.motivationalStatement || 'Master solar energy conversion in crops!'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowReportModal(false)}
              className="mt-2 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              Continue Learning
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
