const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const mock = async () => { const m = await (await fetch('/mock.json')).json(); render(m.result || m, false); showResult(); await sl(500); };
const m = await (await fetch('/mock.json')).json(); saveHist('오늘은 아침에 비가 와서 우산을 챙겼다.', m.result || m); await sl(30); saveHist('주말에는 친구와 영화를 봤다.', m.result || m); await sl(200); bookOpen(); await sl(500); return 'book';
