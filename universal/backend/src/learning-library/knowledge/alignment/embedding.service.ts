import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { OpenAIEmbeddingProvider } from './openai-embedding.provider';
import { EntityType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OpenAIEmbeddingProvider,
  ) {}

  generateSanitizedFingerprint(rawLabel: string, domain: string, gradeBand: string): { inputPayload: string; fingerprint: string } {
    const inputPayload = [rawLabel.trim().toLowerCase(), (domain || 'General').trim().toLowerCase(), gradeBand].join(' | ');
    const fingerprint = crypto.createHash('sha256').update(inputPayload).digest('hex');
    return { inputPayload, fingerprint };
  }

  async getOrCreateEmbedding(entityType: EntityType, entityId: string, rawLabel: string, domain: string, gradeBand: string): Promise<any> {
    const { inputPayload, fingerprint } = this.generateSanitizedFingerprint(rawLabel, domain, gradeBand);

    // 1. Check if vector with matching inputFingerprint already exists
    const existing = await this.prisma.semanticEmbedding.findFirst({
      where: {
        entityType,
        entityId,
        inputFingerprint: fingerprint,
      },
    });

    if (existing) {
      return existing;
    }

    // 2. Compute vector from Provider using sanitized input payload ONLY
    const result = await this.provider.generateEmbedding(inputPayload);

    // 3. Upsert SemanticEmbedding model
    const vectorRecord = await this.prisma.semanticEmbedding.upsert({
      where: {
        entityType_entityId_embeddingModel_embeddingVersion: {
          entityType,
          entityId,
          embeddingModel: result.model,
          embeddingVersion: result.version,
        },
      },
      create: {
        entityType,
        entityId,
        embeddingModel: result.model,
        embeddingVersion: result.version,
        dimensions: result.dimensions,
        embedding: result.embedding,
        inputFingerprint: fingerprint,
      },
      update: {
        embedding: result.embedding,
        inputFingerprint: fingerprint,
      },
    });

    this.logger.log(`Generated & stored vector record for ${entityType}:${entityId} model=${result.model}`);
    return vectorRecord;
  }

  calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
      return 0.0;
    }

    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0.0;
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1.0, similarity));
  }
}
