import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { LearnerService } from './learner.service';
import { LearnerController } from './learner.controller';
import { LearningMaterialService } from './learning-material.service';
import { LearningMaterialController } from './learning-material.controller';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { LearningLibraryAuthGuard } from './learning-library-auth.guard';

@Module({
  controllers: [
    LearnerController,
    LearningMaterialController,
    DocumentController,
  ],
  providers: [
    PrismaService,
    LearnerService,
    LearningMaterialService,
    DocumentService,
    LearningLibraryAuthGuard,
  ],
  exports: [
    PrismaService,
    LearnerService,
    LearningMaterialService,
    DocumentService,
    LearningLibraryAuthGuard,
  ],
})
export class LearningLibraryModule {}
