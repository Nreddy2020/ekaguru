require('dotenv').config({quiet:true});
require('ts-node/register');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {PrismaClient}=require('@prisma/client');
const {PDFDocument}=require('../../frontend/node_modules/pdf-lib');
const {UploadService}=require('../src/learning-library/upload/upload.service');
const {FileValidatorService}=require('../src/learning-library/upload/file-validator.service');
const {StorageService}=require('../src/learning-library/storage/storage.service');
const {LocalStorageService}=require('../src/learning-library/storage/local-storage.service');
const {LearningLibraryAuthGuard}=require('../src/learning-library/learning-library-auth.guard');
const db=new PrismaClient(),fixture='source-check-'+randomUUID();
const storage=new StorageService(new LocalStorageService());
(async()=>{
 await db.learner.create({data:{id:fixture,name:'Disposable source-identity verification',learnerType:'STUDENT'}});
 const service=new UploadService(db,storage,new FileValidatorService(),new LearningLibraryAuthGuard(db));
 const pdf=await PDFDocument.create();pdf.addPage([400,500]);const base=Buffer.from(await pdf.save());
 const first=Buffer.concat([base,Buffer.from(String.fromCharCode(10)+'% variant A')]);
 const second=Buffer.concat([base,Buffer.from(String.fromCharCode(10)+'% variant B')]);
 assert.equal(first.length,second.length);
 const upload=bytes=>service.handleFileUpload({learnerId:fixture,title:fixture,materialType:'TEXTBOOK'},{originalname:'same-name.pdf',mimetype:'application/pdf',buffer:bytes,size:bytes.length},{userId:fixture,role:'ADMIN'});
 const a=await upload(first),b=await upload(second),retry=await upload(second);
 assert.notEqual(a.data.id,b.data.id);assert.equal(retry.data.id,b.data.id);assert.equal(retry.duplicate,true);
 assert.equal(await db.learningMaterial.count({where:{learnerId:fixture}}),2);
 await storage.deleteFile(b.data.storageKey);
 const recovered=await upload(second);
 assert.notEqual(recovered.data.id,b.data.id);
 assert.equal(await storage.fileExists(recovered.data.storageKey),true);
 console.log(JSON.stringify({realPostgres:true,realFileStorage:true,sameMetadataDifferentBytes:'distinct materials',identicalBytes:'reused material',missingOriginal:'new source preserved',fixtureCleanup:'runs in finally'}));
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{
 try{
  const materials=await db.learningMaterial.findMany({where:{learnerId:fixture}});
  for(const material of materials){
   if(material.storageKey && material.storageKey.startsWith('v2/source/'+fixture+'/'+fixture+'/'))await storage.deleteFile(material.storageKey);
  }
  await db.document.deleteMany({where:{material:{learnerId:fixture}}});
  await db.learningMaterial.deleteMany({where:{learnerId:fixture}});
  await db.learner.deleteMany({where:{id:fixture}});
 }finally{await db.$disconnect();}
});
