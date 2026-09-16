import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BookKnowledgeMapModal } from "./BookKnowledgeMapModal";
import { BookKnowledgeMap, DiagnosticRevisitGuidance } from "../../lib/learning/guru-book-map-api";

const mockMap: BookKnowledgeMap = {
  version: "book-map-v1",
  bookId: "evs-class-5",
  title: "Looking Around (EVS Class 5)",
  totalPages: 10,
  chapters: [
    {
      chapterNumber: 1,
      title: "Super Senses",
      pageStart: 1,
      pageEnd: 5,
      topics: [
        {
          topicId: "topic-1",
          title: "Animal Senses",
          physicalPage: 2,
          summary: "Animals have sharp senses.",
          keyTerms: ["Smell", "Sound"],
        },
        {
          topicId: "topic-2",
          title: "Ant Communication",
          physicalPage: 3,
          summary: "Ants leave scent trails.",
          keyTerms: ["Pheromones"],
        },
      ],
    },
  ],
  keyTerms: [
    {
      term: "Smell",
      definition: "Sense to detect scent",
      introducedOnPage: 2,
      chapterNumber: 1,
      page: 2,
    },
  ],
  dependencies: [
    {
      id: "dep-1",
      sourceTopicId: "topic-1",
      sourceTopicTitle: "Animal Senses",
      sourcePage: 2,
      targetTopicId: "topic-2",
      targetTopicTitle: "Ant Communication",
      targetPage: 3,
      reason: "Ant communication requires understanding sensory organs.",
      strength: "essential",
    },
  ],
  generatedAt: "2026-09-16T00:00:00.000Z",
};

function mockFetchResponse(status: number, body: any) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("BookKnowledgeMapModal", () => {
  const onSelectPageMock = jest.fn();
  const onCloseMock = jest.fn();
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = global.fetch;
    localStorage.setItem("token", "test-token");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
  });

  it("renders roadmap with chapters and topics", () => {
    render(
      <BookKnowledgeMapModal
        bookId="evs-class-5"
        currentPage={2}
        onClose={onCloseMock}
        onSelectPage={onSelectPageMock}
        initialMap={mockMap}
      />
    );

    expect(screen.getByText("Super Senses")).toBeInTheDocument();
    expect(screen.getByText("Animal Senses")).toBeInTheDocument();
    expect(screen.getByText("Ant Communication")).toBeInTheDocument();
    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
  });

  it("navigates to page when clicking topic page button", () => {
    render(
      <BookKnowledgeMapModal
        bookId="evs-class-5"
        currentPage={1}
        onClose={onCloseMock}
        onSelectPage={onSelectPageMock}
        initialMap={mockMap}
      />
    );

    const page2Button = screen.getByText("Page 2");
    fireEvent.click(page2Button);

    expect(onSelectPageMock).toHaveBeenCalledWith(2);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("switches to dependencies tab and displays dependency links", () => {
    render(
      <BookKnowledgeMapModal
        bookId="evs-class-5"
        currentPage={1}
        onClose={onCloseMock}
        onSelectPage={onSelectPageMock}
        initialMap={mockMap}
      />
    );

    const depTab = screen.getByText("Dependencies");
    fireEvent.click(depTab);

    expect(
      screen.getByText("Ant communication requires understanding sensory organs.")
    ).toBeInTheDocument();
    expect(screen.getByText("essential")).toBeInTheDocument();

    const goToPrereqBtn = screen.getByText("Go to Prerequisite (p. 2)");
    fireEvent.click(goToPrereqBtn);

    expect(onSelectPageMock).toHaveBeenCalledWith(2);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("switches to struggle guidance tab and displays diagnostic revisit recommendations", async () => {
    const mockGuidance: DiagnosticRevisitGuidance = {
      currentPage: 3,
      currentTopicTitle: "Ant Communication",
      hasPrerequisite: true,
      recommendedPage: 2,
      prerequisiteTopicId: "topic-1",
      prerequisiteTopicTitle: "Animal Senses",
      reason: "Ant communication builds on animal senses.",
    };

    global.fetch = jest.fn(async (url: any) => {
      const sUrl = String(url);
      if (sUrl.includes("/revisit")) {
        return mockFetchResponse(200, mockGuidance);
      }
      return mockFetchResponse(200, mockMap);
    }) as any;

    render(
      <BookKnowledgeMapModal
        bookId="evs-class-5"
        currentPage={3}
        onClose={onCloseMock}
        onSelectPage={onSelectPageMock}
        initialMap={mockMap}
      />
    );

    const revisitTab = screen.getByText("Struggle Guidance");
    fireEvent.click(revisitTab);

    await waitFor(() => {
      expect(
        screen.getByText("Struggling on Page 3? Revisit Page 2")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Ant communication builds on animal senses.")
    ).toBeInTheDocument();

    const jumpButton = screen.getByText("Jump to Prerequisite (Page 2)");
    fireEvent.click(jumpButton);

    expect(onSelectPageMock).toHaveBeenCalledWith(2);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("switches to key terms tab and filters terms", () => {
    render(
      <BookKnowledgeMapModal
        bookId="evs-class-5"
        currentPage={1}
        onClose={onCloseMock}
        onSelectPage={onSelectPageMock}
        initialMap={mockMap}
      />
    );

    const glossaryTab = screen.getByText("Key Terms");
    fireEvent.click(glossaryTab);

    expect(screen.getByText("Smell")).toBeInTheDocument();
    expect(screen.getByText("Sense to detect scent")).toBeInTheDocument();
  });
});
