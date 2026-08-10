import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { LearnerType } from '@prisma/client';

export class CreateLearnerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(LearnerType)
  learnerType: LearnerType;

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
