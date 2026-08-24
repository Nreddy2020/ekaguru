import { TraceStorage } from './trace-storage';
import { TraceIdGenerator, TraceContext } from './trace-contract.types';

describe('OBS-001 Step 8.1: Real Database Subsystem Tracing (TraceStorage)', () => {
  it('should capture child spans asynchronously within an active trace state', async () => {
    const traceContext: TraceContext = {
      traceId: TraceIdGenerator.generateTraceId(),
      requestId: TraceIdGenerator.generateRequestId(),
      clientPlatform: 'browser',
      clientRoute: '/test',
      startTimeIso: new Date().toISOString(),
      startTimeMs: Date.now(),
    };

    await TraceStorage.run({ traceContext, spans: [] }, async () => {
      const dbSpan = TraceStorage.startSpan('Prisma User.findUnique', 'DATABASE', { model: 'User', action: 'findUnique' });
      expect(dbSpan).not.toBeNull();

      // Simulate async db query
      await new Promise((resolve) => setTimeout(resolve, 10));

      dbSpan?.end('OK', undefined, { durationMs: 10 });

      const collected = TraceStorage.getSpans();
      expect(collected.length).toBe(1);
      expect(collected[0].name).toBe('Prisma User.findUnique');
      expect(collected[0].kind).toBe('DATABASE');
      expect(collected[0].status).toBe('OK');
      expect(collected[0].traceId).toBe(traceContext.traceId);
    });
  });

  it('should capture error database spans with proper category', async () => {
    const traceContext: TraceContext = {
      traceId: TraceIdGenerator.generateTraceId(),
      requestId: TraceIdGenerator.generateRequestId(),
      clientPlatform: 'browser',
      clientRoute: '/upload',
      startTimeIso: new Date().toISOString(),
      startTimeMs: Date.now(),
    };

    await TraceStorage.run({ traceContext, spans: [] }, async () => {
      const dbSpan = TraceStorage.startSpan('Prisma LearningMaterial.create', 'DATABASE');
      dbSpan?.end('ERROR', 'Database query timed out', { model: 'LearningMaterial' });

      const collected = TraceStorage.getSpans();
      expect(collected.length).toBe(1);
      expect(collected[0].status).toBe('ERROR');
      expect(collected[0].errorCategory).toBe('DATABASE');
      expect(collected[0].errorMessage).toBe('Database query timed out');
    });
  });
});
