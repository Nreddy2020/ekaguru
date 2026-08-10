-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('CBSE', 'ICSE', 'CAMBRIDGE', 'STATE_BOARD', 'INTERNATIONAL_BACCALAUREATE');

-- CreateEnum
CREATE TYPE "CurriculumStatus" AS ENUM ('DRAFT', 'VALIDATING', 'PUBLISHED', 'FAILED', 'ARCHIVED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "CurriculumStructure" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'EKAGURU Universal Curriculum',
    "description" TEXT,
    "domain" TEXT NOT NULL DEFAULT 'General',
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "inputFingerprint" TEXT NOT NULL DEFAULT 'FINGERPRINT_DEFAULT',
    "createdBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CurriculumNode" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "gradeBand" "GradeBand" NOT NULL,
    "sequenceIndex" INTEGER NOT NULL,
    "masteryDepthLevel" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CurriculumNodeObjective" (
    "id" TEXT NOT NULL,
    "curriculumNodeId" TEXT NOT NULL,
    "learningObjectiveId" TEXT NOT NULL,
    "sequenceIndex" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumNodeObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CurriculumPrerequisite" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "prerequisiteType" TEXT NOT NULL DEFAULT 'PREREQUISITE',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BoardCurriculumMapping" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "boardType" "BoardType" NOT NULL,
    "boardCode" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'INDIA',
    "academicYear" TEXT NOT NULL DEFAULT '2026-2027',
    "boardGrade" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardCurriculumMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BoardNodeMapping" (
    "id" TEXT NOT NULL,
    "boardMappingId" TEXT NOT NULL,
    "curriculumNodeId" TEXT NOT NULL,
    "boardSequenceIndex" INTEGER NOT NULL,
    "hasSequenceConflict" BOOLEAN NOT NULL DEFAULT false,
    "conflictNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardNodeMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CurriculumStructure_version_key" ON "CurriculumStructure"("version");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CurriculumNode_structureId_sequenceIndex_idx" ON "CurriculumNode"("structureId", "sequenceIndex");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CurriculumNode_conceptId_idx" ON "CurriculumNode"("conceptId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CurriculumNode_gradeBand_idx" ON "CurriculumNode"("gradeBand");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CurriculumNode_structureId_conceptId_gradeBand_key" ON "CurriculumNode"("structureId", "conceptId", "gradeBand");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CurriculumNodeObjective_curriculumNodeId_idx" ON "CurriculumNodeObjective"("curriculumNodeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CurriculumNodeObjective_curriculumNodeId_learningObjectiveI_key" ON "CurriculumNodeObjective"("curriculumNodeId", "learningObjectiveId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CurriculumPrerequisite_structureId_idx" ON "CurriculumPrerequisite"("structureId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CurriculumPrerequisite_structureId_sourceNodeId_targetNodeI_key" ON "CurriculumPrerequisite"("structureId", "sourceNodeId", "targetNodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BoardCurriculumMapping_boardType_idx" ON "BoardCurriculumMapping"("boardType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BoardCurriculumMapping_boardCode_idx" ON "BoardCurriculumMapping"("boardCode");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BoardCurriculumMapping_structureId_boardCode_academicYear_b_key" ON "BoardCurriculumMapping"("structureId", "boardCode", "academicYear", "boardGrade");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BoardNodeMapping_curriculumNodeId_idx" ON "BoardNodeMapping"("curriculumNodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BoardNodeMapping_hasSequenceConflict_idx" ON "BoardNodeMapping"("hasSequenceConflict");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BoardNodeMapping_boardMappingId_curriculumNodeId_key" ON "BoardNodeMapping"("boardMappingId", "curriculumNodeId");

-- AddForeignKey
ALTER TABLE "CurriculumNode" DROP CONSTRAINT IF EXISTS "CurriculumNode_structureId_fkey";
ALTER TABLE "CurriculumNode" ADD CONSTRAINT "CurriculumNode_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "CurriculumStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumNode" DROP CONSTRAINT IF EXISTS "CurriculumNode_conceptId_fkey";
ALTER TABLE "CurriculumNode" ADD CONSTRAINT "CurriculumNode_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumNodeObjective" DROP CONSTRAINT IF EXISTS "CurriculumNodeObjective_curriculumNodeId_fkey";
ALTER TABLE "CurriculumNodeObjective" ADD CONSTRAINT "CurriculumNodeObjective_curriculumNodeId_fkey" FOREIGN KEY ("curriculumNodeId") REFERENCES "CurriculumNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumNodeObjective" DROP CONSTRAINT IF EXISTS "CurriculumNodeObjective_learningObjectiveId_fkey";
ALTER TABLE "CurriculumNodeObjective" ADD CONSTRAINT "CurriculumNodeObjective_learningObjectiveId_fkey" FOREIGN KEY ("learningObjectiveId") REFERENCES "LearningObjective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumPrerequisite" DROP CONSTRAINT IF EXISTS "CurriculumPrerequisite_structureId_fkey";
ALTER TABLE "CurriculumPrerequisite" ADD CONSTRAINT "CurriculumPrerequisite_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "CurriculumStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumPrerequisite" DROP CONSTRAINT IF EXISTS "CurriculumPrerequisite_sourceNodeId_fkey";
ALTER TABLE "CurriculumPrerequisite" ADD CONSTRAINT "CurriculumPrerequisite_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "CurriculumNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumPrerequisite" DROP CONSTRAINT IF EXISTS "CurriculumPrerequisite_targetNodeId_fkey";
ALTER TABLE "CurriculumPrerequisite" ADD CONSTRAINT "CurriculumPrerequisite_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "CurriculumNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardCurriculumMapping" DROP CONSTRAINT IF EXISTS "BoardCurriculumMapping_structureId_fkey";
ALTER TABLE "BoardCurriculumMapping" ADD CONSTRAINT "BoardCurriculumMapping_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "CurriculumStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardNodeMapping" DROP CONSTRAINT IF EXISTS "BoardNodeMapping_boardMappingId_fkey";
ALTER TABLE "BoardNodeMapping" ADD CONSTRAINT "BoardNodeMapping_boardMappingId_fkey" FOREIGN KEY ("boardMappingId") REFERENCES "BoardCurriculumMapping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardNodeMapping" DROP CONSTRAINT IF EXISTS "BoardNodeMapping_curriculumNodeId_fkey";
ALTER TABLE "BoardNodeMapping" ADD CONSTRAINT "BoardNodeMapping_curriculumNodeId_fkey" FOREIGN KEY ("curriculumNodeId") REFERENCES "CurriculumNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
