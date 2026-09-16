import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GuruLearningPackageService } from './guru-learning-package.service';
import { Depth } from './guru-plan.schema';
import { BookAudience } from './guru-notes.schema';

@Controller(['api/v2/guru/books', 'api/v2/learning-materials'])
export class GuruLearningPackageController {
  constructor(private readonly packageService: GuruLearningPackageService) {}

  /**
   * Retrieves the comprehensive master learning package for a book.
   * Assembles whole-book roadmap, concept graph, chapter notes, real-world scenarios,
   * mistake traps, memory mnemonics, hands-on labs, question bank, balanced mock test
   * with marking guide and rubrics, and one-page cheat sheets.
   */
  @Get(':bookId/learning-package')
  async getLearningPackage(
    @Param('bookId') bookId: string,
    @Query('language') language?: string,
    @Query('depth') depth?: string,
    @Query('audience') audience?: string,
    @Query('refresh') refresh?: string,
  ) {
    return this.packageService.buildPackage(bookId, {
      language: language || 'en',
      depth: (depth as Depth) || 'basis',
      audience: (audience as BookAudience) || 'child',
      forceRefreshMap: refresh === '1' || refresh === 'true',
    });
  }

  /**
   * Forces regeneration and refresh of the learning package and underlying concept graph.
   */
  @Post(':bookId/learning-package/refresh')
  @UseGuards(JwtAuthGuard)
  async refreshLearningPackage(
    @Param('bookId') bookId: string,
    @Query('language') language?: string,
    @Query('depth') depth?: string,
    @Query('audience') audience?: string,
  ) {
    return this.packageService.buildPackage(bookId, {
      language: language || 'en',
      depth: (depth as Depth) || 'basis',
      audience: (audience as BookAudience) || 'child',
      forceRefreshMap: true,
    });
  }
}
