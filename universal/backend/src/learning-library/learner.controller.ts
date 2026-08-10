import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { LearnerService } from './learner.service';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { UpdateLearnerDto } from './dto/update-learner.dto';
import { LearnerType } from '@prisma/client';

@Controller('api/v2/learners')
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  @Post()
  async create(@Body() body: CreateLearnerDto) {
    return this.learnerService.create(body);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('learnerType') learnerType?: LearnerType,
  ) {
    return this.learnerService.findAll({ page, pageSize, search, learnerType });
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
