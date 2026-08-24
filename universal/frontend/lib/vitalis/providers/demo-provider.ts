import { IVitalisDataProvider } from './vitalis-data-provider.interface';
import {
  VitalisEnvironment,
  VitalisRequest,
  VitalisInventoryItem,
  VitalisTopologyNode,
  VitalisCommandCenterOverview,
  VitalisIncident,
  VitalisRcaReport,
  VitalisEvidence,
} from '../domain/types';

export class DemoProvider implements IVitalisDataProvider {
  getEnvironment(): VitalisEnvironment {
    return 'DEMO';
  }

  async getCommandCenterOverview(): Promise<VitalisCommandCenterOverview> {
    const activeIncidents: VitalisIncident[] = [
      {
        id: 'INC-DEMO-901',
        title: 'PAYMENT.PROCESS — DB2 Lock Contention',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        businessService: 'PAYMENT_CORE',
        primaryComponent: 'DB2 Database (Z/OS)',
        affectedRequestsCount: 1545,
        durationMinutes: 38,
        startedAt: new Date(Date.now() - 38 * 60000).toISOString(),
        rca: {
          incidentId: 'INC-DEMO-901',
          title: 'DB2 MAX_LOCKS REDUCTION',
          confidencePercent: 92,
          rootCauseComponent: 'DB2_MAX_LOCKS Configuration Parameter',
          mode: 'SIMULATED',
          summary: 'DB2_MAX_LOCKS parameter reduced from 120,000 to 50,000 during midnight configuration maintenance, causing lock escalation and transaction timeouts in WebSphere connection pool.',
          recommendedAction: [
            'Restore DB2_MAX_LOCKS to 120,000 via runbook script',
            'Drain WebSphere payment connection backlog',
            'Verify MQ queue depth on PAYMENT.REQUEST.Q',
          ],
          evidenceCount: 128,
          evidenceItems: [
            {
              id: 'ev-demo-1',
              source: 'DB2_DIAG_LOG',
              timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
              type: 'ERROR_LOG',
              confidencePercent: 96,
              component: 'DB2 Buffer Manager',
              summary: 'SQLCODE: -911 / SQLSTATE: 40001 — Deadlock or lock escalation timeout on table PAYMENT_TXN',
            },
            {
              id: 'ev-demo-2',
              source: 'WEBSPHERE_THREAD_DUMP',
              timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
              type: 'SPAN',
              confidencePercent: 91,
              component: 'WebSphere DefaultWorkManager',
              summary: '142 WebSphere worker threads in WAITING state on com.ibm.db2.jcc.t4.b.i.a(DB2Connection.java:312)',
            },
            {
              id: 'ev-demo-3',
              source: 'CONFIG_AUDIT_LOG',
              timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
              type: 'CONFIG_DIFF',
              confidencePercent: 99,
              component: 'DB2 Subsystem Config',
              summary: 'Change Record CHG-8491: DB2_MAX_LOCKS modified (120000 -> 50000) by automated maintenance job',
            },
          ],
          relatedSpan: 'DB2 SQL Execution • Duration: 7,140 ms',
        },
      },
    ];

    return {
      environment: 'DEMO',
      timestamp: new Date().toISOString(),
      operationalScore: 84,
      slaPercent: 94.2,
      activeIncidentsCount: 1,
      totalRequestsCount: 12458,
      errorCount: 1545,
      p95LatencyMs: 8642,
      inProgressCount: 18,
      activeIncidents,
      liveObservations: [
        {
          time: new Date(Date.now() - 2 * 60000).toLocaleTimeString(),
          message: 'PAYMENT.PROCESS P95 latency increased by 38% across North America East region',
          severity: 'CRITICAL',
          component: 'WebSphere / DB2',
        },
        {
          time: new Date(Date.now() - 8 * 60000).toLocaleTimeString(),
          message: 'MQ Queue PAYMENT.REQUEST.Q depth exceeded warning threshold (depth: 4,820 msgs)',
          severity: 'HIGH',
          component: 'IBM MQ',
        },
        {
          time: new Date(Date.now() - 15 * 60000).toLocaleTimeString(),
          message: 'F5 Load Balancer active pool member health degraded for payment-cluster-02',
          severity: 'MEDIUM',
          component: 'F5 BIG-IP',
        },
      ],
      subsystemHealthMatrix: [
        { name: 'Browser / Mobile Client', tier: 'FRONTEND', score: 98, status: 'HEALTHY' },
        { name: 'F5 BIG-IP / DNS', tier: 'GATEWAY', score: 94, status: 'HEALTHY' },
        { name: 'IBM HTTP Server (IHS)', tier: 'GATEWAY', score: 91, status: 'HEALTHY' },
        { name: 'WebSphere Application Server', tier: 'APPLICATION', score: 62, status: 'DEGRADED' },
        { name: 'IBM MQ Series', tier: 'MIDDLEWARE', score: 71, status: 'DEGRADED' },
        { name: 'IBM DB2 (Z/OS)', tier: 'DATA', score: 48, status: 'CRITICAL' },
        { name: 'Downstream Core Banking', tier: 'EXTERNAL', score: 95, status: 'HEALTHY' },
      ],
    };
  }

