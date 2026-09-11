require('dotenv').config({quiet:true});
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
 const tables=await p.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('DocumentPage','GuruLessonArtifact','GuruTeachingSession','GuruTeachingEvent','_prisma_migrations')");
 const columns=await p.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='DocumentPage'");
 console.log(JSON.stringify({tables,documentPageColumns:columns},null,2));
})().finally(()=>p.$disconnect());
