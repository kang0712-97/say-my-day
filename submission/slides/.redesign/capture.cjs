const {chromium}=require('/Users/gimgang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),Q=__dirname,D=path.dirname(Q);
(async()=>{const c=await chromium.launchPersistentContext(path.join(Q,'capture-browser'),{headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',viewport:{width:1600,height:964},args:['--no-sandbox'],env:{...process.env,TMPDIR:path.join(Q,'tmp')}});const p=c.pages()[0];await p.goto('file://'+path.join(D,'발표_리디자인.html'));await p.evaluate(()=>document.fonts.ready);
for(let n=1;n<=14;n++){await p.evaluate(n=>window.presentation.go(n),n);await p.waitForTimeout(450);await p.screenshot({path:path.join(Q,'screens','slide-'+String(n).padStart(2,'0')+'.png')});}
await p.setViewportSize({width:390,height:844});for(const n of [1,3,4,9,10,11,14]){await p.evaluate(n=>window.presentation.go(n),n);await p.waitForTimeout(450);await p.screenshot({path:path.join(Q,'screens','mobile-'+n+'.png')});}
await p.setViewportSize({width:1600,height:964});await p.emulateMedia({media:'print'});await p.pdf({path:path.join(Q,'print-check.pdf'),preferCSSPageSize:true,printBackground:true});
console.log('Fresh screenshots: 14 desktop / 7 mobile. Print captured.');await c.close();})().catch(e=>{console.error(e);process.exit(1)});

