import { BadRequestException, Injectable, Logger, NotFoundException, Optional } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { GuruNotesService } from "./guru-notes.service";
import { GuruPlannerService } from "./guru-planner.service";
import { GuruModelService } from "./guru-model.service";
import { GuruUsageService } from "./guru-usage.service";
import { GuruBookMapService } from "./guru-book-map.service";
import { TeacherParentEdition, assembleTeacherParentEdition } from "./teacher-parent.schema";

@Injectable()
export class TeacherParentService {
  private readonly logger = new Logger(TeacherParentService.name);
  private readonly model: GuruModelService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notesService: GuruNotesService,
    private readonly planner: GuruPlannerService,
    baseModel: GuruModelService,
    private readonly usage: GuruUsageService,
    @Optional() private readonly bookMapService?: GuruBookMapService,
  ) {
    this.model = typeof baseModel?.forRole === "function" ? baseModel.forRole("notes") : baseModel;
  }

  /**
   * Retrieves an already prepared Teacher and Parent Edition, or synthesizes one from
   * the page's notes and lesson plan, persisting it into the notes payload so it is free forever after.
   */
  async getOrGenerateEdition(
    source: any,
    language: string,
    depth: string = "basis",
    user?: any,
  ): Promise<{ edition: TeacherParentEdition; reused: boolean }> {
    const depthVal = GuruNotesService.depthOf(depth);
    const notesId = this.notesService.notesIdFor(source, language, depthVal);

    let row = await this.prisma.guruPageNotes.findUnique({
      where: { id: notesId },
      include: { extensions: { orderBy: { createdAt: "asc" } } },
    });

    if (!row) {
      // Build notes if not prepared yet
      await this.notesService.build(source, language, undefined, depthVal);
      row = await this.prisma.guruPageNotes.findUnique({
        where: { id: notesId },
        include: { extensions: { orderBy: { createdAt: "asc" } } },
      });
      if (!row) throw new NotFoundException("Could not prepare notes for this page.");
    }

    const payload = (row.payload as any) || {};

    // 1. Check if already generated
    if (payload.teacherParentEdition) {
      return {
        edition: payload.teacherParentEdition as TeacherParentEdition,
        reused: true,
      };
    }

    // 2. Reserve quota
    await this.usage.reserve(user?.userId, "queries");

    // 3. Assemble from notes, lesson plan and whole-book knowledge map
    const notes = payload.notes;
    if (!notes) throw new BadRequestException("Page notes payload is missing.");

    let plan: any = null;
    try {
      const planCached = await this.planner.cached(source, { depth: depthVal as any, language });
      plan = planCached?.plan || null;
    } catch (err) {
      this.logger.debug(`No cached plan for teacher edition: ${err}`);
    }

    let bookMap: any = null;
    if (this.bookMapService) {
      try {
        bookMap = await this.bookMapService.getOrBuildBookMap(source.bookId);
      } catch (err) {
        this.logger.debug(`No book map available: ${err}`);
      }
    }

    const edition = assembleTeacherParentEdition(
      source.physicalPage,
      source.bookId,
      notes,
      plan,
      bookMap,
    );

    // 4. Save into payload
    payload.teacherParentEdition = edition;
    await this.prisma.guruPageNotes.update({
      where: { id: row.id },
      data: { payload: payload as any },
    });

    return {
      edition,
      reused: false,
    };
  }
}
