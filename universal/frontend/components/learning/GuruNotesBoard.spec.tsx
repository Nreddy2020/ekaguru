import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GuruNotesBoard, GuruNotesPrint, cropStyle } from "./GuruNotesBoard";

const page: any = {
  bookId: "evs-class-5",
  physicalPage: 3,
  sourceHash: "hash",
  totalPages: 5,
  width: 1000,
  height: 2000,
  status: "READY",
  imageUrl: "/api/v2/textbooks/evs-class-5/pages/3/image?v=abc",
  blocks: [
    { blockId: "b1", physicalPageNumber: 3, text: "Living things", type: "heading", confidence: 1, readingOrderIndex: 0, bbox: { x: 100, y: 100, width: 300, height: 100 }, words: [] },
    { blockId: "b2", physicalPageNumber: 3, text: "A plant", type: "paragraph", confidence: 1, readingOrderIndex: 1, bbox: { x: 100, y: 250, width: 400, height: 250 }, words: [] },
  ],
  omittedBlockCount: 0,
  version: "v1",
};
const view = {
  id: "n1",
  bookId: "evs-class-5",
  physicalPage: 3,
  sourceHash: "hash",
  language: "en",
  blueprint: "notes-v3",
  notes: {
    title: "I am Growing Up",
    subtitle: "Exploring living things around us",
    closingLine: "Living things grow and make the world alive. Let's care for them!",
    overview: "This page is about how living things grow.",
    objectives: ["Say what a seed needs to grow"],
    topics: [
      {
        id: "t1",
        heading: "A seed is a baby plant",
        icon: "🌱",
        keyPoints: ["A seed is a baby plant.", "It needs water.", "The root comes first."],
        evidenceIds: ["b1", "b2"],
        lookAt: "Look at the small plant drawn beside the heading.",
        hook: "Close your eyes. Picture a tiny seed in your hand.",
        bigIdea: "A seed is a baby plant waiting for water.",
        explanation: ["A seed is a plant waiting to wake up.", "Give it water and it starts to grow.", "Soon a shoot reaches for the light."],
        steps: ["The seed drinks water.", "A root pushes down.", "A shoot pushes up."],
        chain: [{ label: "Seed", emoji: "🌰" }, { label: "Sprout", emoji: "🌱" }, { label: "Plant", emoji: "🌿" }],
        didYouKnow: "Some seeds can sleep for hundreds of years.",
        quiz: { question: "What does a seed need first?", options: ["Water", "A blanket", "Music"], answerIndex: 0, why: "Water wakes the seed up." },
        diagram: [{ id: "shape-0", type: "circle", x: 200, y: 700, radius: 40, color: "yellow" }],
        keyTerms: [{ term: "seed", meaning: "the part of a plant that can grow into a new plant", example: "a bean you soak overnight" }],
        example: { situation: "Soaking chana in a wet cloth", explanation: "A white root appears after two days." },
        tryNow: { title: "Grow a seed on a wet cloth", steps: ["Put three chana seeds on a wet cloth.", "Keep it wet for three days."], whatToNotice: "A white root comes out first." },
        rememberTip: "Seed, water, sun.",
        commonDoubts: [{ question: "Does a stone grow?", answer: "No, a stone is not alive." }],
        checkYourself: [{ question: "Name two things a seed needs.", answer: "Water and sunlight." }],
      },
    ],
    summary: ["Living things grow."],
    omitted: [],
    language: "en",
    sourceHash: "hash",
    blueprint: "notes-v3",
  },
  extensions: [{ id: "x0", topicId: "t1", question: "Why is the root first?", answer: "It looks for water.", evidenceIds: ["b1"], beyondPage: true, createdAt: "" }],
  createdAt: "",
};

beforeEach(() => localStorage.setItem("token", "t"));
afterEach(() => {
  localStorage.clear();
  delete (window as any).speechSynthesis;
  delete (window as any).SpeechSynthesisUtterance;
});

