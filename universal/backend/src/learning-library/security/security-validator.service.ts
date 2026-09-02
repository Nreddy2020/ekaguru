import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ANONYMOUS';

export interface SecurityValidationResult {
  valid: boolean;
  sanitizedBookId: string;
  fileSizeBytes: number;
  magicByteValid: boolean;
  pathSafe: boolean;
  errors: string[];
}

@Injectable()
export class SecurityValidatorService {
  private readonly logger = new Logger(SecurityValidatorService.name);
  private readonly maxPdfSizeBytes = 50 * 1024 * 1024; // 50MB max upload

  // 1. Path Traversal & Injection Sanitization
  public sanitizeBookId(rawBookId: string): string {
    if (!rawBookId || typeof rawBookId !== 'string') {
      throw new BadRequestException('Invalid bookId: must be a non-empty string');
    }

    // Check for directory traversal attempts
    if (
      rawBookId.includes('..') ||
      rawBookId.includes('/') ||
      rawBookId.includes('\\') ||
      rawBookId.includes('\0') ||
      rawBookId.includes(':') ||
      rawBookId.includes('*') ||
      rawBookId.includes('?') ||
      rawBookId.includes('~')
    ) {
      this.logger.warn(`[SECURITY ALARM] Path traversal attempt detected: '${rawBookId}'`);
      throw new BadRequestException(`Security Violation: Illegal characters or path traversal in bookId '${rawBookId}'`);
    }

    // Allow only lowercase alphanumeric and hyphens
    const sanitized = rawBookId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (sanitized.length === 0 || sanitized.length > 64) {
      throw new BadRequestException('Invalid bookId length: must be between 1 and 64 characters');
    }

    return sanitized;
  }

  // 2. PDF Magic-Byte & Header Validation
  public validatePdfMagicBytes(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 5) return false;
    // Standard PDF files begin with %PDF- (hex: 25 50 44 46 2D)
    const header = buffer.subarray(0, 5).toString('ascii');
    return header.startsWith('%PDF-');
  }

  // 3. Decompression Bomb & Payload Bounds Guard
  public validateUploadPayload(rawBookId: string, buffer: Buffer): SecurityValidationResult {
    const errors: string[] = [];
    let sanitizedBookId = '';

    try {
      sanitizedBookId = this.sanitizeBookId(rawBookId);
    } catch (err: any) {
      errors.push(err.message);
    }

    const magicByteValid = this.validatePdfMagicBytes(buffer);
    if (!magicByteValid) {
      errors.push('File format violation: Missing or invalid %PDF- magic byte header');
    }

    const fileSizeBytes = buffer ? buffer.length : 0;
    if (fileSizeBytes === 0) {
      errors.push('Empty payload violation: PDF buffer has 0 bytes');
    } else if (fileSizeBytes > this.maxPdfSizeBytes) {
      errors.push(`Payload size violation: ${(fileSizeBytes / 1024 / 1024).toFixed(1)}MB exceeds maximum 50MB limit`);
    }

    const valid = errors.length === 0;
    return {
      valid,
      sanitizedBookId,
      fileSizeBytes,
      magicByteValid,
      pathSafe: errors.every((e) => !e.includes('Path traversal') && !e.includes('Illegal characters')),
      errors,
    };
  }

  // 4. Role-Based Access Control (RBAC)
  public validateRoleAccess(role: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      ADMIN: 3,
      TEACHER: 2,
      STUDENT: 1,
      ANONYMOUS: 0,
    };

    const userLevel = roleHierarchy[role] ?? 0;
    const requiredLevel = roleHierarchy[requiredRole] ?? 0;

    if (userLevel < requiredLevel) {
      this.logger.warn(`[AUTH REJECT] Role '${role}' denied access to resource requiring '${requiredRole}'`);
      throw new UnauthorizedException(`Access Denied: '${requiredRole}' permission required, caller has '${role}'`);
    }

    return true;
  }
}
