import { TraceIdGenerator, TraceContext, TraceSpan } from './trace-contract.types';
import { TraceSanitizer } from './trace-sanitizer';

describe('OBS-001 Step 1: Trace Contract & ID Generation', () => {
  describe('ID Generation & Prefixes', () => {
    it('should generate valid traceId with prefix "trc_"', () => {
      const traceId = TraceIdGenerator.generateTraceId();
      expect(traceId).toMatch(/^trc_[a-z0-9]+_[a-f0-9]+$/);
    });

    it('should generate valid requestId with prefix "req_"', () => {
      const requestId = TraceIdGenerator.generateRequestId();
      expect(requestId).toMatch(/^req_[a-z0-9]+_[a-f0-9]+$/);
    });

    it('should generate valid spanId with prefix "spn_"', () => {
      const spanId = TraceIdGenerator.generateSpanId();
      expect(spanId).toMatch(/^spn_[a-f0-9]+$/);
    });

    it('should generate unique non-colliding IDs', () => {
      const traceIds = new Set(Array.from({ length: 100 }, () => TraceIdGenerator.generateTraceId()));
      expect(traceIds.size).toBe(100);
    });
  });

  describe('Correlation & Hierarchy', () => {
    it('should create valid TraceContext with client attributes', () => {
      const context = TraceIdGenerator.createTraceContext({
        clientPlatform: 'browser',
        clientRoute: '/upload',
      });

      expect(context.traceId).toMatch(/^trc_/);
      expect(context.requestId).toMatch(/^req_/);
      expect(context.clientPlatform).toBe('browser');
      expect(context.clientRoute).toBe('/upload');
      expect(context.startTimeMs).toBeGreaterThan(0);
      expect(context.startTimeIso).toBeDefined();
    });

    it('should preserve incoming traceId when provided in TraceContext', () => {
      const context = TraceIdGenerator.createTraceContext({
        traceId: 'trc_custom_123',
        requestId: 'req_custom_456',
      });

      expect(context.traceId).toBe('trc_custom_123');
      expect(context.requestId).toBe('req_custom_456');
    });

    it('should create child spans maintaining parent-child correlation', () => {
      const context = TraceIdGenerator.createTraceContext();
      const parentSpan = TraceIdGenerator.createChildSpan(context, 'HTTP POST /upload/book', 'CONTROLLER');
      const childSpan = TraceIdGenerator.createChildSpan(
        context,
        'M2.PageExtraction',
        'SERVICE',
        parentSpan.spanId,
        { pageCount: 59 },
      );

      expect(childSpan.traceId).toBe(context.traceId);
      expect(childSpan.requestId).toBe(context.requestId);
      expect(childSpan.parentSpanId).toBe(parentSpan.spanId);
      expect(childSpan.attributes.pageCount).toBe(59);
      expect(childSpan.status).toBe('IN_PROGRESS');
    });
  });

  describe('Data Sanitization & Child Privacy', () => {
    it('should redact sensitive authorization headers and tokens', () => {
      const headers = {
        'content-type': 'application/json',
        authorization: 'Bearer eyJhbGciOi...',
        cookie: 'session_id=secret123',
        'x-trace-id': 'trc_123',
      };

      const sanitized = TraceSanitizer.sanitizeHeaders(headers);
      expect(sanitized['content-type']).toBe('application/json');
      expect(sanitized['x-trace-id']).toBe('trc_123');
      expect(sanitized.authorization).toBe('[REDACTED]');
      expect(sanitized.cookie).toBe('[REDACTED]');
    });

    it('should recursively redact sensitive fields in payload attributes', () => {
      const attributes = {
        username: 'student_1',
        password: 'mySecretPassword!',
        jwtToken: 'xyz.abc.123',
        nested: {
          clientSecret: 'secret_val',
          publicInfo: 'visible',
        },
      };

      const sanitized = TraceSanitizer.sanitizeAttributes(attributes);
      expect(sanitized.username).toBe('student_1');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.jwtToken).toBe('[REDACTED]');
      expect(sanitized.nested.clientSecret).toBe('[REDACTED]');
      expect(sanitized.nested.publicInfo).toBe('visible');
    });
  });
});
