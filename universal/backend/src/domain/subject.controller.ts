import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SubjectService } from './subject.service';

@Controller('subjects')
export class SubjectController {
    constructor(private readonly subjectService: SubjectService) { }

    @Post()
    async createSubject(@Body('name') name: string, @Body('category') category: string) {
        return await this.subjectService.createUniversalSubject(name, category);
    }

    @Get()
    async getAllSubjects() {
        return this.subjectService.findAll();
    }

    @Get(':id')
    async getSubject(@Param('id') id: string) {
        return this.subjectService.getSubject(id);
    }

    // ========================================
    // NEW UKE CAPABILITIES
    // ========================================

    @Post('deep-learn')
    async deepLearnTopic(@Body() body: { topic: string; depth?: number }) {
        const result = await this.subjectService.deepLearnTopic(body.topic, body.depth || 1);
        return result;
    }

    @Get('progress/:topic')
    async getIngestionProgress(@Param('topic') topic: string) {
        const progress = await this.subjectService.getIngestionProgress(topic);
        return progress;
    }
}
