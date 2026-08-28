'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Award,
  Activity,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { PedagogicalOrchestratorService } from '@/lib/learning/pedagogical-orchestrator.service';
import { SourceAnchor } from '@/lib/learning/runtime-contracts';

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
  const [runtimeState, setRuntimeState] = useState(() =>
    orchestrator.getRuntimeState(sectionId, sectionTitle)
  );

  // Form inputs for Observational Task
  const [obsBaseline, setObsBaseline] = useState<string>('38');
  const [obsPost, setObsPost] = useState<string>('52');
  const [obsExplanation, setObsExplanation] = useState<string>(
    'Muscles worked harder during exercise and required more oxygen, so the heart pumped blood faster.'
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
    setRuntimeState(res.state);
  };

  const handleRunObservation = () => {
    const res = orchestrator.submitObservation(
      sectionId,
      sectionId,
      {
        baselinePulse: Number(obsBaseline),
        postPulse: Number(obsPost),
        explanationText: obsExplanation,
      },
      sectionTitle
    );
    setRuntimeState(res.state);
    setObsFeedback(res.feedback);
  };

  const isLowConfidence = sourceAnchor && sourceAnchor.confidence < 0.7;

  return (
    <div
      data-testid="learning-explanation-panel"
      className={`flex flex-col bg-slate-900/95 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden backdrop-blur-md ${className}`}
    >
      {/* 1. Header: Concept Provenance & Archetype */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                EKAGURU Pedagogical Runtime
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                {ku.archetype}
              </span>
            </div>
            <h2 className="text-sm font-bold text-white truncate">{ku.title}</h2>
          </div>
        </div>

        {/* Source Provenance Tag */}
        <div className="flex items-center gap-2">
          {isLowConfidence ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Needs Source Verification</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authoritative Grounding</span>
              {ku.sourceFacts[0]?.sourceAnchor && (
                <span className="font-mono text-emerald-400/80 text-[10px]">
                  (p. {ku.sourceFacts[0].sourceAnchor.printedPage})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Deterministic Action Reason Banner */}
      <div className="px-5 py-2 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center gap-2 text-xs text-indigo-300">
        <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span className="truncate">
          <strong className="text-indigo-200">Why am I seeing this? </strong>
          {mastery.nextPedagogicalAction.reason}
        </span>
      </div>

      {/* 3. Main Workspace Container */}
      <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto max-h-[750px]">
        {/* Misconception Alert & Socratic Contrast (if active) */}
        {runtimeState.remediationMode && ku.misconceptions.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Targeted Misconception Remediation</span>
            </div>
            <p className="text-xs text-amber-200 leading-relaxed">
              {ku.misconceptions[0].socraticRemediation}
            </p>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-amber-500/30 flex flex-col gap-2">
              <span className="text-xs font-semibold text-white">
                Verification Challenge: {ku.misconceptions[0].independentVerificationChallenge.question}
              </span>
              <div className="flex flex-col gap-1.5">
                {ku.misconceptions[0].independentVerificationChallenge.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className="w-full text-left p-2 rounded-lg text-xs bg-slate-900/80 hover:bg-indigo-950/60 text-slate-200 border border-slate-800 transition-all"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Socratic Step */}
        {!runtimeState.remediationMode && (
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                Socratic Step: {activeStep.stepType}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Step {runtimeState.activeSocraticStepIndex + 1} of {ku.socraticSteps.length}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium">{activeStep.prompt}</p>

            <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-sm text-slate-100 leading-relaxed">
              {activeStep.groundedExplanation}
            </div>

            {activeStep.mentalModelDiagram && (
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-300 text-center">
                {activeStep.mentalModelDiagram}
              </div>
            )}

            {/* Socratic Question */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
              <span className="text-xs font-bold text-white">{activeStep.question.text}</span>
              <div className="flex flex-col gap-1.5">
                {activeStep.question.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className="w-full text-left p-2.5 rounded-lg text-xs bg-slate-900/60 hover:bg-indigo-950/80 text-slate-300 border border-slate-800 hover:border-indigo-500/40 transition-all flex items-center justify-between"
                  >
                    <span>{opt}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Observational Hands-On Task (Engine D) */}
        {ku.observationalTask && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                {ku.observationalTask.title}
              </span>
              {mastery.observationCompleted ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  Required for Mastery
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300">{ku.observationalTask.objective}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400">Baseline Pulse (30s quiet):</label>
                <input
                  type="number"
                  value={obsBaseline}
                  onChange={(e) => setObsBaseline(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400">Post-Activity Pulse (30s jumping jacks):</label>
                <input
                  type="number"
                  value={obsPost}
                  onChange={(e) => setObsPost(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400">Scientific Explanation (Why did pulse change?):</label>
              <textarea
                value={obsExplanation}
                onChange={(e) => setObsExplanation(e.target.value)}
                rows={2}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleRunObservation}
              className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Submit Observational Evidence</span>
            </button>

            {obsFeedback && (
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-emerald-500/30 text-xs text-emerald-300">
                {obsFeedback}
              </div>
            )}
          </div>
        )}

        {/* Real-World Transfer Scenarios */}
        {ku.realWorldTransfers.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              Real-World Knowledge Transfer
            </span>
            {ku.realWorldTransfers.map((tr, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col gap-1"
              >
                <span className="text-xs font-bold text-white">{tr.title}</span>
                <p className="text-xs text-slate-300">{tr.scenario}</p>
                <span className="text-[11px] text-purple-300 italic pt-1 border-t border-slate-800/40">
                  💡 {tr.connection}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Empirical Mastery Evidence Meter (Engine F) */}
      <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-950/90 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            Empirical Mastery Status
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              mastery.status === 'MASTERED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : mastery.status === 'NEEDS_REMEDIATION'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
            }`}
          >
            {mastery.status}
          </span>
        </div>

        {/* 3-Dimensional Cognitive Scores */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Recall (≥80%)</span>
              <span className="font-mono font-bold text-white">{mastery.recallScore}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all"
                style={{ width: `${mastery.recallScore}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Application (≥70%)</span>
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
              <span className="text-slate-400">Reasoning (≥70%)</span>
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
    </div>
  );
}
