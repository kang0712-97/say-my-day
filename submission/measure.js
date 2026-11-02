// 학습 화면 전후 비교 측정(사람 없이 재는 값): browser_check.js 본문. 같은 일기 결과 4건(예시 1 + 실제 AI 응답 3)을 이전 빌드와 새 빌드에서 열어 잰다.
const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const FUNC = new Set(['的', '了', '吧', '吗', '呢', '啊', '着', '过', '地']);
const isP = (t) => /^[\p{P}\p{S}\s]+$/u.test(t), isL = (t) => /^[A-Za-z0-9\s]+$/.test(t);
const vh = innerHeight;
const interactive = (root) => [...root.querySelectorAll('button, a[href], [role="button"], input, select, textarea, summary')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('.hidden,[hidden]'); });
const inView = (root) => interactive(root).filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < vh; }).length; // 지금 화면(뷰포트)에 걸쳐 보이는 눌리는 요소
const out = [], isNew = typeof learnOpen === 'function';
for (const url of ['/mock.json', '/_fx_real_01.json', '/_fx_real_02.json', '/_fx_real_03.json']) {
  const j = await (await fetch(url)).json(), r = j.result || j;
  render(r, false); showResult(); await sl(600); window.scrollTo(0, 0);
  const uniq = new Set(); sentState.forEach(({ words }) => words.forEach((w) => { if (w.zh && !isP(w.zh) && !isL(w.zh) && w.ko && !FUNC.has(w.zh)) uniq.add(w.zh); }));
  const hasWords = r.sentences.every((x) => Array.isArray(x.words) && x.words.length);
  const row = { fixture: url.replace('/', ''), sentences: r.sentences.length, hasWordSplit: hasWords, contentWords: hasWords ? uniq.size : null, coreVocab: currentVocab.length };
  if (!isNew) {
    const res = document.getElementById('result'), h = Math.max(res.scrollHeight, document.documentElement.scrollHeight);
    Object.assign(row, { build: 'before', wordsInList: currentVocab.length, wordCoverage: hasWords ? +(currentVocab.length / uniq.size).toFixed(2) : null, pageHeightPx: h, screens: +(h / vh).toFixed(1), swipesToEnd: Math.ceil(h / vh) - 1 });
    let sum = 0, n = 0, mx = 0; for (let y = 0; y < h - vh + 1; y += vh) { window.scrollTo(0, y); await sl(40); const c = inView(document.body); sum += c; n++; mx = Math.max(mx, c); } window.scrollTo(0, 0);
    row.visibleChoicesAvg = +(sum / n).toFixed(1); row.visibleChoicesMax = mx;
  } else {
    learnOpen(false); await sl(300);
    let maxH = 0, sumI = 0, mxI = 0, scrollCards = 0;
    for (let i = 0; i < lnS.cards.length; i++) { lnS.i = i; lnRender(0); await sl(60); const c = document.getElementById('ln-card'); maxH = Math.max(maxH, c.scrollHeight); if (c.scrollHeight > c.clientHeight + 4) scrollCards++; const v = inView(document.getElementById('learn')); sumI += v; mxI = Math.max(mxI, v); }
    Object.assign(row, { build: 'after', cards: lnS.cards.length, taps: lnS.cards.length - 1, wordsInList: lnS.wl.length, wordCoverage: hasWords ? +(lnS.wl.length / uniq.size).toFixed(2) : null, tallestCardPx: maxH, tallestCardScreens: +(maxH / vh).toFixed(1), cardsNeedingScroll: scrollCards, visibleChoicesAvg: +(sumI / lnS.cards.length).toFixed(1), visibleChoicesMax: mxI });
    learnClose(); await sl(300);
  }
  out.push(row);
}
return JSON.stringify(out);
