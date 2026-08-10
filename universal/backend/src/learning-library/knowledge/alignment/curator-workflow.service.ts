import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ProposalStatus, CandidateStatus } from '@prisma/client';

export interface CuratorReviewDto {
  proposalId: string;
  status: 'APPROVED' | 'REJECTED';
  curatorNotes?: string;
  reviewerId: string;
}

@Injectable()
export class CuratorWorkflowService {
  private readonly logger = new Logger(CuratorWorkflowService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPendingProposals(): Promise<any[]> {
    return this.prisma.conceptAlignmentProposal.findMany({
      where: { status: ProposalStatus.PENDING },
      include: {
        candidate: true,
        targetConcept: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processCuratorReview(dto: CuratorReviewDto): Promise<any> {
    const proposal = await this.prisma.conceptAlignmentProposal.findUnique({
      where: { id: dto.proposalId },
      include: { candidate: true, targetConcept: true },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal '${dto.proposalId}' not found.`);
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException(`Proposal '${dto.proposalId}' has already been processed.`);
    }

    // 1. Update Proposal status
    const updatedProposal = await this.prisma.conceptAlignmentProposal.update({
      where: { id: dto.proposalId },
      data: {
        status: dto.status,
        curatorNotes: dto.curatorNotes,
        reviewedBy: dto.reviewerId,
        reviewedAt: new Date(),
      },
    });

    const candidate = proposal.candidate;

    if (dto.status === ProposalStatus.APPROVED) {
      // 2. Link Candidate to Target Concept via ConceptChunk bridge
      await this.prisma.conceptChunk.upsert({
        where: {
          conceptId_chunkId: {
            conceptId: proposal.targetConceptId,
            chunkId: candidate.chunkId,
          },
        },
        create: {
          conceptId: proposal.targetConceptId,
          chunkId: candidate.chunkId,
          confidence: candidate.confidence,
          relevance: 1.0,
        },
        update: {
          confidence: candidate.confidence,
        },
      });

      // 3. Mark Candidate as RESOLVED
      await this.prisma.conceptCandidate.update({
        where: { id: candidate.id },
        data: {
          status: CandidateStatus.RESOLVED,
          resolvedConceptId: proposal.targetConceptId,
        },
      });

      // 4. Create Reusable CuratorRule (Versioned, Disableable, Sanitized-Only)
      await this.createCuratorRule({
        rawPhrase: candidate.rawLabel,
        normalizedPhrase: candidate.normalizedLabel,
        domain: candidate.domain || 'General',
        gradeBand: candidate.gradeBand,
        action: 'MAP_TO_CONCEPT',
        targetConceptId: proposal.targetConceptId,
        reviewerId: dto.reviewerId,
      });
    } else {
      // REJECTED
      await this.prisma.conceptCandidate.update({
        where: { id: candidate.id },
        data: { status: CandidateStatus.REJECTED },
      });

      await this.createCuratorRule({
        rawPhrase: candidate.rawLabel,
        normalizedPhrase: candidate.normalizedLabel,
        domain: candidate.domain || 'General',
        gradeBand: candidate.gradeBand,
        action: 'FORCE_NEW_CONCEPT',
        targetConceptId: null,
        reviewerId: dto.reviewerId,
      });
    }

    this.logger.log(`Curator review completed for proposal ${dto.proposalId} status=${dto.status} reviewer=${dto.reviewerId}`);
    return updatedProposal;
  }

  private async createCuratorRule(params: {
    rawPhrase: string;
    normalizedPhrase: string;
    domain: string;
    gradeBand: any;
    action: string;
    targetConceptId: string | null;
    reviewerId: string;
  }): Promise<any> {
    const lastRule = await this.prisma.curatorRule.findFirst({
      where: {
        normalizedPhrase: params.normalizedPhrase,
        domain: params.domain,
        gradeBand: params.gradeBand,
      },
      orderBy: { ruleVersion: 'desc' },
    });

    const nextVersion = lastRule ? lastRule.ruleVersion + 1 : 1;

    return this.prisma.curatorRule.create({
      data: {
        ruleVersion: nextVersion,
        active: true,
        rawPhrase: params.rawPhrase,
        normalizedPhrase: params.normalizedPhrase,
        domain: params.domain,
        gradeBand: params.gradeBand,
        action: params.action,
        targetConceptId: params.targetConceptId,
        createdBy: params.reviewerId,
      },
    });
  }

  async disableCuratorRule(ruleId: string): Promise<any> {
    const rule = await this.prisma.curatorRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException(`CuratorRule '${ruleId}' not found.`);

    return this.prisma.curatorRule.update({
      where: { id: ruleId },
      data: { active: false },
    });
  }
}
