'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sparkles,
  ShieldCheck,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  BookOpen,
} from 'lucide-react';
import { TeachingDepth, EvidenceCitation } from '../../lib/learning/teaching-package.types';

export interface BlackboardProcessNode {
  id: string;
  icon: string;
  label: string;
  subtext: string;
  relationArrow?: string;
  speechText: string;
  bbox?: { x: number; y: number; width: number; height: number };
}

export interface LivingGuruLessonPlan {
  pageNumber: number;
  subject: string;
  topicTitle: string;
  unitTitle: string;
  depth: TeachingDepth;
  depthFocusDescription: string;
  introSpeech: string;
  nodes: BlackboardProcessNode[];
  summaryRule: string;
  citationBBox: { x: number; y: number; width: number; height: number };
  socraticQuestion: {
    question: string;
    options: {
      id: string;
      label: string;
      isCorrect: boolean;
      misconceptionExplanation?: string;
    }[];
    correctExplanation: string;
    misconceptionTargetNodeId?: string;
  };
}

export interface LivingGuruBlackboardProps {
  lessonPlan: LivingGuruLessonPlan;
  onCitationHighlight?: (citation: EvidenceCitation) => void;
  onMasteryPromoted?: (newDepth: TeachingDepth) => void;
  className?: string;
}

