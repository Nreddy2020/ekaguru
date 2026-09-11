-- Additive only.
CREATE TYPE "GuruJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');
CREATE TABLE "GuruLessonJob" (
  "id" TEXT PRIMARY KEY,
  "artifactId" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "physicalPage" INTEGER NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "depth" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "age" INTEGER,
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
CREATE INDEX "GuruLessonJob_status_createdAt_idx" ON "GuruLessonJob"("status", "createdAt");
CREATE INDEX "GuruLessonJob_artifactId_idx" ON "GuruLessonJob"("artifactId");
CREATE INDEX "GuruLessonJob_requestedBy_idx" ON "GuruLessonJob"("requestedBy");
