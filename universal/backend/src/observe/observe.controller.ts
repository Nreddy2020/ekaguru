import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  NotFoundException,
  HttpStatus,
  HttpCode,
  Logger,
  Optional,
} from '@nestjs/common';
import { TelemetryStoreService, TraceSearchParams } from './telemetry-store.service';
import { RequestTrace, TraceSpan, TraceStatus, ErrorCategory } from './trace-contract.types';
import { TraceSanitizer } from './trace-sanitizer';
import { PrismaService } from '../learning-library/prisma.service';
import * as os from 'os';
import * as fs from 'fs';

export interface SystemHealthReport {
  timestamp: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  backend: {
    status: 'UP' | 'DOWN';
    uptimeSeconds: number;
    nodeVersion: string;
    pid: number;
  };
  database: {
    status: 'UP' | 'DOWN';
    latencyMs?: number;
    error?: string;
  };
  memory: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    percentUsed: number;
  };
  storage: {
    status: 'ACCESSIBLE' | 'DEGRADED';
    uploadDirectory: string;
    writable: boolean;
  };
}

@Controller('api/v2/observe')
export class ObserveController {
  private readonly logger = new Logger(ObserveController.name);

  constructor(
    private readonly telemetryStore: TelemetryStoreService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  /**
   * 1. GET /api/v2/observe/traces
   * Lists recent traces with search filters and summary statistics.
   */
  @Get('traces')
  getTraces(
    @Query('traceId') traceId?: string,
    @Query('requestId') requestId?: string,
    @Query('route') route?: string,
    @Query('status') status?: TraceStatus,
    @Query('errorCategory') errorCategory?: ErrorCategory,
    @Query('keyword') keyword?: string,
    @Query('trafficType') trafficType?: 'ALL' | 'APPLICATION' | 'OBSERVE_INTERNAL',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const searchParams: TraceSearchParams = {
      traceId,
      requestId,
      route,
      status,
      errorCategory,
      keyword,
      trafficType,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    const traces = this.telemetryStore.search(searchParams);
    const statistics = this.telemetryStore.getStatistics(trafficType);

    return {
      data: traces,
      statistics,
      pagination: {
        limit: searchParams.limit,
        offset: searchParams.offset,
        total: statistics.activeTracesCount,
      },
    };
  }

  /**
   * 2. GET /api/v2/observe/traces/:traceId
   * Retrieves complete Request 360 trace including all spans.
   */
  @Get('traces/:traceId')
  getTraceById(@Param('traceId') traceId: string) {
    const trace = this.telemetryStore.getByTraceId(traceId);
    if (!trace) {
      throw new NotFoundException(`Trace with ID '${traceId}' not found in active telemetry buffer.`);
    }
    return { data: trace };
  }

  /**
   * 3. GET /api/v2/observe/health
   * Returns comprehensive system and subsystem health metrics.
   */
  @Get('health')
  async getHealth(): Promise<SystemHealthReport> {
    const memUsage = process.memoryUsage();
    const heapUsedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMb = Math.round(memUsage.rss / 1024 / 1024);
    const percentUsed = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    let memStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (percentUsed > 90) memStatus = 'CRITICAL';
    else if (percentUsed > 75) memStatus = 'WARNING';

    // Check Database Health Probe
    let dbStatus: 'UP' | 'DOWN' = 'UP';
    let dbLatencyMs = 0;
    let dbError: string | undefined;

    if (this.prisma) {
      try {
        const start = Date.now();
        await this.prisma.$queryRaw`SELECT 1`;
        dbLatencyMs = Math.max(1, Date.now() - start);
      } catch (err: any) {
        dbStatus = 'DOWN';
        dbError = err?.message || 'Database connection error';
      }
    } else {
      dbStatus = 'UP';
      dbLatencyMs = 1;
    }

    // Check Storage Directory Health
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    let storageStatus: 'ACCESSIBLE' | 'DEGRADED' = 'ACCESSIBLE';
    let isWritable = false;

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.accessSync(uploadDir, fs.constants.W_OK);
      isWritable = true;
    } catch {
      storageStatus = 'DEGRADED';
      isWritable = false;
    }

    const overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' =
      dbStatus === 'DOWN' ? 'UNHEALTHY' : memStatus === 'CRITICAL' || storageStatus === 'DEGRADED' ? 'DEGRADED' : 'HEALTHY';

    return {
      timestamp: new Date().toISOString(),
      status: overallStatus,
      backend: {
        status: 'UP',
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        pid: process.pid,
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      memory: {
        status: memStatus,
        heapUsedMb,
        heapTotalMb,
        rssMb,
        percentUsed,
      },
      storage: {
        status: storageStatus,
        uploadDirectory: uploadDir,
        writable: isWritable,
      },
    };
  }

  /**
   * 4. POST /api/v2/observe/client-spans
   * Ingests client-side browser/mobile telemetry spans with automatic sanitization.
   */
  @Post('client-spans')
  @HttpCode(HttpStatus.OK)
  ingestClientSpans(
    @Body() body: { traceId: string; spans: TraceSpan[] },
  ) {
    if (!body || !body.traceId || !Array.isArray(body.spans)) {
      return { success: false, message: 'Invalid client span payload' };
    }

    try {
      const existing = this.telemetryStore.getByTraceId(body.traceId);
      const sanitizedIncomingSpans = body.spans.map((s) => ({
        ...s,
        attributes: TraceSanitizer.sanitizeAttributes(s.attributes || {}),
      }));

      if (existing) {
        existing.spans.push(...sanitizedIncomingSpans);
      } else {
        // Create client-originated RequestTrace if not yet recorded by backend
        const firstSpan = sanitizedIncomingSpans[0];
        const newTrace: RequestTrace = {
          traceId: body.traceId,
          requestId: firstSpan?.requestId || 'req_client',
          clientPlatform: 'browser',
          httpMethod: (firstSpan?.attributes?.method as string) || 'CLIENT',
          httpUrl: (firstSpan?.attributes?.url as string) || '/',
          startTimeIso: new Date().toISOString(),
          startTimeMs: firstSpan?.startTimeMs || Date.now(),
          status: 'OK',
          spans: sanitizedIncomingSpans,
        };
        this.telemetryStore.store(newTrace);
      }

      return { success: true, ingestedSpansCount: body.spans.length };
    } catch (err: any) {
      this.logger.warn(`Fail-safe client-spans ingestion error: ${err?.message || err}`);
      return { success: false, error: 'Telemetry ingestion failed' };
    }
  }
}
