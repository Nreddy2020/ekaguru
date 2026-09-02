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

    // Build depth-specific pedagogical models
    let step1: GuruTeachingStep;
    let step2: GuruTeachingStep;
    let step3: GuruTeachingStep;
    let step4: GuruTeachingStep;
    let persistentNotes: string[];
    let rememberRule: string;

    if (depth === 'basis') {
      step1 = {
        stepNumber: 1,
        stepTag: `Step 1 of 4 • Classroom Discovery (Page ${pageNumber})`,
        stepTitle: `🌟 Discovering ${topicName}`,
        guruSpeech: `Hello young scholars! Today on Page ${pageNumber}, we explore "${topicName}". Look at the illustrations in your physical textbook. ${toc.keyIdea}`,
        guruExplanation: `Grounded on Page ${pageNumber} of ${titleClean}: ${toc.keyIdea} This foundational step establishes basic vocabulary and observation.`,
        chalkboardWords: toc.concepts ? toc.concepts.slice(0, 3) : [topicName, 'Discovery', `Page ${pageNumber}`],
        chalkboardNotes: [
          `• Topic: ${topicName}`,
          `• Core Definition: ${toc.keyIdea.slice(0, 65)}...`,
          `• Source: Page ${pageNumber} of textbook`,
        ],
        socraticPrompt: `Look at the picture on Page ${pageNumber}: What is the first thing you recognize in ${topicName}?`,
        drawingScene: {
          title: `PAGE ${pageNumber}: ${topicName.toUpperCase()} DISCOVERY`,
          subtitle: toc.boardSubtitle || toc.keyIdea,
          badge: 'STEP 1: DISCOVERY',
          flowArrows: true,
          elements: toc.flowSteps
            ? toc.flowSteps.slice(0, 4).map((f: any, idx: number) => ({
                icon: f.icon || '⭐',
                label: f.label || 'ITEM',
                subtext: f.description || '',
                highlight: idx === 0,
              }))
            : [{ icon: '📖', label: topicName, subtext: `Page ${pageNumber}`, highlight: true }],
        },
        evidenceCitation: citation,
      };

      step2 = {
        stepNumber: 2,
        stepTag: `Step 2 of 4 • Concept Breakdown (Page ${pageNumber})`,
        stepTitle: `🔍 Important Components of ${topicName}`,
        guruSpeech: `Let us write the main components on our blackboard! On Page ${pageNumber}, notice how ${toc.subBoxFormula || toc.keyIdea}`,
        guruExplanation: `On Page ${pageNumber}, we see how different parts work: ${toc.subBoxTitle || 'Key Relationship'}: ${toc.subBoxFormula || toc.keyIdea}`,
        chalkboardWords: toc.concepts ? toc.concepts.slice(1, 4) : ['Components', 'Function', 'Order'],
        chalkboardNotes: [
          `• Components: ${toc.concepts ? toc.concepts.slice(0, 3).join(', ') : topicName}`,
          `• Working Rule: ${toc.subBoxFormula || 'Input ➔ Process ➔ Output'}`,
        ],
        socraticPrompt: `Why are these specific parts important for ${topicName}?`,
        drawingScene: {
          title: `${topicName.toUpperCase()} — COMPONENT BREAKDOWN`,
          subtitle: toc.subBoxTitle || 'Step-by-step visual components',
          badge: 'STEP 2: COMPONENTS',
          flowArrows: true,
          elements: toc.flowSteps
            ? toc.flowSteps.slice(0, 4).map((f: any, idx: number) => ({
                icon: f.icon || '⚙️',
                label: f.label || 'PART',
                subtext: f.description || '',
                highlight: idx === 1,
              }))
            : [{ icon: '🔍', label: 'Parts', subtext: 'Components', highlight: true }],
        },
        evidenceCitation: citation,
      };

      step3 = {
        stepNumber: 3,
        stepTag: `Step 3 of 4 • Daily Life Connection (Page ${pageNumber})`,
        stepTitle: `🌍 Seeing ${topicName} Around Us`,
        guruSpeech: `Where do we see this in our daily lives? When you step outside, you experience this exact lesson in your own surroundings!`,
        guruExplanation: `Everyday connection: Understanding ${topicName} helps us recognize and value the world around us.`,
        chalkboardWords: ['Daily Life', 'Observation', 'Surroundings', 'Practice'],
        chalkboardNotes: [
          `• Daily Example: Seen in our daily routine and surroundings`,
          `• Importance: Keeps our community and body healthy`,
        ],
        socraticPrompt: `Can you give an example of ${topicName} from your own neighbourhood or home?`,
        drawingScene: {
          title: `DAILY LIFE CONNECTIONS (PAGE ${pageNumber})`,
          subtitle: 'Connecting physical textbook lessons to everyday life',
          badge: 'STEP 3: APPLICATION',
          elements: toc.flowSteps
            ? toc.flowSteps.slice(0, 4).map((f: any, idx: number) => ({
                icon: f.icon || '🌍',
                label: f.label || 'DAILY',
                subtext: f.description || '',
                highlight: idx === 2,
              }))
            : [{ icon: '🏠', label: 'Home', subtext: 'Observation', highlight: true }],
        },
        evidenceCitation: citation,
      };

      step4 = {
        stepNumber: 4,
        stepTag: `Step 4 of 4 • Notebook Activity (Page ${pageNumber})`,
        stepTitle: `🎨 Draw & Write in Notebook`,
        guruSpeech: `Take out your study notebooks! Draw the diagram from Page ${pageNumber} and label the parts neatly.`,
        guruExplanation: `Hands-on synthesis: Sketching and labeling ${topicName} cements conceptual retention.`,
        chalkboardWords: ['Notebook', 'Drawing', 'Label', 'Mastery'],
        chalkboardNotes: [
          `• Task: Draw ${topicName} in your notebook`,
          `• Summary: ${toc.keyIdea.slice(0, 60)}...`,
        ],
        socraticPrompt: `Can you summarize what we learned about ${topicName} in your own words?`,
        drawingScene: {
          title: `CLASSROOM NOTEBOOK CHALLENGE`,
          subtitle: 'Student active sketch and concept mastery verification',
          badge: 'STEP 4: SYNTHESIS',
          elements: [
            { icon: '📝', label: 'NOTEBOOK', subtext: 'Draw diagram', highlight: true },
            { icon: '🎨', label: 'LABEL', subtext: 'Label each part', highlight: true },
            { icon: '⭐', label: 'MASTERY', subtext: 'Explain to friends', highlight: true },
          ],
        },
        evidenceCitation: citation,
      };

      persistentNotes = [
        `Topic: ${topicName} (Page ${pageNumber})`,
        `Core Idea: ${toc.keyIdea}`,
        `Rule: ${toc.subBoxFormula || 'Input ➔ Output'}`,
      ];
      rememberRule = toc.keyIdea;
    } else if (depth === 'developing') {
      step1 = {
        stepNumber: 1,
        stepTag: `Step 1 of 4 • Relationship Mapping (Page ${pageNumber})`,
        stepTitle: `🔗 Conceptual Linkages: ${topicName}`,
        guruSpeech: `Now at Developing level, let us understand how ${topicName} links multiple systems together. Notice on Page ${pageNumber} how each element depends on the next.`,
        guruExplanation: `Developing analysis for Page ${pageNumber}: ${toc.keyIdea} We explore cause-and-effect mechanisms connecting these concepts.`,
        chalkboardWords: ['Dependency', 'Linkage', 'Mechanism', 'Flow'],
        chalkboardNotes: [
          `• Level: DEVELOPING (System Connections)`,
          `• Primary Linkage: ${toc.subBoxTitle || 'Functional Interdependence'}`,
          `• Flow: ${toc.subBoxFormula || 'A leads to B'}`,
        ],
        socraticPrompt: `How does the first component on Page ${pageNumber} enable the second component to work?`,
        drawingScene: {
          title: `${topicName.toUpperCase()} — SYSTEM CONNECTIONS`,
          subtitle: 'Tracing operational workflows and dependencies',
          badge: 'DEVELOPING: CONNECTIONS',
          flowArrows: true,
          elements: toc.flowSteps
            ? toc.flowSteps.slice(0, 4).map((f: any, idx: number) => ({
                icon: f.icon || '⚙️',
                label: f.label || 'NODE',
                subtext: f.description || '',
                highlight: true,
              }))
            : [{ icon: '🔗', label: 'System', subtext: 'Interdependence', highlight: true }],
        },
        evidenceCitation: citation,
      };

      step2 = {
        stepNumber: 2,
        stepTag: `Step 2 of 4 • Cause & Effect Flow (Page ${pageNumber})`,
        stepTitle: `⚡ Cause & Effect Dynamics`,
        guruSpeech: `What happens when one part changes? On Page ${pageNumber}, the formula shows us: ${toc.subBoxFormula || toc.keyIdea}`,
        guruExplanation: `Dynamic process analysis: Changes in inputs produce direct consequences in the output.`,
        chalkboardWords: ['Cause', 'Effect', 'Equilibrium', 'Process'],
        chalkboardNotes: [
          `• Cause: Environmental & input stimuli`,
          `• Effect: Balanced outcome in ${topicName}`,
        ],
        socraticPrompt: `What would happen to ${topicName} if one of the key inputs was removed?`,
        drawingScene: {
          title: `CAUSE & EFFECT PROCESS CHAIN`,
          subtitle: toc.subBoxFormula || 'Input ➔ Reaction ➔ Result',
          badge: 'DEVELOPING: PROCESS',
          flowArrows: true,
          elements: [
            { icon: '📥', label: 'INPUT', subtext: 'Initial condition', highlight: false },
            { icon: '⚙️', label: 'PROCESS', subtext: 'Transformation', highlight: true },
            { icon: '📤', label: 'OUTCOME', subtext: 'Functional result', highlight: false },
          ],
        },
        evidenceCitation: citation,
      };

      step3 = {
        stepNumber: 3,
        stepTag: `Step 3 of 4 • Comparative Reasoning (Page ${pageNumber})`,
        stepTitle: `📊 Comparing Functions in ${topicName}`,
        guruSpeech: `Let us compare the different roles described on Page ${pageNumber}. Notice how specialized functions work together seamlessly.`,
        guruExplanation: `Comparative analysis: Identifying similarities and differences in how components function.`,
        chalkboardWords: ['Comparison', 'Specialization', 'Cooperation'],
        chalkboardNotes: [
          `• Comparison: Distinct roles working toward common goal`,
          `• Evidence: Grounded in Page ${pageNumber} textbook tables`,
        ],
        socraticPrompt: `How do the different roles on Page ${pageNumber} support each other?`,
        drawingScene: {
          title: `FUNCTIONAL COMPARISON MATRIX`,
          subtitle: 'Comparing specialized roles on this page',
          badge: 'DEVELOPING: COMPARISON',
          elements: [
            { icon: '1️⃣', label: 'ROLE A', subtext: 'Primary function', highlight: true },
            { icon: '2️⃣', label: 'ROLE B', subtext: 'Support function', highlight: true },
            { icon: '🤝', label: 'SYNERGY', subtext: 'Combined value', highlight: true },
          ],
        },
        evidenceCitation: citation,
      };

      step4 = {
        stepNumber: 4,
        stepTag: `Step 4 of 4 • Guided Socratic Synthesis`,
        stepTitle: `💡 Guided Socratic Challenge`,
        guruSpeech: `Explain the relationship between the main components of ${topicName} to demonstrate developing mastery.`,
        guruExplanation: `Synthesis challenge: Constructing multi-step conceptual explanations.`,
        chalkboardWords: ['Synthesis', 'Logic', 'Mastery'],
        chalkboardNotes: [
          `• Core Connection: ${toc.subBoxFormula || 'System interaction'}`,
        ],
        socraticPrompt: `How does Page ${pageNumber} prove that these components must work together?`,
        drawingScene: {
          title: `DEVELOPING SYNTHESIS MAP`,
          subtitle: 'Multi-node conceptual integration',
          badge: 'DEVELOPING: SYNTHESIS',
          elements: [
            { icon: '🧠', label: 'REASONING', subtext: 'Connect the nodes', highlight: true },
            { icon: '📈', label: 'PROGRESSION', subtext: 'Mastery growth', highlight: true },
          ],
        },
        evidenceCitation: citation,
      };

      persistentNotes = [
        `Topic: ${topicName} (DEVELOPING)`,
        `Interdependence: ${toc.subBoxTitle || 'Functional Link'}`,
        `Process Law: ${toc.subBoxFormula || 'Input ➔ Reaction ➔ Output'}`,
      ];
      rememberRule = `Interdependence Principle: In ${topicName}, all components work together in balance.`;
    } else if (depth === 'proficient') {
      step1 = {
        stepNumber: 1,
        stepTag: `Step 1 of 4 • Real-World Problem Solving (Page ${pageNumber})`,
        stepTitle: `⚡ Applying ${topicName} in Practice`,
        guruSpeech: `At Proficient level, we apply our knowledge of ${topicName} to solve real-world scenarios. How would you handle a situation described on Page ${pageNumber}?`,
        guruExplanation: `Applied problem solving: Translating textbook knowledge into active decision making.`,
        chalkboardWords: ['Application', 'Problem Solving', 'Decision'],
        chalkboardNotes: [
          `• Level: PROFICIENT (Practical Application)`,
          `• Action: Using Page ${pageNumber} knowledge in daily scenarios`,
        ],
        socraticPrompt: `If you encountered a problem related to ${topicName}, what exact steps would you take based on Page ${pageNumber}?`,
        drawingScene: {
          title: `PRACTICAL PROBLEM-SOLVING WORKFLOW`,
          subtitle: 'Applying textbook concepts to real situations',
          badge: 'PROFICIENT: ACTION',
          elements: [
            { icon: '❓', label: 'SCENARIO', subtext: 'Situation arises', highlight: false },
            { icon: '💡', label: 'EVALUATION', subtext: 'Apply page principle', highlight: true },
            { icon: '✅', label: 'RESOLUTION', subtext: 'Correct action', highlight: true },
          ],
        },
        evidenceCitation: citation,
      };

      step2 = step1;
      step3 = step1;
      step4 = step1;
      persistentNotes = [
        `Topic: ${topicName} (PROFICIENT)`,
        `Application: Real-world problem solving & decision making`,
        `Standard: Demonstrating operational competency`,
      ];
      rememberRule = `Application Invariant: Knowledge of ${topicName} enables responsible real-world decision making.`;
    } else if (depth === 'advanced') {
      step1 = {
        stepNumber: 1,
        stepTag: `Step 1 of 4 • Critical Analysis & Trade-Offs (Page ${pageNumber})`,
        stepTitle: `🔬 Critical Analysis: ${topicName}`,
        guruSpeech: `At Advanced level, we examine the deeper reasoning behind ${topicName}. Why are specific structures, institutions, and laws designed in this manner?`,
        guruExplanation: `Critical reasoning: Investigating design trade-offs, constraints, and multi-variable optimization.`,
        chalkboardWords: ['Analysis', 'Trade-offs', 'Constraints', 'Optimization'],
        chalkboardNotes: [
          `• Level: ADVANCED (Critical Analysis)`,
          `• Focus: Why systems are designed this way`,
        ],
        socraticPrompt: `Why is it essential to balance competing needs when managing ${topicName}?`,
        drawingScene: {
          title: `ADVANCED SYSTEM ANALYSIS`,
          subtitle: 'Examining trade-offs and structural constraints',
          badge: 'ADVANCED: REASONING',
          elements: [
            { icon: '⚖️', label: 'BALANCE', subtext: 'Trade-off analysis', highlight: true },
            { icon: '📐', label: 'DESIGN', subtext: 'Structural optimization', highlight: true },
          ],
        },
        evidenceCitation: citation,
      };

      step2 = step1;
      step3 = step1;
      step4 = step1;
      persistentNotes = [
        `Topic: ${topicName} (ADVANCED)`,
        `Analysis: Structural constraints & system trade-offs`,
        `Evidence: High-confidence BBox reasoning`,
      ];
      rememberRule = `Optimization Principle: ${topicName} balances structural constraints for maximum resilience.`;
    } else {
      // deep
      step1 = {
        stepNumber: 1,
        stepTag: `Step 1 of 4 • First-Principles & System Dynamics (Page ${pageNumber})`,
        stepTitle: `🌌 Deep Dive: First Principles of ${topicName}`,
        guruSpeech: `At Deep Dive level, we explore the universal principles governing ${topicName}. How does this concept connect to global ecosystems and fundamental laws?`,
        guruExplanation: `First-principles exploration: Connecting Page ${pageNumber} evidence to universal scientific and sociological laws.`,
        chalkboardWords: ['First Principles', 'System Dynamics', 'Universal Law'],
        chalkboardNotes: [
          `• Level: DEEP DIVE (Universal First Principles)`,
          `• Universal Law: Equilibrium & long-term sustainability`,
        ],
        socraticPrompt: `How does the fundamental principle on Page ${pageNumber} apply to human civilization and natural ecosystems globally?`,
        drawingScene: {
          title: `FIRST-PRINCIPLES SYSTEM DYNAMICS`,
          subtitle: 'Connecting local page evidence to universal laws',
          badge: 'DEEP: UNIVERSAL DYNAMICS',
          elements: [
            { icon: '🌌', label: 'UNIVERSAL LAW', subtext: 'First principles', highlight: true },
            { icon: '🌐', label: 'GLOBAL SYSTEM', subtext: 'Ecosystem integration', highlight: true },
          ],
        },
        evidenceCitation: citation,
      };

      step2 = step1;
      step3 = step1;
      step4 = step1;
      persistentNotes = [
        `Topic: ${topicName} (DEEP DIVE)`,
        `Universal Law: Conservation & systemic equilibrium`,
        `Grounded: Physical Page ${pageNumber} source`,
      ];
      rememberRule = `Universal Dynamics Law: Local mechanisms in ${topicName} reflect universal conservation and systemic equilibrium.`;
    }

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
      persistentGuruNotes: persistentNotes,
      quickChalkboardSummary: {
        whatWeLearned: [
          `Understood ${topicName} from Page ${pageNumber}`,
          `Explored ${depthPrefix} depth mechanisms`,
          `Practiced active chalkboard sketching and evidence verification`,
        ],
        rememberRule,
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
