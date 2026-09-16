import { fetchLearningPackage, refreshLearningPackage } from "./guru-learning-package-api";
import * as guruApi from "./guru-api";

jest.mock("./guru-api", () => ({
  guruFetch: jest.fn(),
  guruRequest: jest.fn(),
}));

describe("GuruLearningPackage API Client", () => {
  const mockPkg = {
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
      readyPagesCount: 2,
      generatedAt: "2026-09-16T00:00:00Z",
    },
    roadmap: [],
    conceptMap: { topics: [], dependencies: [] },
    chapterNotes: [],
    examplesAndScenarios: [],
    mistakesAndTroubleshooting: [],
    memoryTricks: [],
    exercisesAndLabs: [],
    questionBank: { easy: [], medium: [], extended: [] },
    mockTest: {
      title: "Mock Test",
      totalMarks: 10,
      timeBudgetMinutes: 30,
      instructions: [],
      sections: [],
      rubric: [],
      answerKey: [],
    },
    revisionSheets: {
      quickNotes: [],
      memoryDigest: [],
      onePageCheatSheet: {
        title: "Cheat Sheet",
        summaryLines: [],
        coreRules: [],
        examWarnings: [],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches learning package with correct query string parameters", async () => {
    (guruApi.guruFetch as jest.Mock).mockResolvedValue({
      status: 200,
      data: mockPkg,
    });

    const result = await fetchLearningPackage("evs-class-5", {
      language: "hi",
      depth: "proficient",
      audience: "school_student",
      refresh: true,
    });

    expect(result).toEqual(mockPkg);
    expect(guruApi.guruFetch).toHaveBeenCalledWith(
      "/api/v2/guru/books/evs-class-5/learning-package?language=hi&depth=proficient&audience=school_student&refresh=1",
      undefined,
      undefined,
    );
  });

  it("throws error when fetchLearningPackage encounters non-200 status", async () => {
    (guruApi.guruFetch as jest.Mock).mockResolvedValue({
      status: 500,
      data: null,
    });

    await expect(
      fetchLearningPackage("evs-class-5"),
    ).rejects.toThrow("Failed to load master learning package: HTTP 500");
  });

  it("triggers refreshLearningPackage via POST endpoint", async () => {
    (guruApi.guruRequest as jest.Mock).mockResolvedValue(mockPkg);

    const result = await refreshLearningPackage("evs-class-5", {
      language: "en",
      depth: "basis",
      audience: "child",
    });

    expect(result).toEqual(mockPkg);
    expect(guruApi.guruRequest).toHaveBeenCalledWith(
      "/api/v2/guru/books/evs-class-5/learning-package/refresh?language=en&depth=basis&audience=child",
      {},
      undefined,
    );
  });
});
