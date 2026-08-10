import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { LearnerService } from './learner.service';
import { LearnerController } from './learner.controller';
import { LearningMaterialService } from './learning-material.service';
import { LearningMaterialController } from './learning-material.controller';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';

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
  ],
  exports: [
    PrismaService,
    LearnerService,
    LearningMaterialService,
    DocumentService,
  ],
})
export class LearningLibraryModule {}
