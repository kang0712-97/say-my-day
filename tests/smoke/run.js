// 화면 스모크 시험 러너: 분리 서버를 띄우고, 크롬으로 시나리오를 돌린 뒤 서버를 끈다. API는 호출하지 않는다(고정 샘플 사용).
// 실행: node tests/smoke/run.js  (또는 npm test)
const { spawn, spawnSync } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const root = path.join(__dirname, '..', '..'), PORT = 3004;
const j = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const CASES = [
  { name: 'ko>zh', ui: 'ko', src: 'ko', tgt: 'zh', data: j('tests/real_01.json') },
  { name: 'ko>ja', ui: 'ko', src: 'ko', tgt: 'ja', data: j('tests/ja/sample_result.json') },
  { name: 'zh>ja', ui: 'zh', src: 'zh', tgt: 'ja', data: j('tests/ja/sample_result.json') },
];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-')), script = path.join(tmp, 'run.js');
fs.writeFileSync(script, `const CASES = ${JSON.stringify(CASES)};\n` + fs.readFileSync(path.join(__dirname, 'scenario.js'), 'utf8'));
const env = { ...process.env, CHINESE_DIARY_DATA_DIR: path.join(tmp, 'data'), PORT: String(PORT), ANTHROPIC_API_KEY: '', GEMINI_API_KEY: '' }; delete env.PUBLIC_MODE; // 빈 값으로 덮어써 .env.local의 실제 키가 시험 서버에 들어가지 않게(시험이 유료 API를 쓰지 않도록)
const srv = spawn('node', [path.join(root, 'app', 'server.js')], { env, stdio: 'ignore' });
const stop = () => { srv.kill(); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} };
(async () => {
  for (let i = 0; i < 30; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/healthz`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  const r = spawnSync('node', [path.join(root, 'tests', 'browser_check.js'), `http://127.0.0.1:${PORT}/`, script], { encoding: 'utf8', timeout: 300000 });
  stop();
  const line = (r.stdout || '').trim().split('\n').filter((l) => l.startsWith('{')).pop();
  if (!line) { console.log('FAIL: 화면 시험이 결과를 내지 못했다\n' + (r.stdout || '') + (r.stderr || '')); process.exit(1); }
  const res = JSON.parse(line);
  if (res.problems.length) { console.log(`FAIL: 화면 스모크 ${res.problems.length}건\n` + res.problems.map((p) => ' - ' + p).join('\n')); process.exit(1); }
  console.log(`통과: 화면 스모크 ${res.cases.join('·')} (한글 누출·자리표·가로 넘침·콘솔 오류 0건)`);
})().catch((e) => { stop(); console.log('FAIL', e.message); process.exit(1); });
