import {
  TeachingDepth,
  EvidenceCitation,
} from './teaching-package.types';
import { CANONICAL_TEXTBOOK_TOC, getPhysicalPageContent } from './page-preservation-engine';

export interface GuruBoardDrawingElement {
  icon: string;
  label: string;
  subtext: string;
  highlight?: boolean;
}

export interface GuruTeachingStep {
  stepNumber: number;
  stepTag: string;
  stepTitle: string;
  guruSpeech: string;
  guruExplanation: string;
  chalkboardWords: string[];
  chalkboardNotes: string[];
  socraticPrompt: string;
  drawingScene: {
    title: string;
    subtitle: string;
    badge: string;
    flowArrows?: boolean;
    elements: GuruBoardDrawingElement[];
  };
  evidenceCitation: EvidenceCitation;
}

export interface GuruPageTeachingPackage {
  physicalPage: number;
  chapterNumber: number;
  chapterTitle: string;
  unitName: string;
  topicName: string;
  depth: TeachingDepth;
  boardMainTitle: string;
  boardSubtitle: string;
  classroomFormula: {
    title: string;
    formula: string;
  };
  keyTakeaway: string;
  steps: GuruTeachingStep[];
  persistentGuruNotes: string[];
  quickChalkboardSummary: {
    whatWeLearned: string[];
    rememberRule: string;
  };
}

export class GuruTeachingEngine {
  private static CACHE = new Map<string, GuruPageTeachingPackage>();

  public static getGuruLessonForPage(
    pageNumber: number,
    depth: TeachingDepth = 'basis'
  ): GuruPageTeachingPackage {
    const cacheKey = `${pageNumber}-${depth}`;
    if (this.CACHE.has(cacheKey)) {
      return this.CACHE.get(cacheKey)!;
    }

    const canonicalToc =
      CANONICAL_TEXTBOOK_TOC.find(
        (c) => pageNumber >= c.startPage && pageNumber <= c.endPage
      ) || CANONICAL_TEXTBOOK_TOC[1];

    const activeSection =
      canonicalToc.sections.find((s) => s.page === pageNumber) ||
      canonicalToc.sections.slice().reverse().find((s) => s.page <= pageNumber) ||
      canonicalToc.sections[0];

    const titleClean = canonicalToc.title.replace(/^Chapter \d+:\s*/i, '');
    const topicName = activeSection ? activeSection.title : titleClean;

    const citation: EvidenceCitation = {
      bookId: 'evs-class-5',
      chapterNumber: canonicalToc.chapterNumber,
      physicalPage: pageNumber,
      blockId: `blk-${pageNumber}-1`,
      regionId: `reg-${pageNumber}-core`,
      bbox: { x: 165, y: 84, width: 926, height: 298 },
      confidence: 0.99,
      sourceTextSnippet: `${titleClean}: ${topicName} (Physical Page ${pageNumber})`,
    };

    const lesson = this.buildGuruLesson(
      pageNumber,
      canonicalToc,
      activeSection,
      depth,
      citation
    );

    this.CACHE.set(cacheKey, lesson);
    return lesson;
  }

