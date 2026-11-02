const {chromium}=require('/Users/gimgang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const Q=__dirname,D=path.dirname(Q);
(async()=>{
const c=await chromium.launchPersistentContext(path.join(Q,'final-browser'),{headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',viewport:{width:1600,height:974},args:['--no-sandbox'],env:{...process.env,TMPDIR:path.join(Q,'tmp')}});
const p=c.pages()[0],errors=[];p.on('pageerror',e=>errors.push(String(e)));
await p.goto('file://'+path.join(D,'발표.html'));
const result={errors,responsive:[]};
for(const size of [{width:1920,height:1080},{width:1280,height:800},{width:390,height:844}]){
 await p.setViewportSize(size);await p.waitForTimeout(60);
 result.responsive.push(await p.evaluate(size=>{
 const b=document.body,r=document.querySelector('.stage').getBoundingClientRect(),v=document.querySelector('.viewport').getBoundingClientRect(),nav=document.querySelector('.chrome');
 return {size,stageWithinViewport:r.left>=-1&&r.right<=v.right+1&&r.top>=-1&&r.bottom<=v.bottom+1,navFits:nav.scrollWidth<=nav.clientWidth+1,documentFits:b.scrollWidth<=innerWidth};
 },size));
}
await p.setViewportSize({width:1600,height:974});await p.evaluate(()=>window.deck.go(4));
let v=p.locator('.slide.active .tab-panel:not([hidden]) video');
await v.evaluate(async v=>{v.muted=true;await v.play()});await p.waitForTimeout(800);
result.fullVideo=await v.evaluate(v=>({ready:v.readyState,error:v.error?.message||null,advanced:v.currentTime>.25}));await v.evaluate(v=>v.pause());
await p.locator('.slide.active .tabs>button').nth(1).click();v=p.locator('.slide.active .tab-panel:not([hidden]) video');
await v.evaluate(async v=>{v.muted=true;await v.play()});await p.waitForTimeout(600);
result.pdfVideo=await v.evaluate(v=>({ready:v.readyState,error:v.error?.message||null,advanced:v.currentTime>Number(v.dataset.start)+.2,range:[Number(v.dataset.start),Number(v.dataset.end)]}));await v.evaluate(v=>{v.currentTime=Number(v.dataset.end)-.1;});await p.waitForTimeout(500);
result.pdfStopsAtEnd=await v.evaluate(v=>v.paused&&Math.abs(v.currentTime-Number(v.dataset.end))<.15);
await p.evaluate(()=>window.deck.go(1));await p.locator('.slide.active h1').click();result.backgroundClick=await p.locator('#counter').innerText();
await p.evaluate(()=>window.deck.go(14));await p.locator('.slide.active .workflow-steps button').nth(2).click();await p.locator('.slide.active .tabs>button').nth(1).click();
await p.waitForTimeout(300);await p.screenshot({path:path.join(Q,'final-14-design.png')});
await p.evaluate(()=>window.deck.go(13));await p.locator('.slide.active .tabs>button').nth(4).click();await p.waitForTimeout(300);await p.screenshot({path:path.join(Q,'final-13-decision.png')});
await p.evaluate(()=>window.deck.go(15));await p.locator('.slide.active .incident-list button').nth(1).click();await p.waitForTimeout(300);await p.screenshot({path:path.join(Q,'final-15-case.png')});
fs.writeFileSync(path.join(Q,'final-checks.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await c.close();
})().catch(e=>{console.error(e);process.exit(1)});

