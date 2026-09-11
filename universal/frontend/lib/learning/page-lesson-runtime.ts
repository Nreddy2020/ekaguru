import { TeachingDepth } from "./teaching-package.types";
export interface PageEvidence {
  provenance?: "PDF_NATIVE" | "OCR" | "MODEL_VISION";
  recommendedDepth?: TeachingDepth;
  version: string;
  bookId: string;
  physicalPage: number;
  totalPages: number;
  sourceHash: string;
  width: number;
  height: number;
  imageDataUrl: string;
  status: "READY" | "NEEDS_REVIEW";
  omittedBlockCount: number;
  blocks: {
    blockId: string;
    physicalPageNumber: number;
    text: string;
    type: string;
    confidence: number;
    readingOrderIndex: number;
    bbox: { x: number; y: number; width: number; height: number };
  }[];
}
export type BoardAction = {
  id: string;
  kind: "write" | "draw" | "explain" | "ask" | "summary";
  text: string;
  speech: string;
  evidenceIds: string[];
  durationMs: number;
  answer?: string;
  prompt?: string;
  assessment?: boolean;
  scene?: {
    id: string;
    type: "line" | "rect" | "circle" | "text";
    x: number;
    y: number;
    x2?: number;
    y2?: number;
    width?: number;
    height?: number;
    radius?: number;
    text?: string;
    color: "white" | "yellow" | "green" | "blue";
  }[];
  relation?: { from: string; label: string; to: string };
};
export interface PageLesson {
  id: string;
  title: string;
  depth: TeachingDepth;
  actions: BoardAction[];
  notes: string[];
  language?: string;
  mode?: "guru";
  sourceHash?: string;
  objectives?: string[];
}
const LEVELS = {
  basis: {
    rate: 38,
    scaffold: "Read this small part with me. Find the important word.",
    prompt: "Say what this means in your own words.",
  },
  developing: {
    rate: 30,
    scaffold: "Let us connect the key words to their meaning.",
    prompt: "Explain how the two parts of this statement connect.",
  },
  proficient: {
    rate: 23,
    scaffold: "Use the statement as evidence for your explanation.",
    prompt:
      "Give an example where you could use this idea. Explain which part of the page supports it.",
  },
  advanced: {
    rate: 18,
    scaffold: "Examine the claim and what the source actually supports.",
    prompt:
      "What does this statement establish, and what would require more evidence?",
  },
  deep: {
    rate: 15,
    scaffold:
      "Separate the observation, the explanation, and the unanswered questions.",
    prompt:
      "Propose a question to investigate this claim. What evidence would you need beyond this page?",
  },
};
export function compilePageLesson(
  page: PageEvidence,
  depth: TeachingDepth,
): PageLesson {
  if (
    page.status !== "READY" ||
    !page.sourceHash ||
    page.width <= 0 ||
    page.height <= 0
  )
    throw new Error("Page evidence needs review");
  const blocks = page.blocks
    .filter(
      (b) =>
        b.physicalPageNumber === page.physicalPage &&
        b.confidence >= 0.65 &&
        b.text.trim() &&
        b.bbox.width > 0 &&
        b.bbox.height > 0,
    )
    .sort((a, b) => a.readingOrderIndex - b.readingOrderIndex);
  if (!blocks.length)
    throw new Error("No readable evidence for this physical page");
  const level = LEVELS[depth];
  const title =
    blocks.find((b) => b.type === "heading")?.text ||
    "Page " + page.physicalPage;
  const actions: BoardAction[] = [];
  const add = (action: Omit<BoardAction, "id" | "durationMs">) =>
    actions.push({
      ...action,
      id: "action-" + actions.length,
      durationMs: Math.max(
        1800,
        action.speech.split(/\s+/).length * (depth === "basis" ? 550 : 400),
        action.text.length * level.rate,
      ),
    });
  add({
    kind: "write",
    text: title,
    speech: "Let us study physical page " + page.physicalPage + ". " + title,
    evidenceIds: [blocks[0].blockId],
  });
  // Group adjacent OCR lines into bounded excerpts; keep every source anchor and never discard later page content.
  const groups: (typeof blocks)[] = [];
  for (const block of blocks) {
    if (block.type === "heading" && block.text === title) continue;
    const previous = groups[groups.length - 1];
    const last = previous?.[previous.length - 1];
    if (
      previous &&
      last &&
      block.readingOrderIndex === last.readingOrderIndex + 1 &&
      block.bbox.y >= last.bbox.y &&
      !/[.!?:]$/.test(last.text) &&
      block.type === "paragraph" &&
      last.type === "paragraph" &&
      Math.abs(block.bbox.x - last.bbox.x) < 100 &&
      block.bbox.y - (last.bbox.y + last.bbox.height) < 35 &&
      previous.map((b) => b.text).join(" ").length + block.text.length <
        (depth === "basis" ? 220 : 420)
    )
      previous.push(block);
    else groups.push([block]);
  }
  const notes: string[] = [];
  groups.forEach((group, index) => {
    const text = group.map((b) => b.text).join(" ");
    const ids = group.map((b) => b.blockId);
    notes.push(text);
    add({
      kind: "write",
      text,
      speech: level.scaffold + " The page says: " + text,
      evidenceIds: ids,
    });
    // Draw only a relation literally present in the excerpt. Other excerpts get an evidence frame, not an invented process arrow.
    const match = text.match(
      /^(.{3,65}?)\s+(is|are|needs|need|contains|contain|produces|produce|becomes|become)\s+(.{3,140}?)[.!]?$/i,
    );
    add({
      kind: "draw",
      text: match ? "Read the relationship" : "Observe the source region",
      speech: match
        ? "Watch me connect " +
          match[1] +
          " to " +
          match[3] +
          " using the word " +
          match[2] +
          " from the page."
        : "I am marking the exact source region. Look at the words and any nearby illustration in your textbook.",
      evidenceIds: ids,
      relation: match
        ? { from: match[1], label: match[2], to: match[3] }
        : undefined,
    });
    add({
      kind: "explain",
      text,
      speech: text + " " + level.prompt,
      evidenceIds: ids,
    });
    const word = text.match(/\b[A-Za-z]{5,}\b/)?.[0];
    if (word)
      add({
        kind: "ask",
        text: text.replace(word, "_____"),
        speech:
          "Let us check this part before moving on. Complete the missing word from the page.",
        answer: word,
        prompt: level.prompt,
        evidenceIds: ids,
      });
  });
  add({
    kind: "summary",
    text: "Review your page notes",
    speech:
      "We have reached the end of this page. Review the notes and explain one idea in your own words. A completed reading is not a mastery assessment.",
    evidenceIds: blocks.map((b) => b.blockId),
  });
  return {
    id: [page.bookId, page.physicalPage, page.sourceHash, depth].join(":"),
    title,
    depth,
    actions,
    notes,
  };
}
export interface RuntimeState {
  index: number;
  playing: boolean;
  feedback: "correct" | "retry" | null;
  attempts: number;
}
export const initialRuntime: RuntimeState = {
  index: 0,
  playing: false,
  feedback: null,
  attempts: 0,
};
export function transition(
  state: RuntimeState,
  event: "play" | "pause" | "next" | "back" | "restart" | "correct" | "wrong",
  lesson: PageLesson,
): RuntimeState {
  const action = lesson.actions[state.index];
  if (event === "restart") return { ...initialRuntime };
  if (event === "pause") return { ...state, playing: false };
  if (event === "play")
    return {
      ...state,
      playing: action.kind !== "ask" && action.kind !== "summary",
    };
  if (event === "correct" || event === "wrong")
    return action.kind === "ask"
      ? {
          ...state,
          playing: false,
          feedback: event === "correct" ? "correct" : "retry",
          attempts: state.attempts + 1,
        }
      : state;
  if (event === "next" && action.kind === "ask" && state.feedback !== "correct")
    return { ...state, playing: false };
  const index = Math.max(
    0,
    Math.min(
      lesson.actions.length - 1,
      state.index + (event === "back" ? -1 : 1),
    ),
  );
  return {
    ...state,
    index,
    feedback: null,
    playing:
      event !== "back" &&
      state.playing &&
      !["ask", "summary"].includes(lesson.actions[index].kind),
  };
}
export function checkRecall(answer: string, expected: string) {
  return answer.trim().toLocaleLowerCase() === expected.toLocaleLowerCase();
}