export function LivingGuruBlackboard({
  lessonPlan,
  onCitationHighlight,
  onMasteryPromoted,
  className = '',
}: LivingGuruBlackboardProps) {
  // Teaching lifecycle step:
  // 0: Initial Greeting / Empty Slate
  // 1: Writing Title on Board
  // 2 .. (1 + nodes.length): Progressive Drawing of Nodes and Arrows
  // Next: Highlighting Textbook Scan Evidence
  // Next: Asking Socratic Question
  // Next: Misconception Re-teaching (if wrong) or Cognitive Mastery (if right)
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlayingFlow, setIsPlayingFlow] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showReteachAlert, setShowReteachAlert] = useState<boolean>(false);
  const [reteachMessage, setReteachMessage] = useState<string>('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [masteryScore, setMasteryScore] = useState<number>(0.25);
  const [isErasingBoard, setIsErasingBoard] = useState<boolean>(false);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Total teaching steps calculation
  const totalSteps = 4 + lessonPlan.nodes.length;
  const citationStep = 2 + lessonPlan.nodes.length;
  const socraticStep = 3 + lessonPlan.nodes.length;

  // Reset when lesson plan or depth changes
  useEffect(() => {
    setIsErasingBoard(true);
    const timeout = setTimeout(() => {
      setCurrentStep(0);
      setSelectedOption(null);
      setShowReteachAlert(false);
      setIsAnswerCorrect(null);
      setIsErasingBoard(false);
      setIsPlayingFlow(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [lessonPlan.pageNumber, lessonPlan.depth]);

  // Current Teacher Speech resolution
  const getCurrentSpeech = (): string => {
    if (showReteachAlert) {
      return reteachMessage;
    }
    if (isAnswerCorrect === true) {
      return `Outstanding! ${lessonPlan.socraticQuestion.correctExplanation} You have mastered the ${lessonPlan.depth.toUpperCase()} depth on Page ${lessonPlan.pageNumber}!`;
    }
    if (currentStep === 0) {
      return lessonPlan.introSpeech;
    }
    if (currentStep === 1) {
      return `Watch as I write today's topic on the board: "${lessonPlan.topicTitle}".`;
    }
    const nodeIndex = currentStep - 2;
    if (nodeIndex >= 0 && nodeIndex < lessonPlan.nodes.length) {
      return lessonPlan.nodes[nodeIndex].speechText;
    }
    if (currentStep === citationStep) {
      return `Look at the textbook scan on the left. See how our blackboard drawing directly matches the physical page ${lessonPlan.pageNumber}!`;
    }
    if (currentStep >= socraticStep) {
      return `Now, young scholars, think carefully: ${lessonPlan.socraticQuestion.question}`;
    }
    return lessonPlan.summaryRule;
  };

  const activeSpeech = getCurrentSpeech();

  // Voice Speech Synthesis
  const speakTeacherDialogue = (text: string) => {
    if (!audioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.93;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Speak when step changes
  useEffect(() => {
    if (audioEnabled && activeSpeech) {
      speakTeacherDialogue(activeSpeech);
    }
  }, [currentStep, showReteachAlert, isAnswerCorrect]);

  // Trigger Citation BBox on Left Book Scan when citation step is reached
  useEffect(() => {
    if (currentStep === citationStep && onCitationHighlight) {
      onCitationHighlight({
        bookId: 'evs-class-5',
        chapterNumber: 1,
        physicalPage: lessonPlan.pageNumber,
        blockId: `blk-${lessonPlan.pageNumber}-core`,
        regionId: `reg-${lessonPlan.pageNumber}-body`,
        bbox: lessonPlan.citationBBox,
        confidence: 0.99,
        sourceTextSnippet: lessonPlan.topicTitle,
      });
    }
  }, [currentStep]);

  // Auto-Play Flow Interval
  useEffect(() => {
    if (isPlayingFlow) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          // Pause auto-play at Socratic question step so child can answer
          if (prev >= socraticStep - 1) {
            setIsPlayingFlow(false);
            return socraticStep;
          }
          return prev + 1;
        });
      }, 4200);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlayingFlow, socraticStep]);

  // Handle Socratic Answer Selection
  const handleSelectOption = (optId: string) => {
    setSelectedOption(optId);
    const chosen = lessonPlan.socraticQuestion.options.find((o) => o.id === optId);
    if (!chosen) return;

    if (chosen.isCorrect) {
      setIsAnswerCorrect(true);
      setShowReteachAlert(false);
      const newScore = Math.min(0.95, masteryScore + 0.52);
      setMasteryScore(newScore);
    } else {
      setIsAnswerCorrect(false);
      setShowReteachAlert(true);
      setReteachMessage(
        chosen.misconceptionExplanation ||
          `Good try! Look closely at our board drawing. Living things develop in gradual stages: first a seed, then a sprout, before becoming an adult plant.`
      );
    }
  };

  // Depths progression order
  const depthOrder: TeachingDepth[] = ['basis', 'developing', 'proficient', 'advanced', 'deep'];
  const nextDepthIdx = depthOrder.indexOf(lessonPlan.depth) + 1;
  const nextDepth = nextDepthIdx < depthOrder.length ? depthOrder[nextDepthIdx] : null;

  return (
    <div
      data-testid="living-guru-blackboard"
      className={`flex flex-col h-full rounded-3xl bg-[#06140d] border-[8px] border-[#5a361e] p-5 shadow-2xl relative select-none overflow-hidden ${className}`}
      style={{
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.8), 0 20px 40px rgba(0,0,0,0.7)',
      }}
    >
      {/* Wooden Frame Corner Accents */}
      <div className="absolute top-1 left-1 w-6 h-6 border-t-2 border-l-2 border-[#a66a38]/80 pointer-events-none" />
      <div className="absolute top-1 right-1 w-6 h-6 border-t-2 border-r-2 border-[#a66a38]/80 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-6 h-6 border-b-2 border-l-2 border-[#a66a38]/80 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-6 h-6 border-b-2 border-r-2 border-[#a66a38]/80 pointer-events-none" />

      {/* 1. TOP TEACHER CONTROLS & STATUS BAR */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#143d24]/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="text-2xl drop-shadow">👨‍🏫</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#06140d] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-300 font-serif tracking-wide">
                GURU LIVE CLASSROOM
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/80 text-[10px] font-bold text-emerald-300 uppercase">
                DEPTH: {lessonPlan.depth}
              </span>
            </div>
            <span className="text-[10px] text-emerald-300/80 italic font-mono">
              Page {lessonPlan.pageNumber} • {lessonPlan.subject}
            </span>
          </div>
        </div>

        {/* Master Guru Flow Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (currentStep >= socraticStep && isAnswerCorrect) {
                setCurrentStep(0);
                setIsPlayingFlow(true);
              } else {
                setIsPlayingFlow(!isPlayingFlow);
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              isPlayingFlow
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
            title="Continuous Guru Classroom Flow"
          >
            {isPlayingFlow ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingFlow ? 'Pause Guru' : '▶ Play Guru Flow'}</span>
          </button>

          <button
            onClick={() => {
              setCurrentStep(0);
              setSelectedOption(null);
              setShowReteachAlert(false);
              setIsAnswerCorrect(null);
              setIsPlayingFlow(false);
            }}
            className="p-1.5 rounded-xl bg-black/40 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 hover:text-white transition"
            title="Clean Slate / Restart Lesson"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-1.5 rounded-xl border transition ${
              audioEnabled
                ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                : 'bg-black/40 border-slate-700 text-slate-500'
            }`}
            title={audioEnabled ? 'Mute Guru Voice' : 'Enable Guru Voice'}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Step Controls */}
          <div className="flex items-center gap-1 bg-black/50 border border-emerald-900/70 rounded-xl px-2 py-1">
            <button
              onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
              disabled={currentStep <= 0}
              className="p-1 text-emerald-400 hover:text-white disabled:opacity-30 rounded"
              title="Previous Action"
            >
              <SkipBack className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono text-emerald-200 px-1 font-bold">
              {currentStep} / {totalSteps}
            </span>
            <button
              onClick={() => setCurrentStep((p) => Math.min(totalSteps, p + 1))}
              disabled={currentStep >= totalSteps}
              className="p-1 text-emerald-400 hover:text-white disabled:opacity-30 rounded"
              title="Next Action"
            >
              <SkipForward className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME TEACHER SPOKEN SPEECH BUBBLE */}
      <div className="my-2.5 bg-black/70 border-2 border-amber-400/80 rounded-2xl p-3 shadow-xl relative backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between pb-1 mb-1 border-b border-amber-500/30">
          <span className="text-[11px] font-bold text-amber-300 font-serif flex items-center gap-1.5">
            <span>🗣️ Guru Speaks:</span>
            {currentStep >= 2 && currentStep < citationStep && (
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-700">
                ✍️ Drawing Node {currentStep - 1} of {lessonPlan.nodes.length}
              </span>
            )}
            {currentStep === citationStep && (
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-700 animate-pulse">
                📖 Pointing to Textbook Evidence
              </span>
            )}
            {currentStep >= socraticStep && (
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-700">
                💡 Socratic Checkpoint
              </span>
            )}
          </span>
          <button
            onClick={() => speakTeacherDialogue(activeSpeech)}
            className="text-[10px] text-amber-400 hover:text-amber-200 font-mono underline flex items-center gap-1"
          >
            <Volume2 className="w-3 h-3" /> Listen Again
          </button>
        </div>
        <p className="text-xs md:text-sm text-amber-100 font-serif leading-relaxed italic">
          "{activeSpeech}"
        </p>
      </div>

      {/* 3. THE DIGITAL BLACKBOARD CHALK CANVAS */}
      <div
        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-[#1a4a2c] relative overflow-y-auto custom-scrollbar transition-opacity duration-300 ${
          isErasingBoard ? 'opacity-20' : 'opacity-100'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, #0a2416 0%, #06140d 100%)',
        }}
      >
        {/* Subtle Chalk Grid Lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* STEP 0: EMPTY SLATE STATE */}
        {currentStep === 0 && (
          <div className="text-center space-y-3 my-auto">
            <span className="text-5xl md:text-6xl drop-shadow">👨‍🏫</span>
            <h3 className="text-xl md:text-2xl font-serif font-black text-amber-200 tracking-wide">
              Welcome to Today's Lesson
            </h3>
            <p className="text-xs md:text-sm text-emerald-200/90 font-serif max-w-md mx-auto italic">
              "Open your textbook to Page {lessonPlan.pageNumber}. Press Play to watch me teach and draw on the blackboard."
            </p>
            <button
              onClick={() => {
                setCurrentStep(1);
                setIsPlayingFlow(true);
              }}
              className="mt-2 px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition transform hover:scale-105 inline-flex items-center gap-2"
            >
              <span>▶️ Start Blackboard Teaching</span>
            </button>
          </div>
        )}

        {/* STEP 1+: CHALK TITLE WRITTEN ACROSS TOP */}
        {currentStep >= 1 && (
          <div className="text-center mb-4 transition-all duration-700 shrink-0">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-[#ffea79] font-serif tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] border-b-2 border-[#ffea79]/40 pb-1 inline-block px-4">
              {lessonPlan.topicTitle}
            </h2>
            <p className="text-[11px] text-emerald-300 font-serif italic mt-1">
              {lessonPlan.depthFocusDescription}
            </p>
          </div>
        )}

        {/* STEP 2+: LIVE PROGRESSIVE VERTICAL DIAGRAM */}
        {currentStep >= 2 && (
          <div className="flex flex-col items-center justify-center my-auto w-full max-w-xl transition-all duration-700">
            {lessonPlan.nodes.map((node, nIdx) => {
              const nodeStep = 2 + nIdx;
              const isNodeRevealed = currentStep >= nodeStep;
              const isActivelyTeaching = currentStep === nodeStep;
              const isMisconceptionCircled =
                showReteachAlert &&
                (lessonPlan.socraticQuestion.misconceptionTargetNodeId === node.id || nIdx <= 1);

              if (!isNodeRevealed) return null;

              return (
                <React.Fragment key={node.id}>
                  {/* Process Node Box */}
                  <div
                    className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl border-2 transition-all duration-500 transform ${
                      isMisconceptionCircled
                        ? 'border-rose-400 bg-rose-950/60 shadow-[0_0_20px_rgba(244,63,94,0.6)] ring-4 ring-rose-500/50 scale-105 animate-pulse'
                        : isActivelyTeaching
                        ? 'border-amber-400 bg-emerald-950/90 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-105'
                        : 'border-[#2d6a45] bg-black/50 shadow-md'
                    }`}
                    style={{ minWidth: '220px' }}
                  >
                    <span className="text-3xl md:text-4xl drop-shadow">{node.icon}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-[#ffea79] font-serif tracking-wide">
                          {node.label}
                        </span>
                        {isActivelyTeaching && (
                          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 rounded uppercase">
                            Chalk
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-emerald-200/90 font-serif leading-tight block mt-0.5">
                        {node.subtext}
                      </span>
                    </div>
                  </div>

                  {/* Connecting Chalk Arrow downwards (if not the last revealed node) */}
                  {nIdx < lessonPlan.nodes.length - 1 && currentStep >= nodeStep + 1 && (
                    <div className="flex flex-col items-center my-1.5 text-amber-300 font-serif font-bold text-xs">
                      <div className="w-0.5 h-3.5 bg-amber-400/80" />
                      <span className="text-[10px] text-amber-300 italic tracking-wider py-0.5">
                        │ growth ▼
                      </span>
                      <div className="w-0.5 h-3.5 bg-amber-400/80" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* STEP CITATION: PROMINENT EVIDENCE HIGHLIGHT NOTIFICATION */}
        {currentStep === citationStep && (
          <div className="my-2 p-3 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400/80 shadow-2xl flex items-center justify-between gap-3 shrink-0 max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔎</span>
              <div className="text-left">
                <span className="text-xs font-bold text-cyan-200 font-serif block">
                  Grounding Verified: Page {lessonPlan.pageNumber}
                </span>
                <span className="text-[10px] text-cyan-300/80">
                  Highlighted on original scanned textbook page on the left.
                </span>
              </div>
            </div>
            <button
              onClick={() => setCurrentStep(socraticStep)}
              className="px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow transition shrink-0"
            >
              Ask Checkpoint ➔
            </button>
          </div>
        )}

        {/* STEP SOCRATIC: INTERACTIVE QUESTION & MISCONCEPTION RE-TEACHING */}
        {currentStep >= socraticStep && (
          <div className="mt-3 p-4 rounded-2xl bg-purple-950/60 border-2 border-purple-500/80 shadow-2xl space-y-3 shrink-0 w-full max-w-xl">
            <div className="flex items-center justify-between pb-1 border-b border-purple-800">
              <span className="text-xs font-black text-purple-300 uppercase font-serif flex items-center gap-1.5">
                <span>💡</span>
                <span>GURU SOCRATIC CHECKPOINT • PAGE {lessonPlan.pageNumber}</span>
              </span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded-full">
                Depth: {lessonPlan.depth}
              </span>
            </div>

            <p className="text-xs md:text-sm text-purple-100 font-serif font-bold text-left">
              "{lessonPlan.socraticQuestion.question}"
            </p>

            {/* Answer Options */}
            <div className="grid grid-cols-1 gap-2">
              {lessonPlan.socraticQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`p-2.5 rounded-xl text-left text-xs font-serif font-bold transition-all flex items-center justify-between border ${
                      isSelected
                        ? opt.isCorrect
                          ? 'bg-emerald-900/90 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400'
                          : 'bg-rose-900/90 border-rose-400 text-rose-100 ring-2 ring-rose-400'
                        : 'bg-black/60 border-purple-800/80 text-purple-100 hover:bg-purple-900/40 hover:border-purple-600'
                    }`}
                  >
                    <span>
                      {String.fromCharCode(65 + oIdx)}. {opt.label}
                    </span>
                    {isSelected && <span>{opt.isCorrect ? '✅' : '❌'}</span>}
                  </button>
                );
              })}
            </div>

            {/* Misconception Re-Teaching Feedback */}
            {showReteachAlert && (
              <div className="p-3 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-300 text-xs font-black font-serif">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Guru Re-Teaches the Misconception:</span>
                </div>
                <p className="text-xs text-rose-100 font-serif italic leading-relaxed">
                  "{reteachMessage}"
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-rose-300/80 font-mono">
                    👉 Look at the circled stage on the board above.
                  </span>
                  <button
                    onClick={() => {
                      setSelectedOption(null);
                      setShowReteachAlert(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-[10.5px] font-bold shadow transition"
                  >
                    🔄 Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Cognitive Mastery Promotion Banner */}
            {isAnswerCorrect && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border-2 border-emerald-500 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-300 font-serif flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Cognitive Mastery Verified! ({(masteryScore * 100).toFixed(0)}%)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-black/40 px-2 py-0.5 rounded-md border border-emerald-700">
                    BKT Confirmed
                  </span>
                </div>
                <p className="text-xs text-emerald-100 font-serif italic">
                  "{lessonPlan.socraticQuestion.correctExplanation}"
                </p>

                {nextDepth && onMasteryPromoted && (
                  <button
                    onClick={() => onMasteryPromoted(nextDepth)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs font-serif shadow-lg shadow-amber-500/30 transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Advance to {nextDepth.toUpperCase()} Depth 🌟</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. REALISTIC CHALK TRAY AT BOTTOM OF BLACKBOARD */}
      <div className="mt-3 pt-2 border-t-2 border-[#5a361e] flex items-center justify-between text-xs text-emerald-300/80 font-mono shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-serif text-amber-300 font-bold">Chalk Tray:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-2 rounded bg-white shadow-sm border border-slate-400 inline-block" title="White Chalk" />
            <span className="w-5 h-2 rounded bg-[#ffea79] shadow-sm border border-amber-300 inline-block" title="Yellow Chalk" />
            <span className="w-5 h-2 rounded bg-[#68d391] shadow-sm border border-emerald-400 inline-block" title="Green Chalk" />
            <span className="w-5 h-2 rounded bg-[#fc8181] shadow-sm border border-rose-400 inline-block" title="Red Chalk" />
            <span className="text-base ml-1" title="Felt Eraser">🧽</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 font-serif italic">
            • Rule: "{lessonPlan.summaryRule}"
          </span>
        </div>
      </div>
    </div>
  );
}
