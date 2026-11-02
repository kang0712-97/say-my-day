// 단어 경계 시간을 글자별 시간으로 나누는 계산(charTimes)이 실제 서버 응답에서 맞게 나오는지 확인한다.
// 실행: 서버를 켠 뒤 node tests/char_times_check.js [서버주소 기본 http://localhost:3000]
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'app', 'public', 'index.html'), 'utf8');
const src = html.slice(html.indexOf('function charTimes'), html.indexOf('// ---------- 읽는 속도에 맞춰'));
const charTimes = new Function(src + '; return charTimes;')();
const base = process.argv[2] || 'http://localhost:3000';
const cases = [
  ['天气突然变冷了。', 'zh-CN-XiaoxiaoNeural'], ['这样的天气让我感觉冬天快来了。', 'zh-CN-XiaoxiaoNeural'], ['今天天气很好，我很开心。', 'zh-CN-YunxiNeural'],
  ['今日はいい天気です。', 'ja-JP-NanamiNeural'],
];
(async () => {
  let bad = 0;
  for (const [text, voice] of cases) {
    const r = await fetch(`${base}/api/tts-timing?` + new URLSearchParams({ text, voice, rate: '0.9' }));
    const d = r.ok ? await r.json() : null;
    const t = d && charTimes(text, d.bounds);
    const chars = [...text];
    let ok = !!t && t.length === chars.length;
    if (ok) { // 시간이 앞으로만 흐르고, 소리 나는 글자는 길이가 있어야 한다
      for (let i = 0; i < t.length; i++) { if (t[i].e < t[i].s || (i && t[i].s < t[i - 1].e - 1)) ok = false; if (!/[\s\p{P}\p{S}]/u.test(chars[i]) && t[i].e <= t[i].s) ok = false; }
    }
    if (!ok) bad++;
    console.log(ok ? 'OK  ' : 'DIFF', text, t ? chars.map((c, i) => `${c}${Math.round(t[i].s)}-${Math.round(t[i].e)}`).join(' ') : '(시간 정보 없음)');
  }
  // 안 맞는 경계는 믿지 않고 null이어야 한다
  const wrong = charTimes('天气突然变冷了。', [{ t: '你好', o: 0, d: 500, k: 'W' }]);
  console.log(wrong === null ? 'OK   엉뚱한 경계 → null' : 'DIFF 엉뚱한 경계를 믿음'); if (wrong !== null) bad++;
  console.log(bad ? `\n${bad}건 다름` : '\n전부 일치'); process.exit(bad ? 1 : 0);
})();
