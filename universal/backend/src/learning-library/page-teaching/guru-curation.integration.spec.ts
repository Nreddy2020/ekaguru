import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaClient } from "@prisma/client";
import * as request from "supertest";
import { randomUUID } from "crypto";
import { authSigningSecret } from "../../auth/auth-config";
import { JwtStrategy } from "../../auth/jwt.strategy";
import { RolesGuard } from "../../auth/roles.guard";
import { PrismaService } from "../prisma.service";
import { GuruCurationController } from "./guru-curation.controller";
import { GuruEvaluationService } from "./evaluation/guru-evaluation.service";
import { GuruConceptMappingService } from "./guru-concept-mapping.service";
import { PageEvidenceService } from "./page-evidence.service";
import { GuruPlannerService } from "./guru-planner.service";
import { GuruModelService } from "./guru-model.service";

/**
 * Real-database check of the curator surface: role enforcement, corpus import,
 * consensus reporting and the rule that only prepared lessons can be reviewed.
 * Uses uniquely named disposable rows and removes only those rows.
 */
describe("Guru curation HTTP surface (real database)", () => {
  const db = new PrismaClient();
  const bookId = "curation-check-" + randomUUID();
  let app: any;
  let admin: string;
  let parent: string;
  let dbAvailable = true;
  beforeAll(async () => {
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      dbAvailable = false;
      return;
    }
    const module = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({ secret: authSigningSecret() }),
      ],
      controllers: [GuruCurationController],
      providers: [
        JwtStrategy,
        RolesGuard,
        GuruEvaluationService,
        GuruConceptMappingService,
        GuruModelService,
        { provide: PageEvidenceService, useValue: {} },
        { provide: GuruPlannerService, useValue: {} },
        { provide: PrismaService, useValue: db },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const jwt = module.get(JwtService);
    admin = jwt.sign({ authVersion: 2, sub: "curator-" + bookId, email: "curator@example.invalid", role: "ADMIN" });
    parent = jwt.sign({ authVersion: 2, sub: "parent-" + bookId, email: "parent@example.invalid", role: "PARENT" });
  });
  afterAll(async () => {
    try {
      await db.guruEvaluationCase.deleteMany({ where: { bookId } });
    } finally {
      if (app) await app.close();
      await db.$disconnect();
    }
  });
  const cases = [
    { bookId, physicalPage: 1, subject: "Curation check", gradeBand: "PRIMARY", depth: "basis" },
    { bookId, physicalPage: 2, subject: "Curation check", gradeBand: "PRIMARY", depth: "deep", language: "hi" },
  ];
  it("refuses parents and unauthenticated callers", async () => {
    if (!dbAvailable) return;
    await request(app.getHttpServer()).get("/api/v2/guru/evaluation/summary").expect(401);
    await request(app.getHttpServer())
      .get("/api/v2/guru/evaluation/summary")
      .set("Authorization", "Bearer " + parent)
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/v2/guru/evaluation/cases/import")
      .set("Authorization", "Bearer " + parent)
      .send({ cases })
      .expect(403);
    expect(await db.guruEvaluationCase.count({ where: { bookId } })).toBe(0);
  });
  it("imports cases idempotently, lists consensus and blocks reviews of unprepared lessons", async () => {
    if (!dbAvailable) return;
    const first = await request(app.getHttpServer())
      .post("/api/v2/guru/evaluation/cases/import")
      .set("Authorization", "Bearer " + admin)
      .send({ cases })
      .expect(201);
    expect(first.body).toEqual({ created: 2, skipped: 0 });
    const again = await request(app.getHttpServer())
      .post("/api/v2/guru/evaluation/cases/import")
      .set("Authorization", "Bearer " + admin)
      .send({ cases })
      .expect(201);
    expect(again.body).toEqual({ created: 0, skipped: 2 });
    const list = await request(app.getHttpServer())
      .get("/api/v2/guru/evaluation/cases?subject=Curation%20check")
      .set("Authorization", "Bearer " + admin)
      .expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body[0]).toMatchObject({ prepared: false, consensus: "UNREVIEWED", reviewCount: 0 });
    const rubric = await request(app.getHttpServer())
      .get("/api/v2/guru/evaluation/rubric")
      .set("Authorization", "Bearer " + admin)
      .expect(200);
    const scores = Object.fromEntries(rubric.body.criteria.map((c: any) => [c.id, 4]));
    await request(app.getHttpServer())
      .post("/api/v2/guru/evaluation/cases/" + list.body[0].id + "/reviews")
      .set("Authorization", "Bearer " + admin)
      .send({ scores })
      .expect(400);
    const packet = await request(app.getHttpServer())
      .get("/api/v2/guru/evaluation/cases/" + list.body[0].id + "/packet.md")
      .set("Authorization", "Bearer " + admin)
      .expect(200);
    expect(packet.headers["content-type"]).toContain("text/markdown");
    expect(packet.text).toContain("Lesson not yet prepared");
    const summary = await request(app.getHttpServer())
      .get("/api/v2/guru/evaluation/summary")
      .set("Authorization", "Bearer " + admin)
      .expect(200);
    expect(summary.body.groups.filter((g: any) => g.subject === "Curation check")).toHaveLength(2);
    expect(summary.body.approvedDepths).toEqual(expect.any(Array));
    await request(app.getHttpServer())
      .post("/api/v2/guru/evaluation/cases")
      .set("Authorization", "Bearer " + admin)
      .send({ bookId, physicalPage: 1, subject: "Curation check", gradeBand: "PRIMARY", depth: "basis" })
      .expect(409);
    await request(app.getHttpServer())
      .post("/api/v2/guru/evaluation/cases")
      .set("Authorization", "Bearer " + admin)
      .send({ bookId, physicalPage: 1, subject: "Curation check", gradeBand: "PRIMARY", depth: "extreme" })
      .expect(400);
  });
  it("rejects concept-mapping decisions for unknown lessons without side effects", async () => {
    if (!dbAvailable) return;
    await request(app.getHttpServer())
      .post("/api/v2/guru/lessons/missing-" + bookId + "/concept-mappings/propose")
      .set("Authorization", "Bearer " + admin)
      .expect(404);
    await request(app.getHttpServer())
      .post("/api/v2/guru/concept-mappings/missing-" + bookId + "/review")
      .set("Authorization", "Bearer " + admin)
      .send({ status: "VERIFIED" })
      .expect(404);
    await request(app.getHttpServer())
      .post("/api/v2/guru/concept-mappings/missing-" + bookId + "/review")
      .set("Authorization", "Bearer " + parent)
      .send({ status: "VERIFIED" })
      .expect(403);
  });
});
