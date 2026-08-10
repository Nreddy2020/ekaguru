import { Test, TestingModule } from '@nestjs/testing';
import { LearnerService } from './learner.service';
import { PrismaService } from './prisma.service';
import { LearnerType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LearnerService', () => {
  let service: LearnerService;
  let prisma: any;

  const mockLearner = {
    id: 'learner-123',
    name: 'Test Student',
    learnerType: LearnerType.STUDENT,
    preferredLanguage: 'en',
    dateOfBirth: new Date('2015-05-15'),
    legacyChildId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      learner: {
        create: jest.fn().mockResolvedValue(mockLearner),
        findMany: jest.fn().mockResolvedValue([mockLearner]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockResolvedValue(mockLearner),
        update: jest.fn().mockResolvedValue({ ...mockLearner, name: 'Updated Name' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearnerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<LearnerService>(LearnerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a learner', async () => {
      const res = await service.create({
        name: 'Test Student',
        learnerType: LearnerType.STUDENT,
      });

      expect(res).toEqual({ data: mockLearner });
      expect(prisma.learner.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Student',
          learnerType: LearnerType.STUDENT,
        }),
      });
    });

    it('should throw BadRequestException if name is missing or empty', async () => {
      await expect(
        service.create({ name: '  ', learnerType: LearnerType.STUDENT }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid learnerType', async () => {
      await expect(
        service.create({ name: 'John', learnerType: 'INVALID_TYPE' as any }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated learners', async () => {
      const res = await service.findAll({ page: 1, pageSize: 10 });
      expect(res.data).toHaveLength(1);
      expect(res.meta).toEqual({
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should scope findAll for PARENT user', async () => {
      prisma.learner.findMany.mockResolvedValueOnce([{ id: 'learner-123' }]);
      prisma.learner.findMany.mockResolvedValueOnce([mockLearner]);
      const parentUser = { userId: 'parent-1', role: 'PARENT' };
      const res = await service.findAll({ page: 1, pageSize: 10 }, parentUser);
      expect(res.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return single learner', async () => {
      const res = await service.findOne('learner-123');
      expect(res.data).toEqual(mockLearner);
    });

    it('should throw NotFoundException if learner does not exist', async () => {
      prisma.learner.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update existing learner', async () => {
      const res = await service.update('learner-123', { name: 'Updated Name' });
      expect(res.data.name).toBe('Updated Name');
    });
  });
});
