import { Module } from '@nestjs/common';
import { ObserveController } from './observe.controller';
import { AgentDiagnosticController } from './agent-diagnostic.controller';
import { AgentDiagnosticService } from './agent-diagnostic.service';
import { TelemetryStoreService } from './telemetry-store.service';
import { TraceStorageService } from './trace-storage.service';
import { TraceInterceptor } from './trace.interceptor';

@Module({
  controllers: [ObserveController, AgentDiagnosticController],
  providers: [
    TelemetryStoreService,
    TraceStorageService,
    AgentDiagnosticService,
    TraceInterceptor,
  ],
  exports: [
    TelemetryStoreService,
    TraceStorageService,
    AgentDiagnosticService,
    TraceInterceptor,
  ],
})
export class ObserveModule {}
