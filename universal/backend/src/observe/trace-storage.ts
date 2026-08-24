import { AsyncLocalStorage } from 'async_hooks';
import { TraceContext, TraceSpan, TraceIdGenerator, SpanKind } from './trace-contract.types';

export interface ActiveTraceState {
  traceContext: TraceContext;
  spans: TraceSpan[];
}

export class TraceSpanHandle {
  private ended = false;
  constructor(
    private readonly span: TraceSpan,
    private readonly state: ActiveTraceState,
  ) {}

  end(status: 'OK' | 'ERROR' = 'OK', errorMessage?: string, attributes?: Record<string, any>): void {
    if (this.ended) return;
    this.ended = true;
    const now = Date.now();
    this.span.endTimeMs = now;
    this.span.durationMs = Math.max(1, now - this.span.startTimeMs);
    this.span.status = status;
    if (errorMessage) {
      this.span.errorMessage = errorMessage;
      if (status === 'ERROR' && !this.span.errorCategory) {
        this.span.errorCategory = 'DATABASE';
      }
    }
    if (attributes) {
      this.span.attributes = { ...(this.span.attributes || {}), ...attributes };
    }
    this.state.spans.push(this.span);
  }
}

export class TraceStorage {
  private static readonly storage = new AsyncLocalStorage<ActiveTraceState>();

  static run<T>(state: ActiveTraceState, callback: () => T): T {
    return this.storage.run(state, callback);
  }

  static getActiveState(): ActiveTraceState | undefined {
    return this.storage.getStore();
  }

  static getTraceContext(): TraceContext | undefined {
    return this.storage.getStore()?.traceContext;
  }

  static getSpans(): TraceSpan[] {
    return this.storage.getStore()?.spans || [];
  }

  static startSpan(name: string, kind: SpanKind = 'SERVICE', attributes?: Record<string, any>): TraceSpanHandle | null {
    const state = this.getActiveState();
    if (!state) return null;

    const span: TraceSpan = {
      spanId: TraceIdGenerator.generateSpanId(),
      traceId: state.traceContext.traceId,
      requestId: state.traceContext.requestId,
      name,
      kind,
      startTimeMs: Date.now(),
      status: 'IN_PROGRESS',
      attributes: attributes || {},
    };

    return new TraceSpanHandle(span, state);
  }

  static recordSpan(span: TraceSpan): void {
    const state = this.getActiveState();
    if (state) {
      state.spans.push(span);
    }
  }
}
