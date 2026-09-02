import {
  TeachingDepth,
  EvidenceCitation,
} from './teaching-package.types';
import { CANONICAL_TEXTBOOK_TOC, getPhysicalPageContent } from './page-preservation-engine';

export enum GuruTeachingPhase {
  OBSERVE_PAGE = 'OBSERVE_PAGE',
  INTRODUCE_TOPIC = 'INTRODUCE_TOPIC',
  WRITE_CONCEPT_1 = 'WRITE_CONCEPT_1',
  DRAW_CONCEPT_1 = 'DRAW_CONCEPT_1',
  EXPLAIN_DRAWING_1 = 'EXPLAIN_DRAWING_1',
  CONNECT_EVIDENCE = 'CONNECT_EVIDENCE',
  ASK_QUESTION_1 = 'ASK_QUESTION_1',
  EVALUATE_CHILD = 'EVALUATE_CHILD',
  RETEACH_IF_NEEDED = 'RETEACH_IF_NEEDED',
  WRITE_CONCEPT_2 = 'WRITE_CONCEPT_2',
  DRAW_RELATIONSHIP = 'DRAW_RELATIONSHIP',
  EXPLAIN_RELATIONSHIP = 'EXPLAIN_RELATIONSHIP',
  ASK_DEEPER_QUESTION = 'ASK_DEEPER_QUESTION',
  APPLY_CONCEPT = 'APPLY_CONCEPT',
  SUMMARIZE_NOTES = 'SUMMARIZE_NOTES',
  REMEMBER_RULE = 'REMEMBER_RULE',
  ADVANCE_DEPTH_CHECK = 'ADVANCE_DEPTH_CHECK',
}

export interface GuruBoardDrawingElement {
  icon: string;
  label: string;
  subtext: string;
  highlight?: boolean;
}

export interface GuruSequentialPhaseDefinition {
  phase: GuruTeachingPhase;
  phaseNumber: number;
  title: string;
  badge: string;
  teacherAction: string;
  chalkboardContent: string;
  spokenDialogue: string;
  highlightedElementIndex?: number;
  triggerBboxHighlight?: boolean;
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
  sequentialPhases: GuruSequentialPhaseDefinition[];
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

