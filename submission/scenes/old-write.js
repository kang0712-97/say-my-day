const sl = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ['intro-skip', 'intro-close']) { const b = document.getElementById(id); if (b) b.click(); }
await sl(600); window.scrollTo(0, 0); return 'write';
