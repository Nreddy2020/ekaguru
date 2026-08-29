'use client';

import React, { useState, useMemo } from 'react';
import {
  Heart,
  Activity,
  Compass,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Smile,
  GraduationCap,
  Sparkles,
  Globe2,
} from 'lucide-react';
import { PedagogicalOrchestratorService } from '@/lib/learning/pedagogical-orchestrator.service';
import { SourceAnchor } from '@/lib/learning/runtime-contracts';
import { TopicKnowledgeUniverse } from './TopicKnowledgeUniverse';

export interface LearningExplanationPanelProps {
  sectionId?: string;
  sectionTitle?: string;
  conceptName?: string;
  description?: string;
  sourceAnchor?: SourceAnchor;
  className?: string;
}

export function LearningExplanationPanel({
  sectionId = 'sec-2-10',
  sectionTitle = '2.10 Heart, Lungs, Stomach & Kidneys',
  conceptName,
  description = '',
  sourceAnchor,
  className = '',
}: LearningExplanationPanelProps) {
  const orchestrator = useMemo(() => new PedagogicalOrchestratorService('learner-001'), []);
  const [viewMode, setViewMode] = useState<'LEARNER' | 'UNIVERSE' | 'STUDIO'>(
    sectionTitle.includes('Festival') || sectionId.includes('festival') ? 'UNIVERSE' : 'LEARNER'
  );
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [runtimeState, setRuntimeState] = useState(() =>
    orchestrator.getRuntimeState(sectionId, sectionTitle, 0)
  );

  // Form inputs for Observational Task
  const [obsBaseline, setObsBaseline] = useState<string>('38');
  const [obsPost, setObsPost] = useState<string>('52');
  const [obsPrediction, setObsPrediction] = useState<'faster' | 'slower' | 'same'>('faster');
  const [obsExplanation, setObsExplanation] = useState<string>(
    'My muscles worked hard and needed more oxygen, so my heart pumped blood faster!'
  );
  const [obsFeedback, setObsFeedback] = useState<string | null>(null);

  const ku = runtimeState.currentConcept;
  const mastery = runtimeState.masteryMetric;
  const activeStep = runtimeState.activeSocraticStep;

  const handleSelectOption = (optIdx: number) => {
    const res = orchestrator.submitSocraticAnswer(
      sectionId,
      sectionId,
      runtimeState.activeSocraticStepIndex,
      optIdx,
      sectionTitle
    );
    setCurrentStepIdx(res.state.activeSocraticStepIndex);
    setRuntimeState(res.state);
  };

  const handleSelectRemediationOption = (optIdx: number) => {
    const res = orchestrator.submitRemediationAnswer(sectionId, sectionId, optIdx, sectionTitle);
    setCurrentStepIdx(res.state.activeSocraticStepIndex);
    setRuntimeState(res.state);
  };

  const handleRunObservation = () => {
    const res = orchestrator.submitObservation(
      sectionId,
      sectionId,
      {
        baselinePulse: Number(obsBaseline),
        postPulse: Number(obsPost),
        pulsePrediction: obsPrediction,
        explanationText: obsExplanation,
      },
      sectionTitle
    );
    setRuntimeState(res.state);
    setObsFeedback(res.feedback);
  };

  // Friendly Step Metadata
  const stepTitles = [
    { name: 'Meet the Idea', icon: '🧠', tag: 'Discovery' },
    { name: "Let's See How It Works", icon: '🔬', tag: 'Mechanism' },
    { name: 'Why Your Body Needs This', icon: '🤔', tag: 'Big Purpose' },
    { name: 'Think Like a Scientist', icon: '⚡', tag: 'What If?' },
    { name: 'Use Your Superpower', icon: '🌎', tag: 'Real World' },
  ];

  const currentFriendly = stepTitles[runtimeState.activeSocraticStepIndex] || stepTitles[0];

  return (
    <div
      data-testid="learning-explanation-panel"
      className={`flex flex-col bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl ${className}`}
    >
      {/* 1. Universal Header & Navigation Triad */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                🌱 EKAGURU Education Engine
              </span>
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Class 5 EVS
              </span>
            </div>
            <h2 className="text-sm font-black text-white">{ku.title.split(':')[1] || ku.title}</h2>
          </div>
        </div>

        {/* 3-Way Mode Switcher: Universe, Learner, Studio */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('UNIVERSE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'UNIVERSE'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>🌌 Universe</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('LEARNER')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'LEARNER'
                ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>🌱 Learn</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('STUDIO')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'STUDIO'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>🔬 Studio</span>
          </button>
        </div>
      </div>

      {/* 2. Topic Knowledge Universe View Mode */}
      {viewMode === 'UNIVERSE' && (
        <TopicKnowledgeUniverse topicId="c-festivals-india" />
      )}

      {/* 3. Studio Inspector Banner */}
      {viewMode === 'STUDIO' && (
        <div className="px-5 py-2 bg-indigo-950/60 border-b border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Pedagogical Reason: </strong> {mastery.nextPedagogicalAction.reason}
            </span>
          </div>
          <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
            {ku.archetype} | p. {ku.sourceFacts[0]?.sourceAnchor?.printedPage || 10}
          </span>
        </div>
      )}

      {/* 4. Learner & Studio Experience View */}
      {viewMode !== 'UNIVERSE' && (
        <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto max-h-[720px]">
          {/* Child-Friendly Socratic Journey Tracker */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentFriendly.icon}</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Step {runtimeState.activeSocraticStepIndex + 1} of {runtimeState.totalSocraticSteps}: {currentFriendly.tag}
                </div>
                <div className="text-xs font-extrabold text-white">{currentFriendly.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: runtimeState.totalSocraticSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-1.5 rounded-full transition-all ${
                    i === runtimeState.activeSocraticStepIndex
                      ? 'bg-rose-500 w-8 shadow-sm shadow-rose-500/50'
                      : i < runtimeState.activeSocraticStepIndex
                      ? 'bg-emerald-500'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Misconception Remediation */}
          {runtimeState.remediationMode && runtimeState.remediationStep && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/50 via-slate-950 to-slate-900 border border-amber-500/40 shadow-xl flex flex-col gap-3.5">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
                <Lightbulb className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>💭 Interesting Thinking! Let's Explore This Mix-up</span>
              </div>

              <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                {runtimeState.remediationStep.socraticExplanation}
              </p>

              {/* Visual Organ Contrast Cards */}
              <div className="grid grid-cols-2 gap-2.5 my-1">
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex flex-col items-center text-center gap-1">
                  <span className="text-xl">❤️</span>
                  <span className="text-xs font-bold text-rose-300">The Heart</span>
                  <span className="text-[11px] text-slate-300 leading-tight">
                    Pumps blood containing oxygen & food to every cell!
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col items-center text-center gap-1">
                  <span className="text-xl">🫁</span>
                  <span className="text-xs font-bold text-cyan-300">The Lungs</span>
                  <span className="text-[11px] text-slate-300 leading-tight">
                    Takes in fresh air from breathing and adds oxygen to blood.
                  </span>
                </div>
              </div>

              {/* Independent Challenge */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col gap-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Let's test your new superpower idea:
                </span>
                <p className="text-xs text-slate-200 font-medium">
                  {runtimeState.remediationStep.challengeQuestion.text}
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  {runtimeState.remediationStep.challengeQuestion.options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectRemediationOption(optIdx)}
                      className="w-full text-left p-2.5 rounded-xl text-xs bg-slate-900 hover:bg-indigo-950 text-slate-200 border border-slate-800 hover:border-indigo-500/50 transition-all flex items-center justify-between group shadow-sm"
                    >
                      <span className="font-medium">{opt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedback message (if any) */}
          {runtimeState.lastFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                runtimeState.lastFeedback.isCorrect
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
              }`}
            >
              <span className="font-bold">{runtimeState.lastFeedback.message}</span>
              <span className="text-[11px] opacity-90">{runtimeState.lastFeedback.explanation}</span>
            </div>
          )}

          {/* Active Socratic Step */}
          {!runtimeState.remediationMode && activeStep && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3.5 shadow-lg">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 text-sm text-slate-100 leading-relaxed font-medium">
                {activeStep.groundedExplanation}
              </div>

              {/* Visual Mechanism Flow */}
              {activeStep.mentalModelDiagram && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center gap-2 text-xs font-extrabold text-cyan-300 shadow-inner">
                  {activeStep.mentalModelDiagram}
                </div>
              )}

              {/* Socratic Question */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
                  {activeStep.question.text}
                </span>
                <div className="flex flex-col gap-2">
                  {activeStep.question.options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      className="w-full text-left p-3 rounded-xl text-xs bg-slate-900/90 hover:bg-gradient-to-r hover:from-rose-950/40 hover:to-indigo-950/60 text-slate-200 border border-slate-800 hover:border-rose-500/40 transition-all flex items-center justify-between group shadow-sm"
                    >
                      <span className="font-medium">{opt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 🫀 Experiential Observation Experiment */}
          {ku.observationalTask && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-950 to-slate-900 border border-emerald-500/40 flex flex-col gap-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-black text-xs">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>🫀 Let's Investigate Your Heart! (Live Experiment)</span>
                </div>
                {mastery.observationCompleted ? (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Experiment Verified!
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                    ⚡ Try It Now!
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 font-medium">{ku.observationalTask.objective}</p>

              {/* Step 1 & 2: Before & After Pulse Counting */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    ❤️ 1. Before Exercise (Quiet):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={obsBaseline}
                      onChange={(e) => setObsBaseline(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white w-20 text-center font-bold"
                    />
                    <span className="text-[10px] text-slate-400">beats / 30s</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                    🏃 2. After 20 Jumping Jacks:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={obsPost}
                      onChange={(e) => setObsPost(e.target.value)}
                      className="bg-slate-950 border border-rose-700/60 rounded-lg p-1.5 text-xs text-rose-300 w-20 text-center font-bold"
                    />
                    <span className="text-[10px] text-slate-400">beats / 30s</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Prediction Chips */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  3. What happened to your heartbeat rate?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setObsPrediction('faster')}
                    className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                      obsPrediction === 'faster'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    ⚡ Much Faster
                  </button>
                  <button
                    type="button"
                    onClick={() => setObsPrediction('slower')}
                    className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                      obsPrediction === 'slower'
                        ? 'bg-cyan-500 text-white border-cyan-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    ❄️ Slower
                  </button>
                  <button
                    type="button"
                    onClick={() => setObsPrediction('same')}
                    className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                      obsPrediction === 'same'
                        ? 'bg-purple-500 text-white border-purple-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    🔄 Exact Same
                  </button>
                </div>
              </div>

              {/* Step 4: Explanation */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-300">
                  4. Why do you think your heart beat faster?
                </label>
                <textarea
                  value={obsExplanation}
                  onChange={(e) => setObsExplanation(e.target.value)}
                  rows={2}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 resize-none font-medium leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleRunObservation}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" />
                <span>Record My Experiment Results 🚀</span>
              </button>

              {obsFeedback && (
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs text-emerald-300 font-bold">
                  {obsFeedback}
                </div>
              )}
            </div>
          )}

          {/* Real-World Transfer */}
          {ku.realWorldTransfers.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-400" />
                🌎 Real-World Connection: {ku.realWorldTransfers[0].title}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {ku.realWorldTransfers[0].scenario}
              </p>
              <div className="text-[11px] text-purple-300 italic pt-1 border-t border-slate-800">
                💡 {ku.realWorldTransfers[0].connection}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Mastery Journey Footer */}
      {viewMode !== 'UNIVERSE' && (
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/95 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                🌱 Your Understanding
              </span>
              {mastery.status === 'MASTERED' && (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1 animate-bounce">
                  ✨ Star Mastered!
                </span>
              )}
            </div>
            <span
              className={`text-xs font-black px-3 py-0.5 rounded-full border ${
                mastery.status === 'MASTERED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : mastery.status === 'NEEDS_REMEDIATION'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              }`}
            >
              {mastery.status === 'MASTERED'
                ? '🌟 Complete Understanding'
                : mastery.status === 'NEEDS_REMEDIATION'
                ? '💡 Exploring Mix-up'
                : '🌱 Growing & Exploring'}
            </span>
          </div>

          {/* 3-Dimensional Mastery Progress */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Remember</span>
                <span className="font-mono font-bold text-white">{mastery.recallScore}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${mastery.recallScore}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Use the Idea</span>
                <span className="font-mono font-bold text-white">{mastery.applicationScore}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{ width: `${mastery.applicationScore}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Explain Why</span>
                <span className="font-mono font-bold text-white">{mastery.reasoningScore}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{ width: `${mastery.reasoningScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
