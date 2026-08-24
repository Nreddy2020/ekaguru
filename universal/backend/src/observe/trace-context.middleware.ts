import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TraceIdGenerator, TraceContext, ClientPlatform } from './trace-contract.types';

// Extend Express Request interface to carry traceContext
declare global {
  namespace Express {
    interface Request {
      traceContext?: TraceContext;
    }
  }
}

@Injectable()
export class TraceContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TraceContextMiddleware.name);

  // Regex validators for incoming IDs to prevent header injection or malformed data
  private static readonly TRACE_ID_REGEX = /^trc_[a-zA-Z0-9_-]{4,64}$/;
  private static readonly REQUEST_ID_REGEX = /^req_[a-zA-Z0-9_-]{4,64}$/;

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
    } catch (err: any) {
      // Fail-safe isolation: never let middleware error disrupt request execution
      this.logger.warn(`Fail-safe fallback in TraceContextMiddleware: ${err?.message || err}`);
      const fallback = TraceIdGenerator.createTraceContext();
      req.traceContext = fallback;
      res.setHeader('x-trace-id', fallback.traceId);
      res.setHeader('x-request-id', fallback.requestId);
    }

    next();
  }
}
