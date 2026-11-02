const {chromium}=require('/Users/gimgang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');const Q=__dirname,D=path.dirname(Q);
(async()=>{
fs.mkdirSync(path.join(Q,'tmp'),{recursive:true});fs.mkdirSync(path.join(Q,'screens'),{recursive:true});
const c=await chromium.launchPersistentContext(path.join(Q,'browser'),{headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',viewport:{width:1600,height:964},args:['--no-sandbox'],env:{...process.env,TMPDIR:path.join(Q,'tmp')}});
const page=c.pages()[0];const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('file://'+path.join(D,'발표_리디자인.html'));await page.evaluate(()=>document.fonts.ready);
const report={errors,states:[],responsive:[],video:[],navigation:{}};
async function audit(name){
 return await page.evaluate(name=>{
 const s=document.querySelector('.slide.active'),r=s.getBoundingClientRect(),vp=document.querySelector('.viewport').getBoundingClientRect(),mobile=innerWidth<=760;
 const visible=x=>{const q=x.getBoundingClientRect(),st=getComputedStyle(x);return q.width>0&&q.height>0&&st.visibility!=='hidden'&&st.display!=='none'&&!x.closest('[hidden]')};
 const els=Array.from(s.querySelectorAll('*')).filter(visible);
 const overflow=els.filter(x=>{if(x.closest('.cover-art'))return false;const b=x.getBoundingClientRect();return b.right>r.right+2||b.left<r.left-2||(!mobile&&(b.bottom>r.bottom+2||b.top<r.top-2))}).map(x=>({tag:x.tagName,cls:x.className,text:x.textContent.slice(0,70)}));
 const clipped=els.filter(x=>x.children.length===0&&x.textContent.trim()&&x.clientWidth>0&&x.clientHeight>0&&(x.scrollWidth>x.clientWidth+3||x.scrollHeight>x.clientHeight+3)).map(x=>({tag:x.tagName,cls:x.className,text:x.textContent.slice(0,70)}));
 const source=s.querySelector('.source'),sr=source?.getBoundingClientRect();
 const overlapSource=sr?els.filter(x=>x!==source&&!x.contains(source)&&x.children.length===0&&x.textContent.trim()).filter(x=>{const b=x.getBoundingClientRect();return b.bottom>sr.top+1&&b.top<sr.bottom-1&&b.right>sr.left&&b.left<sr.right}).map(x=>({tag:x.tagName,cls:x.className,text:x.textContent.slice(0,70)})):[];
 return {name,title:s.dataset.title,overflow,clipped,overlapSource,ratio:r.width/r.height,documentFits:document.body.scrollWidth<=innerWidth+1,navFits:document.querySelector('.nav').scrollWidth<=innerWidth+1};
 },name);
}
async function capture(n,name){await page.waitForTimeout(450);await page.screenshot({path:path.join(Q,'screens',name||('slide-'+String(n).padStart(2,'0')+'.png'))})}
for(let n=1;n<=14;n++){
 await page.evaluate(n=>window.presentation.go(n),n);await page.waitForTimeout(450);report.states.push(await audit('slide-'+n));await capture(n);
 const gs=page.locator('.slide.active [data-group]');for(let j=0;j<await gs.count();j++){
  const g=gs.nth(j),bs=g.locator(':scope>.switches>button');
  for(let k=0;k<await bs.count();k++){
   await bs.nth(k).click();await page.waitForTimeout(70);report.states.push(await audit('slide-'+n+'-tab-'+k));
   if(n===14){
    const selects=page.locator('.slide.active .panel:not([hidden]) select');
    if(await selects.count()){
     const count=await selects.locator('option').count();
     for(let z=0;z<count;z++){await selects.selectOption(String(z));report.states.push(await audit('record-'+k+'-'+z))}
     await selects.selectOption('0');
    }
   }
  }
  await bs.first().click();
 }
 for(const selector of ['[data-question]','[data-focus]','[data-return] button','[data-prompt-step]','[data-case]']){
  const bs=page.locator('.slide.active '+selector);
  for(let k=0;k<await bs.count();k++){await bs.nth(k).click();report.states.push(await audit('slide-'+n+'-'+selector+'-'+k));}
 }
}
await page.evaluate(()=>window.presentation.go(4));
for(let i=0;i<4;i++){
 await page.locator('[data-scene]').nth(i).click();await page.waitForTimeout(550);
 report.video.push(await page.locator('#demo-video').evaluate(v=>({time:v.currentTime,ready:v.readyState,error:v.error?.message||null,playing:!v.paused})));
 await page.locator('#demo-video').evaluate(v=>v.pause());
}
await page.locator('[data-video-expand]').click();await page.waitForTimeout(300);report.videoDialog=await page.locator('#video-dialog').evaluate(d=>d.open);await page.keyboard.press('Escape');
await page.keyboard.press('n');report.notes=await page.locator('#notes-dialog').evaluate(d=>({open:d.open,paragraphs:d.querySelectorAll('#notes-content p').length}));await page.keyboard.press('Escape');
await page.keyboard.press('Home');report.navigation.home=await page.locator('#count').innerText();await page.keyboard.press('ArrowRight');report.navigation.right=await page.locator('#count').innerText();await page.keyboard.press('End');report.navigation.end=await page.locator('#count').innerText();
await page.evaluate(()=>window.presentation.go(3));await page.locator('.slide.active [data-zoom]:visible').click();report.zoom=await page.locator('#zoom-dialog').evaluate(d=>d.open);await page.keyboard.press('Escape');
await page.locator('#evidence-nav').click();report.navigation.evidence=await page.locator('#count').innerText();await page.locator('.slide.active [data-evidence="0"]').click();report.navigation.record=await page.locator('#count').innerText();
for(const size of [{width:1280,height:800},{width:390,height:844}]){
 await page.setViewportSize(size);
 for(let n=1;n<=14;n++){
  await page.evaluate(n=>window.presentation.go(n),n);await page.waitForTimeout(40);report.responsive.push(await audit(size.width+'-'+n));
  if(size.width===390&&[1,3,4,9,10,11,14].includes(n))await page.screenshot({path:path.join(Q,'screens','mobile-'+n+'.png'),fullPage:true});
 }
}
report.broken=await page.locator('img[src]').evaluateAll(xs=>xs.filter(x=>!x.complete||!x.naturalWidth).map(x=>x.src));
report.external=await page.locator('script[src],link[rel=stylesheet]').evaluateAll(xs=>xs.map(x=>x.src||x.href));
await page.setViewportSize({width:1600,height:964});await page.emulateMedia({media:'print'});await page.pdf({path:path.join(Q,'print-check.pdf'),preferCSSPageSize:true,printBackground:true});
fs.writeFileSync(path.join(Q,'qa.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({states:report.states.length,mobileStates:report.responsive.length,errors,problems:[...report.states,...report.responsive].filter(x=>x.overflow.length||x.clipped.length||x.overlapSource.length||!x.documentFits||!x.navFits),video:report.video,notes:report.notes,broken:report.broken,navigation:report.navigation},null,2));
await c.close();
})().catch(e=>{console.error(e);process.exit(1)});

