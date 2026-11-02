const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const mock = async () => { const m = await (await fetch('/mock.json')).json(); render(m.result || m, false); showResult(); await sl(500); };
playSplash(); await sl(1500); return 'splash';
