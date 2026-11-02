// 접근성 자동 검사(브라우저 안에서 실행). 러너가 앞에 `const CASES = [...]`를 붙여 준다.
// 검사: ⓐ 이름 없는 버튼·링크·입력 ⓑ 대체 텍스트 없는 img ⓒ tabindex>0 ⓓ 한자·가나 조각의 lang ⓔ 글자 200%에서 가로 넘침 ⓕ 눌리는 곳 24px 미만 ⓖ 포커스 순서 역행 ⓗ 장식 이미지 alt="" ⓘ 선택 상태 속성(aria-pressed/checked/selected) ⓙ 글자·배경 색 대비(일반 4.5:1, 큰 글자 3:1) ⓚ 설명 패널 포커스 복귀 ⓛ 폭 320/360/390/768/1200 × 라이트/다크 가로 넘침
const problems = []; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function frame(cs, width = 360, theme = 'light') {
  localStorage.setItem('intro-seen', '"1"'); localStorage.setItem('splash-off', '1'); localStorage.setItem('lang-src', JSON.stringify(cs.src)); localStorage.setItem('lang-tgt', JSON.stringify(cs.tgt)); localStorage.setItem('theme', JSON.stringify(theme));
  document.body.innerHTML = `<iframe id="f" src="/" style="width:${width}px;height:780px;border:0"></iframe>`;
  const f = document.getElementById('f'); await new Promise((r) => (f.onload = r)); await sleep(900); return f.contentWindow;
}
// 색 대비: 글자 색과 가장 가까운 불투명 배경을 겹쳐 계산한다(그림 배경은 제외)
const rgba = (c) => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; };
const mix = (top, bot) => [0, 1, 2].map((i) => top[i] * top[3] + bot[i] * (1 - top[3])).concat(1);
const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
function contrast(w, cs, where, theme) {
  const d = w.document, root = d.documentElement; const seen = new Set();
  const tw = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) {
    const p = n.parentElement; if (!p || !n.nodeValue.trim() || p.closest('script,style,.hidden,[hidden],svg') || !vis(w, p)) continue;
    if (p.closest(':disabled,[aria-disabled=true]')) continue;
    const st = w.getComputedStyle(p); let fg = rgba(st.color); if (!fg) continue;
    if (st.webkitBackgroundClip === 'text' || st.backgroundClip === 'text') continue; // 따라 읽기 글자 강조(그라데이션을 글자 모양으로 자름): 칠한 쪽 색 쌍은 토큰 --ink/--text-subtle로 따로 계산
    let op = 1, bg = null; const layers = [];
    for (let e = p; e; e = e.parentElement) { const es = w.getComputedStyle(e); op *= Number(es.opacity); const b = rgba(es.backgroundColor); if (b && b[3] > 0) { layers.push(b); if (b[3] >= 0.99) break; } if (es.backgroundImage !== 'none' && e !== p && e !== d.body) { bg = 'img'; } }
    if (bg === 'img') continue;
    let base = layers.length && layers[layers.length - 1][3] >= 0.99 ? layers.pop() : rgba(w.getComputedStyle(root).backgroundColor) || [255, 255, 255, 1]; if (base[3] < 0.99) base = [255, 255, 255, 1];
    while (layers.length) base = mix(layers.pop(), base);
    fg = mix([fg[0], fg[1], fg[2], fg[3] * op], base);
    const size = parseFloat(st.fontSize), bold = Number(st.fontWeight) >= 700, large = size >= 24 || (size >= 18.66 && bold);
    const r = ratio(fg, base), need = large ? 3 : 4.5; const key = st.color + '|' + base.join() + '|' + large;
    if (r < need && !seen.has(key)) { seen.add(key); problems.push(`[${cs.name}/${theme}] ${where}: 색 대비 ${r.toFixed(2)}:1 < ${need} "${n.nodeValue.trim().slice(0, 14)}" <${p.tagName.toLowerCase()}${p.className && typeof p.className === 'string' ? '.' + p.className.split(' ')[0] : ''}>`); }
  }
}
const vis = (w, e) => { const r = e.getBoundingClientRect(); const s = w.getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('.hidden,[hidden],[inert]'); };
function nameOf(w, e) {
  const d = w.document, a = (k) => (e.getAttribute(k) || '').trim();
  if (a('aria-label')) return a('aria-label');
  if (a('aria-labelledby')) return a('aria-labelledby').split(/\s+/).map((id) => (d.getElementById(id) || {}).textContent || '').join('').trim();
  if (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.tagName === 'SELECT') { const l = (e.id && d.querySelector(`label[for="${e.id}"]`)) || e.closest('label'); if (l && l.textContent.trim()) return l.textContent.trim(); return a('title') || a('placeholder'); }
  const img = e.querySelector('img[alt]'); return (e.textContent || '').trim() || a('title') || (img ? img.getAttribute('alt') : '');
}
function check(w, cs, where) {
  const d = w.document, tag = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '');
  const focusables = [...d.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=tab],[tabindex]')].filter((e) => vis(w, e));
  for (const e of focusables) {
    if (!nameOf(w, e)) problems.push(`[${cs.name}] ${where}: 이름 없음 <${tag(e)}>`);
    if (Number(e.getAttribute('tabindex')) > 0) problems.push(`[${cs.name}] ${where}: tabindex>0 <${tag(e)}>`);
    const r = e.getBoundingClientRect(); if ((r.width < 24 || r.height < 24) && !['INPUT'].includes(e.tagName) && !e.closest('.hidden')) problems.push(`[${cs.name}] ${where}: 눌리는 곳 24px 미만 <${tag(e)}> ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  d.querySelectorAll('img').forEach((e) => { if (!vis(w, e)) return; if (!e.hasAttribute('alt')) problems.push(`[${cs.name}] ${where}: alt 없는 img`); else if (e.classList.contains('bird') && e.getAttribute('alt') !== '') problems.push(`[${cs.name}] ${where}: 장식 이미지(작은 새)에 alt가 비어 있지 않음 "${e.getAttribute('alt')}"`); });
  // 선택 상태: role=radio는 aria-checked, role=tab은 aria-selected가 있고 묶음마다 하나만 켜져 있어야 한다. 저장 같은 켜고 끄는 버튼은 aria-pressed
  for (const [role, attr] of [['radio', 'aria-checked'], ['tab', 'aria-selected']]) {
    const groups = new Map(); d.querySelectorAll(`[role=${role}]`).forEach((e) => { if (!vis(w, e)) return; const g = e.closest('[role=radiogroup],[role=tablist]') || e.parentElement; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(e); });
    for (const els of groups.values()) { const miss = els.filter((e) => !['true', 'false'].includes(e.getAttribute(attr))); if (miss.length) problems.push(`[${cs.name}] ${where}: role=${role}에 ${attr} 없음 <${tag(miss[0])}>`); else if (els.filter((e) => e.getAttribute(attr) === 'true').length !== 1) problems.push(`[${cs.name}] ${where}: ${role} 묶음에서 켜진 것이 하나가 아님 <${tag(els[0])}>`); }
  }
  d.querySelectorAll('[data-msave],[data-save]').forEach((e) => { if (vis(w, e) && !e.hasAttribute('aria-pressed')) problems.push(`[${cs.name}] ${where}: 저장 토글에 aria-pressed 없음 <${tag(e)}>`); });
  // 한자·가나 조각의 lang: 가장 가까운 lang 조상이 한국어면 오류(UI가 한국어일 때만 의미가 있고, UI가 중국어면 한국어 조각을 본다)
  const tw = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT); let n; const seen = new Set();
  while ((n = tw.nextNode())) {
    const p = n.parentElement; if (!p || p.closest('script,style,.hidden,#intro,svg') || !vis(w, p)) continue;
    const t = n.nodeValue; const lg = (p.closest('[lang]') || d.documentElement).getAttribute('lang') || '';
    const cjk = /[぀-ヿ一-鿿]/.test(t), han = /[가-힣]/.test(t);
    if (/[\u3040-\u30ff]/.test(t) && cs.tgt === 'ja' && !/^ja/i.test(lg) && !han && !seen.has(t.trim())) { seen.add(t.trim()); problems.push(`[${cs.name}] ${where}: lang=${lg}인데 가나 "${t.trim().slice(0, 14)}" <${tag(p)}>`); }
    if (cjk && /^ko/i.test(lg) && !han && !seen.has(t.trim())) { seen.add(t.trim()); problems.push(`[${cs.name}] ${where}: lang=${lg}인데 한자·가나 "${t.trim().slice(0, 14)}" <${tag(p)}>`); }
    if (han && cs.ui === 'ko' && /^(zh|ja)/i.test(lg) && !cjk && !seen.has(t.trim())) { seen.add(t.trim()); problems.push(`[${cs.name}] ${where}: lang=${lg}인데 한글 "${t.trim().slice(0, 14)}" <${tag(p)}>`); }
  }
  // 포커스 순서: DOM 순서대로 훑을 때 위로 80px 넘게 되돌아가는 곳(고정 막대 제외)
  // 2열 격자(#sentences)는 카드 단위로 왼쪽→오른쪽이 자연스러운 순서라 역행 검사에서 제외한다
  let prev = null; for (const e of focusables) { if (!e.closest('#sentences') || w.getComputedStyle(d.getElementById('sentences')).display === 'grid') continue; const r = e.getBoundingClientRect(); const y = r.top + w.scrollY; if (prev !== null && y < prev - 80) problems.push(`[${cs.name}] ${where}: 포커스 순서 역행 <${tag(e)}> y=${Math.round(y)} < ${Math.round(prev)}`); prev = y; }
}
function overflow200(w, cs, where) {
  const d = w.document, el = d.documentElement; el.style.fontSize = '200%'; const W = el.clientWidth;
  const bad = [...d.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > W + 2 && !e.closest('svg,nav,.hidden,.toolbar,pre') && w.getComputedStyle(e).visibility !== 'hidden'; });
  const roots = bad.filter((e) => !bad.includes(e.parentElement)).slice(0, 3).map((e) => e.tagName + '.' + String(e.className || e.id).slice(0, 24) + '<' + (e.parentElement ? e.parentElement.tagName + '.' + String(e.parentElement.className || e.parentElement.id).slice(0, 20) : '') + ' ' + Math.round(e.getBoundingClientRect().right) + '/' + W + ' [' + (()=>{const a=[];for(let x=e.parentElement;x&&x!==d.body;x=x.parentElement){if(x.getBoundingClientRect().right>W+2)a.push(x.tagName+'.'+String(x.className||x.id).slice(0,14));}return a.join('>');})() + ']' + ' "' + (e.textContent || '').trim().slice(0, 16) + '"');
  if (roots.length) problems.push(`[${cs.name}] ${where}: 글자 200%에서 가로 넘침 ${roots.join(' | ')}`);
  if (w.scrollX > 0 || d.documentElement.scrollWidth > W + 2) problems.push(`[${cs.name}] ${where}: 글자 200%에서 문서가 가로로 스크롤됨 (${d.documentElement.scrollWidth}>${W})`);
  el.style.fontSize = '';
}
for (const cs of CASES) {
  let w = await frame(cs); const chk = (where) => { check(w, cs, where); overflow200(w, cs, where); };
  chk('쓰기'); w.document.getElementById('lang-chip').click(); await sleep(500); chk('언어 고르기');
  w = await frame(cs);
  w.eval('render')(cs.data.result, false); w.eval('showResult')(); await sleep(600); chk('결과');
  { w.eval('learnOpen')(false); await sleep(300); chk('학습 시작 카드'); w.eval('lnMove')(1); await sleep(300); chk('학습 문장 카드'); const types = new Set(['s']); const S = w.eval('lnS'); for (let i = 1; i < S.cards.length; i++) { w.eval('lnMove')(1); await sleep(120); const t = S.cards[S.i].t; if (!types.has(t)) { types.add(t); await sleep(320); chk('학습 카드 ' + t); } } w.eval('lnS').i = S.cards.length - 1; w.eval('lnRender')(0); await sleep(300); w.document.getElementById('ln-next').click(); await sleep(700); chk('전체 읽기 페이지'); w.document.getElementById('rp-end').click(); await sleep(2600); chk('학습 통계'); w.document.getElementById('fin-home').click(); await sleep(400); w.eval('saveWords')([]); w.eval('showResult')(); await sleep(300); }
  const wd = w.document.querySelector('#sentences .wd'); if (wd) { wd.click(); await sleep(400); chk('단어 설명(펼침)');
    const pn = w.document.querySelector('.wsheet'); const cl = pn && pn.querySelector('[data-pclose]');
    if (!pn) problems.push(`[${cs.name}] 단어 설명: 단어를 눌러도 하단 단어 시트가 열리지 않음`);
    else {
      const mb = pn.querySelector('[data-wsmore]'); if (!mb) problems.push(`[${cs.name}] 단어 시트: 자세히 보기 버튼 없음`); else { mb.click(); await sleep(200); if (!pn.classList.contains('open') || mb.getAttribute('aria-expanded') !== 'true') problems.push(`[${cs.name}] 단어 시트: 자세히 보기가 펼쳐지지 않음`); chk('단어 시트(자세히)'); }
      if (w.document.getElementById('wpanel')) problems.push(`[${cs.name}] 하단 설명 패널이 남아 있음`);
      if (!cl) problems.push(`[${cs.name}] 단어 설명: 닫기 버튼 없음`); else { cl.focus(); if (w.document.activeElement !== cl) problems.push(`[${cs.name}] 단어 설명: 닫기 버튼에 포커스가 가지 않음`); cl.click(); await sleep(300); if (w.document.querySelector('.wsheet')) problems.push(`[${cs.name}] 단어 설명: 닫기를 눌러도 닫히지 않음`); else if (w.document.activeElement !== wd) problems.push(`[${cs.name}] 단어 설명: 닫은 뒤 포커스가 누른 단어로 돌아오지 않음 (지금 ${w.document.activeElement && w.document.activeElement.tagName})`); }
      wd.click(); await sleep(300); w.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(300); if (w.document.querySelector('.wsheet')) problems.push(`[${cs.name}] 단어 설명: Esc로 닫히지 않음`);
    }
    const cards = [...w.document.querySelectorAll('#tools .lcard')]; if (!cards.length) problems.push(`[${cs.name}] 단어·문법·활용 카드가 없음`);
    if (w.document.querySelector('#tools details')) problems.push(`[${cs.name}] 단어·문법·활용이 접히는 요소로 남아 있음`);
    const steps = [...w.document.querySelectorAll('#steps [data-step]')].filter((b) => !b.classList.contains('hidden')); if (steps.length < 2) problems.push(`[${cs.name}] 단계 표시줄 버튼이 부족함`);
    chk('단어·문법·활용(고정 펼침)'); }
  const ra = w.document.getElementById('read-all'); if (ra) { ra.click(); await sleep(800); chk('통독'); w.history.back(); await sleep(500); }
  const items = cs.data.result.vocab.map((v) => ({ zh: v.zh, ko: v.ko, ex_zh: v.example_zh, ex_ko: v.example_ko, due: 0 }));
  const sents = cs.data.result.sentences.map((s) => ({ zh: s.zh, ko: s.ko, due: 0 }));
  for (let i = 0; i < 8; i++) {
    w.eval('startQuiz')(i % 4 === 3 ? 'sent' : 'word', i % 4 === 3 ? sents : items);
    for (let step = 0; step < 6; step++) {
      chk('퀴즈'); const g = (id) => w.document.getElementById(id);
      if (g('q-go')) { g('q-go').click(); await sleep(80); continue; }
      if (g('q-reveal')) { g('q-reveal').click(); g('q-self-no') && g('q-self-no').click(); continue; }
      if (g('q-hint')) { g('q-hint').click(); g('q-in').value = 'zzz'; g('q-submit').click(); g('q-next') && g('q-next').click(); continue; }
      if (w.document.querySelector('[data-chip]')) { g('q-check') && g('q-check').click(); g('q-next') && g('q-next').click(); continue; }
      const opt = w.document.querySelector('[data-opt]'); if (opt) { opt.click(); g('q-next') && g('q-next').click(); continue; }
      break;
    }
  }
  for (const name of ['hist', 'word', 'set']) { w.eval('openSheet')(name); await sleep(400); chk('시트 ' + name); }
}
// 폭·테마 행렬: 쓰기·결과 화면을 폭 320/360/390/768/1200 × 라이트/다크로 열어 가로 넘침(글자 100%·200%)과 색 대비를 본다
const WIDTHS = [320, 360, 390, 768, 1200]; let frames = 0;
for (const cs of CASES) for (const theme of ['light', 'dark']) for (const width of WIDTHS) {
  for (const screen of ['쓰기', '결과', '학습']) {
    const w = await frame(cs, width, theme); frames++;
    if (screen === '결과') { w.eval('render')(cs.data.result, false); w.eval('showResult')(); await sleep(500); }
    if (screen === '학습') { w.eval('render')(cs.data.result, false); w.eval('showResult')(); w.eval('learnOpen')(false); await sleep(300); w.eval('lnMove')(1); await sleep(300); }
    const tagw = `${screen} ${width}px`; contrast(w, cs, tagw, theme); overflow200(w, cs, tagw + ' ' + theme);
    const d = w.document, W = d.documentElement.clientWidth; if (d.documentElement.scrollWidth > W + 2) problems.push(`[${cs.name}/${theme}] ${tagw}: 글자 100%에서 문서가 가로로 스크롤됨 (${d.documentElement.scrollWidth}>${W})`);
  }
}
// 다크에서 그린 페이지도 색 대비를 본다(퀴즈·시트): 라이트 흐름과 같은 화면을 다크로 한 번 더
for (const cs of CASES) {
  const w = await frame(cs, 360, 'dark'); w.eval('render')(cs.data.result, false); w.eval('showResult')(); await sleep(500);
  const wd = w.document.querySelector('#sentences .wd'); if (wd) { wd.click(); await sleep(400); contrast(w, cs, '단어 설명', 'dark'); const cl = w.document.querySelector('[data-pclose]'); if (cl) cl.click(); await sleep(300); }
  const ra = w.document.getElementById('read-all'); if (ra) { ra.click(); await sleep(800); contrast(w, cs, '통독', 'dark'); w.history.back(); await sleep(400); }
  for (const name of ['hist', 'word', 'set']) { w.eval('openSheet')(name); await sleep(400); contrast(w, cs, '시트 ' + name, 'dark'); }
  const items = cs.data.result.vocab.map((v) => ({ zh: v.zh, ko: v.ko, ex_zh: v.example_zh, ex_ko: v.example_ko, due: 0 }));
  w.eval('startQuiz')('word', items); await sleep(300); contrast(w, cs, '퀴즈', 'dark');
}
return JSON.stringify({ frames, cases: CASES.map((c) => c.name), problems: [...new Set(problems)] });
