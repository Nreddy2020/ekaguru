-- Additive only: Guru Notes per page revision and language, their question extensions, and job kinds.
CREATE TABLE "GuruPageNotes" (
  "id" TEXT PRIMARY KEY,
  "bookId" TEXT NOT NULL,
  "physicalPage" INTEGER NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "GuruPageNotes_bookId_physicalPage_sourceHash_idx" ON "GuruPageNotes"("bookId", "physicalPage", "sourceHash");
CREATE INDEX "GuruPageNotes_bookId_language_idx" ON "GuruPageNotes"("bookId", "language");

CREATE TABLE "GuruNotesExtension" (
  "id" TEXT PRIMARY KEY,
  "notesId" TEXT NOT NULL REFERENCES "GuruPageNotes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "topicId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "evidenceIds" JSONB NOT NULL,
  "beyondPage" BOOLEAN NOT NULL DEFAULT false,
  "askedBy" TEXT NOT NULL,
  "learnerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "GuruNotesExtension_notesId_topicId_idx" ON "GuruNotesExtension"("notesId", "topicId");

ALTER TABLE "GuruLessonJob" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'lesson';
CREATE INDEX "GuruLessonJob_kind_bookId_idx" ON "GuruLessonJob"("kind", "bookId");
