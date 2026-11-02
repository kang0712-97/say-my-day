// 개편 전 백업과 현재 index.html의 복습 일정(applySrs·dueLabel·INTERVALS)이 같은 입력에서 같은 값을 내는지 비교한다.
const fs = require('fs'), vm = require('vm'), path = require('path');
const [, , oldFile = 'backup/index_vault_v39.html', newFile = 'app/public/index.html'] = process.argv;
function grab(file) {
  const h = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const take = (re) => { const m = h.match(re); if (!m) throw new Error(file + ': ' + re); return m[0]; };
  const src = [take(/const DAY = [^\n]+/), take(/const INTERVALS = [^\n]+/), take(/function dueLabel\(w\) \{[\s\S]*?\n\}/), take(/function applySrs\(item, kind, ok\) \{[\s\S]*?\n\}/)].join('\n');
  let store = { word: [], sent: [] };
  const ctx = { Date: { now: () => 1.8e12 }, Math, L: (k, v) => (v ? k.replace(/\{(\w+)\}/g, (m, x) => v[x]) : k),
    loadWords: () => store.word, saveWords: (l) => (store.word = l), loadSents: () => store.sent, saveSents: (l) => (store.sent = l) };
  vm.createContext(ctx); vm.runInContext(src + '\nthis.dueLabel = dueLabel; this.applySrs = applySrs;', ctx);
  return { ctx, set: (s) => (store = s), get: () => store };
}
const A = grab(oldFile), B = grab(newFile); let n = 0, bad = 0;
for (const kind of ['word', 'sent']) for (let box = 0; box <= 4; box++) for (const ok of [true, false]) for (const off of [-3 * 864e5, -1, 0, 5 * 864e5]) {
  const mk = () => ({ word: [{ zh: 'x', box, due: 1.8e12 + off }], sent: [{ zh: 'x', box, due: 1.8e12 + off }] });
  const out = [A, B].map((g) => { g.set(mk()); g.ctx.applySrs({ zh: 'x' }, kind, ok); const it = g.get()[kind][0]; return JSON.stringify({ box: it.box, due: it.due, before: g.ctx.dueLabel({ due: 1.8e12 + off }), after: g.ctx.dueLabel(it) }); });
  n++; if (out[0] !== out[1]) { bad++; console.log('DIFF', kind, box, ok, off, out); }
}
console.log(bad ? `${bad}/${n}건 다름` : `통과: ${n}개 시나리오에서 box·due·dueLabel 동일`); process.exit(bad ? 1 : 0);
