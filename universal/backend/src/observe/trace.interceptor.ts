import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
  Optional,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { TraceSpan, TraceIdGenerator, TraceContext, RequestTrace } from './trace-contract.types';
import { TraceSanitizer } from './trace-sanitizer';
import { TelemetryStoreService } from './telemetry-store.service';

declare global {
  namespace Express {
    interface Request {
      completedTrace?: RequestTrace;
    }
  }
}

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TraceInterceptor.name);

  constructor(@Optional() private readonly telemetryStore?: TelemetryStoreService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();

    const traceCtx: TraceContext =
      req?.traceContext || TraceIdGenerator.createTraceContext({ clientRoute: req?.path });

    const startTimeMs = Date.now();
    const spanId = TraceIdGenerator.generateSpanId();

    const rootSpan: TraceSpan = {
      spanId,
      traceId: traceCtx.traceId,
      requestId: traceCtx.requestId,
      name: `HTTP ${req.method || 'GET'} ${req.path || '/'}`,
      kind: 'CONTROLLER',
      startTimeMs,
      status: 'IN_PROGRESS',
      attributes: {
        method: req.method || 'GET',
        path: req.path || '/',
        clientPlatform: traceCtx.clientPlatform,
        clientRoute: traceCtx.clientRoute,
        query: TraceSanitizer.sanitizeAttributes((req.query as any) || {}),
        userAgent: req.headers ? req.headers['user-agent'] : undefined,
      },
    };

    return next.handle().pipe(
      tap(() => {
        try {
          const endTimeMs = Date.now();
          const durationMs = Math.max(1, endTimeMs - startTimeMs);
          const httpStatus = res.statusCode || 200;

          rootSpan.endTimeMs = endTimeMs;
          rootSpan.durationMs = durationMs;
          rootSpan.status = httpStatus >= 400 ? 'ERROR' : 'OK';
          rootSpan.attributes.httpStatus = httpStatus;

          const requestTrace: RequestTrace = {
            traceId: traceCtx.traceId,
            requestId: traceCtx.requestId,
            clientPlatform: traceCtx.clientPlatform,
            clientRoute: traceCtx.clientRoute,
            httpMethod: req.method || 'GET',
            httpUrl: req.originalUrl || req.url || req.path || '/',
            httpStatus,
            clientIp: req.ip || (req.socket ? req.socket.remoteAddress : undefined),
            userAgent: req.headers ? (req.headers['user-agent'] as string) : undefined,
            startTimeIso: traceCtx.startTimeIso,
            startTimeMs,
            endTimeMs,
            durationMs,
            status: rootSpan.status,
            spans: [rootSpan],
          };

          req.completedTrace = requestTrace;

          if (this.telemetryStore) {
            this.telemetryStore.store(requestTrace);
          }
        } catch (err: any) {
          this.logger.warn(`Fail-safe span completion error: ${err?.message || err}`);
        }
      }),
      catchError((error) => {
        try {
          const endTimeMs = Date.now();
          const durationMs = Math.max(1, endTimeMs - startTimeMs);
          const httpStatus =
            error instanceof HttpException
              ? error.getStatus()
              : error?.status || error?.statusCode || 500;

          rootSpan.endTimeMs = endTimeMs;
          rootSpan.durationMs = durationMs;
          rootSpan.status = 'ERROR';
          rootSpan.errorMessage = error?.message || 'Unknown server error';
          rootSpan.errorStack = error?.stack;
          rootSpan.attributes.httpStatus = httpStatus;

          const requestTrace: RequestTrace = {
            traceId: traceCtx.traceId,
            requestId: traceCtx.requestId,
            clientPlatform: traceCtx.clientPlatform,
            clientRoute: traceCtx.clientRoute,
            httpMethod: req.method || 'GET',
            httpUrl: req.originalUrl || req.url || req.path || '/',
            httpStatus,
            clientIp: req.ip || (req.socket ? req.socket.remoteAddress : undefined),
            userAgent: req.headers ? (req.headers['user-agent'] as string) : undefined,
            startTimeIso: traceCtx.startTimeIso,
            startTimeMs,
            endTimeMs,
            durationMs,
            status: 'ERROR',
            spans: [rootSpan],
          };

          req.completedTrace = requestTrace;

          if (this.telemetryStore) {
            this.telemetryStore.store(requestTrace);
          }
        } catch (err: any) {
          this.logger.warn(`Fail-safe error span completion error: ${err?.message || err}`);
        }
        return throwError(() => error);
      }),
    );
  }
}
