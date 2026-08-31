'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Flame,
  Gem,
  BookOpen,
  CheckCircle2,
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
  ShieldCheck,
  Rocket,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { LearnerMemoryEngine } from '@/lib/learning/learner-memory.engine';
import { EkaguruMindOrchestrator } from '@/lib/learning/ekaguru-mind.orchestrator';
import { ExplainabilityEngine } from '@/lib/learning/explainability.engine';

export interface UniversalKnowledgeUniverseStudioProps {
  sectionId?: string;
  sectionTitle?: string;
  conceptName?: string;
  description?: string;
  printedPage?: number;
  onViewInBook?: () => void;
  className?: string;
}

export function UniversalKnowledgeUniverseStudio({
  sectionId = 'festivals-of-india',
  sectionTitle = 'Festivals of India',
  conceptName = 'Sankranthi & Harvest Festivals',
  description = '',
  printedPage = 2,
  onViewInBook,
  className = '',
}: UniversalKnowledgeUniverseStudioProps) {
  // Core Engine instances
  const memoryEngine = useMemo(() => new LearnerMemoryEngine(), []);
  const mindOrchestrator = useMemo(() => new EkaguruMindOrchestrator(), []);
  const explainabilityEngine = useMemo(() => new ExplainabilityEngine(memoryEngine), [memoryEngine]);

  const learnerId = 'aarav-class5';

  // Topic determination based on active section / page clicked on the left
  const currentTopic = useMemo(() => {
    const titleLower = (sectionTitle + ' ' + conceptName).toLowerCase();
    if (titleLower.includes('body') || titleLower.includes('heart') || titleLower.includes('growing') || printedPage >= 8) {
      return 'BODY';
    }
    if (titleLower.includes('food') || titleLower.includes('eat') || printedPage >= 14) {
      return 'FOOD';
    }
    return 'SANKRANTHI';
  }, [sectionTitle, conceptName, printedPage]);

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeNodeId, setActiveNodeId] = useState<string>('crop-growth');
  const [activeTriadTab, setActiveTriadTab] = useState<'SHOW_ME' | 'TEACH_ME' | 'TRY_IT' | 'GO_DEEPER'>('SHOW_ME');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [canvasSearch, setCanvasSearch] = useState<string>('');
  const [tryItAnswer, setTryItAnswer] = useState<number | null>(null);
  const [tryItFeedback, setTryItFeedback] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);

  // Reset node on topic change
  useEffect(() => {
    if (currentTopic === 'BODY') {
      setActiveNodeId('heart-pump');
    } else if (currentTopic === 'FOOD') {
      setActiveNodeId('digestion');
    } else {
      setActiveNodeId('crop-growth');
    }
    setTryItAnswer(null);
    setTryItFeedback(null);
  }, [currentTopic]);

  // Topic Configuration
  const universeConfig = useMemo(() => {
    if (currentTopic === 'BODY') {
      return {
        bookSubject: 'EVS Class 5 — Page 8',
        bookChapter: 'My Body & Living World',
        pageSpread: 'Page 8 (Spread 4 of 116)',
        pageBullets: [
          'The heart beats approximately 72 times per minute',
          'Lungs take in oxygen and release carbon dioxide',
          'Blood carries nutrients to muscles and organs',
          'Regular exercise and yoga keep our heart strong',
        ],
        title: 'HUMAN BODY & CIRCULATION UNIVERSE',
        subtitle: 'From the Beating Heart to the Cell Mitochondria',
        centerNode: { id: 'body-center', title: 'Heart Pump', subtitle: 'Continuous Engine', category: 'CORE', x: 50, y: 50, color: 'from-rose-500 to-rose-700', icon: '❤️' },
        tabs: [
          { id: 'CIRCULATION', label: '🩸 Circulation & Blood', border: 'border-rose-500/30', text: 'text-rose-300' },
          { id: 'RESPIRATION', label: '🫁 Lungs & Oxygen', border: 'border-cyan-500/30', text: 'text-cyan-300' },
          { id: 'CELLULAR', label: '⚡ Cell Mitochondria', border: 'border-amber-500/30', text: 'text-amber-300' },
          { id: 'HEALTH', label: '🏃 Fitness & Pulse', border: 'border-emerald-500/30', text: 'text-emerald-300' },
        ],
        nodes: [
          { id: 'body-center', title: 'Heart Pump', subtitle: '72 beats / min', category: 'CORE', x: 50, y: 50, color: 'from-rose-500 to-rose-700', icon: '❤️' },
          { id: 'heart-pump', title: 'Blood Flow', subtitle: 'Arteries & Veins', category: 'CIRCULATION', x: 45, y: 32, color: 'from-rose-400 to-rose-600', icon: '🩸' },
          { id: 'lungs', title: 'Lungs', subtitle: 'Oxygen Exchange', category: 'RESPIRATION', x: 28, y: 38, color: 'from-cyan-400 to-cyan-600', icon: '🫁' },
          { id: 'oxygen', title: 'O2 Intake', subtitle: 'Alveoli Sacs', category: 'RESPIRATION', x: 25, y: 54, color: 'from-blue-400 to-cyan-500', icon: '💨' },
          { id: 'muscles', title: 'Muscles', subtitle: 'Movement power', category: 'HEALTH', x: 65, y: 35, color: 'from-amber-400 to-orange-600', icon: '💪' },
          { id: 'pulse', title: 'Pulse Rate', subtitle: 'Exercise adaptation', category: 'HEALTH', x: 68, y: 54, color: 'from-emerald-400 to-emerald-600', icon: '💓' },
          { id: 'mitochondria', title: 'Mitochondria', subtitle: 'Cell Energy Engine', category: 'CELLULAR', x: 38, y: 70, color: 'from-purple-400 to-indigo-600', icon: '⚡' },
          { id: 'hemoglobin', title: 'Hemoglobin', subtitle: 'Iron Protein Carrier', category: 'CIRCULATION', x: 58, y: 68, color: 'from-pink-500 to-rose-600', icon: '🔬' },
        ],
        showMeTitle: 'Visual Journey: The Oxygen Highway',
        showMeSteps: [
          { step: 'Breathe In', icon: '🫁', sub: 'O2 enters lungs' },
          { step: 'Blood Pickup', icon: '🩸', sub: 'Hemoglobin binds' },
          { step: 'Heart Pump', icon: '❤️', sub: 'Pushed to body' },
          { step: 'Muscle Work', icon: '💪', sub: 'Burns glucose' },
          { step: 'Breathe Out', icon: '💨', sub: 'CO2 released' },
        ],
        keyInsight: 'The heart is a muscle that never rests! It pumps oxygen-rich blood to billions of living cells every single second.',
        amazingFact: 'In just one day, your heart beats around 100,000 times and pumps enough blood to fill a giant garden tank!',
        thinkAboutIt: 'Why does your heart beat faster when you sprint across the playground compared to when you sleep?',
        tryItQuestion: 'What carries oxygen from the lungs to your exercising muscle cells?',
        tryItOptions: [
          { text: 'Red blood cells containing hemoglobin', isCorrect: true },
          { text: 'Stomach acid minerals', isTrap: true },
          { text: 'Bones inside the arm', isTrap: true },
        ],
        recallScore: 88,
        appScore: 84,
        reasonScore: 86,
      };
    }

    // Default: Sankranthi Knowledge Universe (Matching Screenshot Reference)
    return {
      bookSubject: 'EVS Class 5 — Page 2',
      bookChapter: 'Festivals of India',
      pageSpread: 'Page 2 (Spread 1 of 116)',
      pageBullets: [
        'A harvest festival',
        'People make colourful muggu (rangoli) at the entrance of their houses',
        'People also fly kites on Sankranthi',
        'Celebrated in many parts of India',
      ],
      title: 'SANKRANTHI KNOWLEDGE UNIVERSE',
      subtitle: 'From the Seed to the Stars',
      centerNode: { id: 'sankranthi-center', title: 'Sankranthi', subtitle: 'Harvest Festival', category: 'CORE', x: 50, y: 50, color: 'from-amber-400 to-amber-600', icon: '🌾' },
      tabs: [
        { id: 'NATURE', label: '🌱 Nature & Agriculture', border: 'border-emerald-500/30', text: 'text-emerald-300' },
        { id: 'COMMUNITY', label: '👥 Community & Culture', border: 'border-amber-500/30', text: 'text-amber-300' },
        { id: 'SCIENCE', label: '⚔️ Science & The World', border: 'border-cyan-500/30', text: 'text-cyan-300' },
        { id: 'ART', label: '🎨 Art & Expressions', border: 'border-pink-500/30', text: 'text-pink-300' },
        { id: 'COSMOS', label: '🌌 Beyond & Cosmos', border: 'border-purple-500/30', text: 'text-purple-300' },
      ],
      nodes: [
        { id: 'sankranthi-center', title: 'Sankranthi', subtitle: 'Harvest Festival', category: 'CORE', x: 50, y: 50, color: 'from-amber-400 to-amber-600', icon: '🌾' },
        { id: 'harvest', title: 'Harvest', subtitle: 'Reaping the crops', category: 'NATURE', x: 44, y: 32, color: 'from-emerald-400 to-emerald-600', icon: '🚜' },
        { id: 'agriculture', title: 'Agriculture', subtitle: 'Farming systems', category: 'NATURE', x: 43, y: 22, color: 'from-emerald-500 to-emerald-700', icon: '🌾' },
        { id: 'crops', title: 'Crops', subtitle: 'Paddy & Wheat', category: 'NATURE', x: 53, y: 23, color: 'from-emerald-500 to-emerald-700', icon: '🌱' },
        { id: 'crop-growth', title: 'Plant Growth', subtitle: 'Seed to harvest', category: 'NATURE', x: 25, y: 42, color: 'from-emerald-400 to-emerald-600', icon: '🌱' },
        { id: 'photosynthesis', title: 'Photosynthesis', subtitle: 'Solar food making', category: 'SCIENCE', x: 34, y: 42, color: 'from-cyan-400 to-cyan-600', icon: '🍃' },
        { id: 'seed', title: 'Seed', subtitle: 'Dormancy & water', category: 'NATURE', x: 27, y: 32, color: 'from-emerald-400 to-emerald-600', icon: '🌰' },
        { id: 'seasons', title: 'Seasons', subtitle: 'Solar equinox', category: 'NATURE', x: 34, y: 23, color: 'from-blue-400 to-cyan-500', icon: '🌦️' },
        { id: 'sunlight', title: 'Sunlight', subtitle: 'Photons energy', category: 'SCIENCE', x: 25, y: 53, color: 'from-amber-400 to-amber-500', icon: '☀️' },
        { id: 'the-sun', title: 'The Sun', subtitle: 'Star of solar system', category: 'COSMOS', x: 34, y: 58, color: 'from-amber-500 to-orange-600', icon: '☀️' },
        { id: 'energy', title: 'Energy', subtitle: 'Radiation waves', category: 'SCIENCE', x: 26, y: 64, color: 'from-amber-400 to-amber-600', icon: '⚡' },
        { id: 'nuclear-fusion', title: 'Nuclear Fusion', subtitle: 'Hydrogen to Helium', category: 'COSMOS', x: 32, y: 70, color: 'from-blue-500 to-indigo-600', icon: '⚛️' },
        { id: 'atoms', title: 'Atoms', subtitle: 'Protons & Plasma', category: 'SCIENCE', x: 39, y: 70, color: 'from-cyan-500 to-blue-600', icon: '🔬' },
        { id: 'people', title: 'People', subtitle: 'Farmers & Families', category: 'COMMUNITY', x: 55, y: 32, color: 'from-amber-500 to-amber-700', icon: '👥' },
        { id: 'traditions', title: 'Traditions', subtitle: 'Ancestral lore', category: 'COMMUNITY', x: 63, y: 32, color: 'from-amber-500 to-amber-700', icon: '🪔' },
        { id: 'gratitude', title: 'Gratitude', subtitle: 'Honoring nature', category: 'COMMUNITY', x: 57, y: 43, color: 'from-orange-400 to-amber-600', icon: '🙏' },
        { id: 'community', title: 'Community', subtitle: 'Village unity', category: 'COMMUNITY', x: 64, y: 44, color: 'from-orange-500 to-amber-700', icon: '🏡' },
        { id: 'celebration', title: 'Celebration', subtitle: 'Feasts & Joy', category: 'COMMUNITY', x: 64, y: 53, color: 'from-rose-400 to-rose-600', icon: '🎉' },
        { id: 'rangoli', title: 'Rangoli / Muggu', subtitle: 'Rice flour geometry', category: 'ART', x: 52, y: 64, color: 'from-pink-400 to-rose-600', icon: '🌸' },
        { id: 'patterns', title: 'Patterns', subtitle: 'Dot matrices', category: 'ART', x: 47, y: 70, color: 'from-purple-400 to-pink-600', icon: '❄️' },
        { id: 'symmetry', title: 'Symmetry', subtitle: 'Mirror planes', category: 'ART', x: 54, y: 70, color: 'from-purple-400 to-indigo-600', icon: '🦋' },
        { id: 'creativity', title: 'Creativity', subtitle: 'Color blending', category: 'ART', x: 62, y: 70, color: 'from-amber-400 to-rose-600', icon: '🎨' },
        { id: 'kite-flying', title: 'Kite Flying', subtitle: 'Aerodynamics', category: 'ART', x: 61, y: 60, color: 'from-purple-400 to-pink-500', icon: '🪁' },
      ],
      showMeTitle: 'Visual Journey: From Seed to Harvest',
      showMeSteps: [
        { step: 'Seed in Soil', icon: '🌰', sub: 'Sprouts roots' },
        { step: 'Sprout', icon: '🌱', sub: 'Reaches light' },
        { step: 'Green Plant', icon: '🌿', sub: 'Photosynthesis' },
        { step: 'Golden Crop', icon: '🌾', sub: 'Ripe Grain' },
        { step: 'Harvest Day', icon: '🧑‍🌾', sub: 'Farmer reaps' },
      ],
      keyInsight: 'Plants use sunlight energy to make their own food through photosynthesis. This food helps the plant grow. When the grain is mature, farmers harvest it.',
      amazingFact: 'A single rice grain contains energy from the Sun that is 150 million kilometers away! That is the distance from Earth to Sun.',
      thinkAboutIt: 'If there was no Sun for even one day, what would happen to all the crops on Earth?',
      tryItQuestion: 'Where does a paddy crop get the energy to grow golden grains?',
      tryItOptions: [
        { text: 'From the soil minerals only', isTrap: true },
        { text: 'From sunlight converted by green leaves (Photosynthesis)', isCorrect: true },
        { text: 'From cold winter winds', isTrap: true },
      ],
      recallScore: 85,
      appScore: 78,
      reasonScore: 82,
    };
  }, [currentTopic]);

  const activeNode = universeConfig.nodes.find((n) => n.id === activeNodeId) || universeConfig.nodes[0];

  const handleOptionSubmit = (idx: number) => {
    setTryItAnswer(idx);
    const selected = universeConfig.tryItOptions[idx];
    if (selected.isCorrect) {
      setTryItFeedback('🌟 Brilliant! You got it right. The leaves act like solar panels baking food!');
      memoryEngine.recordEvidence({
        id: `ev-aarav-${Date.now()}`,
        learnerId,
        conceptId: activeNode.id,
        curriculumPosition: {
          bookId: 'Class5EVS',
          bookTitle: 'EVS Class 5',
          chapterNumber: 1,
          chapterTitle: sectionTitle,
          printedPage,
          pdfPage: printedPage,
          sequenceIndex: printedPage,
          archetype: 'NORMAL_CHAPTER',
        },
        dimension: 'APPLICATION',
        difficulty: 3,
        score: 1.0,
        confidence: 1.0,
        isCorrect: true,
        learnerResponse: { selectedOption: idx },
        validationDetails: { isCorrect: true, feedback: 'Correct application' },
        timestamp: new Date().toISOString(),
        sha256EvidenceKey: `sha256-${Date.now()}`,
      });
    } else {
      setTryItFeedback('💡 Almost! Think about how the sun provides energy to green leaves.');
    }
  };

  const report = explainabilityEngine.generateCompleteReport(learnerId);

  return (
    <div
      data-testid="universal-knowledge-universe-studio"
      className={`flex flex-col w-full h-screen max-h-screen w-full bg-[#070b14] text-slate-100 font-sans select-none overflow-hidden ${className}`}
    >
      {/* ==================================================================== */}
      {/* 1. TOP NAVBAR HEADER                                                 */}
      {/* ==================================================================== */}
      <header className="h-14 px-6 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white flex items-center gap-1.5 leading-tight">
              EKAGURU
            </h1>
            <p className="text-[9.5px] text-slate-400 font-medium">From Textbook to Universe</p>
          </div>
        </div>

        {/* Global Ask Search Bar */}
        <div className="relative w-96 hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Ask anything about "${activeNode.title}"...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[#080d1a] border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
          />
        </div>

        {/* User Progression & Profile */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <div className="text-left">
              <span className="text-[8px] uppercase tracking-wider text-amber-400/80 font-bold block leading-none">Learning Streak</span>
              <span className="text-xs font-black text-amber-300">14 days</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-sm">
            <Gem className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <span className="text-[8px] uppercase tracking-wider text-purple-400/80 font-bold block leading-none">Explorer Level</span>
              <span className="text-xs font-black text-purple-300">Young Scientist</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md ring-2 ring-emerald-400/20">
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
      {/* 2. THREE-COLUMN DESKTOP LAYOUT MATCHING SCREENSHOT 2                 */}
      {/* ==================================================================== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* ------------------------------------------------------------------ */}
        {/* COLUMN 1 (LEFT): FROM YOUR TEXTBOOK (SOURCE GROUNDED)              */}
        {/* ------------------------------------------------------------------ */}
        <div className="lg:col-span-3 bg-[#080d19] p-4 flex flex-col justify-between border-r border-slate-800/80 overflow-y-auto gap-4">
          <div className="flex flex-col gap-3">
            {/* Header with Source Grounded badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wide text-white uppercase">
                From Your Textbook
              </span>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Source Grounded
              </span>
            </div>

            {/* Breadcrumb info */}
            <div className="text-[11px] text-slate-400 font-medium">
              <span className="text-slate-200 font-bold block">{universeConfig.bookSubject}</span>
              <span>{universeConfig.bookChapter}</span>
            </div>

            {/* High Fidelity Textbook Card Snippet */}
            <div className="rounded-xl overflow-hidden border border-slate-700/80 bg-gradient-to-b from-amber-50 to-amber-100/90 text-slate-900 p-3 shadow-lg relative group">
              {/* Header illustration banner */}
              <div className="w-full h-10 bg-amber-200/80 rounded-lg flex items-center justify-around text-lg mb-2 px-1 border border-amber-300/50">
                <span>🎨</span>
                <span>☀️</span>
                <span>🧑‍🌾</span>
                <span>🪁</span>
                <span>📖</span>
              </div>

              <h4 className="text-xs font-black text-amber-900 text-center mb-1">
                {universeConfig.bookChapter}
              </h4>
              <p className="text-[9.5px] leading-tight text-slate-700 font-serif mb-2 text-center">
                India is a land of festivals. We celebrate different kinds of festivals in the country.
              </p>

              <div className="flex items-center justify-center py-1">
                <div className="w-20 h-16 rounded-lg bg-amber-200/90 border border-amber-300 flex flex-col items-center justify-center text-center shadow-inner">
                  <span className="text-xl">🌾</span>
                  <span className="text-[8px] font-bold text-amber-900">Sankranthi</span>
                </div>
              </div>
            </div>

            {/* Page Spread & Verified footer */}
            <div className="flex items-center justify-between text-[9px] text-slate-400 px-0.5">
              <span>{universeConfig.pageSpread}</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Source Verified
              </span>
            </div>

            {/* What is Sankranthi / Concept summary bullets */}
            <div className="bg-[#0b1222] p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
              <h5 className="text-[11px] font-bold text-slate-200">
                What is {currentTopic === 'BODY' ? 'Circulation' : 'Sankranthi'}?
              </h5>
              <ul className="text-[10px] text-slate-300 space-y-1 pl-1">
                {universeConfig.pageBullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-tight">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowBookModal(true)}
                className="mt-2 w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> View in Book
              </button>
            </div>
          </div>

          {/* EKAGURU Engine Card (Bottom) */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-950 p-3 rounded-xl border border-indigo-500/30 flex flex-col gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">
                EKAGURU Engine
              </span>
              <p className="text-[9.5px] text-slate-400 leading-tight mt-0.5">
                We don't stop at the book. We explore the whole universe behind this topic.
              </p>
            </div>

            <button
              onClick={() => setActiveTriadTab('SHOW_ME')}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Rocket className="w-3.5 h-3.5 text-white" /> Start Exploring
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* COLUMN 2 (CENTER): KNOWLEDGE UNIVERSE CONSTELLATION GRAPH          */}
        {/* ------------------------------------------------------------------ */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#070b14] via-[#091022] to-[#070b14] p-4 flex flex-col justify-between relative border-r border-slate-800/80">
          {/* Constellation Title & Category Filter Tabs */}
          <div className="z-10 flex flex-col gap-2.5">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                🌾 {universeConfig.title}
              </h2>
              <p className="text-[10.5px] text-slate-400">{universeConfig.subtitle}</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {universeConfig.tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(selectedCategory === tab.id ? 'ALL' : tab.id)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap border text-[9.5px] font-bold transition-all ${
                    selectedCategory === tab.id
                      ? 'bg-slate-800 border-white text-white shadow-md'
                      : `bg-slate-950/80 ${tab.border} ${tab.text} hover:bg-slate-900`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Radial Constellation Canvas */}
          <div className="flex-1 relative my-2 min-h-[440px] rounded-2xl bg-[#060a16]/90 border border-slate-800/80 overflow-hidden flex items-center justify-center shadow-2xl">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-35" />

            {/* Radial SVG Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="50%" y1="50%" x2="44%" y2="32%" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
              <line x1="44%" y1="32%" x2="43%" y2="22%" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />
              <line x1="44%" y1="32%" x2="53%" y2="23%" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />
              <line x1="50%" y1="50%" x2="25%" y2="42%" stroke="#10b981" strokeWidth="2" opacity="0.8" />
              <line x1="25%" y1="42%" x2="34%" y2="42%" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
              <line x1="25%" y1="42%" x2="27%" y2="32%" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="34%" y2="58%" stroke="#f59e0b" strokeWidth="2" opacity="0.8" />
              <line x1="34%" y1="58%" x2="26%" y2="64%" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />
              <line x1="34%" y1="58%" x2="32%" y2="70%" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />
              <line x1="32%" y1="70%" x2="39%" y2="70%" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="55%" y2="32%" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="57%" y2="43%" stroke="#f97316" strokeWidth="1.5" opacity="0.6" />
              <line x1="57%" y1="43%" x2="64%" y2="44%" stroke="#f97316" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="64%" y2="53%" stroke="#f43f5e" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="52%" y2="64%" stroke="#ec4899" strokeWidth="2" opacity="0.8" />
              <line x1="52%" y1="64%" x2="47%" y2="70%" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />
              <line x1="52%" y1="64%" x2="54%" y2="70%" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />
              <line x1="52%" y1="64%" x2="62%" y2="70%" stroke="#ec4899" strokeWidth="1.5" opacity="0.6" />
              <line x1="50%" y1="50%" x2="61%" y2="60%" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />
            </svg>

            {/* Constellation Nodes */}
            {universeConfig.nodes.map((node) => {
              const isSelected = activeNodeId === node.id;
              const isCore = node.category === 'CORE';

              return (
                <button
                  key={node.id}
                  onClick={() => setActiveNodeId(node.id)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all z-10 ${
                    isSelected ? 'scale-110 z-20' : 'hover:scale-105'
                  }`}
                >
                  <div
                    className={`rounded-full flex items-center justify-center shadow-xl transition-all ${
                      isCore
                        ? 'w-14 h-14 bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-xl border-2 border-amber-200 ring-4 ring-amber-500/30'
                        : isSelected
                        ? 'w-10 h-10 bg-gradient-to-tr from-cyan-400 to-indigo-600 text-sm border-2 border-white ring-4 ring-cyan-500/40 shadow-cyan-500/40'
                        : `w-7 h-7 bg-gradient-to-tr ${node.color} text-xs border border-white/40`
                    }`}
                  >
                    <span>{node.icon}</span>
                  </div>
                  <span
                    className={`text-[8.5px] font-bold mt-1 text-center whitespace-nowrap px-1.5 py-0.5 rounded-md backdrop-blur-md shadow-md ${
                      isCore
                        ? 'text-amber-300 bg-amber-950/90 font-black'
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

            {/* In-Canvas Search / Prompt Pill (Bottom-Center) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-64 z-20 flex flex-col items-center gap-1">
              <div className="w-full relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Where do you want to explore?"
                  value={canvasSearch}
                  onChange={(e) => setCanvasSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#0a0f1f]/90 backdrop-blur-md border border-slate-700/80 rounded-full text-[10px] text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-xl"
                />
              </div>
              <span className="text-[8px] text-slate-400">Tip: Click any node to explore deeper</span>
            </div>

            {/* Canvas Zoom Controls */}
            <div className="absolute right-3 bottom-3 flex flex-col gap-1 z-20 bg-[#0a0f1f]/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
              <button onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 1.5))} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.7))} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setZoomLevel(1)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Exploration Path Breadcrumbs (Bottom) */}
          <div className="z-10 bg-[#080d19] p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" /> Your Exploration Path
            </span>

            <div className="flex items-center justify-between text-[8.5px] overflow-x-auto gap-1">
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
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-bold transition-colors ${
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
                  {idx < 6 && <ChevronRight className="w-2.5 h-2.5 text-slate-600" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* COLUMN 3 (RIGHT): SOCRATIC TRIAD & MASTERY METRIC RINGS            */}
        {/* ------------------------------------------------------------------ */}
        <div className="lg:col-span-4 bg-[#080d19] p-4 flex flex-col justify-between overflow-y-auto gap-3 border-l border-slate-800/80">
          <div className="flex flex-col gap-2.5">
            {/* Exploration Node Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black text-white">Exploring: {activeNode.title}</h3>
              </div>
              <button className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Socratic Triad Action Tabs (4 Pills) */}
            <div className="grid grid-cols-4 gap-1 bg-[#060a16] p-1 rounded-xl border border-slate-800 text-[9.5px] font-bold">
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

            {/* SHOW ME VIEW */}
            {activeTriadTab === 'SHOW_ME' && (
              <div className="flex flex-col gap-2.5">
                {/* Visual Journey: 5 Steps Horizontal Chain */}
                <div className="bg-[#0b1222] p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-slate-300">
                    {universeConfig.showMeTitle}
                  </span>

                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {universeConfig.showMeSteps.map((st, i) => (
                      <div
                        key={i}
                        className="bg-[#080d1a] p-1.5 rounded-lg border border-slate-800 flex flex-col items-center text-center gap-1 shadow-sm"
                      >
                        <span className="text-base">{st.icon}</span>
                        <span className="text-[8px] font-bold text-white leading-tight">{st.step}</span>
                        <span className="text-[7px] text-slate-400 leading-tight">{st.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Insight Card */}
                <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30 flex flex-col gap-1 shadow-sm">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-400">
                    Key Insight
                  </span>
                  <p className="text-[10px] text-emerald-200 leading-relaxed font-medium">
                    {universeConfig.keyInsight}
                  </p>
                </div>

                {/* Amazing Fact Card */}
                <div className="bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/30 flex flex-col gap-1 shadow-sm">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                    Amazing Fact <span>☀️</span>
                  </span>
                  <p className="text-[10px] text-amber-200 leading-relaxed font-medium">
                    {universeConfig.amazingFact}
                  </p>
                </div>

                {/* Think About It Card */}
                <div className="bg-purple-950/30 p-2.5 rounded-xl border border-purple-500/30 flex flex-col gap-1 shadow-sm">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-purple-400 flex items-center justify-between">
                    Think About It <span>❓</span>
                  </span>
                  <p className="text-[10px] text-purple-200 leading-relaxed font-medium">
                    {universeConfig.thinkAboutIt}
                  </p>
                </div>
              </div>
            )}

            {/* TRY IT VIEW */}
            {activeTriadTab === 'TRY_IT' && (
              <div className="flex flex-col gap-2.5">
                <div className="bg-[#0b1222] p-3 rounded-xl border border-slate-800 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-white">
                    {universeConfig.tryItQuestion}
                  </span>

                  <div className="flex flex-col gap-1.5">
                    {universeConfig.tryItOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionSubmit(idx)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                          tryItAnswer === idx
                            ? opt.isCorrect
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
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200">
                      {tryItFeedback}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TEACH ME VIEW */}
            {activeTriadTab === 'TEACH_ME' && (
              <div className="flex flex-col gap-2.5 bg-[#0b1222] p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-cyan-400">🌱 Socratic Dialogue</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Imagine a kitchen inside every leaf! The chef is chlorophyll, and the oven is powered by golden rays of sunshine."
                </p>
              </div>
            )}

            {/* GO DEEPER VIEW */}
            {activeTriadTab === 'GO_DEEPER' && (
              <div className="flex flex-col gap-2.5 bg-[#0b1222] p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-purple-400">🌌 Cosmic Bridge</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Did you know? The solar photons warming the harvest fields were born 100,000 years ago inside the Sun's nuclear core!"
                </p>
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* YOUR UNDERSTANDING (MASTERY RINGS & EVIDENCE PROOF COUNTERS)      */}
          {/* ---------------------------------------------------------------- */}
          <div className="bg-[#0b1222] p-3 rounded-xl border border-slate-800 flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                👤 Your Understanding
              </span>
              <button
                onClick={() => setShowReportModal(true)}
                className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
              >
                View Report <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* 4 Mastery Score Rings Matching Screenshot 2 */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border-[3px] border-emerald-500 flex items-center justify-center font-black text-[11px] text-emerald-400 shadow-md shadow-emerald-500/10">
                  {universeConfig.recallScore}%
                </div>
                <span className="text-[8px] text-slate-400 mt-0.5 font-bold">Recall</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border-[3px] border-cyan-500 flex items-center justify-center font-black text-[11px] text-cyan-400 shadow-md shadow-cyan-500/10">
                  {universeConfig.appScore}%
                </div>
                <span className="text-[8px] text-slate-400 mt-0.5 font-bold">Application</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border-[3px] border-purple-500 flex items-center justify-center font-black text-[11px] text-purple-400 shadow-md shadow-purple-500/10">
                  {universeConfig.reasonScore}%
                </div>
                <span className="text-[8px] text-slate-400 mt-0.5 font-bold">Reasoning</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border-[3px] border-slate-700 flex items-center justify-center font-black text-[11px] text-slate-400">
                  0
                </div>
                <span className="text-[8px] text-slate-400 mt-0.5 font-bold">Misconceptions</span>
              </div>
            </div>

            {/* Ledger Evidence Counters */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-400 font-bold">
              <span className="flex items-center gap-1 text-slate-300">
                📋 Evidence Events: <strong className="text-white">42</strong>
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                🏆 Badges Earned: <strong className="text-amber-300">12</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MODALS & POPUPS                                                   */}
      {/* ==================================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1424] border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                🌟 Learning Journey & Explainability
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-slate-300">
              <p className="text-slate-200">
                <strong>Grounded Reason:</strong> You are exploring <em>{activeNode.title}</em> because your recent recall and application evidence confirmed high retention of the foundational curriculum.
              </p>
              <div className="p-3 bg-[#080d19] rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Active Mission
                </span>
                <p className="text-slate-300">
                  {report.learnerView.accomplishedConcepts[0]?.motivationalStatement || 'Master multi-dimensional evidence in this topic universe!'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowReportModal(false)}
              className="mt-1 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              Continue Learning
            </button>
          </div>
        </div>
      )}

      {showBookModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1424] border border-slate-700 rounded-2xl max-w-2xl w-full p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                📖 Original Textbook Spread: {universeConfig.bookChapter}
              </h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Viewing physical source anchor for <strong>{universeConfig.bookSubject}</strong>.
            </p>
            <div className="p-4 bg-amber-50 text-slate-900 rounded-xl font-serif text-xs leading-relaxed max-h-96 overflow-y-auto">
              <h4 className="font-bold text-amber-900 mb-2">{universeConfig.bookChapter}</h4>
              <p>India is a land of festivals. We celebrate different kinds of festivals in the country.</p>
              <p className="mt-2">Sankranthi is a popular harvest festival. Many people make colourful muggu (rangoli) at the entrance of their houses. Many people also fly kites on Sankranthi.</p>
            </div>
            <button
              onClick={() => setShowBookModal(false)}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
