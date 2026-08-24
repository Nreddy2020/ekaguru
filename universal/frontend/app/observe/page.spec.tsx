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
              traceId: '7f8e2d1a-4c9b-4b7a-9aab-2e1c9f8b6d11',
              requestId: 'req_01J923K8Y2QW5X7V6B1GJ8K2M9',
              clientPlatform: 'browser',
              clientRoute: '/upload',
              httpMethod: 'POST',
              httpUrl: '/upload',
              httpStatus: 500,
              startTimeIso: new Date().toISOString(),
              startTimeMs: Date.now() - 8420,
              durationMs: 8420,
              status: 'ERROR',
              errorMessage: 'Database query timeout in ContentTopic insertion',
              spans: [
                {
                  spanId: 'spn_1',
                  traceId: '7f8e2d1a-4c9b-4b7a-9aab-2e1c9f8b6d11',
                  requestId: 'req_01J923K8Y2QW5X7V6B1GJ8K2M9',
                  name: 'HTTP POST /upload',
                  kind: 'CONTROLLER',
                  startTimeMs: Date.now() - 8420,
                  durationMs: 8420,
                  status: 'ERROR',
                  attributes: {},
                },
                {
                  spanId: 'spn_2',
                  traceId: '7f8e2d1a-4c9b-4b7a-9aab-2e1c9f8b6d11',
                  requestId: 'req_01J923K8Y2QW5X7V6B1GJ8K2M9',
                  name: 'Prisma ContentTopic.create',
                  kind: 'DATABASE',
                  startTimeMs: Date.now() - 8400,
                  durationMs: 7140,
                  status: 'ERROR',
                  errorMessage: 'Query timeout in ContentTopic insertion',
                  attributes: { model: 'ContentTopic', action: 'create' },
                },
              ],
            },
          ],
          statistics: {
            totalRequests: 1248,
            successCount: 1180,
            errorCount: 68,
            avgDurationMs: 412,
            p50DurationMs: 142,
            p95DurationMs: 812,
            errorRatePercent: 5.4,
            activeTracesCount: 5,
          },
        }),
    });
  }

  return Promise.reject(new Error('Unknown URL'));
}) as any;

describe('OBS-001: Pixel-Exact Production Observe Cockpit Matching media_1787599276294.jpg', () => {
  it('should render the top dashboard overview title, controls, and 5 KPI cards', () => {
    render(<ObserveCockpitPage />);
    expect(screen.getByText(/HOW IT WILL LOOK – DASHBOARD OVERVIEW/i)).toBeInTheDocument();
    expect(screen.getByText(/Auto Refresh/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Success Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Duration \(p95\)/i)).toBeInTheDocument();
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
  });

  it('should render Live Request Stream, Request 360 waterfall view, and bottom diagnostic panels', async () => {
    render(<ObserveCockpitPage />);
    expect(screen.getByText(/Live Request Stream/i)).toBeInTheDocument();
    expect(screen.getAllByText(/System Health/i).length).toBeGreaterThan(0);
    expect(await screen.findByText(/REQUEST 360 – WATERFALL VIEW/i)).toBeInTheDocument();
    expect(screen.getByText(/SYSTEM HEALTH DETAIL/i)).toBeInTheDocument();
    expect(screen.getByText(/M2 PIPELINE OVERVIEW \(Last 10 min\)/i)).toBeInTheDocument();
  });
});
