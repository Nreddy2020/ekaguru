import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VitalisObservePage from './page';

global.fetch = jest.fn().mockImplementation((url: string) => {
  if (url.includes('/health')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          timestamp: new Date().toISOString(),
          status: 'HEALTHY',
          backend: { status: 'UP', uptimeSeconds: 120, nodeVersion: 'v20.0.0', pid: 1234 },
          database: { status: 'UP', latencyMs: 4 },
          memory: { status: 'HEALTHY', heapUsedMb: 45, heapTotalMb: 90, percentUsed: 72 },
          storage: { status: 'ACCESSIBLE', uploadDirectory: './uploads', writable: true },
        }),
    });
  }

  if (url.includes('/traces')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            {
              traceId: 'trc_real_prisma_01',
              requestId: 'req_01J923K8Y2QW5X7V6B1GJ8K2M9',
              clientPlatform: 'browser',
              clientRoute: '/library',
              httpMethod: 'GET',
              httpUrl: '/api/v2/learning-materials',
              httpStatus: 200,
              startTimeIso: new Date().toISOString(),
              startTimeMs: Date.now() - 25,
              durationMs: 25,
              status: 'OK',
              trafficType: 'APPLICATION',
              spans: [
                {
                  spanId: 'spn_1',
                  traceId: 'trc_real_prisma_01',
                  name: 'HTTP GET /api/v2/learning-materials',
                  kind: 'CONTROLLER',
                  durationMs: 25,
                  status: 'OK',
                  attributes: {},
                },
                {
                  spanId: 'spn_2',
                  traceId: 'trc_real_prisma_01',
                  name: 'Prisma Learner.findMany',
                  kind: 'DATABASE',
                  durationMs: 4,
                  status: 'OK',
                  attributes: { model: 'Learner', action: 'findMany' },
                },
                {
                  spanId: 'spn_3',
                  traceId: 'trc_real_prisma_01',
                  name: 'Prisma LearningMaterial.findMany',
                  kind: 'DATABASE',
                  durationMs: 4,
                  status: 'OK',
                  attributes: { model: 'LearningMaterial', action: 'findMany' },
                },
              ],
            },
          ],
          statistics: {
            totalRequests: 2,
            successCount: 2,
            errorCount: 0,
            avgDurationMs: 25,
            p50DurationMs: 25,
            p95DurationMs: 25,
            errorRatePercent: 0,
            activeTracesCount: 2,
            inProgressCount: 0,
            applicationRequestsCount: 2,
            internalRequestsCount: 15,
          },
        }),
    });
  }

  return Promise.reject(new Error('Unknown URL'));
}) as any;

describe('VITALIS OBSERVE: Phase 1 Canonical Architecture & Cockpit', () => {
  it('should render the VITALIS header, mode switchers, and Command Center by default in LAB mode', async () => {
    render(<VitalisObservePage />);
    expect(screen.getByText(/VITALIS OBSERVE/i)).toBeInTheDocument();
    expect(screen.getByText(/LAB \(Ekaguru Live\)/i)).toBeInTheDocument();
    expect(screen.getByText(/DEMO \(Enterprise Simulator\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/Operational Score/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SLA Compliance/i).length).toBeGreaterThan(0);
  });

  it('should switch to Application Inventory view and render services catalog', async () => {
    render(<VitalisObservePage />);
    const inventoryButton = screen.getByText(/Application Inventory/i);
    fireEvent.click(inventoryButton);

    await waitFor(() => {
      expect(screen.getByText(/universal-backend/i)).toBeInTheDocument();
      expect(screen.getByText(/cognitive_memory \(PostgreSQL\)/i)).toBeInTheDocument();
    });
  });

  it('should switch to DEMO mode and show enterprise simulation banner and scenarios', async () => {
    render(<VitalisObservePage />);
    const demoButton = screen.getByText(/DEMO \(Enterprise Simulator\)/i);
    fireEvent.click(demoButton);

    await waitFor(() => {
      expect(screen.getByText(/DEMO MODE ACTIVE/i)).toBeInTheDocument();
    });
  });
});
