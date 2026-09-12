-- Additive only: notes are written at a teaching depth.
ALTER TABLE "GuruPageNotes" ADD COLUMN "depth" TEXT NOT NULL DEFAULT 'basis';
CREATE INDEX "GuruPageNotes_bookId_language_depth_idx" ON "GuruPageNotes"("bookId", "language", "depth");
