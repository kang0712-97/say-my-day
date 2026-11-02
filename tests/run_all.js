// `npm test`: 서버·API 없이 도는 순수 검사 + 화면 스모크 시험을 차례로 돌린다. 하나라도 실패하면 종료 코드 1.
const { spawnSync } = require('child_process'), path = require('path');
const T = (f) => path.join(__dirname, f);
const steps = [
  ['병음 교정', 'pinyin_check.js', /전부 일치/],
  ['병음 문맥(了·得·不·一)', 'pinyin_context_check.js', /다른 문장 0개/],
  ['문장 나누기', 'split_check.js'],
  ['화면 문구 사전 키·자리표', 'i18n_keys_check.js', /^통과/m],
  ['따라 말하기 비교·기록', 'speak_check.js', /^통과/m],
  ['일본어 읽기 누락 검사', 'ja/missing_reading_check.js'],
  ['화면 스모크(3개 조합)', 'smoke/run.js', /^통과/m],
  ['접근성 검사(3개 조합)', 'a11y/run.js', /^통과/m],
];
let bad = 0;
for (const [name, file, expect] of steps) {
  const t0 = Date.now(); const r = spawnSync('node', [T(file)], { encoding: 'utf8', timeout: 400000 });
  const out = (r.stdout || '') + (r.stderr || ''); const ok = r.status === 0 && (!expect || expect.test(out));
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  if (!ok) { bad++; console.log(out.trim().split('\n').slice(-12).map((l) => '     ' + l).join('\n')); }
}
console.log(bad ? `\n${bad}개 실패` : '\n전부 통과');
process.exit(bad ? 1 : 0);
