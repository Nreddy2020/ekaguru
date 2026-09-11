import { PdfExtractorService } from "./extractors/pdf-extractor.service";
import { pdfDocumentFixture } from "./pdf-test-fixture";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

describe("PDF source integrity", () => {
  let service: PdfExtractorService;
  let file: string;
  let dir: string;
  beforeEach(async () => {
    service = new PdfExtractorService();
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "ekaguru-pdf-"));
    file = path.join(dir, "source.pdf");
    await fs.writeFile(file, "fixture bytes");
  });
  afterEach(async () => {
    await fs.unlink(file);
    await fs.rmdir(dir);
  });
  it("supports PDF input", () => {
    expect(service.supports("application/pdf", ".PDF")).toBe(true);
    expect(service.supports("text/plain", ".txt")).toBe(false);
  });
  it("rejects unreadable sources without fabricated replacement pages", async () => {
    jest.spyOn(service, "openDocument").mockRejectedValue(new Error("corrupt"));
    await expect(service.extract(file, "bad.pdf")).rejects.toThrow(
      "No replacement content",
    );
  });
  it("preserves physical pages, native words, coordinates and source revision", async () => {
    const doc = pdfDocumentFixture([
      "Chapter 1: Triangles\nTriangles have three sides and three angles.",
      "Chapter 2: Plants\nPlants use sunlight to make food through photosynthesis.",
    ]);
    jest.spyOn(service, "openDocument").mockResolvedValue(doc);
    const result = await service.extract(file, "book.pdf");
    expect(result.metadata.pageCount).toBe(2);
    expect(result.metadata.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(result.pages[1].rawText).toContain("Plants use sunlight");
    expect(result.pages[1].rawText).not.toContain("Triangles");
    expect(result.pages[0].blocks[0].boundingBox).toEqual([30, 28, 130, 40]);
    expect(result.pages[0].blocks[0].headingLevel).toBe(1);
    expect(doc.destroy).toHaveBeenCalledTimes(1);
  });
  it("destroys the parser on extraction failure", async () => {
    const doc = pdfDocumentFixture(["page"]);
    doc.getPage.mockRejectedValueOnce(new Error("broken page"));
    jest.spyOn(service, "openDocument").mockResolvedValue(doc);
    await expect(service.extract(file, "bad.pdf")).rejects.toThrow(
      "broken page",
    );
    expect(doc.destroy).toHaveBeenCalled();
  });
});
