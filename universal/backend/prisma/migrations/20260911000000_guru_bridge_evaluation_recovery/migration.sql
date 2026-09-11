-- Additive only. No existing rows are modified or removed.
ALTER TABLE "Parent" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "ParentCredential" ADD COLUMN "credentialVersion" INTEGER NOT NULL DEFAULT 1;

CREATE TYPE "GuruMappingStatus" AS ENUM ('PROPOSED', 'VERIFIED', 'REJECTED');
CREATE TYPE "GuruMappingMethod" AS ENUM ('CHUNK_PAGE_RANGE', 'OBJECTIVE_NAME', 'MANUAL');
CREATE TABLE "GuruConceptMapping" (
  "id" TEXT PRIMARY KEY,
  "artifactId" TEXT NOT NULL,
  "conceptId" TEXT NOT NULL,
  "method" "GuruMappingMethod" NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "status" "GuruMappingStatus" NOT NULL DEFAULT 'PROPOSED',
  "rationale" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuruConceptMapping_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "GuruLessonArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GuruConceptMapping_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "GuruConceptMapping_artifactId_conceptId_key" ON "GuruConceptMapping"("artifactId", "conceptId");
CREATE INDEX "GuruConceptMapping_status_idx" ON "GuruConceptMapping"("status");
CREATE INDEX "GuruConceptMapping_conceptId_idx" ON "GuruConceptMapping"("conceptId");

CREATE TYPE "GuruReviewVerdict" AS ENUM ('PASS', 'REVISE', 'FAIL');
CREATE TABLE "GuruEvaluationCase" (
  "id" TEXT PRIMARY KEY,
  "bookId" TEXT NOT NULL,
  "physicalPage" INTEGER NOT NULL,
  "sourceHash" TEXT,
  "subject" TEXT NOT NULL,
  "gradeBand" "GradeBand" NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'en',
  "depth" TEXT NOT NULL,
  "artifactId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuruEvaluationCase_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "GuruLessonArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "GuruEvaluationCase_bookId_physicalPage_depth_language_key" ON "GuruEvaluationCase"("bookId", "physicalPage", "depth", "language");
CREATE INDEX "GuruEvaluationCase_subject_depth_idx" ON "GuruEvaluationCase"("subject", "depth");
CREATE TABLE "GuruEvaluationReview" (
  "id" TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "rubricVersion" INTEGER NOT NULL,
  "scores" JSONB NOT NULL,
  "verdict" "GuruReviewVerdict" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruEvaluationReview_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "GuruEvaluationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "GuruEvaluationReview_caseId_reviewerId_rubricVersion_key" ON "GuruEvaluationReview"("caseId", "reviewerId", "rubricVersion");
CREATE INDEX "GuruEvaluationReview_verdict_idx" ON "GuruEvaluationReview"("verdict");

CREATE TABLE "GuruModelUsage" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "lessons" INTEGER NOT NULL DEFAULT 0,
  "queries" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "GuruModelUsage_userId_day_key" ON "GuruModelUsage"("userId", "day");

CREATE TYPE "RecoveryPurpose" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFY');
CREATE TABLE "ParentRecoveryToken" (
  "id" TEXT PRIMARY KEY,
  "parentId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "purpose" "RecoveryPurpose" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParentRecoveryToken_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ParentRecoveryToken_tokenHash_key" ON "ParentRecoveryToken"("tokenHash");
CREATE INDEX "ParentRecoveryToken_parentId_purpose_idx" ON "ParentRecoveryToken"("parentId", "purpose");
