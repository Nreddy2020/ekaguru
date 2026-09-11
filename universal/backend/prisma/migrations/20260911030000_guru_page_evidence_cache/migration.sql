-- Additive only.
CREATE TABLE "GuruPageEvidence" (
  "id" TEXT PRIMARY KEY,
  "bookId" TEXT NOT NULL,
  "physicalPage" INTEGER NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "provenance" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "blocks" JSONB NOT NULL,
  "omittedBlockCount" INTEGER NOT NULL DEFAULT 0,
  "averageWordConfidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "GuruPageEvidence_bookId_physicalPage_sourceHash_key" ON "GuruPageEvidence"("bookId", "physicalPage", "sourceHash");
