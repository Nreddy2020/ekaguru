import { TraceStorage } from '../../observe/trace-storage';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

export interface FileValidationResult {
  valid: boolean;
  detectedMime: string;
  extension: string;
  fileSizeBytes: number;
}

@Injectable()
export class FileValidatorService {
  private readonly logger = new Logger(FileValidatorService.name);
  private readonly maxFileSizeBytes = parseInt(process.env.MAX_FILE_SIZE_BYTES || '52428800', 10); // 50MB

  private readonly allowedMimes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/epub+zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ]);

  private readonly allowedExtensions = new Set([
    '.pdf',
    '.jpeg',
    '.jpg',
    '.png',
    '.webp',
    '.epub',
    '.docx',
    '.txt',
    '.md',
  ]);

  validateFileHeader(
    bufferOrTempPath: Buffer | string,
    originalFilename: string,
    declaredMime: string,
  ): FileValidationResult {
    const span = TraceStorage.startSpan('FileValidation', 'SERVICE', { originalFilename, declaredMime });
    let buffer: Buffer;
    let fileSizeBytes: number;

    try {
      if (typeof bufferOrTempPath === 'string') {
        if (!fs.existsSync(bufferOrTempPath)) {
          throw new BadRequestException('Temporary file does not exist.');
        }
        const stat = fs.statSync(bufferOrTempPath);
        fileSizeBytes = stat.size;

        // Read only the first 512 bytes for header magic byte inspection
        const fd = fs.openSync(bufferOrTempPath, 'r');
        const headerBuffer = Buffer.alloc(Math.min(512, fileSizeBytes));
        fs.readSync(fd, headerBuffer, 0, headerBuffer.length, 0);
        fs.closeSync(fd);
        buffer = headerBuffer;
      } else {
        buffer = bufferOrTempPath;
        fileSizeBytes = buffer.length;
      }

      // 1. File Size Validation
      if (fileSizeBytes <= 0) {
        throw new BadRequestException('File is empty.');
      }
      if (fileSizeBytes > this.maxFileSizeBytes) {
        throw new BadRequestException(
          `File size (${(fileSizeBytes / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of ${(
            this.maxFileSizeBytes /
            (1024 * 1024)
          ).toFixed(2)}MB.`,
        );
      }

      // 2. Extension Validation
      const ext = path.extname(originalFilename).toLowerCase();
      if (!this.allowedExtensions.has(ext)) {
        throw new BadRequestException(
          `File extension '${ext}' is not permitted. Allowed extensions: ${Array.from(this.allowedExtensions).join(', ')}`,
        );
      }

      // 3. Declared MIME Validation
      if (!this.allowedMimes.has(declaredMime.toLowerCase())) {
        throw new BadRequestException(
          `Declared MIME type '${declaredMime}' is not permitted. Allowed MIME types: ${Array.from(this.allowedMimes).join(', ')}`,
        );
      }

      // 4. Deep Magic Byte Header Verification
      const detectedMime = this.detectMagicBytes(buffer, ext, declaredMime);
      if (!detectedMime) {
        throw new BadRequestException(
          `Security violation: File header magic bytes do not match declared extension '${ext}' or MIME type '${declaredMime}'.`,
        );
      }

      this.logger.log(`Validated file '${originalFilename}' (${fileSizeBytes} bytes, MIME: ${detectedMime})`);
      span?.end('OK', undefined, { detectedMime, extension: ext, fileSizeBytes });

      return {
        valid: true,
        detectedMime,
        extension: ext,
        fileSizeBytes,
      };
    } catch (err: any) {
      span?.end('ERROR', err?.message || 'File validation failed');
      throw err;
    }
  }

  private detectMagicBytes(buffer: Buffer, ext: string, declaredMime: string): string | null {
    if (buffer.length < 4) {
      if (ext === '.txt' || ext === '.md') return 'text/plain';
      return null;
    }

    const b0 = buffer[0];
    const b1 = buffer[1];
    const b2 = buffer[2];
    const b3 = buffer[3];

    // PDF Magic Bytes: %PDF- (0x25 0x50 0x44 0x46)
    if (b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46) {
      if (ext === '.pdf' || declaredMime === 'application/pdf') {
        return 'application/pdf';
      }
    }

    // PNG Magic Bytes: 0x89 0x50 0x4E 0x47
    if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4E && b3 === 0x47) {
      if (ext === '.png' || declaredMime === 'image/png') {
        return 'image/png';
      }
    }

    // JPEG Magic Bytes: 0xFF 0xD8 0xFF
    if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) {
      if (ext === '.jpg' || ext === '.jpeg' || declaredMime === 'image/jpeg') {
        return 'image/jpeg';
      }
    }

    // WEBP Magic Bytes: RIFF ... WEBP (b0-b3 = RIFF)
    if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46) {
      if (buffer.length >= 12) {
        const webpHeader = buffer.toString('ascii', 8, 12);
        if (webpHeader === 'WEBP' && (ext === '.webp' || declaredMime === 'image/webp')) {
          return 'image/webp';
        }
      }
    }

    // ZIP Container Magic Bytes: PK.. (0x50 0x4B 0x03 0x04) used for EPUB and DOCX
    if (b0 === 0x50 && b1 === 0x4b && b2 === 0x03 && b3 === 0x04) {
      if (ext === '.epub' || declaredMime === 'application/epub+zip') {
        return 'application/epub+zip';
      }
      if (ext === '.docx' || declaredMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
    }

    // Text & Markdown files (printable ASCII/UTF-8 check)
    if (ext === '.txt' || ext === '.md') {
      const isAsciiOrUtf8 = buffer.slice(0, Math.min(buffer.length, 512)).every((byte) => byte === 0x09 || byte === 0x0a || byte === 0x0d || (byte >= 0x20 && byte <= 0x7e) || byte >= 0xc0);
      if (isAsciiOrUtf8) {
        return 'text/plain';
      }
    }

    return null;
  }
}
