import { MaterialType } from '@prisma/client';

export interface CreateLearningMaterialDto {
  learnerId: string;
  title: string;
  description?: string;
  materialType: MaterialType;
  subjectName?: string;
  gradeLevel?: string;
  language?: string;
  originalFileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  storageKey?: string;
}
