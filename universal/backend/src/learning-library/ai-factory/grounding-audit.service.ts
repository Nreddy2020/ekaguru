import { Injectable, Logger } from '@nestjs/common';
import { TeachingPackageRecord } from './content-factory.service';

export interface GroundingAuditResult {
  packageId: string;
  totalClaimsChecked: number;
  supportedClaimsCount: number;
  unsupportedClaimsCount: number;
  sourceDerivedCitationCompleteness: number; // Must be 1.0 (100%)
  hardPublishBlock: boolean;
  validationStatus: 'PASS' | 'FAIL';
  auditTimestamp: string;
}

@Injectable()
export class GroundingAuditService {
  private readonly logger = new Logger(GroundingAuditService.name);

  /**
   * Audits a TeachingPackage.
   * INVARIANT: For all SOURCE_DERIVED items: 100% must have valid physical evidence.
   * Unsupported claims = 0. If > 0 ➔ HARD PUBLISH BLOCK.
   */
  public auditPackage(pkg: TeachingPackageRecord): GroundingAuditResult {
    let totalClaimsChecked = 0;
    let supportedClaimsCount = 0;
    let unsupportedClaimsCount = 0;

    const depths = Object.values(pkg.depths);
    for (const d of depths) {
      // 1. Audit Teacher Explanations
      for (const step of d.teacherExplanation) {
        totalClaimsChecked++;
        if (step.contentOrigin === 'SOURCE_DERIVED') {
          if (step.citations && step.citations.length > 0 && step.citations[0].bbox) {
            supportedClaimsCount++;
          } else {
            unsupportedClaimsCount++;
          }
        } else {
          supportedClaimsCount++; // Non-source-derived items are explicitly classified
        }
      }

      // 2. Audit Key Points
      for (const kp of d.keyPoints) {
        totalClaimsChecked++;
        if (kp.contentOrigin === 'SOURCE_DERIVED') {
          if (kp.citations && kp.citations.length > 0 && kp.citations[0].bbox) {
            supportedClaimsCount++;
          } else {
            unsupportedClaimsCount++;
          }
        } else {
          supportedClaimsCount++;
        }
      }
    }

    const citationCompleteness =
      totalClaimsChecked > 0 ? Number((supportedClaimsCount / totalClaimsChecked).toFixed(3)) : 1.0;

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
      auditTimestamp: new Date().toISOString(),
    };
  }
}
