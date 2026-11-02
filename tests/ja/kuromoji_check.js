const Kuroshiro = require('kuroshiro').default || require('kuroshiro');
const Analyzer = require('kuroshiro-analyzer-kuromoji');
const G = require('./golden');
(async () => {
  const k = new Kuroshiro(); await k.init(new Analyzer());
  let ok = 0;
  for (const [s, exp] of G) {
    const got = await k.convert(s, { to: 'hiragana' });
    const good = got === exp; if (good) ok++;
    else console.log('✗', s, '\n   기대', exp, '\n   결과', got);
  }
  console.log(`kuromoji: ${ok}/${G.length} 문장 일치`);
})();
