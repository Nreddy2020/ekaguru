import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { UpdateLearnerDto } from './dto/update-learner.dto';
import { LearnerType, Learner } from '@prisma/client';

@Injectable()
export class LearnerService {
  private readonly logger = new Logger(LearnerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLearnerDto): Promise<{ data: Learner }> {
    if (!dto.name || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('Learner name is required and cannot be empty.');
    }

    if (!dto.learnerType || !Object.values(LearnerType).includes(dto.learnerType)) {
      throw new BadRequestException(
        `Invalid learnerType '${dto.learnerType}'. Allowed values: ${Object.values(LearnerType).join(', ')}`,
      );
    }

    let parsedDob: Date | undefined = undefined;
    if (dto.dateOfBirth) {
      parsedDob = new Date(dto.dateOfBirth);
      if (isNaN(parsedDob.getTime())) {
        throw new BadRequestException(`Invalid dateOfBirth format '${dto.dateOfBirth}'. Must be a valid date.`);
      }
    }

    const learner = await this.prisma.learner.create({
      data: {
        name: dto.name.trim(),
        learnerType: dto.learnerType,
        preferredLanguage: dto.preferredLanguage || 'en',
        dateOfBirth: parsedDob,
        legacyChildId: dto.legacyChildId || null,
      },
    });

    this.logger.log(`Created Learner ${learner.id} (${learner.name}, type: ${learner.learnerType})`);
    return { data: learner };
  }

  async findAll(query?: {
    page?: number | string;
    pageSize?: number | string;
    search?: string;
    learnerType?: LearnerType;
  }): Promise<{
    data: Learner[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const page = Math.max(1, parseInt(String(query?.page || 1), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(query?.pageSize || 20), 10) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query?.learnerType) {
      if (!Object.values(LearnerType).includes(query.learnerType)) {
        throw new BadRequestException(`Invalid learnerType '${query.learnerType}' filter.`);
      }
      where.learnerType = query.learnerType;
    }

    if (query?.search && query.search.trim().length > 0) {
      where.name = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.learner.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.learner.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || (total === 0 ? 0 : 1);

    return {
      data: items,
      meta: { page, pageSize, total, totalPages },
    };
  }

  async findOne(id: string): Promise<{ data: Learner }> {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Learner ID is required.');
    }

    const learner = await this.prisma.learner.findUnique({
      where: { id: id.trim() },
    });

    if (!learner) {
      throw new NotFoundException(`Learner with ID '${id}' not found.`);
    }

    return { data: learner };
  }

  async update(id: string, dto: UpdateLearnerDto): Promise<{ data: Learner }> {
    await this.findOne(id); // Throws NotFoundException if not present

    const data: any = {};

    if (dto.name !== undefined) {
      if (typeof dto.name !== 'string' || dto.name.trim().length === 0) {
        throw new BadRequestException('Learner name cannot be empty.');
      }
      data.name = dto.name.trim();
    }

    if (dto.learnerType !== undefined) {
      if (!Object.values(LearnerType).includes(dto.learnerType)) {
        throw new BadRequestException(
          `Invalid learnerType '${dto.learnerType}'. Allowed values: ${Object.values(LearnerType).join(', ')}`,
        );
      }
      data.learnerType = dto.learnerType;
    }

    if (dto.preferredLanguage !== undefined) {
      data.preferredLanguage = dto.preferredLanguage;
    }

    if (dto.dateOfBirth !== undefined) {
      if (dto.dateOfBirth === null) {
        data.dateOfBirth = null;
      } else {
        const parsedDob = new Date(dto.dateOfBirth);
        if (isNaN(parsedDob.getTime())) {
          throw new BadRequestException(`Invalid dateOfBirth format '${dto.dateOfBirth}'.`);
        }
        data.dateOfBirth = parsedDob;
      }
    }

    if (dto.legacyChildId !== undefined) {
      data.legacyChildId = dto.legacyChildId || null;
    }

    const updated = await this.prisma.learner.update({
      where: { id: id.trim() },
      data,
    });

    this.logger.log(`Updated Learner ${id}`);
    return { data: updated };
  }
}
