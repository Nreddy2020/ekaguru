import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GradeBand, CandidateStatus } from '@prisma/client';
import * as crypto from 'crypto';

export interface ExtractedCandidate {
  rawLabel: string;
  normalizedLabel: string;
  domain: string;
  gradeBand: GradeBand;
  candidateKey: string;
  confidence: number;
}

@Injectable()
export class CandidateExtractorService {
  private readonly logger = new Logger(CandidateExtractorService.name);

  constructor(private readonly prisma: PrismaService) {}

  generateCandidateKey(chunkId: string, normalizedLabel: string, domain: string, gradeBand: GradeBand): string {
    const normChunk = chunkId.trim();
    const normLabel = normalizedLabel.trim().toLowerCase();
    const normDomain = domain.trim().toLowerCase();
    const payload = `${normChunk}|${normLabel}|${normDomain}|${gradeBand}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  async extractCandidatesFromMaterial(materialId: string): Promise<ExtractedCandidate[]> {
    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: materialId },
      include: {
        documents: {
          include: {
            chunks: true,
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException(`LearningMaterial '${materialId}' not found.`);
    }

    const domain = material.subjectName || 'General';
    const gradeBand = this.resolveGradeBand(material.gradeLevel);

    const candidates: ExtractedCandidate[] = [];

    const doc = material.documents && material.documents.length > 0 ? material.documents[0] : null;
    if (!doc || !doc.chunks || doc.chunks.length === 0) {
      return candidates;
    }

    for (const chunk of doc.chunks) {
      const phrases = this.extractPhrasesFromText(chunk.content);
      for (const rawLabel of phrases) {
        const normalizedLabel = rawLabel.trim().toLowerCase();
        if (normalizedLabel.length < 3) continue;

        const candidateKey = this.generateCandidateKey(chunk.id, normalizedLabel, domain, gradeBand);

        const candidateData = {
          rawLabel,
          normalizedLabel,
          domain,
          gradeBand,
          candidateKey,
          confidence: 0.9,
        };

        // Deterministic candidate idempotency via candidateKey upsert
        await this.prisma.conceptCandidate.upsert({
          where: { candidateKey },
          create: {
            chunkId: chunk.id,
            candidateKey,
            rawLabel,
            normalizedLabel,
            domain,
            gradeBand,
            confidence: 0.9,
            status: CandidateStatus.PENDING,
          },
          update: {
            rawLabel,
            confidence: 0.9,
          },
        });

        candidates.push(candidateData);
      }
    }

    this.logger.log(`Extracted ${candidates.length} candidates for material '${materialId}'.`);
    return candidates;
  }

  private extractPhrasesFromText(text: string): string[] {
    const phrases = new Set<string>();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

    for (const line of lines) {
      // Heading match
      if (/^(chapter|unit|module|section|topic)\s+\d+[:\s]+(.+)$/i.test(line)) {
        const match = /^(chapter|unit|module|section|topic)\s+\d+[:\s]+(.+)$/i.exec(line);
        if (match && match[2]) phrases.add(match[2].trim());
      } else if (line.length <= 60 && /^[A-Z]/.test(line)) {
        phrases.add(line);
      }

      // Key concepts pattern: e.g. "Concept: Single-Digit Addition"
      const conceptMatches = line.match(/(?:concept|topic|topic of|skill):\s*([A-Za-z0-9\s\-]+)/gi);
      if (conceptMatches) {
        for (const cm of conceptMatches) {
          const parts = cm.split(':');
          if (parts[1]) phrases.add(parts[1].trim());
        }
      }
    }

    if (phrases.size === 0 && lines.length > 0) {
      // Fallback first line truncated as raw phrase candidate
      phrases.add(lines[0].slice(0, 50));
    }

    return Array.from(phrases);
  }

  private resolveGradeBand(gradeLevel?: string | null): GradeBand {
    if (!gradeLevel) return GradeBand.PRIMARY;
    const g = gradeLevel.toUpperCase();
    if (g.includes('LKG') || g.includes('UKG') || g.includes('NURSERY') || g.includes('KINDERGARTEN')) {
      return GradeBand.EARLY_CHILDHOOD;
    }
    if (g.includes('6') || g.includes('7') || g.includes('8')) {
      return GradeBand.MIDDLE_SCHOOL;
    }
    if (g.includes('9') || g.includes('10') || g.includes('11') || g.includes('12')) {
      return GradeBand.HIGH_SCHOOL;
    }
    return GradeBand.PRIMARY;
  }
}
