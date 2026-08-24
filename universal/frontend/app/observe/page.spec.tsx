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
              traceId: 'trc_step7c_1',
              requestId: 'req_step7c_1',
              clientPlatform: 'browser',
              clientRoute: '/upload',
              httpMethod: 'POST',
              httpUrl: '/api/v2/learning-materials/upload',
              httpStatus: 200,
              startTimeIso: new Date().toISOString(),
              startTimeMs: Date.now() - 150,
              durationMs: 150,
              status: 'OK',
              spans: [],
            },
          ],
          statistics: {
            totalRequests: 1,
            successCount: 1,
            errorCount: 0,
            avgDurationMs: 150,
            p50DurationMs: 150,
            p95DurationMs: 150,
            errorRatePercent: 0,
            activeTracesCount: 0,
          },
        }),
    });
  }

  return Promise.reject(new Error('Unknown URL'));
}) as any;

describe('OBS-001 Step 7C: Data-Driven Observe Diagnostic Center', () => {
  it('should render the clean operational header without developer implementation steps', () => {
    render(<ObserveCockpitPage />);
    expect(screen.getByText(/EKAGURU OBSERVE/i)).toBeInTheDocument();
    expect(screen.getByText(/Application Diagnostic Center/i)).toBeInTheDocument();
  });

  it('should render real telemetry statistics and live request stream', async () => {
    render(<ObserveCockpitPage />);
    expect(await screen.findByText(/Live Request Stream/i)).toBeInTheDocument();
    expect(screen.getByText(/System Healthy/i)).toBeInTheDocument();
  });
});
