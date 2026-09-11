import { ExtractedBlock } from "./document-extractor.interface";

/** Reconstruct text runs on the same baseline; coordinates come from PDF.js, not guessed page slices. */
export function nativePdfBlocks(
  items: any[],
  viewport: any,
  pageNumber: number,
): ExtractedBlock[] {
  const lines: { text: string; box: number[]; height: number }[] = [];
  for (const item of items) {
    if (
      typeof item.str !== "string" ||
      !item.str.trim() ||
      !Array.isArray(item.transform)
    )
      continue;
    const box = viewport.convertToViewportRectangle([
      item.transform[4],
      item.transform[5],
      item.transform[4] + item.width,
      item.transform[5] + Math.abs(item.height),
    ]);
    const bounds = [
      Math.min(box[0], box[2]),
      Math.min(box[1], box[3]),
      Math.max(box[0], box[2]),
      Math.max(box[1], box[3]),
    ];
    if (bounds.some((v) => !Number.isFinite(v))) continue;
    const last = lines[lines.length - 1];
    const height = Math.max(1, bounds[3] - bounds[1]);
    if (
      last &&
      Math.abs(last.box[3] - bounds[3]) < height * 0.25 &&
      bounds[0] >= last.box[2] - 2 &&
      bounds[0] - last.box[2] < height * 2
    ) {
      last.text += " " + item.str.trim();
      last.box = [
        Math.min(last.box[0], bounds[0]),
        Math.min(last.box[1], bounds[1]),
        Math.max(last.box[2], bounds[2]),
        Math.max(last.box[3], bounds[3]),
      ];
    } else lines.push({ text: item.str.trim(), box: bounds, height });
  }
  return lines.map((line, index) => {
    const headingLevel = /^(chapter|unit|section)\s/i.test(line.text)
      ? 1
      : /^\d+\.\d+\s/.test(line.text)
        ? 2
        : undefined;
    return {
      id: "page-" + pageNumber + "-block-" + index,
      type: headingLevel
        ? "HEADING"
        : /[=×÷]/.test(line.text)
          ? "EQUATION"
          : "PARAGRAPH",
      headingLevel,
      text: line.text,
      sequenceNumber: index + 1,
      pageNumber,
      confidence: 1,
      boundingBox: line.box as [number, number, number, number],
    };
  });
}
