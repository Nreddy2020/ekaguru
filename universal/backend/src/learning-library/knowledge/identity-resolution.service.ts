import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConceptType, GradeBand, CandidateStatus } from '@prisma/client';

@Injectable()
export class IdentityResolutionService {
  private readonly logger = new Logger(IdentityResolutionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resolveCandidatesForMaterial(materialId: string): Promise<{ conceptsResolved: number; linksCreated: number }> {
    const candidates = await this.prisma.conceptCandidate.findMany({
      where: {
        chunk: {
          document: {
            materialId,
          },
        },
        status: CandidateStatus.PENDING,
      },
      include: { chunk: true },
    });

    let conceptsResolved = 0;
    let linksCreated = 0;

    for (const candidate of candidates) {
      const canonicalName = this.toTitleCase(candidate.rawLabel);
      const normalizedName = candidate.normalizedLabel;
      const domain = candidate.domain || 'General';
      const gradeBand = candidate.gradeBand || GradeBand.PRIMARY;

      // Deterministic Identity Match on unique([normalizedName, domain, gradeBand])
      const concept = await this.prisma.concept.upsert({
        where: {
          normalizedName_domain_gradeBand: {
            normalizedName,
            domain,
            gradeBand,
          },
        },
        create: {
          canonicalName,
          normalizedName,
          domain,
          gradeBand,
          conceptType: ConceptType.CONCEPT,
          definition: `Canonical concept '${canonicalName}' in ${domain} (${gradeBand}).`,
          objectives: {
            create: {
              description: `Demonstrate understanding of ${canonicalName}.`,
              complexityLevel: 1,
              bloomTaxonomy: 'UNDERSTAND',
            },
          },
        },
        update: {
          canonicalName,
        },
      });

      conceptsResolved++;

      // Create ConceptChunk bridge (many-to-many lineage join)
      await this.prisma.conceptChunk.upsert({
        where: {
          conceptId_chunkId: {
            conceptId: concept.id,
            chunkId: candidate.chunkId,
          },
        },
        create: {
          conceptId: concept.id,
          chunkId: candidate.chunkId,
          confidence: candidate.confidence,
          relevance: 1.0,
        },
        update: {
          confidence: candidate.confidence,
        },
      });

      linksCreated++;

      // Mark candidate as RESOLVED
      await this.prisma.conceptCandidate.update({
        where: { id: candidate.id },
        data: {
          status: CandidateStatus.RESOLVED,
          resolvedConceptId: concept.id,
        },
      });
    }

    this.logger.log(`Identity resolution complete: ${conceptsResolved} concepts resolved, ${linksCreated} concept-chunk links created.`);
    return { conceptsResolved, linksCreated };
  }

  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
