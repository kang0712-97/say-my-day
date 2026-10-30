// 따라 말하기: 브라우저 음성 인식 결과를 원문과 비교하고, 말한 횟수를 센다(화면과 무관한 순수 함수).
// 브라우저에서는 전역 SpeakCheck, Node 테스트에서는 module.exports 로 쓴다.
// 이것은 "알아듣는지 확인"이다. 성조·억양은 판정하지 못한다.
const SpeakCheck = (() => {
  const KEEP = /[\p{L}\p{N}]/u; // 글자·숫자만 비교한다(문장부호·공백은 건너뜀)
  const kata2hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const norm = (ch) => kata2hira(ch.normalize('NFKC').toLowerCase());

  // target 글자마다 {ch, kind:'ok'|'miss'|'skip'}. 말한 글자(heard)와 순서대로 가장 길게 겹치는 부분(LCS)을 맞은 글자로 본다.
  function compare(target, heard) {
    const t = [...String(target || '')], h = [...String(heard || '')].map(norm).filter((c) => KEEP.test(c));
    const idx = [], tn = [];
    t.forEach((ch, i) => { const n = norm(ch); if (KEEP.test(n)) { idx.push(i); tn.push(n); } });
    const n = tn.length, m = h.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = tn[i] === h[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const hit = new Set(); let i = 0, j = 0;
    while (i < n && j < m) { if (tn[i] === h[j]) { hit.add(i); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
    const marks = t.map((ch) => ({ ch, kind: 'skip' }));
    idx.forEach((ti, k) => { marks[ti].kind = hit.has(k) ? 'ok' : 'miss'; });
    const ok = hit.size, missed = n - ok;
    return { marks, total: n, ok, missed, score: n ? ok / n : 0, heardLen: m, all: n > 0 && missed === 0 };
  }

  // 인식기가 후보 여러 개를 주면 원문과 가장 많이 겹치는 것을 고른다.
  function best(target, alts) {
    let top = null;
    for (const a of alts || []) { if (!a || !String(a).trim()) continue; const r = compare(target, a); if (!top || r.score > top.score) top = { ...r, heard: String(a).trim() }; }
    return top;
  }

  // 말한 기록: [{ id, k:'w'|'s', t:학습 언어, zh, n:말한 횟수, at:마지막 시각 }]
  const idOf = (tgt, k, zh) => `${tgt}:${k}:${zh}`;
  function bump(list, tgt, k, zh, now) {
    const out = (list || []).map((x) => ({ ...x })); const id = idOf(tgt, k, zh);
    const me = out.find((x) => x.id === id);
    if (me) { me.n = (me.n || 0) + 1; me.at = now; } else out.push({ id, k, t: tgt, zh, n: 1, at: now });
    return out;
  }
  function merge(a, b) { // 같은 항목은 횟수가 큰 쪽·최근 시각을 따른다
    const map = new Map();
    for (const x of [...(a || []), ...(b || [])]) {
      const cur = map.get(x.id);
      if (!cur) map.set(x.id, { ...x }); else { cur.n = Math.max(cur.n || 0, x.n || 0); cur.at = Math.max(cur.at || 0, x.at || 0); }
    }
    return [...map.values()];
  }
  function stats(list, tgt) { // 고유 개수와 총 횟수. tgt를 주면 그 학습 언어만
    const s = { words: 0, sents: 0, wordTimes: 0, sentTimes: 0 };
    for (const x of list || []) {
      if (tgt && x.t !== tgt) continue;
      if (x.k === 'w') { s.words++; s.wordTimes += x.n || 0; } else if (x.k === 's') { s.sents++; s.sentTimes += x.n || 0; }
    }
    return s;
  }
  return { compare, best, bump, merge, stats, idOf };
})();
if (typeof module !== 'undefined') module.exports = SpeakCheck;
