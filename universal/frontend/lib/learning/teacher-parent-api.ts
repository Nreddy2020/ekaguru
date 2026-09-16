import { guruFetch, guruRequest } from "./guru-api";
import { bookPath, type GuruNotesView } from "./guru-notes-api";
import type { PageEvidence } from "./page-lesson-runtime";
import type { TeachingDepth } from "./teaching-package.types";

export interface TeacherParentPrerequisite {
  concept: string;
  page?: number;
  reason: string;
  checkQuestion?: string;
}

export interface BoardPlanStep {
  stepNumber: number;
  phase: string;
  whatToWriteOrDraw: string;
  teacherSpeechGuidance: string;
}

export interface TeacherParentBoardPlan {
  title: string;
  summary: string;
  steps: BoardPlanStep[];
}

export interface TeacherParentHomeGuide {
  everydayAnalogy: string;
  conversationStarters: string[];
  parentTips: string[];
}

export interface TeacherParentActivity {
  title: string;
  materials: string[];
  instructions: string[];
  whatToNotice: string;
  safetyOrPrep?: string;
}

export interface TeacherParentQuestion {
  level: "recall" | "understanding" | "application";
  question: string;
  expectedAnswer: string;
  followUpPrompt?: string;
}

export interface TeacherParentMisconception {
  misconception: string;
  whyChildThinksThis: string;
  correctionStrategy: string;
}

