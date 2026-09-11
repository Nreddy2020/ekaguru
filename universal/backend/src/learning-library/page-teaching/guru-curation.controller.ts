import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Request,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { GuruConceptMappingService } from "./guru-concept-mapping.service";
import { GuruEvaluationService } from "./evaluation/guru-evaluation.service";
import { DEPTHS } from "./guru-plan.schema";

export class EvaluationCaseDto {
  @IsString() @Matches(/^[A-Za-z0-9_-]{1,120}$/) bookId: string;
  @IsInt() @Min(1) @Max(10000) physicalPage: number;
  @IsString() @MaxLength(120) subject: string;
  @IsIn(["EARLY_CHILDHOOD", "PRIMARY", "MIDDLE_SCHOOL", "HIGH_SCHOOL", "ADVANCED"])
  gradeBand: string;
  @IsOptional() @IsString() @Matches(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/) language?: string;
  @IsIn(DEPTHS) depth: string;
}
export class ImportCasesDto {
  @IsArray() cases: EvaluationCaseDto[];
}
export class ReviewDto {
  @IsObject() scores: Record<string, number>;
  @IsOptional() @IsIn(["PASS", "REVISE", "FAIL"]) verdict?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}
export class MappingReviewDto {
  @IsIn(["VERIFIED", "REJECTED", "PROPOSED"]) status: "VERIFIED" | "REJECTED" | "PROPOSED";
  @IsOptional() @IsString() @MaxLength(2000) rationale?: string;
}
export class ManualMappingDto {
  @IsString() @MaxLength(120) conceptId: string;
  @IsOptional() @IsString() @MaxLength(2000) rationale?: string;
}

/** Curator-only surface: evaluation corpus and concept-mapping decisions. */
@Controller("api/v2/guru")
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata("roles", ["ADMIN"])
export class GuruCurationController {
  constructor(
    private readonly evaluation: GuruEvaluationService,
    private readonly mapping: GuruConceptMappingService,
  ) {}

  @Get("evaluation/rubric") rubric() {
    return this.evaluation.rubric();
  }
  @Get("evaluation/summary") summary() {
    return this.evaluation.summary();
  }
  @Get("evaluation/cases") cases(
    @Query("subject") subject?: string,
    @Query("depth") depth?: string,
  ) {
    return this.evaluation.listCases({ subject, depth });
  }
  @Post("evaluation/cases") create(
    @Body() body: EvaluationCaseDto,
    @Request() req: any,
  ) {
    return this.evaluation.createCase(body, req.user.userId);
  }
  @Post("evaluation/cases/import") import(
    @Body() body: ImportCasesDto,
    @Request() req: any,
  ) {
    return this.evaluation.importCases(body.cases, req.user.userId);
  }
  @Get("evaluation/cases/:id/packet") packet(
    @Param("id") id: string,
    @Query("image") image?: string,
  ) {
    return this.evaluation.packet(id, image === "1");
  }
  @Get("evaluation/cases/:id/packet.md")
  @Header("Content-Type", "text/markdown; charset=utf-8")
  packetMarkdown(@Param("id") id: string) {
    return this.evaluation.packetMarkdown(id);
  }
  @Post("evaluation/cases/:id/prepare") prepare(
    @Param("id") id: string,
    @Request() req: any,
  ) {
    return this.evaluation.prepare(id, req.user.userId);
  }
  @Post("evaluation/cases/:id/reviews") review(
    @Param("id") id: string,
    @Body() body: ReviewDto,
    @Request() req: any,
  ) {
    return this.evaluation.review(id, req.user.userId, body);
  }

  @Get("concepts") searchConcepts(@Query("search") search?: string) {
    return this.mapping.searchConcepts(search);
  }
  @Get("lessons/:artifactId/concept-mappings") mappings(
    @Param("artifactId") artifactId: string,
  ) {
    return this.mapping.list(artifactId);
  }
  @Post("lessons/:artifactId/concept-mappings/propose") propose(
    @Param("artifactId") artifactId: string,
  ) {
    return this.mapping.proposeFor(artifactId);
  }
  @Post("lessons/:artifactId/concept-mappings") manual(
    @Param("artifactId") artifactId: string,
    @Body() body: ManualMappingDto,
    @Request() req: any,
  ) {
    return this.mapping.addManual(
      artifactId,
      body.conceptId,
      req.user,
      body.rationale || "",
    );
  }
  @Post("concept-mappings/:id/review") reviewMapping(
    @Param("id") id: string,
    @Body() body: MappingReviewDto,
    @Request() req: any,
  ) {
    return this.mapping.review(id, body.status, req.user, body.rationale);
  }
}
