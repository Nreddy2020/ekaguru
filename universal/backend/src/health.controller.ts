import { Controller, Get, Logger } from '@nestjs/common';
import { LlmService } from './ai/llm.service';
import { LlmCacheService } from './ai/llm-cache.service';

@Controller('health')
export class HealthController {
    private readonly logger = new Logger(HealthController.name);

    constructor(
        private llmService: LlmService,
        private cacheService: LlmCacheService
    ) {}

    @Get()
    async check() {
        const llmReady = this.llmService.isReady();
        const cacheStats = this.cacheService.getStats();

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                llm: llmReady ? 'ready' : 'fallback',
                cache: 'active',
                entries: cacheStats.size
            },
            uptime: process.uptime()
        };
    }

    @Get('ready')
    async ready() {
        return {
            ready: true,
            llm: this.llmService.isReady()
        };
    }
}
