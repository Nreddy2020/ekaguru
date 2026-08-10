import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingProvider, EmbeddingResult } from './embedding-provider.interface';

@Injectable()
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly providerName = 'OpenAIEmbeddingProvider';
  private readonly logger = new Logger(OpenAIEmbeddingProvider.name);

  async generateEmbedding(sanitizedText: string): Promise<EmbeddingResult> {
    this.logger.log(`[OpenAI] Generating 1536-dim vector for sanitized input fingerprint length=${sanitizedText.length}`);

    // Mock deterministic vector generation for development/test environment
    const seed = this.hashString(sanitizedText);
    const vector = new Array(1536).fill(0).map((_, i) => Math.sin(seed + i) * 0.1);

    return {
      embedding: vector,
      dimensions: 1536,
      model: 'text-embedding-3-small',
      version: 1,
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
