import { Injectable, Logger, Optional } from '@nestjs/common';
import { RequestTrace, TraceStatus, ErrorCategory } from './trace-contract.types';
import { TraceSanitizer } from './trace-sanitizer';

export interface TelemetryStatistics {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  errorRatePercent: number;
  activeTracesCount: number;
  inProgressCount?: number;
  applicationRequestsCount?: number;
  internalRequestsCount?: number;
}

export interface TraceSearchParams {
  traceId?: string;
  requestId?: string;
  route?: string;
  status?: TraceStatus;
  errorCategory?: ErrorCategory;
  keyword?: string;
  trafficType?: 'ALL' | 'APPLICATION' | 'OBSERVE_INTERNAL';
  limit?: number;
  offset?: number;
}

@Injectable()
export class TelemetryStoreService {
  private readonly logger = new Logger(TelemetryStoreService.name);
  private readonly maxCapacity: number;

  // Ring buffer arrays and fast index map
  private readonly buffer: RequestTrace[];
  private readonly indexMap: Map<string, RequestTrace>;
  private headIndex = 0;
  private isFull = false;

  // Lifetime running counters
  private totalRecorded = 0;
  private totalErrors = 0;
  private applicationRecorded = 0;
  private internalRecorded = 0;

  constructor(@Optional() maxCapacity = 5000) {
    this.maxCapacity = Math.max(1, maxCapacity);
    this.buffer = new Array<RequestTrace>(this.maxCapacity);
    this.indexMap = new Map<string, RequestTrace>();
  }

  /**
   * Stores a completed RequestTrace into the bounded ring buffer with automatic sanitization.
   * Guaranteed fail-safe.
   */
  store(trace: RequestTrace): void {
    try {
      if (!trace || !trace.traceId) return;

      // 1. Sanitize all spans and root trace before storing
      const sanitizedSpans = (trace.spans || []).map((span) => ({
        ...span,
        attributes: TraceSanitizer.sanitizeAttributes(span.attributes || {}),
      }));

      const trafficType = trace.trafficType || (trace.httpUrl.startsWith('/api/v2/observe') ? 'OBSERVE_INTERNAL' : 'APPLICATION');

      const sanitizedTrace: RequestTrace = {
        ...trace,
        trafficType,
        isInternal: trafficType === 'OBSERVE_INTERNAL',
        spans: sanitizedSpans,
      };

      // 2. FIFO Eviction if slot is occupied
      if (this.isFull) {
        const oldTrace = this.buffer[this.headIndex];
        if (oldTrace && oldTrace.traceId) {
          this.indexMap.delete(oldTrace.traceId);
        }
      }

      // 3. Insert new trace into buffer and index
      this.buffer[this.headIndex] = sanitizedTrace;
      this.indexMap.set(sanitizedTrace.traceId, sanitizedTrace);

      // 4. Update lifetime counters
      this.totalRecorded++;
      if (trafficType === 'APPLICATION') {
        this.applicationRecorded++;
      } else {
        this.internalRecorded++;
      }

      if (sanitizedTrace.status === 'ERROR' || (sanitizedTrace.httpStatus && sanitizedTrace.httpStatus >= 400)) {
        this.totalErrors++;
      }

      // 5. Advance circular head index
      this.headIndex = (this.headIndex + 1) % this.maxCapacity;
      if (this.headIndex === 0) {
        this.isFull = true;
      }
    } catch (err: any) {
      // Never disrupt request execution on telemetry error
      this.logger.warn(`Fail-safe TelemetryStore.store error: ${err?.message || err}`);
    }
  }

  /**
   * Returns recent traces ordered from newest to oldest.
   */
  getRecent(limit = 50, offset = 0, trafficType: 'ALL' | 'APPLICATION' | 'OBSERVE_INTERNAL' = 'ALL'): RequestTrace[] {
    let all = this.getAllTracesNewestFirst();
    if (trafficType === 'APPLICATION') {
      all = all.filter((t) => t.trafficType === 'APPLICATION');
    } else if (trafficType === 'OBSERVE_INTERNAL') {
      all = all.filter((t) => t.trafficType === 'OBSERVE_INTERNAL');
    }
    return all.slice(offset, offset + limit);
  }

  /**
   * Fast O(1) trace retrieval by traceId.
   */
  getByTraceId(traceId: string): RequestTrace | null {
    if (!traceId) return null;
    return this.indexMap.get(traceId) || null;
  }

