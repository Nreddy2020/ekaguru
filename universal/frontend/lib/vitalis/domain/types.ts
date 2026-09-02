/**
 * VITALIS OBSERVE: Canonical Domain Model (Milestone 3 Autonomous Operational Intelligence)
 */

export type VitalisEnvironment = 'LAB' | 'DEMO' | 'PRODUCTION';
export type VitalisHealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
export type VitalisProvenance = 'REAL_OBSERVED' | 'SIMULATED' | 'USER_PROVIDED';

export type VitalisIntelligenceState =
  | 'NOMINAL'
  | 'OBSERVED'
  | 'DEVIATING'
  | 'ANALYZING'
  | 'CORRELATED'
  | 'EXPLAINED'
  | 'PREDICTED'
  | 'ACTIONABLE'
  | 'REMEDIATING'
  | 'VERIFIED'
  | 'LEARNED';

export interface VitalisTelemetryProvenance {
  metricName: string;
  value: string | number;
  environment: VitalisEnvironment;
  provenance: VitalisProvenance;
  endpoint: string;
  collectionWindow: string;
  sampleCount: number;
  calculationMethod: string;
  capturedAt: string;
  lastUpdatedSecAgo: number;
  rawRecordsSnippet?: string;
}

export interface VitalisConfidenceBreakdown {
  totalPercent: number;
  rating: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  factors: {
    name: string;
    weightPoints: number;
    description: string;
  }[];
}

export interface VitalisWhyItem {
  id: string;
  title: string;
  what: string;
  where: string;
  when: string;
  why: string;
  intelligenceState: VitalisIntelligenceState;
  provenance: VitalisProvenance;
  confidence: VitalisConfidenceBreakdown;
  evidenceItems: {
    title: string;
    type: string;
    snippet: string;
    timestamp: string;
  }[];
  propagationChain: {
    step: number;
    node: string;
    effect: string;
  }[];
  impact: {
    service: string;
    usersAffected?: number;
    failedTxns?: number;
    exposure?: string;
  };
  recommendedAction: {
    title: string;
    runbookId: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    rollbackAvailable: boolean;
    approvalRequired: boolean;
  };
}

export interface VitalisPredictiveRisk {
  id: string;
  title: string;
  category: 'THREAD_POOL' | 'CERTIFICATE' | 'CAPACITY' | 'MEMORY';
  provenance: VitalisProvenance;
  currentValue: string;
  baselineValue: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  predictedBreachTime: string;
  confidencePercent: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  businessService: string;
  recommendedAction: string;
  provenanceNote: string;
  sampleCount?: number;
  windowMinutes?: number;
}

export interface VitalisTopologyEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  latencyMs: number;
  latencyContributionPercent: number;
  correlationScore: number;
  risk: 'NOMINAL' | 'DEGRADED' | 'CRITICAL';
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

export interface VitalisTopologyNode {
  id: string;
  name: string;
  tier: 'CLIENT' | 'DNS' | 'NETWORK' | 'FIREWALL' | 'LOAD_BALANCER' | 'WEB_SERVER' | 'APP_SERVER' | 'MESSAGE_QUEUE' | 'DATABASE' | 'DOWNSTREAM' | 'STORAGE';
  healthScore: number;
  p95LatencyMs: number;
  errorRatePercent: number;
  connectionsSaturationPercent: number;
  riskLevel: 'NOMINAL' | 'DEGRADED' | 'CRITICAL';
  intelligenceState: VitalisIntelligenceState;
  dependentServices: string[];
  recentChange?: {
    timestamp: string;
    summary: string;
    diffSnippet: string;
  };
  inboundEdges: string[];
  outboundEdges: string[];
}

export interface VitalisWhatIfResult {
  parameterName: string;
  currentValue: string;
  proposedValue: string;
  blastRadius: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictedLockContentionDelta: string;
  predictedLatencyDelta: string;
  predictedThreadSaturation: string;
  predictedQueueBacklog: string;
  predictedFailuresCount: number;
  predictedFinancialExposure: string;
  safetyNote: string;
}

export interface VitalisKnowledgeArtifact {
  id: string;
  patternName: string;
  category: string;
  observedSymptom: string;
  rootCauseSummary: string;
  impactChain: string;
  resolutionRunbook: string;
  preventionGuardrail: string;
  detectionRule: string;
  confidencePercent: number;
  historicalOccurrences: number;
  createdAt: string;
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
  type?: string;
  businessService?: string;
  owner?: string;
  tier?: string;
  runtime: string;
  version: string;
  environment: VitalisEnvironment;
  status: VitalisHealthStatus;
  subsystemsCount: number;
  p95LatencyMs: number;
  signalsFreshnessSec: number;
  collectors: string[];
}

export interface VitalisAgentDiagnosticPackage {
  packageId?: string;
  incidentId?: string;
  application?: string;
  environment?: string;
  severity?: string;
  request?: any;
  journey?: any[];
  subsystemEvidence?: any[];
  agentActionSuggestions?: any[];
  generatedAt?: string;
  anomalySummary?: string;
  rootCauseHypothesis?: string;
  confidenceScore?: number;
  suggestedRemediation?: string;
  evidenceItems?: {
    key: string;
    source: string;
    value: string | number;
    timestamp: string;
  }[];
  [key: string]: any;
}

export interface VitalisFixVerificationResult {
  fixId?: string;
  verified?: boolean;
  score?: number;
  checks?: any[];
  [key: string]: any;
}
