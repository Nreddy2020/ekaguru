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
  it("signs private image links, rejects tampering and expiry, and never signs builtin links", () => {
    const previous = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "spec-secret-that-is-long-enough-for-tests-1234";
    try {
      const url = service.signedMaterialImageUrl("material-1", 3);
      const params = new URL("http://x" + url).searchParams;
      const exp = Number(params.get("exp"));
      const sig = params.get("sig")!;
      expect(url.startsWith("/api/v2/learning-materials/material-1/pages/3/image?")).toBe(true);
      expect(service.verifyImageSignature("material-1", 3, exp, sig)).toBe(true);
      expect(service.verifyImageSignature("material-1", 4, exp, sig)).toBe(false);
      expect(service.verifyImageSignature("material-2", 3, exp, sig)).toBe(false);
      expect(service.verifyImageSignature("material-1", 3, exp, sig.slice(0, -1) + "x")).toBe(false);
      expect(service.verifyImageSignature("material-1", 3, Date.now() - 1000, service.imageSignature("material-1", 3, Date.now() - 1000))).toBe(false);
      expect(service.builtinImageUrl("evs-class-5", 46, "abcdef0123456789abcdef")).toBe("/api/v2/textbooks/evs-class-5/pages/46/image?v=abcdef0123456789");
    } finally {
      if (previous === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previous;
    }
  });
});

