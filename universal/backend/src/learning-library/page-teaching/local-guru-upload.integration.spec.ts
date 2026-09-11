import {Test} from "@nestjs/testing";
import {ValidationPipe} from "@nestjs/common";
import {JwtModule,JwtService} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import {PrismaClient} from "@prisma/client";
import * as request from "supertest";
import {createHash,randomUUID} from "crypto";
import {UploadController} from "../upload/upload.controller";
import {UploadService} from "../upload/upload.service";
import {FileValidatorService} from "../upload/file-validator.service";
import {PageEvidenceController} from "./page-evidence.controller";
import {PageEvidenceQueueService} from "./page-evidence-queue.service";
import {PageEvidenceService} from "./page-evidence.service";
import {OcrDocumentVisionService} from "../extraction/ocr-document-vision.service";
import {LearningLibraryAuthGuard} from "../learning-library-auth.guard";
import {RecoveryService} from "../../auth/recovery.service";
import {MailerService} from "../../auth/mailer.service";
import {PrismaService} from "../prisma.service";
import {StorageService} from "../storage/storage.service";
import {LocalStorageService} from "../storage/local-storage.service";
import {JwtStrategy} from "../../auth/jwt.strategy";
import {LearnerController} from "../learner.controller";
import {AuthController} from "../../auth/auth.controller";
import {AuthService} from "../../auth/auth.service";
import {AuthRateLimitGuard} from "../../auth/auth-rate-limit.guard";
import {hashPassword} from "../../auth/password";
import {LearnerService} from "../learner.service";
const {PDFDocument,StandardFonts}=require("../../../../frontend/node_modules/pdf-lib");

describe("Local PDF to authenticated Guru source (real database and storage)",()=>{
 const id="guru-upload-"+randomUUID(),db=new PrismaClient();
 let app:any,storage:StorageService,token:string,other:string,bytes:Buffer,materialId:string;
 const password="Fixture-password-"+randomUUID();
 const previousSecret=process.env.JWT_SECRET;
 beforeAll(async()=>{
   const secret=randomUUID();process.env.JWT_SECRET=secret;
   await db.parent.create({data:{id,email:id+"@example.invalid",name:"Disposable test parent",credential:{create:{passwordHash:await hashPassword(password)}}}});
   await db.child.create({data:{id,parentId:id,name:"Disposable test child",age:10}});
   await db.learner.create({data:{id,legacyChildId:id,name:"Disposable test learner",learnerType:"CHILD"}});
   const module=await Test.createTestingModule({
     imports:[PassportModule.register({defaultStrategy:"jwt"}),JwtModule.register({secret})],
     controllers:[UploadController,PageEvidenceController,LearnerController,AuthController],
     providers:[AuthService,AuthRateLimitGuard,RecoveryService,MailerService,UploadService,FileValidatorService,PageEvidenceService,PageEvidenceQueueService,OcrDocumentVisionService,StorageService,LocalStorageService,LearningLibraryAuthGuard,JwtStrategy,LearnerService,{provide:PrismaService,useValue:db}]
   }).compile();
   app=module.createNestApplication();app.useGlobalPipes(new ValidationPipe({whitelist:true,transform:true}));await app.init();
   storage=module.get(StorageService);const jwt=module.get(JwtService);
   const login=await request(app.getHttpServer()).post("/auth/login").send({email:id+"@example.invalid",password}).expect(201);token=login.body.access_token;other=jwt.sign({authVersion:2,sub:"other-"+id,role:"PARENT"});
   const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica);
   for(const line of ["A triangle contains three sides.","Plants use sunlight to make food."])pdf.addPage([500,650]).drawText(line,{x:30,y:550,size:18,font});
   bytes=Buffer.from(await pdf.save());
 },30000);
 afterAll(async()=>{
   try{
     const materials=await db.learningMaterial.findMany({where:{learnerId:id}});
     for(const material of materials){if(storage&&material.storageKey?.startsWith("v2/source/"+id+"/"+id+"/"))await storage.deleteFile(material.storageKey);}
     await db.document.deleteMany({where:{material:{learnerId:id}}});
     await db.learningMaterial.deleteMany({where:{learnerId:id}});
     await db.learner.deleteMany({where:{id}});await db.child.deleteMany({where:{id}});await db.parent.deleteMany({where:{id}});
   }finally{
     if(previousSecret===undefined)delete process.env.JWT_SECRET;else process.env.JWT_SECRET=previousSecret;
     if(app)await app.close();await db.$disconnect();
   }
 });
 it("lists only owned learners and refuses unauthorized PDF uploads",async()=>{
   const own=await request(app.getHttpServer()).get("/api/v2/learners").set("Authorization","Bearer "+token).expect(200);
   expect(own.body.data.map((l:any)=>l.id)).toContain(id);
   const foreign=await request(app.getHttpServer()).get("/api/v2/learners").set("Authorization","Bearer "+other).expect(200);
   expect(foreign.body.data).toEqual([]);
   await request(app.getHttpServer()).post("/api/v2/learning-materials/upload").field("learnerId",id).field("title",id).field("materialType","TEXTBOOK").attach("file",bytes,"source.pdf").expect(401);
   await request(app.getHttpServer()).post("/api/v2/learning-materials/upload").set("Authorization","Bearer "+other).field("learnerId",id).field("title",id).field("materialType","TEXTBOOK").attach("file",bytes,"source.pdf").expect(403);
 });
 it("uploads original bytes and returns only the requested physical page",async()=>{
   const uploaded=await request(app.getHttpServer()).post("/api/v2/learning-materials/upload").set("Authorization","Bearer "+token).field("learnerId",id).field("title",id).field("materialType","TEXTBOOK").attach("file",bytes,"source.pdf").expect(201);
   expect(uploaded.body.data.checksum).toBe(createHash("sha256").update(bytes).digest("hex"));
   expect(uploaded.body.data.learnerId).toBe(id);materialId=uploaded.body.data.id;
   const page=await request(app.getHttpServer()).get("/api/v2/learning-materials/"+materialId+"/pages/2/evidence").set("Authorization","Bearer "+token).expect(200);
   expect(page.body.bookId).toBe(materialId);expect(page.body.physicalPage).toBe(2);expect(page.body.totalPages).toBe(2);
   const text=page.body.blocks.map((b:any)=>b.text).join(" ");
   expect(text).toContain("Plants");expect(text).not.toContain("triangle");
   expect(page.body.imageDataUrl).toBeUndefined();expect(page.body.imageUrl).toMatch(new RegExp(String.raw`^/api/v2/learning-materials/${materialId}/pages/2/image\?exp=\d+&sig=`));
   const image=await request(app.getHttpServer()).get(page.body.imageUrl).expect(200);
   expect(image.headers["content-type"]).toBe("image/png");expect(image.headers["cache-control"]).toBe("private, max-age=3600");expect(image.headers["etag"]).toBe('"'+page.body.sourceHash+'"');
   await request(app.getHttpServer()).get(page.body.imageUrl.replace(/sig=.{4}/,"sig=zzzz")).expect(403);
   await request(app.getHttpServer()).get(page.body.imageUrl.replace(/exp=\d+/,"exp=1")).expect(403);
   await request(app.getHttpServer()).get("/api/v2/learning-materials/"+materialId+"/pages/2/evidence").set("Authorization","Bearer "+other).expect(403);
 },30000);
});
