import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { AgentDiagnosticService } from './agent-diagnostic.service';
import { TelemetryStoreService } from './telemetry-store.service';

@Controller('api/v2/vitalis')
export class AgentDiagnosticController {
  constructor(
    private readonly diagnosticService: AgentDiagnosticService,
    private readonly telemetryStore: TelemetryStoreService,
  ) {}

  @Get('summary')
  getSummary() {
    return this.telemetryStore.getStatistics();
  }

  @Get('requests')
  getLiveRequests() {
    return this.telemetryStore.getRecent(50);
  }

  @Get('traces/:traceId')
  getTraceById(@Param('traceId') traceId: string) {
    const trace = this.telemetryStore.getByTraceId(traceId);
    if (!trace) {
      throw new NotFoundException(`Trace ${traceId} not found in live or persistent store`);
    }
    return trace;
  }

  @Get('incidents')
  getIncidents() {
    return this.diagnosticService.getAllIncidents();
  }

  @Get('incidents/:incidentId')
  getIncidentById(@Param('incidentId') incidentId: string) {
    const inc = this.diagnosticService.getAgentContext(incidentId);
    if (!inc) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }
    return inc;
  }

  @Get('agent-context/:incidentId')
  getAgentContext(@Param('incidentId') incidentId: string) {
    const pkg = this.diagnosticService.getAgentContext(incidentId);
    if (!pkg) {
      throw new NotFoundException(`Diagnostic package for ${incidentId} not found`);
    }
    return pkg;
  }

  @Post('query')
  queryAgentQuestion(@Body() body: { question: string }) {
    return this.diagnosticService.queryAgentQuestions(body?.question || 'Why did upload fail?');
  }

  @Post('verify-fix')
  verifyFix(@Body() body: { incidentId?: string; previousTraceId?: string; currentTraceId?: string }) {
    return this.diagnosticService.verifyFix(body || {});
  }

  @Get('verification/latest')
  getLatestVerification() {
    return this.diagnosticService.getLatestVerification();
  }
}
