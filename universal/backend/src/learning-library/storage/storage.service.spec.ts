import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { LocalStorageService } from './local-storage.service';
import { Readable } from 'stream';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

describe('StorageService & LocalStorageService', () => {
  let service: StorageService;
  let localStorageService: LocalStorageService;
  const testDir = path.resolve(process.cwd(), './uploads/test_v2');

  beforeEach(async () => {
    process.env.UPLOAD_DIR = './uploads/test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService, LocalStorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
    localStorageService = module.get<LocalStorageService>(LocalStorageService);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(localStorageService).toBeDefined();
  });

  it('should save file and compute SHA-256 checksum', async () => {
    const fileContent = 'EKAGURU Test Content for Checksum';
    const stream = Readable.from([Buffer.from(fileContent)]);

    const result = await service.saveFile(
      stream,
      'test-doc.pdf',
      'source',
      'tenant-1/learner-1',
      'application/pdf',
    );

    expect(result.storageKey).toMatch(/^v2\/source\/tenant-1\/learner-1\/[a-f0-9-]+\.pdf$/);
    expect(result.fileSizeBytes).toBe(Buffer.byteLength(fileContent));
    expect(result.checksum).toHaveLength(64); // SHA-256 length
    expect(result.mimeType).toBe('application/pdf');

    // Clean up created file
    await service.deleteFile(result.storageKey);
  });

  it('should throw BadRequestException on path traversal attempt in subpath', async () => {
    const stream = Readable.from([Buffer.from('data')]);
    await expect(
      service.saveFile(stream, 'test.pdf', 'source', '../etc/passwd', 'application/pdf'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException on path traversal attempt in storageKey', async () => {
    await expect(service.getFileStream('v2/source/../../etc/passwd')).rejects.toThrow(
      BadRequestException,
    );
  });
});
