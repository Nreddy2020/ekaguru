import { Controller, Get, Post, Param, Body, Logger } from '@nestjs/common';
import { RealPageRasterizerService } from './extraction/real-page-rasterizer.service';
import { OcrDocumentVisionService } from './extraction/ocr-document-vision.service';
import { SourceQualityEvaluatorService } from './quality/source-quality-evaluator.service';
import { CanonicalManifestBuilderService } from './structure/canonical-manifest-builder.service';
import { CanonicalEvidencePackService } from './knowledge/canonical-evidence-pack.service';
import { ContentFactoryService } from './ai-factory/content-factory.service';
import { GroundingAuditService } from './ai-factory/grounding-audit.service';

@Controller('api/learning-library')
export class UniversalLearningLibraryController {
  private readonly logger = new Logger(UniversalLearningLibraryController.name);

  constructor(
    private readonly rasterizer: RealPageRasterizerService,
    private readonly ocrService: OcrDocumentVisionService,
    private readonly qualityEvaluator: SourceQualityEvaluatorService,
    private readonly manifestBuilder: CanonicalManifestBuilderService,
    private readonly evidencePackService: CanonicalEvidencePackService,
    private readonly contentFactory: ContentFactoryService,
    private readonly groundingAudit: GroundingAuditService
  ) {}

  @Get('books/:bookId/manifest')
  public getBookManifest(@Param('bookId') bookId: string) {
    return this.manifestBuilder.buildManifest(bookId);
  }

  @Get('books/:bookId/chapters/:chapterNumber/evidence-pack')
  public async getChapterEvidencePack(
    @Param('bookId') bookId: string,
    @Param('chapterNumber') chapterNumber: string
  ) {
    const chNum = parseInt(chapterNumber, 10) || 1;
    const manifest = this.manifestBuilder.buildManifest(bookId);
    const chapter = manifest.chapters.find((c) => c.chapterNumber === chNum) || manifest.chapters[0];

    const visionResult = await this.ocrService.processPageVision(
      chapter.startPhysicalPage,
      `E:/Ekaguru/universal/frontend/public/textbooks/${bookId}/page-${chapter.startPhysicalPage}.png`
    );

    return this.evidencePackService.buildChapterEvidencePack(
      bookId,
      chNum,
      chapter.title,
      chapter.startPhysicalPage,
      chapter.endPhysicalPage,
      `Fundamental knowledge extracted for Chapter ${chNum}: ${chapter.title}`,
      ['Core Knowledge', 'Mechanics', 'Applications', 'Maturity'],
      visionResult.blocks
    );
  }

  @Get('books/:bookId/chapters/:chapterNumber/teaching-package')
  public async getTeachingPackage(
    @Param('bookId') bookId: string,
    @Param('chapterNumber') chapterNumber: string
  ) {
    const evidencePack = await this.getChapterEvidencePack(bookId, chapterNumber);
    const teachingPackage = this.contentFactory.generateTeachingPackage(evidencePack);
    const auditReport = this.groundingAudit.auditPackage(teachingPackage, evidencePack);

    if (auditReport.hardPublishBlock) {
      throw new Error('Hard publish block active: Unsupported claims detected in teaching package');
    }

    return {
      package: teachingPackage,
      audit: auditReport,
    };
  }

  @Post('audit-package')
  public auditTeachingPackage(@Body() pkg: any) {
    return this.groundingAudit.auditPackage(pkg);
  }
}
