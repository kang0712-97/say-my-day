// 화면 스모크 시험 본문(브라우저 안에서 실행). 러너가 앞에 `const CASES = [...]`를 붙여 준다.
// 검사: ⓐ 화면 언어가 중국어일 때 한글 문구 누출(입력 언어 내용으로 쓰인 한글은 제외) ⓑ {자리표}·undefined·NaN ⓒ 360px 폭 가로 넘침 ⓓ 콘솔 오류
const problems = []; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function frame(cs) {
  localStorage.setItem('intro-seen', '"1"'); localStorage.setItem('splash-off', '1'); localStorage.setItem('lang-src', JSON.stringify(cs.src)); localStorage.setItem('lang-tgt', JSON.stringify(cs.tgt));
  document.body.innerHTML = '<iframe id="f" src="/" style="width:360px;height:780px;border:0"></iframe>';
  const f = document.getElementById('f'); await new Promise((r) => (f.onload = r)); await sleep(900);
  const w = f.contentWindow;
  w.addEventListener('error', (e) => problems.push(`[${cs.name}] 콘솔 오류: ${e.message}`));
  w.addEventListener('unhandledrejection', (e) => problems.push(`[${cs.name}] 처리 안 된 약속 오류: ${e.reason && e.reason.message || e.reason}`));
  const ce = w.console.error; w.console.error = (...a) => { problems.push(`[${cs.name}] console.error: ${a.join(' ').slice(0, 100)}`); ce.apply(w.console, a); };
  return w;
}
function check(w, cs, where, srcKo) {
  const d = w.document, W = d.documentElement.clientWidth;
  // ⓒ 가로 넘침
  const bad = [...d.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > W + 2 || r.left < -2) && !e.closest('svg,nav,.hidden') && w.getComputedStyle(e).visibility !== 'hidden'; });
  const roots = bad.filter((e) => !bad.includes(e.parentElement)).slice(0, 3).map((e) => e.tagName + '.' + String(e.className || e.id).slice(0, 24));
  if (roots.length) problems.push(`[${cs.name}] ${where}: 가로 넘침 ${roots.join(' | ')}`);
  // ⓑ 자리표 ⓐ 한글 누출
  const texts = [];
  const tw = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) { const p = n.parentElement; if (!p || p.closest('script,style,.hidden,#intro')) continue; texts.push(n.nodeValue); }
  d.querySelectorAll('body *').forEach((el) => { if (el.closest('.hidden,#intro')) return; ['aria-label', 'placeholder', 'title'].forEach((a) => { const v = el.getAttribute(a); if (v) texts.push(v); }); });
  for (const t of texts) {
    if (/\{\w+\}|undefined|NaN/.test(t)) problems.push(`[${cs.name}] ${where}: 자리표/undefined/NaN "${t.trim().slice(0, 50)}"`);
    if (cs.ui === 'zh') for (const h of (t.match(/[가-힣][가-힣\s·,.!?「」()…\-:]*/g) || []).map((x) => x.trim()).filter(Boolean)) if (![...srcKo].some((k) => k.includes(h))) problems.push(`[${cs.name}] ${where}: 한글 누출 "${h}"`);
  }
}
for (const cs of CASES) {
  const srcKo = new Set(); const walk = (o) => { if (typeof o === 'string') { if (/[가-힣]/.test(o)) srcKo.add(o); } else if (o && typeof o === 'object') Object.values(o).forEach(walk); }; walk(cs.data.result);
  srcKo.add('API 오류 400'); // 시험 서버에는 API 키가 없어 글자 풀이가 서버 오류 문구를 돌려줄 수 있다(시간에 따라 나타남)
  let w = await frame(cs); const chk = (where) => check(w, cs, where, srcKo);
  chk('쓰기'); w.document.getElementById('lang-chip').click(); await sleep(500); chk('언어 고르기');
  w = await frame(cs);
  w.eval('render')(cs.data.result, false); w.eval('showResult')(); await sleep(600); chk('결과');
  { // 학습 세션(T44): 시작 → 문장마다 듣고 말하기 → 단어 리스트 → 문법(+활용) → 전체 읽기 안내 → (시작) 전체 읽기 페이지 → 학습 통계, 핵심 단어 자동 담기·빼기, 이어 열기, 닫으면 전체 보기
    const d = w.document, R = cs.data.result, nS = R.sentences.filter((x) => x.zh).length;
    w.eval('learnOpen')(false); await sleep(300);
    const S = w.eval('lnS'), cnt = (t) => S.cards.filter((c) => c.t === t).length;
    if (!S.open || cnt('s') !== nS || cnt('wl') !== 1 || cnt('g') !== (R.grammar || []).length || cnt('x') !== ((R.extra_sentences || []).length ? 1 : 0) || S.cards[S.cards.length - 1].t !== 'r') problems.push(`[${cs.name}] 학습: 카드 구성이 다름 s${cnt('s')} wl${cnt('wl')} g${cnt('g')} x${cnt('x')} 끝${S.cards[S.cards.length - 1].t}`);
    const nCore = S.wl.filter((x) => x.core).length; if (S.wl.length < R.vocab.length) problems.push(`[${cs.name}] 학습: 단어 리스트(${S.wl.length})가 핵심 단어(${R.vocab.length})보다 적음`);
    w.eval('saveWords')([]);
    const seenT = new Set(); let wlAt = -1;
    for (let i = 0; i < S.cards.length; i++) {
      const c = S.cards[i]; await sleep(120);
      if (!seenT.has(c.t)) { seenT.add(c.t); await sleep(320); chk('학습 카드 ' + c.t); } // 넘기는 움직임(0.26초)이 끝난 뒤에 잰다
      if (c.t === 's' && (!d.querySelector('#ln-card .zhline') || !d.querySelector('#ln-card [data-say]') || !d.getElementById('ln-skip'))) problems.push(`[${cs.name}] 학습: 문장 카드에 외국어 문장·듣기·건너뛰기가 없음`);
      if (c.t === 's' && /소리 내어 말했어요|我大声说了/.test(d.getElementById('ln-next-l').textContent)) problems.push(`[${cs.name}] 학습: 다음 버튼 글자가 "소리 내어 말했어요"로 남아 있음`);
      if (c.t === 'wl') { wlAt = i; if (d.querySelectorAll('#ln-card .ln-wi').length !== S.wl.length) problems.push(`[${cs.name}] 학습: 단어 리스트 줄 수가 다름`); }
      if (!d.getElementById('ln-next-l').textContent) problems.push(`[${cs.name}] 학습: 다음 버튼 글자가 비었음 (${c.t})`);
      if (i < S.cards.length - 1) w.eval('lnMove')(1);
    }
    if (d.querySelector('#ln-card button')) problems.push(`[${cs.name}] 학습: 전체 읽기 안내 카드 안에 버튼이 있음(시작 버튼 하나만 있어야 함)`);
    if (w.eval('loadWords')().length < nCore) problems.push(`[${cs.name}] 학습: 핵심 단어 ${nCore}개가 단어장에 담겨야 하는데 ${w.eval('loadWords')().length}개`);
    if (wlAt >= 0 && nCore) { w.eval('lnS').i = wlAt; w.eval('lnRender')(0); const b = d.querySelector('#ln-card [data-lnw][aria-pressed="true"]'); if (!b) problems.push(`[${cs.name}] 학습: 담긴 단어 표시가 없음`); else { b.click(); await sleep(150); const nb = [...d.querySelectorAll('#ln-card [data-lnw]')].find((x) => x.dataset.lnw === b.dataset.lnw); if (nb.getAttribute('aria-pressed') !== 'false') problems.push(`[${cs.name}] 학습: 단어 빼기가 안 됨`); }
      d.getElementById('ln-mean').click(); await sleep(100); if (!d.querySelector('#ln-card .ln-wl.hide-mean')) problems.push(`[${cs.name}] 학습: 뜻 가리기가 안 됨`); chk('학습 뜻 가림'); }
    w.eval('saveWords')([]);
    const mid = Math.min(2, S.cards.length - 1); w.eval('lnS').i = mid; w.eval('lnRender')(0); w.eval('learnClose')(); await sleep(300);
    if (S.open || !d.getElementById('learn').classList.contains('hidden')) problems.push(`[${cs.name}] 학습: 닫기가 안 됨`);
    w.eval('learnOpen')(true); await sleep(300);
    if (w.eval('lnS').i !== mid) problems.push(`[${cs.name}] 학습: 이어 열기가 닫은 자리(${mid})가 아님 (${w.eval('lnS').i})`);
    // 마지막 카드의 "시작" → 전체 읽기 페이지(학습의 연장) → "학습 마치기" → 오늘의 학습 통계(깃털·성장) → 홈으로
    w.eval('lnS').i = S.cards.length - 1; w.eval('lnRender')(0); await sleep(300); d.getElementById('ln-next').click(); await sleep(700);
    if (!w.eval('rp').open) problems.push(`[${cs.name}] 학습: 시작을 눌러도 전체 읽기 페이지가 열리지 않음`);
    else {
      chk('전체 읽기 페이지');
      const ctrl = d.querySelector('.rp-ctrl'), bgc = w.getComputedStyle(ctrl).backgroundColor; if (/rgba\(.*, 0\)|transparent/.test(bgc)) problems.push(`[${cs.name}] 전체 읽기: 아래 조작 막대 배경이 투명함`);
      if (d.querySelector('#rpage [data-seg="gap"]') || d.querySelectorAll('#rpage [data-seg="rate"] button').length !== 2) problems.push(`[${cs.name}] 전체 읽기: 속도는 느리게·보통 두 개만, 간격 조절은 없어야 함`);
      d.getElementById('rp-end').click(); await sleep(600);
      if (d.getElementById('finish').classList.contains('hidden') || w.eval('rp').open || w.eval('lnS').open) problems.push(`[${cs.name}] 학습: 학습 마치기 뒤에 통계 화면만 보여야 함`);
      else { chk('학습 통계'); if (!d.querySelector('#finish .fin-feather') || !d.querySelector('#finish .fin-bar') || !d.getElementById('fin-home')) problems.push(`[${cs.name}] 학습 통계: 깃털·성장 막대·홈으로가 없음`); d.getElementById('fin-home').click(); await sleep(500); if (d.getElementById('v-nest') && w.getComputedStyle(d.getElementById('v-nest')).display === 'none') problems.push(`[${cs.name}] 학습 통계: 홈으로가 첫 화면으로 가지 않음`); }
    }
    w.eval('saveWords')([]); w.eval('showResult')(); await sleep(300);
  }
  { // 일기책(T44): 표지 버튼 사이 간격, ← 는 쪽 → 표지 → 일기장 목록 순서로 한 단계씩
    const d = w.document; srcKo.add('스모크 일기책 시험'); w.eval('saveHist')('스모크 일기책 시험', cs.data.result); w.eval('bookOpen')(); await sleep(400);
    const a = d.querySelector('.bk-cover [data-bkgo="1"]'), b = d.getElementById('bk-pdf');
    if (!a || !b) problems.push(`[${cs.name}] 일기책: 표지에 펼치기·PDF 버튼이 없음`);
    else { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); if (Math.abs(rb.top - ra.bottom) < 8 && Math.abs(rb.left - ra.right) < 8) problems.push(`[${cs.name}] 일기책: 펼치기와 PDF 버튼이 붙어 있음`); }
    chk('일기책 표지');
    w.eval('bookGo')(1); await sleep(300); d.getElementById('sheet-close').click(); await sleep(300);
    if (w.eval('openName') !== 'book' || w.eval('book').i !== 0) problems.push(`[${cs.name}] 일기책: 쪽에서 ←를 누르면 표지로 가야 함`);
    d.getElementById('sheet-close').click(); await sleep(500);
    if (w.eval('openName') !== 'hist') problems.push(`[${cs.name}] 일기책: 표지에서 ←를 누르면 일기장 목록으로 가야 함 (${w.eval('openName')})`);
    w.eval('closeSheet')(); await sleep(400); w.localStorage.removeItem('diary-history'); w.eval('renderHist')();
  }
  { // 일기장 삭제: ⋯ → 삭제 → 확인 → 일기가 지워지고 되살아나지 않음
    const d = w.document; w.localStorage.removeItem('diary-history'); w.eval('saveHist')('삭제 시험 하나', cs.data.result); await sleep(20); w.eval('saveHist')('삭제 시험 둘', cs.data.result); await sleep(200);
    w.eval('openSheet')('hist'); await sleep(400);
    d.querySelector('#hist [data-hmore]').click(); await sleep(150); d.querySelector('#hist [data-hask]').click(); await sleep(150);
    const del = d.querySelector('#hist [data-del]');
    if (!del) problems.push(`[${cs.name}] 일기장: 삭제를 누르면 확인 단추가 나와야 함`);
    else { del.click(); await sleep(300); await sleep(1200); const left = w.eval('loadHist')().length; if (left !== 1) problems.push(`[${cs.name}] 일기장: 삭제 뒤 일기가 1편 남아야 하는데 ${left}편`); }
    w.eval('closeSheet')(); await sleep(300); w.localStorage.removeItem('diary-history'); w.eval('renderHist')();
  }
  { // 따라 말하기: 가짜 인식기로 시트·비교 표시·기록·오류 안내를 확인(실제 마이크는 사용자 휴대폰)
    const d = w.document, P = w.webkitSpeechRecognition && w.webkitSpeechRecognition.prototype, btn = d.querySelector('#sentences [data-spk][data-sk="s"]');
    const on = w.eval('SPEAK_ON'); // 따라 말하기를 끈 동안(SPEAK_ON=false)에는 화면에 마이크 버튼이 하나도 없어야 한다
    if (!on && d.querySelector('[data-spk]')) problems.push(`[${cs.name}] 따라 말하기: 껐는데 마이크 버튼이 남아 있음`);
    if (on && P && !btn) problems.push(`[${cs.name}] 따라 말하기: 문장 마이크 버튼이 없음`);
    if (on && P && btn) {
      const sent = btn.dataset.spk; let mode = 'ok';
      P.start = function () { setTimeout(() => { if (mode === 'ok') this.onresult({ results: [[{ transcript: sent }]] }); else if (mode === 'part') this.onresult({ results: [[{ transcript: sent.slice(0, Math.ceil(sent.length / 2)) }]] }); else this.onerror({ error: 'not-allowed' }); this.onend(); }, 30); };
      P.stop = P.abort = function () {};
      const sheet = d.getElementById('spk'), count = (c) => d.querySelectorAll('#spk-target ' + c).length;
      btn.click(); await sleep(300);
      if (sheet.classList.contains('hidden') || count('.sp-ok') === 0 || count('.sp-miss') !== 0) problems.push(`[${cs.name}] 따라 말하기: 전부 맞게 말했는데 표시가 다름`);
      chk('따라 말하기 맞음');
      mode = 'part'; d.getElementById('spk-again').click(); await sleep(300);
      if (count('.sp-miss') === 0 || !d.getElementById('spk-status').textContent.match(/\d/)) problems.push(`[${cs.name}] 따라 말하기: 절반만 말했는데 놓친 글자 표시가 없음`);
      chk('따라 말하기 놓침');
      mode = 'deny'; d.getElementById('spk-again').click(); await sleep(300);
      if (!d.querySelector('#spk-status.warn') || !d.getElementById('spk-again')) problems.push(`[${cs.name}] 따라 말하기: 마이크 거절 안내가 없음`);
      chk('따라 말하기 거절');
      const log = JSON.parse(w.localStorage.getItem('speak-log') || '[]');
      if (log.length !== 1 || log[0].n !== 2 || log[0].k !== 's') problems.push(`[${cs.name}] 따라 말하기: 기록이 기대와 다름 ${JSON.stringify(log)}`);
      d.getElementById('spk-close').click(); await sleep(100);
      if (!sheet.classList.contains('hidden')) problems.push(`[${cs.name}] 따라 말하기: 닫기가 안 됨`);
      w.localStorage.removeItem('speak-log');
    }
  }
  { // 홈 흐름: 번역 저장 후 뒤로 → 이어서 공부하기 카드, 쓰기 칸 닫힘 → 새 일기 쓰기로 열림 → 카드로 번역 없이 공부 화면
    const d = w.document; srcKo.add('스모크 시험 일기'); w.eval('saveHist')('스모크 시험 일기', cs.data.result); w.eval('showWritePage')(); await sleep(500);
    const wr = d.querySelector('.write');
    if (d.getElementById('cont-card').classList.contains('hidden')) problems.push(`[${cs.name}] 홈: 이어서 공부하기 카드가 없음`);
    if (!wr.classList.contains('hidden')) problems.push(`[${cs.name}] 홈: 쓰기 칸이 닫혀 있지 않음`);
    if (d.getElementById('new-diary').classList.contains('hidden')) problems.push(`[${cs.name}] 홈: 새 일기 쓰기 버튼이 없음`);
    chk('홈 카드');
    d.getElementById('new-diary').click(); await sleep(200);
    if (wr.classList.contains('hidden')) problems.push(`[${cs.name}] 홈: 새 일기 쓰기를 눌러도 쓰기 칸이 안 열림`);
    chk('홈 쓰기 열림');
    w.eval('showWritePage')(); d.getElementById('cont-go').click(); await sleep(600);
    if (!w.eval('onResultPage')()) problems.push(`[${cs.name}] 홈: 이어서 공부하기가 공부 화면을 열지 못함`);
    { // 일기장 날짜별 보기: 기본은 오늘 것만, 일기 없는 날은 빈 문구, 선택 해제하면 그 달 전체
      w.eval('openSheet')('hist'); await sleep(400);
      const rows = () => d.querySelectorAll('#hist .hist-item').length, day = (k) => d.querySelector(`[data-day="${k}"]`);
      const today = w.eval('dayKey')(), other = [...d.querySelectorAll('[data-day]')].map((e) => e.dataset.day).find((k) => k !== today);
      if (rows() !== 1) problems.push(`[${cs.name}] 일기장: 오늘 선택인데 항목 ${rows()}개`);
      day(other).click(); await sleep(200);
      if (rows() !== 0 || !d.querySelector('#hist .vempty')) problems.push(`[${cs.name}] 일기장: 일기 없는 날의 빈 문구가 없음`);
      chk('일기장 빈 날짜');
      day(other).click(); await sleep(200);
      if (rows() !== 1 || day(other).getAttribute('aria-pressed') !== 'false') problems.push(`[${cs.name}] 일기장: 선택 해제 뒤 달 목록이 아님`);
      day(today).click(); await sleep(200);
      if (rows() !== 1 || day(today).getAttribute('aria-pressed') !== 'true') problems.push(`[${cs.name}] 일기장: 오늘을 다시 눌러 선택하지 못함`);
      chk('일기장 날짜 선택'); w.eval('closeSheet')(); await sleep(300);
    }
    w.localStorage.removeItem('diary-history'); w.eval('renderHist')();
  }
  const wd = w.document.querySelector('#sentences .wd'); if (wd) { wd.click(); await sleep(400); chk('단어 설명(펼침)'); const cl = w.document.querySelector('.wsheet [data-pclose]'); if (cl) { cl.click(); await sleep(300); } }
  if (!w.document.querySelectorAll('#tools .lcard').length) problems.push(`[${cs.name}] 단어·문법 카드가 펼쳐져 있지 않음`);
  chk('단어·문법·활용(고정 펼침)');
  { const st = w.document.querySelector('#steps [data-step="st-4"]'); if (st) { st.click(); await sleep(400); chk('단계 이동'); } }
  const ra = w.document.getElementById('read-all'); if (ra) { ra.click(); await sleep(800); chk('통독'); w.history.back(); await sleep(500); }
  const items = cs.data.result.vocab.map((v) => ({ zh: v.zh, ko: v.ko, ex_zh: v.example_zh, ex_ko: v.example_ko, due: 0 }));
  const sents = cs.data.result.sentences.map((s) => ({ zh: s.zh, ko: s.ko, due: 0 }));
  const kinds = new Set();
  for (let i = 0; i < 16; i++) {
    w.eval('startQuiz')(i % 4 === 3 ? 'sent' : 'word', i % 4 === 3 ? sents : items);
    for (let step = 0; step < 6; step++) {
      const q = w.document.getElementById('quiz'); const kind = [...q.querySelectorAll('[id^=q-],[data-opt],[data-chip]')].map((e) => e.id || Object.keys(e.dataset)[0]).slice(0, 3).join(','); kinds.add(kind);
      chk('퀴즈'); const g = (id) => w.document.getElementById(id);
      if (g('q-go')) { g('q-go').click(); await sleep(80); continue; }
      if (g('q-reveal')) { g('q-reveal').click(); chk('퀴즈 정답'); g('q-self-no') && g('q-self-no').click(); continue; }
      if (g('q-hint')) { g('q-hint').click(); g('q-in').value = 'zzz'; g('q-submit').click(); chk('퀴즈 오답'); g('q-next') && g('q-next').click(); continue; }
      if (w.document.querySelector('[data-chip]')) { g('q-check') && g('q-check').click(); chk('퀴즈 순서 맞추기'); g('q-next') && g('q-next').click(); continue; }
      const opt = w.document.querySelector('[data-opt]'); if (opt) { opt.click(); chk('퀴즈 보기'); g('q-next') && g('q-next').click(); continue; }
      break;
    }
  }
  for (const name of ['hist', 'word', 'set']) { w.eval('openSheet')(name); await sleep(400); chk('시트 ' + name); }
}
return JSON.stringify({ cases: CASES.map((c) => c.name), problems: [...new Set(problems)] });
