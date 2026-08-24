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
          memory: { status: 'HEALTHY', heapUsedMb: 45, heapTotalMb: 90, percentUsed: 97 },
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
              traceId: 'trc_nt7lhbb1_b8b15b953233d432',
              requestId: 'req_nt7lhbb1_09325c464293',
              clientPlatform: 'browser',
              clientRoute: '/api/v2/observe/traces?limit=100',
              httpMethod: 'GET',
              httpUrl: '/api/v2/observe/traces?limit=100',
              httpStatus: 200,
              startTimeIso: new Date().toISOString(),
              startTimeMs: Date.now() - 1,
              durationMs: 1,
              status: 'OK',
              spans: [],
            },
          ],
          statistics: {
            totalRequests: 309,
            successCount: 308,
            errorCount: 1,
            avgDurationMs: 6,
            p50DurationMs: 1,
            p95DurationMs: 6,
            errorRatePercent: 0.3,
            activeTracesCount: 309,
          },
        }),
    });
  }

  return Promise.reject(new Error('Unknown URL'));
}) as any;

describe('OBS-001 Step 7C: Observe Cockpit Exact Target Image Match', () => {
  it('should render the exact top navigation, KPI cards, and system health', () => {
    render(<ObserveCockpitPage />);
    expect(screen.getByText(/EKAGURU OBSERVE/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Success Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed Requests/i)).toBeInTheDocument();
  });

  it('should render the Waterfall View and bottom M2 pipeline overview', async () => {
    render(<ObserveCockpitPage />);
    expect(await screen.findByText(/REQUEST 360 – WATERFALL VIEW/i)).toBeInTheDocument();
    expect(screen.getByText(/M2 PIPELINE OVERVIEW \(LAST 10 MIN\)/i)).toBeInTheDocument();
    expect(screen.getByText(/SYSTEM HEALTH DETAIL/i)).toBeInTheDocument();
  });
});
