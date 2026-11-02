const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const mock = async () => { const m = await (await fetch('/mock.json')).json(); render(m.result || m, false); showResult(); await sl(500); };
document.getElementById('nest-go').click(); await sl(400); const d = document.getElementById('diary'); d.value = '오늘은 날씨가 좋아서 산책을 했다. '.repeat(60); d.dispatchEvent(new Event('input')); await sl(300); d.scrollIntoView(); return 'long ' + d.value.length;
