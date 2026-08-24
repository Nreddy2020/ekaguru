import { TraceInterceptor } from './trace.interceptor';
import { ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { TraceIdGenerator } from './trace-contract.types';

describe('OBS-001 Step 3: TraceInterceptor', () => {
  let interceptor: TraceInterceptor;
  let mockReq: any;
  let mockRes: any;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    interceptor = new TraceInterceptor();
    const traceCtx = TraceIdGenerator.createTraceContext({
      clientPlatform: 'browser',
      clientRoute: '/upload',
    });

    mockReq = {
      method: 'POST',
      path: '/upload/book',
      originalUrl: '/upload/book',
      headers: { 'user-agent': 'Mozilla/5.0' },
      query: { mode: 'fast' },
      ip: '127.0.0.1',
      traceContext: traceCtx,
    };

    mockRes = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    } as any;
  });

  it('should capture successful request duration, status OK, and httpStatus 200', (done) => {
    const mockCallHandler: CallHandler = {
      handle: () => of({ success: true }),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({ success: true });
        expect(mockReq.completedTrace).toBeDefined();
        expect(mockReq.completedTrace.traceId).toBe(mockReq.traceContext.traceId);
        expect(mockReq.completedTrace.httpMethod).toBe('POST');
        expect(mockReq.completedTrace.httpUrl).toBe('/upload/book');
        expect(mockReq.completedTrace.httpStatus).toBe(200);
        expect(mockReq.completedTrace.status).toBe('OK');
        expect(mockReq.completedTrace.durationMs).toBeGreaterThanOrEqual(1);
        expect(mockReq.completedTrace.spans.length).toBe(1);
        expect(mockReq.completedTrace.spans[0].name).toBe('HTTP POST /upload/book');
        expect(mockReq.completedTrace.spans[0].status).toBe('OK');
        done();
      },
      error: done.fail,
    });
  });

  it('should capture HTTP error, status ERROR, status code, and rethrow cleanly', (done) => {
    const error = new HttpException('File too large', HttpStatus.PAYLOAD_TOO_LARGE);
    const mockCallHandler: CallHandler = {
      handle: () => throwError(() => error),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => done.fail('Should have thrown error'),
      error: (err) => {
        expect(err).toBe(error);
        expect(mockReq.completedTrace).toBeDefined();
        expect(mockReq.completedTrace.status).toBe('ERROR');
        expect(mockReq.completedTrace.httpStatus).toBe(413);
        expect(mockReq.completedTrace.spans[0].status).toBe('ERROR');
        expect(mockReq.completedTrace.spans[0].errorMessage).toBe('File too large');
        expect(mockReq.completedTrace.spans[0].errorStack).toBeDefined();
        done();
      },
    });
  });

  it('should handle unhandled server exception with status 500', (done) => {
    const serverError = new Error('Database connection timeout');
    const mockCallHandler: CallHandler = {
      handle: () => throwError(() => serverError),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => done.fail('Should have thrown error'),
      error: (err) => {
        expect(err).toBe(serverError);
        expect(mockReq.completedTrace.httpStatus).toBe(500);
        expect(mockReq.completedTrace.status).toBe('ERROR');
        expect(mockReq.completedTrace.spans[0].errorMessage).toBe('Database connection timeout');
        done();
      },
    });
  });
});
