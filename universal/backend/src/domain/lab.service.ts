import { Injectable, Logger } from '@nestjs/common';
import { TemplateService } from '../ai/template.service';

@Injectable()
export class LabService {
    private readonly logger = new Logger(LabService.name);

    constructor(private readonly templateService: TemplateService) { }

    async generateLab(topicName: string, envType: string = 'Docker') {
        this.logger.log(`Generating Lab for ${topicName} in ${envType}...`);

        // MOCK LLM Call leveraging the new LAB_GENERATOR template
        return {
            id: 'lab-123',
            title: `Hands-on: ${topicName}`,
            environment: envType,
            steps: [
                { cmd: 'docker pull nginx', desc: 'Fetch the image' },
                { cmd: 'docker run -d -p 80:80 nginx', desc: 'Run container' }
            ],
            solution: 'You should see "Welcome to Nginx" at localhost.'
        };
    }
}
