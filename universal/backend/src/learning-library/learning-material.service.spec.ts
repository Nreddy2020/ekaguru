import { Test, TestingModule } from '@nestjs/testing';
import { LearningMaterialService } from './learning-material.service';
import { PrismaService } from './prisma.service';
import { MaterialType, MaterialStatus, ProcessingStatus, LearnerType } from '@prisma/client';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('LearningMaterialService', () => {
  let service: LearningMaterialService;
  let prisma: any;

  const mockLearner = {
    id: 'learner-123',
    name: 'Test Student',
    learnerType: LearnerType.STUDENT,
  };

  const mockMaterial = {
    id: 'mat-123',
    learnerId: 'learner-123',
    title: 'Physics 101',
    description: 'Intro to Physics',
    materialType: MaterialType.TEXTBOOK,
    status: MaterialStatus.DRAFT,
    processingStatus: ProcessingStatus.UPLOADED,
    subjectName: 'Physics',
    gradeLevel: '10th',
    language: 'en',
    originalFileName: 'physics.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: BigInt(1024),
    storageKey: 'key-123',
    failureReason: null,
    processingVersion: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    learner: mockLearner,
    documents: [],
  };

  beforeEach(async () => {
    prisma = {
      learner: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'learner-123') return Promise.resolve(mockLearner);
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockResolvedValue([{ id: 'learner-123' }]),
      },
      learningMaterial: {
        create: jest.fn().mockResolvedValue(mockMaterial),
        findMany: jest.fn().mockResolvedValue([mockMaterial]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'mat-123') return Promise.resolve(mockMaterial);
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue({ ...mockMaterial, status: MaterialStatus.DELETED }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningMaterialService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<LearningMaterialService>(LearningMaterialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create learning material', async () => {
      const res = await service.create({
        learnerId: 'learner-123',
        title: 'Physics 101',
        materialType: MaterialType.TEXTBOOK,
      });

      expect(res.data.id).toBe('mat-123');
      expect(res.data.progress).toBe(5); // UPLOADED stage progress
    });

    it('should throw NotFoundException if learner does not exist', async () => {
      await expect(
        service.create({
          learnerId: 'non-existent',
          title: 'Physics 101',
          materialType: MaterialType.TEXTBOOK,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if fileSizeBytes is negative', async () => {
      await expect(
        service.create({
          learnerId: 'learner-123',
          title: 'Physics',
          materialType: MaterialType.TEXTBOOK,
          fileSizeBytes: -100,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated materials with calculated progress', async () => {
      const res = await service.findAll({ page: 1, pageSize: 10 });
      expect(res.data).toHaveLength(1);
      expect(res.data[0].progress).toBe(5); // UPLOADED stage progress is 5
      expect(res.meta.total).toBe(1);
    });

    it('should throw ForbiddenException if user requests unauthorized learnerId', async () => {
      prisma.learner.findMany.mockResolvedValueOnce([{ id: 'learner-authorized' }]);
      const parentUser = { userId: 'parent-1', role: 'PARENT' };
      await expect(
        service.findAll({ learnerId: 'unauthorized-learner' }, parentUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should scope query for non-admin user when learnerId is omitted', async () => {
      prisma.learner.findMany.mockResolvedValueOnce([{ id: 'learner-123' }]);
      prisma.learningMaterial.findMany.mockResolvedValueOnce([mockMaterial]);
      const parentUser = { userId: 'parent-1', role: 'PARENT' };
      const res = await service.findAll({}, parentUser);
      expect(res.data).toHaveLength(1);
    });
  });

  describe('softDelete', () => {
    it('should logically delete material by setting status to DELETED', async () => {
      const res = await service.softDelete('mat-123', 'delete');
      expect(res.data.status).toBe(MaterialStatus.DELETED);
      expect(prisma.learningMaterial.update).toHaveBeenCalledWith({
        where: { id: 'mat-123' },
        data: { status: MaterialStatus.DELETED },
      });
    });

    it('should archive material if action is archive', async () => {
      prisma.learningMaterial.update.mockResolvedValueOnce({
        ...mockMaterial,
        status: MaterialStatus.ARCHIVED,
      });
      const res = await service.softDelete('mat-123', 'archive');
      expect(res.data.status).toBe(MaterialStatus.ARCHIVED);
    });
  });

  describe('getProcessingStatus', () => {
    it('should return processing status with stage progress', async () => {
      const res = await service.getProcessingStatus('mat-123');
      expect(res.data).toEqual(
        expect.objectContaining({
          id: 'mat-123',
          processingStatus: ProcessingStatus.UPLOADED,
          progress: 5,
        }),
      );
    });
  });
});
