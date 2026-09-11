import { RecoveryService } from "./recovery.service";
import { verifyPassword } from "./password";

function prisma() {
  const tokens: any[] = [];
  const db: any = {
    tokens,
    parent: {
      findFirst: jest.fn(async ({ where }: any) =>
        where.email.equals === "owner@example.invalid"
          ? { id: "parent-1", email: "owner@example.invalid" }
          : null,
      ),
      update: jest.fn(async ({ data }: any) => data),
    },
    parentRecoveryToken: {
      updateMany: jest.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const t of tokens)
          if (
            (where.id ? t.id === where.id : t.parentId === where.parentId && t.purpose === where.purpose) &&
            (where.usedAt === undefined || t.usedAt === where.usedAt)
          ) {
            Object.assign(t, data);
            count++;
          }
        return { count };
      }),
      create: jest.fn(async ({ data }: any) => {
        const row = { id: "t" + (tokens.length + 1), usedAt: null, ...data };
        tokens.push(row);
        return row;
      }),
      findUnique: jest.fn(async ({ where }: any) => tokens.find((t) => t.tokenHash === where.tokenHash) || null),
    },
    parentCredential: {
      upsert: jest.fn(async ({ create, update }: any) => ({
        parentId: create.parentId,
        passwordHash: update.passwordHash,
        credentialVersion: 2,
      })),
    },
  };
  db.$transaction = jest.fn(async (ops: any) => Promise.all(ops));
  return db;
}

describe("RecoveryService", () => {
  it("issues nothing for unknown or malformed addresses", async () => {
    const service = new RecoveryService(prisma());
    expect(await service.issue("nobody@example.invalid", "PASSWORD_RESET")).toBeNull();
    expect(await service.issue("not-an-email", "PASSWORD_RESET")).toBeNull();
    expect(await service.issue(42, "PASSWORD_RESET")).toBeNull();
  });
  it("stores only a hash, retires earlier tokens and expires them", async () => {
    const db = prisma();
    const service = new RecoveryService(db);
    const first = await service.issue("Owner@Example.invalid", "PASSWORD_RESET");
    const second = await service.issue("owner@example.invalid", "PASSWORD_RESET");
    expect(first!.token).not.toBe(second!.token);
    expect(db.tokens.map((t: any) => t.tokenHash)).not.toContain(first!.token);
    expect(db.tokens[0].usedAt).not.toBeNull();
    expect(db.tokens[1].usedAt).toBeNull();
    expect(second!.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(30 * 60 * 1000);
    await expect(service.confirmReset(first!.token, "a-long-enough-password")).rejects.toThrow(
      "expired or was already used",
    );
  });
  it("resets the password once, bumps the credential version and verifies the email", async () => {
    const db = prisma();
    const service = new RecoveryService(db);
    const issued = await service.issue("owner@example.invalid", "PASSWORD_RESET");
    await expect(service.confirmReset(issued!.token, "short")).rejects.toThrow("at least 12 characters");
    await expect(service.confirmReset("bad token!", "a-long-enough-password")).rejects.toThrow("not valid");
    const result = await service.confirmReset(issued!.token, "a-long-enough-password");
    expect(result).toEqual({ parentId: "parent-1", credentialVersion: 2 });
    const upsert = db.parentCredential.upsert.mock.calls[0][0];
    expect(upsert.update.credentialVersion).toEqual({ increment: 1 });
    expect(await verifyPassword("a-long-enough-password", upsert.update.passwordHash)).toBe(true);
    expect(db.parent.update).toHaveBeenCalledWith({
      where: { id: "parent-1" },
      data: { emailVerifiedAt: expect.any(Date) },
    });
    await expect(service.confirmReset(issued!.token, "a-long-enough-password")).rejects.toThrow(
      "expired or was already used",
    );
  });
  it("keeps purposes separate and confirms email ownership", async () => {
    const db = prisma();
    const service = new RecoveryService(db);
    const verify = await service.issue("owner@example.invalid", "EMAIL_VERIFY");
    await expect(service.confirmReset(verify!.token, "a-long-enough-password")).rejects.toThrow(
      "expired or was already used",
    );
    const confirmed = await service.confirmEmail(verify!.token);
    expect(confirmed.parentId).toBe("parent-1");
    expect(db.tokens[0].usedAt).not.toBeNull();
    db.tokens[0].expiresAt = new Date(Date.now() - 1000);
    db.tokens[0].usedAt = null;
    await expect(service.confirmEmail(verify!.token)).rejects.toThrow("expired");
  });
});
