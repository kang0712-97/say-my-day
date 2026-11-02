const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const mock = async () => { const m = await (await fetch('/mock.json')).json(); render(m.result || m, false); showResult(); await sl(500); };
await mock(); learnOpen(false); await sl(300); lnS.i = lnS.cards.length - 1; lnRender(0); await sl(300); document.getElementById('ln-next').click(); await sl(900); return 'fullread';
