import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateLearningMaterialDto } from './dto/create-learning-material.dto';
import { UpdateLearningMaterialDto } from './dto/update-learning-material.dto';
import { QueryLearningMaterialDto } from './dto/query-learning-material.dto';
import { MaterialType, MaterialStatus, ProcessingStatus, LearningMaterial } from '@prisma/client';
import { ExtractionOrchestratorService } from './extraction/extraction-orchestrator.service';

@Injectable()
export class LearningMaterialService {
  private readonly logger = new Logger(LearningMaterialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestratorService: ExtractionOrchestratorService,
  ) {}

  /**
   * Deterministic stage progress calculation for frontend.
   */
  public calculateProgress(status: ProcessingStatus): number {
    switch (status) {
      case ProcessingStatus.UPLOADED:
        return 5;
      case ProcessingStatus.VALIDATING:
        return 15;
      case ProcessingStatus.STORED:
        return 25;
      case ProcessingStatus.EXTRACTING:
        return 40;
      case ProcessingStatus.STRUCTURING:
        return 60;
      case ProcessingStatus.CONCEPT_MAPPING:
        return 75;
      case ProcessingStatus.INDEXING:
        return 90;
      case ProcessingStatus.READY:
        return 100;
      case ProcessingStatus.FAILED:
        return 0;
      default:
        return 0;
    }
  }

  public mapStatusToStage(status: ProcessingStatus): string {
    switch (status) {
      case ProcessingStatus.UPLOADED:
      case ProcessingStatus.VALIDATING:
      case ProcessingStatus.STORED:
        return 'UPLOAD';
      case ProcessingStatus.EXTRACTING:
        return 'EXTRACTING';
      case ProcessingStatus.STRUCTURING:
        return 'STRUCTURING';
      case ProcessingStatus.CONCEPT_MAPPING:
        return 'KNOWLEDGE_GRAPH';
      case ProcessingStatus.INDEXING:
        return 'FINALIZING';
      case ProcessingStatus.READY:
        return 'COMPLETE';
      case ProcessingStatus.FAILED:
        return 'FAILED';
      default:
        return 'UPLOAD';
    }
  }

  async create(dto: CreateLearningMaterialDto): Promise<{ data: any }> {
    if (!dto.learnerId || typeof dto.learnerId !== 'string' || dto.learnerId.trim().length === 0) {
      throw new BadRequestException('learnerId is required.');
    }

    if (!dto.title || typeof dto.title !== 'string' || dto.title.trim().length === 0) {
      throw new BadRequestException('Title is required and cannot be empty.');
    }

    if (!dto.materialType || !Object.values(MaterialType).includes(dto.materialType)) {
      throw new BadRequestException(
        `Invalid materialType '${dto.materialType}'. Allowed: ${Object.values(MaterialType).join(', ')}`,
      );
    }

    if (dto.fileSizeBytes !== undefined && dto.fileSizeBytes < 0) {
      throw new BadRequestException('fileSizeBytes cannot be negative.');
    }

    // Verify learner exists
    const learner = await this.prisma.learner.findUnique({
      where: { id: dto.learnerId.trim() },
    });
    if (!learner) {
      throw new NotFoundException(`Learner with ID '${dto.learnerId}' not found.`);
    }

    const material = await this.prisma.learningMaterial.create({
      data: {
        learnerId: dto.learnerId.trim(),
        title: dto.title.trim(),
        description: dto.description || null,
        materialType: dto.materialType,
        status: MaterialStatus.DRAFT,
        processingStatus: ProcessingStatus.UPLOADED,
        subjectName: dto.subjectName || null,
        gradeLevel: dto.gradeLevel || null,
        language: dto.language || 'en',
        originalFileName: dto.originalFileName || null,
        mimeType: dto.mimeType || null,
        fileSizeBytes: dto.fileSizeBytes !== undefined ? BigInt(dto.fileSizeBytes) : null,
        storageKey: dto.storageKey || null,
      },
    });

    this.logger.log(`Created LearningMaterial ${material.id} '${material.title}' for Learner ${material.learnerId}`);
    return {
      data: {
        ...material,
        fileSizeBytes: material.fileSizeBytes ? Number(material.fileSizeBytes) : null,
        progress: this.calculateProgress(material.processingStatus),
      },
    };
  }

