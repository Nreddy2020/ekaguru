import { TelemetryStoreService } from './telemetry-store.service';
import { RequestTrace } from './trace-contract.types';

describe('OBS-001 Step 4: TelemetryStoreService (Bounded Ring Buffer)', () => {
  let store: TelemetryStoreService;

  const createMockTrace = (id: string, url: string, status: 'OK' | 'ERROR' = 'OK', durationMs = 50): RequestTrace => ({
    traceId: `trc_${id}`,
    requestId: `req_${id}`,
    clientPlatform: 'browser',
    clientRoute: url,
    httpMethod: 'GET',
    httpUrl: url,
    httpStatus: status === 'OK' ? 200 : 500,
    startTimeIso: new Date().toISOString(),
    startTimeMs: Date.now() - durationMs,
    endTimeMs: Date.now(),
    durationMs,
    status,
    spans: [
      {
        spanId: `spn_${id}`,
        traceId: `trc_${id}`,
        requestId: `req_${id}`,
        name: `HTTP GET ${url}`,
        kind: 'CONTROLLER',
        startTimeMs: Date.now() - durationMs,
        endTimeMs: Date.now(),
        durationMs,
        status,
        attributes: {
          url,
          authorization: 'Bearer token-to-sanitize',
        },
      },
    ],
  });

  beforeEach(() => {
    // Instantiate with small capacity of 5 for deterministic eviction testing
    store = new TelemetryStoreService(5);
  });

  describe('Capacity & FIFO Eviction', () => {
    it('should store traces up to maxCapacity', () => {
      store.store(createMockTrace('1', '/upload'));
      store.store(createMockTrace('2', '/library'));
      store.store(createMockTrace('3', '/tutor'));

      const recent = store.getRecent();
      expect(recent.length).toBe(3);
      expect(recent[0].traceId).toBe('trc_3'); // Newest first
      expect(recent[2].traceId).toBe('trc_1');
    });

    it('should evict oldest traces when capacity of 5 is exceeded', () => {
      for (let i = 1; i <= 8; i++) {
        store.store(createMockTrace(String(i), `/route-${i}`));
      }

      const recent = store.getRecent(10);
      expect(recent.length).toBe(5); // Bound strictly preserved
      expect(recent.map((t) => t.traceId)).toEqual(['trc_8', 'trc_7', 'trc_6', 'trc_5', 'trc_4']);

      // Evicted traces (1, 2, 3) must no longer exist in fast index
      expect(store.getByTraceId('trc_1')).toBeNull();
      expect(store.getByTraceId('trc_2')).toBeNull();
      expect(store.getByTraceId('trc_3')).toBeNull();

      // Active traces (4..8) must be accessible
      expect(store.getByTraceId('trc_8')).toBeDefined();
      expect(store.getByTraceId('trc_4')).toBeDefined();
    });
  });

  describe('Search & Filtering', () => {
    beforeEach(() => {
      store.store(createMockTrace('1', '/upload/book', 'OK', 100));
      store.store(createMockTrace('2', '/library/items', 'OK', 20));
      store.store(createMockTrace('3', '/upload/book', 'ERROR', 450));
      store.store(createMockTrace('4', '/tutor/respond', 'OK', 80));
    });

    it('should filter by route pattern', () => {
      const uploadTraces = store.search({ route: '/upload' });
      expect(uploadTraces.length).toBe(2);
      expect(uploadTraces.every((t) => t.httpUrl.includes('/upload'))).toBe(true);
    });

    it('should filter by status ERROR', () => {
      const errorTraces = store.search({ status: 'ERROR' });
      expect(errorTraces.length).toBe(1);
      expect(errorTraces[0].traceId).toBe('trc_3');
    });

    it('should filter by keyword across url and span names', () => {
      const results = store.search({ keyword: 'tutor' });
      expect(results.length).toBe(1);
      expect(results[0].httpUrl).toBe('/tutor/respond');
    });
  });

  describe('Statistics & Latency Calculations', () => {
    it('should calculate accurate p50, p95, avg duration, and error rates', () => {
      store.store(createMockTrace('1', '/a', 'OK', 10));
      store.store(createMockTrace('2', '/b', 'OK', 20));
      store.store(createMockTrace('3', '/c', 'OK', 30));
      store.store(createMockTrace('4', '/d', 'OK', 40));
      store.store(createMockTrace('5', '/e', 'ERROR', 100));

      const stats = store.getStatistics();
      expect(stats.activeTracesCount).toBe(5);
      expect(stats.errorCount).toBe(1);
      expect(stats.successCount).toBe(4);
      expect(stats.errorRatePercent).toBe(20);
      expect(stats.avgDurationMs).toBe(40); // (10+20+30+40+100)/5 = 40
      expect(stats.p50DurationMs).toBe(30);
      expect(stats.p95DurationMs).toBe(100);
    });
  });

  describe('Privacy & Sanitization', () => {
    it('should sanitize attributes before saving in store', () => {
      store.store(createMockTrace('secret-test', '/login'));
      const stored = store.getByTraceId('trc_secret-test');

      expect(stored).toBeDefined();
      expect(stored?.spans[0].attributes.authorization).toBe('[REDACTED]');
    });
  });

  describe('Fail-Safe Isolation', () => {
    it('should handle null or malformed traces without throwing', () => {
      expect(() => store.store(null as any)).not.toThrow();
      expect(() => store.store({} as any)).not.toThrow();
      expect(store.getRecent().length).toBe(0);
    });
  });
});
