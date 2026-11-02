// 화면 문구 사전(T)의 언어별 키가 서로 같은지, data-t/data-th 키가 사전에 있는지, {자리표}가 같은지 검사한다.
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'app', 'public', 'index.html'), 'utf8');
const m = html.match(/const T = (\{[\s\S]*?\n\});\n/);
if (!m) { console.log('FAIL: T 사전을 찾지 못함'); process.exit(1); }
const T = eval('(' + m[1] + ')');
const langs = Object.keys(T), base = new Set(Object.keys(T.ko));
let bad = 0;
const fail = (s) => { bad++; console.log('FAIL', s); };
for (const l of langs) {
  const keys = new Set(Object.keys(T[l]));
  for (const k of base) if (!keys.has(k)) fail(`${l}에 키 없음: ${k}`);
  for (const k of keys) if (!base.has(k)) fail(`${l}에만 있는 키: ${k}`);
  for (const k of keys) if (base.has(k)) {
    const ph = (v) => (v.match(/\{\w+\}/g) || []).sort().join();
    if (ph(T[l][k]) !== ph(T.ko[k])) fail(`${l} 자리표 다름: ${k}`);
  }
}
for (const [, k] of html.matchAll(/data-th?="([\w.]+)"/g)) if (!base.has(k)) fail(`HTML이 쓰는 키가 사전에 없음: ${k}`);
console.log(bad ? `${bad}건 실패` : `통과: 언어 ${langs.join('·')}, 키 ${base.size}개`);
process.exit(bad ? 1 : 0);
