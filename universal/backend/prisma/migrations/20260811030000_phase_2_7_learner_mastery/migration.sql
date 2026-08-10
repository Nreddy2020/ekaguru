-- CreateEnum
CREATE TYPE "MasteryStatus" AS ENUM ('NOT_STARTED', 'NEEDS_REMEDIATION', 'IN_PROGRESS', 'MASTERED');

-- AlterTable
ALTER TABLE "LearningEvidence" ADD COLUMN IF NOT EXISTS "evidenceKey" TEXT,
ADD COLUMN IF NOT EXISTS "learningObjectiveId" TEXT,
ALTER COLUMN "conceptId" DROP NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "MasteryPolicy" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'EKAGURU Default Mastery Policy',
    "recentWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.60,
    "decayLambda" DOUBLE PRECISION NOT NULL DEFAULT 0.001,
    "masteryThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "remediationThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.50,
    "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.70,
    "createdBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasteryPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LearnerCurriculumEnrollment" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LearnerCurriculumEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LearnerConceptMastery" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "MasteryStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "policyVersion" INTEGER NOT NULL DEFAULT 1,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "successfulCount" INTEGER NOT NULL DEFAULT 0,
    "lastAssessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerConceptMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LearnerObjectiveMastery" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "learningObjectiveId" TEXT NOT NULL,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "MasteryStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "policyVersion" INTEGER NOT NULL DEFAULT 1,
    "lastAssessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerObjectiveMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MasteryHistory" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "conceptId" TEXT,
    "learningObjectiveId" TEXT,
    "evidenceKey" TEXT NOT NULL,
    "previousScore" DOUBLE PRECISION NOT NULL,
    "newScore" DOUBLE PRECISION NOT NULL,
    "previousStatus" "MasteryStatus" NOT NULL,
    "newStatus" "MasteryStatus" NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasteryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LearnerCurriculumFrontier" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "currentNodeId" TEXT NOT NULL,
    "isRemediation" BOOLEAN NOT NULL DEFAULT false,
    "remediationReason" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerCurriculumFrontier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MasteryPolicy_version_key" ON "MasteryPolicy"("version");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearnerCurriculumEnrollment_learnerId_idx" ON "LearnerCurriculumEnrollment"("learnerId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LearnerCurriculumEnrollment_learnerId_structureId_key" ON "LearnerCurriculumEnrollment"("learnerId", "structureId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearnerConceptMastery_learnerId_idx" ON "LearnerConceptMastery"("learnerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearnerConceptMastery_conceptId_idx" ON "LearnerConceptMastery"("conceptId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearnerConceptMastery_status_idx" ON "LearnerConceptMastery"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LearnerConceptMastery_learnerId_conceptId_key" ON "LearnerConceptMastery"("learnerId", "conceptId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearnerObjectiveMastery_learnerId_idx" ON "LearnerObjectiveMastery"("learnerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearnerObjectiveMastery_learningObjectiveId_idx" ON "LearnerObjectiveMastery"("learningObjectiveId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LearnerObjectiveMastery_learnerId_learningObjectiveId_key" ON "LearnerObjectiveMastery"("learnerId", "learningObjectiveId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MasteryHistory_learnerId_idx" ON "MasteryHistory"("learnerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MasteryHistory_evidenceKey_idx" ON "MasteryHistory"("evidenceKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MasteryHistory_calculatedAt_idx" ON "MasteryHistory"("calculatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearnerCurriculumFrontier_learnerId_structureId_idx" ON "LearnerCurriculumFrontier"("learnerId", "structureId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LearnerCurriculumFrontier_learnerId_structureId_currentNode_key" ON "LearnerCurriculumFrontier"("learnerId", "structureId", "currentNodeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LearningEvidence_evidenceKey_key" ON "LearningEvidence"("evidenceKey");

-- AddForeignKey
ALTER TABLE "LearningEvidence" DROP CONSTRAINT IF EXISTS "LearningEvidence_conceptId_fkey";
ALTER TABLE "LearningEvidence" ADD CONSTRAINT "LearningEvidence_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvidence" DROP CONSTRAINT IF EXISTS "LearningEvidence_learningObjectiveId_fkey";
ALTER TABLE "LearningEvidence" ADD CONSTRAINT "LearningEvidence_learningObjectiveId_fkey" FOREIGN KEY ("learningObjectiveId") REFERENCES "LearningObjective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerCurriculumEnrollment" DROP CONSTRAINT IF EXISTS "LearnerCurriculumEnrollment_learnerId_fkey";
ALTER TABLE "LearnerCurriculumEnrollment" ADD CONSTRAINT "LearnerCurriculumEnrollment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerCurriculumEnrollment" DROP CONSTRAINT IF EXISTS "LearnerCurriculumEnrollment_structureId_fkey";
ALTER TABLE "LearnerCurriculumEnrollment" ADD CONSTRAINT "LearnerCurriculumEnrollment_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "CurriculumStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerConceptMastery" DROP CONSTRAINT IF EXISTS "LearnerConceptMastery_learnerId_fkey";
ALTER TABLE "LearnerConceptMastery" ADD CONSTRAINT "LearnerConceptMastery_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerConceptMastery" DROP CONSTRAINT IF EXISTS "LearnerConceptMastery_conceptId_fkey";
ALTER TABLE "LearnerConceptMastery" ADD CONSTRAINT "LearnerConceptMastery_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerObjectiveMastery" DROP CONSTRAINT IF EXISTS "LearnerObjectiveMastery_learnerId_fkey";
ALTER TABLE "LearnerObjectiveMastery" ADD CONSTRAINT "LearnerObjectiveMastery_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerObjectiveMastery" DROP CONSTRAINT IF EXISTS "LearnerObjectiveMastery_learningObjectiveId_fkey";
ALTER TABLE "LearnerObjectiveMastery" ADD CONSTRAINT "LearnerObjectiveMastery_learningObjectiveId_fkey" FOREIGN KEY ("learningObjectiveId") REFERENCES "LearningObjective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryHistory" DROP CONSTRAINT IF EXISTS "MasteryHistory_learnerId_fkey";
ALTER TABLE "MasteryHistory" ADD CONSTRAINT "MasteryHistory_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryHistory" DROP CONSTRAINT IF EXISTS "MasteryHistory_policyVersion_fkey";
ALTER TABLE "MasteryHistory" ADD CONSTRAINT "MasteryHistory_policyVersion_fkey" FOREIGN KEY ("policyVersion") REFERENCES "MasteryPolicy"("version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerCurriculumFrontier" DROP CONSTRAINT IF EXISTS "LearnerCurriculumFrontier_learnerId_fkey";
ALTER TABLE "LearnerCurriculumFrontier" ADD CONSTRAINT "LearnerCurriculumFrontier_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerCurriculumFrontier" DROP CONSTRAINT IF EXISTS "LearnerCurriculumFrontier_structureId_fkey";
ALTER TABLE "LearnerCurriculumFrontier" ADD CONSTRAINT "LearnerCurriculumFrontier_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "CurriculumStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerCurriculumFrontier" DROP CONSTRAINT IF EXISTS "LearnerCurriculumFrontier_currentNodeId_fkey";
ALTER TABLE "LearnerCurriculumFrontier" ADD CONSTRAINT "LearnerCurriculumFrontier_currentNodeId_fkey" FOREIGN KEY ("currentNodeId") REFERENCES "CurriculumNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
