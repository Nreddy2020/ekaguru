import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { MaterialType } from '@prisma/client';

export enum ProvenanceType {
  USER_UPLOADED = 'USER_UPLOADED',
  CURRICULUM_STANDARD = 'CURRICULUM_STANDARD',
  PUBLIC_DOMAIN = 'PUBLIC_DOMAIN',
  EKAGURU_SYNTHESIZED = 'EKAGURU_SYNTHESIZED',
}

export class UploadMaterialDto {
  @IsString()
  @IsNotEmpty()
  learnerId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(MaterialType)
  materialType: MaterialType;

  @IsOptional()
  @IsEnum(ProvenanceType)
  provenanceType?: ProvenanceType = ProvenanceType.USER_UPLOADED;

  @IsOptional()
  @IsString()
  sourceOrganization?: string;

  @IsOptional()
  @IsString()
  sourceLicense?: string;

  @IsOptional()
  @IsString()
  subjectName?: string;

  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  forceNewVersion?: string | boolean;
}
