// 사용자 평가(T48b): ?eval=1 일 때만 index.html이 불러온다. 3분 미션 안내 + 진행 표시 + 설문 8문항 + 제출 + 자동 기록.
// 받지 않는 것: 일기 내용, 번역 결과, 이름·이메일. 자유 입력은 Q6 하나뿐이다.
(() => {
  // ----- 설정(한 곳) -----
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwaE9JjFM66NLjiDacHHX77UNgc9JAb3NnitwaxTDkaYH39l-ukf8UqgYCrevYa3xr_Dw/exec';
  const KEY = 'smd-eval-state', DONE = 'smd-eval-done';
  const MISSIONS = ['한 줄 일기 쓰기', '번역 결과 보기', '단어 눌러 소리 듣기', '퀴즈 1문제'];
  const isTest = /[?&]test=1(&|$)/.test(location.search) || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
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
  body.eval-on header.top { top: 30px; }
  #ev-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 90; height: 30px; display: flex; align-items: center; gap: 4px; padding: 0 8px; background: var(--ink); color: var(--paper); font-size: 12px; line-height: 1; }
  #ev-bar .m { flex: 1; min-width: 0; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; opacity: .6; }
  #ev-bar .m i { flex: none; width: 12px; height: 12px; border: 1px solid var(--paper); border-radius: 50%; }
  #ev-bar .m.on { opacity: 1; }
  #ev-bar .m.on i { background: var(--paper); box-shadow: inset 0 0 0 2px var(--ink); }
  #ev-bar .m span { overflow: hidden; text-overflow: ellipsis; }
  #ev-bar button { flex: none; border: 1px solid var(--paper); background: transparent; color: var(--paper); border-radius: 999px; padding: 3px 10px; font: inherit; cursor: pointer; }
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
  .ev-act { display: flex; gap: 8px; justify-content: space-between; }
  .ev-act .btn, .ev-act .primary { margin: 0; white-space: nowrap; }
  .ev-act .primary { flex: 1; justify-content: center; padding: 0 24px; }
  .ev-act .btn { padding: 4px 20px; }
  .ev-act .primary[disabled] { opacity: .35; }
  .ev-err { color: var(--ink); border: 1px solid var(--ink); border-radius: 12px; padding: 10px 14px; font-size: var(--fs-s); }
  `;
  document.head.appendChild(css);

  // ----- 진행 표시 -----
  let bar = null;
  function renderBar() {
    if (!bar) return;
    bar.innerHTML = MISSIONS.map((m, i) => `<div class="m${st.t[i] != null ? ' on' : ''}"><i></i><span>${i + 1}. ${esc(m)}</span></div>`).join('')
      + '<button type="button" id="ev-go-survey">설문으로</button>';
  }
  function mountBar() {
    bar = document.createElement('div'); bar.id = 'ev-bar'; bar.setAttribute('aria-label', '미션 진행 표시');
    document.body.appendChild(bar); document.body.classList.add('eval-on'); renderBar();
    bar.addEventListener('click', (e) => { if (e.target.id === 'ev-go-survey') openSurvey(); });
  }
  function unmountBar() { if (bar) bar.remove(); bar = null; document.body.classList.remove('eval-on'); }

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
  }
  window.smdEval = { ev };

  // 입력·소리 듣기는 화면 이벤트로 알아낸다(앱 코드는 건드리지 않는다)
  document.addEventListener('input', (e) => { if (st.t0 && e.target && e.target.id === 'diary' && e.target.value.trim().length >= 2) mark(0); }, true);
  document.addEventListener('click', (e) => {
    if (!st.t0 || done) return;
    if (e.target.closest && e.target.closest('.play') && !e.target.closest('#ev-bar')) mark(2);
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
      <h2 id="ev-gt">3분 테스트에 참여해 주세요</h2>
      <p>Say My Day는 내가 쓴 일기를 중국어·일본어로 바꿔 배우는 앱이에요. 아래 네 가지를 해 보고, 끝나면 설문 8문항(약 2분)에 답해 주세요.</p>
      <ol>${MISSIONS.map((m) => `<li>${esc(m)}</li>`).join('')}</ol>
      <div class="ev-note">일기 내용과 번역 결과는 수집하지 않아요. 이름·이메일도 받지 않아요. 걸린 시간, 오류 횟수, 기기 종류 같은 사용 기록과 설문 답만 모아요. 일기는 아무 내용이나 한 줄이면 돼요.</div>
      <div class="ev-act"><span></span><button class="primary" id="ev-start" type="button"><span>시작하기</span></button></div></div>`;
    document.body.appendChild(ov);
    const b = ov.querySelector('#ev-start'); b.focus({ preventScroll: true });
    b.addEventListener('click', () => { st.t0 = Date.now(); save(); ov.remove(); mountBar(); const d = document.getElementById('diary'); if (d) d.focus({ preventScroll: true }); });
  }

  // ----- 설문 -----
  const Q = [
    { k: 'q1', t: '설명 없이 쓰기 편했나요?', type: 'scale', lo: '매우 불편함', hi: '아주 편함' },
    { k: 'q2', t: '어디서 막혔나요?', sub: '해당하는 것을 모두 골라 주세요.', type: 'multi', none: '막힌 곳 없음', opts: ['막힌 곳 없음', '시작 방법', '일기 쓰기', '번역 기다림', '소리 듣기', '단어 누르기', '퀴즈', '기타'] },
    { k: 'q3', t: '겪은 문제가 있나요?', sub: '해당하는 것을 모두 골라 주세요.', type: 'multi', none: '없음', opts: ['없음', '번역 실패', '소리 안 남', '병음·뜻이 이상함', '화면 깨짐', '너무 느림', '기타'] },
    { k: 'q4', t: '다시 쓰고 싶나요?', type: 'scale', lo: '전혀 아님', hi: '꼭 쓰고 싶음' },
    { k: 'q5', t: '쓴다면 얼마나 자주 쓸 것 같아요?', type: 'single', opts: ['매일', '주 몇 번', '가끔', '안 씀'] },
    { k: 'q6', t: '좋았던 점이나 아쉬운 점을 한 줄로 남겨 주세요', sub: '선택 사항이에요. 일기 내용은 쓰지 마세요.', type: 'text', max: 100 },
    { k: 'q7', t: '배우려는 언어는 무엇인가요?', type: 'single', opts: ['중국어', '일본어', '둘 다', '기타'] },
    { k: 'lv', t: '지금 내 수준은 어느 정도인가요?', sub: '1 = 거의 모름 · 3 = 쉬운 문장은 이해함 · 5 = 자유롭게 씀', type: 'levels', rows: [['listen', '듣기'], ['read', '읽기'], ['speak', '말하기']] },
  ];
  let surveyOpen = false, qi = 0, ov = null;

  const answered = (q) => {
    const a = st.a;
    if (q.type === 'text') return true; // 선택
    if (q.type === 'multi') return Array.isArray(a[q.k]) && a[q.k].length > 0;
    if (q.type === 'levels') return q.rows.every(([k]) => a[k]);
    return !!a[q.k];
  };
  function body(q) {
    const a = st.a;
    if (q.type === 'scale') {
      return `<div class="ev-scale" role="radiogroup" aria-label="${esc(q.t)}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="ev-opt" role="radio" aria-checked="${a[q.k] === n}" data-v="${n}">${n}</button>`).join('')}</div><div class="ev-ends"><span>1 ${esc(q.lo)}</span><span>5 ${esc(q.hi)}</span></div>`;
    }
    if (q.type === 'single') return `<div class="ev-opts" role="radiogroup" aria-label="${esc(q.t)}">${q.opts.map((o) => `<button type="button" class="ev-opt" role="radio" aria-checked="${a[q.k] === o}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    if (q.type === 'multi') return `<div class="ev-opts" role="group" aria-label="${esc(q.t)}">${q.opts.map((o) => `<button type="button" class="ev-opt" aria-pressed="${(a[q.k] || []).includes(o)}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    if (q.type === 'text') return `<textarea class="ev-ta" id="ev-ta" maxlength="${q.max}" placeholder="예: 소리가 빨라서 좋았어요" aria-label="${esc(q.t)}">${esc(a[q.k] || '')}</textarea><div class="ev-sub" id="ev-cnt">${(a[q.k] || '').length}/${q.max}자</div>`;
    return q.rows.map(([k, label]) => `<div class="ev-row"><b>${esc(label)}</b><div class="ev-scale" role="radiogroup" aria-label="${esc(label)}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="ev-opt" role="radio" aria-checked="${a[k] === n}" data-row="${k}" data-v="${n}">${n}</button>`).join('')}</div></div>`).join('');
  }
  function renderSurvey(msg) {
    const q = Q[qi], last = qi === Q.length - 1;
    ov.innerHTML = `<div class="ev-box">
      <div class="ev-prog" aria-hidden="true">${Q.map((_, i) => `<i class="${i <= qi ? 'on' : ''}"></i>`).join('')}</div>
      <div class="ev-sub">${qi + 1} / ${Q.length}</div>
      <div class="ev-q" id="ev-qt" tabindex="-1">${esc(q.t)}</div>
      ${q.sub ? `<div class="ev-sub">${esc(q.sub)}</div>` : ''}
      ${body(q)}
      ${msg ? `<div class="ev-err" role="alert">${esc(msg)}</div>` : ''}
      <div class="ev-act"><button class="btn" id="ev-prev" type="button"${qi === 0 ? ' hidden' : ''}>이전</button><button class="primary" id="ev-next" type="button"${answered(q) ? '' : ' disabled'}><span>${last ? '제출하기' : q.type === 'text' ? '다음' : '다음'}</span></button></div></div>`;
    const t = ov.querySelector('#ev-qt'); if (t) t.focus({ preventScroll: true });
    ov.scrollTop = 0;
  }
  function openSurvey() {
    if (surveyOpen || done) return;
    surveyOpen = true; try { stopSpeak(); } catch (e) {}
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
      q1: a.q1, q2: a.q2, q3: a.q3, q4: a.q4, q5: a.q5, q6: (a.q6 || '').trim(), q7: a.q7,
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
      ov.innerHTML = `<div class="ev-box"><h2>참여해 주셔서 고마워요</h2><p>응답이 저장됐어요. 이제 창을 닫아도 돼요.</p><div class="ev-act"><button class="primary" id="ev-fin" type="button"><span>앱 둘러보기</span></button></div></div>`;
      ov.querySelector('#ev-fin').addEventListener('click', () => { ov.remove(); surveyOpen = false; unmountBar(); });
      ov.querySelector('#ev-fin').focus();
    } catch (err) {
      renderSurvey('보내지 못했어요. 인터넷을 확인하고 다시 시도해 주세요. 답은 그대로 남아 있어요.');
      const n = ov.querySelector('#ev-next'); if (n) n.querySelector('span').textContent = '다시 시도';
    }
  }

  if (done) showGuide();
  else if (st.t0) mountBar();
  else showGuide();
})();
