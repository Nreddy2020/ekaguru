import { DocumentStatus } from '@prisma/client';

export interface UpdateDocumentDto {
  title?: string;
  status?: DocumentStatus;
  pageCount?: number;
}
