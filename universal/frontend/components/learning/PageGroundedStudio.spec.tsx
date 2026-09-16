import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { LocalBookSourceStore } from "../../lib/learning/local-book-source";
import { PageGroundedStudio } from "./PageGroundedStudio";
const source = {
  version: "page-evidence-v1",
  bookId: "maths-class-5",
  physicalPage: 1,
  totalPages: 3,
  sourceHash: "one",
  width: 800,
  height: 1000,
  imageDataUrl: "data:image/png;base64,",
  status: "READY",
  omittedBlockCount: 0,
  blocks: [
    {
      blockId: "b1",
      physicalPageNumber: 1,
      text: "A triangle contains three sides.",
      type: "paragraph",
      confidence: 0.9,
      readingOrderIndex: 1,
      bbox: { x: 10, y: 20, width: 100, height: 30 },
    },
  ],
};
afterEach(() => jest.restoreAllMocks());
beforeEach(() => {
  // Most of these tests exercise the live classroom, which now sits behind a switch.
  localStorage.setItem("guru.boardMode", "live");
});
it("requests exact book identity and renders the sourced board", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => source });
  render(<PageGroundedStudio bookId="maths-class-5" />);
  await screen.findByTestId("page-teaching-board");
  expect(String((fetch as jest.Mock).mock.calls[0][0])).toContain(
    "/textbooks/maths-class-5/pages/1/evidence",
  );
  expect(screen.queryByText(/BKT Confirmed/)).not.toBeInTheDocument();
});
it("rejects mismatched pages instead of showing a fallback lesson", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ...source, physicalPage: 46 }),
  });
  render(<PageGroundedStudio bookId="maths-class-5" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("does not match");
  expect(screen.queryByTestId("page-teaching-board")).not.toBeInTheDocument();
});
it("ignores a slow response for the previous book", async () => {
  let resolveOld: any;
  global.fetch = jest
    .fn()
    .mockImplementationOnce(() => new Promise((r) => (resolveOld = r)))
    .mockResolvedValue({
      ok: true,
      json: async () => ({ ...source, bookId: "science-class-6" }),
    });
  const view = render(<PageGroundedStudio bookId="maths-class-5" />);
  view.rerender(<PageGroundedStudio bookId="science-class-6" />);
  await screen.findByTestId("page-teaching-board");
  resolveOld({ ok: true, json: async () => source });
  await waitFor(() =>
    expect(screen.getByText("science-class-6")).toBeInTheDocument(),
  );
  expect(screen.queryByText("maths-class-5")).not.toBeInTheDocument();
});
it("stops at a checkpoint until a correct recall answer", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => source });
  render(<PageGroundedStudio bookId="maths-class-5" />);
  await screen.findByTestId("page-teaching-board");
  for (let i = 0; i < 4; i++)
    fireEvent.click(screen.getByRole("button", { name: /^Next$/ }));
  expect(screen.getByRole("button", { name: /^Next$/ })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Missing word"), {
    target: { value: "triangle" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
  expect(screen.getByRole("button", { name: /^Next$/ })).not.toBeDisabled();
});

