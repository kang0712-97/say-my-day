// T3 시험: 市場가 소리 글에서 いちば로 바뀌고, 글자 시간·단어 구간 재생·따라 읽기가 원문 글자 기준으로 맞는지 본다.
const out = [];
const data = await (await fetch('/ja-sim-out.json')).json();
render(data.result, false); showResult();
await new Promise(r => setTimeout(r, 500));
const say = '今日は友達と市場に行った。';
out.push('jaFix=' + JSON.stringify([...jaFix]) + ' ambig=' + [...jaAmbig].join(','));
out.push('spokenOf=' + spokenOf(say));
out.push('edgeUrl 글=' + decodeURIComponent(new URL(edgeUrl(say, 'ja-JP-NanamiNeural'), location.href).searchParams.get('text')));
out.push('바꿀 것 없는 글=' + (spokenOf('猫が好きだ。') === '猫が好きだ。'));
const t = await getTiming(say, 'ja-JP-NanamiNeural', '0.9');
out.push('경계=' + JSON.stringify(t && t.bounds.map(b => b.t)));
const times = t && timesFor(say, t.bounds);
out.push('글자 수=' + [...say].length + ' 시간 수=' + (times && times.length));
if (times) {
  out.push(times.map((x, i) => [...say][i] + ':' + Math.round(x.s) + '-' + Math.round(x.e)).join(' '));
  out.push('단조 증가=' + times.every((x, i) => x.e >= x.s && (i === 0 || x.s >= times[i - 1].s - 1)));
}
// 문장 듣기 → 글자 색 진행
const s1 = document.querySelector('#sentences .cardx');
const btn = s1.querySelector('[data-say]'); out.push('버튼 say=' + btn.dataset.say);
const sel = document.getElementById('opt-voice'); out.push('음성=' + sel.value);
btn.click();
const samples = [];
for (let i = 0; i < 14; i++) { await new Promise(r => setTimeout(r, 250)); samples.push([...s1.querySelectorAll('.zhline.big .c')].map(c => Math.round((Number(c.style.getPropertyValue('--f')) || 0) * 10)).join('')); }
out.push('색 진행:\n' + samples.join('\n'));
stopSpeak();
// 단어(市場) 구간 재생
const wbtn = [...document.querySelectorAll('[data-ctx]')].find(b => b.dataset.say === '市場');
out.push('市場 버튼=' + (wbtn ? 'ci=' + wbtn.dataset.ci : '없음 (미니카드에서 생성)'));
return out.join('\n');
