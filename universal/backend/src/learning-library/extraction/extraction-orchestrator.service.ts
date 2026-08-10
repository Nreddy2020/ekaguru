import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { ExtractorFactoryService } from './extractor-factory.service';
import { StructureDetectorService } from './structure-detector.service';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';
import { ProcessingStatus, DocumentStatus } from '@prisma/client';
import * as path from 'path';

@Injectable()
export class ExtractionOrchestratorService {
  private readonly logger = new Logger(ExtractionOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly extractorFactory: ExtractorFactoryService,
    private readonly structureDetector: StructureDetectorService,
    private readonly authGuard: LearningLibraryAuthGuard,
  ) {}

  async processMaterial(id: string, user?: any): Promise<{ data: any }> {
    const materialId = id.trim();

    // 1. Resolve LearningMaterial
    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: materialId },
      include: { documents: true },
    });

    if (!material) {
      throw new NotFoundException(`LearningMaterial with ID '${materialId}' not found.`);
    }

    // 2. Security Check: Authorize Learner Ownership
    if (user && user.role !== 'ADMIN') {
      const isAuthorized = await this.authGuard.verifyUserLearnerOwnership(user, material.learnerId);
      if (!isAuthorized) {
        throw new ForbiddenException('Access denied: You do not have permission to process this material.');
      }
    }

    // 3. IDEMPOTENCY CHECK: If already READY, return existing state without duplicate creation
    if (material.processingStatus === ProcessingStatus.READY) {
      this.logger.log(`Material ${materialId} is already READY. Returning existing processed state.`);
      return {
        data: {
          id: material.id,
          title: material.title,
          processingStatus: material.processingStatus,
          progress: 100,
          currentStage: 'READY',
          message: 'Material is already fully processed.',
          updatedAt: material.updatedAt,
        },
      };
    }

    // 4. ATOMIC RACE CONDITION LOCK: Attempt to claim EXTRACTING state (prevents concurrent duplicate processing)
    const lockResult = await this.prisma.learningMaterial.updateMany({
      where: {
        id: material.id,
        processingStatus: {
          notIn: [ProcessingStatus.EXTRACTING, ProcessingStatus.STRUCTURING],
        },
      },
      data: {
        processingStatus: ProcessingStatus.EXTRACTING,
        failureReason: null,
      },
    });

    if (lockResult.count === 0) {
      throw new ConflictException(
        `Processing is currently in progress for material '${materialId}'.`,
      );
    }

    // 5. Verify source storageKey exists
    if (!material.storageKey) {
      await this.prisma.learningMaterial.update({
        where: { id: material.id },
        data: { processingStatus: ProcessingStatus.FAILED, failureReason: 'Material has no storageKey assigned.' },
      });
      throw new BadRequestException(`Material '${materialId}' has no storageKey assigned.`);
    }

    const fileExists = await this.storageService.fileExists(material.storageKey);
    if (!fileExists) {
      await this.prisma.learningMaterial.update({
        where: { id: material.id },
        data: { processingStatus: ProcessingStatus.FAILED, failureReason: `Source file '${material.storageKey}' not found.` },
      });
      throw new NotFoundException(`Source file '${material.storageKey}' not found in storage.`);
    }

    // Resolve associated Document record (or create if missing)
    let docRecord = material.documents && material.documents.length > 0 ? material.documents[0] : null;
    if (!docRecord) {
      docRecord = await this.prisma.document.create({
        data: {
          materialId: material.id,
          title: `${material.title} Document`,
          status: DocumentStatus.PROCESSING,
        },
      });
    } else {
      await this.prisma.document.update({
        where: { id: docRecord.id },
        data: { status: DocumentStatus.PROCESSING },
      });
    }

    const fullFilePath = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads', material.storageKey);

    try {
      // 6. STAGE 1: EXTRACTING (40% progress)
      const extractor = this.extractorFactory.getExtractor(
        material.mimeType || 'application/pdf',
        material.originalFileName || 'document.pdf',
      );

      const extractedDoc = await extractor.extract(
        fullFilePath,
        material.originalFileName || 'document.pdf',
      );

      // 7. STAGE 2: STRUCTURING (60% progress)
      await this.prisma.learningMaterial.update({
        where: { id: material.id },
        data: { processingStatus: ProcessingStatus.STRUCTURING },
      });

      const structureResult = this.structureDetector.processStructure(extractedDoc);

      // 8. TRANSACTION SAFETY & CLEAN RETRY: Persist Pages, Chapters, Topics, and Chunks inside Prisma Transaction
      await this.prisma.$transaction(async (tx) => {
        // Clean up any previous partial records if retrying from FAILED state
        await tx.contentChunk.deleteMany({ where: { documentId: docRecord.id } });
        await tx.contentTopic.deleteMany({ where: { chapter: { documentId: docRecord.id } } });
        await tx.contentChapter.deleteMany({ where: { documentId: docRecord.id } });
        await tx.documentPage.deleteMany({ where: { documentId: docRecord.id } });

        // Save Pages
        for (const p of structureResult.pages) {
          await tx.documentPage.create({
            data: {
              documentId: docRecord.id,
              pageNumber: p.pageNumber,
              text: p.rawText,
              ocrApplied: extractedDoc.warnings.includes('OCR_REQUIRED'),
            },
          });
        }

        // Save Chapters & Topics
        const chapterIdMap = new Map<number, string>();
        const topicIdMap = new Map<string, string>();

        for (const c of structureResult.chapters) {
          const createdChapter = await tx.contentChapter.create({
            data: {
              documentId: docRecord.id,
              title: c.title,
              chapterNumber: c.chapterNumber || null,
              orderIndex: c.orderIndex,
            },
          });
          chapterIdMap.set(c.orderIndex, createdChapter.id);

          for (const t of c.topics) {
            const createdTopic = await tx.contentTopic.create({
              data: {
                chapterId: createdChapter.id,
                title: t.title,
                orderIndex: t.orderIndex,
              },
            });
            topicIdMap.set(`${c.orderIndex}_${t.orderIndex}`, createdTopic.id);
          }
        }

        // Save Content Chunks with Lineage Links
        for (const ch of structureResult.chunks) {
          const chapterDbId = ch.chapterOrderIndex ? chapterIdMap.get(ch.chapterOrderIndex) || null : null;
          const topicDbId =
            ch.chapterOrderIndex && ch.topicOrderIndex
              ? topicIdMap.get(`${ch.chapterOrderIndex}_${ch.topicOrderIndex}`) || null
              : null;

          await tx.contentChunk.create({
            data: {
              documentId: docRecord.id,
              chapterId: chapterDbId,
              topicId: topicDbId,
              sequenceNumber: ch.sequenceNumber,
              content: ch.content,
              pageStart: ch.pageStart,
              pageEnd: ch.pageEnd,
            },
          });
        }

        // Update Document status to READY
        await tx.document.update({
          where: { id: docRecord.id },
          data: {
            status: DocumentStatus.READY,
            pageCount: extractedDoc.pages.length,
            extractedText: extractedDoc.pages.map((p) => p.rawText).join('\n\n').slice(0, 5000),
          },
        });

        // Update LearningMaterial status to READY (100% progress)
        await tx.learningMaterial.update({
          where: { id: material.id },
          data: {
            processingStatus: ProcessingStatus.READY,
            failureReason: extractedDoc.warnings.length > 0 ? extractedDoc.warnings.join('; ') : null,
          },
        });
      });

      this.logger.log(
        `Successfully processed material ${material.id}: created ${structureResult.pages.length} pages, ${structureResult.chapters.length} chapters, ${structureResult.chunks.length} chunks.`,
      );

      return {
        data: {
          id: material.id,
          title: material.title,
          processingStatus: ProcessingStatus.READY,
          progress: 100,
          currentStage: 'READY',
          warnings: extractedDoc.warnings,
          pageCount: extractedDoc.pages.length,
          chunkCount: structureResult.chunks.length,
          chapterCount: structureResult.chapters.length,
          updatedAt: new Date(),
        },
      };
    } catch (err) {
      this.logger.error(`Error processing material ${materialId}: ${err.message}`);

      // Transaction rollback ensures no partial DB records remain; mark status = FAILED
      await this.prisma.learningMaterial.update({
        where: { id: material.id },
        data: {
          processingStatus: ProcessingStatus.FAILED,
          failureReason: err.message,
        },
      });

      await this.prisma.document.update({
        where: { id: docRecord.id },
        data: {
          status: DocumentStatus.FAILED,
        },
      });

      throw err;
    }
  }

  async getChunks(id: string, user?: any, page = 1, pageSize = 20): Promise<{ data: any[]; meta: any }> {
    const materialId = id.trim();

    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: materialId },
      include: { documents: true },
    });

    if (!material) {
      throw new NotFoundException(`LearningMaterial with ID '${materialId}' not found.`);
    }

    if (user && user.role !== 'ADMIN') {
      const isAuthorized = await this.authGuard.verifyUserLearnerOwnership(user, material.learnerId);
      if (!isAuthorized) {
        throw new ForbiddenException('Access denied: You do not have permission to view chunks for this material.');
      }
    }

    const docRecord = material.documents && material.documents.length > 0 ? material.documents[0] : null;
    if (!docRecord) {
      return {
        data: [],
        meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      };
    }

    const p = Math.max(1, page);
    const ps = Math.min(100, Math.max(1, pageSize));
    const skip = (p - 1) * ps;

    const [chunks, total] = await Promise.all([
      this.prisma.contentChunk.findMany({
        where: { documentId: docRecord.id },
        orderBy: { sequenceNumber: 'asc' },
        skip,
        take: ps,
        include: {
          chapter: { select: { title: true, orderIndex: true } },
          topic: { select: { title: true, orderIndex: true } },
        },
      }),
      this.prisma.contentChunk.count({ where: { documentId: docRecord.id } }),
    ]);

    return {
      data: chunks.map((c) => ({
        id: c.id,
        documentId: c.documentId,
        sequenceNumber: c.sequenceNumber,
        content: c.content,
        pageStart: c.pageStart,
        pageEnd: c.pageEnd,
        chapter: c.chapter ? { title: c.chapter.title, orderIndex: c.chapter.orderIndex } : null,
        topic: c.topic ? { title: c.topic.title, orderIndex: c.topic.orderIndex } : null,
        createdAt: c.createdAt,
      })),
      meta: {
        page: p,
        pageSize: ps,
        total,
        totalPages: Math.ceil(total / ps),
      },
    };
  }
}
