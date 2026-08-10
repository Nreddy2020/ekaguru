import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { FileValidatorService } from './file-validator.service';
import { UploadMaterialDto, ProvenanceType } from './dto/upload-material.dto';
import { MaterialStatus, ProcessingStatus, DocumentStatus } from '@prisma/client';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';
import { Readable } from 'stream';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly fileValidatorService: FileValidatorService,
    private readonly authGuard: LearningLibraryAuthGuard,
  ) {}

  async handleFileUpload(
    dto: UploadMaterialDto,
    file: Express.Multer.File,
    user?: any,
  ): Promise<{ data: any }> {
    if (!file || (!file.path && !file.buffer)) {
      throw new BadRequestException('No file attached to upload request.');
    }

    if (!dto.learnerId || typeof dto.learnerId !== 'string' || dto.learnerId.trim().length === 0) {
      throw new BadRequestException('learnerId is required.');
    }

    if (!dto.title || typeof dto.title !== 'string' || dto.title.trim().length === 0) {
      throw new BadRequestException('Title is required and cannot be empty.');
    }

    // FIX 1 — PROVENANCE TRUST BOUNDARY: Public Upload API strictly requires USER_UPLOADED
    if (
      dto.provenanceType &&
      dto.provenanceType !== ProvenanceType.USER_UPLOADED
    ) {
      throw new BadRequestException(
        `Public upload API only accepts '${ProvenanceType.USER_UPLOADED}' provenance. Provenance type '${dto.provenanceType}' is reserved for internal trusted workflows.`,
      );
    }

    const learnerId = dto.learnerId.trim();

    // 1. Verify Learner exists and user is authorized
    if (user && user.role !== 'ADMIN') {
      const isAuthorized = await this.authGuard.verifyUserLearnerOwnership(user, learnerId);
      if (!isAuthorized) {
        throw new ForbiddenException(
          'Access denied: You do not have permission to upload materials for this learner.',
        );
      }
    } else {
      const learner = await this.prisma.learner.findUnique({
        where: { id: learnerId },
      });
      if (!learner) {
        throw new NotFoundException(`Learner with ID '${learnerId}' not found.`);
      }
    }

    const fileSource = file.path ? file.path : file.buffer;

    let storageKey: string | null = null;

    try {
      // 2. ORDER OF OPERATIONS: Validate File BEFORE Permanent Storage
      const validationResult = this.fileValidatorService.validateFileHeader(
        fileSource,
        file.originalname,
        file.mimetype,
      );

      // FIX 2 — SERVER CONTROLLED STORAGE CATEGORY: Public uploads are ALWAYS 'source'
      const category: 'source' = 'source';
      const tenantId = user?.userId ? user.userId : 'default-tenant';
      const subpath = `${tenantId}/${learnerId}`;

      // 3. Stream file from temp disk/buffer into permanent storage
      const fileStream = file.path
        ? fs.createReadStream(file.path)
        : Readable.from(file.buffer);

      const storageResult = await this.storageService.saveFile(
        fileStream,
        file.originalname,
        category,
        subpath,
        validationResult.detectedMime,
      );

      storageKey = storageResult.storageKey;

      // 4. Create LearningMaterial & Document DB records with transaction rollback protection
      const material = await this.prisma.learningMaterial.create({
        data: {
          learnerId,
          title: dto.title.trim(),
          description: dto.description || null,
          materialType: dto.materialType,
          status: MaterialStatus.ACTIVE,
          processingStatus: ProcessingStatus.STORED,
          subjectName: dto.subjectName || null,
          gradeLevel: dto.gradeLevel || null,
          language: dto.language || 'en',
          originalFileName: file.originalname,
          mimeType: validationResult.detectedMime,
          fileSizeBytes: BigInt(storageResult.fileSizeBytes),
          storageKey: storageResult.storageKey,
        },
      });

      const doc = await this.prisma.document.create({
        data: {
          materialId: material.id,
          title: `${dto.title.trim()} Document`,
          status: DocumentStatus.PENDING,
          pageCount: 0,
        },
      });

      this.logger.log(
        `Successfully uploaded and stored material ${material.id} '${material.title}' (${storageResult.fileSizeBytes} bytes, SHA-256: ${storageResult.checksum})`,
      );

      return {
        data: {
          id: material.id,
          learnerId: material.learnerId,
          title: material.title,
          description: material.description,
          materialType: material.materialType,
          status: material.status,
          processingStatus: material.processingStatus,
          progress: 25,
          currentStage: 'STORED',
          subjectName: material.subjectName,
          gradeLevel: material.gradeLevel,
          language: material.language,
          originalFileName: material.originalFileName,
          mimeType: material.mimeType,
          fileSizeBytes: Number(material.fileSizeBytes),
          storageKey: material.storageKey,
          checksum: storageResult.checksum,
          provenanceType: ProvenanceType.USER_UPLOADED,
          sourceOrganization: dto.sourceOrganization || null,
          sourceLicense: dto.sourceLicense || 'PROPRIETARY_USER_REFERENCE',
          documentId: doc.id,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt,
        },
      };
    } catch (error) {
      // FIX 3 — STORAGE ROLLBACK: If DB creation or storage fails, clean up permanent stored file
      if (storageKey) {
        this.logger.warn(`Upload failed after file write. Cleaning up stored file: ${storageKey}`);
        await this.storageService.deleteFile(storageKey).catch((cleanupErr) => {
          this.logger.error(`Failed to clean up stored file ${storageKey}: ${cleanupErr.message}`);
        });
      }
      throw error;
    } finally {
      // FIX 4 — TEMP FILE CLEANUP: Delete temporary file after stream closes
      if (file.path && fs.existsSync(file.path)) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 20));
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (unlinkErr) {
          this.logger.error(`Failed to delete temporary file ${file.path}: ${unlinkErr.message}`);
        }
      }
    }
  }
}