it("keeps the approved classroom and recovery action for a metadata-only local upload", async () => {
  jest.spyOn(LocalBookSourceStore, "get").mockResolvedValue(undefined);
  global.fetch = jest.fn();
  render(<PageGroundedStudio bookId="book-1788352249934" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("no saved PDF");
  expect(screen.getByTestId("approved-classroom")).toBeInTheDocument();
  expect(screen.getByLabelText("Attach original PDF")).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
  expect(
    screen.queryByText("Sign in to open this textbook."),
  ).not.toBeInTheDocument();
});
it("opens the source dialog and restores focus when Escape closes it", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => source });
  render(<PageGroundedStudio bookId="maths-class-5" />);
  await screen.findByTestId("page-teaching-board");
  const open = screen.getByRole("button", { name: "View Full Page" });
  open.focus();
  fireEvent.click(open);
  expect(
    screen.getByRole("dialog", { name: "Full textbook page" }),
  ).toBeInTheDocument();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(open).toHaveFocus();
});
it("lets a signed-in parent attribute a built-in book session to an owned learner", async () => {
  localStorage.setItem("token", "parent-token");
  const plan = {
    id: "artifact-1",
    title: "Triangles",
    depth: "basis",
    language: "en",
    mode: "guru",
    sourceHash: "one",
    objectives: ["Name the parts of a triangle"],
    notes: ["A triangle has three sides."],
    coverage: ["b1"],
    actions: [
      { id: "a0", kind: "explain", text: "Three sides", speech: "A triangle has three sides.", evidenceIds: ["b1"], durationMs: 1800 },
      { id: "a1", kind: "summary", text: "Done", speech: "That is the page.", evidenceIds: ["b1"], durationMs: 1800 },
    ],
  };
  const calls: { url: string; body: any }[] = [];
  global.fetch = jest.fn(async (url: any, init: any) => {
    const u = String(url);
    calls.push({ url: u, body: init?.body ? JSON.parse(init.body) : undefined });
    if (u.includes("/guru/capabilities"))
      return { ok: true, json: async () => ({ reasoningAvailable: true, sourceReadingAvailable: true }) };
    if (u.includes("/api/v2/learners"))
      return { ok: true, json: async () => ({ data: [{ id: "child-a", name: "Asha" }, { id: "child-b", name: "Bilal" }] }) };
    if (u.includes("/context?bookId="))
      return { ok: true, json: async () => ({ recommendedDepth: u.includes("child-b") ? "developing" : null }) };
    if (u.includes("/pages/1/evidence")) return { ok: true, json: async () => source };
    if (u.includes("/pages/1/lesson")) return { ok: true, json: async () => ({ plan, page: source }) };
    if (u.includes("/sessions"))
      return {
        ok: true,
        json: async () => ({ id: "s1", artifactId: "artifact-1", learnerId: init?.body ? JSON.parse(init.body).learnerId ?? null : null, cursor: 0, revision: 0, checkpointPassed: false }),
      };
    return { ok: false, status: 404, json: async () => ({ message: "unexpected " + u }) };
  }) as any;
  try {
    render(<PageGroundedStudio bookId="maths-class-5" />);
    const selector = await screen.findByLabelText("Learner profile");
    expect(selector).toHaveValue("");
    await waitFor(() => expect(calls.some((c) => c.url.includes("/sessions"))).toBe(true));
    expect(calls.find((c) => c.url.includes("/sessions"))!.body).toEqual({});
    fireEvent.change(selector, { target: { value: "child-b" } });
    await waitFor(() =>
      expect(calls.filter((c) => c.url.includes("/sessions")).pop()!.body).toEqual({ learnerId: "child-b" }),
    );
    expect(localStorage.getItem("guru.learnerId")).toBe("child-b");
    // The learner's history in this book suggests the depth.
    await waitFor(() => expect(calls.some((c) => c.url.includes("/guru/learners/child-b/context?bookId=maths-class-5"))).toBe(true));
    await waitFor(() => expect(screen.getByRole("button", { name: "developing" })).toHaveAttribute("aria-pressed", "true"));
  } finally {
    localStorage.clear();
  }
});
it("links the textbook panel and the Guru board both ways for small screens", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => source });
  render(<PageGroundedStudio bookId="maths-class-5" />);
  await screen.findByTestId("page-teaching-board");
  expect(screen.getByRole("link", { name: /Jump to the Guru board/ })).toHaveAttribute("href", "#guru-board");
  expect(screen.getByRole("link", { name: /Back to the textbook page/ })).toHaveAttribute("href", "#textbook-source");
  expect(document.getElementById("guru-board")).not.toBeNull();
  expect(document.getElementById("textbook-source")).not.toBeNull();
  const scrollIntoView = jest.fn();
  (Element.prototype as any).scrollIntoView = scrollIntoView;
  fireEvent.click(screen.getByRole("link", { name: /Jump to the Guru board/ }));
  expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
});
it("loads server page scans from the cacheable image link instead of an inline data URL", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ...source, imageDataUrl: undefined, imageUrl: "/api/v2/textbooks/maths-class-5/pages/1/image?v=abc" }),
  });
  render(<PageGroundedStudio bookId="maths-class-5" />);
  const img = await screen.findByAltText("Original physical page 1");
  expect(img.getAttribute("src")).toMatch(/\/api\/v2\/textbooks\/maths-class-5\/pages\/1\/image\?v=abc$/);
});
it("offers to regenerate a lesson prepared before the current teaching blueprint", async () => {
  localStorage.setItem("token", "parent-token");
  const plan = {
    id: "artifact-old",
    title: "Triangles",
    depth: "basis",
    language: "en",
    mode: "guru",
    sourceHash: "one",
    notes: ["Three sides."],
    actions: [
      { id: "a0", kind: "explain", text: "Three sides", speech: "A triangle has three sides.", evidenceIds: ["b1"], durationMs: 1800 },
      { id: "a1", kind: "summary", text: "Done", speech: "That is the page.", evidenceIds: ["b1"], durationMs: 1800 },
    ],
  };
  const calls: string[] = [];
  global.fetch = jest.fn(async (url: any, init: any) => {
    const u = String(url);
    calls.push(u);
    if (u.includes("/guru/capabilities")) return { ok: true, json: async () => ({ reasoningAvailable: true, sourceReadingAvailable: true }) };
    if (u.includes("/api/v2/learners")) return { ok: true, json: async () => ({ data: [] }) };
    if (u.includes("/pages/1/evidence")) return { ok: true, json: async () => source };
    if (u.includes("/pages/1/lesson"))
      return u.includes("regenerate=1")
        ? { ok: true, status: 202, json: async () => ({ job: { id: "job-9", status: "FAILED", stage: "failed", artifactId: "x", error: "Guru's daily provider quota is exhausted for this model." } }) }
        : { ok: true, status: 200, json: async () => ({ plan, page: source, legacyBlueprint: true }) };
    if (u.includes("/sessions")) return { ok: true, json: async () => ({ id: "s1", artifactId: "artifact-old", learnerId: null, cursor: 0, revision: 0, checkpointPassed: false }) };
    return { ok: false, status: 404, json: async () => ({ message: "unexpected " + u }) };
  }) as any;
  try {
    render(<PageGroundedStudio bookId="maths-class-5" />);
    const notice = await screen.findByTestId("legacy-blueprint");
    expect(notice).toHaveTextContent("before the current teaching blueprint");
    fireEvent.click(screen.getByRole("button", { name: "Prepare it again with the new methodology" }));
    await waitFor(() => expect(calls.some((c) => c.includes("/pages/1/lesson?regenerate=1"))).toBe(true));
    await screen.findByText(/daily provider quota is exhausted/);
  } finally {
    localStorage.clear();
  }
});