describe("page crops", () => {
  it("cuts the cited region out of the scanned page with padding, in page proportions", () => {
    const crop = cropStyle(page, ["b1", "b2"])!;
    // Union 100..500 by 100..500 with 3% of 2000 = 60 padding: 40..560 by 40..560.
    expect(crop.whole).toBe(false);
    expect(crop.style.aspectRatio).toBe("520 / 520");
    expect(crop.style.backgroundImage).toContain("http://127.0.0.1:20000/api/v2/textbooks/evs-class-5/pages/3/image?v=abc");
    expect(crop.style.backgroundSize).toBe(1000 / 520 * 100 + "% " + 2000 / 520 * 100 + "%");
    expect(crop.style.backgroundPosition).toBe(40 / (1000 - 520) * 100 + "% " + 40 / (2000 - 520) * 100 + "%");
  });
  it("prefers the topic's pictures and tables when it cites them", () => {
    const crop = cropStyle({ ...page, blocks: [page.blocks[0], { ...page.blocks[1], type: "figure" }] }, ["b2"])!;
    const both = cropStyle({ ...page, blocks: [page.blocks[0], { ...page.blocks[1], type: "figure" }] }, ["b1", "b2"])!;
    // Only the figure (100..500 by 250..500, padded by 60) is framed, not the heading above it.
    expect(both.style.aspectRatio).toBe(crop.style.aspectRatio);
    expect(both.style.aspectRatio).toBe("520 / 370");
  });
  it("shows the whole page when the topic spans most of it, and nothing without an image", () => {
    const wide = { ...page, blocks: [{ ...page.blocks[0], bbox: { x: 0, y: 0, width: 1000, height: 1900 } }] };
    expect(cropStyle(wide, ["b1"])!.whole).toBe(true);
    expect(cropStyle(wide, ["b1"])!.style.backgroundPosition).toBe("0% 0%");
    expect(cropStyle({ ...page, imageUrl: undefined }, ["b1"])).toBeNull();
  });
});

