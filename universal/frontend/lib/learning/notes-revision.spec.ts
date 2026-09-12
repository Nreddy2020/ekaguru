import { flashCards, memoryNotes, onePage, questionBank, quickNotes } from "./notes-revision";

const view: any = {
  id: "n1",
  bookId: "evs-class-5",
  physicalPage: 3,
  sourceHash: "h",
  language: "en",
  blueprint: "notes-v3",
  notes: {
    title: "I am Growing Up",
    overview: "This page is about how living things grow. It matters because you are growing too! By the end you will explain growth.",
    objectives: ["Say what living things need"],
    topics: [
      {
        id: "t1",
        heading: "Living things",
        evidenceIds: ["b1"],
        lookAt: "Look at the plant.",
        explanation: ["Living things breathe, eat and grow. That is what makes them alive! Stones do none of this.", "Second paragraph.", "Third paragraph."],
        diagram: [],
        keyTerms: [{ term: "breathe", meaning: "to take air in and let it out", example: "your chest moving" }],
        example: { situation: "A puppy", explanation: "It grows every month." },
        tryNow: { title: "Breathe and feel", steps: ["Put a hand on your chest.", "Breathe in and out."], whatToNotice: "Your hand moves." },
        didYouKnow: "A blue whale's heart is as big as a small car.",
        bigIdea: "Living things breathe, eat and grow.",
        rememberTip: "Breathe, eat, grow: alive!",
        quiz: { question: "Which one is alive?", options: ["A stone", "A puppy", "A chair"], answerIndex: 1, why: "A puppy breathes, eats and grows." },
        commonDoubts: [{ question: "Do plants breathe?", answer: "Yes, through tiny holes in their leaves." }],
        checkYourself: [{ question: "Name two things living things do.", answer: "Breathe and grow." }],
      },
    ],
    summary: ["Living things breathe, eat and grow.", "Non-living things do not."],
    omitted: [],
    language: "en",
    sourceHash: "h",
    blueprint: "notes-v3",
  },
  extensions: [{ id: "x1", topicId: "t1", question: "How is a baby plant born?", answer: "From a seed that drinks water.", evidenceIds: ["b1"], beyondPage: true, createdAt: "" }],
  createdAt: "",
};

it("derives quick notes with one line per topic", () => {
  const q = quickNotes(view);
  expect(q.topics).toEqual([{ id: "t1", heading: "Living things", line: "Living things breathe, eat and grow." }]);
  expect(q.summary).toHaveLength(2);
});
it("collects the words, tricks and must-remember points into memory notes", () => {
  const m = memoryNotes(view);
  expect(m.terms[0]).toMatchObject({ term: "breathe", topic: "Living things" });
  expect(m.tips[0].tip).toMatch(/alive!/);
  expect(m.facts).toEqual(["A blue whale's heart is as big as a small car."]);
  expect(m.mustRemember).toHaveLength(3);
});
it("turns words, checks, doubts and readers' questions into flash cards in that order", () => {
  const cards = flashCards(view);
  expect(cards.map((c) => c.kind)).toEqual(["term", "quiz", "check", "doubt", "asked"]);
  expect(cards[0].front).toBe('What does "breathe" mean?');
  expect(cards[1].back).toBe("B. A puppy A puppy breathes, eats and grows.");
  expect(cards[4].back).toMatch(/goes beyond the page/);
});
it("sorts the question bank by difficulty with answers", () => {
  const bank = questionBank(view);
  expect(bank.easy[0].question).toMatch(/^Which one is alive\? \(A\. A stone, B\. A puppy, C\. A chair\)$/);
  expect(bank.easy[1]).toMatchObject({ question: "Name two things living things do.", answer: "Breathe and grow." });
  expect(bank.medium[0].question).toBe("Do plants breathe?");
  expect(bank.extended[0].question).toBe("How is a baby plant born?");
});
it("fits the essentials on one page", () => {
  const sheet = onePage(view);
  expect(sheet.whatItIsAbout).toBe("This page is about how living things grow.");
  expect(sheet.terms).toEqual([{ term: "breathe", meaning: "to take air in and let it out" }]);
  expect(sheet.tryNow).toEqual(["Breathe and feel"]);
  expect(sheet.questions).toHaveLength(3);
});