  async getLiveRequests(): Promise<VitalisRequest[]> {
    return [
      {
        id: 'TX-847392',
        traceId: 'trc_demo_tx_847392',
        requestId: 'req_01J923K8Y2QW5X7V6B1GJ8K2M9',
        transactionType: 'PAYMENT.PROCESS',
        businessService: 'PAYMENT_CORE',
        user: 'corporate-client-01',
        environment: 'DEMO',
        region: 'us-east-1',
        currentHop: 'IBM DB2 (Z/OS)',
        durationMs: 8642,
        status: 'ERROR',
        riskScore: 92,
        startedAt: new Date(Date.now() - 8642).toISOString(),
        trafficType: 'APPLICATION',
        hops: [
          { nodeId: 'hop-1', nodeName: 'Browser Client', kind: 'CLIENT', status: 'OK', latencyMs: 22, attributes: {} },
          { nodeId: 'hop-2', nodeName: 'Cloudflare DNS', kind: 'DNS', status: 'OK', latencyMs: 25, attributes: {} },
          { nodeId: 'hop-3', nodeName: 'Network Backbone', kind: 'MIDDLEWARE', status: 'OK', latencyMs: 35, attributes: {} },
          { nodeId: 'hop-4', nodeName: 'Edge Firewall', kind: 'GATEWAY', status: 'OK', latencyMs: 18, attributes: {} },
          { nodeId: 'hop-5', nodeName: 'F5 BIG-IP Load Balancer', kind: 'GATEWAY', status: 'OK', latencyMs: 120, attributes: {} },
          { nodeId: 'hop-6', nodeName: 'IBM HTTP Server (IHS)', kind: 'GATEWAY', status: 'OK', latencyMs: 67, attributes: {} },
          { nodeId: 'hop-7', nodeName: 'WebSphere App Server', kind: 'APPLICATION', status: 'WARNING', latencyMs: 620, attributes: {} },
          { nodeId: 'hop-8', nodeName: 'IBM MQ (PAYMENT.Q)', kind: 'QUEUE', status: 'WARNING', latencyMs: 120, attributes: {} },
          { nodeId: 'hop-9', nodeName: 'IBM DB2 (Z/OS)', kind: 'DATABASE', status: 'ERROR', latencyMs: 7140, error: 'SQLCODE -911 Lock Timeout', attributes: {} },
          { nodeId: 'hop-10', nodeName: 'Downstream Core Bank API', kind: 'DOWNSTREAM', status: 'OK', latencyMs: 475, attributes: {} },
        ],
      },
    ];
  }

  async getRequestById(requestIdOrTraceId: string): Promise<VitalisRequest | null> {
    const list = await this.getLiveRequests();
    return list.find((r) => r.id === requestIdOrTraceId || r.traceId === requestIdOrTraceId) || list[0];
  }

