// Run from universal/backend. Uses the same source boundary as the board, without starting a server.
require('ts-node/register');
const { PageEvidenceService } = require('../src/learning-library/page-teaching/page-evidence.service');
const { OcrDocumentVisionService } = require('../src/learning-library/extraction/ocr-document-vision.service');
(async()=>{
 const service=new PageEvidenceService(new OcrDocumentVisionService(), {}, {});
 const page=await service.builtin(process.argv[2] || 'evs-class-5',process.argv[3] || '46');
 console.log(JSON.stringify({bookId:page.bookId,page:page.physicalPage,status:page.status,totalPages:page.totalPages,width:page.width,height:page.height,sourceHash:page.sourceHash,blocks:page.blocks.length,excerpt:page.blocks.slice(0,5).map(b=>b.text)},null,2));
 if(page.status!=='READY'||!page.blocks.length) process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
