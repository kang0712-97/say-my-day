// 화면 안전 검사 본문(브라우저 안에서 실행). 러너가 앞에 `const R = <번역 결과>;`를 붙여 준다.
// 검사: ⓐ 저장이 실패하면 '저장했어요'를 보이지 않는다 ⓑ 고쳐 다시 번역해도 id·작성일이 유지된다 ⓒ 가져온 파일의 위험한 id를 걸러 낸다 ⓓ 문장 번호 없는 경고가 학습 카드에 보인다
const problems = []; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const expect = (c, m) => { if (!c) problems.push(m); };
const realFetch = window.fetch.bind(window);
async function frame() {
  localStorage.setItem('intro-seen', '"1"'); localStorage.setItem('splash-off', '1'); localStorage.setItem('lang-src', '"ko"'); localStorage.setItem('lang-tgt', '"zh"');
  document.body.innerHTML = '<iframe id="f" src="/" style="width:390px;height:800px;border:0"></iframe>';
  const f = document.getElementById('f'); await new Promise((r) => (f.onload = r)); await sleep(900);
  const w = f.contentWindow;
  w.fetch = async (u, o) => String(u).includes('/api/translate') ? new w.Response(JSON.stringify({ result: R, mock: false, glossaryUsed: [] }), { status: 200, headers: { 'content-type': 'application/json' } }) : realFetch(u, o);
  return w;
}
const hist = () => JSON.parse(localStorage.getItem('diary-history') || '[]');
async function translate(w, text) {
  const d = w.document.getElementById('diary'); d.value = text; d.dispatchEvent(new Event('input')); w.document.getElementById('go').click();
  for (let i = 0; i < 40; i++) { await sleep(150); if (w.document.querySelector('.app').classList.contains('show-result')) break; }
  await sleep(300);
}
const shown = (w, id) => !w.document.getElementById(id).classList.contains('hidden');
{
  // ⓐ 저장 실패: 성공 문구 없이 실패 안내
  localStorage.removeItem('diary-history'); let w = await frame();
  const orig = w.Storage.prototype.setItem; w.Storage.prototype.setItem = function (k, v) { if (k === 'diary-history') throw new Error('QuotaExceededError'); return orig.call(this, k, v); };
  await translate(w, '오늘은 날씨가 좋았다.');
  expect(!shown(w, 'saved-row'), '저장이 실패했는데 "일기장에 저장했어요"가 보임');
  expect(shown(w, 'save-fail'), '저장이 실패했는데 실패 안내가 보이지 않음');
  expect(hist().length === 0, '저장이 실패했는데 기록이 생김');
  w.Storage.prototype.setItem = orig;
  // ⓐ 정상 저장
  localStorage.removeItem('diary-history'); w = await frame(); await translate(w, '오늘은 날씨가 좋았다.');
  expect(shown(w, 'saved-row') && !shown(w, 'save-fail'), '저장이 성공했는데 안내가 맞지 않음');
  expect(hist().length === 1, '저장 성공 뒤 기록이 1편이 아님');
  // ⓑ 수정: id·작성일 유지
  const old = { id: 111, at: '2025-10-01T09:00:00.000Z', diary: '옛 일기.', result: R, weather: 'sun', srcLang: 'ko', tgtLang: 'zh', glossLang: 'ko' };
  localStorage.setItem('diary-history', JSON.stringify([old])); w = await frame();
  w.eval('openEntry')(old); await sleep(300); await translate(w, '고친 일기.');
  const h = hist();
  expect(h.length === 1, `수정 뒤 기록이 ${h.length}편(1편이어야 함)`);
  expect(h[0] && h[0].id === 111 && h[0].at === old.at, `수정 뒤 id·작성일이 바뀜: ${h[0] && h[0].id} ${h[0] && h[0].at}`);
  expect(h[0] && h[0].diary === '고친 일기.' && h[0].edited, '수정 내용이나 수정일이 저장되지 않음');
  expect(h[0] && h[0].weather === 'sun', '수정하면서 날씨가 바뀜');
  // ⓒ 가져오기 검사
  const ci = w.eval('cleanImport')({ app: 'chinese-diary', keys: { 'diary-history': [{ id: 'x" onclick="evil', diary: 'a', result: {} }, { id: 222, diary: 'b', result: {} }, null, { id: 3, diary: 5, result: {} }], wordbook: 'notlist', 'study-days': [{ id: 'ko>zh:2026-11-03', d: '2026-11-03' }] } });
  expect(ci.keys['diary-history'].length === 1 && ci.keys['diary-history'][0].id === 222, `가져오기 검사가 위험한 항목을 거르지 못함: ${JSON.stringify(ci.keys['diary-history'])}`);
  expect(!('wordbook' in ci.keys), '목록이 아닌 항목을 버리지 못함');
  expect(ci.keys['study-days'].length === 1, '정상 학습일(id에 : 와 > 포함)을 잘못 버림');
  // ⓓ 문장 번호 없는 경고
  localStorage.removeItem('diary-history'); w = await frame();
  const R2 = JSON.parse(JSON.stringify(R)); R2.ambiguities = [{ n: 0, text: '확인 필요 경고 시험문구' }];
  w.eval('render')(R2, false); w.eval('showResult')(); await sleep(400); w.eval('learnOpen')(false); await sleep(500);
  expect(w.document.getElementById('learn').innerText.includes('확인 필요 경고 시험문구'), '문장 번호 없는 경고가 학습 시작 카드에 보이지 않음');
  w.document.getElementById('ln-next').click(); await sleep(400);
  expect(w.document.getElementById('learn').innerText.includes('확인 필요 경고 시험문구'), '문장 번호 없는 경고가 첫 문장 카드에 보이지 않음');
}
{
  // ⓔ 일기책 안에서 일기 삭제: 확인 뒤에만 지워지고 책이 다시 짜인다
  const mk = (id, t) => ({ id, at: `2025-10-0${id - 700}T09:00:00.000Z`, diary: t, result: R, weather: 'sun', srcLang: 'ko', tgtLang: 'zh', glossLang: 'ko' });
  localStorage.setItem('diary-history', JSON.stringify([mk(701, '첫째 일기.'), mk(702, '둘째 일기.')])); const w = await frame();
  w.eval('bookOpen')(); await sleep(300); w.document.querySelector('[data-bkgo="1"]').click(); await sleep(300);
  const del = () => w.document.querySelector('#p-book [data-bkask]');
  expect(!!del(), '일기책 쪽에 삭제 단추가 없음');
  del().click(); await sleep(150);
  expect(!!w.document.querySelector('#p-book [data-bkdel]') && hist().length === 2, '삭제 확인 없이 지워졌거나 확인 단추가 없음');
  w.document.querySelector('#p-book [data-bkcancel]').click(); await sleep(150);
  expect(hist().length === 2 && !!del(), '취소했는데 일기가 지워졌거나 삭제 단추가 돌아오지 않음');
  del().click(); await sleep(100); w.document.querySelector('#p-book [data-bkdel]').click(); await sleep(300);
  expect(hist().length === 1, `삭제 뒤 기록이 ${hist().length}편(1편이어야 함)`);
  expect(!w.document.getElementById('p-book').innerText.includes('첫째 일기') || !w.document.getElementById('p-book').innerText.includes('둘째'), '삭제 뒤에도 책에 두 일기가 모두 남음');
  w.document.querySelector('#p-book [data-bkask]').click(); await sleep(100); w.document.querySelector('#p-book [data-bkdel]').click(); await sleep(300);
  expect(hist().length === 0 && w.document.getElementById('p-book').innerText.includes('아직 일기가 없어요'), '마지막 일기를 지운 뒤 빈 책 안내가 보이지 않음');
}
return JSON.stringify({ problems });