  async getApplicationInventory(): Promise<VitalisInventoryItem[]> {
    return [
      {
        id: 'inv-demo-01',
        name: 'Payment Gateway (WebSphere)',
        type: 'SERVICE',
        environment: 'DEMO',
        tier: 'APPLICATION',
        status: 'DEGRADED',
        version: 'WAS 9.0.5',
        owner: 'Enterprise Payments Team',
        businessService: 'PAYMENT_CORE',
        endpoint: 'https://payment.enterprise.internal',
        p95LatencyMs: 620,
        errorRatePercent: 12.4,
        dependencyCount: 4,
        lastObserved: new Date().toISOString(),
      },
      {
        id: 'inv-demo-02',
        name: 'IBM DB2 Z/OS Mainframe',
        type: 'DATABASE',
        environment: 'DEMO',
        tier: 'DATA',
        status: 'CRITICAL',
        version: 'DB2 v12.1',
        owner: 'Mainframe Database Operations',
        businessService: 'Core Ledger',
        endpoint: 'db2-cluster.prod.internal:50000',
        p95LatencyMs: 7140,
        errorRatePercent: 18.2,
        dependencyCount: 0,
        lastObserved: new Date().toISOString(),
      },
    ];
  }

  async getTopology(): Promise<VitalisTopologyNode[]> {
    return [
      {
        id: 'node-f5',
        name: 'F5 BIG-IP Load Balancer',
        type: 'GATEWAY',
        tier: 'INFRASTRUCTURE',
        healthScore: 94,
        status: 'HEALTHY',
        metrics: { p95LatencyMs: 120, errorRatePercent: 0.1, throughputRps: 450 },
        dependencies: ['node-ihs'],
      },
      {
        id: 'node-ihs',
        name: 'IBM HTTP Server (IHS)',
        type: 'GATEWAY',
        tier: 'INFRASTRUCTURE',
        healthScore: 91,
        status: 'HEALTHY',
        metrics: { p95LatencyMs: 67, errorRatePercent: 0.2, throughputRps: 448 },
        dependencies: ['node-was'],
      },
      {
        id: 'node-was',
        name: 'WebSphere Application Server',
        type: 'SERVICE',
        tier: 'APPLICATION',
        healthScore: 62,
        status: 'DEGRADED',
        metrics: { p95LatencyMs: 620, errorRatePercent: 12.4, throughputRps: 420 },
        dependencies: ['node-mq', 'node-db2'],
      },
      {
        id: 'node-mq',
        name: 'IBM MQ Series',
        type: 'QUEUE',
        tier: 'MIDDLEWARE',
        healthScore: 71,
        status: 'DEGRADED',
        metrics: { p95LatencyMs: 120, errorRatePercent: 4.2, throughputRps: 380 },
        dependencies: ['node-db2'],
      },
      {
        id: 'node-db2',
        name: 'IBM DB2 Database (Z/OS)',
        type: 'DATABASE',
        tier: 'DATA',
        healthScore: 48,
        status: 'CRITICAL',
        metrics: { p95LatencyMs: 7140, errorRatePercent: 18.2, throughputRps: 210 },
        dependencies: ['node-downstream'],
      },
      {
        id: 'node-downstream',
        name: 'Downstream Core Bank API',
        type: 'EXTERNAL',
        tier: 'DATA',
        healthScore: 95,
        status: 'HEALTHY',
        metrics: { p95LatencyMs: 475, errorRatePercent: 0.1, throughputRps: 180 },
        dependencies: [],
      },
    ];
  }

  async getIncidents(): Promise<VitalisIncident[]> {
    const overview = await this.getCommandCenterOverview();
    return overview.activeIncidents;
  }

  async getRcaByIncidentId(incidentId: string): Promise<VitalisRcaReport | null> {
    const incs = await this.getIncidents();
    const inc = incs.find((i) => i.id === incidentId);
    return inc?.rca || null;
  }

  async getEvidenceForRequest(traceId: string): Promise<VitalisEvidence[]> {
    const inc = (await this.getIncidents())[0];
    return inc?.rca?.evidenceItems || [];
  }
}