  async getAuthorizedLearnerIds(user?: any): Promise<string[] | 'ALL'> {
    if (!user || user.role === 'ADMIN') {
      return 'ALL';
    }

    if (user.role === 'PARENT') {
      const learners = await this.prisma.learner.findMany({
        where: {
          legacyChild: {
            parentId: user.userId,
          },
        },
        select: { id: true },
      });
      return learners.map((l) => l.id);
    }

    if (user.role === 'STUDENT') {
      const targetChildId = user.childId || user.userId;
      if (!targetChildId) return [];

      const learners = await this.prisma.learner.findMany({
        where: {
          legacyChildId: targetChildId,
        },
        select: { id: true },
      });
      return learners.map((l) => l.id);
    }

    return [];
  }

  async findAll(query: QueryLearningMaterialDto, user?: any): Promise<{
    items: any[];
    pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  }> {
    const page = Math.max(1, parseInt(String(query.page || 1), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize || 20), 10) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (user && user.role !== 'ADMIN') {
      const authorizedIds = await this.getAuthorizedLearnerIds(user);
      if (Array.isArray(authorizedIds)) {
        if (query.learnerId && query.learnerId.trim().length > 0) {
          const requestedId = query.learnerId.trim();
          if (!authorizedIds.includes(requestedId)) {
            throw new ForbiddenException('Access denied: You do not have permission to access materials for this learner.');
          }
          where.learnerId = requestedId;
        } else {
          where.learnerId = { in: authorizedIds };
        }
      }
    } else if (query.learnerId && query.learnerId.trim().length > 0) {
      where.learnerId = query.learnerId.trim();
    }

    if (query.status) {
      if (!Object.values(MaterialStatus).includes(query.status)) {
        throw new BadRequestException(`Invalid status filter '${query.status}'.`);
      }
      where.status = query.status;
    }

    if (query.processingStatus) {
      const statuses = query.processingStatus.split(',').map(s => s.trim()) as ProcessingStatus[];
      for (const status of statuses) {
        if (!Object.values(ProcessingStatus).includes(status)) {
          throw new BadRequestException(`Invalid processingStatus filter value '${status}'.`);
        }
      }
      where.processingStatus = { in: statuses };
    }

    if (query.materialType) {
      if (!Object.values(MaterialType).includes(query.materialType)) {
        throw new BadRequestException(`Invalid materialType filter '${query.materialType}'.`);
      }
      where.materialType = query.materialType;
    }

    if (query.subjectName && query.subjectName.trim().length > 0) {
      where.subjectName = { contains: query.subjectName.trim(), mode: 'insensitive' };
    }

    if (query.gradeLevel && query.gradeLevel.trim().length > 0) {
      where.gradeLevel = query.gradeLevel.trim();
    }

    if (query.search && query.search.trim().length > 0) {
      const searchTerm = query.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { subjectName: { contains: searchTerm, mode: 'insensitive' } },
        { originalFileName: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.learningMaterial.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.learningMaterial.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || (total === 0 ? 0 : 1);

    // Convert BigInt fileSizeBytes to number/string and fetch counts for each item
    const sanitizedItems = await Promise.all(items.map(async (item) => {
      const [chaptersCount, topicsCount, conceptsCount] = await Promise.all([
        this.prisma.contentChapter.count({ where: { document: { materialId: item.id } } }),
        this.prisma.contentTopic.count({ where: { chapter: { document: { materialId: item.id } } } }),
        this.prisma.concept.count({
          where: {
            sourceChunks: {
              some: {
                chunk: {
                  document: {
                    materialId: item.id,
                  },
                },
              },
            },
          },
        }),
      ]);

      return {
        ...item,
        fileSizeBytes: item.fileSizeBytes ? Number(item.fileSizeBytes) : null,
        progress: this.calculateProgress(item.processingStatus),
        stage: this.mapStatusToStage(item.processingStatus),
        chaptersCount,
        topicsCount,
        conceptsCount,
      };
    }));

    return {
      items: sanitizedItems,
      pagination: { page, pageSize, totalItems: total, totalPages },
    };
  }

  async findOne(id: string): Promise<{ data: any }> {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('LearningMaterial ID is required.');
    }

    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: id.trim() },
      include: {
        learner: {
          select: { id: true, name: true, learnerType: true, preferredLanguage: true },
        },
        documents: {
          select: {
            id: true,
            title: true,
            status: true,
            pageCount: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException(`LearningMaterial with ID '${id}' not found.`);
    }

    const [chaptersCount, topicsCount, conceptsCount] = await Promise.all([
      this.prisma.contentChapter.count({ where: { document: { materialId: material.id } } }),
      this.prisma.contentTopic.count({ where: { chapter: { document: { materialId: material.id } } } }),
      this.prisma.concept.count({
        where: {
          sourceChunks: {
            some: {
              chunk: {
                document: {
                  materialId: material.id,
                },
              },
            },
          },
        },
      }),
    ]);

    const sanitized = {
      ...material,
      fileSizeBytes: material.fileSizeBytes ? Number(material.fileSizeBytes) : null,
      progress: this.calculateProgress(material.processingStatus),
      stage: this.mapStatusToStage(material.processingStatus),
      chaptersCount,
      topicsCount,
      conceptsCount,
    };

    return { data: sanitized };
  }

  async update(id: string, dto: UpdateLearningMaterialDto): Promise<{ data: any }> {
    await this.findOne(id); // Ensure material exists

    const data: any = {};

    if (dto.title !== undefined) {
      if (typeof dto.title !== 'string' || dto.title.trim().length === 0) {
        throw new BadRequestException('Title cannot be empty.');
      }
      data.title = dto.title.trim();
    }

    if (dto.description !== undefined) data.description = dto.description;
    if (dto.subjectName !== undefined) data.subjectName = dto.subjectName;
    if (dto.gradeLevel !== undefined) data.gradeLevel = dto.gradeLevel;
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.originalFileName !== undefined) data.originalFileName = dto.originalFileName;
    if (dto.mimeType !== undefined) data.mimeType = dto.mimeType;
    if (dto.storageKey !== undefined) data.storageKey = dto.storageKey;
    if (dto.failureReason !== undefined) data.failureReason = dto.failureReason;
    if (dto.processingVersion !== undefined) data.processingVersion = dto.processingVersion;

    if (dto.materialType !== undefined) {
      if (!Object.values(MaterialType).includes(dto.materialType)) {
        throw new BadRequestException(`Invalid materialType '${dto.materialType}'.`);
      }
      data.materialType = dto.materialType;
    }

    if (dto.status !== undefined) {
      if (!Object.values(MaterialStatus).includes(dto.status)) {
        throw new BadRequestException(`Invalid status '${dto.status}'.`);
      }
      data.status = dto.status;
    }

    if (dto.processingStatus !== undefined) {
      if (!Object.values(ProcessingStatus).includes(dto.processingStatus)) {
        throw new BadRequestException(`Invalid processingStatus '${dto.processingStatus}'.`);
      }
      data.processingStatus = dto.processingStatus;
    }

    if (dto.fileSizeBytes !== undefined) {
      if (dto.fileSizeBytes < 0) throw new BadRequestException('fileSizeBytes cannot be negative.');
      data.fileSizeBytes = BigInt(dto.fileSizeBytes);
    }

    const updated = await this.prisma.learningMaterial.update({
      where: { id: id.trim() },
      data,
    });

    this.logger.log(`Updated LearningMaterial ${id}`);
    return {
      data: {
        ...updated,
        fileSizeBytes: updated.fileSizeBytes ? Number(updated.fileSizeBytes) : null,
        progress: this.calculateProgress(updated.processingStatus),
      },
    };
  }

  async softDelete(id: string, action: 'delete' | 'archive' = 'delete'): Promise<{ data: any }> {
    const { data: existing } = await this.findOne(id);

    const newStatus = action === 'archive' ? MaterialStatus.ARCHIVED : MaterialStatus.DELETED;

    const updated = await this.prisma.learningMaterial.update({
      where: { id: existing.id },
      data: { status: newStatus },
    });

    this.logger.log(`Logically updated status of LearningMaterial ${id} to ${newStatus}`);

    return {
      data: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        message: `Learning material successfully ${newStatus === MaterialStatus.ARCHIVED ? 'archived' : 'deleted'}.`,
      },
    };
  }

