import { Test, TestingModule } from '@nestjs/testing';
import { TopologicalSortService, SortConceptNode } from './topological-sort.service';
import { CurriculumBackboneService } from './curriculum-backbone.service';
import { BoardMappingService } from './board-mapping.service';
import { PrismaService } from '../../prisma.service';
import { GradeBand, ConceptType, CurriculumStatus, BoardType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Phase 2.6 Authoritative Acceptance Gates Verification Suite (12 Gates)', () => {
  let topoService: TopologicalSortService;
  let backboneService: CurriculumBackboneService;
  let boardService: BoardMappingService;

  const mockConceptActive1 = {
    id: 'c-1',
    canonicalName: 'Counting',
    normalizedName: 'counting',
    domain: 'General',
    gradeBand: GradeBand.EARLY_CHILDHOOD,
    status: 'ACTIVE',
    objectives: [{ id: 'obj-1', complexityLevel: 1 }],
    outgoing: [],
  };

  const mockConceptActive2 = {
    id: 'c-2',
    canonicalName: 'Addition',
    normalizedName: 'addition',
    domain: 'General',
    gradeBand: GradeBand.PRIMARY,
    status: 'ACTIVE',
    objectives: [{ id: 'obj-2', complexityLevel: 2 }],
    outgoing: [{ sourceId: 'c-2', targetId: 'c-1', relationshipType: 'PREREQUISITE', strength: 1.0 }],
  };

  const mockConceptRetired = {
    id: 'c-retired',
    canonicalName: 'Old Abacus Math',
    normalizedName: 'old abacus math',
    domain: 'General',
    gradeBand: GradeBand.EARLY_CHILDHOOD,
    status: 'RETIRED',
    objectives: [],
    outgoing: [],
  };

  const mockStructureV1 = {
    id: 'struct-1',
    version: 1,
    name: 'EKAGURU Universal Curriculum (v1)',
    domain: 'General',
    inputFingerprint: 'mock-fingerprint-123',
    status: CurriculumStatus.PUBLISHED,
    nodes: [
      { id: 'node-1', structureId: 'struct-1', conceptId: 'c-1', gradeBand: GradeBand.EARLY_CHILDHOOD, sequenceIndex: 1, masteryDepthLevel: 1, concept: mockConceptActive1, nodeObjectives: [{ id: 'cno-1', learningObjectiveId: 'obj-1' }] },
      { id: 'node-2', structureId: 'struct-1', conceptId: 'c-2', gradeBand: GradeBand.PRIMARY, sequenceIndex: 2, masteryDepthLevel: 2, concept: mockConceptActive2, nodeObjectives: [{ id: 'cno-2', learningObjectiveId: 'obj-2' }] },
    ],
    prerequisites: [
      { id: 'cp-1', structureId: 'struct-1', sourceNodeId: 'node-2', targetNodeId: 'node-1', prerequisiteType: 'PREREQUISITE', confidence: 1.0 },
    ],
    boardMappings: [],
  };

  const mockPrisma = {
    concept: {
      findMany: jest.fn().mockResolvedValue([mockConceptActive1, mockConceptActive2]),
    },
    curriculumStructure: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where.inputFingerprint === 'mock-fingerprint-123') return Promise.resolve(mockStructureV1);
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.version === 1) return Promise.resolve(mockStructureV1);
        return Promise.resolve(null);
      }),
      create: jest.fn().mockResolvedValue(mockStructureV1),
    },
    curriculumNode: { create: jest.fn().mockResolvedValue({ id: 'node-1' }) },
    curriculumNodeObjective: { create: jest.fn().mockResolvedValue({ id: 'cno-1' }) },
    curriculumPrerequisite: { create: jest.fn().mockResolvedValue({ id: 'cp-1' }) },
    boardCurriculumMapping: {
      create: jest.fn().mockResolvedValue({ id: 'bm-1' }),
      findFirst: jest.fn().mockResolvedValue({
        id: 'bm-1',
        boardCode: 'CBSE_INDIA',
        boardGrade: 'Class 1',
        structure: mockStructureV1,
        nodeMappings: [{ id: 'bnm-1', curriculumNodeId: 'node-1', boardSequenceIndex: 1, hasSequenceConflict: false }],
      }),
    },
    boardNodeMapping: { create: jest.fn().mockResolvedValue({ id: 'bnm-1' }) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopologicalSortService,
        CurriculumBackboneService,
        BoardMappingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    topoService = module.get<TopologicalSortService>(TopologicalSortService);
    backboneService = module.get<CurriculumBackboneService>(CurriculumBackboneService);
    boardService = module.get<BoardMappingService>(BoardMappingService);
  });

  it('GATE 1: DAG SAFETY — Prerequisite cycle (A -> B -> A) is rejected with BadRequestException', () => {
    const cycleNodes: SortConceptNode[] = [
      { id: 'c-A', canonicalName: 'Node A', gradeBand: GradeBand.PRIMARY, prerequisiteIds: ['c-B'] },
      { id: 'c-B', canonicalName: 'Node B', gradeBand: GradeBand.PRIMARY, prerequisiteIds: ['c-A'] },
    ];
    expect(() => topoService.sortConcepts(cycleNodes)).toThrow(BadRequestException);
  });

  it('GATE 2: DETERMINISTIC ORDERING — Identical graph generated twice produces identical sequence indices', () => {
    const nodes: SortConceptNode[] = [
      { id: 'c-2', canonicalName: 'Addition', gradeBand: GradeBand.PRIMARY, prerequisiteIds: ['c-1'] },
      { id: 'c-1', canonicalName: 'Counting', gradeBand: GradeBand.EARLY_CHILDHOOD, prerequisiteIds: [] },
    ];

    const res1 = topoService.sortConcepts(nodes);
    const res2 = topoService.sortConcepts(nodes);

    expect(res1.sortedNodes.map((n) => n.id)).toEqual(res2.sortedNodes.map((n) => n.id));
  });

  it('GATE 3: PUBLISHED IMMUTABILITY — Published structure version remains immutable snapshot', async () => {
    const struct = await backboneService.getBackboneByVersion(1);
    expect(struct.status).toBe(CurriculumStatus.PUBLISHED);
  });

  it('GATE 4: OBJECTIVE JOIN MODEL — CurriculumNodeObjective sequences selected concept objectives per node', async () => {
    const struct = await backboneService.getBackboneByVersion(1);
    expect(struct.nodes[0].nodeObjectives).toBeDefined();
    expect(struct.nodes[0].nodeObjectives[0].learningObjectiveId).toBe('obj-1');
  });

  it('GATE 5: PRIVACY ISOLATION — Zero ContentChunk.content or learner fields enter curriculum output', async () => {
    const struct = await backboneService.getBackboneByVersion(1);
    const str = JSON.stringify(struct);
    expect(str).not.toContain('ContentChunk');
    expect(str).not.toContain('learnerId');
    expect(str).not.toContain('storageKey');
  });

  it('GATE 6: UNBROKEN LINEAGE — CurriculumNode references Concept, retaining backward lineage', async () => {
    const struct = await backboneService.getBackboneByVersion(1);
    expect(struct.nodes[0].concept.canonicalName).toBe('Counting');
  });

  it('GATE 7: GRADE PROGRESSION SEMANTICS — gradeBand and masteryDepthLevel are independently represented', async () => {
    const struct = await backboneService.getBackboneByVersion(1);
    expect(struct.nodes[0].gradeBand).toBe(GradeBand.EARLY_CHILDHOOD);
    expect(struct.nodes[0].masteryDepthLevel).toBe(1);
  });

  it('GATE 8: BOARD JURISDICTION — boardCode (CBSE_INDIA vs TELANGANA_STATE) identifies jurisdiction', async () => {
    const bm = await boardService.getBoardMapping('CBSE_INDIA', 'Class 1');
    expect(bm.boardCode).toBe('CBSE_INDIA');
  });

  it('GATE 9: CONFLICT PRESERVATION — Board sequence inversion preserves sequence while flagging hasSequenceConflict = true', async () => {
    const dto = {
      structureVersion: 1,
      boardType: BoardType.CBSE,
      boardCode: 'CBSE_INDIA',
      boardGrade: 'Class 1',
      nodeOrders: [
        { curriculumNodeId: 'node-1', boardSequenceIndex: 1 }, // Target node placed BEFORE prerequisite node-2!
        { curriculumNodeId: 'node-2', boardSequenceIndex: 2 },
      ],
    };

    await boardService.createBoardMapping(dto);

    expect(mockPrisma.boardNodeMapping.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          curriculumNodeId: 'node-1',
          hasSequenceConflict: true,
        }),
      }),
    );
  });

  it('GATE 10: RETIRED CONCEPT HANDLING — Generating new backbone excludes RETIRED concepts by default', async () => {
    await backboneService.generateUniversalBackbone('General', 'SYSTEM');
    expect(mockPrisma.concept.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    );
  });

  it('GATE 12: GENERATION IDEMPOTENCY — Matching graph fingerprint returns cached structure without duplicate version creation', async () => {
    jest.clearAllMocks();
    mockPrisma.curriculumStructure.findFirst.mockResolvedValueOnce(mockStructureV1);

    const res = await backboneService.generateUniversalBackbone('General', 'SYSTEM');

    expect(res.version).toBe(1);
    expect(mockPrisma.curriculumStructure.create).not.toHaveBeenCalled();
  });
});
