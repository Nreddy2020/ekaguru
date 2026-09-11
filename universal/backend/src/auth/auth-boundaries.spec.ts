import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { authSigningSecret } from './auth-config';

describe('Authentication boundaries', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
    jest.restoreAllMocks();
  });
  it('limits repeated attempts and allows a new window', () => {
    let now = 1000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    const guard = new AuthRateLimitGuard();
    const context = { switchToHttp: () => ({ getRequest: () => ({ ip: 'test-client' }) }) } as any;
    for (let i = 0; i < 20; i++) expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow('Too many sign-in attempts');
    now += 10 * 60 * 1000;
    expect(guard.canActivate(context)).toBe(true);
  });
  it('rejects missing or placeholder secrets outside tests', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(() => authSigningSecret()).toThrow('Configure JWT_SECRET');
    process.env.JWT_SECRET = 'ekaguru-secret-key-change-in-production';
    expect(() => authSigningSecret()).toThrow('Configure JWT_SECRET');
    process.env.JWT_SECRET = 'short';
    expect(() => authSigningSecret()).toThrow('Configure JWT_SECRET');
  });
});
