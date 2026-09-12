import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { GuruRevision } from "./GuruRevision";

const view: any = {
  id: "n1",
  bookId: "evs-class-5",
  physicalPage: 3,
  sourceHash: "h",
  language: "en",
  blueprint: "notes-v3",
  notes: {
    title: "I am Growing Up",
    overview: "This page is about how living things grow.",
    objectives: ["Say what living things need"],
    topics: [
      {
        id: "t1",
        heading: "Living things",
        evidenceIds: ["b1"],
        explanation: ["Living things breathe, eat and grow.", "Second.", "Third."],
        diagram: [],
        keyTerms: [{ term: "breathe", meaning: "to take air in and let it out", example: "your chest moving" }],
        example: { situation: "A puppy", explanation: "It grows every month." },
        tryNow: { title: "Breathe and feel", steps: ["Hand on chest.", "Breathe."], whatToNotice: "It moves." },
        rememberTip: "Breathe, eat, grow: alive!",
        commonDoubts: [{ question: "Do plants breathe?", answer: "Yes, through their leaves." }],
        checkYourself: [{ question: "Name two things living things do.", answer: "Breathe and grow." }],
      },
    ],
    summary: ["Living things breathe, eat and grow."],
    omitted: [],
    language: "en",
    sourceHash: "h",
    blueprint: "notes-v3",
  },
  extensions: [],
  createdAt: "",
};

it("shows quick notes, memory notes and the one-page sheet from the same notes", () => {
  const { rerender } = render(<GuruRevision view={view} format="Quick notes" />);
  expect(screen.getByTestId("revision-quick")).toHaveTextContent("Living things. Living things breathe, eat and grow.");
  rerender(<GuruRevision view={view} format="Memory notes" />);
  expect(screen.getByTestId("revision-memory")).toHaveTextContent("breathe: to take air in and let it out");
  rerender(<GuruRevision view={view} format="One-page sheet" />);
  expect(screen.getByTestId("revision-one-page")).toHaveTextContent("Try at home");
  expect(screen.getByTestId("revision-one-page")).toHaveTextContent("(Breathe and grow.)");
});

it("flips flash cards and moves through the deck", () => {
  render(<GuruRevision view={view} format="Flash cards" />);
  expect(screen.getByTestId("revision-cards")).toHaveTextContent("Card 1 of 3 · Word");
  expect(screen.queryByTestId("flash-back")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Show answer" }));
  expect(screen.getByTestId("flash-back")).toHaveTextContent("to take air in and let it out");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByTestId("revision-cards")).toHaveTextContent("Card 2 of 3 · Check yourself");
  expect(screen.queryByTestId("flash-back")).toBeNull();
  expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
});

it("groups the question bank by difficulty and reveals answers one at a time", () => {
  render(<GuruRevision view={view} format="Question bank" />);
  const bank = screen.getByTestId("revision-bank");
  expect(bank).toHaveTextContent("Easy");
  expect(bank).toHaveTextContent("Medium");
  expect(bank).not.toHaveTextContent("Extended");
  fireEvent.click(screen.getAllByRole("button", { name: "Show answer" })[0]);
  expect(screen.getByTestId("bank-answer")).toHaveTextContent("Breathe and grow.");
});