  private static buildGuruLesson(
    pageNumber: number,
    toc: any,
    section: any,
    depth: TeachingDepth,
    citation: EvidenceCitation
  ): GuruPageTeachingPackage {
    const titleClean = toc.title.replace(/^Chapter \d+:\s*/i, '');
    const topicName = section ? section.title : titleClean;
    const depthPrefix = depth.toUpperCase();

    // Generate 4 progressive teaching steps with blackboard drawing and speech
    const steps: GuruTeachingStep[] = [
      {
        stepNumber: 1,
        stepTag: `Step 1 of 4 • Classroom Discovery (Page ${pageNumber})`,
        stepTitle: `🌟 ${topicName}`,
        guruSpeech: `Hello students! Today we open Page ${pageNumber} to explore ${topicName}. Look at the illustrations on your textbook page. ${toc.keyIdea}`,
        guruExplanation: `Grounded in ${titleClean} (Page ${pageNumber}): ${toc.keyIdea} This provides the foundation for understanding ${topicName}.`,
        chalkboardWords: toc.concepts ? toc.concepts.slice(0, 3) : [topicName, 'Discovery', 'Page ' + pageNumber],
        chalkboardNotes: [
          `• Topic: ${topicName}`,
          `• Core Concept: ${toc.keyIdea.slice(0, 75)}...`,
          `• Source: Page ${pageNumber} of textbook`,
        ],
        socraticPrompt: `Look at Page ${pageNumber}: What is the first thing you notice about ${topicName}?`,
        drawingScene: {
          title: `${topicName.toUpperCase()} — BOARD DISCOVERY`,
          subtitle: toc.boardSubtitle || toc.keyIdea,
          badge: 'STEP 1: INTRODUCTION',
          flowArrows: true,
          elements: toc.flowSteps
            ? toc.flowSteps.slice(0, 4).map((f: any, idx: number) => ({
                icon: f.icon || '⭐',
                label: f.label || 'STAGE',
                subtext: f.description || '',
                highlight: idx === 0,
              }))
            : [
                { icon: '📖', label: topicName, subtext: `Page ${pageNumber} Source`, highlight: true },
                { icon: '💡', label: 'Key Idea', subtext: 'Core Principle', highlight: false },
              ],
        },
        evidenceCitation: citation,
      },
      {
        stepNumber: 2,
        stepTag: `Step 2 of 4 • Concept Breakdown (Page ${pageNumber})`,
        stepTitle: `🔍 ${topicName} Mechanism`,
        guruSpeech: `Let us write the key mechanism on our blackboard! Notice how ${toc.subBoxFormula || toc.keyIdea}`,
        guruExplanation: `On Page ${pageNumber}, we see how different parts connect together: ${toc.subBoxTitle || 'System Relationship'} — ${toc.subBoxFormula || toc.keyIdea}`,
        chalkboardWords: toc.concepts ? toc.concepts.slice(2, 5) : ['Mechanism', 'Structure', 'Function'],
        chalkboardNotes: [
          `• Principle: ${toc.subBoxTitle || 'Essential Connection'}`,
          `• Formula: ${toc.subBoxFormula || 'Input ➔ Process ➔ Outcome'}`,
        ],
        socraticPrompt: `Why do you think ${topicName} works in this specific step-by-step way?`,
        drawingScene: {
          title: `HOW ${topicName.toUpperCase()} OPERATES`,
          subtitle: toc.subBoxTitle || 'Step-by-step conceptual workflow',
          badge: 'STEP 2: HOW IT WORKS',
          flowArrows: true,
          elements: toc.flowSteps
            ? toc.flowSteps.slice(0, 4).map((f: any, idx: number) => ({
                icon: f.icon || '⚙️',
                label: f.label || 'COMPONENT',
                subtext: f.description || '',
                highlight: idx === 1,
              }))
            : [
                { icon: '🔍', label: 'Analysis', subtext: 'Components', highlight: true },
                { icon: '⭐', label: 'Mechanism', subtext: 'Active Link', highlight: false },
              ],
        },
        evidenceCitation: citation,
      },
      {
        stepNumber: 3,
        stepTag: `Step 3 of 4 • Real-World Observation (Page ${pageNumber})`,
        stepTitle: `🌍 Real-World Connections: ${topicName}`,
        guruSpeech: `Where do we see this in our daily lives? When you look outside your home, you experience this exact textbook principle in action!`,
        guruExplanation: `Real-world application for ${topicName}: Every living and community system relies on these verified principles to maintain balance and health.`,
        chalkboardWords: ['Observation', 'Daily Life', 'Connection', 'Evidence'],
        chalkboardNotes: [
          `• Real World: Seen in our homes, schools, and nature`,
          `• Importance: Keeps our environment and bodies thriving`,
        ],
        socraticPrompt: `Can you give an example of ${topicName} from your own home or neighbourhood?`,
        drawingScene: {
          title: `REAL-WORLD APPLICATION OF ${topicName.toUpperCase()}`,
          subtitle: 'Connecting classroom theory to everyday life',
          badge: 'STEP 3: APPLICATION',
          elements: toc.flowSteps
            ? toc.flowSteps.slice(0, 4).map((f: any, idx: number) => ({
                icon: f.icon || '🌍',
                label: f.label || 'PRACTICE',
                subtext: f.description || '',
                highlight: idx === 2,
              }))
            : [
                { icon: '🏠', label: 'Home', subtext: 'Daily Life', highlight: false },
                { icon: '🌍', label: 'Environment', subtext: 'Surroundings', highlight: true },
              ],
        },
        evidenceCitation: citation,
      },
      {
        stepNumber: 4,
        stepTag: `Step 4 of 4 • Classroom Activity & Socratic Inquiry`,
        stepTitle: `🎨 Hands-On Activity: ${topicName}`,
        guruSpeech: `Now take out your notebooks! Let us sketch this concept and answer the classroom question grounded in Page ${pageNumber}.`,
        guruExplanation: `Active learning synthesis: Draw, label, and explain the key components of ${topicName} in your study notes.`,
        chalkboardWords: ['Activity', 'Notebook', 'Mastery', 'Retention'],
        chalkboardNotes: [
          `• Task: Draw the stages of ${topicName} in your notebook`,
          `• Key Takeaway: ${toc.keyIdea.slice(0, 60)}...`,
        ],
        socraticPrompt: `If you had to explain ${topicName} to a younger student in one sentence, what would you say?`,
        drawingScene: {
          title: `CLASSROOM NOTEBOOK ACTIVITY`,
          subtitle: 'Active student drawing and concept mastery challenge',
          badge: 'STEP 4: SYNTHESIS',
          elements: [
            { icon: '📝', label: 'NOTEBOOK', subtext: 'Sketch the concept', highlight: true },
            { icon: '🎨', label: 'DRAWING', subtext: 'Label each part', highlight: true },
            { icon: '🏆', label: 'MASTERY', subtext: 'Explain to friends', highlight: true },
          ],
        },
        evidenceCitation: citation,
      },
    ];

    const depthIcons: Record<TeachingDepth, string> = {
      basis: '🌱',
      developing: '🔍',
      proficient: '⚡',
      advanced: '🔬',
      deep: '🌌',
    };

    return {
      physicalPage: pageNumber,
      chapterNumber: toc.chapterNumber,
      chapterTitle: toc.title,
      unitName: toc.unitName,
      topicName,
      depth,
      boardMainTitle: `${depthIcons[depth]} ${depthPrefix}: ${toc.boardTitle || topicName.toUpperCase()}`,
      boardSubtitle: toc.boardSubtitle || toc.keyIdea,
      classroomFormula: {
        title: toc.subBoxTitle || 'CLASSROOM FORMULA',
        formula: toc.subBoxFormula || `${topicName} Fundamental Principle`,
      },
      keyTakeaway: toc.keyIdea,
      steps,
      persistentGuruNotes: [
        `Topic: ${topicName} (Page ${pageNumber})`,
        `Core Idea: ${toc.keyIdea}`,
        `Key Formula: ${toc.subBoxFormula || 'Input ➔ Process ➔ Output'}`,
      ],
      quickChalkboardSummary: {
        whatWeLearned: [
          `Understood ${topicName} on Page ${pageNumber}`,
          `Identified essential components and functions`,
          `Connected classroom theory to real-world observations`,
        ],
        rememberRule: toc.keyIdea,
      },
    };
  }
}
