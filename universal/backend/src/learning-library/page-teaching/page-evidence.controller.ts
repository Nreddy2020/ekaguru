import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { LearningLibraryAuthGuard } from "../learning-library-auth.guard";
import { PageEvidenceService } from "./page-evidence.service";
@Controller("api/v2")
export class PageEvidenceController {
  constructor(private readonly evidence: PageEvidenceService) {}
  @Get("textbooks/:bookId/pages/:page/evidence")
  builtin(@Param("bookId") bookId: string, @Param("page") page: string) {
    return this.evidence.builtin(bookId, page);
  }
  @Get("learning-materials/:materialId/pages/:page/evidence")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  material(@Param("materialId") id: string, @Param("page") page: string) {
    return this.evidence.material(id, page);
  }
}
