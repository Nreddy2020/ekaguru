import { PageEvidenceService } from "./page-evidence.service";
import { PageEvidenceController } from "./page-evidence.controller";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { LearningLibraryAuthGuard } from "../learning-library-auth.guard";
describe("page evidence boundary", () => {
  const service = new PageEvidenceService({} as any, {} as any, {} as any);
  it.each(["0", "-1", "1x", "1.5", "10001"])(
    "rejects invalid physical page %s",
    async (page) => {
      await expect(service.builtin("evs-class-5", page)).rejects.toThrow(
        "Invalid physical page",
      );
    },
  );
  it("rejects traversal and unregistered public books", async () => {
    await expect(service.builtin("../private", "1")).rejects.toThrow(
      "Unknown textbook",
    );
  });
  it("keeps private material access behind authentication and ownership", () => {
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        PageEvidenceController.prototype.material,
      ),
    ).toEqual([JwtAuthGuard, LearningLibraryAuthGuard]);
  });
});

describe("persisted page evidence", () => {
  const fs = require("fs");
  const os = require("os");
  const path = require("path");
  let dir: string;
  let previousScanDir: string | undefined;
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "guru-evidence-"));
    fs.mkdirSync(path.join(dir, "evs-class-5"));
    const canvas = require("@napi-rs/canvas").createCanvas(40, 30);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 40, 30);
    fs.writeFileSync(path.join(dir, "evs-class-5", "page-1.png"), canvas.toBuffer("image/png"));
    previousScanDir = process.env.TEXTBOOK_SCAN_DIR;
    process.env.TEXTBOOK_SCAN_DIR = dir;
  });
  afterAll(() => {
    if (previousScanDir === undefined) delete process.env.TEXTBOOK_SCAN_DIR;
    else process.env.TEXTBOOK_SCAN_DIR = previousScanDir;
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const ocrResult = {
    averageWordConfidence: 0.9,
    blocks: [
      { blockId: "b1", physicalPageNumber: 1, text: "Seeds need water.", type: "paragraph", confidence: 0.95, readingOrderIndex: 0, bbox: { x: 1, y: 1, width: 10, height: 5 }, words: [{ word: "Seeds", confidence: 0.9 }] },
      { blockId: "b2", physicalPageNumber: 1, text: "smudge", type: "paragraph", confidence: 0.4, readingOrderIndex: 1, bbox: { x: 1, y: 8, width: 10, height: 5 }, words: [] },
    ],
  };
  function build(stored: any) {
    const prisma: any = {
      guruPageEvidence: {
        findUnique: jest.fn(async () => stored),
        upsert: jest.fn(async ({ create }: any) => create),
      },
    };
    const ocr: any = { processPageVision: jest.fn(async () => ocrResult) };
    return { prisma, ocr, service: new PageEvidenceService(ocr, prisma, {} as any) };
  }
  it("runs OCR once, filters low-confidence blocks and persists the result without the image", async () => {
    const { prisma, ocr, service } = build(null);
    const evidence = await service.builtin("evs-class-5", "1");
    expect(ocr.processPageVision).toHaveBeenCalledTimes(1);
    expect(evidence).toMatchObject({ provenance: "OCR", status: "READY", width: 40, height: 30, omittedBlockCount: 1, totalPages: 1 });
    expect(evidence.blocks.map((b: any) => b.blockId)).toEqual(["b1"]);
    expect(evidence.imageDataUrl.startsWith("data:image/png;base64,")).toBe(true);
    const written = prisma.guruPageEvidence.upsert.mock.calls[0][0];
    expect(written.where.bookId_physicalPage_sourceHash).toEqual({ bookId: "evs-class-5", physicalPage: 1, sourceHash: evidence.sourceHash });
    expect(written.create.blocks).toHaveLength(1);
    expect(JSON.stringify(written.create)).not.toContain("data:image");
    expect(written.create.averageWordConfidence).toBe(0.9);
  });
  it("serves stored evidence for the same page revision without calling OCR", async () => {
    const stored = { provenance: "OCR", status: "READY", width: 40, height: 30, blocks: [{ blockId: "b1", text: "Seeds need water." }], omittedBlockCount: 1 };
    const { prisma, ocr, service } = build(stored);
    const evidence = await service.builtin("evs-class-5", "1");
    expect(ocr.processPageVision).not.toHaveBeenCalled();
    expect(prisma.guruPageEvidence.upsert).not.toHaveBeenCalled();
    expect(evidence).toMatchObject({ cached: "database", blocks: stored.blocks, status: "READY" });
    expect(evidence.imageDataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });
  it("keeps working when the cache is unavailable", async () => {
    const { prisma, service } = build(null);
    prisma.guruPageEvidence.findUnique.mockRejectedValue(new Error("db down"));
    prisma.guruPageEvidence.upsert.mockRejectedValue(new Error("db down"));
    const evidence = await service.builtin("evs-class-5", "1");
    expect(evidence.blocks).toHaveLength(1);
  });
});
