import { Controller, Get, Post, Body, Param, Query, Logger, Res, GoneException } from '@nestjs/common';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TutorService } from './tutor.service';

@Controller('tutor')
export class TutorController {
    private readonly logger = new Logger(TutorController.name);

    constructor(private readonly tutorService: TutorService) { }

    @Get('topic/:id')
    async getTopic(@Param('id') topicId: string) {
        this.logger.log(`GET /tutor/topic/${topicId}`);
        const topic = await this.tutorService.getTopicExplanation(topicId);

        if (!topic) {
            return { error: 'Topic not found' };
        }

        return topic;
    }

    @Get('explain/:id')
    async getPersonaExplanation(
        @Param('id') topicId: string,
        @Query('persona') persona: string = 'student'
    ) {
        this.logger.log(`GET /tutor/explain/${topicId}?persona=${persona}`);
        const explanation = await this.tutorService.getPersonaExplanation(topicId, persona);

        if (!explanation) {
            return { error: 'Topic not found' };
        }

        return explanation;
    }

    @Post('ask')
    async askQuestion(@Body() body: { topicId: string; question: string }) {
        this.logger.log(`POST /tutor/ask - Topic: ${body.topicId}`);
        const response = await this.tutorService.answerQuestion(body.topicId, body.question);
        return response;
    }

    @Get('guide/:id')
    async getLearningGuidance(@Param('id') topicId: string) {
        this.logger.log(`GET /tutor/guide/${topicId}`);
        const guidance = await this.tutorService.getLearningGuidance(topicId);
        return guidance;
    }

    @Get('analytics/:studentId')
    async getAnalytics(@Param('studentId') studentId: string) {
        this.logger.log(`GET /tutor/analytics/${studentId}`);
        throw new GoneException('This legacy analytics endpoint is deprecated and no longer available. Please use the secure parent portal analytics API.');
    }

    // ========================================
    // NEW UKE CAPABILITIES
    // ========================================

    @Post('roadmap')
    async createRoadmap(@Body() body: { goal: string }) {
        this.logger.log(`POST /tutor/roadmap - Goal: ${body.goal}`);
        const roadmap = await this.tutorService.createLearningPath(body.goal);
        return roadmap;
    }

    @Get('next-steps')
    async getNextSteps(@Query('currentLevel') currentLevel: string = 'Beginner') {
        this.logger.log(`GET /tutor/next-steps?currentLevel=${currentLevel}`);
        const nextSteps = await this.tutorService.getNextSteps(currentLevel);
        return nextSteps;
    }

    @Get('demo')
    async getDemo(@Res() res: Response) {
        this.logger.log(`GET /tutor/demo - Serving UKE Demo HTML`);
        const filePath = join('e:', 'Ekaguru', 'universal', 'backend', 'public', 'uke-demo.html');
        const html = readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }

    @Get('prerequisites/:topicId')
    async getPrerequisites(@Param('topicId') topicId: string) {
        this.logger.log(`GET /tutor/prerequisites/${topicId}`);
        const prerequisites = await this.tutorService.getPrerequisites(topicId);
        return prerequisites;
    }
}
