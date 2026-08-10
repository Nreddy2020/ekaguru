import { MaterialStatus, ProcessingStatus, MaterialType } from '@prisma/client';

export interface QueryLearningMaterialDto {
  learnerId?: string;
  status?: MaterialStatus;
  processingStatus?: ProcessingStatus;
  materialType?: MaterialType;
  subjectName?: string;
  gradeLevel?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
