import {
  Body,
  Controller,
  Get,
  Param,
  Optional,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from "@nestjs/common";
import { IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from "class-validator";
import { DEPTHS } from "./guru-plan.schema";
import { blueprintForAudience } from "./guru-notes.schema";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { LearningLibraryAuthGuard } from "../learning-library-auth.guard";
import { GuruGenerationQueueService } from "./guru-generation-queue.service";
import { GuruNotesService } from "./guru-notes.service";
import { PageEvidenceQueueService } from "./page-evidence-queue.service";
import { PageEvidenceService } from "./page-evidence.service";
import { TeacherParentService } from "./teacher-parent.service";

export class NotesRequestDto {
  @IsString() @Matches(/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/) language!: string;
  @IsOptional() @IsIn(DEPTHS as unknown as string[]) depth?: string;
  @IsOptional() @IsString() audience?: string;
}
export class NotesQuestionDto extends NotesRequestDto {
  @IsString() @Length(1, 40) topicId!: string;
  @IsString() @Length(1, 1000) question!: string;
  @IsOptional() @IsString() @Length(1, 120) learnerId?: string;
}
export class NotesLadderDto extends NotesRequestDto {
  @IsString() @Length(1, 40) topicId!: string;
  @IsString() @IsIn(["younger", "analogy", "expert"]) level!: "younger" | "analogy" | "expert";
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
    @Optional() private readonly teacherParent?: TeacherParentService,
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
    return this.answer(await this.evidence.builtin(bookId, page, { performOcr: false }), body.language, req.user, res, cachedOnly === "1", body.depth, body.audience);
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
    return this.answer(await this.evidence.material(id, page, { performOcr: false }), body.language, req.user, res, cachedOnly === "1", body.depth, body.audience);
  }

  async answer(source: any, language: string, user: any, res: any, cachedOnly = false, depth?: string, audience?: string) {
    if (source.status === "PENDING") {
      if (cachedOnly) {
        res?.status?.(204);
        return undefined;
      }
      const job = await this.evidenceQueue.enqueue({ bookId: source.bookId, physicalPage: source.physicalPage, sourceHash: source.sourceHash }, user);
      res?.status?.(202);
      return { job };
    }
    const wanted = GuruNotesService.depthOf(depth);
    const targetAudience = audience || source?.targetAudience || source?.audience;
    const cached = targetAudience
      ? await this.notes.cached(source, language, wanted, targetAudience)
      : await this.notes.cached(source, language, wanted);
    if (cached) return cached;
    if (cachedOnly) {
      res?.status?.(204);
      return undefined;
    }
    const jobOptions: { depth?: string; audience?: string } = { depth: wanted };
    if (targetAudience) jobOptions.audience = targetAudience;
    const job = await this.queue.enqueueNotes(source, language, user, jobOptions);
    if (job.status === "DONE") {
      const ready = targetAudience
        ? await this.notes.cached(source, language, wanted, targetAudience)
        : await this.notes.cached(source, language, wanted);
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

  @Post("textbooks/:bookId/pages/:page/notes/ladder")
  @UseGuards(JwtAuthGuard)
  async ladderBuiltin(@Param("bookId") bookId: string, @Param("page") page: string, @Body() body: NotesLadderDto, @Request() req: any) {
    return this.notes.getOrGenerateLadder(await this.evidence.builtin(bookId, page, { performOcr: false }), body.language, body, req.user);
  }

  @Post("learning-materials/:materialId/pages/:page/notes/ladder")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  async ladderMaterial(@Param("materialId") id: string, @Param("page") page: string, @Body() body: NotesLadderDto, @Request() req: any) {
    return this.notes.getOrGenerateLadder(await this.evidence.material(id, page, { performOcr: false }), body.language, body, req.user);
  }

  @Get("textbooks/:bookId/pages/:page/teacher-edition")
  @UseGuards(JwtAuthGuard)
  async getTeacherEditionBuiltin(
    @Param("bookId") bookId: string,
    @Param("page") page: string,
    @Query("language") language = "en",
    @Query("depth") depth = "basis",
    @Request() req: any,
  ) {
    return this.teacherParent?.getOrGenerateEdition(await this.evidence.builtin(bookId, page, { performOcr: false }), language, depth, req.user);
  }

  @Post("textbooks/:bookId/pages/:page/teacher-edition")
  @UseGuards(JwtAuthGuard)
  async teacherEditionBuiltin(@Param("bookId") bookId: string, @Param("page") page: string, @Body() body: NotesRequestDto, @Request() req: any) {
    return this.teacherParent?.getOrGenerateEdition(await this.evidence.builtin(bookId, page, { performOcr: false }), body.language, body.depth, req.user);
  }

  @Get("learning-materials/:materialId/pages/:page/teacher-edition")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  async getTeacherEditionMaterial(
    @Param("materialId") id: string,
    @Param("page") page: string,
    @Query("language") language = "en",
    @Query("depth") depth = "basis",
    @Request() req: any,
  ) {
    return this.teacherParent?.getOrGenerateEdition(await this.evidence.material(id, page, { performOcr: false }), language, depth, req.user);
  }

  @Post("learning-materials/:materialId/pages/:page/teacher-edition")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  async teacherEditionMaterial(@Param("materialId") id: string, @Param("page") page: string, @Body() body: NotesRequestDto, @Request() req: any) {
    return this.teacherParent?.getOrGenerateEdition(await this.evidence.material(id, page, { performOcr: false }), body.language, body.depth, req.user);
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
        // The whole book runs behind pages learners open; the first page carries the single budget reservation.
        const targetAudience = body.audience || source?.targetAudience || source?.audience;
        const job = await this.queue.enqueueNotes(source, body.language, user, { reserved, priority: 0, depth: body.depth, audience: targetAudience });
        reserved = true;
        job.status === "DONE" ? result.ready++ : result.queued++;
      } catch (error: any) {
        result.failed.push({ page: p, reason: String(error?.message || error).slice(0, 200) });
      }
    }
    return result;
  }

  @Get("textbooks/:bookId/notes/status")
  @UseGuards(JwtAuthGuard)
  async statusBuiltin(
    @Param("bookId") bookId: string,
    @Query("language") language?: string,
    @Query("depth") depth?: string,
    @Query("audience") audience?: string,
  ) {
    return this.status(bookId, language, depth, audience);
  }

  @Get("learning-materials/:materialId/notes/status")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  async statusMaterial(
    @Param("materialId") id: string,
    @Query("language") language?: string,
    @Query("depth") depth?: string,
    @Query("audience") audience?: string,
  ) {
    return this.status(id, language, depth, audience);
  }

  async status(bookId: string, language?: string, depth?: string, audience?: string) {
    const lang = typeof language === "string" && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(language) ? language : "en";
    const wanted = GuruNotesService.depthOf(depth);
    const blueprint = blueprintForAudience(audience);
    const ready = await this.notes.readyPages(bookId, lang, wanted, blueprint);
    const jobs = await this.queue.notesJobs(bookId, lang, wanted);
    return { bookId, language: lang, depth: wanted, blueprint, ready, readyCount: ready.length, jobs };
  }
}
