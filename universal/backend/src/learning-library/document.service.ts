import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentStatus, Document } from '@prisma/client';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createForMaterial(materialId: string, dto: CreateDocumentDto): Promise<{ data: Document }> {
    if (!materialId || materialId.trim().length === 0) {
      throw new BadRequestException('materialId is required.');
    }

    // Verify material exists
    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: materialId.trim() },
    });
    if (!material) {
      throw new NotFoundException(`LearningMaterial with ID '${materialId}' not found.`);
    }

    if (dto.pageCount !== undefined && dto.pageCount < 0) {
      throw new BadRequestException('pageCount cannot be negative.');
    }

    if (dto.status && !Object.values(DocumentStatus).includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status '${dto.status}'. Allowed: ${Object.values(DocumentStatus).join(', ')}`,
      );
    }

    const document = await this.prisma.document.create({
      data: {
        materialId: materialId.trim(),
        title: dto.title || material.title,
        status: dto.status || DocumentStatus.PENDING,
        pageCount: dto.pageCount !== undefined ? dto.pageCount : null,
      },
    });

    this.logger.log(`Created Document ${document.id} for LearningMaterial ${materialId}`);
    return { data: document };
  }

  async findAllForMaterial(materialId: string): Promise<{ data: Document[] }> {
    if (!materialId || materialId.trim().length === 0) {
      throw new BadRequestException('materialId is required.');
    }

    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: materialId.trim() },
    });
    if (!material) {
      throw new NotFoundException(`LearningMaterial with ID '${materialId}' not found.`);
    }

    const documents = await this.prisma.document.findMany({
      where: { materialId: materialId.trim() },
      orderBy: { createdAt: 'asc' },
    });

    return { data: documents };
  }

  async findOne(id: string): Promise<{ data: any }> {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Document ID is required.');
    }

    const document = await this.prisma.document.findUnique({
      where: { id: id.trim() },
      include: {
        material: {
          select: { id: true, title: true, learnerId: true, materialType: true },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID '${id}' not found.`);
    }

    return { data: document };
  }

  async update(id: string, dto: UpdateDocumentDto): Promise<{ data: Document }> {
    await this.findOne(id); // Throws NotFoundException if missing

    const data: any = {};

    if (dto.title !== undefined) {
      if (typeof dto.title !== 'string' || dto.title.trim().length === 0) {
        throw new BadRequestException('Document title cannot be empty.');
      }
      data.title = dto.title.trim();
    }

    if (dto.status !== undefined) {
      if (!Object.values(DocumentStatus).includes(dto.status)) {
        throw new BadRequestException(`Invalid status '${dto.status}'.`);
      }
      data.status = dto.status;
    }

    if (dto.pageCount !== undefined) {
      if (dto.pageCount < 0) throw new BadRequestException('pageCount cannot be negative.');
      data.pageCount = dto.pageCount;
    }

    const updated = await this.prisma.document.update({
      where: { id: id.trim() },
      data,
    });

    this.logger.log(`Updated Document ${id}`);
    return { data: updated };
  }
}
