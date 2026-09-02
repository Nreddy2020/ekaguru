import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MultiTenantSchoolService } from '../tenancy/multi-tenant-school.service';
import { MultiTenantSecurityService, TenantContext } from '../tenancy/multi-tenant-security.service';
import { LearnerProfileService } from '../personalization/learner-profile.service';
import { CanonicalEvidencePackService } from '../knowledge/canonical-evidence-pack.service';

export type BoardType = 'NCERT' | 'CBSE' | 'ICSE' | 'STATE_BOARD';

export interface CurriculumStandard {
  standardId: string;
  board: BoardType;
  gradeLevel: string;
  subject: string;
  competencyCode: string;
  learningObjective: string;
  mappedConceptId?: string;
  isCoveredInBook: boolean;
}

export type GapType = 'CURRICULUM_GAP' | 'TEACHING_GAP' | 'MASTERY_GAP';

export interface SyllabusGapItem {
  gapType: GapType;
  conceptId?: string;
  conceptName?: string;
  standardId?: string;
  description: string;
  recommendation: string;
}

export interface ClassCurriculumReport {
  districtId: string;
  schoolId: string;
  sectionId: string;
  gradeLevel: string;
  subject: string;
  totalStandardsCount: number;
  coveragePercentage: number;
  taughtPercentage: number;
  masteredPercentage: number;
  expectedCalendarProgress: number;
  actualProgress: number;
  progressGap: number;
  conceptBreakdown: {
    conceptId: string;
    conceptName: string;
    mappedStandards: string[];
    isTaught: boolean;
    classAverageMastery: number;
    status: 'MASTERED' | 'DEVELOPING' | 'NEEDS_HELP' | 'NOT_TAUGHT';
    physicalPage: number;
    bbox: { x: number; y: number; width: number; height: number };
  }[];
  detectedGaps: SyllabusGapItem[];
  generatedAt: string;
}

@Injectable()
export class CurriculumComplianceService {
  private readonly logger = new Logger(CurriculumComplianceService.name);

  private standards: Map<string, CurriculumStandard> = new Map();
  private taughtConcepts: Set<string> = new Set(['C0101', 'C0102']); // Seeded: Chapters 1 taught

  constructor(
    private readonly schoolService: MultiTenantSchoolService,
    private readonly securityService: MultiTenantSecurityService,
    private readonly profileService: LearnerProfileService,
    private readonly evidencePackService: CanonicalEvidencePackService
  ) {
    this.seedCanonicalStandards();
  }

  private seedCanonicalStandards(): void {
    // 5.1 & 5.2 — NCERT / CBSE Standards Data Model
    const s1: CurriculumStandard = {
      standardId: 'NCERT-EVS-5-01',
      board: 'NCERT',
      gradeLevel: 'Grade 5',
      subject: 'Environmental Studies',
      competencyCode: 'EVS.5.1.1',
      learningObjective: 'Identify characteristics of living organisms including biological growth and nutritional needs.',
      mappedConceptId: 'C0101',
      isCoveredInBook: true,
    };
    this.standards.set(s1.standardId, s1);

    const s2: CurriculumStandard = {
      standardId: 'CBSE-EVS-5-C1',
      board: 'CBSE',
      gradeLevel: 'Grade 5',
      subject: 'Environmental Studies',
      competencyCode: 'CBSE.EVS.5.01',
      learningObjective: 'Analyze internal developmental growth continua across living organisms.',
      mappedConceptId: 'C0102',
      isCoveredInBook: true,
    };
    this.standards.set(s2.standardId, s2);

    const s3: CurriculumStandard = {
      standardId: 'NCERT-EVS-5-03',
      board: 'NCERT',
      gradeLevel: 'Grade 5',
      subject: 'Environmental Studies',
      competencyCode: 'EVS.5.1.3',
      learningObjective: 'Differentiate between animal and plant skeletal / structural supports.',
      mappedConceptId: 'C0201',
      isCoveredInBook: true,
    };
    this.standards.set(s3.standardId, s3);

    // Curriculum Gap (Standard exists without corresponding textbook concept)
    const sGap: CurriculumStandard = {
      standardId: 'NCERT-EVS-5-GAP-09',
      board: 'NCERT',
      gradeLevel: 'Grade 5',
      subject: 'Environmental Studies',
      competencyCode: 'EVS.5.9.1',
      learningObjective: 'Explore deep oceanic hydrothermal vent ecosystems.',
      mappedConceptId: undefined,
      isCoveredInBook: false,
    };
    this.standards.set(sGap.standardId, sGap);
  }

