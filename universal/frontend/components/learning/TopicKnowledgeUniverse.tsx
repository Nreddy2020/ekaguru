'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Compass,
  Sun,
  Globe,
  Feather,
  Users,
  ChevronRight,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  Telescope,
  Palette,
  Wind,
  BookOpen,
  Award,
} from 'lucide-react';
import {
  KnowledgeUniverseService,
  UniverseNode,
  TopicUniverse,
} from '@/lib/learning/knowledge-universe.service';

export interface TopicKnowledgeUniverseProps {
  topicId?: string;
  className?: string;
}

export function TopicKnowledgeUniverse({
  topicId = 'c-festivals-india',
  className = '',
}: TopicKnowledgeUniverseProps) {
  const universe: TopicUniverse = KnowledgeUniverseService.getUniverse(topicId);
  const [activeNodeId, setActiveNodeId] = useState<string>(universe.coreNodes[0].id);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);
  const [showCosmicDeeper, setShowCosmicDeeper] = useState<boolean>(false);

  const activeNode: UniverseNode =
    universe.coreNodes.find((n) => n.id === activeNodeId) || universe.coreNodes[0];

  const handleSelectNode = (nodeId: string) => {
    setActiveNodeId(nodeId);
    setSelectedOption(null);
    setShowCosmicDeeper(false);
  };

  return (
    <div
      data-testid="topic-knowledge-universe"
      className={`flex flex-col bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950 rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden backdrop-blur-xl ${className}`}
    >
      {/* 1. Cosmic Constellation Header */}
      <div className="p-5 border-b border-indigo-500/20 bg-slate-950/80 flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-base">{universe.mainIcon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  🌌 EKAGURU Knowledge Universe
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Atom → Universe
                </span>
              </div>
              <h2 className="text-base font-black text-white">{universe.topicTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Grounded in: </span>
            <strong className="text-white">{universe.sourceAnchorText}</strong>
          </div>
        </div>

        <p className="text-xs text-slate-300 italic bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-500/20">
          "{universe.textbookExcerpt}"
        </p>
      </div>

      {/* 2. Interactive Knowledge Orbit Selector (The Constellation) */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col gap-2.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          Select a Realm to Explore in this Topic Universe:
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {universe.coreNodes.map((node) => {
            const isActive = node.id === activeNode.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => handleSelectNode(node.id)}
                className={`p-2.5 rounded-xl border transition-all text-left flex flex-col gap-1 shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-900/80 to-purple-950/80 border-indigo-400 shadow-md shadow-indigo-500/30 scale-[1.02]'
                    : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{node.icon}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950/80 text-slate-300">
                    {node.provenance.split(' ')[0]}
                  </span>
                </div>
                <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {node.name.split(' ')[1] || node.name}
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1 opacity-80">
                  {node.tagline}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. The Deep Realm Explorer */}
      <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto max-h-[620px]">
        {/* Realm Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeNode.icon}</span>
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  {activeNode.provenance}
                </span>
                <h3 className="text-sm font-black text-white">{activeNode.name}</h3>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {activeNode.shortDescription}
          </p>
        </div>

        {/* 🔬 SHOW ME: Visual Mechanism Chain */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-xs">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Show Me: {activeNode.visualMechanism.title}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {activeNode.visualMechanism.steps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center text-center gap-1.5 group hover:border-cyan-500/40 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-all">
                  {step.icon}
                </div>
                <span className="text-xs font-bold text-white">{step.label}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{step.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 🧠 TEACH ME: Socratic Inquiry */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            {activeNode.socraticInquiry.question}
          </span>

          <div className="flex flex-col gap-2">
            {activeNode.socraticInquiry.options.map((opt, optIdx) => {
              const isChosen = selectedOption === optIdx;
              const isCorrect = optIdx === activeNode.socraticInquiry.correctIndex;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => setSelectedOption(optIdx)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between border ${
                    selectedOption !== null
                      ? isCorrect
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                        : isChosen
                        ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-500'
                      : 'bg-slate-900/80 hover:bg-indigo-950/60 border-slate-800 text-slate-200'
                  }`}
                >
                  <span className="font-medium">{opt}</span>
                  {selectedOption !== null && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedOption !== null && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              💡 <strong>Explanation: </strong> {activeNode.socraticInquiry.explanation}
            </div>
          )}
        </div>

        {/* 🎨 TRY IT: Hands-on Experiential Task */}
        {activeNode.handsOnTask && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/30 via-slate-950 to-slate-900 border border-purple-500/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-400" />
                {activeNode.handsOnTask.title}
              </span>
              {taskCompleted && (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Award className="w-3 h-3" /> {activeNode.handsOnTask.rewardBadge} Earned!
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 font-medium">
              {activeNode.handsOnTask.instruction}
            </p>

            <button
              type="button"
              onClick={() => setTaskCompleted(true)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>I Completed This Discovery Task! 🌟</span>
            </button>
          </div>
        )}

        {/* 🔭 GO DEEPER: Cosmic Telescope Link */}
        {activeNode.deeperCosmicLink && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-900 border border-amber-500/30 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setShowCosmicDeeper(!showCosmicDeeper)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-xs font-black text-amber-300 flex items-center gap-2">
                <Telescope className="w-4 h-4 text-amber-400" />
                Cosmic Telescope: {activeNode.deeperCosmicLink.question}
              </span>
              <ChevronRight
                className={`w-4 h-4 text-amber-400 transition-all ${
                  showCosmicDeeper ? 'rotate-90' : ''
                }`}
              />
            </button>

            {showCosmicDeeper && (
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 text-xs text-amber-100/90 leading-relaxed animate-in fade-in">
                🌌 <strong>Cosmic Truth: </strong> {activeNode.deeperCosmicLink.answer}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
