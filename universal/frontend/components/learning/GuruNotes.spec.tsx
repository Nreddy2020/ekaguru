import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GuruNotes, GuruNotesPrint } from "./GuruNotes";

const page: any = { bookId: "evs-class-5", physicalPage: 3, sourceHash: "hash", totalPages: 5, width: 10, height: 10, status: "READY", blocks: [], omittedBlockCount: 0, version: "v1" };
const view = {
  id: "n1",
  bookId: "evs-class-5",
  physicalPage: 3,
  sourceHash: "hash",
  language: "en",
  blueprint: "notes-v1",
  notes: {
    title: "I am Growing Up",
    overview: "This page is about how living things grow.",
    objectives: ["Say what a seed needs to grow"],
    topics: [
      {
        id: "t1",
        heading: "A seed is a baby plant",
        evidenceIds: ["b1"],
        explanation: ["A seed is a plant waiting to wake up.", "Give it water and it starts to grow."],
        keyTerms: [{ term: "seed", meaning: "the part of a plant that can grow into a new plant", example: "a bean you soak overnight" }],
        example: { situation: "Soaking chana in a wet cloth", explanation: "A white root appears after two days." },
        rememberTip: "Seed, water, sun.",
        commonDoubts: [{ question: "Does a stone grow?", answer: "No, a stone is not alive." }],
        checkYourself: [{ question: "Name two things a seed needs.", answer: "Water and sunlight." }],
      },
    ],
    summary: ["Living things grow."],
    omitted: [],
    language: "en",
    sourceHash: "hash",
    blueprint: "notes-v1",
  },
  extensions: [{ id: "x0", topicId: "t1", question: "Why is the root first?", answer: "It looks for water.", evidenceIds: ["b1"], beyondPage: true, createdAt: "" }],
  createdAt: "",
};

beforeEach(() => localStorage.setItem("token", "t"));
afterEach(() => localStorage.clear());

it("shows the teacher's notes topic by topic, reveals answers and adds a reader's question to the notes", async () => {
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
  render(<GuruNotes page={page} language="en" learnerId="learner-1" onLoaded={onLoaded} />);
  expect(screen.getByTestId("notes-stage")).toHaveTextContent("preparing the notes for page 3");
  await screen.findByTestId("guru-notes");
  expect(onLoaded).toHaveBeenLastCalledWith(expect.objectContaining({ id: "n1" }));
  expect(screen.getByText("1. A seed is a baby plant")).toBeInTheDocument();
  expect(screen.getByText(/the part of a plant that can grow/)).toBeInTheDocument();
  expect(screen.getByText("Does a stone grow?")).toBeInTheDocument();
  // An earlier reader's question is already part of the notes, marked when it goes beyond the page.
  expect(screen.getAllByTestId("notes-extension")).toHaveLength(1);
  expect(screen.getByText(/goes beyond what this page says/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show answer" }));
  expect(screen.getByTestId("check-answer")).toHaveTextContent("Water and sunlight.");
  fireEvent.change(screen.getByLabelText("Ask about A seed is a baby plant"), { target: { value: "How is a baby plant born?" } });
  fireEvent.click(screen.getByRole("button", { name: "Ask Guru" }));
  await waitFor(() => expect(screen.getAllByTestId("notes-extension")).toHaveLength(2));
  expect(calls[1]).toMatchObject({ body: { language: "en", topicId: "t1", question: "How is a baby plant born?", learnerId: "learner-1" } });
  expect(screen.getByText("From a seed that drinks water.")).toBeInTheDocument();
});

it("reports a preparation failure with a retry", async () => {
  global.fetch = jest.fn(async () => ({ ok: false, status: 503, json: async () => ({ message: "Guru's daily provider quota is exhausted for this model." }) })) as any;
  render(<GuruNotes page={page} language="en" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("daily provider quota");
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
});

it("renders print-ready notes with every topic, its questions and the summary", () => {
  render(<GuruNotesPrint view={view as any} />);
  const print = screen.getByTestId("guru-notes-print");
  expect(print).toHaveTextContent("1. A seed is a baby plant");
  expect(print).toHaveTextContent("Why is the root first?");
  expect(print).toHaveTextContent("(Goes beyond this page.)");
  expect(print).toHaveTextContent("In short");
});