it("puts the teacher's notes on the board with the book's picture, a drawing, an activity, and grows them with a question", async () => {
  const calls: { url: string; body?: any }[] = [];
  global.fetch = jest.fn(async (url: any, init: any) => {
    const u = String(url);
    calls.push({ url: u, body: init?.body ? JSON.parse(init.body) : undefined });
    if (u.endsWith("/pages/3/notes")) return { ok: true, status: 200, json: async () => view };
    if (u.endsWith("/notes/questions"))
      return { ok: true, status: 201, json: async () => ({ extension: { id: "x1", topicId: "t1", question: "How is a baby plant born?", answer: "From a seed that drinks water.", evidenceIds: ["b1"], beyondPage: false, createdAt: "" }, reused: false }) };
    return { ok: false, status: 404, json: async () => ({ message: "unexpected " + u }) };
  }) as any;
  const onLoaded = jest.fn();
  const onHighlight = jest.fn();
  render(<GuruNotesBoard page={page} language="en" depth="developing" learnerId="learner-1" onLoaded={onLoaded} onHighlight={onHighlight} />);
  expect(screen.getByTestId("notes-stage")).toHaveTextContent("preparing the notes");
  await screen.findByTestId("guru-notes");
  expect(onLoaded).toHaveBeenLastCalledWith(expect.objectContaining({ id: "n1" }));
  expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({ language: "en", depth: "developing" });
  expect(screen.getByTestId("guru-notes-board")).toHaveTextContent("Developing · build understanding");
  // The one-page sheet on top: banner, outcomes, starting point, learning ladder, takeaways, remember, check, closing line.
  const poster = screen.getByTestId("notes-poster");
  expect(poster).toHaveTextContent("Exploring living things around us");
  expect(poster).toHaveTextContent("Learning outcomes");
  expect(poster).toHaveTextContent("Learning ladder");
  expect(poster).toHaveTextContent("Step 1");
  expect(poster).toHaveTextContent("The root comes first.");
  expect(poster).toHaveTextContent("Key takeaways");
  expect(poster).toHaveTextContent("Remember");
  expect(poster).toHaveTextContent("Check your understanding");
  expect(poster).toHaveTextContent("Let's care for them!");
  const scrollIntoView = jest.fn();
  (Element.prototype as any).scrollIntoView = scrollIntoView;
  fireEvent.click(screen.getByRole("button", { name: /Step 1: A seed is a baby plant/ }));
  expect(scrollIntoView).toHaveBeenCalled();
  expect(screen.getByTestId("notes-read-more")).toBeInTheDocument();
  const crop = screen.getByTestId("notes-page-crop");
  expect(crop).toHaveTextContent("From your textbook");
  expect(crop).toHaveTextContent("Look at the small plant");
  fireEvent.click(screen.getByRole("img", { name: /part of the page for A seed is a baby plant/ }));
  expect(onHighlight).toHaveBeenCalledWith(["b1", "b2"]);
  expect(screen.getByTestId("notes-diagram")).toBeInTheDocument();
  expect(screen.getByTestId("notes-try-now")).toHaveTextContent("Put three chana seeds on a wet cloth.");
  // Children's parts: a scene, one big idea, a picture chain, steps, a fun fact and a quiz that answers back.
  expect(screen.getByTestId("notes-hook")).toHaveTextContent("Picture a tiny seed");
  expect(screen.getByTestId("notes-big-idea")).toHaveTextContent("A seed is a baby plant waiting for water.");
  expect(screen.getByTestId("notes-chain")).toHaveTextContent("Seed");
  expect(screen.getByTestId("notes-steps")).toHaveTextContent("A root pushes down.");
  expect(screen.getByTestId("notes-did-you-know")).toHaveTextContent("hundreds of years");
  fireEvent.click(screen.getByRole("button", { name: "B. A blanket" }));
  expect(screen.getByTestId("quiz-result")).toHaveTextContent("Not quite. The answer is A. Water wakes the seed up.");
  expect(screen.getByRole("button", { name: "A. Water" })).toHaveAttribute("data-state", "right");
  expect(screen.getByText(/the part of a plant that can grow/)).toBeInTheDocument();
  expect(screen.getAllByTestId("notes-extension")).toHaveLength(1);
  expect(screen.getByText(/goes beyond what this page says/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show answer" }));
  expect(screen.getByTestId("check-answer")).toHaveTextContent("Water and sunlight.");
  fireEvent.change(screen.getByLabelText("Ask about A seed is a baby plant"), { target: { value: "How is a baby plant born?" } });
  fireEvent.click(screen.getByRole("button", { name: "Ask Guru" }));
  await waitFor(() => expect(screen.getAllByTestId("notes-extension")).toHaveLength(2));
  expect(calls[1]).toMatchObject({ body: { language: "en", depth: "developing", topicId: "t1", question: "How is a baby plant born?", learnerId: "learner-1" } });
  // Without speech synthesis there is nothing to read aloud, so no reading controls appear.
  expect(screen.queryByRole("button", { name: "Read the notes to me" })).toBeNull();
});

it("reads a topic aloud through the orb when the browser can speak, and stops on request", async () => {
  const spoken: any[] = [];
  (window as any).SpeechSynthesisUtterance = function (this: any, text: string) {
    this.text = text;
  };
  (window as any).speechSynthesis = { cancel: jest.fn(), speak: jest.fn((u: any) => spoken.push(u)), getVoices: () => [] };
  global.fetch = jest.fn(async (url: any) => {
    const u = String(url);
    if (u.endsWith("/pages/3/notes")) return { ok: true, status: 200, json: async () => view };
    return { ok: false, status: 404, json: async () => ({ message: "unexpected " + u }) };
  }) as any;
  render(<GuruNotesBoard page={page} language="en" />);
  await screen.findByTestId("guru-notes");
  fireEvent.click(screen.getByRole("button", { name: "Read this to me" }));
  expect(spoken).toHaveLength(1);
  expect(spoken[0].text).toMatch(/^A seed is a baby plant Close your eyes\. Picture a tiny seed in your hand\. The big idea: A seed is a baby plant waiting for water\. A seed is a plant waiting/);
  expect(spoken[0].text).toMatch(/Step 2: A root pushes down\./);
  expect(spoken[0].text).toMatch(/Did you know\? Some seeds/);
  expect(spoken[0].lang).toBe("en-IN");
  act(() => spoken[0].onstart());
  expect(screen.getByTestId("orb-status")).toHaveTextContent("Speaking…");
  expect(screen.getByTestId("guru-orb")).toHaveAttribute("data-state", "speaking");
  fireEvent.click(screen.getByRole("button", { name: "Stop reading" }));
  expect((window as any).speechSynthesis.cancel).toHaveBeenCalled();
  expect(screen.queryByTestId("orb-status")).toBeNull();
});

it("reports a preparation failure with a retry and renders print-ready notes", async () => {
  global.fetch = jest.fn(async () => ({ ok: false, status: 503, json: async () => ({ message: "Guru's daily provider quota is exhausted for this model." }) })) as any;
  render(<GuruNotesBoard page={page} language="en" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("daily provider quota");
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  render(<GuruNotesPrint view={view as any} />);
  const print = screen.getByTestId("guru-notes-print");
  expect(print).toHaveTextContent("Try this now: Grow a seed on a wet cloth");
  expect(print).toHaveTextContent("On the page: Look at the small plant");
  expect(print).toHaveTextContent("(Goes beyond this page.)");
});
