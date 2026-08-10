import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExtractionOrchestratorService } from './extraction-orchestrator.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';

@Controller('api/v2/learning-materials')
@UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
export class ExtractionController {
  constructor(private readonly orchestratorService: ExtractionOrchestratorService) {}

  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  async processMaterial(@Param('id') id: string, @Request() req: any) {
    return this.orchestratorService.processMaterial(id, req.user);
  }

  @Get(':id/chunks')
  async getChunks(
    @Param('id') id: string,
    @Request() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const ps = pageSize ? parseInt(pageSize, 10) : 20;
    return this.orchestratorService.getChunks(id, req.user, p, ps);
  }
}
