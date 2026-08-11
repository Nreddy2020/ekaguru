-- ============================================================
-- Phase 2.8 Migration: Adaptive Session Engine
-- Renames legacy session tables and creates all Phase 2.8 tables
-- ============================================================

-- 1. Rename legacy tables (preserve backward compatibility)
ALTER TABLE IF EXISTS "LearningSession" RENAME TO "LegacyLearningSession";
ALTER TABLE IF EXISTS "SessionEvent"    RENAME TO "LegacySessionEvent";

-- Rename FKs for LegacyLearningSession (safe: these were created by Prisma with known names)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'LearningSession_childId_fkey'
  ) THEN
    ALTER TABLE "LegacyLearningSession"
      RENAME CONSTRAINT "LearningSession_childId_fkey" TO "LegacyLearningSession_childId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'SessionEvent_sessionId_fkey'
  ) THEN
    ALTER TABLE "LegacySessionEvent"
      RENAME CONSTRAINT "SessionEvent_sessionId_fkey" TO "LegacySessionEvent_sessionId_fkey";
  END IF;
END $$;

-- Update LearningEvidence.sessionId FK to reference renamed table
ALTER TABLE IF EXISTS "LearningEvidence"
  DROP CONSTRAINT IF EXISTS "LearningEvidence_sessionId_fkey";

ALTER TABLE IF EXISTS "LearningEvidence"
  ADD CONSTRAINT "LearningEvidence_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "LegacyLearningSession"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Phase 2.8 Enums
