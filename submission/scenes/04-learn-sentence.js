const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const mock = async () => { const m = await (await fetch('/mock.json')).json(); render(m.result || m, false); showResult(); await sl(500); };
await mock(); learnOpen(false); await sl(300); lnMove(2); await sl(500); return 'sentence';
