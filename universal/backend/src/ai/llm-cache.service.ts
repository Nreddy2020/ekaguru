import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

@Injectable()
export class LlmCacheService {
    private readonly logger = new Logger(LlmCacheService.name);
    private cache = new Map<string, CacheEntry<any>>();
    private defaultTTL = 3600000;

    constructor() {
        this.startCleanupInterval();
    }

    private startCleanupInterval() {
        setInterval(() => this.cleanup(), 60000);
    }

    private cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt < now) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            this.logger.debug(`Cleaned ${cleaned} expired cache entries`);
        }
    }

    generateKey(prompt: string, suffix: string = ''): string {
        const hash = this.simpleHash(prompt);
        return `${suffix}:${hash}`;
    }

    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            return null;
        }

        this.logger.debug(`Cache HIT: ${key}`);
        return entry.value as T;
    }

    set<T>(key: string, value: T, ttl?: number): void {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (ttl || this.defaultTTL)
        });
        this.logger.debug(`Cache SET: ${key}`);
    }

    invalidate(pattern: string): number {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }

    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
