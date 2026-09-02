import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface PageCheckpointRecord {
  physicalPageNumber: number;
  imageHash: string;
  wordCount: number;
  confidence: number;
  qualityStatus: 'VERIFIED' | 'NEEDS_RETRY' | 'REJECTED';
  processedAt: string;
}

export interface BookIngestionCheckpoint {
  bookId: string;
  totalPages: number;
  processedPages: number[];
  pageCheckpoints: Record<number, PageCheckpointRecord>;
  stage: 'INIT' | 'RASTERIZING' | 'PAGE_VISION' | 'MANIFEST_BUILT' | 'EVIDENCE_PACKS_BUILT' | 'COMPLETED' | 'FAILED';
  completed: boolean;
  lastResumedAt?: string;
  updatedAt: string;
}

@Injectable()
export class IngestionCheckpointManagerService {
  private readonly logger = new Logger(IngestionCheckpointManagerService.name);
  private checkpointDir = 'E:/Ekaguru/universal/backend/checkpoints';

  constructor() {
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  private getCheckpointFilePath(bookId: string): string {
    return path.join(this.checkpointDir, `${bookId}-checkpoint.json`);
  }

  public getOrCreateCheckpoint(bookId: string, totalPages: number): BookIngestionCheckpoint {
    const file = this.getCheckpointFilePath(bookId);
    if (fs.existsSync(file)) {
      try {
        const raw = fs.readFileSync(file, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        this.logger.warn(`Failed reading checkpoint for ${bookId}, re-initializing.`);
      }
    }

    const checkpoint: BookIngestionCheckpoint = {
      bookId,
      totalPages,
      processedPages: [],
      pageCheckpoints: {},
      stage: 'INIT',
      completed: false,
      updatedAt: new Date().toISOString(),
    };

    this.saveCheckpoint(checkpoint);
    return checkpoint;
  }

  public saveCheckpoint(checkpoint: BookIngestionCheckpoint): void {
    checkpoint.updatedAt = new Date().toISOString();
    const file = this.getCheckpointFilePath(checkpoint.bookId);
    fs.writeFileSync(file, JSON.stringify(checkpoint, null, 2), 'utf8');
  }

  public recordPageProcessed(bookId: string, pageRecord: PageCheckpointRecord): void {
    const file = this.getCheckpointFilePath(bookId);
    let checkpoint: BookIngestionCheckpoint;

    if (fs.existsSync(file)) {
      checkpoint = JSON.parse(fs.readFileSync(file, 'utf8'));
    } else {
      checkpoint = {
        bookId,
        totalPages: 100,
        processedPages: [],
        pageCheckpoints: {},
        stage: 'PAGE_VISION',
        completed: false,
        updatedAt: new Date().toISOString(),
      };
    }

    if (!checkpoint.processedPages.includes(pageRecord.physicalPageNumber)) {
      checkpoint.processedPages.push(pageRecord.physicalPageNumber);
      checkpoint.processedPages.sort((a, b) => a - b);
    }
    checkpoint.pageCheckpoints[pageRecord.physicalPageNumber] = pageRecord;
    this.saveCheckpoint(checkpoint);
  }

  public isPageAlreadyProcessed(bookId: string, pageNumber: number): boolean {
    const file = this.getCheckpointFilePath(bookId);
    if (!fs.existsSync(file)) return false;
    const checkpoint: BookIngestionCheckpoint = JSON.parse(fs.readFileSync(file, 'utf8'));
    return checkpoint.processedPages.includes(pageNumber) && !!checkpoint.pageCheckpoints[pageNumber];
  }

  public clearCheckpoint(bookId: string): void {
    const file = this.getCheckpointFilePath(bookId);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}
