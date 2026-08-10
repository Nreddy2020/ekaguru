import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { MaterialType } from '@prisma/client';

export class CreateLearningMaterialDto {
  @IsString()
  @IsNotEmpty()
  learnerId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MaterialType)
  materialType: MaterialType;

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
}
