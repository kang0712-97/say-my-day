// 번역 품질 정답 세트(실제 AI 호출, 수동 실행): node tests/quality/run.js  (또는 npm run quality)
// 조합마다 20문장을 한 번에 번역해(API 호출 3회 + 일본어 읽기 확인 호출) 구조·핵심 요소·글자 종류·금지어·읽기 표시를 검사하고,
// 결과를 tests/quality/results/날짜_시각.json 에 저장한다. 모델·프롬프트를 바꾸기 전후로 비교하는 용도. 비용은 토큰 수로 보여 준다.
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const root = path.join(__dirname, '..', '..'), PORT = 3005, COMBOS = require('./sets');
const BANNED = /죄송|사과드|AI로서|AI입니다|번역기|as an AI|申し訳|抱歉/;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quality-'));
const env = { ...process.env, CHINESE_DIARY_DATA_DIR: tmp, PORT: String(PORT) }; delete env.PUBLIC_MODE;
const srv = spawn('node', [path.join(root, 'app', 'server.js')], { env, stdio: ['ignore', 'pipe', 'inherit'] });
let log = ''; srv.stdout.on('data', (d) => (log += d));
const strings = (o, out = []) => { if (typeof o === 'string') out.push(o); else if (o && typeof o === 'object') Object.values(o).forEach((v) => strings(v, out)); return out; };
(async () => {
  for (let i = 0; i < 30; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/healthz`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  if (!/Claude API|Gemini/.test(log) && !(await new Promise((r) => setTimeout(() => r(/Claude API|Gemini/.test(log)), 500)))) { console.log('FAIL: API 키가 없어 목업 모드입니다(app/.env.local 확인).'); srv.kill(); process.exit(1); }
  const report = { at: new Date().toISOString(), combos: [] }; let fails = 0;
  for (const c of COMBOS) {
    const diary = c.set.map((s) => s[0]).join('\n'); const t0 = Date.now();
    const r = await fetch(`http://127.0.0.1:${PORT}/api/translate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ diary, srcLang: c.src, tgtLang: c.tgt }), signal: AbortSignal.timeout(300000) }).catch((e) => ({ ok: false, status: 0, json: async () => ({ error: e.message }) }));
    const data = await r.json().catch(() => null); const row = { name: c.name, status: r.status, sec: Math.round((Date.now() - t0) / 1000), problems: [] };
    if (!r.ok || !data || !data.result || data.mock) { row.problems.push(`번역 실패 status=${r.status} ${data && data.error || ''}`); }
    else {
      const ss = data.result.sentences || []; row.sentences = ss.length;
      // 앱은 긴 문장을 쉼표에서 나누므로(T7) 입력 문장 하나에 결과 문장이 여러 개 붙을 수 있다. 원문(ko)이 입력에 포함되는 만큼 차례로 묶는다.
      const flat = (t) => String(t || '').replace(/\s/g, ''); let j = 0;
      c.set.forEach(([src, must], i) => {
        const taken = []; while (j < ss.length && flat(ss[j].ko) && flat(src).includes(flat(ss[j].ko))) taken.push(ss[j++]);
        if (!taken.length) { row.problems.push(`${i + 1}번 대응하는 결과 문장 없음`); return; }
        const tgt = taken.map((s) => String(s.zh || '')).join('');
        if (taken.length > 1) row.split = (row.split || 0) + 1;
        if (!c.script.test(tgt)) row.problems.push(`${i + 1}번 목표 언어 글자 없음: ${tgt.slice(0, 30)}`);
        if (c.wrong.test(tgt)) row.problems.push(`${i + 1}번 엉뚱한 글자 섞임: ${tgt.slice(0, 30)}`);
        for (const alts of must) if (!alts.some((a) => tgt.includes(a))) row.problems.push(`${i + 1}번 핵심 요소 없음 [${alts.join('/')}]: ${tgt.slice(0, 40)}`);
      });
      if (j < ss.length) row.problems.push(`입력과 대응하지 않는 결과 문장 ${ss.length - j}개`);
      const banned = strings(data.result).filter((t) => BANNED.test(t)); if (banned.length) row.problems.push(`금지어 ${banned.length}곳: ${banned[0].slice(0, 40)}`);
      if (c.tgt === 'ja') {
        const words = ss.flatMap((s) => s.words || []); const kanji = words.filter((w) => /[一-鿿]/.test(w.zh));
        row.ja = { kanjiWords: kanji.length, noReading: kanji.filter((w) => !w.reading).length, flagged: kanji.filter((w) => w.check).length, check: data.check };
        if (row.ja.noReading) row.problems.push(`읽기 없는 한자 단어 ${row.ja.noReading}개`);
      }
      row.vocab = (data.result.vocab || []).length; row.grammar = (data.result.grammar || []).length;
      row.pairs = ss.map((s) => [s.ko, s.zh]);
    }
    fails += row.problems.length; report.combos.push(row);
    console.log(`${row.problems.length ? 'FAIL' : 'OK  '} ${c.name} (${row.sec}s, 결과 문장 ${row.sentences ?? '-'}${row.split ? `, 긴 문장 분할 ${row.split}` : ''})${row.ja ? ` 한자 단어 ${row.ja.kanjiWords}, 확인 표시 ${row.ja.flagged}` : ''}`);
    row.problems.forEach((p) => console.log('     - ' + p));
  }
  srv.kill();
  const toks = [...log.matchAll(/"tokens":\{"in":(\d+),"out":(\d+)\}/g)].reduce((a, m) => [a[0] + Number(m[1]), a[1] + Number(m[2])], [0, 0]);
  report.tokens = { in: toks[0], out: toks[1] }; report.problems = fails;
  const f = path.join(__dirname, 'results', report.at.replace(/[:T]/g, '-').slice(0, 16) + '.json'); fs.writeFileSync(f, JSON.stringify(report, null, 1));
  console.log(`\n번역 호출 3회, 토큰 입력 ${toks[0]} / 출력 ${toks[1]} (읽기 확인용 호출은 별도), 문제 ${fails}건\n저장: ${path.relative(root, f)}`);
  fs.rmSync(tmp, { recursive: true, force: true }); process.exit(fails ? 1 : 0);
})().catch((e) => { srv.kill(); console.log('FAIL', e.message); process.exit(1); });
