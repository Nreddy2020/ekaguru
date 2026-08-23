import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, HttpCode } from '@nestjs/common';
import { LearningMaterialService } from './learning-material.service';
import { CreateLearningMaterialDto } from './dto/create-learning-material.dto';
import { UpdateLearningMaterialDto } from './dto/update-learning-material.dto';
import { QueryLearningMaterialDto } from './dto/query-learning-material.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LearningLibraryAuthGuard } from './learning-library-auth.guard';

@Controller('api/v2/learning-materials')
@UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
export class LearningMaterialController {
  constructor(private readonly materialService: LearningMaterialService) {}

  @Post()
  async create(@Body() body: CreateLearningMaterialDto) {
    return this.materialService.create(body);
  }

  @Get()
  async findAll(@Request() req: any, @Query() query: QueryLearningMaterialDto) {
    return this.materialService.findAll(query, req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materialService.findOne(id);
  }

  @Get(':id/status')
  async getProcessingStatus(@Param('id') id: string) {
    return this.materialService.getProcessingStatus(id);
  }

  @Post(':id/retry')
  @HttpCode(200)
  async retry(@Param('id') id: string, @Request() req: any) {
    return this.materialService.retry(id, req.user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateLearningMaterialDto) {
    return this.materialService.update(id, body);
  }

  @Delete(':id')
  async softDelete(@Param('id') id: string, @Query('action') action?: 'delete' | 'archive') {
    return this.materialService.softDelete(id, action);
  }
}
