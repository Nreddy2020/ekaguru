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
import { TraceSpan, TraceIdGenerator, TraceContext, RequestTrace, ErrorCategory } from './trace-contract.types';
import { TraceSanitizer } from './trace-sanitizer';
import { TelemetryStoreService } from './telemetry-store.service';
import { TraceStorage } from './trace-storage';

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

          const childSpans = TraceStorage.getSpans();

          const isObserveInternal = (req.path || '').startsWith('/api/v2/observe');
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
            trafficType: isObserveInternal ? 'OBSERVE_INTERNAL' : 'APPLICATION',
            isInternal: isObserveInternal,
            spans: [rootSpan, ...childSpans],
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
          const httpStatus = error instanceof HttpException ? error.getStatus() : 500;

          rootSpan.endTimeMs = endTimeMs;
          rootSpan.durationMs = durationMs;
          rootSpan.status = 'ERROR';
          rootSpan.errorMessage = error?.message || 'Internal Server Error';
          rootSpan.errorStack = error?.stack ? error.stack.split('\n').slice(0, 5).join('\n') : (error?.message || 'Error');
          rootSpan.attributes.httpStatus = httpStatus;
          rootSpan.attributes.errorName = error?.name;

          let errorCategory: ErrorCategory = 'APPLICATION';
          if (httpStatus === 401 || httpStatus === 403) errorCategory = 'AUTH';
          else if (httpStatus === 502 || httpStatus === 503 || httpStatus === 504) errorCategory = 'GATEWAY';
          else if (rootSpan.errorMessage.toLowerCase().includes('database') || rootSpan.errorMessage.toLowerCase().includes('prisma')) errorCategory = 'DATABASE';
          else if (rootSpan.errorMessage.toLowerCase().includes('m2') || req.path.includes('upload')) errorCategory = 'M2_ENGINE';
          rootSpan.errorCategory = errorCategory;

          const childSpans = TraceStorage.getSpans();

          const isObserveInternal = (req.path || '').startsWith('/api/v2/observe');
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
            trafficType: isObserveInternal ? 'OBSERVE_INTERNAL' : 'APPLICATION',
            isInternal: isObserveInternal,
            spans: [rootSpan, ...childSpans],
          };

          req.completedTrace = requestTrace;

          if (this.telemetryStore) {
            this.telemetryStore.store(requestTrace);
          }
        } catch (err: any) {
          this.logger.warn(`Fail-safe catchError telemetry failure: ${err?.message || err}`);
        }

        return throwError(() => error);
      }),
    );
  }
}