  // 5.3 to 5.10 — Generate Class Curriculum Coverage, Gaps, and Provenance Trace
  public generateClassCurriculumReport(
    context: TenantContext,
    sectionId: string,
    bookId: string = 'evs-class-5'
  ): ClassCurriculumReport {
    const section = this.securityService.validateSectionAccess(context, sectionId);

    const evidencePack = this.evidencePackService.buildChapterEvidencePack(
      bookId,
      1,
      'I am Growing Up',
      3,
      7,
      'Living things grow',
      ['Living Things', 'Growth Continuum']
    );

    const enrolledStudents = section.enrolledStudentIds;
    const conceptBreakdown: ClassCurriculumReport['conceptBreakdown'] = [];
    const detectedGaps: SyllabusGapItem[] = [];

    let totalMasterySum = 0;
    let taughtCount = 0;
    let masteredCount = 0;

    const conceptsToEvaluate = [
      { id: 'C0101', name: 'Living Things', page: 3, bbox: { x: 262, y: 572, width: 400, height: 39 } },
      { id: 'C0102', name: 'Growth Continuum', page: 4, bbox: { x: 150, y: 300, width: 420, height: 45 } },
      { id: 'C0201', name: 'Skeletal Support', page: 8, bbox: { x: 200, y: 450, width: 380, height: 40 } },
    ];

    for (const c of conceptsToEvaluate) {
      const isTaught = this.taughtConcepts.has(c.id);
      if (isTaught) taughtCount++;

      // Compute class average mastery from student profiles
      let cMasterySum = 0;
      for (const sId of enrolledStudents) {
        const prof = this.profileService.getOrCreateProfile(sId);
        cMasterySum += prof.conceptMasteryMap[c.id] || 0.10;
      }
      const avgMastery = enrolledStudents.length > 0 ? Number((cMasterySum / enrolledStudents.length).toFixed(3)) : 0.10;
      totalMasterySum += avgMastery;

      let status: 'MASTERED' | 'DEVELOPING' | 'NEEDS_HELP' | 'NOT_TAUGHT' = 'NOT_TAUGHT';
      if (!isTaught) {
        status = 'NOT_TAUGHT';
        detectedGaps.push({
          gapType: 'TEACHING_GAP',
          conceptId: c.id,
          conceptName: c.name,
          description: `Concept ${c.name} (${c.id}) is in the textbook but has not been taught in class.`,
          recommendation: 'Schedule a classroom lesson for Chapter ' + (c.id === 'C0201' ? '2' : '1'),
        });
      } else if (avgMastery >= 0.85) {
        status = 'MASTERED';
        masteredCount++;
      } else if (avgMastery >= 0.50) {
        status = 'DEVELOPING';
      } else {
        status = 'NEEDS_HELP';
        detectedGaps.push({
          gapType: 'MASTERY_GAP',
          conceptId: c.id,
          conceptName: c.name,
          description: `Concept ${c.name} was taught but class mastery is low (${(avgMastery * 100).toFixed(1)}%).`,
          recommendation: 'Run targeted Socratic micro-remediation on Page ' + c.page,
        });
      }

      // Map matching standards
      const mappedStds = Array.from(this.standards.values())
        .filter((s) => s.mappedConceptId === c.id)
        .map((s) => s.standardId);

      conceptBreakdown.push({
        conceptId: c.id,
        conceptName: c.name,
        mappedStandards: mappedStds,
        isTaught,
        classAverageMastery: avgMastery,
        status,
        physicalPage: c.page,
        bbox: c.bbox,
      });
    }

    // Check Curriculum Gap
    for (const std of this.standards.values()) {
      if (!std.isCoveredInBook) {
        detectedGaps.push({
          gapType: 'CURRICULUM_GAP',
          standardId: std.standardId,
          description: `Standard ${std.standardId} (${std.learningObjective}) has no textbook-grounded concept in ${bookId}.`,
          recommendation: 'Add supplementary regional curriculum materials',
        });
      }
    }

    const totalStandards = this.standards.size;
    const coveredStandardsCount = Array.from(this.standards.values()).filter((s) => s.isCoveredInBook).length;
    const coveragePercentage = Number(((coveredStandardsCount / totalStandards) * 100).toFixed(1));
    const taughtPercentage = Number(((taughtCount / conceptsToEvaluate.length) * 100).toFixed(1));
    const masteredPercentage = Number(((masteredCount / conceptsToEvaluate.length) * 100).toFixed(1));

    const expectedCalendarProgress = 75.0; // Expected by September
    const actualProgress = taughtPercentage;
    const progressGap = Number((expectedCalendarProgress - actualProgress).toFixed(1));

    return {
      districtId: context.districtId,
      schoolId: context.schoolId,
      sectionId,
      gradeLevel: section.gradeLevel,
      subject: 'Environmental Studies',
      totalStandardsCount: totalStandards,
      coveragePercentage,
      taughtPercentage,
      masteredPercentage,
      expectedCalendarProgress,
      actualProgress,
      progressGap,
      conceptBreakdown,
      detectedGaps,
      generatedAt: new Date().toISOString(),
    };
  }

  // Record that a concept was taught
  public markConceptTaught(conceptId: string): void {
    this.taughtConcepts.add(conceptId);
  }
}