DO $$ BEGIN
  CREATE TYPE "SessionStatus" AS ENUM ('READY','ACTIVE','PAUSED','COMPLETING','FINALIZED','ABANDONED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SessionStepType" AS ENUM ('READ','PRACTICE','ASSESS','REVIEW','REMEDIATION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SessionStepStatus" AS ENUM ('PENDING','IN_PROGRESS','COMPLETED','SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AssessmentInstanceStatus" AS ENUM ('PENDING','IN_PROGRESS','COMPLETED','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AssessmentType" AS ENUM ('MULTIPLE_CHOICE','TRUE_FALSE','SHORT_ANSWER','MATCHING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ScoringMethod" AS ENUM ('EXACT_MATCH','PARTIAL_CREDIT','THRESHOLD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. LearningSession (Phase 2.8)
CREATE TABLE IF NOT EXISTS "LearningSession" (
  "id"                        TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "learnerId"                 TEXT        NOT NULL,
  "structureId"               TEXT        NOT NULL,
  "sessionRequestFingerprint" TEXT        UNIQUE,
  "status"                    "SessionStatus" NOT NULL DEFAULT 'READY',
  "timeBudgetSeconds"         INTEGER     NOT NULL,
  "plannedAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt"                 TIMESTAMP(3),
  "pausedAt"                  TIMESTAMP(3),
  "completedAt"               TIMESTAMP(3),
  "finalizedAt"               TIMESTAMP(3),
  "actualDurationSeconds"     INTEGER,
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningSession_learnerId_fkey"
    FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LearningSession_structureId_fkey"
    FOREIGN KEY ("structureId") REFERENCES "CurriculumStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LearningSession_learnerId_idx"             ON "LearningSession"("learnerId");
CREATE INDEX IF NOT EXISTS "LearningSession_structureId_idx"           ON "LearningSession"("structureId");
CREATE INDEX IF NOT EXISTS "LearningSession_status_idx"                ON "LearningSession"("status");
CREATE INDEX IF NOT EXISTS "LearningSession_learnerId_structureId_idx" ON "LearningSession"("learnerId","structureId");

-- 4. SessionTarget
CREATE TABLE IF NOT EXISTS "SessionTarget" (
  "id"               TEXT    NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionId"        TEXT    NOT NULL,
  "curriculumNodeId" TEXT    NOT NULL,
  "sequenceIndex"    INTEGER NOT NULL,
  "isRemediation"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessionTarget_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SessionTarget_curriculumNodeId_fkey"
    FOREIGN KEY ("curriculumNodeId") REFERENCES "CurriculumNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SessionTarget_sessionId_sequenceIndex_key" UNIQUE ("sessionId","sequenceIndex")
);

CREATE INDEX IF NOT EXISTS "SessionTarget_sessionId_idx" ON "SessionTarget"("sessionId");

-- 5. SessionStep
CREATE TABLE IF NOT EXISTS "SessionStep" (
  "id"                       TEXT              NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionId"                TEXT              NOT NULL,
  "targetId"                 TEXT              NOT NULL,
  "stepType"                 "SessionStepType" NOT NULL,
  "sequenceIndex"            INTEGER           NOT NULL,
  "status"                   "SessionStepStatus" NOT NULL DEFAULT 'PENDING',
  "learningObjectiveId"      TEXT,
  "estimatedDurationSeconds" INTEGER           NOT NULL DEFAULT 300,
  "startedAt"                TIMESTAMP(3),
  "completedAt"              TIMESTAMP(3),
  "createdAt"                TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessionStep_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SessionStep_targetId_fkey"
    FOREIGN KEY ("targetId") REFERENCES "SessionTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SessionStep_learningObjectiveId_fkey"
    FOREIGN KEY ("learningObjectiveId") REFERENCES "LearningObjective"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SessionStep_sessionId_idx" ON "SessionStep"("sessionId");
CREATE INDEX IF NOT EXISTS "SessionStep_targetId_idx"  ON "SessionStep"("targetId");

-- 6. AssessmentSpecification
CREATE TABLE IF NOT EXISTS "AssessmentSpecification" (
  "id"                  TEXT            NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "learningObjectiveId" TEXT            NOT NULL,
  "assessmentType"      "AssessmentType" NOT NULL,
  "difficulty"          INTEGER         NOT NULL DEFAULT 1,
  "scoringMethod"       "ScoringMethod" NOT NULL DEFAULT 'EXACT_MATCH',
  "passThreshold"       DOUBLE PRECISION NOT NULL DEFAULT 0.75,
  "configuration"       JSONB           NOT NULL,
  "version"             INTEGER         NOT NULL DEFAULT 1,
  "active"              BOOLEAN         NOT NULL DEFAULT true,
  "createdAt"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentSpecification_learningObjectiveId_fkey"
    FOREIGN KEY ("learningObjectiveId") REFERENCES "LearningObjective"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AssessmentSpecification_learningObjectiveId_version_key" UNIQUE ("learningObjectiveId","version")
);

CREATE INDEX IF NOT EXISTS "AssessmentSpecification_learningObjectiveId_idx" ON "AssessmentSpecification"("learningObjectiveId");
CREATE INDEX IF NOT EXISTS "AssessmentSpecification_active_idx"              ON "AssessmentSpecification"("active");

-- 7. AssessmentInstance
CREATE TABLE IF NOT EXISTS "AssessmentInstance" (
  "id"                        TEXT                     NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionStepId"             TEXT                     NOT NULL,
  "assessmentSpecificationId" TEXT                     NOT NULL,
  "learnerId"                 TEXT                     NOT NULL,
  "attemptNumber"             INTEGER                  NOT NULL DEFAULT 1,
  "status"                    "AssessmentInstanceStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"                 TIMESTAMP(3)             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"               TIMESTAMP(3),
  CONSTRAINT "AssessmentInstance_sessionStepId_fkey"
    FOREIGN KEY ("sessionStepId") REFERENCES "SessionStep"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AssessmentInstance_assessmentSpecificationId_fkey"
    FOREIGN KEY ("assessmentSpecificationId") REFERENCES "AssessmentSpecification"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AssessmentInstance_learnerId_fkey"
    FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AssessmentInstance_sessionStepId_attemptNumber_key" UNIQUE ("sessionStepId","attemptNumber")
);

CREATE INDEX IF NOT EXISTS "AssessmentInstance_sessionStepId_idx" ON "AssessmentInstance"("sessionStepId");
CREATE INDEX IF NOT EXISTS "AssessmentInstance_learnerId_idx"     ON "AssessmentInstance"("learnerId");

-- 8. AssessmentResponse (rawScore is server-computed only)
CREATE TABLE IF NOT EXISTS "AssessmentResponse" (
  "id"                   TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "assessmentInstanceId" TEXT         NOT NULL,
  "responsePayload"      JSONB        NOT NULL,
  "rawScore"             DOUBLE PRECISION NOT NULL,
  "passed"               BOOLEAN      NOT NULL,
  "evidenceKey"          TEXT         NOT NULL UNIQUE,
  "scoredAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentResponse_assessmentInstanceId_fkey"
    FOREIGN KEY ("assessmentInstanceId") REFERENCES "AssessmentInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AssessmentResponse_assessmentInstanceId_idx" ON "AssessmentResponse"("assessmentInstanceId");
CREATE INDEX IF NOT EXISTS "AssessmentResponse_evidenceKey_idx"           ON "AssessmentResponse"("evidenceKey");

-- 9. SessionEvidence (soft reference to LearningEvidence via evidenceKey — preserves Phase 2.7 boundary)
CREATE TABLE IF NOT EXISTS "SessionEvidence" (
  "id"          TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionId"   TEXT         NOT NULL,
  "evidenceKey" TEXT         NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessionEvidence_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SessionEvidence_sessionId_evidenceKey_key" UNIQUE ("sessionId","evidenceKey")
);

CREATE INDEX IF NOT EXISTS "SessionEvidence_sessionId_idx"   ON "SessionEvidence"("sessionId");
CREATE INDEX IF NOT EXISTS "SessionEvidence_evidenceKey_idx" ON "SessionEvidence"("evidenceKey");
