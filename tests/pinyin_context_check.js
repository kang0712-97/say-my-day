const path=require('path'); const root=process.argv[2]||path.join(__dirname,'..'); // 실행: node tests/pinyin_context_check.js (단어를 문장 속에서 계산해도 了·得·不·一 발음이 맞는지 확인)
const pp=require(path.join(root,'app/public/vendor/pinyin-pro.js')); pp.customPinyin(require(path.join(root,'app/public/pinyin-fix.js')));
const pinyin=pp.pinyin;
function wordTokens(words){ const whole=pinyin(words.map(w=>w.zh).join(''),{type:'all'});
  if (whole.length!==words.reduce((n,w)=>n+[...w.zh].length,0)) return words.map(w=>pinyin(w.zh,{type:'all'}));
  let pos=0; return words.map(w=>{const n=[...w.zh].length; const t=whole.slice(pos,pos+n); pos+=n; return t;}); }
const show=(ws)=>wordTokens(ws.map(zh=>({zh}))).map(t=>t.map(x=>x.isZh?x.pinyin:x.origin).join(' ')).join(' | ');
const cases=[
 [['天气','突然','变','冷','了','。'],'tiān qì | tū rán | biàn | lěng | le | 。'],
 [['我','吃','了','饭'],'wǒ | chī | le | fàn'],
 [['他','来','不','了','。'],'tā | lái | bù | liǎo | 。'],
 [['一','个','人'],'yí | gè | rén'],
 [['不','错'],'bú | cuò'],
 [['玩','得','很','开心'],'wán | de | hěn | kāi xīn'],
 [['今天','天气','很','好','，','ABC','很','好'],null],
];
let bad=0; for (const [ws,want] of cases){ const got=show(ws); const ok=want===null||got===want; if(!ok) bad++; console.log((ok?'OK  ':'DIFF'),ws.join(''),'=>',got, ok?'':'  기대:'+want); }
// 실제 저장 데이터: 단어별 발음이 문장 전체 발음과 같아졌는지
const fs=require('fs'); let n=0,diff=0; for (const f of fs.readdirSync(path.join(root,'tests')).filter(f=>/^real_.*\.json$/.test(f))) { let d; try{d=JSON.parse(fs.readFileSync(path.join(root,'tests',f),'utf8'));}catch{continue;} for (const s of ((d.result||d).sentences||[])) { if(!s.zh||!Array.isArray(s.words)) continue; n++; const a=wordTokens(s.words).flat().map(x=>x.isZh?x.pinyin:x.origin).join(' '); const b=pinyin(s.zh,{type:'all'}).map(x=>x.isZh?x.pinyin:x.origin).join(' '); if(a!==b){diff++; console.log('불일치',s.zh);} } }
console.log(`저장된 문장 ${n}개 중 문장 전체 발음과 다른 문장 ${diff}개`); process.exit(bad?1:0);
