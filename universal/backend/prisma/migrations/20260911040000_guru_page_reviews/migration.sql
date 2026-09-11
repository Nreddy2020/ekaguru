-- Additive only.
ALTER TABLE "GuruTeachingSession"
  ADD COLUMN "runStartedAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "reviewStage" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextReviewAt" TIMESTAMP(3),
  ADD COLUMN "lastReviewOutcome" TEXT;
CREATE INDEX "GuruTeachingSession_learnerId_nextReviewAt_idx" ON "GuruTeachingSession"("learnerId", "nextReviewAt");
