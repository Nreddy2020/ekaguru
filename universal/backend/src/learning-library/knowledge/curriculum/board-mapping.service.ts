import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BoardType } from '@prisma/client';

export interface CreateBoardMappingDto {
  structureVersion: number;
  boardType: BoardType;
  boardCode: string;
  jurisdiction?: string;
  academicYear?: string;
  boardGrade: string;
  nodeOrders: Array<{ curriculumNodeId: string; boardSequenceIndex: number }>;
}

@Injectable()
export class BoardMappingService {
  private readonly logger = new Logger(BoardMappingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createBoardMapping(dto: CreateBoardMappingDto): Promise<any> {
    const structure = await this.prisma.curriculumStructure.findUnique({
      where: { version: dto.structureVersion },
      include: {
        nodes: true,
        prerequisites: true,
      },
    });

    if (!structure) {
      throw new NotFoundException(`Curriculum structure version ${dto.structureVersion} not found.`);
    }

    const mapping = await this.prisma.boardCurriculumMapping.create({
      data: {
        structureId: structure.id,
        boardType: dto.boardType,
        boardCode: dto.boardCode,
        jurisdiction: dto.jurisdiction || 'INDIA',
        academicYear: dto.academicYear || '2026-2027',
        boardGrade: dto.boardGrade,
      },
    });

    // Detect Sequence Conflicts with Universal Prerequisites
    const prereqMap = new Map<string, Set<string>>(); // targetNodeId -> set of sourceNodeIds (prerequisites)
    structure.prerequisites.forEach((p) => {
      if (!prereqMap.has(p.targetNodeId)) prereqMap.set(p.targetNodeId, new Set());
      prereqMap.get(p.targetNodeId)!.add(p.sourceNodeId);
    });

    const boardSeqMap = new Map<string, number>();
    dto.nodeOrders.forEach((no) => boardSeqMap.set(no.curriculumNodeId, no.boardSequenceIndex));

    for (const order of dto.nodeOrders) {
      let hasSequenceConflict = false;
      let conflictNotes: string | null = null;

      // Check if any prerequisite node is placed AFTER this node in the board's sequence
      const prereqNodeIds = prereqMap.get(order.curriculumNodeId);
      if (prereqNodeIds) {
        for (const prereqNodeId of prereqNodeIds) {
          const prereqBoardSeq = boardSeqMap.get(prereqNodeId);
          if (prereqBoardSeq !== undefined && prereqBoardSeq > order.boardSequenceIndex) {
            hasSequenceConflict = true;
            conflictNotes = `Board sequence conflict: Prerequisite node '${prereqNodeId}' is placed at board sequence index ${prereqBoardSeq}, which is after target node index ${order.boardSequenceIndex}.`;
            break;
          }
        }
      }

      await this.prisma.boardNodeMapping.create({
        data: {
          boardMappingId: mapping.id,
          curriculumNodeId: order.curriculumNodeId,
          boardSequenceIndex: order.boardSequenceIndex,
          hasSequenceConflict,
          conflictNotes,
        },
      });
    }

    this.logger.log(`Created Board Mapping for ${dto.boardCode} Grade ${dto.boardGrade} over structure v${dto.structureVersion}`);
    return this.getBoardMapping(dto.boardCode, dto.boardGrade);
  }

  async getBoardMapping(boardCode: string, boardGrade: string): Promise<any> {
    const mapping = await this.prisma.boardCurriculumMapping.findFirst({
      where: { boardCode, boardGrade },
      orderBy: { createdAt: 'desc' },
      include: {
        structure: { select: { version: true, name: true, status: true } },
        nodeMappings: {
          orderBy: { boardSequenceIndex: 'asc' },
          include: {
            curriculumNode: {
              include: {
                concept: { select: { canonicalName: true, domain: true, gradeBand: true } },
              },
            },
          },
        },
      },
    });

    if (!mapping) {
      throw new NotFoundException(`Board mapping for code '${boardCode}' and grade '${boardGrade}' not found.`);
    }

    return mapping;
  }
}