it("teaches from the page's cached basis lesson while the recommended depth is prepared, then offers the new lesson", async () => {
  localStorage.setItem("token", "parent-token");
  const actions = [
    { id: "a0", kind: "explain", text: "Three sides", speech: "A triangle has three sides.", evidenceIds: ["b1"], durationMs: 1800 },
    { id: "a1", kind: "summary", text: "Done", speech: "That is the page.", evidenceIds: ["b1"], durationMs: 1800 },
  ];
  const basisPlan = { id: "artifact-basis", title: "Triangles", depth: "basis", language: "en", mode: "guru", sourceHash: "one", notes: ["Three sides."], actions };
  const developingPlan = { ...basisPlan, id: "artifact-dev", depth: "developing" };
  let developingPrepared = false;
  const calls: { url: string; depth?: string }[] = [];
  global.fetch = jest.fn(async (url: any, init: any) => {
    const u = String(url);
    const depth = init?.body ? JSON.parse(init.body).depth : undefined;
    calls.push({ url: u, depth });
    if (u.includes("/guru/capabilities")) return { ok: true, json: async () => ({ reasoningAvailable: true, sourceReadingAvailable: true }) };
    if (u.includes("/api/v2/learners")) return { ok: true, json: async () => ({ data: [] }) };
    if (u.includes("/pages/1/evidence")) return { ok: true, json: async () => source };
    if (u.includes("/pages/1/lesson?cachedOnly=1"))
      return depth === "basis"
        ? { ok: true, status: 200, json: async () => ({ plan: basisPlan, page: source }) }
        : { ok: true, status: 204, json: async () => { throw new Error("no body"); } };
    if (u.includes("/pages/1/lesson")) {
      if (depth === "developing" && !developingPrepared) {
        developingPrepared = true;
        return { ok: true, status: 202, json: async () => ({ job: { id: "job-2", status: "DONE", stage: "done", artifactId: "artifact-dev" } }) };
      }
      return { ok: true, status: 200, json: async () => ({ plan: depth === "developing" ? developingPlan : basisPlan, page: source }) };
    }
    if (u.includes("/sessions")) return { ok: true, json: async () => ({ id: "s1", artifactId: "x", learnerId: null, cursor: 0, revision: 0, checkpointPassed: false }) };
    return { ok: false, status: 404, json: async () => ({ message: "unexpected " + u }) };
  }) as any;
  try {
    render(<PageGroundedStudio bookId="maths-class-5" />);
    await screen.findByTestId("page-teaching-board");
    fireEvent.click(screen.getByRole("button", { name: "developing" }));
    const notice = await screen.findByTestId("depth-fallback");
    await waitFor(() => expect(notice).toHaveTextContent("The Developing lesson for this page is ready."));
    // The board kept teaching from the basis lesson in the meantime.
    expect(screen.getByText(/basis · Action 1\/2/)).toBeInTheDocument();
    expect(calls.filter((c) => c.url.includes("cachedOnly=1")).map((c) => c.depth)).toEqual(["basis"]);
    fireEvent.click(screen.getByRole("button", { name: "Open it" }));
    await waitFor(() => expect(screen.queryByTestId("depth-fallback")).toBeNull());
    await screen.findByText(/developing · Action 1\/2/);
  } finally {
    localStorage.clear();
  }
});

