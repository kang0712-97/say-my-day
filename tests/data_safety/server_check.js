// 서버 안전 검사(API 호출 0회): 외부 AI 응답을 가짜로 바꿔 끼워 ⓐ 쓸 수 없는 응답을 성공으로 전달하지 않는지 ⓑ 멈춘 요청이 시간 제한으로 풀리는지
// ⓒ 사용자가 요청을 끊으면 동시 처리 자리가 바로 돌아오는지 ⓓ 공개 모드가 서버 저장을 쓰지 않는다고 알리는지 확인한다.
// 실행: node tests/data_safety/server_check.js
const fs = require('fs'), os = require('os'), path = require('path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsafe-'));
Object.assign(process.env, { PORT: '3007', CHINESE_DIARY_DATA_DIR: tmp, ANTHROPIC_API_KEY: 'test-key-not-real', GEMINI_API_KEY: '', PUBLIC_MODE: '1', MAX_CONCURRENT: '1', LIMIT_PER_IP_HOUR: '1000', LIMIT_PER_DAY: '1000', UPSTREAM_TIMEOUT_MS: '700' });
const realFetch = global.fetch; let mode = 'ok';
const ok = (obj) => new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(obj) }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }), { status: 200, headers: { 'content-type': 'application/json' } });
global.fetch = (url, opt = {}) => {
  if (!String(url).includes('api.anthropic.com')) return realFetch(url, opt);
  if (mode === 'hang') return new Promise((_, no) => { const e = () => no(Object.assign(new Error('aborted'), { name: 'AbortError' })); if (opt.signal) { if (opt.signal.aborted) e(); else opt.signal.addEventListener('abort', e); } });
  if (mode === 'empty') return Promise.resolve(ok({ sentences: [], vocab: [] }));
  if (mode === 'vocabObj') return Promise.resolve(ok({ sentences: [{ n: 1, zh: '你好', zh_split: ['你好'] }], vocab: { a: 1 } }));
  return Promise.resolve(ok({ sentences: [{ n: 1, zh: '你好', zh_split: ['你好'] }], vocab: [] }));
};
require('../../app/server.js');
const base = 'http://127.0.0.1:3007', sleep = (ms) => new Promise((r) => setTimeout(r, ms)), problems = [];
const post = (signal) => realFetch(base + '/api/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ diary: '안녕하세요.', srcLang: 'ko', tgtLang: 'zh' }), signal });
const expect = (cond, msg) => { if (!cond) problems.push(msg); };
(async () => {
  await sleep(400);
  mode = 'ok'; let r = await post(); expect(r.status === 200, `정상 응답이 ${r.status}`);
  mode = 'empty'; r = await post(); expect(r.status === 502, `빈 번역 응답이 ${r.status}(502여야 함)`);
  mode = 'vocabObj'; r = await post(); expect(r.status === 502, `vocab가 객체인 응답이 ${r.status}(502여야 함)`);
  mode = 'hang'; const t0 = Date.now(); r = await post(); expect(r.status === 504, `멈춘 응답이 ${r.status}(504여야 함)`); expect(Date.now() - t0 < 3000, '시간 제한이 3초 안에 풀리지 않음');
  mode = 'ok'; r = await post(); expect(r.status === 200, `시간 초과 뒤 다음 요청이 ${r.status}(자리가 안 돌아옴)`);
  mode = 'hang'; const ac = new AbortController(); const p = post(ac.signal).catch(() => null); await sleep(150); ac.abort(); await p; await sleep(150);
  mode = 'ok'; r = await post(); expect(r.status === 200, `사용자가 끊은 뒤 다음 요청이 ${r.status}(자리가 안 돌아옴)`);
  const d = await (await realFetch(base + '/api/data')).json(); expect(d.public === true && Object.keys(d.keys).length === 0, '공개 모드 /api/data가 public 표시를 주지 않음');
  console.log(problems.length ? `FAIL: 서버 안전 검사 ${problems.length}건\n` + problems.map((x) => ' - ' + x).join('\n') : '통과: 서버 안전 검사 (빈 응답·잘못된 구조 거부, 시간 제한, 연결 끊김 복구, 공개 모드 표시)');
  fs.rmSync(tmp, { recursive: true, force: true }); process.exit(problems.length ? 1 : 0);
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
