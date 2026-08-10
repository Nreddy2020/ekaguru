import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { MaterialType, MaterialStatus, ProcessingStatus } from '@prisma/client';

export class UpdateLearningMaterialDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MaterialType)
  materialType?: MaterialType;

  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;

  @IsOptional()
  @IsEnum(ProcessingStatus)
  processingStatus?: ProcessingStatus;

  @IsOptional()
  @IsString()
  subjectName?: string;

  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  originalFileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fileSizeBytes?: number;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsOptional()
  @IsString()
  processingVersion?: string;
}