it("shows the scan and waits while a page is read for the first time, then teaches from the stored text", async () => {
  let evidenceCalls = 0;
  const calls: string[] = [];
  global.fetch = jest.fn(async (url: any) => {
    const u = String(url);
    calls.push(u);
    if (u.includes("/guru/capabilities")) return { ok: true, json: async () => ({ reasoningAvailable: false, sourceReadingAvailable: true }) };
    if (u.includes("/api/v2/learners")) return { ok: true, json: async () => ({ data: [] }) };
    if (u.includes("/pages/1/evidence")) {
      evidenceCalls++;
      return evidenceCalls === 1
        ? { ok: true, status: 202, json: async () => ({ ...source, status: "PENDING", blocks: [], job: { id: "evidence:e1", status: "QUEUED", stage: "ocr" } }) }
        : { ok: true, status: 200, json: async () => source };
    }
    return { ok: false, status: 404, json: async () => ({ message: "unexpected " + u }) };
  }) as any;
  render(<PageGroundedStudio bookId="maths-class-5" />);
  // The page is visible and the reading notice shows before any text exists.
  await screen.findByAltText("Original physical page 1");
  expect(await screen.findByTestId("evidence-reading")).toHaveTextContent("reading this scanned page for the first time");
  expect(screen.queryByTestId("page-teaching-board")).toBeNull();
  expect(screen.queryByText(/needs extraction review/)).toBeNull();
  // The next poll returns the stored text and the board opens; no lesson was requested while the text was unread.
  await screen.findByTestId("page-teaching-board", {}, { timeout: 6000 });
  expect(evidenceCalls).toBe(2);
  expect(screen.queryByTestId("evidence-reading")).toBeNull();
  expect(calls.some((c) => c.includes("/pages/1/lesson"))).toBe(false);
}, 10000);

