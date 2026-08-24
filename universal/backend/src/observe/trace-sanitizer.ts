/**
 * Sanitizes request headers, query params, and body attributes
 * to ensure strict privacy for child learners and zero secret leaks.
 */
export class TraceSanitizer {
  private static readonly SENSITIVE_KEYS = new Set([
    'authorization',
    'auth',
    'password',
    'passwordhash',
    'secret',
    'jwt',
    'token',
    'access_token',
    'refreshtoken',
    'cookie',
    'set-cookie',
    'creditcard',
    'cvv',
    'ssn',
  ]);

  /**
   * Redacts sensitive key-value pairs recursively.
   */
  static sanitizeAttributes(data: Record<string, any>): Record<string, any> {
    if (!data || typeof data !== 'object') return {};

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (
        this.SENSITIVE_KEYS.has(lowerKey) ||
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('jwt') ||
        lowerKey.includes('auth')
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeAttributes(value);
      } else if (typeof value === 'string' && value.length > 2000) {
        sanitized[key] = value.slice(0, 2000) + '... [TRUNCATED]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Sanitizes HTTP headers for trace metadata.
   */
  static sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
    if (!headers) return {};
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (this.SENSITIVE_KEYS.has(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' || typeof value === 'number') {
        sanitized[key] = String(value);
      }
    }
    return sanitized;
  }
}
