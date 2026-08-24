import { AgentDiagnosticService } from './agent-diagnostic.service';
import { TelemetryStoreService } from './telemetry-store.service';

describe('AgentDiagnosticService (Milestone 4 Machine Control Surface)', () => {
  let service: AgentDiagnosticService;
  let telemetryStore: TelemetryStoreService;

  beforeEach(() => {
    telemetryStore = new TelemetryStoreService();
    service = new AgentDiagnosticService(telemetryStore);
  });

  it('should retrieve persistent Agent Diagnostic Package with Epistemic Classification and Affected Code Areas', () => {
    const pkg = service.getAgentContext('INC-2026-000127');
    expect(pkg).toBeDefined();
    expect(pkg?.incidentId).toBe('INC-2026-000127');
    expect(pkg?.application).toBe('EKAGURU');
    expect(pkg?.severity).toBe('HIGH');
    expect(pkg?.request.statusCode).toBe(504);

    // Epistemic classification verification
    expect(pkg?.selectedRootCause.epistemicStatus).toBe('SUSPECTED');
    expect(pkg?.journey.find((h) => h.tier === 'DATABASE')?.epistemicStatus).toBe('OBSERVED');

    // Affected code areas verification
    expect(pkg?.affectedCodeAreas[0].component).toBe('M2 Structure Engine');
    expect(pkg?.affectedCodeAreas[0].suspectedFiles).toContain(
      'universal/backend/src/m2/structure/structure.service.ts',
    );
    expect(pkg?.affectedCodeAreas[0].suspectedOperation).toBe('ContentTopic.insert');

    // Supporting evidence references verification
    expect(pkg?.evidenceReferences.length).toBeGreaterThanOrEqual(4);
    expect(pkg?.evidenceReferences[0].id).toBe('EV-001');
    expect(pkg?.recommendedInvestigation.length).toBeGreaterThanOrEqual(4);
  });

  it('should answer structured agent query with concrete evidence IDs and next investigation steps', () => {
    const response = service.queryAgentQuestions('Why did upload fail?');
    expect(response.answer).toContain('Upload failed during M2 Structure processing');
    expect(response.confidencePercent).toBe(94);
    expect(response.traceId).toBe('trc_lab_m2_upload_fail');
    expect(response.evidenceReferences.some((e) => e.id === 'EV-001')).toBe(true);
    expect(response.nextInvestigation.length).toBeGreaterThan(0);
  });

  it('should execute fix verification protocol and certify Before vs After improvements', () => {
    const verification = service.verifyFix({
      incidentId: 'INC-2026-000127',
      previousTraceId: 'trc_lab_m2_upload_fail',
      currentTraceId: 'trc_lab_m2_upload_verified',
    });

    expect(verification.status).toBe('FIX_VERIFIED');
    expect(verification.beforeMetrics.durationMs).toBe(8420);
    expect(verification.afterMetrics.durationMs).toBe(184);
    expect(verification.delta.durationImprovementPercent).toBe(97.8);
    expect(verification.regressionCheck.allPassed).toBe(true);
    expect(verification.regressionCheck.passedRequests).toBe(5);
    expect(verification.certification.rootCauseExtinguished).toBe(true);
  });
});
