/**
 * ============================================================================
 * 🔭 VITALIS OBSERVE — CANONICAL DOMAIN MODEL
 * ============================================================================
 */

export type VitalisEnvironment = 'DEMO' | 'LAB' | 'PRODUCTION';
export type SubsystemKind =
  | 'CLIENT'
  | 'DNS'
  | 'GATEWAY'
  | 'CONTROLLER'
  | 'SERVICE'
  | 'MIDDLEWARE'
  | 'DATABASE'
  | 'STORAGE'
  | 'M2_ENGINE'
  | 'QUEUE'
  | 'DOWNSTREAM';

export type HealthScoreStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

// 1. Unified Request & Hop Journey
export interface VitalisHop {
  nodeId: string;
  nodeName: string;
  kind: SubsystemKind;
  status: 'OK' | 'WARNING' | 'ERROR' | 'IN_PROGRESS';
  latencyMs: number;
  error?: string;
  attributes: Record<string, any>;
}

export interface VitalisRequest {
  id: string;
  traceId: string;
  requestId: string;
  transactionType: string;
  businessService: string;
  user: string;
  environment: VitalisEnvironment;
  region: string;
  currentHop: string;
  durationMs: number;
  status: 'OK' | 'DEGRADED' | 'ERROR' | 'IN_PROGRESS';
  riskScore: number; // 0-100
  startedAt: string;
  completedAt?: string;
  trafficType: 'APPLICATION' | 'OBSERVE_INTERNAL';
  hops: VitalisHop[];
  rawTrace?: any;
}

// 2. Topology & Dependency Graph
export interface VitalisTopologyNode {
  id: string;
  name: string;
  type: 'SERVICE' | 'DATABASE' | 'QUEUE' | 'GATEWAY' | 'STORAGE' | 'EXTERNAL';
  tier: 'FRONTEND' | 'APPLICATION' | 'MIDDLEWARE' | 'DATA' | 'INFRASTRUCTURE';
  healthScore: number; // 0-100
  status: HealthScoreStatus;
  metrics: {
    p95LatencyMs: number;
    errorRatePercent: number;
    throughputRps: number;
  };
  dependencies: string[]; // downstream node IDs
}

// 3. Application & Service Inventory
export interface VitalisInventoryItem {
  id: string;
  name: string;
  type: 'APPLICATION' | 'SERVICE' | 'API_ROUTE' | 'DATABASE' | 'QUEUE' | 'STORAGE_BUCKET' | 'CLUSTER';
  environment: VitalisEnvironment;
  tier: string;
  status: HealthScoreStatus;
  version: string;
  owner: string;
  businessService: string;
  endpoint?: string;
  p95LatencyMs: number;
  errorRatePercent: number;
  dependencyCount: number;
  lastObserved: string;
}

// 4. Normalized Signals & Correlation
export interface VitalisSignal {
  id: string;
  source: string;
  component: string;
  signalType: 'METRIC' | 'LOG' | 'SPAN' | 'EVENT' | 'AUDIT';
  name: string;
  value: number | string | Record<string, any>;
  unit?: string;
  timestamp: string;
  correlationId?: string;
  traceId?: string;
  requestId?: string;
  environment: VitalisEnvironment;
}

export interface VitalisCorrelation {
  correlationId: string;
  traceId?: string;
  requestId?: string;
  primaryComponent: string;
  relatedComponents: string[];
  firstSeen: string;
  lastSeen: string;
  confidenceScore: number; // 0-100
  evidenceCount: number;
}

// 5. Evidence & RCA Intelligence
export interface VitalisEvidence {
  id: string;
  source: string;
  timestamp: string;
  type: 'SPAN' | 'QUERY' | 'ERROR_LOG' | 'CONFIG_DIFF' | 'METRIC_SPIKE' | 'STORAGE_IO';
  confidencePercent: number;
  correlationId?: string;
  traceId?: string;
  requestId?: string;
  component: string;
  summary: string;
  rawPayload?: any;
}

export interface VitalisRcaReport {
  incidentId: string;
  title: string;
  confidencePercent: number;
  rootCauseComponent: string;
  mode: 'REAL_EVIDENCE' | 'SIMULATED';
  summary: string;
  recommendedAction: string[];
  evidenceCount: number;
  evidenceItems: VitalisEvidence[];
  relatedSpan?: string;
}

export interface VitalisIncident {
  id: string;
  title: string;
  severity: SeverityLevel;
  status: 'ACTIVE' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';
  businessService: string;
  primaryComponent: string;
  affectedRequestsCount: number;
  durationMinutes: number;
  startedAt: string;
  rca?: VitalisRcaReport;
}

// 6. Business Impact Assessment
export interface VitalisBusinessImpact {
  serviceName: string;
  affectedUsers: number;
  failedTransactions: number;
  estimatedRevenueExposure: string;
  slaStatus: 'COMPLIANT' | 'AT_RISK' | 'BREACHED';
  slaPercent: number;
  severity: SeverityLevel;
}

// 7. Predictive Risk & What-If Simulation
export interface VitalisRiskAlert {
  id: string;
  component: string;
  riskType: string;
  probabilityPercent: number;
  expectedBreachWindow: string;
  severity: SeverityLevel;
  suggestedAction: string;
}

export interface VitalisSimulationResult {
  scenarioId: string;
  injectedFailure: string;
  targetComponent: string;
  affectedServices: string[];
  estimatedBlastRadiusPercent: number;
  projectedRevenueRisk: string;
  suggestedMitigation: string;
}

// 8. Action & Continuous Learning
export interface VitalisAction {
  id: string;
  title: string;
  component: string;
  status: 'RECOMMENDED' | 'SIMULATED' | 'APPROVED' | 'EXECUTED';
  safetyLevel: 'SAFE' | 'SUPERVISED' | 'CRITICAL';
  estimatedRecoveryTimeMinutes: number;
  actionScript: string;
}

export interface VitalisLearningRule {
  id: string;
  ruleName: string;
  patternDetected: string;
  rootCause: string;
  preventionRule: string;
  timesApplied: number;
  createdFromIncidentId: string;
  createdAt: string;
}

// 9. Command Center Overview Bundle
export interface VitalisCommandCenterOverview {
  environment: VitalisEnvironment;
  timestamp: string;
  operationalScore: number; // 0-100
  slaPercent: number;
  activeIncidentsCount: number;
  totalRequestsCount: number;
  errorCount: number;
  p95LatencyMs: number;
  inProgressCount: number;
  activeIncidents: VitalisIncident[];
  liveObservations: Array<{
    time: string;
    message: string;
    severity: SeverityLevel;
    component: string;
  }>;
  subsystemHealthMatrix: Array<{
    name: string;
    tier: string;
    score: number;
    status: HealthScoreStatus;
  }>;
}
