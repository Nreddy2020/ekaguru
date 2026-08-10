import { Test, TestingModule } from '@nestjs/testing';
import { ConceptGraphService } from './concept-graph.service';
import { PrismaService } from '../prisma.service';
import { ConceptRelationshipType, GradeBand, ConceptType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('ConceptGraphService DAG Cycle Prevention Tests', () => {
  let service: ConceptGraphService;
  let prisma: any;

  const conceptA = { id: 'c-A', canonicalName: 'Counting', normalizedName: 'counting', domain: 'Mathematics', gradeBand: GradeBand.PRIMARY };
  const conceptB = { id: 'c-B', canonicalName: 'Addition', normalizedName: 'addition', domain: 'Mathematics', gradeBand: GradeBand.PRIMARY };
  const conceptC = { id: 'c-C', canonicalName: 'Multiplication', normalizedName: 'multiplication', domain: 'Mathematics', gradeBand: GradeBand.PRIMARY };

  beforeEach(async () => {
    prisma = {
      concept: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'c-A') return Promise.resolve(conceptA);
          if (where.id === 'c-B') return Promise.resolve(conceptB);
          if (where.id === 'c-C') return Promise.resolve(conceptC);
          return Promise.resolve(null);
        }),
      },
      conceptRelationship: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          // Mock existing relationship: B -> C (Addition is prerequisite for Multiplication)
          if (where.sourceId === 'c-B' && where.relationshipType === ConceptRelationshipType.PREREQUISITE) {
            return Promise.resolve([{ sourceId: 'c-B', targetId: 'c-C', relationshipType: ConceptRelationshipType.PREREQUISITE }]);
          }
          return Promise.resolve([]);
        }),
        upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'rel-1', ...create })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConceptGraphService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ConceptGraphService>(ConceptGraphService);
  });

  it('1. VALID EDGE: should allow valid directed prerequisite relationship (A -> B)', async () => {
    const res = await service.addRelationship({
      sourceId: 'c-A',
      targetId: 'c-B',
      relationshipType: ConceptRelationshipType.PREREQUISITE,
    });

    expect(res.sourceId).toBe('c-A');
    expect(res.targetId).toBe('c-B');
  });

  it('2. SELF-LOOP PREVENTED: should throw BadRequestException if source and target are identical', async () => {
    await expect(
      service.addRelationship({
        sourceId: 'c-A',
        targetId: 'c-A',
        relationshipType: ConceptRelationshipType.PREREQUISITE,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('3. DAG CYCLE PREVENTED: should throw BadRequestException if relationship creates a cycle (C -> B when B -> C exists)', async () => {
    await expect(
      service.addRelationship({
        sourceId: 'c-C',
        targetId: 'c-B',
        relationshipType: ConceptRelationshipType.PREREQUISITE,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