export interface TeacherParentAssessmentItem {
  questionNumber: number;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface TeacherParentHomework {
  title: string;
  task: string;
  observationPrompt: string;
  parentRole: string;
}

export interface TeacherParentEdition {
  page: number;
  bookId: string;
  title: string;
  gradeLevel?: string;
  subject?: string;
  objectives: string[];
  prerequisites: TeacherParentPrerequisite[];
  boardPlan: TeacherParentBoardPlan;
  homeExplanation: TeacherParentHomeGuide;
  activity: TeacherParentActivity;
  questionsToAsk: TeacherParentQuestion[];
  misconceptions: TeacherParentMisconception[];
  assessment: TeacherParentAssessmentItem[];
  homework: TeacherParentHomework;
  createdAt?: string;
}

/**
 * Loads or generates the Teacher and Parent Edition for a page.
 */
export async function loadTeacherParentEdition(
  page: PageEvidence,
  language: string,
  depth: TeachingDepth,
  signal?: AbortSignal,
): Promise<TeacherParentEdition> {
  const path = bookPath(page.bookId) + "/pages/" + page.physicalPage + "/teacher-edition";
  const res = await guruRequest<{ edition: TeacherParentEdition; reused: boolean }>(
    path,
    { language, depth },
    signal,
  );
  return res.edition;
}

/**
 * Synchronously derives a high-fidelity Teacher and Parent Edition from existing notes,
 * providing zero-latency offline display and seamless fallback.
 */
export function deriveTeacherParentEdition(view: GuruNotesView): TeacherParentEdition {
  const n = view.notes;
  const title = n.title || `Page ${view.physicalPage}`;
  const firstTopic = n.topics?.[0];

  const objectives = n.objectives?.length > 0 ? n.objectives : [`Understand the core principles on page ${view.physicalPage}`];

  // Prerequisites
  const prerequisites: TeacherParentPrerequisite[] = [];
  for (const t of n.topics || []) {
    for (const b of t.buildsOn || []) {
      prerequisites.push({
        concept: b.heading,
        page: b.page,
        reason: b.reason,
        checkQuestion: `Ask: "What do you recall about ${b.heading}?"`,
      });
    }
  }
  if (prerequisites.length === 0) {
    prerequisites.push({
      concept: `Foundational concepts for ${title}`,
      page: Math.max(1, view.physicalPage - 1),
      reason: `Basic vocabulary and observational awareness.`,
      checkQuestion: `Ask: "What do you already know about this topic?"`,
    });
  }

  // Board Plan
  const steps: BoardPlanStep[] = (n.topics || []).slice(0, 4).map((t, i) => ({
    stepNumber: i + 1,
    phase: i === 0 ? "introduction" : "concept",
    whatToWriteOrDraw: `${t.heading}\n• ${t.bigIdea || t.heading}`,
    teacherSpeechGuidance: t.hook || `Today we are exploring ${t.heading}. Notice how it connects to our everyday lives.`,
  }));

  const boardPlan: TeacherParentBoardPlan = {
    title: `Blackboard Teaching Plan: ${title}`,
    summary: `Step-by-step chalk and talk sequence structured for sensory observation, discussion, and clear conceptual grounding.`,
    steps,
  };

  // Home Guide
  const analogy = firstTopic?.ladder?.find((l) => l.level === "analogy")?.explanation ||
    (firstTopic?.example ? `${firstTopic.example.situation}: ${firstTopic.example.explanation}` : `Connect ${title} to familiar household objects.`);

  const homeExplanation: TeacherParentHomeGuide = {
    everydayAnalogy: analogy,
    conversationStarters: [
      `"Have you noticed anything like this around our house or on your way to school?"`,
      `"If you were explaining ${firstTopic?.heading || title} to a friend, what would you say first?"`,
      `"Look at the picture on page ${view.physicalPage} together—what is the most interesting detail?"`,
    ],
    parentTips: [
      `Let your child describe what they see in their own words before correcting scientific terms.`,
      `Use concrete household objects (cups, seeds, leaves) to make ideas tangible.`,
      `Celebrate curiosity and ask 'What do you wonder about next?'`,
    ],
  };

  // Activity
  const tryNow = n.topics?.find((t) => t.tryNow)?.tryNow;
  const activity: TeacherParentActivity = {
    title: tryNow?.title || `Hands-on Exploration: ${title}`,
    materials: [`Textbook page ${view.physicalPage}`, `Paper and pencils`, `Everyday household items`],
    instructions: tryNow?.steps || [`Look at the illustration on page ${view.physicalPage}.`, `Sketch what you observe.`, `Discuss with your teacher or parent.`],
    whatToNotice: tryNow?.whatToNotice || `Look for changes and connections across the pictures.`,
  };

  // Questions to Ask
  const firstCheck = firstTopic?.checkYourself?.[0];
  const doubt = firstTopic?.commonDoubts?.[0];
  const questionsToAsk: TeacherParentQuestion[] = [
    {
      level: "recall",
      question: firstCheck?.question || `What is the main idea behind ${firstTopic?.heading || title}?`,
      expectedAnswer: firstCheck?.answer || `Core concept from textbook.`,
      followUpPrompt: `Where in the book can we point to see this?`,
    },
    {
      level: "understanding",
      question: doubt?.question || `Why does this happen the way it does?`,
      expectedAnswer: doubt?.answer || `Because of natural principles explained on this page.`,
      followUpPrompt: `What would happen if the conditions changed?`,
    },
    {
      level: "application",
      question: `Where in our city or neighbourhood can we find another example of this?`,
      expectedAnswer: `A real-world example from nature, home, or community.`,
      followUpPrompt: `How would you verify that it works the same way?`,
    },
  ];

  // Misconceptions
  const misconceptions: TeacherParentMisconception[] = [];
  for (const t of n.topics || []) {
    for (const d of t.commonDoubts || []) {
      if (misconceptions.length < 3) {
        misconceptions.push({
          misconception: d.question,
          whyChildThinksThis: `Learners naturally rely on everyday surface intuition.`,
          correctionStrategy: `Gently explain: ${d.answer}`,
        });
      }
    }
  }
  if (misconceptions.length === 0) {
    misconceptions.push({
      misconception: `Assuming all similar items behave identically.`,
      whyChildThinksThis: `Extrapolating from a single instance.`,
      correctionStrategy: `Compare two contrasting examples side by side.`,
    });
  }

  // Assessment & Answer Key
  const assessment: TeacherParentAssessmentItem[] = [];
  let qNum = 1;
  for (const t of n.topics || []) {
    if (t.quiz) {
      assessment.push({
        questionNumber: qNum++,
        question: t.quiz.question,
        options: t.quiz.options,
        correctAnswer: `${["A", "B", "C"][t.quiz.answerIndex]}. ${t.quiz.options[t.quiz.answerIndex]}`,
        explanation: t.quiz.why,
      });
    }
    for (const c of t.checkYourself || []) {
      if (assessment.length < 4) {
        assessment.push({
          questionNumber: qNum++,
          question: c.question,
          correctAnswer: c.answer,
          explanation: `Supported by page ${view.physicalPage} evidence.`,
        });
      }
    }
  }

  // Homework
  const homework: TeacherParentHomework = {
    title: `Observation Journal: ${title}`,
    task: `Find one real-world example of this concept at home or outdoors. Sketch it with two labeled parts.`,
    observationPrompt: `Watch closely for 3-5 minutes and record any changes or interesting details.`,
    parentRole: `Ask open-ended questions about their sketch and sign their observation notebook.`,
  };

  return {
    page: view.physicalPage,
    bookId: view.bookId,
    title,
    objectives,
    prerequisites,
    boardPlan,
    homeExplanation,
    activity,
    questionsToAsk,
    misconceptions,
    assessment,
    homework,
  };
}
