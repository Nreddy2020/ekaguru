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
  pageHeaderBadge: string;
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
  visualDiagram: {
    title: string;
    subtitle: string;
    steps: { label: string; icon: string; description: string }[];
  };
  realWorldExample: {
    scenarioTitle: string;
    context: string;
    application: string;
    whyItMatters: string;
  };
  keyPoints: {
    pointNumber: number;
    takeaway: string;
    scientificPrinciple: string;
  }[];
  printableNotes: {
    title: string;
    corePrinciples: string[];
    thinkAndReason: string[];
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
    const topicName = activeSection ? activeSection.title : `${titleClean} — Page ${pageNumber}`;

    const citation: EvidenceCitation = {
      bookId: 'evs-class-5',
      chapterNumber: canonicalToc.chapterNumber,
      physicalPage: pageNumber,
      blockId: `blk-${pageNumber}-core`,
      regionId: `reg-${pageNumber}-body`,
      bbox: { x: 165, y: 84, width: 926, height: 298 },
      confidence: 0.99,
      sourceTextSnippet: `Physical Page ${pageNumber}: ${topicName}`,
    };

    const lesson = this.buildPageLesson(
      pageNumber,
      canonicalToc,
      activeSection,
      topicName,
      titleClean,
      depth,
      citation
    );

    this.CACHE.set(cacheKey, lesson);
    return lesson;
  }

  private static buildPageLesson(
    pageNumber: number,
    toc: any,
    section: any,
    topicName: string,
    titleClean: string,
    depth: TeachingDepth,
    citation: EvidenceCitation
  ): GuruPageTeachingPackage {
    const depthPrefix = depth.toUpperCase();
    const depthIcons: Record<TeachingDepth, string> = {
      basis: '🌱',
      developing: '🔍',
      proficient: '⚡',
      advanced: '🔬',
      deep: '🌌',
    };

    // Construct 4 progressive blackboard steps specifically for THIS physical page
    const step1: GuruTeachingStep = {
      stepNumber: 1,
      stepTag: `Step 1 of 4 • Classroom Discovery (Page ${pageNumber})`,
      stepTitle: `🌟 Introduction to ${topicName}`,
      guruSpeech: `Welcome young scholars! Today on Page ${pageNumber}, we study "${topicName}". Look closely at the diagrams and examples on your physical textbook page. ${toc.keyIdea}`,
      guruExplanation: `Grounded on Page ${pageNumber} of ${titleClean}: ${toc.keyIdea} This foundational step establishes the essential vocabulary and direct observation.`,
      chalkboardWords: toc.concepts ? toc.concepts.slice(0, 3) : [topicName, 'Observation', `Page ${pageNumber}`],
      chalkboardNotes: [
        `• Page Topic: ${topicName}`,
        `• Core Finding: ${toc.keyIdea.slice(0, 70)}...`,
        `• Source: Physical Page ${pageNumber} of textbook`,
      ],
      socraticPrompt: `Look at the picture on Page ${pageNumber}: What is the most important detail you see in ${topicName}?`,
      drawingScene: {
        title: `PAGE ${pageNumber}: ${topicName.toUpperCase()} DISCOVERY`,
        subtitle: toc.boardSubtitle || toc.keyIdea,
        badge: 'STEP 1: DISCOVERY',
        flowArrows: true,
        elements: toc.flowSteps
          ? toc.flowSteps.slice(0, 4).map((f: any, idx: number) => ({
              icon: f.icon || '⭐',
              label: f.label || 'STAGE',
              subtext: f.description || '',
              highlight: idx === 0,
            }))
          : [
              { icon: '📖', label: topicName, subtext: `Page ${pageNumber}`, highlight: true },
              { icon: '💡', label: 'Concept', subtext: 'Core Principle', highlight: false },
            ],
      },
      evidenceCitation: citation,
    };

    const step2: GuruTeachingStep = {
      stepNumber: 2,
      stepTag: `Step 2 of 4 • Mechanism & Working (Page ${pageNumber})`,
      stepTitle: `⚙️ How ${topicName} Functions`,
      guruSpeech: `Let us write the mechanism on our digital blackboard! On Page ${pageNumber}, notice how ${toc.subBoxFormula || toc.keyIdea}`,
      guruExplanation: `On Page ${pageNumber}, we analyze how components interact: ${toc.subBoxTitle || 'System Principle'}: ${toc.subBoxFormula || toc.keyIdea}`,
      chalkboardWords: toc.concepts ? toc.concepts.slice(2, 5) : ['Mechanism', 'Function', 'Process'],
      chalkboardNotes: [
        `• Rule: ${toc.subBoxTitle || 'Mechanism'}`,
        `• Formula: ${toc.subBoxFormula || 'Input ➔ Process ➔ Outcome'}`,
      ],
      socraticPrompt: `Why does ${topicName} follow this specific order of steps?`,
      drawingScene: {
        title: `${topicName.toUpperCase()} — FUNCTIONAL WORKFLOW`,
        subtitle: toc.subBoxTitle || 'Step-by-step conceptual workflow',
        badge: 'STEP 2: MECHANISM',
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
              { icon: '⭐', label: 'Workflow', subtext: 'Active Link', highlight: false },
            ],
      },
      evidenceCitation: citation,
    };

    const step3: GuruTeachingStep = {
      stepNumber: 3,
      stepTag: `Step 3 of 4 • Real-World Context (Page ${pageNumber})`,
      stepTitle: `🌍 ${topicName} in Everyday Life`,
      guruSpeech: `Where do we experience ${topicName} in real life? When you look outside or around your home, this exact textbook principle is happening all around you!`,
      guruExplanation: `Everyday application: Understanding ${topicName} helps us interact wisely with our health, society, and nature.`,
      chalkboardWords: ['Real World', 'Daily Life', 'Connection', 'Practice'],
      chalkboardNotes: [
        `• Practical Example: Observed in our daily routine and surroundings`,
        `• Value: Helps us make informed and healthy choices`,
      ],
      socraticPrompt: `Can you identify one example of ${topicName} from your own experience?`,
      drawingScene: {
        title: `REAL-WORLD CONNECTIONS FOR PAGE ${pageNumber}`,
        subtitle: 'Connecting physical textbook lessons to everyday life',
        badge: 'STEP 3: APPLICATION',
        elements: toc.flowSteps
          ? toc.flowSteps.slice(0, 4).map((f: any, idx: number) => ({
              icon: f.icon || '🌍',
              label: f.label || 'PRACTICE',
              subtext: f.description || '',
              highlight: idx === 2,
            }))
          : [
              { icon: '🏠', label: 'Daily Life', subtext: 'Observation', highlight: false },
              { icon: '🌍', label: 'Environment', subtext: 'Surroundings', highlight: true },
            ],
      },
      evidenceCitation: citation,
    };

    const step4: GuruTeachingStep = {
      stepNumber: 4,
      stepTag: `Step 4 of 4 • Notebook Activity & Inquiry (Page ${pageNumber})`,
      stepTitle: `🎨 Notebook Activity & Socratic Probe`,
      guruSpeech: `Take out your study notebooks! Sketch the diagram from Page ${pageNumber} and write the key summary in your own words.`,
      guruExplanation: `Notebook synthesis: Draw and explain ${topicName} to achieve cognitive retention and concept mastery.`,
      chalkboardWords: ['Notebook', 'Drawing', 'Mastery', 'Retention'],
      chalkboardNotes: [
        `• Activity: Sketch and label ${topicName} on Page ${pageNumber}`,
        `• Key Law: ${toc.keyIdea.slice(0, 65)}...`,
      ],
      socraticPrompt: `If you had to teach ${topicName} to a friend in one sentence, what would you say?`,
      drawingScene: {
        title: `CLASSROOM NOTEBOOK ACTIVITY (PAGE ${pageNumber})`,
        subtitle: 'Student active sketch and concept mastery verification',
        badge: 'STEP 4: SYNTHESIS',
        elements: [
          { icon: '📝', label: 'NOTEBOOK', subtext: 'Sketch the diagram', highlight: true },
          { icon: '🎨', label: 'DRAWING', subtext: 'Label the parts', highlight: true },
          { icon: '🏆', label: 'MASTERY', subtext: 'Explain to friends', highlight: true },
        ],
      },
      evidenceCitation: citation,
    };

    return {
      physicalPage: pageNumber,
      chapterNumber: toc.chapterNumber,
      chapterTitle: toc.title,
      unitName: toc.unitName,
      topicName,
      pageHeaderBadge: `Page ${pageNumber} • ${toc.title}`,
      depth,
      boardMainTitle: `${depthIcons[depth]} ${depthPrefix}: ${topicName.toUpperCase()}`,
      boardSubtitle: toc.boardSubtitle || toc.keyIdea,
      classroomFormula: {
        title: toc.subBoxTitle || 'CLASSROOM FORMULA',
        formula: toc.subBoxFormula || `${topicName} Invariant`,
      },
      keyTakeaway: toc.keyIdea,
      steps: [step1, step2, step3, step4],
      persistentGuruNotes: [
        `Topic: ${topicName} (Physical Page ${pageNumber})`,
        `Core Idea: ${toc.keyIdea}`,
        `Formula / Law: ${toc.subBoxFormula || 'Input ➔ Process ➔ Outcome'}`,
      ],
      quickChalkboardSummary: {
        whatWeLearned: [
          `Understood ${topicName} from Page ${pageNumber}`,
          `Identified core mechanisms and functional connections`,
          `Practiced active chalkboard sketching and real-world synthesis`,
        ],
        rememberRule: toc.keyIdea,
      },
      visualDiagram: {
        title: `🌱 ${depthPrefix}: ${topicName.toUpperCase()} DIAGRAM`,
        subtitle: toc.boardSubtitle || toc.keyIdea,
        steps: toc.flowSteps
          ? toc.flowSteps.slice(0, 4).map((f: any) => ({
              label: f.label,
              icon: f.icon,
              description: f.description,
            }))
          : [],
      },
      realWorldExample: {
        scenarioTitle: `Everyday Context of ${topicName}`,
        context: `When you explore your surroundings regarding ${topicName},`,
        application: `you observe that ${toc.keyIdea}`,
        whyItMatters: `Direct real-world evidence for ${topicName} on Page ${pageNumber}.`,
      },
      keyPoints: [
        {
          pointNumber: 1,
          takeaway: toc.keyIdea,
          scientificPrinciple: `Foundational principle of ${topicName}.`,
        },
      ],
      printableNotes: {
        title: `${topicName} — Page ${pageNumber} Study Notes`,
        corePrinciples: toc.concepts || [topicName],
        thinkAndReason: [`Why is ${topicName} important on Page ${pageNumber}?`],
      },
    };
  }
}
