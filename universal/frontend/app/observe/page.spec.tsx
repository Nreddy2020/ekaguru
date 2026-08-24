import React from 'react';
import { render, screen } from '@testing-library/react';
import ObserveDashboard from './page';

// Mock fetch API globally
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
              traceId: 'trc_1',
              requestId: 'req_1',
              clientPlatform: 'browser',
              clientRoute: '/upload',
              httpMethod: 'POST',
              httpUrl: '/upload/book',
              httpStatus: 200,
              startTimeIso: new Date().toISOString(),
              startTimeMs: Date.now() - 150,
              durationMs: 150,
              status: 'OK',
              spans: [],
            },
            {
              traceId: 'trc_2',
              requestId: 'req_2',
              clientPlatform: 'browser',
              clientRoute: '/upload',
              httpMethod: 'POST',
              httpUrl: '/upload/book',
              httpStatus: 500,
              startTimeIso: new Date().toISOString(),
              startTimeMs: Date.now() - 8000,
              durationMs: 8000,
              status: 'ERROR',
              spans: [
                {
                  spanId: 'spn_2',
                  traceId: 'trc_2',
                  name: 'M2.Extract',
                  kind: 'SERVICE',
                  startTimeMs: Date.now() - 8000,
                  durationMs: 8000,
                  status: 'ERROR',
                  errorMessage: 'Database connection timeout during extraction',
                },
              ],
            },
          ],
          statistics: {
            totalRequests: 2,
            successCount: 1,
            errorCount: 1,
            avgDurationMs: 4075,
            p50DurationMs: 150,
            p95DurationMs: 8000,
            errorRatePercent: 50,
            activeTracesCount: 2,
          },
        }),
    });
  }

  return Promise.reject(new Error('Unknown URL'));
}) as any;

describe('OBS-001 Step 7: Observe Dashboard Shell', () => {
  it('should render the EKAGURU OBSERVE header and System Healthy badge', async () => {
    render(<ObserveDashboard />);
    expect(screen.getByText(/EKAGURU OBSERVE/i)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostic Cockpit/i)).toBeInTheDocument();
  });

  it('should render quick filters for requests', async () => {
    render(<ObserveDashboard />);
    expect(screen.getByText(/All Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Uploads/i)).toBeInTheDocument();
    expect(screen.getByText(/Tutor/i)).toBeInTheDocument();
  });
});
