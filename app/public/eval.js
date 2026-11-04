// 사용자 평가(T48b): ?eval=1 일 때만 index.html이 불러온다. 3분 미션 안내 + 진행 표시 + 설문 8문항 + 제출 + 자동 기록.
// 받지 않는 것: 일기 내용, 번역 결과, 이름·이메일. 자유 입력은 Q6 하나뿐이다.
(() => {
  // ----- 설정(한 곳) -----
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzX0GGSDPftbhiBnSibnDKKOg-8Uxbdgm6covfr6vkj4bptML43XN8HR8rt3SYFcC4RPQ/exec';
  const BIRD = (name, size) => { try { return window.bird ? window.bird(name, size) : (typeof bird === 'function' ? bird(name, size) : ''); } catch (e) { return ''; } };
  const KEY = 'smd-eval-state', DONE = 'smd-eval-done';
  const MISSIONS = ['한 줄 일기 쓰기', '번역 결과 보기', '단어 눌러 소리 듣기', '퀴즈 1문제'];
  const isTest = /[?&]test=1(&|$)/.test(location.search) || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  const real = window.__realLS || window.localStorage; // 앱은 임시 저장소를 쓰므로, 응답 완료 표시만 진짜 저장소에 둔다
  const ls = {
    get(k) { try { return real.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { real.setItem(k, v); } catch (e) {} },
  };
  const ss = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const rid = () => { try { return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join(''); } catch (e) { return String(Date.now()) + Math.random().toString(16).slice(2, 8); } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // 상태: 새로고침해도 이어지게 sessionStorage에 둔다(이름·내용 없음)
  const st = ss.get(KEY) || { id: rid(), t0: null, t: [null, null, null, null], tfail: 0, vfail: 0, pair: '', a: {} };
  const save = () => ss.set(KEY, st);
  const secs = () => Math.round((Date.now() - st.t0) / 100) / 10;
  const done = ls.get(DONE) === '1';

  // ----- 스타일 -----
  const css = document.createElement('style');
  css.textContent = `
  :root { --ev-h: 72px; }
  body.eval-on { padding-top: var(--ev-h); }
  body.eval-on header.top { top: var(--ev-h); }
  body.eval-on .overlay, body.eval-on .wpage, body.eval-on .learn-ov { top: var(--ev-h); }
  #ev-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 90; height: var(--ev-h); display: flex; flex-direction: column; background: var(--ink); color: var(--paper); font-family: var(--f-ui); }
  #ev-bar .ev-row1 { height: 34px; display: flex; align-items: center; gap: 6px; padding: 0 8px 0 12px; }
  #ev-bar .ev-row2 { flex: 1; display: flex; align-items: center; gap: 8px; padding: 0 8px 0 12px; border-top: 1px solid rgba(255,255,255,.25); }
  #ev-bar .ev-hint { flex: 1; font-size: 14px; line-height: 1.3; font-weight: 700; }
  #ev-bar .ev-chips { flex: 1; display: flex; gap: 6px; font-size: 12px; line-height: 1; min-width: 0; }
  #ev-bar .ev-m { flex: 1; display: flex; align-items: center; gap: 4px; opacity: .55; min-width: 0; white-space: nowrap; }
  #ev-bar .ev-m i { flex: none; width: 10px; height: 10px; border: 1px solid var(--paper); border-radius: 50%; }
  #ev-bar .ev-m.on { opacity: 1; }
  #ev-bar .ev-m.on i { background: var(--paper); box-shadow: inset 0 0 0 2px var(--ink); }
  #ev-bar button { flex: none; border: 1px solid var(--paper); background: transparent; color: var(--paper); border-radius: 999px; padding: 4px 10px; font: inherit; font-size: 12px; cursor: pointer; }
  #ev-bar button.go { background: var(--paper); color: var(--ink); font-weight: 700; font-size: 13px; padding: 6px 12px; }
  #ev-pop { position: fixed; top: calc(var(--ev-h) + 8px); left: 12px; right: 12px; z-index: 92; max-width: 496px; margin: 0 auto; background: var(--paper); color: var(--ink); border: 2px solid var(--ink); border-radius: 18px; box-shadow: 0 8px 28px rgba(0,0,0,.28); padding: 14px 16px; display: flex; gap: 12px; align-items: center; font-family: var(--f-ui); animation: ev-in .25s ease-out; }
  #ev-pop .ev-bird { flex: none; width: 64px; height: 64px; }
  #ev-pop .ev-bird img { width: 64px; height: 64px; object-fit: contain; }
  #ev-pop .ev-pb { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  #ev-pop .ev-step { font-size: 12px; color: var(--muted); }
  #ev-pop .ev-msg { font-size: 17px; line-height: 1.4; font-weight: 700; }
  #ev-pop .ev-desc { font-size: 14px; line-height: 1.5; color: var(--muted); }
  #ev-pop .ev-pbtn { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  #ev-pop .ev-pbtn button { min-height: 40px; padding: 6px 16px; border-radius: 999px; border: 1px solid var(--ink); background: var(--paper); color: var(--ink); font: inherit; font-size: 14px; cursor: pointer; }
  #ev-pop .ev-pbtn button.go { background: var(--ink); color: var(--paper); font-weight: 700; }
  @keyframes ev-in { from { opacity: 0; transform: translateY(-8px); } }
  .ev-bird-lg { display: flex; justify-content: center; }
  .ev-hl { outline: 3px solid var(--ink) !important; outline-offset: 3px; animation: ev-pulse 1.2s ease-in-out infinite; }
  @keyframes ev-pulse { 50% { outline-color: transparent; } }
  @media (prefers-reduced-motion: reduce) { .ev-hl { animation: none; } }
  .ev-ov { position: fixed; inset: 0; z-index: 95; overflow: auto; background: var(--paper); color: var(--ink); padding: 24px 16px calc(24px + env(safe-area-inset-bottom)); font-family: var(--f-ui); }
  .ev-box { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  .ev-box h2 { margin: 0; font-size: var(--fs-l); line-height: 1.3; }
  .ev-box p { margin: 0; line-height: 1.6; }
  .ev-box ol { margin: 0; padding-left: 22px; line-height: 1.9; }
  .ev-note { padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--cell); font-size: var(--fs-s); }
  .ev-prog { display: flex; align-items: center; gap: 4px; }
  .ev-prog i { flex: 1; height: 4px; border-radius: 2px; background: var(--line); }
  .ev-prog i.on { background: var(--ink); }
  .ev-q { font-size: var(--fs-l); line-height: 1.4; font-weight: 700; }
  .ev-sub { color: var(--muted); font-size: var(--fs-s); }
  .ev-opts { display: flex; flex-direction: column; gap: 8px; }
  .ev-opt { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--cell); color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
  .ev-opt[aria-pressed="true"], .ev-opt[aria-checked="true"] { border-color: var(--ink); background: var(--ink); color: var(--paper); }
  .ev-scale { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .ev-scale .ev-opt { justify-content: center; padding: 8px 0; font-size: var(--fs-l); }
  .ev-ends { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); font-size: var(--fs-s); }
  .ev-row { display: flex; flex-direction: column; gap: 8px; }
  .ev-row b { font-size: var(--fs-m); }
  .ev-ta { width: 100%; min-height: 110px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--cell); color: var(--ink); font: inherit; font-size: 16px; resize: vertical; }
  .ev-in { width: 100%; min-height: 48px; padding: 8px 14px; border: 1px solid var(--ink); border-radius: 12px; background: var(--cell); color: var(--ink); font: inherit; font-size: 16px; }
  .ev-act { display: flex; gap: 8px; justify-content: space-between; }
  .ev-act .btn, .ev-act .primary { margin: 0; white-space: nowrap; }
  .ev-act .primary { flex: 1; justify-content: center; padding: 0 24px; }
  .ev-act .btn { padding: 4px 20px; }
  .ev-act [hidden] { display: none !important; }
  .ev-act .primary[disabled] { opacity: .35; }
  .ev-err { color: var(--ink); border: 1px solid var(--ink); border-radius: 12px; padding: 10px 14px; font-size: var(--fs-s); }
  `;
  document.head.appendChild(css);

  // ----- 진행 표시 + 지금 할 일 안내 -----
  // 위쪽 줄: 진행 칸 + 지금 할 일 한 줄(항상). 팝업: 화면이 크게 바뀌는 세 순간(홈·카드 학습·퀴즈)에 한 번만 설명하고,
  // 입력 중이거나 문제를 풀 때는 띄우지 않는다. 팝업은 위치를 바꾸지 않는다.
  let wasLearn = false, autoGo = null;
  let bar = null, hl = null, pop = null, popStage = '', dismissed = {}, lastTxt = '';
  const vis = (el) => !!el && el.getClientRects().length > 0 && !el.closest('.hidden');
  const g = (f) => { try { return f(); } catch (e) { return undefined; } };
  const onTop = (sel) => [...document.querySelectorAll(sel)].filter(vis).filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; })[0] || null;
  const tn = () => { try { return tgtName(); } catch (e) { return '외국어'; } };
  const skip = () => ['퀴즈로 넘어가기', startQuiz];
  // 지금 단계: 화면 상태로 정한다.
  // {n: 단계, pose: 새 동작, t: 한 줄 안내, d: 설명, target: 깜박일 요소, act: [버튼, 동작], stage: 팝업을 자동으로 띄울 순간, ptitle/pdesc: 그 팝업 문구}
  function phase() {
    if (vis(document.getElementById('quiz'))) {
      const q = { stage: 'quiz', ptitle: '퀴즈 한 문제를 풀어 볼게요', pdesc: '배운 단어를 퀴즈로 확인해요. 처음 보는 단어는 뜻을 먼저 보여 준 뒤, 알맞은 답을 고르는 문제가 나와요. 한 문제만 풀고 "계속"을 누르면 설문이 열려요.' };
      if (document.getElementById('q-next')) return { ...q, n: 4, pose: 'saved', t: '잘했어요! 아래 "계속"을 눌러 주세요', d: '정답과 설명을 확인했다면 "계속"을 눌러요. 체험은 여기까지예요. 이어서 짧은 설문이 열려요.', target: document.getElementById('q-next') };
      if (document.getElementById('q-go')) return { ...q, n: 4, pose: 'review', t: '새 단어예요. 읽고 아래 버튼을 눌러 주세요', d: '처음 보는 단어는 문제 전에 뜻과 읽는 법을 먼저 보여 줘요. 충분히 읽었으면 문제로 넘어가요.', target: document.getElementById('q-go') };
      if (document.querySelector('#quiz [data-opt]')) return { ...q, n: 4, pose: 'thinking', t: '알맞은 답을 눌러 보세요', d: '소리나 뜻을 보고 알맞은 답을 하나 골라요. 틀려도 정답과 설명을 보여 주니 편하게 눌러 보세요.' };
      return { ...q, n: 4, pose: 'thinking', t: '답을 쓰고 "확인"을 눌러 보세요', d: '읽는 법을 직접 써 보는 문제예요. 모르면 힌트를 보고 써도 돼요.', target: document.getElementById('q-check') };
    }
    if (st.t[1] != null) {
      const learn = { stage: 'learn', ptitle: '카드로 공부해 볼게요', pdesc: `내가 쓴 일기가 카드로 나뉘어 있어요. 아래 "시작하기"를 눌러 카드를 넘기며 뜻과 읽는 법을 보고, 스피커 버튼을 눌러 ${tn()} 발음을 들어 보세요. 마지막 카드까지 보면 퀴즈로 이어져요.` };
      const play = onTop('#learn .play') || onTop('#result .play');
      const nx = document.getElementById('ln-next');
      const intro = g(() => lnS.cards[lnS.i].t === 'intro');
      if (intro) return { ...learn, n: 3, pose: 'read-aloud', t: '아래 "시작하기"를 눌러 주세요', d: '내 일기가 카드로 나뉘어 있어요. "시작하기"를 누르면 첫 카드가 열려요.', target: vis(nx) ? nx : null };
      if (play && st.t[2] == null) return { ...learn, n: 3, pose: 'listening', t: '스피커 버튼을 눌러 소리를 들어 보세요', d: `스피커를 누르면 ${tn()} 발음을 들려 줘요. 읽는 속도에 맞춰 글자 색이 바뀌니 따라 읽어 보세요.`, target: play };
      return { ...learn, n: 3, pose: 'read-aloud', t: st.t[2] == null ? '아래 버튼으로 카드를 넘겨 보세요' : '카드를 끝까지 넘기면 퀴즈로 이어져요', d: '"다음"으로 카드를 넘기며 뜻과 읽는 법을 보세요. 마지막 카드 다음에는 퀴즈가 자동으로 시작돼요.', target: vis(nx) ? nx : null };
    }
    if (g(() => typeof controller !== 'undefined' && controller)) return { n: 2, pose: 'thinking', t: '번역 중이에요. 30초쯤 걸려요', d: `AI가 일기를 ${tn()}로 바꾸고 읽는 법·단어·문법을 정리하는 중이에요.` };
    const d = document.getElementById('diary');
    if (!vis(d)) return { n: 1, pose: 'hello', t: '아래 "일기 쓰러 가기"를 눌러 주세요', d: `이 앱은 내가 쓴 일기를 ${tn()}로 바꿔 보여 주고, 그 문장으로 단어와 문법을 배우게 해 줘요.`, target: document.getElementById('nest-go'), stage: 'home', ptitle: '이렇게 진행돼요', pdesc: `① "일기 쓰러 가기"를 눌러 오늘 일을 한 줄 써요. ② "번역하고 배우기"를 누르면 AI가 ${tn()}로 번역하고 읽는 법·단어 뜻을 만들어 줘요. ③ 카드로 공부하며 소리를 듣고, ④ 퀴즈를 한 문제 풀면 끝이에요. 일기 내용은 수집하지 않아요.` };
    if (d.value.trim().length >= 2) return { n: 2, pose: 'writing', t: '아래 "번역하고 배우기"를 눌러 주세요', d: `누르면 AI가 일기를 ${tn()}로 번역하고, 읽는 법과 단어 뜻을 만들어 줘요.`, target: document.getElementById('go') };
    return { n: 1, pose: 'writing', t: '오늘 있었던 일을 한 줄만 써 보세요', d: `한국어로 쓰면 ${tn()}로 번역돼 배울 자료가 돼요. 아무 내용이나 괜찮아요.`, target: d };
  }
  function startQuiz() {
    g(() => { if (lnS.open) learnHide(); });
    let ok = false;
    g(() => { if (currentSavedEntries().length) { quizFromCurrent(); ok = true; } });
    if (!ok) g(() => { const e = currentVocab.slice(0, 5).map((item) => ({ item, kind: 'word' })); if (e.length) { startEntries(e); ok = true; } });
    if (!ok) { st.t[3] = null; openSurvey(); } // 퀴즈를 만들 수 없으면 설문으로 바로 넘어간다
  }
  const NAMES = ['일기', '번역', '소리', '퀴즈'];
  function renderBar() {
    if (!bar) return;
    const learnNow = !!g(() => lnS.open);
    if (wasLearn && !learnNow && st.t[1] != null && st.t[3] == null && !surveyOpen && !vis(document.getElementById('quiz'))) { wasLearn = false; startQuiz(); }
    wasLearn = learnNow;
    const qg = document.getElementById('q-go');
    if (qg && vis(qg) && qg !== autoGo) { autoGo = qg; setTimeout(() => { if (document.body.contains(qg) && vis(qg)) qg.click(); }, 700); } // 새 단어 설명 카드는 건너뛰고 바로 문제로
    const p = phase(), on = st.t.map((x) => x != null);
    const sig = JSON.stringify([on, p.t, p.act && p.act[0]]);
    if (bar.dataset.sig !== sig) {
      bar.dataset.sig = sig;
      bar.innerHTML = `<div class="ev-row1"><div class="ev-chips">${NAMES.map((m, i) => `<div class="ev-m${on[i] ? ' on' : ''}"><i></i><span>${i + 1} ${m}</span></div>`).join('')}</div><button type="button" id="ev-help">설명</button><button type="button" id="ev-go-survey">설문으로</button></div>
        <div class="ev-row2" role="status"><span class="ev-hint">${esc(p.t)}</span>${p.act ? `<button type="button" class="go" id="ev-act">${esc(p.act[0])}</button>` : ''}</div>`;
    }
    if (hl !== p.target) { if (hl) hl.classList.remove('ev-hl'); hl = p.target || null; if (hl) hl.classList.add('ev-hl'); }
    // 팝업: 새 순간에 들어올 때 한 번만(닫았으면 다시 띄우지 않는다)
    const stage = p.stage || '';
    if (stage !== popStage) {
      popStage = stage;
      if (pop) { pop.remove(); pop = null; }
      if (stage && !dismissed[stage] && !surveyOpen) drawPop(p.pose, p.n, p.ptitle, p.pdesc, p.act);
    }
  }
  function drawPop(pose, n, title, desc, act) {
    if (pop) pop.remove();
    pop = document.createElement('div'); pop.id = 'ev-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', '안내');
    pop.innerHTML = `<div class="ev-bird">${BIRD(pose, 64)}</div><div class="ev-pb"><div class="ev-step">${n} / 4 단계</div><div class="ev-msg">${esc(title)}</div><div class="ev-desc">${esc(desc)}</div>
      <div class="ev-pbtn">${act ? `<button type="button" class="go" id="ev-act2">${esc(act[0])}</button>` : ''}<button type="button" id="ev-ok">${act ? '더 해 볼게요' : '알겠어요'}</button></div></div>`;
    document.body.appendChild(pop);
  }
  function mountBar() {
    bar = document.createElement('div'); bar.id = 'ev-bar'; bar.setAttribute('aria-label', '진행 표시');
    document.body.appendChild(bar); document.body.classList.add('eval-on'); renderBar();
    setInterval(renderBar, 400);
    document.addEventListener('click', (e) => {
      const c = e.target.closest ? e.target : null; if (!c) return;
      if (c.closest('#ev-ok')) { dismissed[popStage] = true; if (pop) pop.remove(); pop = null; }
      else if (c.closest('#ev-act2')) { dismissed[popStage] = true; if (pop) pop.remove(); pop = null; startQuiz(); }
      else if (c.closest('#ev-act')) { const p = phase(); if (p.act) p.act[1](); }
      else if (c.closest('#ev-go-survey')) openSurvey();
      else if (c.closest('#ev-help')) { const p = phase(); drawPop(p.pose, p.n, p.t, p.d, null); }
    });
  }
  function unmountBar() { if (bar) bar.remove(); bar = null; if (pop) pop.remove(); pop = null; if (hl) hl.classList.remove('ev-hl'); document.body.classList.remove('eval-on'); }

  function mark(i) {
    if (!st.t0 || st.t[i] != null) return;
    st.t[i] = secs(); save(); renderBar();
  }

  // 앱이 알려 주는 일: translated · tfail · vfail · quiz
  function ev(name) {
    if (done || !st.t0) return;
    if (name === 'translated') { mark(1); try { st.pair = LANG.src + '>' + LANG.tgt; } catch (e) {} save(); }
    else if (name === 'tfail') { st.tfail++; save(); }
    else if (name === 'vfail') { st.vfail++; save(); }
    else if (name === 'quiz') mark(3);
    else if (name === 'sound') mark(2);
  }
  window.smdEval = { ev };

  // 입력·소리 듣기는 화면 이벤트로 알아낸다(앱 코드는 건드리지 않는다)
  document.addEventListener('input', (e) => { if (st.t0 && e.target && e.target.id === 'diary' && e.target.value.trim().length >= 2) mark(0); }, true);
  document.addEventListener('click', (e) => {
    if (!st.t0 || done) return;
    if (e.target.closest && e.target.closest('#ln-next') && g(() => { const n = lnS.cards[lnS.i + 1]; return lnS.cards[lnS.i].t === 'r' || (n && n.t === 'r'); }) && st.t[1] != null && !surveyOpen) {
      e.stopPropagation(); e.preventDefault(); wasLearn = false; startQuiz(); return; // 마지막 카드 다음은 퀴즈로 바로 이어진다
    }
    if (e.isTrusted && e.target.closest && e.target.closest('.play')) mark(2); // 앱이 자동으로 누르는 재생은 세지 않는다
    // 퀴즈 1문제를 풀고 "계속/결과 보기"를 누르면 설문으로 넘어간다
    if (e.target.closest && e.target.closest('#q-next') && st.t[3] != null && !surveyOpen) {
      e.stopPropagation(); e.preventDefault();
      try { closeQuiz(); } catch (x) {}
      openSurvey();
    }
  }, true);

  // ----- 안내 -----
  function showGuide() {
    const ov = document.createElement('div'); ov.className = 'ev-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'ev-gt');
    if (done) {
      ov.innerHTML = `<div class="ev-box"><h2 id="ev-gt">이미 응답해 주셨어요</h2><p>같은 기기에서는 한 번만 받아요. 참여해 주셔서 고마워요.</p><div class="ev-act"><button class="primary" id="ev-close" type="button"><span>앱 둘러보기</span></button></div></div>`;
      document.body.appendChild(ov);
      ov.querySelector('#ev-close').addEventListener('click', () => ov.remove());
      return;
    }
    ov.innerHTML = `<div class="ev-box">
      <div class="ev-bird-lg">${BIRD('hello', 120)}</div>
      <h2 id="ev-gt">Say My Day 3분 테스트</h2>
      <p>일기 한 줄을 쓰면 중국어로 바꿔 줘요. 화면 위쪽 안내를 따라 눌러 보세요. 끝나면 짧은 설문(약 2분)이 이어져요.</p>
      <div class="ev-note">일기 내용은 저장·수집하지 않아요. 이름·이메일도 받지 않아요. 걸린 시간과 오류 횟수, 설문 답만 모아요.</div>
      <div class="ev-act"><button class="primary" id="ev-start" type="button"><span>시작하기</span></button></div></div>`;
    document.body.appendChild(ov);
    const b = ov.querySelector('#ev-start'); b.focus({ preventScroll: true });
    b.addEventListener('click', () => { st.t0 = Date.now(); save(); ov.remove(); mountBar(); const d = document.getElementById('diary'); if (d) d.focus({ preventScroll: true }); });
  }

  // ----- 설문 -----
  const Q = [
    { k: 'q1', t: '설명 없이 쓰기 편했나요?', type: 'scale', lo: '매우 불편함', hi: '아주 편함' },
    { k: 'q2', t: '써 보면서 헷갈리거나 어려웠던 단계가 있었나요?', sub: '해당하는 것을 모두 골라 주세요.', type: 'multi', none: '어려운 단계 없음', opts: ['어려운 단계 없음', '어디를 눌러야 할지 몰랐음', '일기 쓰기', '번역 기다리기', '소리 듣기', '카드로 학습하기', '퀴즈', '기타'] },
    { k: 'q3', t: '겪은 문제가 있나요?', sub: '해당하는 것을 모두 골라 주세요.', type: 'multi', none: '없음', opts: ['없음', '번역 실패', '소리 안 남', '병음·뜻이 이상함', '화면 깨짐', '너무 느림', '기타'] },
    { k: 'q4', t: '다시 쓰고 싶나요?', type: 'scale', lo: '전혀 아님', hi: '꼭 쓰고 싶음' },
    { k: 'q5', t: '쓴다면 얼마나 자주 쓸 것 같아요?', type: 'single', opts: ['매일', '주 몇 번', '가끔', '안 씀'] },
    { k: 'q6', t: '좋았던 점이나 아쉬운 점을 한 줄로 남겨 주세요', sub: '선택 사항이에요. 일기 내용은 쓰지 마세요.', type: 'text', max: 100 },
    { k: 'q7', t: '배우고 싶은 언어가 있다면 어떤 언어를 배우고 싶나요?', type: 'single', opts: ['중국어', '일본어', '영어', '기타'], other: '기타', otherHint: '배우고 싶은 언어를 적어 주세요' },
    { k: 'lv', t: () => `${langName()}에 대한 지금 내 수준은 어떤가요?`, sub: '1 = 거의 모름 · 3 = 쉬운 문장은 이해함 · 5 = 자유롭게 씀', type: 'levels', rows: [['listen', '듣기'], ['read', '읽기'], ['speak', '말하기']] },
    { k: 'ease', t: '앱으로 배워 본 느낌은 어땠나요?', type: 'levels', rows: [['ease', '이해하기 쉬웠나요?', '1 매우 어려웠음', '5 매우 쉬웠음'], ['doable', '배우는 양과 과정이 할 만했나요?', '1 너무 벅찼음', '5 딱 할 만했음']] },
  ];
  let surveyOpen = false, qi = 0, ov = null;
  const langName = () => { const v = st.a.q7; return v === '기타' ? ((st.a.q7o || '').trim() || '그 언어') : (v || '그 언어'); };
  const qTitle = (q) => (typeof q.t === 'function' ? q.t() : q.t);

  const answered = (q) => {
    const a = st.a;
    if (q.type === 'text') return true; // 선택
    if (q.type === 'multi') return Array.isArray(a[q.k]) && a[q.k].length > 0;
    if (q.type === 'levels') return q.rows.every(([k]) => a[k]);
    if (q.other && a[q.k] === q.other) return !!(a.q7o || '').trim();
    return !!a[q.k];
  };
  function body(q) {
    const a = st.a;
    if (q.type === 'scale') {
      return `<div class="ev-scale" role="radiogroup" aria-label="${esc(qTitle(q))}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="ev-opt" role="radio" aria-checked="${a[q.k] === n}" data-v="${n}">${n}</button>`).join('')}</div><div class="ev-ends"><span>1 ${esc(q.lo)}</span><span>5 ${esc(q.hi)}</span></div>`;
    }
    if (q.type === 'single') return `<div class="ev-opts" role="radiogroup" aria-label="${esc(qTitle(q))}">${q.opts.map((o) => `<button type="button" class="ev-opt" role="radio" aria-checked="${a[q.k] === o}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>${q.other && a[q.k] === q.other ? `<input class="ev-in" id="ev-oth" type="text" maxlength="14" value="${esc(a.q7o || '')}" placeholder="${esc(q.otherHint)}" aria-label="${esc(q.otherHint)}">` : ''}`;
    if (q.type === 'multi') return `<div class="ev-opts" role="group" aria-label="${esc(qTitle(q))}">${q.opts.map((o) => `<button type="button" class="ev-opt" aria-pressed="${(a[q.k] || []).includes(o)}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    if (q.type === 'text') return `<textarea class="ev-ta" id="ev-ta" maxlength="${q.max}" placeholder="예: 소리가 빨라서 좋았어요" aria-label="${esc(qTitle(q))}">${esc(a[q.k] || '')}</textarea><div class="ev-sub" id="ev-cnt">${(a[q.k] || '').length}/${q.max}자</div>`;
    return q.rows.map(([k, label, lo, hi]) => `<div class="ev-row"><b>${esc(label)}</b><div class="ev-scale" role="radiogroup" aria-label="${esc(label)}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="ev-opt" role="radio" aria-checked="${a[k] === n}" data-row="${k}" data-v="${n}">${n}</button>`).join('')}</div>${lo ? `<div class="ev-ends"><span>${esc(lo)}</span><span>${esc(hi)}</span></div>` : ''}</div>`).join('');
  }
  function renderSurvey(msg) {
    const q = Q[qi], last = qi === Q.length - 1;
    ov.innerHTML = `<div class="ev-box">
      <div class="ev-prog" aria-hidden="true">${Q.map((_, i) => `<i class="${i <= qi ? 'on' : ''}"></i>`).join('')}</div>
      ${qi === 0 ? `<div class="ev-note" style="display:flex;gap:12px;align-items:center"><span style="flex:none">${BIRD('saved', 56)}</span><span>수고하셨어요! 설문 ${Q.length}문항만 남았어요. 약 2분이면 돼요.</span></div>` : ''}
      <div class="ev-sub">${qi + 1} / ${Q.length}</div>
      <div class="ev-q" id="ev-qt" tabindex="-1">${esc(qTitle(q))}</div>
      ${q.sub ? `<div class="ev-sub">${esc(q.sub)}</div>` : ''}
      ${body(q)}
      ${msg ? `<div class="ev-err" role="alert">${esc(msg)}</div>` : ''}
      <div class="ev-act"><button class="btn" id="ev-prev" type="button"${qi === 0 ? ' hidden' : ''}>이전</button><button class="primary" id="ev-next" type="button"${answered(q) ? '' : ' disabled'}><span>${last ? '제출하기' : q.type === 'text' ? '다음' : '다음'}</span></button></div></div>`;
    const t = ov.querySelector('#ev-qt'); if (t) t.focus({ preventScroll: true });
    ov.scrollTop = 0;
  }
  function openSurvey() {
    if (surveyOpen || done) return;
    surveyOpen = true; if (pop) { pop.remove(); pop = null; } try { stopSpeak(); } catch (e) {}
    ov = document.createElement('div'); ov.className = 'ev-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', '설문');
    document.body.appendChild(ov); qi = 0; renderSurvey();
    ov.addEventListener('click', (e) => {
      const q = Q[qi], opt = e.target.closest('.ev-opt');
      if (opt) {
        const v = opt.dataset.v;
        if (q.type === 'scale') st.a[q.k] = Number(v);
        else if (q.type === 'single') st.a[q.k] = v;
        else if (q.type === 'levels') st.a[opt.dataset.row] = Number(v);
        else if (q.type === 'multi') {
          let cur = st.a[q.k] || [];
          if (cur.includes(v)) cur = cur.filter((x) => x !== v);
          else cur = v === q.none ? [v] : [...cur.filter((x) => x !== q.none), v];
          st.a[q.k] = cur;
        }
        save(); renderSurvey(); // 같은 질문을 다시 그린다
        return;
      }
      if (e.target.closest('#ev-prev')) { qi = Math.max(0, qi - 1); renderSurvey(); return; }
      if (e.target.closest('#ev-next')) {
        if (!answered(q)) return;
        if (qi < Q.length - 1) { qi++; renderSurvey(); } else submit();
      }
    });
    ov.addEventListener('input', (e) => {
      if (e.target.id === 'ev-oth') { st.a.q7o = e.target.value.slice(0, 14); save(); const n = ov.querySelector('#ev-next'); if (n) n.disabled = !(st.a.q7o || '').trim(); return; }
      if (e.target.id !== 'ev-ta') return;
      st.a.q6 = e.target.value.slice(0, 100); save();
      const c = ov.querySelector('#ev-cnt'); if (c) c.textContent = st.a.q6.length + '/100자';
    });
  }

  function payload() {
    const a = st.a;
    let pair = st.pair; try { if (!pair) pair = LANG.src + '>' + LANG.tgt; } catch (e) {}
    return {
      id: st.id, test: isTest,
      q1: a.q1, q2: a.q2, q3: a.q3, q4: a.q4, q5: a.q5, q6: (a.q6 || '').trim(), q7: a.q7 === '기타' ? '기타: ' + (a.q7o || '').trim() : a.q7, ease: a.ease, doable: a.doable,
      listen: a.listen, read: a.read, speak: a.speak,
      pair, device: (matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) ? 'phone' : 'pc',
      width: window.innerWidth, tfail: st.tfail, vfail: st.vfail, t: st.t,
    };
  }
  async function submit() {
    const btn = ov.querySelector('#ev-next'); btn.disabled = true; btn.querySelector('span').textContent = '보내는 중…';
    try {
      const res = await fetch(SHEET_URL, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload()) });
      const j = await res.json();
      if (!j.ok) throw new Error('save');
      ls.set(DONE, '1'); try { sessionStorage.removeItem(KEY); } catch (e) {}
      ov.innerHTML = `<div class="ev-box"><div class="ev-bird-lg">${BIRD('hello', 120)}</div><h2>참여해 주셔서 고마워요</h2><p>응답이 저장됐어요. 이제 창을 닫아도 돼요.</p><div class="ev-act"><button class="primary" id="ev-fin" type="button"><span>앱 둘러보기</span></button></div></div>`;
      ov.querySelector('#ev-fin').addEventListener('click', () => { ov.remove(); surveyOpen = false; unmountBar(); });
      ov.querySelector('#ev-fin').focus();
    } catch (err) {
      renderSurvey('보내지 못했어요. 인터넷을 확인하고 다시 시도해 주세요. 답은 그대로 남아 있어요.');
      const n = ov.querySelector('#ev-next'); if (n) n.querySelector('span').textContent = '다시 시도';
    }
  }

  g(() => { // 마지막 카드 앞에서는 버튼 이름을 "퀴즈 풀기"로 바꾼다
    const orig = window.lnRender;
    if (typeof orig === 'function') window.lnRender = function (d) {
      const r = orig.apply(this, arguments);
      try { const n = lnS.cards[lnS.i + 1]; if (lnS.cards[lnS.i].t === 'r' || (n && n.t === 'r')) document.getElementById('ln-next-l').textContent = '퀴즈 풀기'; } catch (e) {}
      return r;
    };
  });
  if (done) showGuide();
  else if (st.t0) mountBar();
  else showGuide();
})();
