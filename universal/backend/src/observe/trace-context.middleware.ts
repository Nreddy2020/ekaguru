import { Injectable, NestMiddleware, Logger, Optional } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TraceIdGenerator, TraceContext, ClientPlatform, RequestTrace } from './trace-contract.types';
import { TelemetryStoreService } from './telemetry-store.service';
import { TraceStorage } from './trace-storage';

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

  private static readonly TRACE_ID_REGEX = /^trc_[a-zA-Z0-9_-]{4,64}$/;
  private static readonly REQUEST_ID_REGEX = /^req_[a-zA-Z0-9_-]{4,64}$/;

  constructor(@Optional() private readonly telemetryStore?: TelemetryStoreService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      const headers = (req && req.headers) || {};
      const rawTraceId = headers['x-trace-id'];
      const traceIdStr = typeof rawTraceId === 'string' ? rawTraceId.trim() : Array.isArray(rawTraceId) ? rawTraceId[0] : '';
      const traceId = TraceContextMiddleware.TRACE_ID_REGEX.test(traceIdStr)
        ? traceIdStr
        : TraceIdGenerator.generateTraceId();

      const rawReqId = headers['x-request-id'];
      const reqIdStr = typeof rawReqId === 'string' ? rawReqId.trim() : Array.isArray(rawReqId) ? rawReqId[0] : '';
      const requestId = TraceContextMiddleware.REQUEST_ID_REGEX.test(reqIdStr)
        ? reqIdStr
        : TraceIdGenerator.generateRequestId();

      const rawPlatform = headers['x-client-platform'];
      const platformStr = typeof rawPlatform === 'string' ? rawPlatform.toLowerCase() : '';
      let clientPlatform: ClientPlatform = 'browser';
      if (platformStr === 'mobile') clientPlatform = 'mobile';
      else if (platformStr === 'api') clientPlatform = 'api';
      else if (platformStr === 'browser') clientPlatform = 'browser';

      const rawRoute = headers['x-client-route'];
      const clientRoute = typeof rawRoute === 'string' && rawRoute.trim().length > 0 ? rawRoute.trim() : (req && req.path) || '/';

      const now = Date.now();
      const traceContext: TraceContext = {
        traceId,
        requestId,
        clientPlatform,
        clientRoute,
        startTimeIso: new Date(now).toISOString(),
        startTimeMs: now,
      };

      if (req) {
        req.traceContext = traceContext;
      }

      if (res && typeof res.setHeader === 'function') {
        res.setHeader('x-trace-id', traceId);
        res.setHeader('x-request-id', requestId);
      }

      if (res && typeof res.on === 'function') {
        res.on('finish', () => {
          try {
            if (req && !req.completedTrace && this.telemetryStore) {
              const httpStatus = res.statusCode || 200;
              const isError = httpStatus >= 400;
              const durationMs = Math.max(1, Date.now() - traceContext.startTimeMs);
              const childSpans = TraceStorage.getSpans();
              const fallbackTrace: RequestTrace = {
                traceId: traceContext.traceId,
                requestId: traceContext.requestId,
                clientPlatform: traceContext.clientPlatform,
                clientRoute: traceContext.clientRoute,
                httpMethod: (req && req.method) || 'GET',
                httpUrl: (req && (req.originalUrl || req.url || req.path)) || '/',
                httpStatus,
                clientIp: req && (req.ip || (req.socket ? req.socket.remoteAddress : undefined)),
                userAgent: headers['user-agent'] as string,
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
                    name: `HTTP ${(req && req.method) || 'GET'} ${(req && req.path) || '/'}`,
                    kind: 'CONTROLLER',
                    startTimeMs: traceContext.startTimeMs,
                    endTimeMs: Date.now(),
                    durationMs,
                    status: isError ? 'ERROR' : 'OK',
                    attributes: {
                      httpStatus,
                      clientPlatform: traceContext.clientPlatform,
                      clientRoute: traceContext.clientRoute,
                      fallbackCaptured: true,
                    },
                  },
                  ...childSpans,
                ],
              };

              req.completedTrace = fallbackTrace;
              this.telemetryStore.store(fallbackTrace);
            }
          } catch (e: any) {
            this.logger.warn(`Fail-safe fallback store error: ${e?.message || e}`);
          }
        });
      }

      TraceStorage.run({ traceContext, spans: [] }, () => {
        next();
      });
    } catch (err: any) {
      this.logger.warn(`Fail-safe fallback in TraceContextMiddleware: ${err?.message || err}`);
      if (req && !req.traceContext) {
        req.traceContext = TraceIdGenerator.createTraceContext({ clientRoute: req && req.path });
      }
      next();
    }
  }
}
