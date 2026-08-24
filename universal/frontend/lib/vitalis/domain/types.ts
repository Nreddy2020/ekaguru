/**
 * VITALIS OBSERVE: Canonical Intelligence Domain Model (Milestone 2)
 */

export type VitalisEnvironment = 'LAB' | 'DEMO' | 'PRODUCTION';
export type VitalisHealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
export type VitalisProvenance = 'REAL_OBSERVED' | 'SIMULATED' | 'USER_PROVIDED';

export interface VitalisProvenanceBadge {
  type: VitalisProvenance;
  label: string;
  subLabel?: string;
}

export interface VitalisHealthExplanation {
  overallScore: number;
  status: 'NOMINAL' | 'DEVIATION' | 'INCIDENT';
  reasons: string[];
  dimensions: {
    name: string;
    score: number;
    description: string;
    signalsCount: number;
  }[];
  scoringPhilosophy: string;
}

export interface VitalisBusinessImpactDetail {
  status: 'PROTECTED' | 'ATTENTION_REQUIRED';
  provenance: VitalisProvenance;
  monitoredUsers?: number;
  failedTransactions?: number;
  estimatedFinancialExposure?: string;
  impactedService?: string;
  slaCompliancePercent: number;
  summary: string;
  sourceNote: string;
}

export interface VitalisCausalStep {
  id: string;
  stepNumber: number;
  nodeName: string;
  tier: string;
  changeOrSignal: string;
  metricDelta?: string;
  timestamp: string;
  observedEffect: string;
  evidenceTitle: string;
  evidenceSnippet: string;
  evidenceType: 'CONFIG_AUDIT' | 'METRIC_SPIKE' | 'THREAD_DUMP' | 'QUEUE_LOG' | 'ERROR_TRACE' | 'LOG_PARSED';
  confidencePercent: number;
}

export interface VitalisScenario {
  id: string;
  scenarioNumber: number;
  name: string;
  tagline: string;
  description: string;
  status: 'NOMINAL' | 'DEGRADED' | 'CRITICAL';
  operationalScore: number;
  p95LatencyMs: number;
  slaPercent: number;
  errorCount: number;
  businessImpact: VitalisBusinessImpactDetail;
  journey: {
    name: string;
    kind: string;
    time: string;
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    anomalyNote?: string;
  }[];
  causalStory: VitalisCausalStep[];
  rca: {
    summary: string;
    rootCauseNode: string;
    confidencePercent: number;
    recommendedAction: string;
    runbookId?: string;
  };
}

export interface VitalisSpan {
  id: string;
  name: string;
  subsystem: string;
  tier: 'CLIENT' | 'GATEWAY' | 'CONTROLLER' | 'DATABASE' | 'STORAGE' | 'M2' | 'DOWNSTREAM';
  durationMs: number;
  statusCode?: number;
  error?: boolean;
  metadata?: Record<string, any>;
}

export interface VitalisRequest {
  id: string;
  transactionType: string;
  businessService: string;
  environment: VitalisEnvironment;
  provenance: VitalisProvenance;
  status: 'HEALTHY' | 'DEVIATION' | 'INCIDENT' | 'IN_PROGRESS';
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  statusCode: number;
  clientIp?: string;
  userAgent?: string;
  client?: string;
  method?: string;
  route?: string;
  currentHop: string;
  spans: VitalisSpan[];
  evidenceJson?: Record<string, any>;
  causalChain?: {
    cause: string;
    effect: string;
    confidencePercent: number;
  };
  learningMemory?: {
    patternId: string;
    occurrences: number;
    recommendedAction: string;
  };
}

export interface VitalisIncident {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  businessService: string;
  environment: VitalisEnvironment;
  startedAt: string;
  status: 'ACTIVE' | 'RESOLVING' | 'RESOLVED';
  rca?: {
    summary: string;
    confidencePercent: number;
    evidenceCount: number;
  };
}

export interface VitalisCommandCenterOverview {
  operationalScore: number;
  slaPercent: number;
  p95LatencyMs: number;
  activeIncidentsCount: number;
  totalRequestsCount: number;
  errorCount: number;
  activeIncidents: VitalisIncident[];
  environment: VitalisEnvironment;
  provenance: VitalisProvenance;
  healthExplanation?: VitalisHealthExplanation;
  businessImpactDetail?: VitalisBusinessImpactDetail;
}

export interface VitalisInventoryItem {
  id: string;
  name: string;
  runtime: string;
  version: string;
  environment: VitalisEnvironment;
  status: VitalisHealthStatus;
  subsystemsCount: number;
  p95LatencyMs: number;
  signalsFreshnessSec: number;
  collectors: string[];
}
