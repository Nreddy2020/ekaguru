/**
 * Readability for children's notes. English gets a Flesch-Kincaid grade estimate with a syllable
 * heuristic; every language gets sentence-length statistics. The validator uses both so that a
 * Class 5 child is not handed a college paragraph.
 */
export interface Readability {
  sentences: number;
  words: number;
  averageSentenceLength: number;
  longestSentence: number;
  /** Flesch-Kincaid grade level; null for languages other than English. */
  grade: number | null;
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.replace(/[^\p{L}\p{N}]/gu, "").length > 0);
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const stripped = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = stripped.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function readability(text: string, language = "en"): Readability {
  const sentences = splitSentences(text);
  const words = sentences.flatMap((s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)));
  const lengths = sentences.map((s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length);
  const result: Readability = {
    sentences: sentences.length,
    words: words.length,
    averageSentenceLength: sentences.length ? words.length / sentences.length : 0,
    longestSentence: lengths.length ? Math.max(...lengths) : 0,
    grade: null,
  };
  if (language.toLowerCase().startsWith("en") && sentences.length && words.length) {
    const syllables = words.reduce((n, w) => n + countSyllables(w), 0);
    result.grade = Math.round((0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59) * 10) / 10;
  }
  return result;
}
