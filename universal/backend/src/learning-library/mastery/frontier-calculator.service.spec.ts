import { Test, TestingModule } from '@nestjs/testing';
import { FrontierCalculatorService } from './frontier-calculator.service';
import { PrismaService } from '../prisma.service';

describe('FrontierCalculatorService', () => {
  let service: FrontierCalculatorService;
  let mockPrisma: any;

  const mockStructure = {
    id: 'struct-1',
    version: 1,
    domain: 'General',
    nodes: [
      {
        id: 'node-1',
        conceptId: 'concept-1',
        sequenceIndex: 1,
        gradeBand: 'GRADE_3',
        concept: { id: 'concept-1', canonicalName: 'Concept One', gradeBand: 'GRADE_3' },
        nodeObjectives: [
          {
            learningObjectiveId: 'obj-1a',
            sequenceIndex: 1,
            learningObjective: { id: 'obj-1a', code: 'OBJ1A', complexityLevel: 1, bloomTaxonomy: 'REMEMBER' },
          },
          {
            learningObjectiveId: 'obj-1b',
            sequenceIndex: 2,
            learningObjective: { id: 'obj-1b', code: 'OBJ1B', complexityLevel: 2, bloomTaxonomy: 'UNDERSTAND' },
          },
        ],
      },
      {
        id: 'node-2',
        conceptId: 'concept-2',
        sequenceIndex: 2,
        gradeBand: 'GRADE_3',
        concept: { id: 'concept-2', canonicalName: 'Concept Two', gradeBand: 'GRADE_3' },
        nodeObjectives: [
          {
            learningObjectiveId: 'obj-2a',
            sequenceIndex: 1,
            learningObjective: { id: 'obj-2a', code: 'OBJ2A', complexityLevel: 1, bloomTaxonomy: 'REMEMBER' },
          },
        ],
      },
      {
        id: 'node-3',
        conceptId: 'concept-3',
        sequenceIndex: 3,
        gradeBand: 'GRADE_3',
        concept: { id: 'concept-3', canonicalName: 'Concept Three', gradeBand: 'GRADE_3' },
        nodeObjectives: [
          {
            learningObjectiveId: 'obj-3a',
            sequenceIndex: 1,
            learningObjective: { id: 'obj-3a', code: 'OBJ3A', complexityLevel: 1, bloomTaxonomy: 'REMEMBER' },
          },
        ],
      },
    ],
    prerequisites: [
      { id: 'p-1', sourceNodeId: 'node-1', targetNodeId: 'node-2' },
      { id: 'p-2', sourceNodeId: 'node-2', targetNodeId: 'node-3' },
    ],
  };

  beforeEach(async () => {
    mockPrisma = {
      curriculumStructure: {
        findUnique: jest.fn().mockResolvedValue(mockStructure),
      },
      learnerConceptMastery: {
        findMany: jest.fn(),
      },
      learnerObjectiveMastery: {
        findMany: jest.fn(),
      },
      learnerCurriculumFrontier: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrontierCalculatorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FrontierCalculatorService>(FrontierCalculatorService);
  });

  it('Scenario A: prerequisite not mastered => target node is excluded', async () => {
    // concept-1 (prereq of node-2) is not mastered (score = 0.5 < 0.75)
    mockPrisma.learnerConceptMastery.findMany.mockResolvedValue([
      { conceptId: 'concept-1', masteryScore: 0.5 },
    ]);
    mockPrisma.learnerObjectiveMastery.findMany.mockResolvedValue([]);

    const result = await service.calculateFrontier('learner-123', 1);

    const nodeIds = result.frontierNodes.map((n: any) => n.id);
    expect(nodeIds).toContain('node-1');
    expect(nodeIds).not.toContain('node-2');
  });

  it('Scenario B: transitive prerequisite not mastered => node is excluded', async () => {
    // concept-1 is mastered, but concept-2 is not mastered. Therefore concept-3 is excluded.
    mockPrisma.learnerConceptMastery.findMany.mockResolvedValue([
      { conceptId: 'concept-1', masteryScore: 0.8 },
      { conceptId: 'concept-2', masteryScore: 0.4 },
    ]);
    mockPrisma.learnerObjectiveMastery.findMany.mockResolvedValue([
      { learningObjectiveId: 'obj-1a', masteryScore: 0.8 },
      { learningObjectiveId: 'obj-1b', masteryScore: 0.8 },
    ]);

    const result = await service.calculateFrontier('learner-123', 1);

    const nodeIds = result.frontierNodes.map((n: any) => n.id);
    expect(nodeIds).toContain('node-2');
    expect(nodeIds).not.toContain('node-3');
  });

  it('Scenario C: prerequisite mastered and objective readiness satisfied => node is included', async () => {
    // concept-1 is mastered, prerequisites of node-2 are satisfied.
    // obj-2a is unmastered, so node-2 has ready and unmastered objectives.
    mockPrisma.learnerConceptMastery.findMany.mockResolvedValue([
      { conceptId: 'concept-1', masteryScore: 0.8 },
      { conceptId: 'concept-2', masteryScore: 0.0 },
    ]);
    mockPrisma.learnerObjectiveMastery.findMany.mockResolvedValue([
      { learningObjectiveId: 'obj-1a', masteryScore: 0.8 },
      { learningObjectiveId: 'obj-1b', masteryScore: 0.8 },
      { learningObjectiveId: 'obj-2a', masteryScore: 0.0 },
    ]);

    const result = await service.calculateFrontier('learner-123', 1);

    const nodeIds = result.frontierNodes.map((n: any) => n.id);
    expect(nodeIds).toContain('node-2');
  });

  it('Scenario D: objective condition not satisfied => node excluded', async () => {
    // node-1 is unmastered.
    // obj-1a is unmastered (0.0). obj-1b is unmastered (0.0).
    // obj-1a is ready because it is the first objective.
    // But obj-1b is NOT ready because obj-1a is not mastered.
    // However, since obj-1a (ready) is unmastered, the node is still included.
    // NOW: if obj-1a is mastered (0.8) and obj-1b is ALSO mastered (0.8), then
    // there are no unmastered objectives. The node is excluded.
    mockPrisma.learnerConceptMastery.findMany.mockResolvedValue([
      { conceptId: 'concept-1', masteryScore: 0.6 },
    ]);
    mockPrisma.learnerObjectiveMastery.findMany.mockResolvedValue([
      { learningObjectiveId: 'obj-1a', masteryScore: 0.8 },
      { learningObjectiveId: 'obj-1b', masteryScore: 0.8 },
    ]);

    const result = await service.calculateFrontier('learner-123', 1);

    const nodeIds = result.frontierNodes.map((n: any) => n.id);
    expect(nodeIds).not.toContain('node-1');
  });

  it('Scenario E: already concept-mastered node => node excluded', async () => {
    // concept-1 score is 0.8 >= 0.75, so node-1 is excluded.
    mockPrisma.learnerConceptMastery.findMany.mockResolvedValue([
      { conceptId: 'concept-1', masteryScore: 0.8 },
    ]);
    mockPrisma.learnerObjectiveMastery.findMany.mockResolvedValue([]);

    const result = await service.calculateFrontier('learner-123', 1);

    const nodeIds = result.frontierNodes.map((n: any) => n.id);
    expect(nodeIds).not.toContain('node-1');
  });

  it('Scenario F: stale cached frontier records are removed', async () => {
    mockPrisma.learnerConceptMastery.findMany.mockResolvedValue([
      { conceptId: 'concept-1', masteryScore: 0.5 },
    ]);
    mockPrisma.learnerObjectiveMastery.findMany.mockResolvedValue([]);

    await service.calculateFrontier('learner-123', 1);

    expect(mockPrisma.learnerCurriculumFrontier.deleteMany).toHaveBeenCalledWith({
      where: {
        learnerId: 'learner-123',
        structureId: 'struct-1',
        currentNodeId: { notIn: ['node-1'] },
      },
    });
  });
});
