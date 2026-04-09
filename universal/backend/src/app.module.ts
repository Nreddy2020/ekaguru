import { Module } from '@nestjs/common';
import { TemplateService } from './ai/template.service';
import { OmniEngineService } from './ai/omni.service';
import { SubjectService } from './domain/subject.service';
import { LabService } from './domain/lab.service';
import { AssessmentService } from './domain/assessment.service';
import { UserService } from './domain/user.service';
import { SearchService } from './domain/search.service';
import { AdminService } from './domain/admin.service';
import { QualityService } from './domain/quality.service';
import { TutorService } from './domain/tutor.service';
import { BookService } from './domain/book.service';

import { SubjectController } from './domain/subject.controller';
import { TutorController } from './domain/tutor.controller';
import { UploadController } from './domain/upload.controller';

import { VisionService } from './ai/vision.service';

@Module({
    imports: [],
    controllers: [SubjectController, TutorController, UploadController],
    providers: [
        TemplateService,
        OmniEngineService,
        SubjectService,
        LabService,
        AssessmentService,
        UserService,
        SearchService,
        AdminService,
        QualityService,
        TutorService,
        BookService,
        VisionService // Added VisionService
    ],
})
export class AppModule { }

