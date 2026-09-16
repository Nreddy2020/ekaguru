import type { GuruNotesView, NotesTopic } from "./guru-notes-api";

/**
 * Revision formats derived from a page's Guru Notes, with no model call: the same source produces
 * quick notes, memory notes, flash cards, a question bank by difficulty and a one-page sheet.
 */
export const REVISION_FORMATS = ["Quick notes", "Memory notes", "Flash cards", "Question bank", "One-page sheet", "Teacher & parent"] as const;
export type RevisionFormat = (typeof REVISION_FORMATS)[number];

const firstSentence = (text: string, max = 180) => {
  const match = text.match(/^[^.!?]*[.!?]/);
  const sentence = (match ? match[0] : text).trim();
  return sentence.length > max ? sentence.slice(0, max - 1).trimEnd() + "…" : sentence;
};

export interface QuickNotes {
  title: string;
  objectives: string[];
  topics: { id: string; heading: string; line: string }[];
  summary: string[];
}
export function quickNotes(view: GuruNotesView): QuickNotes {
  const n = view.notes;
  return {
    title: n.title,
    objectives: n.objectives,
    topics: n.topics.map((t) => ({ id: t.id, heading: t.heading, line: firstSentence(t.explanation[0] || "") })),
    summary: n.summary,
  };
}

export interface MemoryNotes {
  terms: { term: string; meaning: string; topic: string }[];
  tips: { topic: string; tip: string }[];
  facts: string[];
  mustRemember: string[];
}
export function memoryNotes(view: GuruNotesView): MemoryNotes {
  const n = view.notes;
  return {
    terms: n.topics.flatMap((t) => t.keyTerms.map((k) => ({ term: k.term, meaning: k.meaning, topic: t.heading }))),
    tips: n.topics.map((t) => ({ topic: t.heading, tip: t.rememberTip })),
    facts: n.topics.map((t) => t.didYouKnow).filter((f): f is string => Boolean(f)),
    mustRemember: [...n.summary, ...n.topics.map((t) => t.bigIdea).filter((b): b is string => Boolean(b))],
  };
}

export type CardKind = "term" | "quiz" | "check" | "doubt" | "asked" | "command" | "troubleshoot" | "interview" | "foundation" | "case_study";
export interface FlashCard {
  id: string;
  kind: CardKind;
  topic: string;
  front: string;
  back: string;
}
/** Cards in the order a child would meet them: terms first, then checks, doubts, readers' questions. */
export function flashCards(view: GuruNotesView): FlashCard[] {
  const cards: FlashCard[] = [];
  const byTopic = (topic: NotesTopic, kind: CardKind, items: { front: string; back: string }[]) =>
    items.forEach((item, i) => cards.push({ id: topic.id + ":" + kind + ":" + i, kind, topic: topic.heading, ...item }));
  for (const t of view.notes.topics) byTopic(t, "term", t.keyTerms.map((k) => ({ front: "What does \"" + k.term + "\" mean?", back: k.meaning + " For example, " + k.example })));
  for (const t of view.notes.topics)
    if (t.quiz) byTopic(t, "quiz", [{ front: t.quiz.question + " " + t.quiz.options.map((o, i) => ["A", "B", "C"][i] + ". " + o).join("  "), back: ["A", "B", "C"][t.quiz.answerIndex] + ". " + t.quiz.options[t.quiz.answerIndex] + " " + t.quiz.why }]);
  for (const t of view.notes.topics) byTopic(t, "check", t.checkYourself.map((c) => ({ front: c.question, back: c.answer })));
  for (const t of view.notes.topics) byTopic(t, "doubt", t.commonDoubts.map((d) => ({ front: d.question, back: d.answer })));
  for (const t of view.notes.topics)
    byTopic(t, "asked", view.extensions.filter((e) => e.topicId === t.id).map((e) => ({ front: e.question, back: e.answer + (e.beyondPage ? " (This goes beyond the page.)" : "") })));
  for (const t of view.notes.topics) {
    if (t.professional) {
      const p = t.professional;
      byTopic(t, "command", p.commands.map(c => ({ front: "Command: " + c.command, back: c.description + (c.output ? "\nOutput: " + c.output : "") })));
      byTopic(t, "troubleshoot", p.troubleshooting.map(tr => ({ front: "Troubleshoot: " + tr.symptom, back: "Cause: " + tr.cause + "\nFix: " + tr.fix })));
      byTopic(t, "interview", p.interviewQuestions.map(iq => ({ front: "[" + iq.difficulty.toUpperCase() + "] " + iq.question, back: iq.expectedAnswer })));
    }
    if (t.professor) {
      const a = t.professor;
      byTopic(t, "foundation", a.foundations.formalDefinitions.map((def, i) => ({ front: "Formal Definition #" + (i + 1) + " (" + t.heading + ")", back: def + "\nBasis: " + a.foundations.theoreticalBasis })));
      byTopic(t, "case_study", a.caseStudies.map(cs => ({ front: "Case Study: " + cs.title, back: "Methodology: " + cs.methodology + "\nFindings: " + cs.findings })));
    }
  }
  return cards;
}

