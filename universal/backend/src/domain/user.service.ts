import { Injectable, Logger } from '@nestjs/common';
import { TemplateService } from '../ai/template.service';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(private readonly templateService: TemplateService) { }

    async generatePersonalizedPath(userId: string, subjectName: string, role: string) {
        this.logger.log(`Generating Plan for User ${userId} on ${subjectName} as ${role}...`);

        // MOCK LLM Call
        return {
            userId,
            subject: subjectName,
            plan: {
                pace: 'Aggressive (1 module/day)',
                path: ['Basics', 'Advanced Concepts', 'Real-world Scenarios']
            }
        };
    }

    async getProgress(userId: string) {
        // Mock Progress Data
        return {
            totalXp: 1250,
            streakDay: 5,
            completedTopics: 12,
            completedLabs: 4,
            skills: {
                'Containerization': 0.8,
                'Orchestration': 0.4,
                'Security': 0.1
            }
        };
    }
}
