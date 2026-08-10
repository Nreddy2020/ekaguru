import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { FileValidatorService } from './file-validator.service';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';
import { MaterialType, MaterialStatus, ProcessingStatus, LearnerType, DocumentStatus } from '@prisma/client';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProvenanceType } from './dto/upload-material.dto';
import * as fs from 'fs';
import * as path from 'path';

describe('UploadService Security & Remediation Tests', () => {
  let service: UploadService;
  let prisma: any;
  let storageService: any;
  let fileValidatorService: any;
  let authGuard: any;

  const mockLearner = {
    id: 'learner-123',
    name: 'Student Learner',
    learnerType: LearnerType.STUDENT,
  };

  const mockMaterial = {
    id: 'mat-upload-123',
    learnerId: 'learner-123',
    title: 'Physics Textbook',
    materialType: MaterialType.TEXTBOOK,
    status: MaterialStatus.ACTIVE,
    processingStatus: ProcessingStatus.STORED,
    fileSizeBytes: BigInt(2048),
    storageKey: 'v2/source/tenant-1/learner-123/mat-upload-123/uuid.pdf',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDocument = {
    id: 'doc-upload-123',
    materialId: 'mat-upload-123',
    title: 'Physics Textbook Document',
    status: DocumentStatus.PENDING,
    pageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      learner: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'learner-123') return Promise.resolve(mockLearner);
          return Promise.resolve(null);
        }),
      },
      learningMaterial: {
        create: jest.fn().mockResolvedValue(mockMaterial),
      },
      document: {
        create: jest.fn().mockResolvedValue(mockDocument),
      },
    };

    storageService = {
      saveFile: jest.fn().mockImplementation((fileStream) => {
        if (fileStream && typeof fileStream.resume === 'function') {
          fileStream.resume();
        }
        return Promise.resolve({
          storageKey: 'v2/source/tenant-1/learner-123/uuid.pdf',
          fileSizeBytes: 2048,
          checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          mimeType: 'application/pdf',
        });
      }),
      deleteFile: jest.fn().mockResolvedValue(true),
    };

    fileValidatorService = {
      validateFileHeader: jest.fn().mockReturnValue({
        valid: true,
        detectedMime: 'application/pdf',
        extension: '.pdf',
        fileSizeBytes: 2048,
      }),
    };

    authGuard = {
      verifyUserLearnerOwnership: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
        { provide: FileValidatorService, useValue: fileValidatorService },
        { provide: LearningLibraryAuthGuard, useValue: authGuard },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('1. USER_UPLOADED provenance is accepted', async () => {
    const fakeFile: any = {
      originalname: 'physics.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7 Test PDF Data'),
      size: 2048,
    };

    const res = await service.handleFileUpload(
      {
        learnerId: 'learner-123',
        title: 'Physics Textbook',
        materialType: MaterialType.TEXTBOOK,
        provenanceType: ProvenanceType.USER_UPLOADED,
      },
      fakeFile,
      { userId: 'tenant-1', role: 'PARENT' },
    );

    expect(res.data.provenanceType).toBe('USER_UPLOADED');
    expect(storageService.saveFile).toHaveBeenCalledWith(
      expect.anything(),
      'physics.pdf',
      'source', // Hardcoded source category
      'tenant-1/learner-123',
      'application/pdf',
    );
  });

  it('2. EKAGURU_SYNTHESIZED rejected from public upload (400 Bad Request)', async () => {
    const fakeFile: any = {
      originalname: 'gen.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7'),
    };

    await expect(
      service.handleFileUpload(
        {
          learnerId: 'learner-123',
          title: 'Fake Generated Material',
          materialType: MaterialType.TEXTBOOK,
          provenanceType: ProvenanceType.EKAGURU_SYNTHESIZED,
        },
        fakeFile,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('3. CURRICULUM_STANDARD rejected from public upload (400 Bad Request)', async () => {
    const fakeFile: any = {
      originalname: 'standard.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7'),
    };

    await expect(
      service.handleFileUpload(
        {
          learnerId: 'learner-123',
          title: 'Fake Standard',
          materialType: MaterialType.TEXTBOOK,
          provenanceType: ProvenanceType.CURRICULUM_STANDARD,
        },
        fakeFile,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('4. PUBLIC_DOMAIN rejected from public upload (400 Bad Request)', async () => {
    const fakeFile: any = {
      originalname: 'pd.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7'),
    };

    await expect(
      service.handleFileUpload(
        {
          learnerId: 'learner-123',
          title: 'Fake Public Domain',
          materialType: MaterialType.TEXTBOOK,
          provenanceType: ProvenanceType.PUBLIC_DOMAIN,
        },
        fakeFile,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('5. Upload always uses source storage directory', async () => {
    const fakeFile: any = {
      originalname: 'sample.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7'),
    };

    await service.handleFileUpload(
      {
        learnerId: 'learner-123',
        title: 'Sample Material',
        materialType: MaterialType.TEXTBOOK,
      },
      fakeFile,
    );

    expect(storageService.saveFile).toHaveBeenCalledWith(
      expect.anything(),
      'sample.pdf',
      'source', // Strictly source
      expect.any(String),
      'application/pdf',
    );
  });

  it('6. DB failure triggers permanent stored file rollback/deletion', async () => {
    prisma.learningMaterial.create.mockRejectedValueOnce(new Error('DB Connection Failed'));

    const fakeFile: any = {
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7'),
    };

    await expect(
      service.handleFileUpload(
        {
          learnerId: 'learner-123',
          title: 'Test Material',
          materialType: MaterialType.TEXTBOOK,
        },
        fakeFile,
      ),
    ).rejects.toThrow('DB Connection Failed');

    expect(storageService.deleteFile).toHaveBeenCalledWith(
      'v2/source/tenant-1/learner-123/uuid.pdf',
    );
  });

  it('7. Document creation failure cleans up permanent stored file', async () => {
    prisma.document.create.mockRejectedValueOnce(new Error('Document Insert Failed'));

    const fakeFile: any = {
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7'),
    };

    await expect(
      service.handleFileUpload(
        {
          learnerId: 'learner-123',
          title: 'Test Material',
          materialType: MaterialType.TEXTBOOK,
        },
        fakeFile,
      ),
    ).rejects.toThrow('Document Insert Failed');

    expect(storageService.deleteFile).toHaveBeenCalledWith(
      'v2/source/tenant-1/learner-123/uuid.pdf',
    );
  });

  it('8. Temporary disk upload file is cleaned up after success or failure', async () => {
    const tempFileDir = path.resolve(process.cwd(), './uploads/test_tmp');
    if (!fs.existsSync(tempFileDir)) fs.mkdirSync(tempFileDir, { recursive: true });

    const tempFilePath = path.join(tempFileDir, 'test-upload.tmp');
    fs.writeFileSync(tempFilePath, '%PDF-1.7 Fake Content');

    const fakeDiskFile: any = {
      originalname: 'disk-file.pdf',
      mimetype: 'application/pdf',
      path: tempFilePath,
    };

    await service.handleFileUpload(
      {
        learnerId: 'learner-123',
        title: 'Disk Upload Material',
        materialType: MaterialType.TEXTBOOK,
      },
      fakeDiskFile,
    );

    // Verify temp file was unlinked
    expect(fs.existsSync(tempFilePath)).toBe(false);

    if (fs.existsSync(tempFileDir)) fs.rmSync(tempFileDir, { recursive: true, force: true });
  });
});
