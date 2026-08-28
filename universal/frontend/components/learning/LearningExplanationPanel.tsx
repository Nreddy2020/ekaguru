'use client';

import React, { useState } from 'react';
import { Sparkles, Lightbulb, CheckCircle2, PlayCircle } from 'lucide-react';

export interface LearningExplanationPanelProps {
  sectionTitle?: string;
  conceptName?: string;
  description?: string;
  className?: string;
}

export function LearningExplanationPanel({
  sectionTitle = '2.1 Lungs',
  conceptName = 'Lungs',
  description,
  className = '',
}: LearningExplanationPanelProps) {
  const [activeTab, setActiveTab] = useState<'explanation' | 'simple' | 'deep'>('explanation');

  const isLungs = sectionTitle.toLowerCase().includes('lung');
  const isPhysicalGrowth = sectionTitle.toLowerCase().includes('physical') || sectionTitle.toLowerCase().includes('growth') || sectionTitle.toLowerCase().includes('1.1');

  const pedagogicalContent = isLungs
    ? {
        tabExplanation: 'The respiratory system supplies oxygen to our blood and removes carbon dioxide. When you inhale, air travels through your trachea into the branching bronchi, filling tiny air sacs called alveoli inside your lungs.',
        simpleWords: 'Think of your lungs as two soft balloons inside your chest that fill up with fresh air when you breathe in and push out used air when you breathe out.',
        deepDive: 'Gas exchange occurs at the capillary-alveolar membrane via passive diffusion. Oxygen binds to hemoglobin in red blood cells while carbon dioxide diffuses outward for exhalation.',
        thinkAboutTitle: 'Why do you breathe faster when running?',
        thinkAboutDesc: 'When you run or exercise, your muscles work harder and consume more oxygen. Your brain signals your lungs and heart to speed up to deliver extra oxygen rapidly!',
        keyPoints: [
          'Lungs are located inside the protective ribcage in your chest (thorax).',
          'The trachea (windpipe) splits into two bronchi leading to each lung.',
          'Inhalation brings oxygen in; exhalation releases carbon dioxide gas.',
          'The diaphragm muscle contracts downward to help pull air into lungs.',
        ],
        videoTitle: 'Watch: How Lungs Work & Respiration',
        videoDuration: '3:12 min',
      }
    : isPhysicalGrowth
    ? {
        tabExplanation: 'Physical growth refers to the continuous increase in body height, weight, and muscle strength as children grow. Growth milestones help track normal development in motor coordination and bone strength.',
        simpleWords: 'Growing up means your bones get longer, your muscles get stronger, and you can run, jump, and learn new skills that you could not do when you were a toddler.',
        deepDive: 'Growth hormones secreted by the pituitary gland stimulate chondrocyte division in the epiphyseal growth plates of long bones, driving steady childhood stature increases.',
        thinkAboutTitle: 'Why is sleep and nutritious food vital for growth?',
        thinkAboutDesc: 'Most growth hormone release and cellular repair happen while you are deep asleep at night. Eating protein, calcium, and vitamins gives your body the building blocks to grow tall and strong!',
        keyPoints: [
          'Growth milestones measure healthy height, weight, and physical coordination.',
          'Nutritious meals with calcium and protein build strong bones and muscles.',
          'Adequate daily sleep and active outdoor play support healthy development.',
          'Every child grows at their own healthy pace along natural growth curves.',
        ],
        videoTitle: 'Watch: Understanding Growth Milestones & Health',
        videoDuration: '2:45 min',
      }
    : {
        tabExplanation: description || `Foundational science explanations for ${sectionTitle}. EKAGURU provides structured pedagogy to reinforce textbook concepts with clear reasoning and examples.`,
        simpleWords: `In simple words, ${sectionTitle} explains how living things and systems function in our everyday world.`,
        deepDive: `Detailed conceptual analysis and scientific principles underlying ${sectionTitle} for deeper mastery.`,
        thinkAboutTitle: `How does ${sectionTitle} apply to daily life?`,
        thinkAboutDesc: `Observing these concepts in nature and your daily routine helps connect classroom science with real-world understanding.`,
        keyPoints: [
          `Core concept: ${conceptName} grounded in curriculum standards.`,
          'Structured learning progression from observation to application.',
          'Verified alignment with CBSE Grade 5 science outcomes.',
        ],
        videoTitle: `Watch: Overview of ${conceptName}`,
        videoDuration: '3:00 min',
      };

  return (
    <div
      data-testid="learning-explanation-panel"
      className={`flex flex-col bg-[#0b1322] border border-indigo-950/80 rounded-2xl overflow-hidden shadow-lg h-full ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-indigo-950/80 bg-[#0c1527]">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-purple-100 tracking-wide">
            Extra Explanations <span className="text-slate-400 font-normal">by EKAGURU</span>
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950/90 text-purple-300 border border-purple-500/30">
          Added for Better Understanding
        </span>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-[#090f1d] border-b border-slate-800/60 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('explanation')}
          className={`px-3 py-1 rounded-lg font-semibold transition ${
            activeTab === 'explanation' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Explanation
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('simple')}
          className={`px-3 py-1 rounded-lg font-semibold transition ${
            activeTab === 'simple' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          In Simple Words
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('deep')}
          className={`px-3 py-1 rounded-lg font-semibold transition ${
            activeTab === 'deep' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Deep Dive
        </button>
      </div>

      {/* Pedagogical Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed text-slate-200 custom-scrollbar">
        <p className="text-sm text-slate-300 leading-relaxed font-sans">
          {activeTab === 'explanation' && pedagogicalContent.tabExplanation}
          {activeTab === 'simple' && pedagogicalContent.simpleWords}
          {activeTab === 'deep' && pedagogicalContent.deepDive}
        </p>

        {/* Think About It Card */}
        <div className="p-4 rounded-xl bg-[#131d33] border border-indigo-900/60 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Lightbulb className="w-4 h-4" />
            <span>Think About It</span>
          </div>
          <h4 className="font-semibold text-slate-100">{pedagogicalContent.thinkAboutTitle}</h4>
          <p className="text-slate-300 text-[11px] leading-normal">{pedagogicalContent.thinkAboutDesc}</p>
        </div>

        {/* Key Points */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Key Points</h4>
          <div className="space-y-1.5">
            {pedagogicalContent.keyPoints.map((pt, i) => (
              <div key={i} className="flex items-start gap-2 text-[11.5px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Video Card */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#11192e] border border-slate-800/80 hover:border-indigo-500/40 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/90 flex items-center justify-center text-white shadow">
              <PlayCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-200 block text-xs">{pedagogicalContent.videoTitle}</span>
              <span className="text-[10px] text-slate-400">{pedagogicalContent.videoDuration} • Interactive Animation</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300">Play →</span>
        </div>
      </div>
    </div>
  );
}
