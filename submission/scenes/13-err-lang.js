const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const mock = async () => { const m = await (await fetch('/mock.json')).json(); render(m.result || m, false); showResult(); await sl(500); };
document.getElementById('nest-go').click(); await sl(400); const d = document.getElementById('diary'); d.value = '今天天气很好，我和朋友去公园散步了。'; d.dispatchEvent(new Event('input')); document.getElementById('go').click(); await sl(1500); document.getElementById('status').scrollIntoView({ block: 'center' }); await sl(300); return 'lang';
