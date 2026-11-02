const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const m = await (await fetch('/mock.json')).json(); render(m.result || m, false); showResult(); await sl(700); window.scrollTo(0, 0);
return 'old result height=' + document.documentElement.scrollHeight;
