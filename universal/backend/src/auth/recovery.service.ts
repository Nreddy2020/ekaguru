import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../learning-library/prisma.service";
import { hashPassword } from "./password";

export type RecoveryPurpose = "PASSWORD_RESET" | "EMAIL_VERIFY";
const TTL_MS: Record<RecoveryPurpose, number> = {
  PASSWORD_RESET: 30 * 60 * 1000,
  EMAIL_VERIFY: 24 * 60 * 60 * 1000,
};

export interface TokenIssue {
  parentId: string;
  email: string;
  token: string;
  expiresAt: Date;
}

/**
 * Single-use, hashed, expiring tokens prove email ownership.
 * A completed password reset also claims legacy accounts that never had a
 * verified credential, because delivery to the mailbox established ownership.
 */
@Injectable()
export class RecoveryService {
  private readonly logger = new Logger(RecoveryService.name);
  constructor(private readonly prisma: PrismaService) {}

  static hash(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
  private normalise(email: unknown) {
    if (typeof email !== "string" || !email.includes("@") || email.length > 254)
      return null;
    return email.trim().toLowerCase();
  }

  /** Issues a token for an existing account; returns null when no account matches. */
  async issue(email: unknown, purpose: RecoveryPurpose): Promise<TokenIssue | null> {
    const normalised = this.normalise(email);
    if (!normalised) return null;
    const parent = await this.prisma.parent.findFirst({
      where: { email: { equals: normalised, mode: "insensitive" } },
    });
    if (!parent) return null;
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + TTL_MS[purpose]);
    await this.prisma.$transaction([
      // Only one live token per purpose; older unused tokens are retired.
      this.prisma.parentRecoveryToken.updateMany({
        where: { parentId: parent.id, purpose, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.parentRecoveryToken.create({
        data: {
          parentId: parent.id,
          purpose,
          tokenHash: RecoveryService.hash(token),
          expiresAt,
        },
      }),
    ]);
    return { parentId: parent.id, email: parent.email, token, expiresAt };
  }

  private async consume(token: unknown, purpose: RecoveryPurpose) {
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{32,128}$/.test(token))
      throw new UnauthorizedException("This link is not valid.");
    const record = await this.prisma.parentRecoveryToken.findUnique({
      where: { tokenHash: RecoveryService.hash(token) },
    });
    if (
      !record ||
      record.purpose !== purpose ||
      record.usedAt ||
      record.expiresAt.getTime() < Date.now()
    )
      throw new UnauthorizedException(
        "This link has expired or was already used. Request a new one.",
      );
    return record;
  }

  /** Sets a new password, revokes older sessions and marks the email verified. */
  async confirmReset(token: unknown, password: unknown) {
    if (
      typeof password !== "string" ||
      password.length < 12 ||
      password.length > 1024
    )
      throw new BadRequestException("Use a password of at least 12 characters.");
    const record = await this.consume(token, "PASSWORD_RESET");
    const passwordHash = await hashPassword(password);
    const now = new Date();
    const [, credential] = await this.prisma.$transaction([
      this.prisma.parentRecoveryToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.parentCredential.upsert({
        where: { parentId: record.parentId },
        create: { parentId: record.parentId, passwordHash },
        update: { passwordHash, credentialVersion: { increment: 1 } },
      }),
      this.prisma.parent.update({
        where: { id: record.parentId },
        data: { emailVerifiedAt: now },
      }),
    ]);
    return { parentId: record.parentId, credentialVersion: credential.credentialVersion };
  }

  async confirmEmail(token: unknown) {
    const record = await this.consume(token, "EMAIL_VERIFY");
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.parentRecoveryToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.parent.update({
        where: { id: record.parentId },
        data: { emailVerifiedAt: now },
      }),
    ]);
    return { parentId: record.parentId, emailVerifiedAt: now };
  }
}
