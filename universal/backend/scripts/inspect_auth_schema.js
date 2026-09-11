require('dotenv').config({quiet:true});const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
p.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('Parent','ParentCredential','_prisma_migrations')").then(rows=>console.log(JSON.stringify(rows))).finally(()=>p.$disconnect());

const secret=process.env.JWT_SECRET||"";console.log(JSON.stringify({jwtSecretPresent:Boolean(secret),jwtSecretPassesBasicCheck:secret.length>=32&&!/change-in-production|your.secret|replace.me/i.test(secret)}));