it("shows the notes board by default, with the book's own picture, a drawing, a try-now activity and a topic question", async () => {
  localStorage.setItem("guru.boardMode", "notes");
  localStorage.setItem("token", "parent-token");
  const view = {
    id: "n1",
    bookId: "maths-class-5",
    physicalPage: 1,
    sourceHash: "one",
    language: "en",
    blueprint: "notes-v3",
    notes: {
      title: "Triangles",
      overview: "This page is about shapes with three sides and why they are everywhere.",
      objectives: ["Say what makes a triangle"],
      topics: [
        {
          id: "t1",
          heading: "What is a triangle",
          evidenceIds: ["b1"],
          lookAt: "Look at the three-sided shape at the top of the page.",
          explanation: ["A triangle has three straight sides.", "The sides meet at three corners.", "You can find one in a samosa."],
          diagram: [{ id: "shape-0", type: "line", x: 100, y: 800, x2: 900, y2: 800, color: "white" }],
          keyTerms: [{ term: "side", meaning: "a straight edge of a shape", example: "the edge of a ruler" }],
          example: { situation: "A samosa on a plate", explanation: "Its three edges make a triangle." },
          tryNow: { title: "Fold a triangle", steps: ["Take a square paper.", "Fold it corner to corner."], whatToNotice: "Two triangles appear." },
          rememberTip: "Three sides, three corners.",
          commonDoubts: [{ question: "Can a triangle have a curved side?", answer: "No, all sides are straight." }],
          checkYourself: [{ question: "How many corners?", answer: "Three." }],
        },
      ],
      summary: ["Three sides, three corners."],
      omitted: [],
      language: "en",
      sourceHash: "one",
      blueprint: "notes-v3",
    },
    extensions: [],
    createdAt: "",
  };
  const calls: { url: string; body?: any }[] = [];
  global.fetch = jest.fn(async (url: any, init: any) => {
    const u = String(url);
    calls.push({ url: u, body: init?.body ? JSON.parse(init.body) : undefined });
    if (u.includes("/guru/capabilities")) return { ok: true, json: async () => ({ reasoningAvailable: true, sourceReadingAvailable: true }) };
    if (u.includes("/api/v2/learners")) return { ok: true, json: async () => ({ data: [] }) };
    if (u.includes("/pages/1/evidence")) return { ok: true, json: async () => source };
    if (u.endsWith("/pages/1/notes")) return { ok: true, status: 200, json: async () => view };
    if (u.endsWith("/notes/questions"))
      return { ok: true, status: 201, json: async () => ({ extension: { id: "x1", topicId: "t1", question: "Why three?", answer: "Because three points make the simplest closed shape.", evidenceIds: ["b1"], beyondPage: false, createdAt: "" }, reused: false }) };
    return { ok: false, status: 404, json: async () => ({ message: "unexpected " + u }) };
  }) as any;
  try {
    render(<PageGroundedStudio bookId="maths-class-5" />);
    const board = await screen.findByTestId("guru-notes-board");
    await screen.findByTestId("guru-notes");
    expect(board).toHaveTextContent("GURU NOTES BOARD");
    expect(within(board).getByRole("heading", { name: /1\. What is a triangle/ })).toBeInTheDocument();
    expect(screen.getByTestId("notes-page-crop")).toHaveTextContent("Look at the three-sided shape");
    expect(screen.getByTestId("notes-diagram")).toBeInTheDocument();
    expect(screen.getByTestId("notes-try-now")).toHaveTextContent("Fold a triangle");
    // The live classroom is not loaded and its page-level ask box is hidden in notes mode.
    expect(screen.queryByTestId("page-teaching-board")).toBeNull();
    expect(calls.some((c) => c.url.includes("/pages/1/lesson"))).toBe(false);
    expect(screen.queryByLabelText("Ask about this page")).toBeNull();
    fireEvent.change(screen.getByLabelText("Ask about What is a triangle"), { target: { value: "Why three?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask Guru" }));
    await screen.findByTestId("notes-extension");
    expect(calls.find((c) => c.url.endsWith("/notes/questions"))?.body).toMatchObject({ topicId: "t1", question: "Why three?", language: "en", depth: "basis" });
    // The resource tabs become revision formats derived from the same notes.
    fireEvent.click(screen.getByRole("tab", { name: /Flash cards/ }));
    expect(await screen.findByTestId("revision-cards")).toHaveTextContent("Card 1 of");
    fireEvent.click(screen.getByRole("tab", { name: /One-page sheet/ }));
    expect(await screen.findByTestId("revision-one-page")).toHaveTextContent("Fold a triangle");
    // Switching to the live classroom loads the lesson path; switching back restores the notes board.
    fireEvent.click(screen.getByRole("button", { name: "Live classroom (beta)" }));
    await screen.findByTestId("live-board-switch");
    fireEvent.click(screen.getByRole("button", { name: "Back to the notes board" }));
    await screen.findByTestId("guru-notes-board");
  } finally {
    localStorage.clear();
  }
});

it("opens the book knowledge map modal from the sidebar", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => source });
  render(<PageGroundedStudio bookId="maths-class-5" physicalPage={1} />);
  await screen.findByTestId("page-teaching-board");

  const mapButton = screen.getByRole("button", { name: "Book Knowledge Map" });
  expect(mapButton).toBeInTheDocument();
  fireEvent.click(mapButton);

  expect(await screen.findByRole("dialog", { name: "Book Knowledge Map & Roadmap" })).toBeInTheDocument();
});