describe("page image delivery", () => {
  const png = Buffer.from("89504e470d0a1a0a", "hex");
  const evidence = {
    bookId: "evs-class-5",
    physicalPage: 46,
    sourceHash: "hash-46",
    blocks: [{ blockId: "b1" }],
    imageDataUrl: "data:image/png;base64,AAAA",
    imageBytes: png,
    status: "READY",
  };
  function fakeRes() {
    const res: any = { headers: {} as Record<string, string>, statusCode: 0, body: undefined };
    res.setHeader = (k: string, v: string) => (res.headers[k] = v);
    res.status = (code: number) => ((res.statusCode = code), res);
    res.send = (body: any) => ((res.body = body), res);
    res.end = () => res;
    return res;
  }
  const svc: any = {
    builtin: jest.fn(async () => evidence),
    material: jest.fn(async () => evidence),
    publicView: PageEvidenceService.prototype.publicView,
    builtinImageUrl: PageEvidenceService.prototype.builtinImageUrl,
    verifyImageSignature: jest.fn(() => false),
    signedMaterialImageUrl: jest.fn(() => "/signed"),
  };
  const queue: any = { enqueue: jest.fn(async () => ({ id: "evidence:job-1", status: "QUEUED", stage: "queued" })) };
  const controller = new PageEvidenceController(svc, queue);
  it("returns evidence without the image and with a cacheable image link, never running OCR in the request", async () => {
    const view: any = await controller.builtin("evs-class-5", "46");
    expect(view.imageDataUrl).toBeUndefined();
    expect(view.imageBytes).toBeUndefined();
    expect(view.imageUrl).toBe("/api/v2/textbooks/evs-class-5/pages/46/image?v=hash-46");
    expect(view.blocks).toEqual([{ blockId: "b1" }]);
    expect(view.job).toBeUndefined();
    expect(svc.builtin).toHaveBeenCalledWith("evs-class-5", "46", { performOcr: false });
    expect(queue.enqueue).not.toHaveBeenCalled();
  });
  it("answers 202 with the scan and a reading job when the page text has not been read yet", async () => {
    svc.builtin.mockResolvedValueOnce({ ...evidence, status: "PENDING", blocks: [] });
    const res: any = { status: jest.fn() };
    const view: any = await controller.builtin("evs-class-5", "46", { user: { userId: "p1" } }, res);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(view.status).toBe("PENDING");
    expect(view.imageUrl).toBe("/api/v2/textbooks/evs-class-5/pages/46/image?v=hash-46");
    expect(view.job).toEqual({ id: "evidence:job-1", status: "QUEUED", stage: "queued" });
    expect(queue.enqueue).toHaveBeenCalledWith({ bookId: "evs-class-5", physicalPage: 46, sourceHash: "hash-46" }, { userId: "p1" });
  });
  it("serves the PNG with an immutable cache policy and honours If-None-Match", async () => {
    const res = fakeRes();
    await controller.builtinImage("evs-class-5", "46", undefined, res);
    expect(res.statusCode).toBe(200);
    expect(res.headers["Content-Type"]).toBe("image/png");
    expect(res.headers["Cache-Control"]).toContain("immutable");
    expect(res.headers["ETag"]).toBe('"hash-46"');
    expect(res.body).toBe(png);
    const cached = fakeRes();
    await controller.builtinImage("evs-class-5", "46", '"hash-46"', cached);
    expect(cached.statusCode).toBe(304);
    expect(cached.body).toBeUndefined();
  });
  it("refuses private images without a valid signature and never loads the material", async () => {
    await expect(controller.materialImage("m1", "2", "123", "bad", undefined, fakeRes())).rejects.toThrow("invalid or has expired");
    expect(svc.material).not.toHaveBeenCalled();
    svc.verifyImageSignature.mockReturnValueOnce(true);
    const res = fakeRes();
    await controller.materialImage("m1", "2", "123", "good", undefined, res);
    expect(res.statusCode).toBe(200);
    expect(res.headers["Cache-Control"]).toBe("private, max-age=3600");
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
  it("peeks without running OCR, then the worker pass reads and stores the text the next peek serves", async () => {
    let stored: any = null;
    const prisma: any = {
      guruPageEvidence: {
        findUnique: jest.fn(async () => stored),
        upsert: jest.fn(async ({ create }: any) => (stored = create)),
      },
    };
    const ocr: any = { processPageVision: jest.fn(async () => ocrResult) };
    const service = new PageEvidenceService(ocr, prisma, {} as any);
    const peek = await service.builtin("evs-class-5", "1", { performOcr: false });
    expect(peek).toMatchObject({ status: "PENDING", blocks: [], width: 40, height: 30, totalPages: 1 });
    expect(peek.imageBytes.length).toBeGreaterThan(0);
    expect(ocr.processPageVision).not.toHaveBeenCalled();
    const read = await service.builtin("evs-class-5", "1", { performOcr: true });
    expect(read.status).toBe("READY");
    expect(ocr.processPageVision).toHaveBeenCalledTimes(1);
    const again = await service.builtin("evs-class-5", "1", { performOcr: false });
    expect(again.status).toBe("READY");
    expect(again.blocks.map((b: any) => b.blockId)).toEqual(["b1"]);
    expect(ocr.processPageVision).toHaveBeenCalledTimes(1);
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
  it("skips reading and hashing an unchanged scan on repeat requests", async () => {
    const { ocr, service } = build(null);
    const fsp = require("fs").promises;
    const readFile = jest.spyOn(fsp, "readFile");
    const first = await service.builtin("evs-class-5", "1");
    const second = await service.builtin("evs-class-5", "1");
    expect(second).toBe(first);
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(ocr.processPageVision).toHaveBeenCalledTimes(1);
    // A changed file invalidates the fast path.
    const file = path.join(dir, "evs-class-5", "page-1.png");
    const canvas = require("@napi-rs/canvas").createCanvas(41, 30);
    fs.writeFileSync(file, canvas.toBuffer("image/png"));
    const third = await service.builtin("evs-class-5", "1");
    expect(third.sourceHash).not.toBe(first.sourceHash);
    expect(readFile).toHaveBeenCalledTimes(2);
    readFile.mockRestore();
  });
  it("keeps working when the cache is unavailable", async () => {
    const { prisma, service } = build(null);
    prisma.guruPageEvidence.findUnique.mockRejectedValue(new Error("db down"));
    prisma.guruPageEvidence.upsert.mockRejectedValue(new Error("db down"));
    const evidence = await service.builtin("evs-class-5", "1");
    expect(evidence.blocks).toHaveLength(1);
  });
});