  /**
   * Multi-dimensional search across ring buffer.
   */
  search(params: TraceSearchParams): RequestTrace[] {
    let traces = this.getAllTracesNewestFirst();

    if (params.trafficType && params.trafficType !== 'ALL') {
      traces = traces.filter((t) => t.trafficType === params.trafficType);
    }

    if (params.traceId) {
      traces = traces.filter((t) => t.traceId.toLowerCase().includes(params.traceId!.toLowerCase()));
    }

    if (params.requestId) {
      traces = traces.filter((t) => t.requestId?.toLowerCase().includes(params.requestId!.toLowerCase()));
    }

    if (params.route) {
      traces = traces.filter((t) => t.httpUrl.toLowerCase().includes(params.route!.toLowerCase()));
    }

    if (params.status) {
      traces = traces.filter((t) => t.status === params.status);
    }

    if (params.errorCategory) {
      traces = traces.filter((t) =>
        t.spans.some((s) => s.errorCategory === params.errorCategory)
      );
    }

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      traces = traces.filter(
        (t) =>
          t.httpUrl.toLowerCase().includes(kw) ||
          t.traceId.toLowerCase().includes(kw) ||
          t.requestId?.toLowerCase().includes(kw) ||
          t.errorMessage?.toLowerCase().includes(kw) ||
          t.spans.some((s) => s.name.toLowerCase().includes(kw) || s.errorMessage?.toLowerCase().includes(kw))
      );
    }

    const offset = params.offset || 0;
    const limit = params.limit || 50;
    return traces.slice(offset, offset + limit);
  }

  /**
   * Aggregates telemetry statistics.
   */
  getStatistics(trafficType: 'ALL' | 'APPLICATION' | 'OBSERVE_INTERNAL' = 'ALL'): TelemetryStatistics {
    let traces = this.getAllTracesNewestFirst();
    if (trafficType === 'APPLICATION') {
      traces = traces.filter((t) => t.trafficType === 'APPLICATION');
    } else if (trafficType === 'OBSERVE_INTERNAL') {
      traces = traces.filter((t) => t.trafficType === 'OBSERVE_INTERNAL');
    }

    const activeCount = traces.length;
    const inProgressCount = traces.filter((t) => t.status === 'IN_PROGRESS').length;

    if (activeCount === 0) {
      return {
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        avgDurationMs: 0,
        p50DurationMs: 0,
        p95DurationMs: 0,
        errorRatePercent: 0,
        activeTracesCount: 0,
        applicationRequestsCount: 0,
        internalRequestsCount: 0,
      };
    }

    let errorCount = 0;
    let totalDuration = 0;
    const durations: number[] = [];

    for (const t of traces) {
      const dur = t.durationMs || 1;
      durations.push(dur);
      totalDuration += dur;
      if (t.status === 'ERROR' || (t.httpStatus && t.httpStatus >= 400)) {
        errorCount++;
      }
    }

    durations.sort((a, b) => a - b);
    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.min(durations.length - 1, Math.floor(durations.length * 0.95));

    return {
      totalRequests: trafficType === 'APPLICATION' ? this.applicationRecorded : trafficType === 'OBSERVE_INTERNAL' ? this.internalRecorded : this.totalRecorded,
      successCount: activeCount - errorCount,
      errorCount,
      avgDurationMs: Math.round(totalDuration / activeCount),
      p50DurationMs: durations[p50Index] || 0,
      p95DurationMs: durations[p95Index] || 0,
      errorRatePercent: Math.round((errorCount / activeCount) * 1000) / 10,
      activeTracesCount: activeCount,
      inProgressCount,
      applicationRequestsCount: this.applicationRecorded,
      internalRequestsCount: this.internalRecorded,
    };
  }

  /**
   * Clears the telemetry buffer (for test isolation).
   */
  clear(): void {
    this.buffer.fill(null as any);
    this.indexMap.clear();
    this.headIndex = 0;
    this.isFull = false;
    this.totalRecorded = 0;
    this.totalErrors = 0;
    this.applicationRecorded = 0;
    this.internalRecorded = 0;
  }

  private getAllTracesNewestFirst(): RequestTrace[] {
    const count = this.isFull ? this.maxCapacity : this.headIndex;
    const result: RequestTrace[] = [];

    if (count === 0) return result;

    if (!this.isFull) {
      for (let i = this.headIndex - 1; i >= 0; i--) {
        if (this.buffer[i]) result.push(this.buffer[i]);
      }
    } else {
      // Read newest to oldest across circular ring boundary
      for (let i = 1; i <= this.maxCapacity; i++) {
        const idx = (this.headIndex - i + this.maxCapacity) % this.maxCapacity;
        if (this.buffer[idx]) result.push(this.buffer[idx]);
      }
    }
    return result;
  }
}
