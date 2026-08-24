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
              traceId: '7f8e2d1a-4c9b-4b7a-9aab-2e1c918c6d11',
              requestId: 'req_01J923K8Y2QW5X7V5B1GJ8K2M9',
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
              spans: [],
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

describe('OBS-001 Step 7B: Observe Cockpit Visual Blueprint', () => {
  it('should render the top header and blueprint value propositions', () => {
    render(<ObserveCockpitPage />);
    expect(screen.getAllByText(/EKAGURU OBSERVE/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/No more F12 DevTools/i)).toBeInTheDocument();
    expect(screen.getByText(/Find issues in seconds/i)).toBeInTheDocument();
  });

  it('should render KPI cards and system health detail', async () => {
    render(<ObserveCockpitPage />);
    expect(screen.getByText(/Total Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Success Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Duration \(p95\)/i)).toBeInTheDocument();
  });

  it('should render the Waterfall View and Root Cause Diagnosis when trace loads', async () => {
    render(<ObserveCockpitPage />);
    expect(await screen.findByText(/REQUEST 360 – WATERFALL VIEW/i)).toBeInTheDocument();
    expect(await screen.findByText(/Root Cause/i)).toBeInTheDocument();
    expect(await screen.findByText(/DATABASE Query Timeout/i)).toBeInTheDocument();
  });
});
