import { Test, TestingModule } from '@nestjs/testing';
import { ObserveController } from './observe.controller';
import { TelemetryStoreService } from './telemetry-store.service';
import { PrismaService } from '../learning-library/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { RequestTrace } from './trace-contract.types';

describe('OBS-001 Step 5: ObserveController', () => {
  let controller: ObserveController;
  let store: TelemetryStoreService;
  let mockPrisma: any;

  const sampleTrace: RequestTrace = {
    traceId: 'trc_sample_100',
    requestId: 'req_sample_100',
    clientPlatform: 'browser',
    clientRoute: '/upload',
    httpMethod: 'POST',
    httpUrl: '/upload/book',
    httpStatus: 200,
    startTimeIso: new Date().toISOString(),
    startTimeMs: Date.now() - 50,
    endTimeMs: Date.now(),
    durationMs: 50,
    status: 'OK',
    spans: [
      {
        spanId: 'spn_100',
        traceId: 'trc_sample_100',
        requestId: 'req_sample_100',
        name: 'HTTP POST /upload/book',
        kind: 'CONTROLLER',
        startTimeMs: Date.now() - 50,
        endTimeMs: Date.now(),
        durationMs: 50,
        status: 'OK',
        attributes: { url: '/upload/book' },
      },
    ],
  };

  beforeEach(async () => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObserveController],
      providers: [
        TelemetryStoreService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<ObserveController>(ObserveController);
    store = module.get<TelemetryStoreService>(TelemetryStoreService);
  });

  describe('GET /api/v2/observe/traces', () => {
    it('should return empty trace list and zero statistics initially', () => {
      const res = controller.getTraces();
      expect(res.data).toEqual([]);
      expect(res.statistics.totalRequests).toBe(0);
      expect(res.pagination.total).toBe(0);
    });

    it('should filter traces by route and keyword', () => {
      store.store(sampleTrace);
      store.store({ ...sampleTrace, traceId: 'trc_other_200', httpUrl: '/library' });

      const res = controller.getTraces(undefined, undefined, '/upload');
      expect(res.data.length).toBe(1);
      expect(res.data[0].traceId).toBe('trc_sample_100');
    });
  });

  describe('GET /api/v2/observe/traces/:traceId', () => {
    it('should return complete Request 360 trace when found', () => {
      store.store(sampleTrace);
      const res = controller.getTraceById('trc_sample_100');
      expect(res.data).toBeDefined();
      expect(res.data.traceId).toBe('trc_sample_100');
      expect(res.data.spans.length).toBe(1);
    });

    it('should throw NotFoundException when traceId does not exist', () => {
      expect(() => controller.getTraceById('trc_non_existent')).toThrow(NotFoundException);
    });
  });

  describe('GET /api/v2/observe/health', () => {
    it('should return UP for backend and database with healthy memory', async () => {
      const health = await controller.getHealth();
      expect(health.status).toBe('HEALTHY');
      expect(health.backend.status).toBe('UP');
      expect(health.database.status).toBe('UP');
      expect(health.database.latencyMs).toBeGreaterThanOrEqual(1);
      expect(['HEALTHY', 'WARNING', 'CRITICAL']).toContain(health.memory.status);
      expect(health.memory.heapUsedMb).toBeGreaterThan(0);
      expect(health.storage.writable).toBe(true);
    });

    it('should mark database status as DOWN if probe fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB Connection Refused'));
      const health = await controller.getHealth();
      expect(health.status).toBe('UNHEALTHY');
      expect(health.database.status).toBe('DOWN');
      expect(health.database.error).toBe('DB Connection Refused');
    });
  });

  describe('POST /api/v2/observe/client-spans', () => {
    it('should ingest and sanitize client spans', () => {
      store.store(sampleTrace);

      const clientSpan = {
        spanId: 'spn_client_1',
        traceId: 'trc_sample_100',
        requestId: 'req_sample_100',
        name: 'Browser.DOMReady',
        kind: 'CLIENT' as const,
        startTimeMs: Date.now(),
        status: 'OK' as const,
        attributes: {
          loadDuration: 42,
          authorization: 'Bearer secret-token',
        },
      };

      const res = controller.ingestClientSpans({
        traceId: 'trc_sample_100',
        spans: [clientSpan],
      });

      expect(res.success).toBe(true);
      expect(res.ingestedSpansCount).toBe(1);

      const updated = store.getByTraceId('trc_sample_100');
      expect(updated?.spans.length).toBe(2);
      expect(updated?.spans[1].attributes.authorization).toBe('[REDACTED]');
    });

    it('should handle invalid client payloads safely without throwing', () => {
      const res = controller.ingestClientSpans(null as any);
      expect(res.success).toBe(false);
    });
  });
});
