import { LearnerType } from '@prisma/client';

export interface UpdateLearnerDto {
  name?: string;
  learnerType?: LearnerType;
  preferredLanguage?: string;
  dateOfBirth?: string | Date;
  legacyChildId?: string;
}
