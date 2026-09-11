import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { LearningLibraryAuthGuard } from "../learning-library-auth.guard";
import { PageEvidenceService } from "./page-evidence.service";

@Controller("api/v2")
export class PageEvidenceController {
  constructor(private readonly evidence: PageEvidenceService) {}

  @Get("textbooks/:bookId/pages/:page/evidence")
  async builtin(@Param("bookId") bookId: string, @Param("page") page: string) {
    const evidence = await this.evidence.builtin(bookId, page);
    return this.evidence.publicView(
      evidence,
      this.evidence.builtinImageUrl(bookId, evidence.physicalPage, evidence.sourceHash),
    );
  }

  @Get("learning-materials/:materialId/pages/:page/evidence")
  @UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
  async material(@Param("materialId") id: string, @Param("page") page: string) {
    const evidence = await this.evidence.material(id, page);
    return this.evidence.publicView(
      evidence,
      this.evidence.signedMaterialImageUrl(id, evidence.physicalPage),
    );
  }

  /** Public scans: immutable per source revision, so browsers keep them for a year. */
  @Get("textbooks/:bookId/pages/:page/image")
  async builtinImage(
    @Param("bookId") bookId: string,
    @Param("page") page: string,
    @Headers("if-none-match") ifNoneMatch: string | undefined,
    @Res() res: any,
  ) {
    const evidence = await this.evidence.builtin(bookId, page);
    this.sendImage(res, evidence, "public, max-age=31536000, immutable", ifNoneMatch);
  }

  /** Private scans: the signed, expiring URL issued with the evidence response is the credential. */
  @Get("learning-materials/:materialId/pages/:page/image")
  async materialImage(
    @Param("materialId") id: string,
    @Param("page") page: string,
    @Query("exp") exp: string | undefined,
    @Query("sig") sig: string | undefined,
    @Headers("if-none-match") ifNoneMatch: string | undefined,
    @Res() res: any,
  ) {
    const pageNumber = Number(page);
    if (!this.evidence.verifyImageSignature(id, pageNumber, exp, sig))
      throw new ForbiddenException("This page image link is invalid or has expired.");
    const evidence = await this.evidence.material(id, page);
    this.sendImage(res, evidence, "private, max-age=3600", ifNoneMatch);
  }

  private sendImage(res: any, evidence: any, cacheControl: string, ifNoneMatch?: string) {
    const etag = '"' + evidence.sourceHash + '"';
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", cacheControl);
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (ifNoneMatch === etag) {
      res.status(304).end();
      return;
    }
    res.setHeader("Content-Type", "image/png");
    res.status(200).send(evidence.imageBytes);
  }
}
