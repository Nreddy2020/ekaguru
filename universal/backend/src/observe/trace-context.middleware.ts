import { Injectable, NestMiddleware, Logger, Optional } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TraceIdGenerator, TraceContext, ClientPlatform, RequestTrace } from './trace-contract.types';
import { TelemetryStoreService } from './telemetry-store.service';

// Extend Express Request interface to carry traceContext
declare global {
  namespace Express {
    interface Request {
      traceContext?: TraceContext;
      completedTrace?: RequestTrace;
    }
  }
}

@Injectable()
export class TraceContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TraceContextMiddleware.name);

  // Regex validators for incoming IDs to prevent header injection or malformed data
  private static readonly TRACE_ID_REGEX = /^trc_[a-zA-Z0-9_-]{4,64}$/;
  private static readonly REQUEST_ID_REGEX = /^req_[a-zA-Z0-9_-]{4,64}$/;

  constructor(@Optional() private readonly telemetryStore?: TelemetryStoreService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      // 1. Extract or generate traceId
      const rawTraceId = req.headers['x-trace-id'];
      const traceIdStr = typeof rawTraceId === 'string' ? rawTraceId.trim() : Array.isArray(rawTraceId) ? rawTraceId[0] : '';
      const traceId = TraceContextMiddleware.TRACE_ID_REGEX.test(traceIdStr)
        ? traceIdStr
        : TraceIdGenerator.generateTraceId();

      // 2. Extract or generate requestId
      const rawReqId = req.headers['x-request-id'];
      const reqIdStr = typeof rawReqId === 'string' ? rawReqId.trim() : Array.isArray(rawReqId) ? rawReqId[0] : '';
      const requestId = TraceContextMiddleware.REQUEST_ID_REGEX.test(reqIdStr)
        ? reqIdStr
        : TraceIdGenerator.generateRequestId();

      // 3. Extract client platform
      const rawPlatform = req.headers['x-client-platform'];
      const platformStr = typeof rawPlatform === 'string' ? rawPlatform.toLowerCase() : '';
      let clientPlatform: ClientPlatform = 'browser';
      if (platformStr === 'mobile') clientPlatform = 'mobile';
      else if (platformStr === 'api') clientPlatform = 'api';
      else if (platformStr === 'browser') clientPlatform = 'browser';

      // 4. Extract client route
      const rawRoute = req.headers['x-client-route'];
      const clientRoute = typeof rawRoute === 'string' && rawRoute.trim().length > 0 ? rawRoute.trim() : req.path || '/';

      // 5. Create immutable TraceContext
      const now = Date.now();
      const traceContext: TraceContext = {
        traceId,
        requestId,
        clientPlatform,
        clientRoute,
        startTimeIso: new Date(now).toISOString(),
        startTimeMs: now,
      };

      // 6. Attach context to Express request
      req.traceContext = traceContext;

      // 7. Inject correlation headers into HTTP response
      res.setHeader('x-trace-id', traceId);
      res.setHeader('x-request-id', requestId);

      // 8. Capture finish event for requests rejected at Guard/Filter layer (e.g. 401, 403, 404)
      if (res && typeof res.on === 'function') {
        res.on('finish', () => {
          try {
            if (!req.completedTrace && this.telemetryStore) {
              const httpStatus = res.statusCode || 200;
              const isError = httpStatus >= 400;
              const durationMs = Math.max(1, Date.now() - traceContext.startTimeMs);
              const fallbackTrace: RequestTrace = {
                traceId: traceContext.traceId,
                requestId: traceContext.requestId,
                clientPlatform: traceContext.clientPlatform,
                clientRoute: traceContext.clientRoute,
                httpMethod: req.method || 'GET',
                httpUrl: req.originalUrl || req.url || req.path || '/',
                httpStatus,
                clientIp: req.ip || (req.socket ? req.socket.remoteAddress : undefined),
                userAgent: req.headers ? (req.headers['user-agent'] as string) : undefined,
                startTimeIso: traceContext.startTimeIso,
                startTimeMs: traceContext.startTimeMs,
                endTimeMs: Date.now(),
                durationMs,
                status: isError ? 'ERROR' : 'OK',
                spans: [
                  {
                    spanId: TraceIdGenerator.generateSpanId(),
                    traceId: traceContext.traceId,
                    requestId: traceContext.requestId,
                    name: `HTTP ${req.method || 'GET'} ${req.path || '/'}`,
                    kind: 'GATEWAY',
                    startTimeMs: traceContext.startTimeMs,
                    endTimeMs: Date.now(),
                    durationMs,
                    status: isError ? 'ERROR' : 'OK',
                    attributes: { httpStatus },
                    errorMessage: isError ? `HTTP ${httpStatus} response` : undefined,
                  },
                ],
              };
              req.completedTrace = fallbackTrace;
              this.telemetryStore.store(fallbackTrace);
            }
          } catch (finishErr: any) {
            this.logger.warn(`Fail-safe finish telemetry error: ${finishErr?.message || finishErr}`);
          }
        });
      }
    } catch (err: any) {
      // Fail-safe isolation: never let middleware error disrupt request execution
      this.logger.warn(`Fail-safe fallback in TraceContextMiddleware: ${err?.message || err}`);
      const fallback = TraceIdGenerator.createTraceContext();
      req.traceContext = fallback;
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('x-trace-id', fallback.traceId);
        res.setHeader('x-request-id', fallback.requestId);
      }
    }

    next();
  }
}
