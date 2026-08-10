import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { MultiFactorPolicyService } from './multi-factor-policy.service';
import { CuratorWorkflowService } from './curator-workflow.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { LearningLibraryAuthGuard } from '../../learning-library-auth.guard';
import { PrismaService } from '../../prisma.service';
import { CandidateStatus, EntityType, AlignmentDecisionType, ProposalStatus } from '@prisma/client';

@Controller('api/v2/concepts')
@UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
export class AlignmentController {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly policyService: MultiFactorPolicyService,
    private readonly curatorService: CuratorWorkflowService,
    private readonly prisma: PrismaService,
  ) {}

  private checkAdmin(req: any) {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied: Only ADMIN users can perform semantic alignment operations.');
    }
  }

  @Post('align')
  @HttpCode(HttpStatus.OK)
  async alignCandidates(@Body('materialId') materialId: string, @Request() req: any) {
    this.checkAdmin(req);

    const candidates = await this.prisma.conceptCandidate.findMany({
      where: {
        chunk: { document: { materialId } },
        status: CandidateStatus.PENDING,
      },
    });

    const activeConcepts = await this.prisma.concept.findMany({
      where: { status: 'ACTIVE' },
    });

    let autoLinked = 0;
    let proposalsCreated = 0;
    let newConceptsCreated = 0;

    for (const cand of candidates) {
      // Mark candidate as SCORING
      await this.prisma.conceptCandidate.update({
        where: { id: cand.id },
        data: { status: CandidateStatus.SCORING },
      });

      const candEmbedding = await this.embeddingService.getOrCreateEmbedding(
        EntityType.CANDIDATE,
        cand.id,
        cand.rawLabel,
        cand.domain || 'General',
        cand.gradeBand,
      );

      let bestMatchConcept: any = null;
      let bestEvaluation: any = null;
      let highestComposite = -1;

      for (const concept of activeConcepts) {
        const conceptEmbedding = await this.embeddingService.getOrCreateEmbedding(
          EntityType.CONCEPT,
          concept.id,
          concept.canonicalName,
          concept.domain || 'General',
          concept.gradeBand,
        );

        const sim = this.embeddingService.calculateCosineSimilarity(
          candEmbedding.embedding,
          conceptEmbedding.embedding,
        );

        const evalResult = await this.policyService.evaluateAlignment({
          candidateId: cand.id,
          candidateLabel: cand.rawLabel,
          candidateDomain: cand.domain || 'General',
          candidateGradeBand: cand.gradeBand,
          targetConceptId: concept.id,
          targetCanonicalName: concept.canonicalName,
          targetDomain: concept.domain || 'General',
          targetGradeBand: concept.gradeBand,
          cosineSimilarity: sim,
        });

        if (evalResult.compositeScore > highestComposite) {
          highestComposite = evalResult.compositeScore;
          bestMatchConcept = concept;
          bestEvaluation = evalResult;
        }
      }

      if (bestMatchConcept && bestEvaluation) {
        // Log Alignment Decision
        await this.prisma.alignmentDecisionLog.create({
          data: {
            candidateId: cand.id,
            candidateKey: cand.candidateKey,
            targetConceptId: bestMatchConcept.id,
            decisionType: bestEvaluation.decision,
            compositeScore: bestEvaluation.compositeScore,
            cosineScore: bestEvaluation.cosineScore,
            gradeBandScore: bestEvaluation.gradeBandScore,
            domainScore: bestEvaluation.domainScore,
            taxonomyScore: bestEvaluation.taxonomyScore,
            curatorScore: bestEvaluation.curatorScore,
            policyVersion: bestEvaluation.policyVersion,
            embeddingModel: candEmbedding.embeddingModel,
            embeddingVersion: candEmbedding.embeddingVersion,
            executedBy: req.user.sub || 'ADMIN',
          },
        });

        if (bestEvaluation.decision === AlignmentDecisionType.AUTO_LINK) {
          await this.prisma.conceptChunk.upsert({
            where: {
              conceptId_chunkId: { conceptId: bestMatchConcept.id, chunkId: cand.chunkId },
            },
            create: { conceptId: bestMatchConcept.id, chunkId: cand.chunkId, confidence: cand.confidence },
            update: { confidence: cand.confidence },
          });

          await this.prisma.conceptCandidate.update({
            where: { id: cand.id },
            data: { status: CandidateStatus.RESOLVED, resolvedConceptId: bestMatchConcept.id },
          });

          autoLinked++;
        } else if (bestEvaluation.decision === AlignmentDecisionType.REVIEW_REQUIRED) {
          await this.prisma.conceptAlignmentProposal.create({
            data: {
              candidateId: cand.id,
              targetConceptId: bestMatchConcept.id,
              compositeScore: bestEvaluation.compositeScore,
              cosineScore: bestEvaluation.cosineScore,
              gradeBandScore: bestEvaluation.gradeBandScore,
              domainScore: bestEvaluation.domainScore,
              taxonomyScore: bestEvaluation.taxonomyScore,
              curatorScore: bestEvaluation.curatorScore,
              policyVersion: bestEvaluation.policyVersion,
              embeddingModel: candEmbedding.embeddingModel,
              embeddingVersion: candEmbedding.embeddingVersion,
              status: ProposalStatus.PENDING,
            },
          });

          proposalsCreated++;
        } else {
          // NEW_CONCEPT
          newConceptsCreated++;
        }
      } else {
        newConceptsCreated++;
      }
    }

    return {
      data: {
        materialId,
        candidatesProcessed: candidates.length,
        autoLinked,
        proposalsCreated,
        newConceptsCreated,
      },
    };
  }

  @Get('alignment-proposals')
  async getProposals(@Request() req: any) {
    this.checkAdmin(req);
    const proposals = await this.curatorService.getPendingProposals();
    return { data: proposals };
  }

  @Post('alignment-proposals/:id/review')
  @HttpCode(HttpStatus.OK)
  async reviewProposal(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Body('curatorNotes') curatorNotes: string,
    @Request() req: any,
  ) {
    this.checkAdmin(req);
    const result = await this.curatorService.processCuratorReview({
      proposalId: id,
      status,
      curatorNotes,
      reviewerId: req.user.sub || 'ADMIN',
    });
    return { data: result };
  }

  @Get('alignment-history')
  async getHistory(@Request() req: any) {
    this.checkAdmin(req);
    const logs = await this.prisma.alignmentDecisionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data: logs };
  }

  @Post('curator-rules/:id/disable')
  @HttpCode(HttpStatus.OK)
  async disableRule(@Param('id') id: string, @Request() req: any) {
    this.checkAdmin(req);
    const rule = await this.curatorService.disableCuratorRule(id);
    return { data: rule };
  }
}
