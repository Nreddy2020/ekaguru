'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Compass,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Brain,
  AlertTriangle,
  Award,
  Zap,
} from 'lucide-react';
import { ConceptGraphService } from '@/lib/learning/concept-graph.service';
import { LearningConcept, SourceAnchor, CognitiveSkill } from '@/lib/learning/pedagogy-types';

export interface LearningExplanationPanelProps {
  sectionId?: string;
  sectionTitle?: string;
  conceptName?: string;
  description?: string;
  sourceAnchor?: SourceAnchor;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export function LearningExplanationPanel({
  sectionId = 'sec-1-3',
  sectionTitle = '1.3 Living Things and How They Grow',
  conceptName,
  description = '',
  sourceAnchor,
  activeTab = 'extra-explanations',
  onTabChange,
  className = '',
}: LearningExplanationPanelProps) {
  const [depthLevel, setDepthLevel] = useState<'understand' | 'simple' | 'deep'>('understand');
  const [selectedPracticeAnswers, setSelectedPracticeAnswers] = useState<Record<string, number>>({});
  const [masteryEvents, setMasteryEvents] = useState<string[]>(['seen']);

  // Resolve dynamic grounded concept model from ConceptGraphService
  const concept: LearningConcept = ConceptGraphService.getConceptForSection(
    sectionId,
    sectionTitle,
    description,
    sourceAnchor
  );

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setSelectedPracticeAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
    if (!masteryEvents.includes('practiced')) {
      setMasteryEvents((prev) => [...prev, 'practiced']);
    }
  };

  const handleMarkUnderstood = () => {
    if (!masteryEvents.includes('understood')) {
      setMasteryEvents((prev) => [...prev, 'understood', 'verified']);
    }
  };

  const isLowConfidence = sourceAnchor && sourceAnchor.confidence < 0.7;

  return (
    <div
      data-testid="learning-explanation-panel"
      className={`flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden backdrop-blur-md ${className}`}
    >
      {/* 1. Header: Concept Grounding & Provenance Bar */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                EKAGURU Knowledge Layer
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.0
              </span>
            </div>
            <h2 className="text-sm font-bold text-white truncate">
              {concept.title}
            </h2>
          </div>
        </div>

        {/* Source Grounding Provenance Tag */}
        <div className="flex items-center gap-2">
          {isLowConfidence ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Needs Verification</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Source-Grounded</span>
              {sourceAnchor?.printedPage && (
                <span className="font-mono text-emerald-400/80 text-[10px]">
                  (p. {sourceAnchor.printedPage})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto max-h-[750px]">
        {/* TAB 1: Extra Explanations with 3-Level Depth Stepper */}
        <div className="flex flex-col gap-4">
          {/* Depth Stepper Selector */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setDepthLevel('understand')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                depthLevel === 'understand'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>1. Understand</span>
            </button>
            <button
              type="button"
              onClick={() => setDepthLevel('simple')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                depthLevel === 'simple'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>2. In Simple Words</span>
            </button>
            <button
              type="button"
              onClick={() => setDepthLevel('deep')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                depthLevel === 'deep'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>3. Deep Dive</span>
            </button>
          </div>

          {/* Depth Content Card */}
          {depthLevel === 'understand' && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col gap-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                {concept.pedagogy.understand.heading}
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {concept.pedagogy.understand.content}
              </p>
              {concept.pedagogy.understand.keyTerms && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {concept.pedagogy.understand.keyTerms.map((term, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    >
                      ✦ {term}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {depthLevel === 'simple' && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col gap-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                {concept.pedagogy.simpleWords.heading}
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {concept.pedagogy.simpleWords.content}
              </p>
              {concept.pedagogy.simpleWords.analogy && (
                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 italic flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{concept.pedagogy.simpleWords.analogy}</span>
                </div>
              )}
            </div>
          )}

          {depthLevel === 'deep' && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col gap-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                {concept.pedagogy.deepDive.heading}
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {concept.pedagogy.deepDive.content}
              </p>
              {concept.pedagogy.deepDive.mechanism && (
                <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 font-mono">
                  <span className="font-bold text-purple-300">Mechanism: </span>
                  {concept.pedagogy.deepDive.mechanism}
                </div>
              )}
              {concept.pedagogy.deepDive.curiosityPrompt && (
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-amber-300">Think About It: </strong>
                    {concept.pedagogy.deepDive.curiosityPrompt}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Real-World Grounded Examples */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Real-World Examples
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {concept.examples.length} Scenarios
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {concept.examples.map((ex) => (
              <div
                key={ex.id}
                className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs font-bold text-white">{ex.title}</span>
                </div>
                <p className="text-xs text-slate-300">{ex.scenario}</p>
                <div className="text-[11px] text-indigo-300/90 italic pt-1 border-t border-slate-800/40">
                  💡 {ex.connection}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Interactive Multi-Skill Practice */}
        {concept.practice.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
                Concept Check & Practice
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Cognitive Skill Check
              </span>
            </div>

            {concept.practice.map((q) => {
              const userAns = selectedPracticeAnswers[q.id];
              const isAnswered = userAns !== undefined;
              const isCorrect = userAns === q.correctIndex;

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white flex-1">{q.question}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {q.cognitiveSkill}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAns === optIdx;
                      let btnStyle = 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-800';

                      if (isAnswered) {
                        if (optIdx === q.correctIndex) {
                          btnStyle = 'bg-emerald-950/80 text-emerald-200 border-emerald-500 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-red-950/80 text-red-200 border-red-500';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border flex items-center justify-between gap-2 ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && optIdx === q.correctIndex && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div
                      className={`p-3 rounded-lg text-xs ${
                        isCorrect
                          ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                          : 'bg-amber-950/30 border border-amber-500/40 text-amber-200'
                      }`}
                    >
                      <p className="font-semibold mb-1">
                        {isCorrect ? '✓ Well Done!' : '⚠️ Explanation:'}
                      </p>
                      <p>{q.explanation}</p>
                      {q.misconceptionTrap && !isCorrect && (
                        <p className="mt-1 text-[11px] text-amber-300/80 italic">
                          Common Misconception: {q.misconceptionTrap}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Related Concept Graph */}
        {concept.relatedConcepts.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              Connected Knowledge Graph
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {concept.relatedConcepts.map((rc) => (
                <div
                  key={rc.id}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-purple-500/40 transition-all flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-purple-400">
                      {rc.relationship}
                    </span>
                    {rc.targetChapterTitle && (
                      <span className="text-[9px] text-slate-500">{rc.targetChapterTitle}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white">{rc.title}</span>
                  <p className="text-[11px] text-slate-400">{rc.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Footer: Mastery State & Verification Event Action */}
      <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {['seen', 'understood', 'practiced', 'verified'].map((ev, idx) => {
              const isAchieved = masteryEvents.includes(ev);
              return (
                <span
                  key={ev}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize ${
                    isAchieved
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {ev}
                </span>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleMarkUnderstood}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Verify Mastery</span>
        </button>
      </div>
    </div>
  );
}
