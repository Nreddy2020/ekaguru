import * as crypto from 'crypto';

export type ClientPlatform = 'browser' | 'mobile' | 'api' | 'unknown';

export type TraceStatus = 'IN_PROGRESS' | 'OK' | 'ERROR' | 'TIMEOUT';

export type SpanKind = 'CLIENT' | 'GATEWAY' | 'CONTROLLER' | 'SERVICE' | 'DATABASE' | 'STORAGE' | 'EXTERNAL';

export type ErrorCategory =
  | 'NETWORK'
  | 'AUTH'
  | 'GATEWAY'
  | 'DATABASE'
  | 'STORAGE'
  | 'APPLICATION'
  | 'M2_ENGINE';

export interface TraceContext {
  traceId: string;
  requestId: string;
  parentSpanId?: string;
  clientPlatform: ClientPlatform;
  clientRoute?: string;
  startTimeIso: string;
  startTimeMs: number;
}

export interface TraceSpan {
  spanId: string;
  traceId: string;
  requestId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  startTimeMs: number;
  endTimeMs?: number;
  durationMs?: number;
  status: TraceStatus;
  attributes: Record<string, any>;
  errorMessage?: string;
  errorStack?: string;
  errorCategory?: ErrorCategory;
}

export interface RootCauseDiagnostic {
  category: ErrorCategory;
  summary: string;
  failedComponent: string;
  confidencePercent: number;
  recommendedAction: string;
  evidence: string[];
}

export interface RequestTrace {
  traceId: string;
  requestId: string;
  clientPlatform: ClientPlatform;
  clientRoute?: string;
  httpMethod: string;
  httpUrl: string;
  httpStatus?: number;
  clientIp?: string;
  userAgent?: string;
  startTimeIso: string;
  startTimeMs: number;
  endTimeMs?: number;
  durationMs?: number;
  status: TraceStatus;
  rootCause?: RootCauseDiagnostic;
  spans: TraceSpan[];
}

export class TraceIdGenerator {
  static generateTraceId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return 'trc_' + timestamp + '_' + random;
  }

  static generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(6).toString('hex');
    return 'req_' + timestamp + '_' + random;
  }

  static generateSpanId(): string {
    return 'spn_' + crypto.randomBytes(6).toString('hex');
  }

  static createTraceContext(options?: {
    traceId?: string;
    requestId?: string;
    clientPlatform?: ClientPlatform;
    clientRoute?: string;
  }): TraceContext {
    const now = Date.now();
    return {
      traceId: options?.traceId || this.generateTraceId(),
      requestId: options?.requestId || this.generateRequestId(),
      clientPlatform: options?.clientPlatform || 'browser',
      clientRoute: options?.clientRoute || '/',
      startTimeIso: new Date(now).toISOString(),
      startTimeMs: now,
    };
  }

  static createChildSpan(
    context: TraceContext,
    name: string,
    kind: SpanKind,
    parentSpanId?: string,
    attributes: Record<string, string | number | boolean | undefined> = {},
  ): TraceSpan {
    return {
      spanId: this.generateSpanId(),
      traceId: context.traceId,
      requestId: context.requestId,
      parentSpanId: parentSpanId || context.parentSpanId,
      name,
      kind,
      startTimeMs: Date.now(),
      status: 'IN_PROGRESS',
      attributes,
    };
  }
}
