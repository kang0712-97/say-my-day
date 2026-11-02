// T8: 한자에 읽기가 없는 곳을 서버 단계에서 찾는다. node tests/ja/missing_reading_check.js
const { checkJa } = require('../../app/ja_reading');
const sample = require('./sample_result.json').result;
const KANJI = /[一-鿿々〆]/;
(async () => {
  const r = JSON.parse(JSON.stringify(sample));
  // 일부러 구멍을 낸다: 읽기 없는 한자 단어, 읽기가 한자 그대로인 단어, 단어 이음이 문장과 안 맞는 문장
  const w0 = r.sentences[0].words.find((w) => KANJI.test(w.zh)); w0.reading = '';
  r.sentences[1].words[0].zh += 'X';
  const out = await checkJa(r);
  const res = out.result; let missing = 0, total = 0;
  for (const s of res.sentences) for (const w of s.words) if (KANJI.test(w.zh)) { total++; if (!/^[ぁ-ゖー]+$/.test(w.reading || '')) missing++; }
  const texts = [...res.sentences.filter((s) => !s.words.length).map((s) => s.zh), ...res.vocab.map((v) => v.example_zh), ...res.grammar.map((g) => g.example_zh), ...res.extra_sentences.map((e) => e.zh)];
  let noRead = 0, kan = 0;
  for (const tx of texts) for (const ch of tx) if (KANJI.test(ch)) { kan++; if (!Object.keys(res.ja_kuro).some((k) => k.includes(ch))) noRead++; }
  console.log('단어 한자 ' + total + ' 중 읽기 없음 ' + missing + ' | 채운 수 ' + out.stats.filled + ' | 단어표 없는 글 한자 ' + kan + ' 중 읽기 없음 ' + noRead + ' | ja_kuro ' + Object.keys(res.ja_kuro).length + '개');
  console.log('구멍 낸 단어:', w0.zh, '→', res.sentences[0].words.find((w) => w.zh === w0.zh)?.reading, 'check=', res.sentences[0].words.find((w) => w.zh === w0.zh)?.check);
  process.exit(missing || noRead ? 1 : 0);
})();
