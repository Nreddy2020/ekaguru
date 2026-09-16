import {
  fetchBookKnowledgeMap,
  fetchTopicDependencies,
  fetchRevisitGuidance,
  refreshBookKnowledgeMap,
  BookKnowledgeMap,
  TopicDependencyView,
  DiagnosticRevisitGuidance,
} from "./guru-book-map-api";

function mockResponse(status: number, body: any) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const mockBookMap: BookKnowledgeMap = {
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
          summary: "Animals have unique senses",
          keyTerms: ["Smell", "Sound"],
        },
      ],
    },
  ],
  keyTerms: [
    {
      term: "Smell",
      definition: "Sense to detect odors",
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
      targetTopicTitle: "Ant Trails",
      targetPage: 3,
      reason: "Ant communication relies on scent trails",
      strength: "essential",
    },
  ],
  generatedAt: "2026-09-16T00:00:00.000Z",
};

describe("guru-book-map-api", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    localStorage.setItem("token", "test-token");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("fetches book knowledge map without refresh flag", async () => {
    let capturedUrl = "";
    let capturedOptions: any;

    global.fetch = jest.fn(async (url: any, options: any) => {
      capturedUrl = String(url);
      capturedOptions = options;
      return mockResponse(200, mockBookMap);
    }) as any;

    const result = await fetchBookKnowledgeMap("evs-class-5");
    expect(result.bookId).toBe("evs-class-5");
    expect(result.chapters).toHaveLength(1);
    expect(capturedUrl).toContain("/api/v2/guru/books/evs-class-5/map");
    expect(capturedUrl).not.toContain("refresh=1");
    expect(capturedOptions.method).toBe("GET");
    expect(capturedOptions.headers.Authorization).toBe("Bearer test-token");
  });

  it("fetches book knowledge map with refresh flag", async () => {
    let capturedUrl = "";

    global.fetch = jest.fn(async (url: any) => {
      capturedUrl = String(url);
      return mockResponse(200, mockBookMap);
    }) as any;

    const result = await fetchBookKnowledgeMap("evs-class-5", true);
    expect(result.bookId).toBe("evs-class-5");
    expect(capturedUrl).toContain("/api/v2/guru/books/evs-class-5/map?refresh=1");
  });

  it("fetches topic dependencies", async () => {
    const mockDepView: TopicDependencyView = {
      topicId: "topic-2",
      topicTitle: "Ant Trails",
      physicalPage: 3,
      prerequisites: [
        {
          topicId: "topic-1",
          topicTitle: "Animal Senses",
          page: 2,
          reason: "Foundation",
          strength: "essential",
        },
      ],
      dependents: [],
      revisitRecommendation: {
        page: 2,
        topicId: "topic-1",
        topicTitle: "Animal Senses",
        reason: "Foundation",
      },
    };

    let capturedUrl = "";
    global.fetch = jest.fn(async (url: any) => {
      capturedUrl = String(url);
      return mockResponse(200, mockDepView);
    }) as any;

    const result = await fetchTopicDependencies("evs-class-5", "topic-2");
    expect(result.topicId).toBe("topic-2");
    expect(result.prerequisites).toHaveLength(1);
    expect(capturedUrl).toContain("/api/v2/guru/books/evs-class-5/topics/topic-2/dependencies");
  });

  it("fetches revisit guidance with and without topicId", async () => {
    const mockGuidance: DiagnosticRevisitGuidance = {
      currentPage: 3,
      currentTopicTitle: "Ant Trails",
      hasPrerequisite: true,
      recommendedPage: 2,
      prerequisiteTopicId: "topic-1",
      prerequisiteTopicTitle: "Animal Senses",
      reason: "Ant trails build on smell senses.",
    };

    let capturedUrls: string[] = [];
    global.fetch = jest.fn(async (url: any) => {
      capturedUrls.push(String(url));
      return mockResponse(200, mockGuidance);
    }) as any;

    const res1 = await fetchRevisitGuidance("evs-class-5", 3);
    expect(res1.hasPrerequisite).toBe(true);
    expect(capturedUrls[0]).toContain("/api/v2/guru/books/evs-class-5/pages/3/revisit");
    expect(capturedUrls[0]).not.toContain("topicId=");

    const res2 = await fetchRevisitGuidance("evs-class-5", 3, "topic-2");
    expect(res2.recommendedPage).toBe(2);
    expect(capturedUrls[1]).toContain("/api/v2/guru/books/evs-class-5/pages/3/revisit?topicId=topic-2");
  });

  it("posts to refreshBookKnowledgeMap", async () => {
    let capturedMethod = "";
    let capturedUrl = "";

    global.fetch = jest.fn(async (url: any, options: any) => {
      capturedUrl = String(url);
      capturedMethod = options.method;
      return mockResponse(200, mockBookMap);
    }) as any;

    const result = await refreshBookKnowledgeMap("evs-class-5");
    expect(result.version).toBe("book-map-v1");
    expect(capturedUrl).toContain("/api/v2/guru/books/evs-class-5/map/refresh");
    expect(capturedMethod).toBe("POST");
  });

  it("throws descriptive error when response is not ok", async () => {
    global.fetch = jest.fn(async () =>
      mockResponse(404, { message: "Knowledge map not found for book" })
    ) as any;

    await expect(fetchBookKnowledgeMap("unknown-book")).rejects.toThrow("Knowledge map not found for book");
  });
});
