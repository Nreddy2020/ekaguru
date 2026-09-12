import { countSyllables, readability, splitSentences } from "./readability";

it("splits sentences on English and Devanagari stops", () => {
  expect(splitSentences("A seed sleeps. Water wakes it! Does it grow? यह बढ़ता है। हाँ।")).toHaveLength(5);
});
it("estimates syllables well enough for a grade level", () => {
  expect(countSyllables("seed")).toBe(1);
  expect(countSyllables("water")).toBe(2);
  expect(countSyllables("nourishment")).toBe(3);
  expect(countSyllables("understanding")).toBe(4);
});
it("scores a child's sentence far below a college sentence", () => {
  const child = readability("A seed is a baby plant. Give it water. It wakes up and grows.");
  const adult = readability(
    "This comparison constitutes the foundational starting point for comprehending the developmental trajectory of your individual life journey.",
  );
  expect(child.averageSentenceLength).toBeLessThan(8);
  expect(child.grade).toBeLessThan(3);
  expect(adult.longestSentence).toBeGreaterThan(15);
  expect(adult.grade).toBeGreaterThan(14);
  expect(readability("यह बढ़ता है। हाँ।", "hi").grade).toBeNull();
});
