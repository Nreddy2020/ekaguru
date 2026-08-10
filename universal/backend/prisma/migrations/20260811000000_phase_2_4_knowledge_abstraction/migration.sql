-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "GradeBand" AS ENUM ('EARLY_CHILDHOOD', 'PRIMARY', 'MIDDLE_SCHOOL', 'HIGH_SCHOOL', 'ADVANCED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CandidateStatus" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterEnum
ALTER TYPE "ConceptRelationshipType" ADD VALUE IF NOT EXISTS 'EVOLUTION_OF';

-- AlterTable
ALTER TABLE "Concept" ADD COLUMN IF NOT EXISTS "gradeBand" "GradeBand" NOT NULL DEFAULT 'PRIMARY';
ALTER TABLE "Concept" ALTER COLUMN "conceptType" SET DEFAULT 'CONCEPT';
ALTER TABLE "Concept" ALTER COLUMN "domain" SET DEFAULT 'General';

-- CreateTable
CREATE TABLE IF NOT EXISTS "LearningObjective" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "complexityLevel" INTEGER NOT NULL DEFAULT 1,
    "bloomTaxonomy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ConceptCandidate" (
    "id" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "candidateKey" TEXT NOT NULL,
    "rawLabel" TEXT NOT NULL,
    "normalizedLabel" TEXT NOT NULL,
    "domain" TEXT DEFAULT 'General',
    "gradeBand" "GradeBand" NOT NULL DEFAULT 'PRIMARY',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" "CandidateStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedConceptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes & Foreign Keys
CREATE INDEX IF NOT EXISTS "LearningObjective_conceptId_idx" ON "LearningObjective"("conceptId");
CREATE INDEX IF NOT EXISTS "LearningObjective_complexityLevel_idx" ON "LearningObjective"("complexityLevel");

CREATE UNIQUE INDEX IF NOT EXISTS "ConceptCandidate_candidateKey_key" ON "ConceptCandidate"("candidateKey");
CREATE INDEX IF NOT EXISTS "ConceptCandidate_chunkId_idx" ON "ConceptCandidate"("chunkId");
CREATE INDEX IF NOT EXISTS "ConceptCandidate_status_idx" ON "ConceptCandidate"("status");
CREATE INDEX IF NOT EXISTS "ConceptCandidate_normalizedLabel_idx" ON "ConceptCandidate"("normalizedLabel");

CREATE INDEX IF NOT EXISTS "Concept_gradeBand_idx" ON "Concept"("gradeBand");
CREATE UNIQUE INDEX IF NOT EXISTS "Concept_normalizedName_domain_gradeBand_key" ON "Concept"("normalizedName", "domain", "gradeBand");

DO $$ BEGIN
  ALTER TABLE "LearningObjective" ADD CONSTRAINT "LearningObjective_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ConceptCandidate" ADD CONSTRAINT "ConceptCandidate_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "ContentChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ConceptCandidate" ADD CONSTRAINT "ConceptCandidate_resolvedConceptId_fkey" FOREIGN KEY ("resolvedConceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
