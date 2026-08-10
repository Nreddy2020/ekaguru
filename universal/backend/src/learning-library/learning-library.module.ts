import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { LearnerService } from './learner.service';
import { LearnerController } from './learner.controller';
import { LearningMaterialService } from './learning-material.service';
import { LearningMaterialController } from './learning-material.controller';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { LearningLibraryAuthGuard } from './learning-library-auth.guard';
import { LocalStorageService } from './storage/local-storage.service';
import { StorageService } from './storage/storage.service';
import { FileValidatorService } from './upload/file-validator.service';
import { UploadService } from './upload/upload.service';
import { UploadController } from './upload/upload.controller';

import { PdfExtractorService } from './extraction/extractors/pdf-extractor.service';
import { DocxExtractorService } from './extraction/extractors/docx-extractor.service';
import { EpubExtractorService } from './extraction/extractors/epub-extractor.service';
import { TextExtractorService } from './extraction/extractors/text-extractor.service';
import { ImageExtractorService } from './extraction/extractors/image-extractor.service';
import { ExtractorFactoryService } from './extraction/extractor-factory.service';
import { StructureDetectorService } from './extraction/structure-detector.service';
import { ExtractionOrchestratorService } from './extraction/extraction-orchestrator.service';
import { ExtractionController } from './extraction/extraction.controller';

import { CandidateExtractorService } from './knowledge/candidate-extractor.service';
import { IdentityResolutionService } from './knowledge/identity-resolution.service';
import { ConceptGraphService } from './knowledge/concept-graph.service';
import { KnowledgeController } from './knowledge/knowledge.controller';

@Module({
  controllers: [
    LearnerController,
    LearningMaterialController,
    DocumentController,
    UploadController,
    ExtractionController,
    KnowledgeController,
  ],
  providers: [
    PrismaService,
    LearnerService,
    LearningMaterialService,
    DocumentService,
    LearningLibraryAuthGuard,
    LocalStorageService,
    StorageService,
    FileValidatorService,
    UploadService,
    PdfExtractorService,
    DocxExtractorService,
    EpubExtractorService,
    TextExtractorService,
    ImageExtractorService,
    ExtractorFactoryService,
    StructureDetectorService,
    ExtractionOrchestratorService,
    CandidateExtractorService,
    IdentityResolutionService,
    ConceptGraphService,
  ],
  exports: [
    PrismaService,
    LearnerService,
    LearningMaterialService,
    DocumentService,
    LearningLibraryAuthGuard,
    LocalStorageService,
    StorageService,
    FileValidatorService,
    UploadService,
    PdfExtractorService,
    DocxExtractorService,
    EpubExtractorService,
    TextExtractorService,
    ImageExtractorService,
    ExtractorFactoryService,
    StructureDetectorService,
    ExtractionOrchestratorService,
    CandidateExtractorService,
    IdentityResolutionService,
    ConceptGraphService,
  ],
})
export class LearningLibraryModule {}
