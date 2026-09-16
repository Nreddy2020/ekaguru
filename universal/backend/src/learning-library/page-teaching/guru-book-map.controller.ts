import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GuruBookMapService } from './guru-book-map.service';

@Controller('api/v2/guru/books')
export class GuruBookMapController {
  constructor(private readonly bookMapService: GuruBookMapService) {}

  /**
   * Returns the whole-book knowledge map with chapters, topics, key terms, and concept dependencies.
   */
  @Get(':bookId/map')
  async getBookMap(
    @Param('bookId') bookId: string,
    @Query('refresh') refresh?: string
  ) {
    return this.bookMapService.getOrBuildBookMap(bookId, refresh === '1' || refresh === 'true');
  }

  /**
   * Returns dependency information for a specific topic (prerequisites, downstream impacts, revisit recommendation).
   */
  @Get(':bookId/topics/:topicId/dependencies')
  async getTopicDependencies(
    @Param('bookId') bookId: string,
    @Param('topicId') topicId: string
  ) {
    return this.bookMapService.getTopicDependencies(bookId, topicId);
  }

  /**
   * Provides diagnostic revisit guidance when a student struggles on a specific page.
   */
  @Get(':bookId/pages/:page/revisit')
  async getRevisitGuidance(
    @Param('bookId') bookId: string,
    @Param('page') page: string,
    @Query('topicId') topicId?: string
  ) {
    const pageNum = Number.parseInt(page, 10) || 1;
    return this.bookMapService.getRevisitGuidance(bookId, pageNum, topicId);
  }

  /**
   * Forces regeneration of the book knowledge map.
   */
  @Post(':bookId/map/refresh')
  @UseGuards(JwtAuthGuard)
  async refreshBookMap(@Param('bookId') bookId: string) {
    return this.bookMapService.getOrBuildBookMap(bookId, true);
  }
}
