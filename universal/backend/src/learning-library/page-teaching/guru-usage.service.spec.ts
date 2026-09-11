import { GuruUsageService } from "./guru-usage.service";

function memoryPrisma() {
  const rows = new Map<string, any>();
  const key = (userId: string, day: string) => userId + "|" + day;
  return {
    rows,
    guruModelUsage: {
      findUnique: jest.fn(async ({ where }: any) => {
        const { userId, day } = where.userId_day;
        return rows.get(key(userId, day)) || null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const k = key(data.userId, data.day);
        if (rows.has(k)) throw Object.assign(new Error("unique"), { code: "P2002" });
        const row = { ...data };
        rows.set(k, row);
        return row;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const row = rows.get(key(where.userId, where.day));
        const kind = "lessons" in where ? "lessons" : "queries";
        if (!row || !(row[kind] < where[kind].lt)) return { count: 0 };
        row[kind] += data[kind].increment;
        return { count: 1 };
      }),
    },
  };
}

describe("GuruUsageService", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });
  it("creates the daily row on first use and counts reservations", async () => {
    const prisma = memoryPrisma();
    const service = new GuruUsageService(prisma as any);
    await service.reserve("user", "lessons");
    await service.reserve("user", "queries");
    await service.reserve("user", "queries");
    const summary = await service.summary("user");
    expect(summary.lessons.used).toBe(1);
    expect(summary.queries.used).toBe(2);
    expect(summary.queries.remaining).toBe(198);
  });
  it("rejects with 429 once the configured limit is reached", async () => {
    process.env.GURU_DAILY_LESSON_LIMIT = "2";
    const prisma = memoryPrisma();
    const service = new GuruUsageService(prisma as any);
    await service.reserve("user", "lessons");
    await service.reserve("user", "lessons");
    await expect(service.reserve("user", "lessons")).rejects.toMatchObject({
      status: 429,
    });
    expect(prisma.rows.get("user|" + service.day()).lessons).toBe(2);
  });
  it("treats a zero limit as disabled and ignores malformed limits", async () => {
    process.env.GURU_DAILY_QUERY_LIMIT = "0";
    const service = new GuruUsageService(memoryPrisma() as any);
    await expect(service.reserve("user", "queries")).rejects.toMatchObject({
      status: 429,
    });
    process.env.GURU_DAILY_QUERY_LIMIT = "lots";
    expect(service.queryLimit).toBe(200);
  });
  it("survives a concurrent first insert without double counting", async () => {
    const prisma = memoryPrisma();
    const service = new GuruUsageService(prisma as any);
    await Promise.all([
      service.reserve("user", "queries"),
      service.reserve("user", "queries"),
    ]);
    expect(prisma.rows.get("user|" + service.day()).queries).toBe(2);
  });
  it("requires an authenticated account", async () => {
    await expect(
      new GuruUsageService(memoryPrisma() as any).reserve("", "queries"),
    ).rejects.toMatchObject({ status: 401 });
  });
});
