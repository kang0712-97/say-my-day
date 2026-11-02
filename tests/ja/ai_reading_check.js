const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.split('=')[0], l.slice(l.indexOf('=') + 1).trim()]));
const G = require('./golden');
(async () => {
  let ok = 0;
  const list = G.map((g, i) => `${i + 1}. ${g[0]}`).join('\n');
  const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 3000, messages: [{ role: 'user', content: '다음 일본어 문장 각각을 전부 히라가나로만 써라(문장부호 유지). 번호 없이 한 줄에 한 문장, JSON 배열로만 출력.\n' + list }] }) });
  const j = await res.json();
  if (!j.content) return console.log('API 오류', res.status, JSON.stringify(j).slice(0, 200));
  const arr = JSON.parse(j.content.find((b) => b.type === 'text').text.match(/\[[\s\S]*\]/)[0]);
  G.forEach(([s, exp], i) => { if (arr[i] === exp) ok++; else console.log('✗', s, '\n   기대', exp, '\n   AI  ', arr[i]); });
  console.log(`AI: ${ok}/${G.length} 문장 일치`);
})();
