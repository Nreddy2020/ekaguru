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
} from '@nestjs/common';
import { CurriculumBackboneService } from './curriculum-backbone.service';
import { BoardMappingService, CreateBoardMappingDto } from './board-mapping.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { LearningLibraryAuthGuard } from '../../learning-library-auth.guard';

@Controller('api/v2/curriculum')
@UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
export class CurriculumController {
  constructor(
    private readonly backboneService: CurriculumBackboneService,
    private readonly boardService: BoardMappingService,
  ) {}

  private checkAdmin(req: any) {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied: Only ADMIN users can perform curriculum construction and board mapping operations.');
    }
  }

  @Post('generate-backbone')
  @HttpCode(HttpStatus.OK)
  async generateBackbone(@Body('domain') domain: string, @Request() req: any) {
    this.checkAdmin(req);
    const result = await this.backboneService.generateUniversalBackbone(domain || 'General', req.user.sub || 'ADMIN');
    return { data: result };
  }

  @Get('backbone/:version')
  async getBackbone(@Param('version') version: string) {
    const versionNum = parseInt(version, 10);
    const result = await this.backboneService.getBackboneByVersion(versionNum);
    return { data: result };
  }

  @Post('board-mappings')
  @HttpCode(HttpStatus.CREATED)
  async createBoardMapping(@Body() dto: CreateBoardMappingDto, @Request() req: any) {
    this.checkAdmin(req);
    const result = await this.boardService.createBoardMapping(dto);
    return { data: result };
  }

  @Get('board-mappings/:boardCode/:grade')
  async getBoardMapping(@Param('boardCode') boardCode: string, @Param('grade') grade: string) {
    const result = await this.boardService.getBoardMapping(boardCode, grade);
    return { data: result };
  }
}
