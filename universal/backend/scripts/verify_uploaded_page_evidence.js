require('ts-node/register');
const { Readable }=require('stream');
const { PDFDocument, StandardFonts }=require('../../frontend/node_modules/pdf-lib');
const { PageEvidenceService }=require('../src/learning-library/page-teaching/page-evidence.service');
const { OcrDocumentVisionService }=require('../src/learning-library/extraction/ocr-document-vision.service');
(async()=>{
 const doc=await PDFDocument.create();const font=await doc.embedFont(StandardFonts.Helvetica);
 for(const text of ['A triangle contains three sides.','Plants need water to grow.'])doc.addPage([600,800]).drawText(text,{x:40,y:700,size:22,font});
 const bytes=Buffer.from(await doc.save());
 const prisma={learningMaterial:{findUnique:async()=>({id:'fixture',learnerId:'learner',storageKey:'fixture.pdf',mimeType:'application/pdf'})},learnerConceptMastery:{findMany:async()=>[{masteryScore:.6}]}};
 const service=new PageEvidenceService(new OcrDocumentVisionService(),prisma,{getFileStream:async()=>Readable.from(bytes)});
 const page=await service.material('fixture','2');
 const text=page.blocks.map(b=>b.text).join(' ');
 console.log(JSON.stringify({bookId:page.bookId,page:page.physicalPage,totalPages:page.totalPages,status:page.status,depth:page.recommendedDepth,text},null,2));
 if(page.physicalPage!==2||page.totalPages!==2||!text.includes('Plants')||text.includes('triangle'))throw new Error('Wrong source page');
})().catch(e=>{console.error(e);process.exitCode=1;});
