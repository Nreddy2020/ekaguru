import {
  generateClientTraceId,
  generateClientRequestId,
  getClientRoute,
} from './api-client';

describe('OBS-001 Step 6: Client Trace Propagation Helpers', () => {
  it('should generate valid client trace ID with prefix "trc_"', () => {
    const traceId = generateClientTraceId();
    expect(traceId).toMatch(/^trc_[a-z0-9]+_[a-f0-9]+$/);
  });

  it('should generate valid client request ID with prefix "req_"', () => {
    const reqId = generateClientRequestId();
    expect(reqId).toMatch(/^req_[a-z0-9]+_[a-f0-9]+$/);
  });

  it('should return safe client route fallback when window is not defined', () => {
    const route = getClientRoute();
    expect(typeof route).toBe('string');
    expect(route.length).toBeGreaterThan(0);
  });
});
