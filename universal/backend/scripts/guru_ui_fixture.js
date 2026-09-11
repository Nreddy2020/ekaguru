require('dotenv').config({quiet:true});
require('ts-node/register');
const fs=require('node:fs/promises'),path=require('node:path'),{randomUUID}=require('node:crypto'),{PrismaClient}=require('@prisma/client');
const fixturePath=path.resolve('uploads/guru-ui-fixture.json');
(async()=>{
 if(process.argv.includes('--cleanup')){
  const saved=JSON.parse(await fs.readFile(fixturePath,'utf8'));
  if(!saved.email.startsWith('guru-ui-check-')||!saved.email.endsWith('@example.invalid'))throw new Error('Not a verification fixture');
  const db=new PrismaClient();
  try{
   const parent=await db.parent.findFirst({where:{id:saved.parentId,email:saved.email}});if(!parent)throw new Error('Fixture identity changed');
   const learners=await db.learner.findMany({where:{legacyChild:{parentId:parent.id}},select:{id:true}});
   const ids=learners.map(l=>l.id),materials=await db.learningMaterial.findMany({where:{learnerId:{in:ids}}});
   const {StorageService}=require('../src/learning-library/storage/storage.service'),{LocalStorageService}=require('../src/learning-library/storage/local-storage.service');
   const storage=new StorageService(new LocalStorageService());
   for(const material of materials)if(material.storageKey?.startsWith('v2/source/'+parent.id+'/'))await storage.deleteFile(material.storageKey);
   await db.document.deleteMany({where:{materialId:{in:materials.map(m=>m.id)}}});
   await db.learningMaterial.deleteMany({where:{id:{in:materials.map(m=>m.id)}}});
   await db.learner.deleteMany({where:{id:{in:ids}}});await db.child.deleteMany({where:{parentId:parent.id}});await db.parent.delete({where:{id:parent.id}});
   await fs.unlink(fixturePath);console.log('Verification account and generated server data removed.');
  }finally{await db.$disconnect();}
 }else{
  try{await fs.access(fixturePath);throw new Error('A verification fixture already exists; finish it before creating another.');}catch(e){if(e.code!=='ENOENT')throw e;}
  const email='guru-ui-check-'+randomUUID()+'@example.invalid';
  const response=await fetch('http://127.0.0.1:20000/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Ekaguru-UI-verification-only-2026!',name:'Disposable classroom verification'})});
  const result=await response.json();if(!response.ok)throw new Error('Fixture registration failed: '+response.status);
  await fs.mkdir(path.dirname(fixturePath),{recursive:true});
  await fs.writeFile(fixturePath,JSON.stringify({parentId:result.user.sub,email}));
  console.log(JSON.stringify({email,fixtureCreated:true}));
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
