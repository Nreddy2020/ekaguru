/** PDF.js-shaped fixtures preserve explicit pages and measured text coordinates. */
export function pdfDocumentFixture(pages: string[]) {
  return {
    numPages: pages.length,
    destroy: jest.fn().mockResolvedValue(undefined),
    getPage: jest.fn(async (number: number) => ({
      getViewport: ({ scale }: { scale: number }) => ({
        width: 600 * scale,
        height: 800 * scale,
        convertToViewportRectangle: (box: number[]) => [
          box[0] * scale,
          (800 - box[3]) * scale,
          box[2] * scale,
          (800 - box[1]) * scale,
        ],
      }),
      getTextContent: async () => ({
        items: pages[number - 1]
          .split("\n")
          .filter(Boolean)
          .map((str, i) => ({
            str,
            width: Math.min(500, str.length * 5),
            height: 12,
            transform: [1, 0, 0, 12, 30, 760 - i * 20],
            hasEOL: true,
          })),
      }),
      cleanup: jest.fn(),
    })),
  };
}
