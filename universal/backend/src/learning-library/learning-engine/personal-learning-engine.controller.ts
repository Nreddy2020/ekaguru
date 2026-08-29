import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PersonalLearningEngineService, CurriculumPositionDto, SubmitEvidenceDto } from './personal-learning-engine.service';

@Controller('api/v2/learning-engine')
export class PersonalLearningEngineController {
  constructor(private readonly engineService: PersonalLearningEngineService) {}

  @Post('curriculum/open-page')
  @HttpCode(HttpStatus.OK)
  async openPage(@Body() body: { bookId: string; printedPage: number; learnerId: string }) {
    const result = await this.engineService.openPage(body.bookId, body.printedPage, body.learnerId);
    return { data: result };
  }

  @Post('evidence/submit')
  @HttpCode(HttpStatus.CREATED)
  async submitEvidence(@Body() dto: SubmitEvidenceDto) {
    const result = await this.engineService.submitEvidence(dto);
    return { data: result };
  }

  @Post('exploration/start')
  @HttpCode(HttpStatus.OK)
  async startExploration(
    @Body() body: { learnerId: string; originPosition: CurriculumPositionDto; targetConceptId: string },
  ) {
    const result = await this.engineService.startExploration(body.learnerId, body.originPosition, body.targetConceptId);
    return { data: result };
  }

  @Post('exploration/return')
  @HttpCode(HttpStatus.OK)
  async returnToCurriculum(
    @Body() body: { sessionId: string; learnerId: string; originPosition: CurriculumPositionDto },
  ) {
    const result = await this.engineService.returnToCurriculum(body.sessionId, body.learnerId, body.originPosition);
    return { data: result };
  }
}
