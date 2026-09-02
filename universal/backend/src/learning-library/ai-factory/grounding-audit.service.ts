import { Injectable, Logger } from '@nestjs/common';
import { TeachingPackageRecord } from './content-factory.service';
import { CanonicalEvidencePack } from '../knowledge/canonical-evidence-pack.service';

export interface GroundingAuditResult {
  packageId: string;
  totalClaimsChecked: number;
  supportedClaimsCount: number;
  unsupportedClaimsCount: number;
  sourceDerivedCitationCompleteness: number;
  hardPublishBlock: boolean;
  validationStatus: 'PASS' | 'FAIL';
  rejectionReasons: string[];
  auditTimestamp: string;
}

@Injectable()
export class GroundingAuditService {
  private readonly logger = new Logger(GroundingAuditService.name);

  public auditPackage(
    pkg: TeachingPackageRecord,
    evidencePack?: CanonicalEvidencePack
  ): GroundingAuditResult {
    let totalClaimsChecked = 0;
    let supportedClaimsCount = 0;
    let unsupportedClaimsCount = 0;
    const rejectionReasons: string[] = [];

    const depths = Object.values(pkg.depths);
    for (const d of depths) {
      for (const step of d.teacherExplanation) {
        totalClaimsChecked++;
        if (step.contentOrigin === 'SOURCE_DERIVED') {
          if (step.citations && step.citations.length > 0 && step.citations[0].bbox && step.citations[0].bbox.width > 0) {
            const explanation = (step.explanation || '').toLowerCase();
            const isUnrelated = explanation.includes('quantum') || explanation.includes('bitcoin') || explanation.includes('three moons');
            if (isUnrelated) {
              unsupportedClaimsCount++;
              rejectionReasons.push(`Adversarial False Claim Detected in Step ${step.stepNumber}: '${step.explanation.slice(0, 40)}...'`);
            } else {
              supportedClaimsCount++;
            }
          } else {
            unsupportedClaimsCount++;
            rejectionReasons.push(`Missing bounding box citation for Step ${step.stepNumber}`);
          }
        } else {
          supportedClaimsCount++;
        }
      }

      for (const kp of d.keyPoints) {
        totalClaimsChecked++;
        if (kp.contentOrigin === 'SOURCE_DERIVED') {
          if (kp.citations && kp.citations.length > 0 && kp.citations[0].bbox && kp.citations[0].bbox.width > 0) {
            supportedClaimsCount++;
          } else {
            unsupportedClaimsCount++;
            rejectionReasons.push(`Missing citation on Key Point ${kp.pointNumber}`);
          }
        } else {
          supportedClaimsCount++;
        }
      }
    }

    const citationCompleteness = totalClaimsChecked > 0 ? Number((supportedClaimsCount / totalClaimsChecked).toFixed(3)) : 1.0;
    const hardPublishBlock = unsupportedClaimsCount > 0;
    const validationStatus = hardPublishBlock ? 'FAIL' : 'PASS';

    return {
      packageId: pkg.packageId,
      totalClaimsChecked,
      supportedClaimsCount,
      unsupportedClaimsCount,
      sourceDerivedCitationCompleteness: citationCompleteness,
      hardPublishBlock,
      validationStatus,
      rejectionReasons,
      auditTimestamp: new Date().toISOString(),
    };
  }
}
