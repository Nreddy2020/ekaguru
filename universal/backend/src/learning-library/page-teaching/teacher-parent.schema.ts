import { GuruNotes } from "./guru-notes.schema";
import { GuruPlan } from "./guru-plan.schema";
import { BookKnowledgeMap } from "./guru-book-map.schema";

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
 * Assembles a comprehensive Teacher & Parent Edition for a page by synthesizing
 * from the prepared Guru Notes, Lesson Plan, and Book Knowledge Map.
 */
export function assembleTeacherParentEdition(
  page: number,
  bookId: string,
  notes: GuruNotes,
  plan?: GuruPlan | null,
  bookMap?: BookKnowledgeMap | null,
): TeacherParentEdition {
  const title = notes.title || plan?.title || `Page ${page}`;

  // 1. Objectives
  const objectives =
    notes.objectives?.length > 0
      ? notes.objectives
      : plan?.objectives?.length
      ? plan.objectives
      : [`Understand the core principles and observations on page ${page}`];

  // 2. Prerequisites
  const prerequisites: TeacherParentPrerequisite[] = [];
  const seenPrereqs = new Set<string>();

  for (const topic of notes.topics || []) {
    for (const link of topic.buildsOn || []) {
      if (!seenPrereqs.has(link.heading)) {
        seenPrereqs.add(link.heading);
        prerequisites.push({
          concept: link.heading,
          page: link.page,
          reason: link.reason || `Essential foundation from earlier in the book.`,
          checkQuestion: `Before starting, ask: "Do you remember what we explored about ${link.heading}?"`,
        });
      }
    }
  }

  if (prerequisites.length === 0 && bookMap?.dependencies) {
    const deps = bookMap.dependencies.filter((d) => d.targetPage === page);
    for (const d of deps) {
      if (!seenPrereqs.has(d.sourceTopicTitle)) {
        seenPrereqs.add(d.sourceTopicTitle);
        prerequisites.push({
          concept: d.sourceTopicTitle,
          page: d.sourcePage,
          reason: d.reason,
          checkQuestion: `Check recall: "What key thing did we learn on page ${d.sourcePage}?"`,
        });
      }
    }
  }

  if (prerequisites.length === 0) {
    prerequisites.push({
      concept: `Foundational concepts for ${title}`,
      page: Math.max(1, page - 1),
      reason: `Basic vocabulary and observational awareness for this unit.`,
      checkQuestion: `Ask: "What do you already know about this topic from your own experience?"`,
    });
  }

  // 3. Board Plan
  const boardSteps: BoardPlanStep[] = [];
  if (plan?.actions?.length) {
    const teachActions = plan.actions
      .filter((a) => a.kind === "write" || a.kind === "draw" || a.kind === "explain")
      .slice(0, 6);
    teachActions.forEach((a, i) => {
      boardSteps.push({
        stepNumber: i + 1,
        phase: a.phase || (a.kind === "draw" ? "visual" : "concept"),
        whatToWriteOrDraw:
          a.text || (a.kind === "draw" ? `[Diagram] ${a.speech.slice(0, 80)}…` : a.speech.slice(0, 100)),
        teacherSpeechGuidance: a.speech || a.text,
      });
    });
  }

  if (boardSteps.length === 0) {
    // Synthesize from topics
    (notes.topics || []).slice(0, 4).forEach((topic, i) => {
      boardSteps.push({
        stepNumber: i * 2 + 1,
        phase: "introduction",
        whatToWriteOrDraw: `Title: ${topic.heading}\n• ${topic.bigIdea || topic.heading}`,
        teacherSpeechGuidance: topic.hook || `Today we are exploring ${topic.heading}. Let's look closely at how it works.`,
      });
      if (topic.example) {
        boardSteps.push({
          stepNumber: i * 2 + 2,
          phase: "elaboration",
          whatToWriteOrDraw: `Real World Example:\n${topic.example.situation}\n→ ${topic.example.explanation}`,
          teacherSpeechGuidance: `In our everyday lives, notice how ${topic.example.situation}.`,
        });
      }
    });
  }

  const boardPlan: TeacherParentBoardPlan = {
    title: `Classroom Blackboard Layout for ${title}`,
    summary: `Structured chalk-and-talk progression guiding learners from sensory engagement to core principles and everyday examples.`,
    steps: boardSteps,
  };

  // 4. Home Explanation Guide
  const firstTopic = notes.topics?.[0];
  const ladderAnalogy = firstTopic?.ladder?.find((l) => l.level === "analogy")?.explanation;
  const homeAnalogy =
    ladderAnalogy ||
    (firstTopic?.example
      ? `Think of this like ${firstTopic.example.situation}: ${firstTopic.example.explanation}`
      : `Relate ${title} to familiar household routines and observations.`);

  const homeExplanation: TeacherParentHomeGuide = {
    everydayAnalogy: homeAnalogy,
    conversationStarters: [
      `"Have you noticed anything like this happening in our kitchen or garden?"`,
      `"If you were explaining ${firstTopic?.heading || title} to a younger friend, what example would you give them?"`,
      `"Look at page ${page} together—what is the most surprising thing you see?"`,
    ],
    parentTips: [
      `Let your child explain in their own everyday words before correcting technical terms.`,
      `Relate ideas to tangible objects they can touch, smell, or watch grow.`,
      `Praise curiosity over perfect answers: ask "What do you wonder about next?"`,
    ],
  };

  // 5. Activity
  const tryNow = notes.topics?.find((t) => t.tryNow)?.tryNow;
  const activity: TeacherParentActivity = {
    title: tryNow?.title || `Hands-on Discovery: ${title}`,
    materials: [
      `Textbook page ${page}`,
      `Unlined notebook or observation paper`,
      `Household items (cups, seeds, cloth, or ruler depending on activity)`,
    ],
    instructions: tryNow?.steps?.length
      ? tryNow.steps
      : [
          `Open textbook page ${page} and locate the core illustration.`,
          `Follow the step-by-step cues shown in the diagrams.`,
          `Record your observations in your notebook.`,
        ],
    whatToNotice: tryNow?.whatToNotice || `Look for changes in shape, position, or behavior over time.`,
    safetyOrPrep: `No special equipment needed; simple kitchen or garden observation with parent supervision.`,
  };

  // 6. Questions to Ask (Bloom's Taxonomy)
  const questionsToAsk: TeacherParentQuestion[] = [];
  const firstCheck = notes.topics?.[0]?.checkYourself?.[0];
  const secondCheck = notes.topics?.[0]?.checkYourself?.[1] || notes.topics?.[1]?.checkYourself?.[0];
  const quiz = notes.topics?.[0]?.quiz;
  const doubt = notes.topics?.[0]?.commonDoubts?.[0];

  // Recall question
  questionsToAsk.push({
    level: "recall",
    question: firstCheck?.question || quiz?.question || `What is the key idea behind ${firstTopic?.heading || title}?`,
    expectedAnswer: firstCheck?.answer || (quiz ? quiz.options[quiz.answerIndex] : `Key definition from the textbook.`),
    followUpPrompt: `Can you point to where in the textbook picture this is shown?`,
  });

  // Understanding question
  questionsToAsk.push({
    level: "understanding",
    question: doubt?.question || secondCheck?.question || `Why does this happen the way it does?`,
    expectedAnswer: doubt?.answer || secondCheck?.answer || `Because of the natural process and conditions required.`,
    followUpPrompt: `What would happen if one of those conditions was missing?`,
  });

  // Application question
  questionsToAsk.push({
    level: "application",
    question: `Where in our city or neighbourhood can we find another example of ${firstTopic?.heading || title}?`,
    expectedAnswer: `A real-world example from parks, animals, food, or weather.`,
    followUpPrompt: `How would you test or prove that it works the same way there?`,
  });

  // 7. Misconceptions
  const misconceptions: TeacherParentMisconception[] = [];
  // From lesson plan rubrics
  if (plan?.actions) {
    for (const a of plan.actions) {
      if (a.rubric?.misconception) {
        misconceptions.push({
          misconception: a.rubric.misconception,
          whyChildThinksThis: `Learners often draw conclusions from surface appearances or everyday speech.`,
          correctionStrategy: a.rubric.hint || `Ask guiding questions that highlight the counter-example.`,
        });
        if (misconceptions.length >= 2) break;
      }
    }
  }

  // From notes doubts
  for (const t of notes.topics || []) {
    for (const d of t.commonDoubts || []) {
      if (misconceptions.length < 3) {
        misconceptions.push({
          misconception: d.question,
          whyChildThinksThis: `It is very natural to assume this based on common intuition.`,
          correctionStrategy: `Gently explain: ${d.answer}`,
        });
      }
    }
  }

  if (misconceptions.length === 0) {
    misconceptions.push({
      misconception: `Assuming all parts behave identically under different conditions.`,
      whyChildThinksThis: `Children extrapolate single observations to all scenarios.`,
      correctionStrategy: `Highlight differences through side-by-side comparison.`,
    });
  }

  // 8. Assessment with Answer Key
  const assessment: TeacherParentAssessmentItem[] = [];
  let qNum = 1;
  for (const t of notes.topics || []) {
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
          explanation: `Directly supported by the textbook evidence on page ${page}.`,
        });
      }
    }
  }

  // 9. Homework Mini-Project
  const homework: TeacherParentHomework = {
    title: `Home Discovery Mission: ${title}`,
    task: `Identify one real-life occurrence of the concepts learned today. Sketch it in your observation book with two labeled parts and one interesting question you noticed.`,
    observationPrompt: `Watch closely for 5 minutes: what is moving, changing, or staying steady?`,
    parentRole: `Accompany your child during their observation, listen to their explanation, and sign their notebook entry with an encouraging star.`,
  };

  return {
    page,
    bookId,
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
    createdAt: new Date().toISOString(),
  };
}
