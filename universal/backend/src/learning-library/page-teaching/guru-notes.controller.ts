import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from "@nestjs/common";
import { IsInt, IsOptional, IsString, Length, Matches, Max, Min } from "class-validator";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { LearningLibraryAuthGuard } from "../learning-library-auth.guard";
import { GuruGenerationQueueService } from "./guru-generation-queue.service";
import { GuruNotesService } from "./guru-notes.service";
import { PageEvidenceQueueService } from "./page-evidence-queue.service";
import { PageEvidenceService } from "./page-evidence.service";

export class NotesRequestDto {
  @IsString() @Matches(/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/) language!: string;
}
export class NotesQuestionDto extends NotesRequestDto {
  @IsString() @Length(1, 40) topicId!: string;
  @IsString() @Length(1, 1000) question!: string;
  @IsOptional() @IsString() @Length(1, 120) learnerId?: string;
}
export class PrepareNotesDto extends NotesRequestDto {
  @IsOptional() @IsInt() @Min(1) @Max(10000) from?: number;
  @IsOptional() @IsInt() @Min(1) @Max(10000) to?: number;
}

/**
 * Guru Notes endpoints. A page's notes answer 200 from the store, or 202 with a job: a reading job
 * while the page text is unread, otherwise a notes job. Questions under a topic are answered and
 * saved into the notes. A whole book can be queued page by page.
 */
@Controller("api/v2")
export class GuruNotesController {
  constructor(
    private readonly evidence: PageEvidenceService,
    private readonly notes: GuruNotesService,
    private readonly queue: GuruGenerationQueueService,
    private readonly evidenceQueue: PageEvidenceQueueService,
  ) {}

  @Post("textbooks/:bookId/pages/:page/notes")
  @UseGuards(JwtAuthGuard)
  async builtin(
    @Param("bookId") bookId: string,
    @Param("page") page: string,
    @Body() body: NotesRequestDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: any,
    @Query("cachedOnly") cachedOnly?: string,
  ) {
    return this.answer(await this.evidence.builtin(bookId, page, { performOcr: false }), body.language, req.user, res, cachedOnly === "1");
  }

  @Post("learning-materials/:materialId/pages/:page/notes")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  async material(
    @Param("materialId") id: string,
    @Param("page") page: string,
    @Body() body: NotesRequestDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: any,
    @Query("cachedOnly") cachedOnly?: string,
  ) {
    return this.answer(await this.evidence.material(id, page, { performOcr: false }), body.language, req.user, res, cachedOnly === "1");
  }

  async answer(source: any, language: string, user: any, res: any, cachedOnly = false) {
    if (source.status === "PENDING") {
      if (cachedOnly) {
        res?.status?.(204);
        return undefined;
      }
      const job = await this.evidenceQueue.enqueue({ bookId: source.bookId, physicalPage: source.physicalPage, sourceHash: source.sourceHash }, user);
      res?.status?.(202);
      return { job };
    }
    const cached = await this.notes.cached(source, language);
    if (cached) return cached;
    if (cachedOnly) {
      res?.status?.(204);
      return undefined;
    }
    const job = await this.queue.enqueueNotes(source, language, user);
    if (job.status === "DONE") {
      const ready = await this.notes.cached(source, language);
      if (ready) return ready;
    }
    res?.status?.(202);
    return { job };
  }

  @Post("textbooks/:bookId/pages/:page/notes/questions")
  @UseGuards(JwtAuthGuard)
  async askBuiltin(@Param("bookId") bookId: string, @Param("page") page: string, @Body() body: NotesQuestionDto, @Request() req: any) {
    return this.notes.extend(await this.evidence.builtin(bookId, page, { performOcr: false }), body.language, body, req.user);
  }

  @Post("learning-materials/:materialId/pages/:page/notes/questions")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  async askMaterial(@Param("materialId") id: string, @Param("page") page: string, @Body() body: NotesQuestionDto, @Request() req: any) {
    return this.notes.extend(await this.evidence.material(id, page, { performOcr: false }), body.language, body, req.user);
  }

  /** Queue notes for every page of a built-in book (pages already prepared are skipped). */
  @Post("textbooks/:bookId/notes/prepare")
  @UseGuards(JwtAuthGuard)
  async prepareBuiltin(@Param("bookId") bookId: string, @Body() body: PrepareNotesDto, @Request() req: any) {
    return this.prepare((page) => this.evidence.builtin(bookId, String(page), { performOcr: false }), body, req.user);
  }

  @Post("learning-materials/:materialId/notes/prepare")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  async prepareMaterial(@Param("materialId") id: string, @Body() body: PrepareNotesDto, @Request() req: any) {
    return this.prepare((page) => this.evidence.material(id, String(page), { performOcr: false }), body, req.user);
  }

  /** One budget reservation covers the whole book; the individual jobs are queued in page order. */
  async prepare(peek: (page: number) => Promise<any>, body: PrepareNotesDto, user: any) {
    const first = await peek(body.from || 1);
    const last = Math.min(body.to || first.totalPages, first.totalPages);
    const pages: number[] = [];
    for (let p = body.from || 1; p <= last; p++) pages.push(p);
    let reserved = false;
    const result = { pagesTotal: first.totalPages, from: pages[0], to: last, ready: 0, queued: 0, reading: 0, failed: [] as { page: number; reason: string }[] };
    for (const p of pages) {
      try {
        const source = p === (body.from || 1) ? first : await peek(p);
        if (source.status === "PENDING") {
          await this.evidenceQueue.enqueue({ bookId: source.bookId, physicalPage: source.physicalPage, sourceHash: source.sourceHash }, user);
          result.reading++;
        }
        if (!reserved) {
          reserved = true;
          const job = await this.queue.enqueueNotes(source, body.language, user);
          job.status === "DONE" ? result.ready++ : result.queued++;
        } else {
          const job = await this.queue.enqueueNotes(source, body.language, user, { reserved: true });
          job.status === "DONE" ? result.ready++ : result.queued++;
        }
      } catch (error: any) {
        result.failed.push({ page: p, reason: String(error?.message || error).slice(0, 200) });
      }
    }
    return result;
  }

  @Get("textbooks/:bookId/notes/status")
  @UseGuards(JwtAuthGuard)
  async statusBuiltin(@Param("bookId") bookId: string, @Query("language") language?: string) {
    return this.status(bookId, language);
  }

  @Get("learning-materials/:materialId/notes/status")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  async statusMaterial(@Param("materialId") id: string, @Query("language") language?: string) {
    return this.status(id, language);
  }

  async status(bookId: string, language?: string) {
    const lang = typeof language === "string" && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(language) ? language : "en";
    const ready = await this.notes.readyPages(bookId, lang);
    const jobs = await this.queue.notesJobs(bookId, lang);
    return { bookId, language: lang, ready, readyCount: ready.length, jobs };
  }
}
