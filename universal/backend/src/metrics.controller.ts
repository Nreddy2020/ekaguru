import { Controller, Get, Logger } from '@nestjs/common';
import { LlmService } from './ai/llm.service';
import { LlmCacheService } from './ai/llm-cache.service';
import { CognitiveLoopService } from './ai/cognitive-loop.service';

interface Metric {
    name: string;
    value: number;
    type: 'gauge' | 'counter';
    labels?: Record<string, string>;
}

@Controller('metrics')
export class MetricsController {
    private readonly logger = new Logger(MetricsController.name);
    private requestCount = 0;
    private errorCount = 0;
    private llmCallCount = 0;
    private sessionCount = 0;
    private startTime = Date.now();

    constructor(
        private llmService: LlmService,
        private cacheService: LlmCacheService,
        private cognitiveLoopService: CognitiveLoopService
    ) {}

    incrementRequest() {
        this.requestCount++;
    }

    incrementError() {
        this.errorCount++;
    }

    incrementLlmCall() {
        this.llmCallCount++;
    }

    @Get()
    async getMetrics() {
        const cacheStats = this.cacheService.getStats();
        const activeSessions = await this.cognitiveLoopService.getActiveSessions();
        const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

        const metrics: Metric[] = [
            { name: 'ekaguru_requests_total', value: this.requestCount, type: 'counter' },
            { name: 'ekaguru_errors_total', value: this.errorCount, type: 'counter' },
            { name: 'ekaguru_llm_calls_total', value: this.llmCallCount, type: 'counter' },
            { name: 'ekaguru_cache_size', value: cacheStats.size, type: 'gauge' },
            { name: 'ekaguru_active_sessions', value: activeSessions.length, type: 'gauge' },
            { name: 'ekaguru_uptime_seconds', value: uptimeSeconds, type: 'gauge' },
            { name: 'ekaguru_llm_ready', value: this.llmService.isReady() ? 1 : 0, type: 'gauge' }
        ];

        return this.formatPrometheus(metrics);
    }

    private formatPrometheus(metrics: Metric[]): string {
        let output = '';
        for (const m of metrics) {
            if (m.labels) {
                const labelStr = Object.entries(m.labels)
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(',');
                output += `ekaguru_${m.name}{${labelStr}} ${m.value}\n`;
            } else {
                output += `ekaguru_${m.name} ${m.value}\n`;
            }
        }
        return output;
    }
}
