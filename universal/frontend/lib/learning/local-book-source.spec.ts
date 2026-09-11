import {
  LocalBookSourceStore,
  readLocalPage,
  saveLocalPdf,
} from "./local-book-source";
import { BookStorageService } from "./book-storage.service";
afterEach(() => jest.restoreAllMocks());
it("does not substitute a sample textbook for a missing original PDF", async () => {
  jest.spyOn(LocalBookSourceStore, "get").mockResolvedValue(undefined);
  await expect(readLocalPage("book-old", 1)).rejects.toMatchObject({
    code: "LOCAL_SOURCE_MISSING",
  });
});
it("rejects an oversized upload before attempting storage or PDF parsing", async () => {
  const put = jest.spyOn(LocalBookSourceStore, "put");
  await expect(
    saveLocalPdf("book-test", { size: 201 * 1024 * 1024 } as File),
  ).rejects.toThrow("200 MB");
  expect(put).not.toHaveBeenCalled();
});
it("does not fabricate chapters or inflate the page count for new uploads", () => {
  const book = BookStorageService.createBook(
    "My PDF",
    "Science",
    "Class 5",
    "NCERT",
    "source.pdf",
    100,
  );
  expect(book.chapters).toEqual([]);
  expect(book.totalPages).toBe(0);
  BookStorageService.updateBook({ ...book, totalPages: 2 });
  expect(BookStorageService.getBookById(book.id)?.totalPages).toBe(2);
  expect(BookStorageService.getBookById("unrelated-book-id")).toBeUndefined();
});
