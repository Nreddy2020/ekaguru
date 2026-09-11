ALTER TABLE "DocumentPage" ADD COLUMN "evidence" JSONB, ADD COLUMN "sourceHash" TEXT;
CREATE TABLE "GuruLessonArtifact" (
  "id" TEXT PRIMARY KEY, "bookId" TEXT NOT NULL, "physicalPage" INTEGER NOT NULL,
  "sourceHash" TEXT NOT NULL, "payload" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "GuruLessonArtifact_bookId_physicalPage_sourceHash_idx" ON "GuruLessonArtifact"("bookId", "physicalPage", "sourceHash");
CREATE TABLE "GuruTeachingSession" (
  "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "learnerId" TEXT, "artifactId" TEXT NOT NULL,
  "cursor" INTEGER NOT NULL DEFAULT 0, "revision" INTEGER NOT NULL DEFAULT 0,
  "checkpointPassed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuruTeachingSession_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "GuruLessonArtifact"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "GuruTeachingSession_userId_artifactId_idx" ON "GuruTeachingSession"("userId", "artifactId");
CREATE TABLE "GuruTeachingEvent" (
  "id" TEXT PRIMARY KEY, "sessionId" TEXT NOT NULL, "requestId" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL, "result" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruTeachingEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GuruTeachingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "GuruTeachingEvent_sessionId_requestId_key" ON "GuruTeachingEvent"("sessionId", "requestId");
