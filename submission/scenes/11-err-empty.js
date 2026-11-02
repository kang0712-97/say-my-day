const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const mock = async () => { const m = await (await fetch('/mock.json')).json(); render(m.result || m, false); showResult(); await sl(500); };
document.getElementById('nest-go').click(); await sl(400); document.getElementById('go').click(); await sl(400); document.getElementById('status').scrollIntoView({ block: 'center' }); await sl(300); return 'empty';
