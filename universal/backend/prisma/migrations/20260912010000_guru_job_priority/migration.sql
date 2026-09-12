-- Additive only: an opened page's job runs before a whole-book batch.
ALTER TABLE "GuruLessonJob" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "GuruLessonJob_status_priority_createdAt_idx" ON "GuruLessonJob"("status", "priority", "createdAt");
