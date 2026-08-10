import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { LearnerType } from '@prisma/client';

export class UpdateLearnerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(LearnerType)
  learnerType?: LearnerType;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  legacyChildId?: string;
}
