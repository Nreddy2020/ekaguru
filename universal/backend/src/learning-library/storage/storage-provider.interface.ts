import { Readable } from 'stream';

export interface StorageResult {
  storageKey: string;
  fileSizeBytes: number;
  checksum: string;
  mimeType: string;
}

export interface StorageProviderInterface {
  saveFile(
    fileStream: Readable,
    filename: string,
    category: 'source' | 'generated',
    subpath: string,
    mimeType: string,
  ): Promise<StorageResult>;

  getFileStream(storageKey: string): Promise<Readable>;

  deleteFile(storageKey: string): Promise<boolean>;

  fileExists(storageKey: string): Promise<boolean>;
}