export interface BankQuestion {
  id: string;
  topic: string;
  question: string;
  answer: string;
}
export interface QuestionBank {
  easy: BankQuestion[];
  medium: BankQuestion[];
  extended: BankQuestion[];
}
/** Check-yourself questions are easy, the doubts children have are medium, readers' own questions are extended. */
export function questionBank(view: GuruNotesView): QuestionBank {
  const bank: QuestionBank = { easy: [], medium: [], extended: [] };
  for (const t of view.notes.topics) {
    if (t.quiz)
      bank.easy.push({
        id: t.id + ":q",
        topic: t.heading,
        question: t.quiz.question + " (" + t.quiz.options.map((o, i) => ["A", "B", "C"][i] + ". " + o).join(", ") + ")",
        answer: ["A", "B", "C"][t.quiz.answerIndex] + ". " + t.quiz.options[t.quiz.answerIndex] + ". " + t.quiz.why,
      });
    t.checkYourself.forEach((c, i) => bank.easy.push({ id: t.id + ":e" + i, topic: t.heading, question: c.question, answer: c.answer }));
    t.commonDoubts.forEach((d, i) => bank.medium.push({ id: t.id + ":m" + i, topic: t.heading, question: d.question, answer: d.answer }));
    view.extensions
      .filter((e) => e.topicId === t.id)
      .forEach((e) => bank.extended.push({ id: t.id + ":x" + e.id, topic: t.heading, question: e.question, answer: e.answer }));
    if (t.professional) {
      const p = t.professional;
      p.interviewQuestions.forEach((iq, i) => {
        const item = { id: t.id + ":iq" + i, topic: t.heading, question: "[" + iq.difficulty.toUpperCase() + "] " + iq.question, answer: iq.expectedAnswer };
        if (iq.difficulty === "junior") bank.easy.push(item);
        else if (iq.difficulty === "mid") bank.medium.push(item);
        else bank.extended.push(item);
      });
      p.troubleshooting.forEach((tr, i) => {
        bank.medium.push({ id: t.id + ":tr" + i, topic: t.heading, question: "Troubleshoot: " + tr.symptom, answer: "Cause: " + tr.cause + "; Fix: " + tr.fix });
      });
      p.labs.forEach((l, i) => {
        bank.extended.push({ id: t.id + ":lab" + i, topic: t.heading, question: "Lab: " + l.title + " - " + l.objective, answer: "Steps:\n" + l.steps.join("\n") + "\nVerification: " + l.verification });
      });
    }
    if (t.professor) {
      const a = t.professor;
      a.caseStudies.forEach((cs, i) => {
        bank.medium.push({ id: t.id + ":cs" + i, topic: t.heading, question: "Case Study: " + cs.title + " (Methodology & Findings)", answer: cs.methodology + " -> " + cs.findings });
      });
      a.researchPerspective.openProblems.forEach((op, i) => {
        bank.extended.push({ id: t.id + ":op" + i, topic: t.heading, question: "Open Problem: " + op, answer: "Current debate: " + a.researchPerspective.currentDebates });
      });
    }
  }
  return bank;
}

export interface OnePage {
  title: string;
  whatItIsAbout: string;
  mustKnow: string[];
  terms: { term: string; meaning: string }[];
  tips: string[];
  tryNow: string[];
  questions: { question: string; answer: string }[];
}
/** Everything important on one sheet: capped so it stays one page. */
export function onePage(view: GuruNotesView): OnePage {
  const n = view.notes;
  const bank = questionBank(view);
  return {
    title: n.title,
    whatItIsAbout: firstSentence(n.overview, 240),
    mustKnow: n.summary.slice(0, 8),
    terms: n.topics.flatMap((t) => t.keyTerms.map((k) => ({ term: k.term, meaning: firstSentence(k.meaning, 120) }))).slice(0, 12),
    tips: n.topics.map((t) => t.rememberTip).slice(0, 6),
    tryNow: n.topics.map((t) => t.tryNow?.title).filter((s): s is string => Boolean(s)).slice(0, 4),
    questions: [...bank.easy, ...bank.medium].slice(0, 6).map((q) => ({ question: q.question, answer: q.answer })),
  };
}
