import { DocumentStatus } from '@prisma/client';

export interface CreateDocumentDto {
  title?: string;
  status?: DocumentStatus;
  pageCount?: number;
}
