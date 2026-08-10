import { LearnerType } from '@prisma/client';

export interface CreateLearnerDto {
  name: string;
  learnerType: LearnerType;
  preferredLanguage?: string;
  dateOfBirth?: string | Date;
  legacyChildId?: string;
}
