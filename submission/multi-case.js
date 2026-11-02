// 여러 건·까다로운 경우로 학습 끝까지 돌리기(API 없음): 예시 결과 + 실제 AI 응답 3건 + 구조를 일부러 망가뜨린 경우. 각 경우마다 카드를 끝까지 넘기고 → 전체 읽기 → 학습 통계까지 가는지, 오류가 없는지 본다.
const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = []; window.addEventListener('error', (e) => errs.push(e.message));
const base = await (await fetch('/mock.json')).json(), B = base.result || base;
const real = []; for (const n of ['01', '02', '03']) { const j = await (await fetch(`/_fx_real_${n}.json`)).json(); real.push(j.result || j); }
const clone = (o) => JSON.parse(JSON.stringify(o));
const cases = [
  ['예시 결과(4문장)', B],
  ['실제 AI 응답 1(8문장, 옛 형식: 단어 분해 없음)', real[0]],
  ['실제 AI 응답 2(8문장, 옛 형식)', real[1]],
  ['실제 AI 응답 3(8문장, 단어 많음)', real[2]],
  ['문법·활용 문장 없음', (() => { const r = clone(B); r.grammar = []; r.extra_sentences = []; return r; })()],
  ['핵심 단어 없음', (() => { const r = clone(B); r.vocab = []; return r; })()],
  ['한 문장짜리 일기', (() => { const r = clone(B); r.sentences = r.sentences.slice(0, 1); return r; })()],
  ['아주 긴 한 문장', (() => { const r = clone(B); r.sentences = [{ ...r.sentences[0], ko: r.sentences[0].ko.repeat(6), zh: r.sentences[0].zh.repeat(6), words: r.sentences[0].words.concat(r.sentences[0].words, r.sentences[0].words) }]; return r; })()],
  ['번역이 빈 문장이 섞임', (() => { const r = clone(B); r.sentences[1] = { ...r.sentences[1], zh: '', words: [] }; return r; })()],
  ['확인 필요(모호한 말) 표시가 많음', (() => { const r = clone(B); r.ambiguities = r.sentences.map((s, i) => ({ n: s.n || i + 1, text: '모호한 표현을 이렇게 읽었어요.' })); return r; })()],
];
const rows = [];
for (const [name, r] of cases) {
  errs.length = 0; let ok = true, note = '';
  try {
    document.getElementById('finish').classList.add('hidden');
    render(r, false); showResult(); await sl(300);
    learnOpen(false); await sl(200);
    const n = lnS.cards.length;
    for (let i = 1; i < n; i++) { lnMove(1); await sl(20); }
    const last = lnS.cards[lnS.i].t;
    document.getElementById('ln-next').click(); await sl(600);
    const readOpen = rp.open; document.getElementById('rp-end').click(); await sl(500);
    const fin = !document.getElementById('finish').classList.contains('hidden') && !!document.querySelector('#finish .fin-feather');
    ok = last === 'r' && readOpen && fin && errs.length === 0; note = `카드 ${n}장, 단어 ${lnS.wl.length}개`; document.getElementById('fin-home').click(); await sl(300); showResult(); await sl(200);
  } catch (e) { ok = false; note = '예외: ' + e.message; }
  rows.push({ case: name, ok, note, errors: errs.slice(0, 2) });
}
return JSON.stringify(rows);
