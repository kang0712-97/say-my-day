// 실제 시간으로 크롬을 조종해 화면 시험을 한다(소리 재생처럼 실제 시간이 필요한 시험용).
// 실행: node tests/browser_check.js <주소> <시험 스크립트 파일>  — 스크립트는 async 함수 본문이고 반환값이 출력된다.
// 시험 서버는 반드시 CHINESE_DIARY_DATA_DIR로 분리한 서버를 쓴다(실제 data/ 폴더를 덮어쓰지 않게).
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const [url, file] = process.argv.slice(2);
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', PORT = 9333;
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
const chrome = spawn(CH, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--autoplay-policy=no-user-gesture-required', ...(process.env.FAKE_MIC ? ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] : []), '--window-size='+(process.env.WIN||'500,900'), 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  let targets;
  for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.some((t) => t.type === 'page')) break; } catch {} await sleep(200); }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const waiters = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method) waiters.forEach((w) => w(d)); };
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await cmd('Page.enable');
  if (process.env.VW) await cmd('Emulation.setDeviceMetricsOverride', { width: Number(process.env.VW), height: Number(process.env.VH || 800), deviceScaleFactor: 2, mobile: true }); // 휴대폰 폭 흉내(헤드리스 최소 창 폭 500 우회)
  const loaded = new Promise((r) => waiters.push((d) => d.method === 'Page.loadEventFired' && r()));
  await cmd('Page.navigate', { url }); await loaded; await sleep(800);
  if (process.env.PRESET) { // 환경변수 PRESET='{"키":"값"}' 이면 임시 프로필의 localStorage에 넣고 다시 불러온다
    await cmd('Runtime.evaluate', { expression: `Object.entries(${process.env.PRESET}).forEach(([k, v]) => localStorage.setItem(k, v))` });
    const again = new Promise((r) => waiters.push((d) => d.method === 'Page.loadEventFired' && r()));
    await cmd('Page.reload'); await again; await sleep(800);
  }
  if (process.env.MEDIA) await cmd('Emulation.setEmulatedMedia', { media: process.env.MEDIA });
  const body = fs.readFileSync(file, 'utf8');
  const res = await cmd('Runtime.evaluate', { expression: `(async () => { ${body} })()`, awaitPromise: true, returnByValue: true, timeout: 90000 });
  if (process.env.SHOT) { const r = await cmd('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(process.env.SHOT, Buffer.from(r.result.data, 'base64')); }
  if (process.env.PDF) { const r = await cmd('Page.printToPDF', { preferCSSPageSize: true }); fs.writeFileSync(process.env.PDF, Buffer.from(r.result.data, 'base64')); } // MEDIA=print와 함께 쓰면 인쇄 결과를 PDF로 저장
  console.log(res.result && res.result.result ? (res.result.result.value ?? JSON.stringify(res.result.result)) : JSON.stringify(res));
  if (res.result && res.result.exceptionDetails) console.log('예외:', JSON.stringify(res.result.exceptionDetails).slice(0, 400));
  ws.close(); chrome.kill(); await sleep(800); try { fs.rmSync(prof, { recursive: true, force: true }); } catch { /* 임시 폴더는 나중에 지워짐 */ } process.exit(0);
})().catch((e) => { console.log('오류', e.message); chrome.kill(); process.exit(1); });
