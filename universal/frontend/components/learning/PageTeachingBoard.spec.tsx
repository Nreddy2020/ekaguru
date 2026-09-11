import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PageTeachingBoard } from "./PageTeachingBoard";
import { describeMasteryOutcome } from "../../lib/learning/guru-api";
import {
  compilePageLesson,
  PageEvidence,
} from "../../lib/learning/page-lesson-runtime";
const page: PageEvidence = {
  version: "v1",
  bookId: "book",
  physicalPage: 1,
  totalPages: 2,
  sourceHash: "hash",
  width: 800,
  height: 1000,
  imageDataUrl: "",
  status: "READY",
  omittedBlockCount: 0,
  blocks: [
    {
      blockId: "one",
      physicalPageNumber: 1,
      text: "A triangle contains three sides.",
      type: "paragraph",
      confidence: 1,
      readingOrderIndex: 1,
      bbox: { x: 0, y: 0, width: 300, height: 40 },
    },
  ],
};
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
it("gives each action its own duration and cancels playback on pause", () => {
  const lesson = compilePageLesson(page, "basis");
  render(
    <PageTeachingBoard page={page} lesson={lesson} onHighlight={() => {}} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Play Guru" }));
  act(() => jest.advanceTimersByTime(lesson.actions[0].durationMs + 50));
  expect(screen.getByText(/Action 2/)).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(100));
  expect(screen.getByText(/Action 2/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.getByText(/Action 2/)).toBeInTheDocument();
});
it("keeps the drawing available while explaining and cancels on unmount", () => {
  const lesson = compilePageLesson(page, "basis");
  const view = render(
    <PageTeachingBoard page={page} lesson={lesson} onHighlight={() => {}} />,
  );
  for (let i = 0; i < 3; i++)
    fireEvent.click(screen.getByRole("button", { name: /^Next$/ }));
  expect(
    screen.getByRole("img", { name: "Relationship from the page" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Play Guru" }));
  view.unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it("waits for a saved checkpoint before enabling advance", async () => {
  const lesson = compilePageLesson(page, "basis");
  lesson.actions[0] = {
    ...lesson.actions[0],
    kind: "ask",
    assessment: true,
    prompt: "Why three sides?",
  };
  const onEvent = jest.fn().mockResolvedValue({
    id: "s",
    artifactId: lesson.id,
    cursor: 0,
    revision: 1,
    checkpointPassed: true,
    feedback: "Your reasoning is supported.",
    assessment: {
      kind: "PAGE_EXPLANATION",
      passed: true,
      masteryUpdated: false,
      conceptIds: [],
      masteryNote: "no-verified-mapping",
    },
  });
  render(
    <PageTeachingBoard
      page={page}
      lesson={lesson}
      onHighlight={() => {}}
      session={{
        id: "s",
        artifactId: lesson.id,
        cursor: 0,
        revision: 0,
        checkpointPassed: false,
      }}
      onEvent={onEvent}
    />,
  );
  expect(screen.getByRole("button", { name: /^Next$/ })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Explain your reasoning"), {
    target: { value: "It is defined by three sides." },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Discuss my answer" }));
  });
  expect(onEvent).toHaveBeenCalledWith(
    "answer",
    "It is defined by three sides.",
  );
  expect(screen.getByRole("button", { name: /^Next$/ })).not.toBeDisabled();
  expect(screen.getByText("Your reasoning is supported.")).toBeInTheDocument();
  expect(screen.getByTestId("mastery-note")).toHaveTextContent(
    "Recorded as page practice. Concept mastery is unchanged: this page has no curator-verified concept mapping yet.",
  );
});
it("describes every mastery outcome in plain language", () => {
  expect(describeMasteryOutcome(null)).toBe("");
  expect(describeMasteryOutcome({ kind: "ASSISTED_PRACTICE", masteryUpdated: false })).toBe("");
  expect(describeMasteryOutcome({ kind: "PRIOR_KNOWLEDGE", masteryUpdated: false })).toBe("");
  expect(describeMasteryOutcome({ kind: "REFLECTION", masteryUpdated: false })).toBe("");
  expect(
    describeMasteryOutcome({ kind: "PAGE_EXPLANATION", masteryUpdated: true, conceptIds: ["a", "b"] }),
  ).toBe("Recorded toward concept mastery for 2 verified concepts on this page.");
  for (const note of ["bridge-disabled", "no-learner", "evaluation-gate", "ledger-error", "unknown"])
    expect(
      describeMasteryOutcome({ kind: "PAGE_EXPLANATION", masteryUpdated: false, masteryNote: note }),
    ).toMatch(/^Recorded as page practice\. Concept mastery is unchanged/);
});
it("preserves the current action when saving fails", async () => {
  const lesson = compilePageLesson(page, "basis");
  const onEvent = jest.fn().mockRejectedValue(new Error("Network interrupted"));
  render(
    <PageTeachingBoard
      page={page}
      lesson={lesson}
      onHighlight={() => {}}
      onEvent={onEvent}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /^Next$/ }));
  });
  expect(screen.getByText(/Action 1\//)).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Network interrupted");
});

it("cancels automatic advancement while the source dialog is open", () => {
  const lesson = compilePageLesson(page, "basis");
  const view = render(
    <PageTeachingBoard page={page} lesson={lesson} onHighlight={() => {}} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Play Guru" }));
  view.rerender(
    <PageTeachingBoard
      page={page}
      lesson={lesson}
      onHighlight={() => {}}
      suspended
    />,
  );
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.getByText(/Action 1/)).toBeInTheDocument();
  expect(jest.getTimerCount()).toBe(0);
});
it("shows the teaching phase, hears an ungraded prior-knowledge ask and shows what Guru remembers", async () => {
  const lesson = compilePageLesson(page, "basis");
  lesson.actions[0] = {
    ...lesson.actions[0],
    kind: "ask",
    phase: "prior",
    gating: false,
    assessment: true,
    prompt: "What do you already know about triangles?",
    acknowledgement: "Lovely, hold on to that.",
  };
  const onEvent = jest.fn().mockResolvedValue({
    id: "s",
    artifactId: lesson.id,
    cursor: 0,
    revision: 1,
    checkpointPassed: true,
    feedback: "Lovely, hold on to that.",
    assessment: { kind: "PRIOR_KNOWLEDGE", passed: null, masteryUpdated: false, masteryNote: "not-assessed" },
  });
  render(
    <PageTeachingBoard
      page={page}
      lesson={lesson}
      onHighlight={() => {}}
      session={{ id: "s", artifactId: lesson.id, cursor: 0, revision: 0, checkpointPassed: false, personalization: { recommendedDepth: null, recommendationReason: null, priorPages: [], knownConcepts: ["Shapes"], misconceptions: [], note: "Ideas you have practised: Shapes." } }}
      onEvent={onEvent}
    />,
  );
  expect(screen.getByTestId("guru-remembers")).toHaveTextContent("Guru remembers: Ideas you have practised: Shapes.");
  // A lesson that opens with an ask starts immediately; the phase label is visible at once.
  expect(screen.getByTestId("phase-label")).toHaveTextContent("What you already know");
  // Ungraded asks never block Next.
  expect(screen.getByRole("button", { name: /^Next$/ })).not.toBeDisabled();
  fireEvent.change(screen.getByLabelText("Share your thinking"), { target: { value: "They have three corners." } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Share and continue" }));
  });
  expect(onEvent).toHaveBeenCalledWith("answer", "They have three corners.");
  expect(screen.getByText("Lovely, hold on to that.")).toBeInTheDocument();
  expect(screen.queryByTestId("mastery-note")).toBeNull();
});
