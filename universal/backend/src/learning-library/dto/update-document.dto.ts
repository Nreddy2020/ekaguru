import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { DocumentStatus } from '@prisma/client';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  pageCount?: number;
}
