import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GradeBand, AlignmentDecisionType } from '@prisma/client';

export interface AlignmentScoringInput {
  candidateId: string;
  candidateLabel: string;
  candidateDomain: string;
  candidateGradeBand: GradeBand;
  targetConceptId: string;
  targetCanonicalName: string;
  targetDomain: string;
  targetGradeBand: GradeBand;
  cosineSimilarity: number;
}

export interface AlignmentEvaluationResult {
  decision: AlignmentDecisionType;
  compositeScore: number;
  cosineScore: number;
  gradeBandScore: number;
  domainScore: number;
  taxonomyScore: number;
  curatorScore: number;
  policyVersion: number;
}

@Injectable()
export class MultiFactorPolicyService {
  private readonly logger = new Logger(MultiFactorPolicyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getLatestPolicy(): Promise<any> {
    const policy = await this.prisma.alignmentPolicy.findFirst({
      orderBy: { version: 'desc' },
    });

    if (!policy) {
      return this.prisma.alignmentPolicy.create({
        data: {
          version: 1,
          cosineWeight: 0.40,
          gradeWeight: 0.25,
          domainWeight: 0.15,
          taxonomyWeight: 0.10,
          curatorWeight: 0.10,
          autoLinkThreshold: 0.88,
          reviewThreshold: 0.70,
          createdBy: 'SYSTEM_INIT',
        },
      });
    }

    return policy;
  }

  async evaluateAlignment(input: AlignmentScoringInput): Promise<AlignmentEvaluationResult> {
    const policy = await this.getLatestPolicy();

    // 1. GradeBand Compatibility Score & Hard Auto-Merge Block
    const gradeBandScore = this.calculateGradeBandScore(input.candidateGradeBand, input.targetGradeBand);

    // 2. Domain Score
    const domainScore = input.candidateDomain.toLowerCase() === input.targetDomain.toLowerCase() ? 1.0 : 0.5;

    // 3. Taxonomy Score
    const taxonomyScore = input.candidateLabel.toLowerCase() === input.targetCanonicalName.toLowerCase() ? 1.0 : 0.6;

    // 4. Curator History Score
    const activeCuratorRule = await this.prisma.curatorRule.findFirst({
      where: {
        normalizedPhrase: input.candidateLabel.toLowerCase(),
        domain: input.candidateDomain,
        gradeBand: input.candidateGradeBand,
        active: true,
      },
    });
    const curatorScore = activeCuratorRule ? (activeCuratorRule.action === 'MAP_TO_CONCEPT' ? 1.0 : 0.0) : 0.5;

    // 5. Composite Score Calculation
    const compositeScore =
      policy.cosineWeight * input.cosineSimilarity +
      policy.gradeWeight * gradeBandScore +
      policy.domainWeight * domainScore +
      policy.taxonomyWeight * taxonomyScore +
      policy.curatorWeight * curatorScore;

    // 6. Decision Classification Router
    let decision: AlignmentDecisionType;

    // HARD INVARIANT: Incompatible grade bands can NEVER auto-link
    if (gradeBandScore < 1.0 && compositeScore >= policy.autoLinkThreshold) {
      decision = AlignmentDecisionType.REVIEW_REQUIRED;
    } else if (compositeScore >= policy.autoLinkThreshold && gradeBandScore === 1.0) {
      decision = AlignmentDecisionType.AUTO_LINK;
    } else if (compositeScore >= policy.reviewThreshold) {
      decision = AlignmentDecisionType.REVIEW_REQUIRED;
    } else {
      decision = AlignmentDecisionType.NEW_CONCEPT;
    }

    this.logger.log(
      `Evaluated alignment candidate=${input.candidateId} target=${input.targetConceptId} composite=${compositeScore.toFixed(3)} decision=${decision}`,
    );

    return {
      decision,
      compositeScore: Number(compositeScore.toFixed(4)),
      cosineScore: Number(input.cosineSimilarity.toFixed(4)),
      gradeBandScore: Number(gradeBandScore.toFixed(4)),
      domainScore: Number(domainScore.toFixed(4)),
      taxonomyScore: Number(taxonomyScore.toFixed(4)),
      curatorScore: Number(curatorScore.toFixed(4)),
      policyVersion: policy.version,
    };
  }

  private calculateGradeBandScore(g1: GradeBand, g2: GradeBand): number {
    if (g1 === g2) return 1.0;

    const order: GradeBand[] = [
      GradeBand.EARLY_CHILDHOOD,
      GradeBand.PRIMARY,
      GradeBand.MIDDLE_SCHOOL,
      GradeBand.HIGH_SCHOOL,
      GradeBand.ADVANCED,
    ];

    const idx1 = order.indexOf(g1);
    const idx2 = order.indexOf(g2);

    if (Math.abs(idx1 - idx2) === 1) return 0.3; // Adjacent GradeBand
    return 0.0; // Incompatible GradeBand Hard Block
  }
}
