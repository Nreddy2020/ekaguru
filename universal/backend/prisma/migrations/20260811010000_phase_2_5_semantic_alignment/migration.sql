-- CreateEnum
CREATE TYPE "ConceptStatus" AS ENUM ('ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('CANDIDATE', 'CONCEPT');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AlignmentDecisionType" AS ENUM ('AUTO_LINK', 'REVIEW_REQUIRED', 'NEW_CONCEPT');

-- AlterEnum
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'SCORING';

-- AlterTable
ALTER TABLE "Concept" ADD COLUMN IF NOT EXISTS "status" "ConceptStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE IF NOT EXISTS "AlignmentPolicy" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "cosineWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.40,
    "gradeWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "domainWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "taxonomyWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "curatorWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "autoLinkThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.88,
    "reviewThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.70,
    "createdBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlignmentPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SemanticEmbedding" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "embeddingModel" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "embeddingVersion" INTEGER NOT NULL DEFAULT 1,
    "dimensions" INTEGER NOT NULL DEFAULT 1536,
    "embedding" DOUBLE PRECISION[],
    "inputFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SemanticEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ConceptAlignmentProposal" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "targetConceptId" TEXT NOT NULL,
    "compositeScore" DOUBLE PRECISION NOT NULL,
    "cosineScore" DOUBLE PRECISION NOT NULL,
    "gradeBandScore" DOUBLE PRECISION NOT NULL,
    "domainScore" DOUBLE PRECISION NOT NULL,
    "taxonomyScore" DOUBLE PRECISION NOT NULL,
    "curatorScore" DOUBLE PRECISION NOT NULL,
    "policyVersion" INTEGER NOT NULL DEFAULT 1,
    "embeddingModel" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "embeddingVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "curatorNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptAlignmentProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AlignmentDecisionLog" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "candidateKey" TEXT NOT NULL,
    "targetConceptId" TEXT,
    "decisionType" "AlignmentDecisionType" NOT NULL,
    "compositeScore" DOUBLE PRECISION NOT NULL,
    "cosineScore" DOUBLE PRECISION NOT NULL,
    "gradeBandScore" DOUBLE PRECISION NOT NULL,
    "domainScore" DOUBLE PRECISION NOT NULL,
    "taxonomyScore" DOUBLE PRECISION NOT NULL,
    "curatorScore" DOUBLE PRECISION NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "embeddingModel" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "embeddingVersion" INTEGER NOT NULL DEFAULT 1,
    "executedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlignmentDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CuratorRule" (
    "id" TEXT NOT NULL,
    "ruleVersion" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rawPhrase" TEXT NOT NULL,
    "normalizedPhrase" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "gradeBand" "GradeBand" NOT NULL,
    "action" TEXT NOT NULL,
    "targetConceptId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuratorRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AlignmentPolicy_version_key" ON "AlignmentPolicy"("version");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SemanticEmbedding_entityId_idx" ON "SemanticEmbedding"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SemanticEmbedding_entityType_entityId_embeddingModel_embedd_key" ON "SemanticEmbedding"("entityType", "entityId", "embeddingModel", "embeddingVersion");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConceptAlignmentProposal_candidateId_idx" ON "ConceptAlignmentProposal"("candidateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConceptAlignmentProposal_targetConceptId_idx" ON "ConceptAlignmentProposal"("targetConceptId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConceptAlignmentProposal_status_idx" ON "ConceptAlignmentProposal"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AlignmentDecisionLog_candidateKey_idx" ON "AlignmentDecisionLog"("candidateKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AlignmentDecisionLog_targetConceptId_idx" ON "AlignmentDecisionLog"("targetConceptId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AlignmentDecisionLog_decisionType_idx" ON "AlignmentDecisionLog"("decisionType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CuratorRule_normalizedPhrase_idx" ON "CuratorRule"("normalizedPhrase");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CuratorRule_active_idx" ON "CuratorRule"("active");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CuratorRule_normalizedPhrase_domain_gradeBand_ruleVersion_key" ON "CuratorRule"("normalizedPhrase", "domain", "gradeBand", "ruleVersion");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Concept_status_idx" ON "Concept"("status");

-- AddForeignKey
ALTER TABLE "ConceptAlignmentProposal" DROP CONSTRAINT IF EXISTS "ConceptAlignmentProposal_candidateId_fkey";
ALTER TABLE "ConceptAlignmentProposal" ADD CONSTRAINT "ConceptAlignmentProposal_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ConceptCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptAlignmentProposal" DROP CONSTRAINT IF EXISTS "ConceptAlignmentProposal_targetConceptId_fkey";
ALTER TABLE "ConceptAlignmentProposal" ADD CONSTRAINT "ConceptAlignmentProposal_targetConceptId_fkey" FOREIGN KEY ("targetConceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlignmentDecisionLog" DROP CONSTRAINT IF EXISTS "AlignmentDecisionLog_policyVersion_fkey";
ALTER TABLE "AlignmentDecisionLog" ADD CONSTRAINT "AlignmentDecisionLog_policyVersion_fkey" FOREIGN KEY ("policyVersion") REFERENCES "AlignmentPolicy"("version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuratorRule" DROP CONSTRAINT IF EXISTS "CuratorRule_targetConceptId_fkey";
ALTER TABLE "CuratorRule" ADD CONSTRAINT "CuratorRule_targetConceptId_fkey" FOREIGN KEY ("targetConceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;
