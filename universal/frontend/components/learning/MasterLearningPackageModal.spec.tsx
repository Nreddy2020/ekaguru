import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MasterLearningPackageModal } from "./MasterLearningPackageModal";
import * as pkgApi from "../../lib/learning/guru-learning-package-api";

jest.mock("../../lib/learning/guru-learning-package-api", () => ({
  ...jest.requireActual("../../lib/learning/guru-learning-package-api"),
  fetchLearningPackage: jest.fn(),
  refreshLearningPackage: jest.fn(),
}));

describe("MasterLearningPackageModal", () => {
  const mockPkg: pkgApi.MasterLearningPackage = {
    metadata: {
      bookId: "evs-class-5",
      title: "Our Living Environment",
      subject: "Environmental Studies",
      grade: "CLASS 5",
      targetAudience: "child",
      blueprint: "notes-v4",
      language: "en",
      depth: "basis",
      totalPages: 116,
      readyPagesCount: 1,
      generatedAt: "2026-09-16T00:00:00Z",
    },
    roadmap: [
      {
        chapterNumber: 1,
        title: "Plant and Animal Life",
        pageRange: { from: 1, to: 10 },
        concepts: ["Germination", "Root Networks"],
        objectives: ["Master germination foundations"],
      },
    ],
    conceptMap: {
      topics: [
        {
          topicId: "t1",
          title: "Germination",
          physicalPage: 2,
          summary: "Seeds sprout",
          keyTerms: ["Pheromone"],
        },
      ],
      dependencies: [
        {
          id: "dep-1",
          sourceTopicId: "t1",
          sourceTopicTitle: "Germination",
          sourcePage: 2,
          targetTopicId: "t2",
          targetTopicTitle: "Roots",
          targetPage: 3,
          strength: "essential",
          reason: "Germination is required before roots extend",
        },
      ],
    },
    chapterNotes: [
      {
        chapterNumber: 1,
        chapterTitle: "Plant and Animal Life",
        pageRange: { from: 1, to: 10 },
        pages: [
          {
            physicalPage: 2,
            title: "How Seeds Sprout",
            topics: [
              {
                id: "t1",
                heading: "Germination Mechanisms",
                icon: "🌱",
                bigIdea: "Seeds awaken with water and warmth.",
                explanation: ["Moisture triggers enzyme production."],
              },
            ],
            summary: ["Seeds sprout with warmth."],
          },
        ],
      },
    ],
    examplesAndScenarios: [
      {
        chapterNumber: 1,
        page: 2,
        topic: "Germination Mechanisms",
        situation: "Soaking gram seeds",
        explanation: "Embryo activates",
      },
    ],
    mistakesAndTroubleshooting: [
      {
        chapterNumber: 1,
        page: 2,
        topic: "Germination Mechanisms",
        questionOrSymptom: "Seeds in cold water fail to sprout",
        explanationOrFix: "Temperature was below enzyme threshold",
        kind: "child_doubt",
      },
    ],
    memoryTricks: [
      {
        chapterNumber: 1,
        page: 2,
        topic: "Germination Mechanisms",
        tip: "Warm Water Awakens Seeds",
        facts: ["Some lotus seeds sprouted after 1000 years."],
      },
    ],
    exercisesAndLabs: [
      {
        chapterNumber: 1,
        page: 2,
        topic: "Germination Mechanisms",
        title: "Cotton Sprout Test",
        steps: ["Dampen cotton", "Place seed"],
        verificationOrNotice: "Tiny root breaks out",
        kind: "try_now",
      },
    ],
    questionBank: {
      easy: [
        {
          id: "q-easy-1",
          chapterNumber: 1,
          page: 2,
          topic: "Germination Mechanisms",
          difficulty: "easy",
          question: "What triggers initial seed sprouting?",
          options: ["Moisture and warmth", "Freezing temperature", "Dry air"],
          answer: "Moisture and warmth",
          rationale: "Enzyme activation requires water and temperature",
          marks: 1,
        },
      ],
      medium: [
        {
          id: "q-med-1",
          chapterNumber: 1,
          page: 2,
          topic: "Germination Mechanisms",
          difficulty: "medium",
          question: "Why do dry seeds remain dormant?",
          answer: "Enzymes are inactive without hydration.",
          marks: 3,
        },
      ],
      extended: [
        {
          id: "q-ext-1",
          chapterNumber: 1,
          page: 2,
          topic: "Germination Mechanisms",
          difficulty: "extended",
          question: "Design a controlled experiment comparing moisture levels on germination rate.",
          answer: "Use 3 petri dishes with varying moisture controls.",
          marks: 5,
        },
      ],
    },
    mockTest: {
      title: "Summative Environment Assessment",
      totalMarks: 9,
      timeBudgetMinutes: 30,
      instructions: ["Attempt all questions"],
      sections: [
        {
          sectionId: "sec-a",
          name: "Section A: Recall",
          instructions: "Choose correct option",
          totalMarks: 1,
          questions: [
            {
              id: "q-easy-1",
              chapterNumber: 1,
              page: 2,
              topic: "Germination Mechanisms",
              difficulty: "easy",
              question: "What triggers initial seed sprouting?",
              options: ["Moisture and warmth", "Freezing temperature", "Dry air"],
              answer: "Moisture and warmth",
              marks: 1,
            },
          ],
        },
        {
          sectionId: "sec-b",
          name: "Section B: Conceptual Reasoning",
          instructions: "Answer in 2-3 sentences",
          totalMarks: 3,
          questions: [
            {
              id: "q-med-1",
              chapterNumber: 1,
              page: 2,
              topic: "Germination Mechanisms",
              difficulty: "medium",
              question: "Why do dry seeds remain dormant?",
              answer: "Enzymes are inactive without hydration.",
              marks: 3,
            },
          ],
        },
        {
          sectionId: "sec-c",
          name: "Section C: Extended Synthesis",
          instructions: "Structured experiment plan",
          totalMarks: 5,
          questions: [
            {
              id: "q-ext-1",
              chapterNumber: 1,
              page: 2,
              topic: "Germination Mechanisms",
              difficulty: "extended",
              question: "Design a controlled experiment comparing moisture levels on germination rate.",
              answer: "Use 3 petri dishes with varying moisture controls.",
              marks: 5,
            },
          ],
        },
      ],
      rubric: [
        {
          criteria: "Accuracy",
          marks: 9,
          description: "Full points for evidence-grounded responses",
        },
      ],
      answerKey: [
        {
          questionId: "q-easy-1",
          questionText: "What triggers initial seed sprouting?",
          modelAnswer: "Moisture and warmth",
          markingGuide: "1 mark for option A",
        },
        {
          questionId: "q-med-1",
          questionText: "Why do dry seeds remain dormant?",
          modelAnswer: "Enzymes are inactive without hydration.",
          markingGuide: "3 marks for enzyme hydration link",
        },
        {
          questionId: "q-ext-1",
          questionText: "Design a controlled experiment comparing moisture levels on germination rate.",
          modelAnswer: "Use 3 petri dishes with varying moisture controls.",
          markingGuide: "5 marks for variables and control setup",
        },
      ],
    },
    revisionSheets: {
      quickNotes: [
        {
          chapterNumber: 1,
          title: "Plant and Animal Life",
          lines: ["Seeds require moisture to awaken."],
        },
      ],
      memoryDigest: [
        {
          chapterNumber: 1,
          terms: [{ term: "Pheromone", meaning: "Chemical messenger" }],
          tips: ["Warm Water Awakens Seeds"],
        },
      ],
      onePageCheatSheet: {
        title: "Master Cheat Sheet: Our Living Environment",
        summaryLines: ["Comprehensive synthesis across foundational ecology."],
        coreRules: ["Living systems require water and energy transfers."],
        examWarnings: ["Do not confuse dormany with seed death."],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (pkgApi.fetchLearningPackage as jest.Mock).mockResolvedValue(mockPkg);
    (pkgApi.refreshLearningPackage as jest.Mock).mockResolvedValue(mockPkg);
  });

  it("renders modal header and default roadmap tab with provided package", () => {
    render(
      <MasterLearningPackageModal
        bookId="evs-class-5"
        onClose={jest.fn()}
        initialPackage={mockPkg}
      />,
    );

    expect(screen.getByText("Master Learning Package")).toBeInTheDocument();
    expect(screen.getByText("Our Living Environment")).toBeInTheDocument();
    expect(screen.getByText("116 Pages • 1 Ready Pages")).toBeInTheDocument();

    // Roadmap content
    expect(screen.getByText("Chapter 1: Plant and Animal Life")).toBeInTheDocument();
    expect(screen.getByText("Germination is required before roots extend")).toBeInTheDocument();
  });

  it("navigates across tabs correctly", async () => {
    render(
      <MasterLearningPackageModal
        bookId="evs-class-5"
        onClose={jest.fn()}
        initialPackage={mockPkg}
      />,
    );

    // 1. Chapter Study Notes
    fireEvent.click(screen.getByRole("button", { name: /Chapter Study Notes/i }));
    expect(screen.getByText("Page 2 • How Seeds Sprout")).toBeInTheDocument();
    expect(screen.getByText("Seeds awaken with water and warmth.")).toBeInTheDocument();

    // 2. Question Bank
    fireEvent.click(screen.getByRole("button", { name: /Question Bank/i }));
    expect(screen.getByText("What triggers initial seed sprouting?")).toBeInTheDocument();

    // Toggle reveal answer
    const revealBtn = screen.getAllByText(/Reveal Model Answer/i)[0];
    fireEvent.click(revealBtn);
    expect(screen.getByText(/Model Answer:/i)).toBeInTheDocument();

    // 3. Mock Examination
    fireEvent.click(screen.getByRole("button", { name: /Mock Examination/i }));
    expect(screen.getByText("Summative Environment Assessment")).toBeInTheDocument();
    expect(screen.getByText(/9 Marks Total/i)).toBeInTheDocument();

    // Toggle Rubric & Answer Key
    fireEvent.click(screen.getByRole("button", { name: /View Scoring Rubric/i }));
    expect(screen.getByText("Assessment Grading Rubric")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /View Full Answer Key/i }));
    expect(screen.getByText("Complete Model Answer Key & Marking Guide")).toBeInTheDocument();

    // 4. Memory & Cheat Sheet
    fireEvent.click(screen.getByRole("button", { name: /Memory & Cheat Sheet/i }));
    expect(screen.getByText("Master Cheat Sheet: Our Living Environment")).toBeInTheDocument();
    expect(screen.getByText(/Warm Water Awakens Seeds/i)).toBeInTheDocument();
    expect(screen.getByText(/Seeds in cold water fail to sprout/i)).toBeInTheDocument();

    // 5. Printable Package
    fireEvent.click(screen.getByRole("button", { name: /Printable Package/i }));
    expect(screen.getByText("Ready for High-Quality Export & Physical Handout")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Print Master Package/i })).toBeInTheDocument();
  });

  it("triggers reload when audience selection changes", async () => {
    render(
      <MasterLearningPackageModal
        bookId="evs-class-5"
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(pkgApi.fetchLearningPackage).toHaveBeenCalledWith("evs-class-5", {
        audience: "child",
        depth: "basis",
        language: "en",
      });
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "it_professional" } });

    await waitFor(() => {
      expect(pkgApi.fetchLearningPackage).toHaveBeenCalledWith("evs-class-5", {
        audience: "it_professional",
        depth: "basis",
        language: "en",
      });
    });
  });

  it("triggers refreshLearningPackage when refresh button is clicked", async () => {
    render(
      <MasterLearningPackageModal
        bookId="evs-class-5"
        onClose={jest.fn()}
        initialPackage={mockPkg}
      />,
    );

    const refreshBtn = screen.getByRole("button", { name: /Refresh package/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(pkgApi.refreshLearningPackage).toHaveBeenCalledWith("evs-class-5", {
        audience: "child",
        depth: "basis",
        language: "en",
      });
    });
  });
});
