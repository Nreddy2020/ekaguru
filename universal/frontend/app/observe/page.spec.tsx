import React from 'react';
import { render, screen } from '@testing-library/react';
import ObserveCockpitPage from './page';

global.fetch = jest.fn().mockImplementation((url: string) => {
  if (url.includes('/health')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          timestamp: new Date().toISOString(),
          status: 'HEALTHY',
          backend: { status: 'UP', uptimeSeconds: 120, nodeVersion: 'v20.0.0', pid: 1234 },
          database: { status: 'UP', latencyMs: 5 },
          memory: { status: 'HEALTHY', heapUsedMb: 45, heapTotalMb: 90, percentUsed: 50 },
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
              traceId: 'trc_gui_refine_1',
              requestId: 'req_gui_refine_1',
              clientPlatform: 'browser',
              clientRoute: '/library',
              httpMethod: 'GET',
              httpUrl: '/api/v2/learning-materials',
              httpStatus: 200,
              startTimeIso: new Date().toISOString(),
              startTimeMs: Date.now() - 25,
              durationMs: 25,
              status: 'OK',
              spans: [
                {
                  spanId: 'spn_1',
                  traceId: 'trc_gui_refine_1',
                  requestId: 'req_gui_refine_1',
                  name: 'HTTP GET /api/v2/learning-materials',
                  kind: 'CONTROLLER',
                  startTimeMs: Date.now() - 25,
                  durationMs: 25,
                  status: 'OK',
                  attributes: {},
                },
                {
                  spanId: 'spn_2',
                  traceId: 'trc_gui_refine_1',
                  requestId: 'req_gui_refine_1',
                  name: 'Prisma Learner.findMany',
                  kind: 'DATABASE',
                  startTimeMs: Date.now() - 20,
                  durationMs: 4,
                  status: 'OK',
                  attributes: { model: 'Learner', action: 'findMany' },
                },
              ],
            },
          ],
          statistics: {
            totalRequests: 1,
            successCount: 1,
            errorCount: 0,
            avgDurationMs: 25,
            p50DurationMs: 25,
            p95DurationMs: 25,
            errorRatePercent: 0,
            activeTracesCount: 1,
          },
        }),
    });
  }

  return Promise.reject(new Error('Unknown URL'));
}) as any;

describe('OBS-001: Refined Production Observe Cockpit GUI', () => {
  it('should render the clean production header and summary KPI cards', () => {
    render(<ObserveCockpitPage />);
    expect(screen.getByText(/EKAGURU OBSERVE/i)).toBeInTheDocument();
    expect(screen.getByText(/Understand every request, find problems, and fix them/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Success Rate/i)).toBeInTheDocument();
  });

  it('should render real Prisma spans under Request 360 waterfall view', async () => {
    render(<ObserveCockpitPage />);
    expect(await screen.findByText(/REQUEST 360: GET/i)).toBeInTheDocument();
    expect(await screen.findByText(/Prisma Learner.findMany/i)).toBeInTheDocument();
    expect(screen.getByText(/Subsystem Execution Journey/i)).toBeInTheDocument();
  });
});
