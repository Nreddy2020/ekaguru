import { Test, TestingModule } from '@nestjs/testing';
import { TopologicalSortService, SortConceptNode } from './topological-sort.service';
import { GradeBand } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('TopologicalSortService Deterministic Sorting Tests', () => {
  let service: TopologicalSortService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TopologicalSortService],
    }).compile();

    service = module.get<TopologicalSortService>(TopologicalSortService);
  });

  it('1. DETERMINISTIC SORTING: should sort concepts using 4-tier tie-breaker', () => {
    const nodes: SortConceptNode[] = [
      { id: 'c-3', canonicalName: 'Addition', gradeBand: GradeBand.PRIMARY, prerequisiteIds: ['c-1'] },
      { id: 'c-1', canonicalName: 'Counting', gradeBand: GradeBand.EARLY_CHILDHOOD, prerequisiteIds: [] },
      { id: 'c-2', canonicalName: 'Number Sense', gradeBand: GradeBand.PRIMARY, prerequisiteIds: ['c-1'] },
    ];

    const result = service.sortConcepts(nodes);

    expect(result.sortedNodes[0].id).toBe('c-1'); // Counting (depth 0, EARLY_CHILDHOOD)
    expect(result.sortedNodes[1].id).toBe('c-3'); // Addition (depth 1, PRIMARY, Name 'Addition' < 'Number Sense')
    expect(result.sortedNodes[2].id).toBe('c-2'); // Number Sense (depth 1, PRIMARY)
  });

  it('2. DAG CYCLE REJECTION: should throw BadRequestException if prerequisite cycle exists', () => {
    const cycleNodes: SortConceptNode[] = [
      { id: 'c-A', canonicalName: 'Node A', gradeBand: GradeBand.PRIMARY, prerequisiteIds: ['c-B'] },
      { id: 'c-B', canonicalName: 'Node B', gradeBand: GradeBand.PRIMARY, prerequisiteIds: ['c-A'] },
    ];

    expect(() => service.sortConcepts(cycleNodes)).toThrow(BadRequestException);
  });
});
