import { MaterialStatus, ProcessingStatus, MaterialType } from '@prisma/client';

export interface UpdateLearningMaterialDto {
  title?: string;
  description?: string;
  materialType?: MaterialType;
  status?: MaterialStatus;
  processingStatus?: ProcessingStatus;
  subjectName?: string;
  gradeLevel?: string;
  language?: string;
  originalFileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  storageKey?: string;
  failureReason?: string;
  processingVersion?: string;
}