  async getProcessingStatus(id: string): Promise<{
    id: string;
    status: string;
    stage: string;
    progress: number;
    failureReason: string | null;
  }> {
    const { data: material } = await this.findOne(id);
    return {
      id: material.id,
      status: material.processingStatus,
      stage: material.stage,
      progress: material.progress,
      failureReason: material.failureReason || null,
    };
  }

  async retry(id: string, user?: any): Promise<{ data: any }> {
    const materialId = id.trim();

    // 1. Fetch material & verify existence
    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: materialId },
    });
    if (!material) {
      throw new NotFoundException(`LearningMaterial with ID '${materialId}' not found.`);
    }

    // 2. Tenant scoping authorization
    const authorizedLearnerIds = await this.getAuthorizedLearnerIds(user);
    if (Array.isArray(authorizedLearnerIds) && !authorizedLearnerIds.includes(material.learnerId)) {
      throw new ForbiddenException('Access denied: You do not have permission to access this material.');
    }

    // 3. IDEMPOTENCY check: If already in a processing state, return current status immediately
    const processingStates: ProcessingStatus[] = [
      ProcessingStatus.UPLOADED,
      ProcessingStatus.VALIDATING,
      ProcessingStatus.STORED,
      ProcessingStatus.EXTRACTING,
      ProcessingStatus.STRUCTURING,
      ProcessingStatus.CONCEPT_MAPPING,
      ProcessingStatus.INDEXING,
    ];
    if (processingStates.includes(material.processingStatus)) {
      const progress = this.calculateProgress(material.processingStatus);
      return {
        data: {
          id: material.id,
          title: material.title,
          processingStatus: material.processingStatus,
          progress,
          stage: this.mapStatusToStage(material.processingStatus),
          failureReason: null,
        },
      };
    }

    // 4. Retry check: Restrict retry execution to FAILED materials
    if (material.processingStatus !== ProcessingStatus.FAILED) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'MATERIAL_NOT_RETRYABLE',
          message: 'This material cannot be retried in its current state.',
        },
      });
    }

    // 5. Transactionally update: reset to UPLOADED, progress 0, clear failure reason
    const updated = await this.prisma.learningMaterial.update({
      where: { id: material.id },
      data: {
        processingStatus: ProcessingStatus.UPLOADED,
        failureReason: null,
      },
    });

    // 6. Trigger processing asynchronously (discard promise to run in background)
    this.orchestratorService.processMaterial(material.id, user).catch((err) => {
      this.logger.error(`Async retry processing background job failed for material ${material.id}: ${err.message}`);
    });

    return {
      data: {
        id: updated.id,
        title: updated.title,
        processingStatus: updated.processingStatus,
        progress: 0,
        stage: this.mapStatusToStage(updated.processingStatus),
        failureReason: null,
      },
    };
  }
}
