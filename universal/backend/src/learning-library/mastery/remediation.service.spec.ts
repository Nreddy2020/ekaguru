import { Test, TestingModule } from '@nestjs/testing';
import { RemediationService } from './remediation.service';
import { PrismaService } from '../prisma.service';
import { TopologicalSortService } from '../knowledge/curriculum/topological-sort.service';

describe('RemediationService', () => {
  let service: RemediationService;
  let mockPrisma: any;

  const buildStructure = () => ({
    id: 's1',
    version: 1,
    status: 'PUBLISHED',
    nodes: [
      { id: 'n1', conceptId: 'c1', sequenceIndex: 0, gradeBand: 'GRADE_1_2', concept: { id: 'c1', canonicalName: 'Counting' } },
      { id: 'n2', conceptId: 'c2', sequenceIndex: 1, gradeBand: 'GRADE_1_2', concept: { id: 'c2', canonicalName: 'Addition' } },
      { id: 'n3', conceptId: 'c3', sequenceIndex: 2, gradeBand: 'GRADE_3_5', concept: { id: 'c3', canonicalName: 'Multiplication' } },
    ],
    prerequisites: [
      { id: 'p1', sourceNodeId: 'n1', targetNodeId: 'n2', order: 1 },
      { id: 'p2', sourceNodeId: 'n2', targetNodeId: 'n3', order: 1 },
    ],
  });

  beforeEach(async () => {
    mockPrisma = {
      curriculumStructure: {
        findUnique: jest.fn().mockResolvedValue(buildStructure()),
      },
      learnerConceptMastery: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemediationService,
        TopologicalSortService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RemediationService>(RemediationService);
  });

  // Gate 12: Backward DFS finds all unmastered prerequisites
  it('[Gate-12] Backward DFS finds all unmastered prerequisites for target node', async () => {
    const result = await service.calculateRemediationPath('l1', 1, 'n3');

    expect(result.remediationSequence.length).toBeGreaterThan(0);
    const nodeIds = result.remediationSequence.map((r: any) => r.nodeId);
    expect(nodeIds).toContain('n1'); // transitive prereq
    expect(nodeIds).toContain('n2'); // direct prereq
    expect(nodeIds).toContain('n3'); // target itself (also unmastered)
  });

  // Gate 13: Deterministic ordering - n1 before n2 before n3
  it('[Gate-13] Remediation sequence follows deterministic topological order (prereq before dependent)', async () => {
    const result = await service.calculateRemediationPath('l1', 1, 'n3');

    const seq = result.remediationSequence;
    const n1Idx = seq.findIndex((r: any) => r.nodeId === 'n1');
    const n2Idx = seq.findIndex((r: any) => r.nodeId === 'n2');
    const n3Idx = seq.findIndex((r: any) => r.nodeId === 'n3');

    expect(n1Idx).toBeLessThan(n2Idx);
    expect(n2Idx).toBeLessThan(n3Idx);
  });

  // Gate 14: Already-mastered nodes excluded from remediation
  it('[Gate-14] Already-mastered prereqs are excluded from remediation sequence', async () => {
    mockPrisma.learnerConceptMastery.findMany = jest.fn().mockResolvedValue([
      { conceptId: 'c1', masteryScore: 0.9 }, // Counting is mastered
      { conceptId: 'c2', masteryScore: 0.8 }, // Addition is mastered
    ]);

    const result = await service.calculateRemediationPath('l1', 1, 'n3');

    const nodeIds = result.remediationSequence.map((r: any) => r.nodeId);
    expect(nodeIds).not.toContain('n1');
    expect(nodeIds).not.toContain('n2');
    // Only n3 itself (unmastered target) should be included
    expect(nodeIds).toContain('n3');
  });

  // Gate 15: No remediation needed if target itself is also mastered
  it('[Gate-15] Empty remediation sequence if target node concept is mastered (score >= 0.5)', async () => {
    mockPrisma.learnerConceptMastery.findMany = jest.fn().mockResolvedValue([
      { conceptId: 'c1', masteryScore: 0.9 },
      { conceptId: 'c2', masteryScore: 0.8 },
      { conceptId: 'c3', masteryScore: 0.76 }, // target is also mastered
    ]);

    const result = await service.calculateRemediationPath('l1', 1, 'n3');
    expect(result.remediationSequence).toHaveLength(0);
  });
});
