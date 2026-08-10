import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service';
import { PrismaService } from './prisma.service';
import { DocumentStatus } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DocumentService', () => {
  let service: DocumentService;
  let prisma: any;

  const mockMaterial = { id: 'mat-123', title: 'Physics Book' };
  const mockDocument = {
    id: 'doc-123',
    materialId: 'mat-123',
    title: 'Physics Book',
    status: DocumentStatus.PENDING,
    pageCount: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
    material: mockMaterial,
  };

  beforeEach(async () => {
    prisma = {
      learningMaterial: {
        findUnique: jest.fn().mockResolvedValue(mockMaterial),
      },
      document: {
        create: jest.fn().mockResolvedValue(mockDocument),
        findMany: jest.fn().mockResolvedValue([mockDocument]),
        findUnique: jest.fn().mockResolvedValue(mockDocument),
        update: jest.fn().mockResolvedValue({ ...mockDocument, pageCount: 20 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createForMaterial', () => {
    it('should create document for material', async () => {
      const res = await service.createForMaterial('mat-123', { pageCount: 15 });
      expect(res.data.id).toBe('doc-123');
      expect(prisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          materialId: 'mat-123',
          status: DocumentStatus.PENDING,
        }),
      });
    });

    it('should throw NotFoundException if material does not exist', async () => {
      prisma.learningMaterial.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.createForMaterial('non-existent', { pageCount: 10 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if pageCount is negative', async () => {
      await expect(
        service.createForMaterial('mat-123', { pageCount: -5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllForMaterial', () => {
    it('should return documents for material', async () => {
      const res = await service.findAllForMaterial('mat-123');
      expect(res.data).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update document properties', async () => {
      const res = await service.update('doc-123', { pageCount: 20 });
      expect(res.data.pageCount).toBe(20);
    });
  });
});
