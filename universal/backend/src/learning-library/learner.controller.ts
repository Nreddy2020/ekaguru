import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { LearnerService } from './learner.service';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { UpdateLearnerDto } from './dto/update-learner.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LearningLibraryAuthGuard } from './learning-library-auth.guard';

@Controller('api/v2/learners')
@UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  @Post()
  async create(@Body() body: CreateLearnerDto) {
    return this.learnerService.create(body);
  }

  @Get()
  async findAll(@Request() req: any, @Query() query: any) {
    return this.learnerService.findAll(query, req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.learnerService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateLearnerDto) {
    return this.learnerService.update(id, body);
  }
}
