import { TraceContextMiddleware } from './trace-context.middleware';
import { Request, Response } from 'express';

describe('OBS-001 Step 2: TraceContextMiddleware', () => {
  let middleware: TraceContextMiddleware;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: jest.Mock;
  let responseHeaders: Record<string, string>;

  beforeEach(() => {
    middleware = new TraceContextMiddleware();
    responseHeaders = {};
    mockReq = {
      headers: {},
      path: '/api/v2/learning-materials',
    };
    mockRes = {
      setHeader: jest.fn().mockImplementation((key: string, value: string) => {
        responseHeaders[key.toLowerCase()] = value;
        return mockRes;
      }),
    };
    nextFn = jest.fn();
  });

  it('should generate traceId and requestId when headers are absent', () => {
    middleware.use(mockReq as Request, mockRes as Response, nextFn);

    expect(mockReq.traceContext).toBeDefined();
    expect(mockReq.traceContext?.traceId).toMatch(/^trc_/);
    expect(mockReq.traceContext?.requestId).toMatch(/^req_/);
    expect(mockReq.traceContext?.clientPlatform).toBe('browser');
    expect(mockReq.traceContext?.clientRoute).toBe('/api/v2/learning-materials');

    expect(responseHeaders['x-trace-id']).toBe(mockReq.traceContext?.traceId);
    expect(responseHeaders['x-request-id']).toBe(mockReq.traceContext?.requestId);
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it('should accept and preserve valid incoming x-trace-id and x-request-id', () => {
    mockReq.headers = {
      'x-trace-id': 'trc_custom_valid_trace_123',
      'x-request-id': 'req_custom_valid_req_456',
      'x-client-platform': 'mobile',
      'x-client-route': '/upload',
    };

    middleware.use(mockReq as Request, mockRes as Response, nextFn);

    expect(mockReq.traceContext?.traceId).toBe('trc_custom_valid_trace_123');
    expect(mockReq.traceContext?.requestId).toBe('req_custom_valid_req_456');
    expect(mockReq.traceContext?.clientPlatform).toBe('mobile');
    expect(mockReq.traceContext?.clientRoute).toBe('/upload');

    expect(responseHeaders['x-trace-id']).toBe('trc_custom_valid_trace_123');
    expect(responseHeaders['x-request-id']).toBe('req_custom_valid_req_456');
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it('should regenerate IDs if incoming headers are malformed or invalid', () => {
    mockReq.headers = {
      'x-trace-id': 'malformed!@#_injection',
      'x-request-id': 'bad-req-format',
    };

    middleware.use(mockReq as Request, mockRes as Response, nextFn);

    expect(mockReq.traceContext?.traceId).toMatch(/^trc_/);
    expect(mockReq.traceContext?.traceId).not.toBe('malformed!@#_injection');
    expect(mockReq.traceContext?.requestId).toMatch(/^req_/);
    expect(mockReq.traceContext?.requestId).not.toBe('bad-req-format');

    expect(responseHeaders['x-trace-id']).toBe(mockReq.traceContext?.traceId);
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it('should remain fail-safe even if request headers object is null or throws', () => {
    const corruptReq: any = { headers: null, path: '/' };

    expect(() => {
      middleware.use(corruptReq, mockRes as Response, nextFn);
    }).not.toThrow();

    expect(corruptReq.traceContext).toBeDefined();
    expect(corruptReq.traceContext.traceId).toMatch(/^trc_/);
    expect(nextFn).toHaveBeenCalledTimes(1);
  });
});
