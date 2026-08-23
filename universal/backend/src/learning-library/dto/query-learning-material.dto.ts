import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MaterialStatus, ProcessingStatus, MaterialType } from '@prisma/client';

export class QueryLearningMaterialDto {
  @IsOptional()
  @IsString()
  learnerId?: string;

  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;

  @IsOptional()
  @IsString()
  processingStatus?: string;

  @IsOptional()
  @IsEnum(MaterialType)
  materialType?: MaterialType;

  @IsOptional()
  @IsString()
  subjectName?: string;

  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
