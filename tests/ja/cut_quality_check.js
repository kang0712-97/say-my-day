// 단어 자른 지점의 소리 크기(문장 최대 대비 %)를 보정 전/후로 비교한다. 분리 서버(3002)를 켠 뒤 실행.
// 사용: node tests/ja/cut_quality_check.js   (보정 코드는 app/public/index.html의 <<cut-start>>~<<cut-end>>와 charTimes를 그대로 꺼내 쓴다)
const fs = require('fs'), { execFileSync } = require('child_process');
const html = fs.readFileSync(__dirname + '/../../app/public/index.html', 'utf8');
const cut = html.split('// <<cut-start>>')[1].split('// <<cut-end>>')[0];
const ct = 'function charTimes' + html.split('function charTimes')[1].split('\n}\n')[0] + '\n}';
const { CUT, envOf, cutRange, charTimes } = new Function(`${cut}\n${ct}\nreturn { CUT, envOf, cutRange, charTimes };`)();
const T = '/private/tmp/claude-501/trydata/';
const S = { 'ja-JP-NanamiNeural': ['今日は友達と市場に行きました。', '一人で映画を見に行きました。', '来月の三日に東京へ行きます。', '最近、仕事が忙しくて疲れています。', '風邪をひいたので、病院に行きました。', '水を飲んで、少し休みました。'],
  'zh-CN-XiaoxiaoNeural': ['今天天气很好。', '我昨天和朋友去了市场。', '最近工作很忙，我有点累。'] };
const get = async (p, q) => fetch('http://localhost:3002' + p + '?' + new URLSearchParams(q));
(async () => {
  const rows = [];
  for (const [voice, texts] of Object.entries(S)) for (const text of texts) {
    const q = { text, voice, rate: '0.9' };
    fs.writeFileSync(T + 'c.mp3', Buffer.from(await (await get('/api/tts', q)).arrayBuffer()));
    const bounds = (await (await get('/api/tts-timing', q)).json()).bounds;
    execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEI16@16000', T + 'c.mp3', T + 'c.wav']);
    const w = fs.readFileSync(T + 'c.wav'); const pcm = new Int16Array(w.buffer.slice(w.byteOffset + 44, w.byteOffset + w.length - ((w.length - 44) % 2)));
    const buf = { sampleRate: 16000, getChannelData: () => Float32Array.from(pcm, (x) => x / 32768) }, dur = pcm.length / 16000;
    const env = envOf(buf), mx = Math.max(...env), pct = (t) => 100 * env[Math.min(env.length - 1, Math.max(0, Math.floor(t / CUT.frame)))] / mx;
    const times = charTimes(text, bounds); if (!times) { console.log('시간 맞춤 실패', text); continue; }
    let pos = 0; const chars = [...text];
    for (const b of bounds) {
      const n = [...b.t].length; const idx = chars.findIndex((_, i) => i >= pos && chars.slice(i, i + n).join('') === b.t); if (idx < 0) continue; pos = idx + n;
      const i0 = idx, i1 = idx + n - 1, first = times.findIndex((t) => t.e > t.s), last = times.length - 1 - [...times].reverse().findIndex((t) => t.e > t.s);
      const old = [Math.max(0, times[i0].s / 1000 - 0.04), Math.min(dur, times[i1].e / 1000 + 0.08)], nw = cutRange(env, times, i0, i1, dur);
      rows.push({ voice: voice.slice(0, 2), word: b.t, oldS: pct(old[0]), oldE: pct(old[1]), newS: pct(nw[0]), newE: pct(nw[1]), len: nw[1] - nw[0], edgeS: i0 <= first, edgeE: i1 >= last });
    }
  }
  const inner = (r) => ({ s: !r.edgeS, e: !r.edgeE }); // 문장 맨 앞·맨 끝은 침묵과 닿으므로 안쪽 경계만 비교
  const stat = (k, side) => { const v = rows.filter((r) => inner(r)[side]).map((r) => r[k + side.toUpperCase()]); return { avg: v.reduce((a, b) => a + b, 0) / v.length, max: Math.max(...v), n: v.length }; };
  for (const side of ['s', 'e']) for (const k of ['old', 'new']) { const r = stat(k, side); console.log(`${side === 's' ? '시작' : '끝  '} ${k === 'old' ? '전' : '후'}  평균 ${r.avg.toFixed(1)}%  최대 ${r.max.toFixed(1)}%  (n=${r.n})`); }
  console.log('나쁜 지점:', rows.flatMap((r) => [[r.word, 'S', r.newS, !r.edgeS], [r.word, 'E', r.newE, !r.edgeE]]).filter((x) => x[3] && x[2] > 50).map((x) => x[0] + x[1] + Math.round(x[2])).join(' '));
  const short = rows.filter((r) => ['は', 'に', 'が', 'を', 'で', 'と', '的', '了'].includes(r.word));
  console.log('짧은 단어 구간 길이(후, ms):', short.map((r) => r.word + ' ' + Math.round(r.len * 1000)).join(', '));
  console.log('최소 구간 길이(ms):', Math.round(Math.min(...rows.map((r) => r.len)) * 1000));
})();
