const sl = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ['intro-skip', 'intro-close']) { const b = document.getElementById(id); if (b) b.click(); }
await sl(500);
const d = document.getElementById('diary'); d.value = '오늘은 아침에 비가 와서 우산을 챙겼다. 점심에는 친구와 우동을 먹었다. 저녁에는 중국어 공부를 했다.'; d.dispatchEvent(new Event('input'));
document.getElementById('go').click(); await sl(9000); const t = document.getElementById('result') || document.getElementById('sentences'); if (t) t.scrollIntoView(); await sl(500);
return 'result ' + document.documentElement.scrollHeight;
