import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QualityService {
    private readonly logger = new Logger(QualityService.name);

    validateTopic(topicData: any) {
        const report = {
            score: 100,
            issues: [] as string[],
            status: 'PASS'
        };

        // Check 1: Mandatory Fields (The "20-Field" Standard)
        const requiredFields = ['architecture', 'internals', 'security', 'performance', 'troubleshooting'];
        const missing = requiredFields.filter(field => !topicData.contentData?.[field]);

        if (missing.length > 0) {
            report.score -= 20 * missing.length;
            report.issues.push(`Missing mandatory fields: ${missing.join(', ')}`);
        }

        // Check 2: Persona Explanations
        if (!topicData.explanations?.kid || topicData.explanations.kid.length < 50) {
            report.score -= 10;
            report.issues.push("Kid explanation is missing or too short.");
        }
        if (!topicData.explanations?.professor) {
            report.score -= 10;
            report.issues.push("Professor explanation is missing.");
        }

        // Check 3: Hallucination/Grounding (Mock RAG check)
        if (topicData.title.includes("Flux Capacitor")) { // Joke check
            report.score = 0;
            report.issues.push("CRITICAL: Detected fictitious technology.");
        }

        report.status = report.score > 80 ? 'PASS' : 'FAIL';
        this.logger.log(`Quality Check for "${topicData.title}": ${report.status} (${report.score}%)`);

        return report;
    }
}
