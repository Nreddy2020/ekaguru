import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { LearningLibraryModule } from './learning-library/learning-library.module';
import { TemplateService } from './ai/template.service';
import { OmniEngineService } from './ai/omni.service';
import { LlmService } from './ai/llm.service';
import { LlmCacheService } from './ai/llm-cache.service';
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
import { ParentController } from './domain/parent.controller';
import { ParentService } from './domain/parent.service';

import { VisionService } from './ai/vision.service';
import { CognitiveLoopService } from './ai/cognitive-loop.service';
import { CognitiveLoopController } from './ai/cognitive-loop.controller';
import { SessionGateway } from './ai/session.gateway';
import { SessionRecordingService } from './ai/session-recording.service';
import { SessionRecordingController } from './ai/session-recording.controller';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';

@Module({
    imports: [
        ConfigModule.forRoot(),
        HttpModule,
        ThrottlerModule.forRoot([{
            name: 'short',
            ttl: 1000,
            limit: 10
        }, {
            name: 'long',
            ttl: 60000,
            limit: 100
        }]),
        AuthModule,
        LearningLibraryModule
    ],
    controllers: [SubjectController, TutorController, UploadController, CognitiveLoopController, ParentController, HealthController, MetricsController, SessionRecordingController],
    providers: [
        TemplateService,
        OmniEngineService,
        LlmService,
        LlmCacheService,
        SubjectService,
        LabService,
        AssessmentService,
        UserService,
        SearchService,
        AdminService,
        QualityService,
        TutorService,
        BookService,
        VisionService,
        CognitiveLoopService,
        SessionGateway,
        SessionRecordingService,
        ParentService
    ],
})
export class AppModule { }

