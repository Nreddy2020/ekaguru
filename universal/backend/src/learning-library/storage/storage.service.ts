import { TraceStorage } from '../../observe/trace-storage';
import { Injectable, Logger } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { StorageProviderInterface, StorageResult } from './storage-provider.interface';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements StorageProviderInterface {
  private readonly logger = new Logger(StorageService.name);
  private readonly activeProvider: StorageProviderInterface;

  constructor(private readonly localStorageService: LocalStorageService) {
    // Default to LocalStorageProvider (extensible to S3StorageProvider via config)
    this.activeProvider = this.localStorageService;
    this.logger.log('StorageService initialized with LocalStorageService provider.');
  }

  saveFile(
    fileStream: Readable,
    filename: string,
    category: 'source' | 'generated',
    subpath: string,
    mimeType: string,
  ): Promise<StorageResult> {
    return this.activeProvider.saveFile(fileStream, filename, category, subpath, mimeType);
  }

  getFileStream(storageKey: string): Promise<Readable> {
    return this.activeProvider.getFileStream(storageKey);
  }

  deleteFile(storageKey: string): Promise<boolean> {
    return this.activeProvider.deleteFile(storageKey);
  }

  fileExists(storageKey: string): Promise<boolean> {
    return this.activeProvider.fileExists(storageKey);
  }
}
