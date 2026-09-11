import {Test} from "@nestjs/testing";
import {ValidationPipe} from "@nestjs/common";
import {JwtModule,JwtService} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import {PrismaClient} from "@prisma/client";
import * as request from "supertest";
import {randomUUID} from "crypto";
import {AuthController} from "./auth.controller";
import {AuthService} from "./auth.service";
import {JwtStrategy} from "./jwt.strategy";
import {AuthRateLimitGuard} from "./auth-rate-limit.guard";
import {PrismaService} from "../learning-library/prisma.service";
import {RecoveryService} from "./recovery.service";
import {MailerService} from "./mailer.service";

describe("Verified authentication (real database)",()=>{
 const db=new PrismaClient(),tag="auth-check-"+randomUUID(),email=tag+"@example.invalid",password="Test-password-"+randomUUID(),secret=randomUUID();
 const previousSecret=process.env.JWT_SECRET;
 let app:any,jwt:JwtService;
 beforeAll(async()=>{
  process.env.JWT_SECRET=secret;
  const module=await Test.createTestingModule({imports:[PassportModule,JwtModule.register({secret})],controllers:[AuthController],providers:[AuthService,JwtStrategy,AuthRateLimitGuard,RecoveryService,MailerService,{provide:PrismaService,useValue:db}]}).compile();
  app=module.createNestApplication();app.useGlobalPipes(new ValidationPipe({whitelist:true,transform:true}));await app.init();jwt=module.get(JwtService);
 });
 afterAll(async()=>{if(previousSecret===undefined)delete process.env.JWT_SECRET;else process.env.JWT_SECRET=previousSecret;try{await db.parent.deleteMany({where:{email:{in:[email,"legacy-"+email]}}});}finally{await app?.close();await db.$disconnect();}});
 it("stores a password hash and never honors a requested admin role",async()=>{
  const result=await request(app.getHttpServer()).post("/auth/register").send({email,password,name:"Disposable test parent",role:"ADMIN"}).expect(201);
  expect(result.body.user.role).toBe("PARENT");expect(result.body.user.authVersion).toBe(2);
  expect(JSON.stringify(result.body)).not.toContain(password);
  const parent=await db.parent.findUnique({where:{email},include:{credential:true}});
  expect(parent.credential.passwordHash).not.toContain(password);expect(parent.credential.passwordHash).toMatch(/^scrypt-v1:/);
 });
 it("checks the password and accepts a verified token",async()=>{
  await request(app.getHttpServer()).post("/auth/login").send({email,password:"incorrect-password"}).expect(401);
  const result=await request(app.getHttpServer()).post("/auth/login").send({email,password}).expect(201);
  const me=await request(app.getHttpServer()).get("/auth/me").set("Authorization","Bearer "+result.body.access_token).expect(200);
  expect(me.body.email).toBe(email);expect(me.body.role).toBe("PARENT");
 });
 it("rejects the old password-free admin/demo paths and legacy tokens",async()=>{
  for(const address of ["admin@ekaguru.com","demo@ekaguru.com"])await request(app.getHttpServer()).post("/auth/login").send({email:address,password:"any-password"}).expect(401);
  const legacy=jwt.sign({sub:"admin-001",email:"admin@ekaguru.com",role:"ADMIN"});
  await request(app.getHttpServer()).get("/auth/me").set("Authorization","Bearer "+legacy).expect(401);
 });
 it("does not auto-create unknown accounts or let a password claim an older account",async()=>{
  await request(app.getHttpServer()).post("/auth/login").send({email:"missing-"+email,password}).expect(401);
  expect(await db.parent.findUnique({where:{email:"missing-"+email}})).toBeNull();
  await db.parent.create({data:{email:"legacy-"+email,name:"Legacy fixture"}});
  await request(app.getHttpServer()).post("/auth/register").send({email:"legacy-"+email,password,name:"Claim attempt"}).expect(409);
  await request(app.getHttpServer()).post("/auth/login").send({email:"legacy-"+email,password}).expect(401);
 });
 it("recovers a legacy account through email ownership, revokes older sessions and verifies the address",async()=>{
  const mailer=app.get(MailerService) as MailerService;
  const before=mailer.outbox.length;
  await request(app.getHttpServer()).post("/auth/recovery/request").send({email:"nobody-"+email}).expect(200);
  expect(mailer.outbox.length).toBe(before);
  await request(app.getHttpServer()).post("/auth/recovery/request").send({email:"legacy-"+email}).expect(200);
  const mail=mailer.outbox[mailer.outbox.length-1];expect(mail.to).toBe("legacy-"+email);
  const token=/token=([A-Za-z0-9_-]+)/.exec(mail.text)![1];
  const stored=await db.parentRecoveryToken.findMany({where:{parent:{email:"legacy-"+email}}});
  expect(stored.length).toBe(1);expect(stored[0].tokenHash).not.toBe(token);
  const newPassword="Recovered-password-"+randomUUID();
  await request(app.getHttpServer()).post("/auth/recovery/confirm").send({token,password:"short"}).expect(400);
  await request(app.getHttpServer()).post("/auth/recovery/confirm").send({token,password:newPassword}).expect(200);
  await request(app.getHttpServer()).post("/auth/recovery/confirm").send({token,password:newPassword}).expect(401);
  const login=await request(app.getHttpServer()).post("/auth/login").send({email:"legacy-"+email,password:newPassword}).expect(201);
  expect(login.body.user.emailVerified).toBe(true);
  await request(app.getHttpServer()).get("/auth/me").set("Authorization","Bearer "+login.body.access_token).expect(200);
  await request(app.getHttpServer()).post("/auth/recovery/request").send({email:"legacy-"+email}).expect(200);
  const second=/token=([A-Za-z0-9_-]+)/.exec(mailer.outbox[mailer.outbox.length-1].text)![1];
  await request(app.getHttpServer()).post("/auth/recovery/confirm").send({token:second,password:newPassword+"-2"}).expect(200);
  await request(app.getHttpServer()).get("/auth/me").set("Authorization","Bearer "+login.body.access_token).expect(401);
  await request(app.getHttpServer()).post("/auth/login").send({email:"legacy-"+email,password:newPassword}).expect(401);
  await request(app.getHttpServer()).post("/auth/login").send({email:"legacy-"+email,password:newPassword+"-2"}).expect(201);
 });
});
