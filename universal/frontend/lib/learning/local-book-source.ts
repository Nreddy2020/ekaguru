import { BookStorageService } from "./book-storage.service";
import { PageEvidence } from "./page-lesson-runtime";

export class LocalBookSourceStore {
  private static async db(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("Local PDF storage is unavailable in this browser."));
        return;
      }
      const request = indexedDB.open("ekaguru-original-textbooks", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("pdfs");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error("Could not open textbook storage."));
    });
  }
  private static async operation<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("pdfs", mode);
      const request = run(tx.objectStore("pdfs"));
      tx.oncomplete = () => {
        db.close();
        resolve(request.result);
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        reject(
          new Error(
            "Could not save or read the original PDF. Check browser storage space.",
          ),
        );
      };
    });
  }
  static get(id: string) {
    return this.operation<Blob | undefined>("readonly", (s) => s.get(id));
  }
  static put(id: string, file: Blob) {
    return this.operation("readwrite", (s) => s.put(file, id));
  }
  static delete(id: string) {
    return this.operation("readwrite", (s) => s.delete(id));
  }
}
async function openPdf(file: Blob) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  return pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
  }).promise;
}
export async function saveLocalPdf(bookId: string, file: File) {
  if (!file.size || file.size > 200 * 1024 * 1024)
    throw new Error("Choose a PDF up to 200 MB.");
  const signature = new TextDecoder().decode(
    await file.slice(0, 5).arrayBuffer(),
  );
  if (signature !== "%PDF-") throw new Error("This file is not a PDF.");
  const pdf = await openPdf(file);
  const totalPages = pdf.numPages;
  await pdf.destroy();
  await LocalBookSourceStore.put(bookId, file);
  const book = BookStorageService.getBooks().find((b) => b.id === bookId);
  if (book)
    BookStorageService.updateBook({
      ...book,
      fileName: file.name,
      fileSizeBytes: file.size,
      totalPages,
      chapters: [],
      chaptersCount: 0,
      conceptsCount: 0,
      status: "READY_TO_LEARN",
      progress: 100,
      stageMessage:
        "Original PDF saved on this device. Open a page to read it.",
      failureReason: undefined,
    });
  return totalPages;
}
export async function readLocalPage(
  bookId: string,
  physicalPage: number,
): Promise<PageEvidence> {
  const file = await LocalBookSourceStore.get(bookId);
  if (!file)
    throw Object.assign(
      new Error(
        "This older library entry has no saved PDF. Attach the original PDF to restore your book.",
      ),
      { code: "LOCAL_SOURCE_MISSING" },
    );
  const pdf = await openPdf(file);
  try {
    if (
      !Number.isInteger(physicalPage) ||
      physicalPage < 1 ||
      physicalPage > pdf.numPages
    )
      throw new Error("This page is outside the original PDF.");
    const page = await pdf.getPage(physicalPage);
    const original = page.getViewport({ scale: 1 });
    const scale = Math.min(
      1.5,
      Math.sqrt(16000000 / (original.width * original.height)),
    );
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("PDF rendering is unavailable.");
    await page.render({ canvasContext: context, viewport }).promise;
    const content = await page.getTextContent();
    const pdfjs = await import("pdfjs-dist");
    const blocks: PageEvidence["blocks"] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const t = pdfjs.Util.transform(viewport.transform, item.transform);
      const height = Math.max(1, Math.hypot(t[2], t[3]));
      const x = Math.max(0, t[4]),
        y = Math.max(0, t[5] - height);
      blocks.push({
        blockId: "local-" + physicalPage + "-" + blocks.length,
        physicalPageNumber: physicalPage,
        text: item.str.trim(),
        type: "paragraph",
        confidence: 1,
        readingOrderIndex: blocks.length,
        bbox: {
          x,
          y,
          width: Math.max(1, Math.min(item.width * scale, canvas.width - x)),
          height: Math.min(height, canvas.height - y),
        },
      });
    }
    const imageDataUrl = canvas.toDataURL("image/png");
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(imageDataUrl),
    );
    const sourceHash = Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    return {
      version: "local-page-v1",
      bookId,
      physicalPage,
      totalPages: pdf.numPages,
      sourceHash,
      width: canvas.width,
      height: canvas.height,
      imageDataUrl,
      status: blocks.length ? "READY" : "NEEDS_REVIEW",
      omittedBlockCount: 0,
      provenance: "PDF_NATIVE",
      blocks,
    };
  } finally {
    await pdf.destroy();
  }
}
