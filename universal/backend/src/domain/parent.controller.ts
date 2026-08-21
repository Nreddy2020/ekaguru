import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LearningLibraryAuthGuard } from '../learning-library/learning-library-auth.guard';
import { ParentService, OnboardLearnerDto, UpdateLearnerDto } from './parent.service';

@Controller('api/v2/parent')
@UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.parentService.getProfile(req.user.userId);
  }

  @Get('learners')
  async getLearners(@Request() req: any) {
    return this.parentService.getLearners(req.user.userId);
  }

  @Post('learners')
  @HttpCode(HttpStatus.CREATED)
  async onboardLearner(@Request() req: any, @Body() dto: OnboardLearnerDto) {
    return this.parentService.onboardLearner(req.user.userId, dto);
  }

  @Patch('learners/:learnerId')
  async updateLearner(
    @Param('learnerId') learnerId: string,
    @Body() dto: UpdateLearnerDto,
  ) {
    return this.parentService.updateLearner(learnerId, dto);
  }

  @Post('learners/:learnerId/enroll')
  @HttpCode(HttpStatus.OK)
  async enrollLearner(
    @Param('learnerId') learnerId: string,
    @Body('structureVersion') structureVersion: number,
  ) {
    return this.parentService.enrollLearner(learnerId, structureVersion);
  }

  @Get('learners/:learnerId/analytics')
  async getAnalytics(@Param('learnerId') learnerId: string) {
    return this.parentService.getAnalytics(learnerId);
  }

  @Get('notifications')
  async getNotifications(
    @Request() req: any,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const takeVal = take ? parseInt(take, 10) : 20;
    const skipVal = skip ? parseInt(skip, 10) : 0;
    return this.parentService.getNotifications(req.user.userId, takeVal, skipVal);
  }
}
