-- AlterTable
ALTER TABLE "LearningMaterial" ADD COLUMN IF NOT EXISTS "targetAudience" TEXT DEFAULT 'child';
