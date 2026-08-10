import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MasteryCalculatorService, RecordEvidenceDto } from './mastery-calculator.service';
import { FrontierCalculatorService } from './frontier-calculator.service';
import { RemediationService } from './remediation.service';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';
import { CurriculumStatus } from '@prisma/client';

@Controller('api/v2')
@UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
export class MasteryController {
  constructor(
    private readonly masteryService: MasteryCalculatorService,
    private readonly frontierService: FrontierCalculatorService,
    private readonly remediationService: RemediationService,
    private readonly prisma: PrismaService,
  ) {}

  private async checkPrincipalAccess(req: any, targetLearnerId: string): Promise<void> {
    if (!req.user) throw new ForbiddenException('User context missing');

    const role = req.user.role || 'STUDENT';
    const principalSub = req.user.sub;

    if (role === 'ADMIN') return; // ADMIN has full access

    if (role === 'STUDENT') {
      if (principalSub !== targetLearnerId) {
        throw new ForbiddenException(`Student user '${principalSub}' cannot access mastery of learner '${targetLearnerId}'.`);
      }
      return;
    }

    if (role === 'PARENT') {
      // Verify actual parent-child relationship in DB — JWT claim alone is insufficient.
      // Schema chain: Parent.id (JWT sub) → Child.parentId → Learner.legacyChildId
      const learner = await this.prisma.learner.findFirst({
        where: {
          id: targetLearnerId,
          legacyChild: {
            parentId: principalSub,
          },
        },
      });
      if (!learner) {
        throw new ForbiddenException(
          `Parent user '${principalSub}' is not authorized to access learner '${targetLearnerId}': no verified parent-child link.`,
        );
      }
      return;
    }

    throw new ForbiddenException('Access denied.');
  }

  @Post('mastery/record-evidence')
  @HttpCode(HttpStatus.OK)
  async recordEvidence(@Body() dto: RecordEvidenceDto, @Request() req: any) {
    await this.checkPrincipalAccess(req, dto.learnerId);
    const result = await this.masteryService.recordEvidence(dto);
    return { data: result };
  }

  @Get('mastery/learner/:learnerId')
  async getLearnerMastery(@Param('learnerId') learnerId: string, @Request() req: any) {
    await this.checkPrincipalAccess(req, learnerId);
    const result = await this.masteryService.getLearnerMastery(learnerId);
    return { data: result };
  }

  @Post('curriculum/enroll')
  @HttpCode(HttpStatus.CREATED)
  async enrollLearner(@Body('learnerId') learnerId: string, @Body('structureVersion') structureVersion: number, @Request() req: any) {
    await this.checkPrincipalAccess(req, learnerId);

    const structure = await this.prisma.curriculumStructure.findUnique({
      where: { version: structureVersion },
    });

    if (!structure) {
      throw new NotFoundException(`Curriculum structure version ${structureVersion} not found.`);
    }

    // PUBLISHED-Only Enrollment Guard: Reject DRAFT, VALIDATING, FAILED, ARCHIVED
    if (structure.status !== CurriculumStatus.PUBLISHED) {
      throw new BadRequestException(`Cannot enroll learner in curriculum version ${structureVersion} with status '${structure.status}'. Only PUBLISHED versions allowed.`);
    }

    const enrollment = await this.prisma.learnerCurriculumEnrollment.upsert({
      where: { learnerId_structureId: { learnerId, structureId: structure.id } },
      create: {
        learnerId,
        structureId: structure.id,
        active: true,
      },
      update: {
        active: true,
        enrolledAt: new Date(),
      },
    });

    return { data: enrollment };
  }

  @Get('curriculum/frontier/:learnerId/:structureVersion')
  async getFrontier(@Param('learnerId') learnerId: string, @Param('structureVersion') structureVersion: string, @Request() req: any) {
    await this.checkPrincipalAccess(req, learnerId);
    const versionNum = parseInt(structureVersion, 10);
    const result = await this.frontierService.calculateFrontier(learnerId, versionNum);
    return { data: result };
  }

  @Post('curriculum/remediation-path')
  @HttpCode(HttpStatus.OK)
  async getRemediationPath(
    @Body('learnerId') learnerId: string,
    @Body('structureVersion') structureVersion: number,
    @Body('targetNodeId') targetNodeId: string,
    @Request() req: any,
  ) {
    await this.checkPrincipalAccess(req, learnerId);
    const result = await this.remediationService.calculateRemediationPath(learnerId, structureVersion, targetNodeId);
    return { data: result };
  }
}