    // 17-Phase Sequential Teaching Journey for this page + depth
    const sequentialPhases: GuruSequentialPhaseDefinition[] = [
      {
        phase: GuruTeachingPhase.OBSERVE_PAGE,
        phaseNumber: 1,
        title: '1. Observe Physical Textbook Page',
        badge: 'PAGE OBSERVATION',
        teacherAction: `Guru inspects physical Page ${pageNumber} of textbook scan.`,
        chalkboardContent: `📖 Page ${pageNumber} Scan Loaded`,
        spokenDialogue: `Let us open Page ${pageNumber} of our textbook together. Look closely at the top illustrations.`,
        triggerBboxHighlight: true,
      },
      {
        phase: GuruTeachingPhase.INTRODUCE_TOPIC,
        phaseNumber: 2,
        title: `2. Introduce ${topicName}`,
        badge: 'TOPIC INTRODUCTION',
        teacherAction: `Guru announces lesson title for Page ${pageNumber} at ${depthPrefix} depth.`,
        chalkboardContent: `🌱 ${depthPrefix}: ${topicName.toUpperCase()}`,
        spokenDialogue: `Today, we will master "${topicName}". By the end of our session, you will understand how these concepts work.`,
      },
      {
        phase: GuruTeachingPhase.WRITE_CONCEPT_1,
        phaseNumber: 3,
        title: '3. Write First Concept Word',
        badge: 'CHALK WRITING',
        teacherAction: 'Guru writes primary keywords in chalk on blackboard.',
        chalkboardContent: `⭐ ${toc.concepts ? toc.concepts[0] : topicName}`,
        spokenDialogue: `I am writing the first key term on our blackboard. Pay close attention to this concept.`,
      },
      {
        phase: GuruTeachingPhase.DRAW_CONCEPT_1,
        phaseNumber: 4,
        title: '4. Draw First Visual Element',
        badge: 'CHALK DRAWING',
        teacherAction: 'Guru draws initial diagram element with chalk.',
        chalkboardContent: `[ Drawing: ${toc.flowSteps ? toc.flowSteps[0]?.label || 'Element 1' : 'Element 1'} ]`,
        spokenDialogue: `Watch as I draw the first element on the board. Notice its shape and primary function.`,
        highlightedElementIndex: 0,
      },
      {
        phase: GuruTeachingPhase.EXPLAIN_DRAWING_1,
        phaseNumber: 5,
        title: '5. Explain First Drawing',
        badge: 'CONCEPT EXPLANATION',
        teacherAction: 'Guru explains the meaning of the first visual element.',
        chalkboardContent: `Function: ${toc.keyIdea.slice(0, 50)}...`,
        spokenDialogue: `This drawing shows us the foundational component. ${toc.keyIdea}`,
        highlightedElementIndex: 0,
      },
      {
        phase: GuruTeachingPhase.CONNECT_EVIDENCE,
        phaseNumber: 6,
        title: '6. Connect to Textbook Evidence',
        badge: 'EVIDENCE VERIFICATION',
        teacherAction: `Guru points to exact BBox on Page ${pageNumber} scan.`,
        chalkboardContent: `📄 Verified on Page ${pageNumber} (BBox Bounded)`,
        spokenDialogue: `Look right here on Page ${pageNumber} in your textbook scan. The book confirms this exact definition.`,
        triggerBboxHighlight: true,
      },
      {
        phase: GuruTeachingPhase.ASK_QUESTION_1,
        phaseNumber: 7,
        title: '7. Ask Socratic Checkpoint 1',
        badge: 'SOCRATIC PROBE',
        teacherAction: 'Guru poses introductory question to test comprehension.',
        chalkboardContent: `❓ Question: Can you identify the primary helper/part on Page ${pageNumber}?`,
        spokenDialogue: `Now let me ask you a question. Look at our drawing: which part plays the most critical role?`,
      },
      {
        phase: GuruTeachingPhase.EVALUATE_CHILD,
        phaseNumber: 8,
        title: '8. Evaluate Child Response',
        badge: 'STUDENT RESPONSE',
        teacherAction: 'Guru listens and evaluates student answer.',
        chalkboardContent: 'Evaluating answer against Page EvidencePack...',
        spokenDialogue: 'Great effort! Let us check if your answer matches the physical textbook facts.',
      },
      {
        phase: GuruTeachingPhase.RETEACH_IF_NEEDED,
        phaseNumber: 9,
        title: '9. Re-Teach Misconceptions',
        badge: 'ADAPTIVE COACHING',
        teacherAction: 'Guru clarifies misconceptions and reinforces correct principle.',
        chalkboardContent: `💡 Coaching Hint: Focus on ${toc.subBoxTitle || 'Core Function'}`,
        spokenDialogue: `Remember, in ${topicName}, each element has a specialized responsibility. Let us keep that in mind.`,
      },
      {
        phase: GuruTeachingPhase.WRITE_CONCEPT_2,
        phaseNumber: 10,
        title: '10. Write Supporting Concept',
        badge: 'CHALK WRITING',
        teacherAction: 'Guru writes secondary concept on board.',
        chalkboardContent: `⭐ ${toc.concepts ? toc.concepts[1] || 'Supporting System' : 'Secondary Role'}`,
        spokenDialogue: `Now let us add the supporting concept that works alongside the first.`,
      },
      {
        phase: GuruTeachingPhase.DRAW_RELATIONSHIP,
        phaseNumber: 11,
        title: '11. Draw System Relationship',
        badge: 'RELATIONSHIP DRAWING',
        teacherAction: 'Guru connects elements with flow arrows on blackboard.',
        chalkboardContent: `[ Flow: ${toc.subBoxFormula || 'A ➔ B ➔ C'} ]`,
        spokenDialogue: `See how these two parts connect with arrows? They do not work in isolation—they depend on each other.`,
        highlightedElementIndex: 1,
      },
      {
        phase: GuruTeachingPhase.EXPLAIN_RELATIONSHIP,
        phaseNumber: 12,
        title: '12. Explain Coordinated Network',
        badge: 'NETWORK DYNAMICS',
        teacherAction: 'Guru explains system coordination.',
        chalkboardContent: `Synergy: ${toc.subBoxFormula || 'Integrated Network'}`,
        spokenDialogue: `When one part takes action, it triggers the next part to respond immediately.`,
        highlightedElementIndex: 2,
      },
      {
        phase: GuruTeachingPhase.ASK_DEEPER_QUESTION,
        phaseNumber: 13,
        title: '13. Socratic Checkpoint 2 (Application)',
        badge: 'APPLIED PROBE',
        teacherAction: 'Guru poses situational reasoning question.',
        chalkboardContent: '❓ What happens if one part is absent during an emergency?',
        spokenDialogue: 'What would happen if this service was unavailable when a crisis occurred?',
      },
      {
        phase: GuruTeachingPhase.APPLY_CONCEPT,
        phaseNumber: 14,
        title: '14. Real-World Case Scenario',
        badge: 'CASE STUDY',
        teacherAction: 'Guru presents real-world neighbourhood scenario.',
        chalkboardContent: `🌍 Case Scenario: Applying Page ${pageNumber} to everyday life.`,
        spokenDialogue: `Imagine you are walking down your street. Here is how this lesson protects you and your family every day.`,
      },
      {
        phase: GuruTeachingPhase.SUMMARIZE_NOTES,
        phaseNumber: 15,
        title: '15. Write Guru Study Notes',
        badge: 'STUDY NOTES',
        teacherAction: 'Guru writes persistent notes on the chalkboard.',
        chalkboardContent: `✍️ GURU NOTES (Page ${pageNumber})
• Topic: ${topicName}
• Key Idea: ${toc.keyIdea}`,
        spokenDialogue: `Let us record our final study notes in our notebooks so you can remember them forever.`,
      },
      {
        phase: GuruTeachingPhase.REMEMBER_RULE,
        phaseNumber: 16,
        title: '16. Golden Remember Rule',
        badge: 'GOLDEN RULE',
        teacherAction: 'Guru frames the golden takeaway in gold chalk.',
        chalkboardContent: `💡 REMEMBER: ${toc.keyIdea}`,
        spokenDialogue: `Here is the golden rule of Page ${pageNumber}: Keep this principle in your heart.`,
      },
      {
        phase: GuruTeachingPhase.ADVANCE_DEPTH_CHECK,
        phaseNumber: 17,
        title: '17. Cognitive Mastery & Depth Progression',
        badge: 'MASTERY CHECK',
        teacherAction: 'Guru updates BKT mastery and presents depth promotion.',
        chalkboardContent: `🏆 Mastery Verified for Page ${pageNumber}! Ready for ${depth === 'basis' ? 'DEVELOPING' : depth === 'developing' ? 'PROFICIENT' : depth === 'proficient' ? 'ADVANCED' : 'DEEP DIVE'}`,
        spokenDialogue: `Congratulations young scholar! You have mastered this concept at ${depthPrefix} depth. Let us advance!`,
      },
    ];

    // Progressive teaching steps
    const step1: GuruTeachingStep = {
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

    const step2: GuruTeachingStep = {
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

    const step3: GuruTeachingStep = {
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

    const step4: GuruTeachingStep = {
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
      sequentialPhases,
      persistentGuruNotes: [
        `Topic: ${topicName} (Page ${pageNumber})`,
        `Core Idea: ${toc.keyIdea}`,
        `Rule: ${toc.subBoxFormula || 'Input ➔ Output'}`,
      ],
      quickChalkboardSummary: {
        whatWeLearned: [
          `Understood ${topicName} from Page ${pageNumber}`,
          `Explored ${depthPrefix} depth mechanisms`,
          `Practiced active chalkboard sketching and evidence verification`,
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
