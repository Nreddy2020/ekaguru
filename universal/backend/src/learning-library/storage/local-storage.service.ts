import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { StorageProviderInterface, StorageResult } from './storage-provider.interface';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class LocalStorageService implements StorageProviderInterface {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly baseUploadDir: string;

  constructor() {
    const customDir = process.env.UPLOAD_DIR || './uploads';
    this.baseUploadDir = path.resolve(process.cwd(), customDir, 'v2');
    this.ensureDirectoryExists(this.baseUploadDir);
  }

  private ensureDirectoryExists(targetPath: string): void {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
  }

  private sanitizeSubpath(subpath: string): string {
    if (subpath.includes('..') || subpath.includes('\0')) {
      throw new BadRequestException('Security violation: Path traversal attempt detected.');
    }
    return subpath.replace(/\\/g, '/').replace(/^\/+/, '');
  }

  private sanitizeFilename(filename: string): string {
    const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanExt = ext ? `.${ext}` : '';
    return `${crypto.randomUUID()}${cleanExt}`;
  }

  async saveFile(
    fileStream: Readable,
    originalFilename: string,
    category: 'source' | 'generated',
    subpath: string,
    mimeType: string,
  ): Promise<StorageResult> {
    const cleanSubpath = this.sanitizeSubpath(subpath);
    const categoryDir = path.join(this.baseUploadDir, category, cleanSubpath);
    
    // Enforce path traversal protection
    const resolvedPath = path.resolve(categoryDir);
    if (!resolvedPath.startsWith(this.baseUploadDir)) {
      throw new BadRequestException('Security violation: Target directory outside base upload path.');
    }

    this.ensureDirectoryExists(resolvedPath);

    const isolatedFilename = this.sanitizeFilename(originalFilename);
    const fullFilePath = path.join(resolvedPath, isolatedFilename);
    const relativeStorageKey = `v2/${category}/${cleanSubpath}/${isolatedFilename}`.replace(/\\/g, '/');

    const hash = crypto.createHash('sha256');
    const writeStream = fs.createWriteStream(fullFilePath);

    let fileSizeBytes = 0;

    await new Promise<void>((resolve, reject) => {
      fileStream.on('data', (chunk: Buffer) => {
        fileSizeBytes += chunk.length;
        hash.update(chunk);
      });

      fileStream.pipe(writeStream);

      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => {
        this.logger.error(`Error writing file ${fullFilePath}: ${err.message}`);
        reject(err);
      });
      fileStream.on('error', (err) => reject(err));
    });

    const checksum = hash.digest('hex');
    this.logger.log(`Stored ${category} file: ${relativeStorageKey} (${fileSizeBytes} bytes, SHA-256: ${checksum})`);

    return {
      storageKey: relativeStorageKey,
      fileSizeBytes,
      checksum,
      mimeType,
    };
  }

  async getFileStream(storageKey: string): Promise<Readable> {
    const cleanKey = this.sanitizeSubpath(storageKey);
    const fullFilePath = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads', cleanKey);

    if (!fullFilePath.startsWith(this.baseUploadDir)) {
      throw new BadRequestException('Security violation: Requested storage key outside base path.');
    }

    if (!fs.existsSync(fullFilePath)) {
      throw new NotFoundException(`File for storage key '${storageKey}' not found.`);
    }

    return fs.createReadStream(fullFilePath);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const cleanKey = this.sanitizeSubpath(storageKey);
      const fullFilePath = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads', cleanKey);

      if (!fullFilePath.startsWith(this.baseUploadDir)) {
        throw new BadRequestException('Security violation: Requested storage key outside base path.');
      }

      if (fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath);
        this.logger.log(`Deleted file: ${storageKey}`);
        return true;
      }
      return false;
    } catch (err) {
      this.logger.error(`Failed to delete file ${storageKey}: ${err.message}`);
      return false;
    }
  }

  async fileExists(storageKey: string): Promise<boolean> {
    try {
      const cleanKey = this.sanitizeSubpath(storageKey);
      const fullFilePath = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads', cleanKey);
      return fullFilePath.startsWith(this.baseUploadDir) && fs.existsSync(fullFilePath);
    } catch {
      return false;
    }
  }
}
