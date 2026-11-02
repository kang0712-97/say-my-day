const {chromium}=require('/Users/gimgang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const D=path.dirname(__dirname),Q=__dirname;
(async()=>{
fs.mkdirSync(path.join(Q,'tmp'),{recursive:true});
const context=await chromium.launchPersistentContext(path.join(Q,'browser-profile'),{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,viewport:{width:1600,height:974},args:['--no-sandbox','--disable-dev-shm-usage'],env:{...process.env,TMPDIR:path.join(Q,'tmp')}});
const page=context.pages()[0]||await context.newPage();
const errors=[];page.on('pageerror',x=>errors.push(String(x)));
await page.goto('file://'+path.join(D,'발표.html'),{waitUntil:'load'});await page.waitForTimeout(300);
const report={errors,slides:[],interactions:[],brokenImages:[],externalLibraries:[],print:null};
async function audit(name){
 return await page.evaluate(name=>{
 const s=document.querySelector('.slide.active'),sr=s.getBoundingClientRect(),scale=sr.width/1920;
 const visible=e=>{const st=getComputedStyle(e),r=e.getBoundingClientRect();return r.width>0&&r.height>0&&st.visibility!=='hidden'&&st.display!=='none'&&!e.closest('[hidden]')};
 const nodes=Array.from(s.querySelectorAll('*')).filter(visible);
 const overflow=nodes.filter(e=>{const r=e.getBoundingClientRect();return r.right>sr.right+2||r.bottom>sr.bottom+2||r.left<sr.left-2||r.top<sr.top-2}).map(e=>({tag:e.tagName,cls:e.className,text:(e.textContent||'').slice(0,60)}));
 const clipped=nodes.filter(e=>e.children.length===0&&e.textContent.trim()&&((e.scrollWidth>e.clientWidth+3&&e.clientWidth>0)||(e.scrollHeight>e.clientHeight+3&&e.clientHeight>0))).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,60),scroll:[e.scrollWidth,e.scrollHeight],client:[e.clientWidth,e.clientHeight]}));
 const fonts=nodes.filter(e=>e.children.length===0&&e.textContent.trim()).map(e=>parseFloat(getComputedStyle(e).fontSize));
 const imgs=nodes.filter(e=>e.tagName==='IMG').map(e=>({src:e.getAttribute('src'),objectFit:getComputedStyle(e).objectFit,natural:[e.naturalWidth,e.naturalHeight]}));
 const body=s.querySelector('.body').getBoundingClientRect(),src=s.querySelector('.source').getBoundingClientRect();
 return {name,title:s.dataset.title,ratio:sr.width/sr.height,overflow,clipped,minFontPx:Math.min(...fonts),minFontPt:Math.min(...fonts)*.75,images:imgs,bodySourceGap:(src.top-body.bottom)/scale,notes:s.querySelectorAll('aside.notes p').length};
 },name);
}
for(let i=1;i<=17;i++){
 await page.evaluate(i=>window.deck.go(i),i);await page.waitForTimeout(250);
 report.slides.push(await audit('slide-'+i));
 await page.screenshot({path:path.join(Q,'slide-'+String(i).padStart(2,'0')+'.png')});
 const groups=await page.locator('.slide.active .tab-group').count();
 for(let g=0;g<groups;g++){
  const group=page.locator('.slide.active .tab-group').nth(g),buttons=group.locator(':scope>.tabs>button'),count=await buttons.count();
  for(let t=0;t<count;t++){
   await buttons.nth(t).click();await page.waitForTimeout(80);
   report.interactions.push(await audit('slide-'+i+'-tab-'+g+'-'+t));
   const sourceToggle=page.locator('.slide.active .source-toggle:visible');
   if(await sourceToggle.count()){
    await sourceToggle.click();report.interactions.push(await audit('slide-'+i+'-original-'+t));
    await page.screenshot({path:path.join(Q,'slide-'+i+'-original-'+t+'.png')});await sourceToggle.click();
   }
   if([11,13,14].includes(i))await page.screenshot({path:path.join(Q,'slide-'+i+'-tab-'+t+'.png')});
  }
  await buttons.first().click();
 }
 const selectors=['[data-flips] .flip-card','[data-tradeoffs] .tradeoff','[data-accordion] .acc-item>button','[data-workflow] .workflow-steps button','[data-incidents] .incident-list button','[data-reveal] .reveal-item'];
 for(const sel of selectors){
  const list=page.locator('.slide.active '+sel),count=await list.count();
  for(let j=0;j<count;j++){
   await list.nth(j).click();await page.waitForTimeout(50);
   report.interactions.push(await audit('slide-'+i+'-'+sel+'-'+j));
   if(i===15)await page.screenshot({path:path.join(Q,'slide-15-case-'+j+'.png')});
  }
 }
}
await page.evaluate(()=>window.deck.go(1));await page.keyboard.press('ArrowRight');
report.keyboardRight=await page.locator('#counter').innerText();await page.keyboard.press('End');report.keyboardEnd=await page.locator('#counter').innerText();await page.keyboard.press('Home');report.keyboardHome=await page.locator('#counter').innerText();
await page.keyboard.press('n');report.notesToggle=await page.locator('#notes-panel').isVisible();report.visibleNoteLines=await page.locator('#notes-body p').count();await page.keyboard.press('n');
await page.evaluate(()=>window.deck.go(17));await page.locator('[data-goto="13"]').click();report.appendixJump=await page.locator('#counter').innerText();
await page.evaluate(()=>window.deck.go(3));await page.locator('.slide.active [data-enlarge]:visible').click();report.imageEnlarge=await page.locator('#lightbox').evaluate(e=>e.open);await page.keyboard.press('Escape');
await page.evaluate(()=>window.deck.go(11));await page.locator('.slide.active .tabs>button').nth(1).click();await page.locator('input[type=range]').evaluate(e=>{e.value=70;e.dispatchEvent(new Event('input',{bubbles:true}));});report.slider=await page.locator('output').innerText();
await page.evaluate(()=>window.deck.go(4));await page.locator('.slide.active .tabs>button').nth(1).click();const video=page.locator('.slide.active .tab-panel:not([hidden]) video');report.video=await video.evaluate(v=>({readyState:v.readyState,error:v.error?.message||null,duration:v.duration,currentTime:v.currentTime,start:v.dataset.start,end:v.dataset.end}));
report.brokenImages=await page.locator('img[src]').evaluateAll(xs=>xs.filter(x=>!x.complete||!x.naturalWidth).map(x=>x.getAttribute('src')));
report.externalLibraries=await page.locator('script[src],link[rel=stylesheet]').evaluateAll(xs=>xs.map(x=>x.src||x.href));
await page.emulateMedia({media:'print'});await page.pdf({path:path.join(Q,'print-check.pdf'),preferCSSPageSize:true,printBackground:true});
report.print=await page.evaluate(()=>Array.from(document.querySelectorAll('.slide')).map(s=>({width:s.offsetWidth,height:s.offsetHeight,visibility:getComputedStyle(s).visibility,breakAfter:getComputedStyle(s).breakAfter})));
fs.writeFileSync(path.join(Q,'browser-review.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({slides:report.slides.length,states:report.interactions.length,errors,overflow:[...report.slides,...report.interactions].filter(x=>x.overflow.length||x.clipped.length),broken:report.brokenImages,keyboard:[report.keyboardRight,report.keyboardEnd,report.keyboardHome],video:report.video},null,2));
await context.close();
})().catch(e=>{console.error(e);process.exit(1)});

