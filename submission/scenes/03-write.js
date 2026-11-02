const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const mock = async () => { const m = await (await fetch('/mock.json')).json(); render(m.result || m, false); showResult(); await sl(500); };
document.getElementById('nest-go').click(); await sl(400); document.querySelector('[data-wx="sun"]').click(); const d = document.getElementById('diary'); d.value = '오늘은 아침에 비가 와서 우산을 챙겼다. 점심에는 친구와 우동을 먹었다. 저녁에는 중국어 공부를 했다.'; d.dispatchEvent(new Event('input')); await sl(300); return 'write';
