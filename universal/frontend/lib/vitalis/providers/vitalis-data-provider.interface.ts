import {
  VitalisEnvironment,
  VitalisRequest,
  VitalisInventoryItem,
  VitalisTopologyNode,
  VitalisCommandCenterOverview,
  VitalisIncident,
} from '../domain/types';

export interface VitalisRcaReport {
  [key: string]: any;
}

export interface VitalisEvidence {
  [key: string]: any;
}

export interface IVitalisDataProvider {
  getEnvironment?(): VitalisEnvironment;
  getCommandCenterOverview?(): Promise<VitalisCommandCenterOverview>;
  getLiveRequests?(params?: {
    scope?: 'APPLICATION' | 'ALL' | 'OBSERVE_INTERNAL';
    limit?: number;
    search?: string;
  }): Promise<VitalisRequest[]>;
  getRequestById?(requestIdOrTraceId: string): Promise<VitalisRequest | null>;
  getApplicationInventory?(): Promise<VitalisInventoryItem[]>;
  getTopology?(): Promise<VitalisTopologyNode[]>;
  getIncidents?(): Promise<VitalisIncident[]>;
  getRcaByIncidentId?(incidentId: string): Promise<VitalisRcaReport | null>;
  getEvidenceForRequest?(traceId: string): Promise<VitalisEvidence[]>;
  [key: string]: any;
}

export type VitalisDataProvider = IVitalisDataProvider;
export type VitalisLiveRequestsFilter = any;
export type VitalisInvestigationRequest = any;

