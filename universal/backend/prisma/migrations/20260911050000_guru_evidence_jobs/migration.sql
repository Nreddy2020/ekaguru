-- Additive only: first-time page reading (OCR) as a durable job.
CREATE TABLE "GuruEvidenceJob" (
  "id" TEXT PRIMARY KEY,
  "bookId" TEXT NOT NULL,
  "physicalPage" INTEGER NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "requestedBy" TEXT NOT NULL,
  "status" "GuruJobStatus" NOT NULL DEFAULT 'QUEUED',
  "stage" TEXT NOT NULL DEFAULT 'queued',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3)
);
CREATE INDEX "GuruEvidenceJob_status_createdAt_idx" ON "GuruEvidenceJob"("status", "createdAt");
CREATE INDEX "GuruEvidenceJob_bookId_physicalPage_sourceHash_idx" ON "GuruEvidenceJob"("bookId", "physicalPage", "sourceHash");
