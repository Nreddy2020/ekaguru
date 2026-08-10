-- CreateEnum
CREATE TYPE "LearnerType" AS ENUM ('CHILD', 'STUDENT', 'ADULT', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('TEXTBOOK', 'PDF', 'IMAGE', 'NOTE', 'WORKSHEET', 'ASSIGNMENT', 'WEB_RESOURCE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('UPLOADED', 'VALIDATING', 'STORED', 'EXTRACTING', 'STRUCTURING', 'CONCEPT_MAPPING', 'INDEXING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ConceptType" AS ENUM ('CONCEPT', 'ENTITY', 'PROCESS', 'PRINCIPLE', 'SKILL');

-- CreateEnum
CREATE TYPE "ConceptRelationshipType" AS ENUM ('PREREQUISITE', 'RELATED', 'COMPONENT_OF', 'APPLICATION_OF', 'CAUSES', 'CONTRASTS', 'ANALOGY');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('ANSWER', 'EXPLANATION', 'PRACTICE', 'ASSESSMENT', 'TRANSFER', 'TEACH_BACK', 'OBSERVATION', 'SELF_REPORT');

-- CreateEnum
CREATE TYPE "EvidenceOutcome" AS ENUM ('CORRECT', 'PARTIAL', 'INCORRECT', 'DEVELOPING', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Learner" (
    "id" TEXT NOT NULL,
    "legacyChildId" TEXT,
    "name" TEXT NOT NULL,
    "learnerType" "LearnerType" NOT NULL,
    "preferredLanguage" TEXT DEFAULT 'en',
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Learner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMaterial" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "materialType" "MaterialType" NOT NULL,
    "status" "MaterialStatus" NOT NULL DEFAULT 'DRAFT',
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'UPLOADED',
    "subjectName" TEXT,
    "gradeLevel" TEXT,
    "language" TEXT DEFAULT 'en',
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" BIGINT,
    "storageKey" TEXT,
    "failureReason" TEXT,
    "processingVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "title" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "pageCount" INTEGER,
    "extractedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentPage" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "text" TEXT,
    "imageStorageKey" TEXT,
    "ocrApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentChapter" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "chapterNumber" INTEGER,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentTopic" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chapterId" TEXT,
    "topicId" TEXT,
    "sequenceNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "legacyAtomId" TEXT,
    "canonicalName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "definition" TEXT,
    "conceptType" "ConceptType" NOT NULL,
    "domain" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptChunk" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "relevance" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConceptChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptRelationship" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationshipType" "ConceptRelationshipType" NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEvidence" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "sessionId" TEXT,
    "evidenceType" "EvidenceType" NOT NULL,
    "outcome" "EvidenceOutcome" NOT NULL,
    "score" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "response" TEXT,
    "reasoning" TEXT,
    "misconception" TEXT,
    "sourceReference" JSONB,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Learner_legacyChildId_key" ON "Learner"("legacyChildId");

-- CreateIndex
CREATE INDEX "LearningMaterial_learnerId_idx" ON "LearningMaterial"("learnerId");

-- CreateIndex
CREATE INDEX "LearningMaterial_processingStatus_idx" ON "LearningMaterial"("processingStatus");

-- CreateIndex
CREATE INDEX "LearningMaterial_materialType_idx" ON "LearningMaterial"("materialType");

-- CreateIndex
CREATE INDEX "Document_materialId_idx" ON "Document"("materialId");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "DocumentPage_documentId_idx" ON "DocumentPage"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPage_documentId_pageNumber_key" ON "DocumentPage"("documentId", "pageNumber");

-- CreateIndex
CREATE INDEX "ContentChapter_documentId_idx" ON "ContentChapter"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentChapter_documentId_orderIndex_key" ON "ContentChapter"("documentId", "orderIndex");

-- CreateIndex
CREATE INDEX "ContentTopic_chapterId_idx" ON "ContentTopic"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentTopic_chapterId_orderIndex_key" ON "ContentTopic"("chapterId", "orderIndex");

-- CreateIndex
CREATE INDEX "ContentChunk_chapterId_idx" ON "ContentChunk"("chapterId");

-- CreateIndex
CREATE INDEX "ContentChunk_topicId_idx" ON "ContentChunk"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentChunk_documentId_sequenceNumber_key" ON "ContentChunk"("documentId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_legacyAtomId_key" ON "Concept"("legacyAtomId");

-- CreateIndex
CREATE INDEX "Concept_conceptType_idx" ON "Concept"("conceptType");

-- CreateIndex
CREATE INDEX "Concept_domain_idx" ON "Concept"("domain");

-- CreateIndex
CREATE INDEX "ConceptChunk_chunkId_idx" ON "ConceptChunk"("chunkId");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptChunk_conceptId_chunkId_key" ON "ConceptChunk"("conceptId", "chunkId");

-- CreateIndex
CREATE INDEX "ConceptRelationship_sourceId_idx" ON "ConceptRelationship"("sourceId");

-- CreateIndex
CREATE INDEX "ConceptRelationship_targetId_idx" ON "ConceptRelationship"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptRelationship_sourceId_targetId_relationshipType_key" ON "ConceptRelationship"("sourceId", "targetId", "relationshipType");

-- CreateIndex
CREATE INDEX "LearningEvidence_learnerId_conceptId_idx" ON "LearningEvidence"("learnerId", "conceptId");

-- CreateIndex
CREATE INDEX "LearningEvidence_conceptId_idx" ON "LearningEvidence"("conceptId");

-- CreateIndex
CREATE INDEX "LearningEvidence_evidenceType_idx" ON "LearningEvidence"("evidenceType");

-- CreateIndex
CREATE INDEX "LearningEvidence_observedAt_idx" ON "LearningEvidence"("observedAt");

-- AddForeignKey
ALTER TABLE "Learner" ADD CONSTRAINT "Learner_legacyChildId_fkey" FOREIGN KEY ("legacyChildId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LearningMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPage" ADD CONSTRAINT "DocumentPage_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentChapter" ADD CONSTRAINT "ContentChapter_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTopic" ADD CONSTRAINT "ContentTopic_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "ContentChapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentChunk" ADD CONSTRAINT "ContentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentChunk" ADD CONSTRAINT "ContentChunk_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "ContentChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentChunk" ADD CONSTRAINT "ContentChunk_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ContentTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_legacyAtomId_fkey" FOREIGN KEY ("legacyAtomId") REFERENCES "ConceptAtom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptChunk" ADD CONSTRAINT "ConceptChunk_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptChunk" ADD CONSTRAINT "ConceptChunk_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "ContentChunk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptRelationship" ADD CONSTRAINT "ConceptRelationship_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptRelationship" ADD CONSTRAINT "ConceptRelationship_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvidence" ADD CONSTRAINT "LearningEvidence_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvidence" ADD CONSTRAINT "LearningEvidence_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvidence" ADD CONSTRAINT "LearningEvidence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
