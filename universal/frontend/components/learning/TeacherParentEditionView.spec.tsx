import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { TeacherParentEditionView } from "./TeacherParentEditionView";

const view: any = {
  id: "n1",
  bookId: "evs-class-5",
  physicalPage: 3,
  sourceHash: "h",
  language: "en",
  notes: {
    title: "I am Growing Up",
    objectives: ["Explain what a seed needs to grow"],
    topics: [
      {
        id: "t1",
        heading: "A seed is a baby plant",
        bigIdea: "A seed is alive inside.",
        explanation: ["A seed sleeps until water wakes it up."],
        keyTerms: [{ term: "seed", meaning: "a baby plant", example: "a bean" }],
        example: { situation: "Soaking a seed", explanation: "A white root appears." },
        tryNow: { title: "Grow a seed on wet cloth", steps: ["Keep cloth wet for three days."], whatToNotice: "Root grows first" },
        rememberTip: "Water, sun, air",
        commonDoubts: [{ question: "Does a stone grow?", answer: "No, a stone is not alive." }],
        quiz: { question: "What does a seed need?", options: ["Water", "Blanket", "Music"], answerIndex: 0, why: "Water wakes it up" },
        checkYourself: [{ question: "Name one need.", answer: "Water" }],
        buildsOn: [{ topicId: "p2-t1", heading: "Living Earth", page: 2, reason: "Soil nutrients" }],
      },
    ],
    summary: ["Living things grow."],
  },
};

describe("TeacherParentEditionView", () => {
  it("renders all 8 pedagogical components and supports interactive answer reveals and section filters", () => {
    render(<TeacherParentEditionView view={view} />);

    // Header & badge
    expect(screen.getByTestId("teacher-parent-edition")).toBeInTheDocument();
    expect(screen.getByText("🍎 Teacher & Parent Edition")).toBeInTheDocument();
    expect(screen.getByText("I am Growing Up")).toBeInTheDocument();

    // 1. Objectives & Prerequisites
    expect(screen.getByTestId("tp-objectives-prereqs")).toBeInTheDocument();
    expect(screen.getByText("Explain what a seed needs to grow")).toBeInTheDocument();
    expect(screen.getByText("Living Earth (Page 2)")).toBeInTheDocument();

    // 2. Board plan
    expect(screen.getByTestId("tp-board-plan")).toBeInTheDocument();
    expect(screen.getByText(/Blackboard Teaching Plan/)).toBeInTheDocument();
    expect(screen.getByText(/Step 1/)).toBeInTheDocument();

    // 3. Parent home guide
    expect(screen.getByTestId("tp-home-guide")).toBeInTheDocument();
    expect(screen.getByText(/Soaking a seed/)).toBeInTheDocument();

    // 4. Hands-on activity
    expect(screen.getByTestId("tp-activity")).toBeInTheDocument();
    expect(screen.getByText(/Grow a seed on wet cloth/)).toBeInTheDocument();

    // 5. Questions & Misconceptions
    expect(screen.getByTestId("tp-questions-misconceptions")).toBeInTheDocument();
    expect(screen.getByText("RECALL")).toBeInTheDocument();
    expect(screen.getByText("UNDERSTANDING")).toBeInTheDocument();
    expect(screen.getByText("APPLICATION")).toBeInTheDocument();
    expect(screen.getAllByText(/Does a stone grow\?/).length).toBeGreaterThanOrEqual(1);

    // 6. Assessment & Homework
    expect(screen.getByTestId("tp-assessment-homework")).toBeInTheDocument();
    expect(screen.getByText("What does a seed need?")).toBeInTheDocument();
    expect(screen.getByText(/Home Discovery Mission/)).toBeInTheDocument();

    // Interactive answer key reveal
    expect(screen.queryByText(/Water wakes it up/)).toBeNull();
    const revealBtns = screen.getAllByRole("button", { name: "Show answer key" });
    fireEvent.click(revealBtns[0]);
    expect(screen.getByText(/Water wakes it up/)).toBeInTheDocument();
    expect(screen.getAllByText(/A\. Water/).length).toBeGreaterThanOrEqual(2);

    // Filter pill buttons
    fireEvent.click(screen.getByRole("button", { name: "📋 Teacher Board Plan" }));
    expect(screen.getByTestId("tp-board-plan")).toBeInTheDocument();
    expect(screen.queryByTestId("tp-home-guide")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "🏡 Parent Home Guide" }));
    expect(screen.getByTestId("tp-home-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("tp-board-plan")).toBeNull();
  });
});
