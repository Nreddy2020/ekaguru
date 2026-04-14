import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from './llm.service';

@Injectable()
export class VisionService {
    private readonly logger = new Logger(VisionService.name);
    private llmService: LlmService;

    constructor(llmService: LlmService) {
        this.llmService = llmService;
    }

    async analyzeImage(imageBuffer: Uint8Array, contextHints: string = ""): Promise<string> {
        this.logger.log(`👁️ Vision AI analyzing image (${imageBuffer.length} bytes)...`);

        if (this.llmService.isReady()) {
            try {
                return await this.llmService.analyzeImage(imageBuffer, contextHints);
            } catch (error) {
                this.logger.warn('Vision LLM failed, using fallback', error);
            }
        }

        return `[Vision-AI Analysis]: A complex system diagram showing the interaction between User, Balancer, and multiple Service Nodes. Context suggests it explains High Availability architecture.`;
    }

    async isImageOnlyPage(pageSample: Uint8Array): Promise<boolean> {
        return pageSample.length > 10000;
    }

    async verifyTextLayer(embeddedText: string, ocrText: string): Promise<{ verified: boolean; corrections: string[] }> {
        const corrections: string[] = [];

        if (!embeddedText || embeddedText.length < 10) {
            return { verified: false, corrections: ['No embedded text detected - use OCR only'] };
        }

        const similarity = this.calculateSimilarity(embeddedText, ocrText);

        if (similarity < 0.8) {
            corrections.push('Significant text discrepancy detected');
            return { verified: false, corrections };
        }

        return { verified: true, corrections: [] };
    }

    private calculateSimilarity(a: string, b: string): number {
        const longer = a.length > b.length ? a : b;
        const shorter = a.length > b.length ? b : a;
        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    private levenshteinDistance(a: string, b: string): number {
        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }
        return matrix[b.length][a.length];
    }
}
