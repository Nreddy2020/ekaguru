const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer-core');
const {PDFDocument,StandardFonts} = require('pdf-lib');
(async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'ekaguru-classroom-check-'));
 const fixture=path.join(directory,'Classroom source check.pdf');
 const pdf=await PDFDocument.create();const font=await pdf.embedFont(StandardFonts.Helvetica);
 for(const line of ['A triangle contains three sides.','Plants use sunlight to make food.']){
   const page=pdf.addPage([500,650]);page.drawText(line,{x:40,y:550,size:18,font});
 }
 await fs.writeFile(fixture,await pdf.save());
 let browser;
 try{
  console.log("Launching isolated test browser");
  browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,pipe:true});
  console.log("Browser launched");
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3001/learn',{waitUntil:'domcontentloaded'});console.log('Library loaded');
  const clickText=async(text)=>{const buttons=await page.$$('button');for(const b of buttons){if((await b.evaluate(el=>el.textContent)).trim()===text){await b.click();return;}}throw new Error('Missing button '+text);};
  await clickText('Upload New Book');
  await (await page.$('input[type=file]')).uploadFile(fixture);
  await clickText('Start Ingestion');console.log('Upload started');
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('a')).some(a=>a.textContent.includes('Open Book')&&a.href.includes('/library/book-')),{timeout:30000});
  console.log("Original saved");
  const link=await page.$('a[href*="/library/book-"]');await link.click();
  await page.waitForSelector('[data-testid="page-teaching-board"]',{timeout:30000});
  assert.ok(page.url().includes("/library/book-") && page.url().includes("page=1"));
  assert.ok(await page.$('[data-testid="approved-classroom"]'));
  assert.equal(await page.$eval('img[alt="Original physical page 1"]',e=>e.naturalWidth>0),true);
  console.log('Classroom loaded');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-testid="page-teaching-board"]');
  await page.click('button[aria-label="Next page"]');
  await page.waitForSelector('img[alt="Original physical page 2"]');
  await page.waitForSelector('[data-testid="page-teaching-board"]');
  await clickText('Play Guru');
  await page.waitForFunction(()=>document.body.innerText.includes('Plants use sunlight'),{timeout:15000});
  await page.waitForFunction(()=>document.querySelector('input[aria-label="Missing word"]'),{timeout:15000});
  assert.equal(await page.$eval('[data-testid="board-canvas"]',e=>e.textContent.includes('triangle')),false);
  assert.deepEqual(errors,[]);
  const source=await page.$eval('img[alt="Original physical page 2"]',e=>({width:e.naturalWidth,height:e.naturalHeight}));
  console.log(JSON.stringify({upload:'passed',persistence:'passed',openedPage:2,source,progressivePlayback:'passed',checkpoint:'blocked pending learner',pageErrors:errors}));
 }finally{
  if(browser)await browser.close();
  await fs.unlink(fixture);await fs.rmdir(directory);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
