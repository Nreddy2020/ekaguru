-- ============================================================
-- Phase 1 (V1) Legacy Database Schema Baseline Migration
-- ============================================================

-- Create Enums
CREATE TYPE "SubjectCategory" AS ENUM ('TECHNICAL', 'K12', 'LANGUAGE', 'HIGHER_ED');
CREATE TYPE "SubjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED');
CREATE TYPE "TargetRole" AS ENUM ('KID', 'STUDENT', 'GENIUS');
CREATE TYPE "AtomType" AS ENUM ('CONCEPT', 'ENTITY', 'PROCESS', 'PRINCIPLE');
CREATE TYPE "RelationType" AS ENUM ('PREREQUISITE', 'COMPONENT_OF', 'ANALOGY_FOR', 'EVOLUTION_OF');
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'SCENARIO', 'DESIGN');
CREATE TYPE "UserRole" AS ENUM ('PARENT', 'STUDENT', 'ADMIN');

-- Create Table Subject
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SubjectCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" "SubjectStatus" NOT NULL DEFAULT 'DRAFT',
    "targetRoles" "TargetRole"[],
    "metaTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- Create Table Phase
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Phase_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Table Module
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objectives" TEXT[],
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Module_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Module_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Table Topic
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentData" JSONB NOT NULL,
    "explanations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Topic_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Table ConceptAtom
CREATE TABLE "ConceptAtom" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AtomType" NOT NULL,
    "definition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConceptAtom_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ConceptAtom_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Table ConceptRelation
CREATE TABLE "ConceptRelation" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" "RelationType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConceptRelation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ConceptRelation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ConceptAtom"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConceptRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "ConceptAtom"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Table ComplexityLens
CREATE TABLE "ComplexityLens" (
    "id" TEXT NOT NULL,
    "atomId" TEXT NOT NULL,
    "role" "TargetRole" NOT NULL,
    "narrative" TEXT NOT NULL,
    "analogy" TEXT NOT NULL,
    "visualPrompt" TEXT,
    "historicalContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ComplexityLens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ComplexityLens_atomId_fkey" FOREIGN KEY ("atomId") REFERENCES "ConceptAtom"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ComplexityLens_atomId_role_key" ON "ComplexityLens"("atomId", "role");

-- Create Table Lab
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "commands" TEXT[],
    "solution" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Lab_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Table Assessment
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Assessment_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Table Question
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "options" TEXT[],
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "complexity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Question_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Table PromptTemplate
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "outputSchema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PromptTemplate_name_key" ON "PromptTemplate"("name");

-- Create Table Parent
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentDate" TIMESTAMP(3),
    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Parent_email_key" ON "Parent"("email");

-- Create Table Child
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Child_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Table ChildProgress
CREATE TABLE "ChildProgress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "currentMastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fearIndex" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChildProgress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ChildProgress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ChildProgress_childId_key" ON "ChildProgress"("childId");

-- Create Table LearningSession
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LearningSession_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Table SessionEvent
CREATE TABLE "SessionEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SessionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
