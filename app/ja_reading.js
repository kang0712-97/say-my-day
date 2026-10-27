// 일본어 번역 결과 정리 + 읽기 교차 검사.
// AI가 준 단어별 읽기(히라가나)를 형태소 분석기(kuromoji)의 읽기와 문장 단위로 비교해, 다르면 check 표시를 붙인다.
// kuromoji가 설치되지 않았거나 불러오지 못하면 교차 검사만 건너뛰고 나머지는 그대로 동작한다.
const path = require('path');

let tokenizer = null, loading = null;
function loadTokenizer() {
  if (tokenizer) return Promise.resolve(tokenizer);
  if (loading) return loading;
  loading = new Promise((resolve) => {
    try {
      const kuromoji = require('kuromoji');
      const dicPath = path.join(path.dirname(require.resolve('kuromoji/package.json')), 'dict');
      kuromoji.builder({ dicPath }).build((err, t) => { tokenizer = err ? null : t; resolve(tokenizer); });
    } catch { resolve(null); }
  });
  return loading;
}

const KANJI = /[一-鿿々〆]/;
const toHira = (s) => String(s || '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const HIRA_ONLY = /^[ぁ-ゖー]+$/;
// 같은 말의 허용되는 다른 읽기(日本 にほん/にっぽん)는 같은 것으로 본다
const norm = (s) => toHira(s).replace(/にっぽん/g, 'にほん');

// 모델 응답(ja 키)을 화면이 읽는 키(zh)로 바꾼다. 화면을 언어에 맞게 일반화할 때 이 변환은 없앤다.
function normalizeJa(r) {
  const out = { ...r };
  out.sentences = (r.sentences || []).map((s) => ({
    ...s, zh: s.ja, zh_split: s.ja_split,
    words: (s.words || []).map((w) => ({ zh: w.ja, ko: w.ko || '', reading: w.reading || '' })),
  }));
  out.vocab = (r.vocab || []).map((v) => ({ ...v, zh: v.ja, example_zh: v.example_ja }));
  out.grammar = (r.grammar || []).map((g) => ({ ...g, example_zh: g.example_ja }));
  out.extra_sentences = (r.extra_sentences || []).map((e) => ({ ...e, zh: e.ja }));
  return out;
}

// 구조 검사 + 읽기 교차 검사. 문제는 ambiguities에 남긴다.
// 분석 도구(kuromoji)로 한 단어/글의 히라가나 읽기를 구한다. 한자가 아닌 부분은 그대로 둔다. 도구가 없으면 ''.
function kuroOf(t, text) {
  if (!t) return '';
  return t.tokenize(text).map((k) => (KANJI.test(k.surface_form) ? ((k.reading && k.reading !== '*') ? toHira(k.reading) : '') : k.surface_form)).join('');
}
// 글 속 한자 덩어리마다 {글자: 읽기}를 모은다. 화면이 단어 단위 읽기가 없는 글(예문·활용 문장·문법 예문)에 후리가나를 붙일 때 AI 읽기가 없으면 쓴다.
function collectKuro(t, text, into) {
  if (!t || !text) return;
  for (const k of t.tokenize(text)) {
    if (!KANJI.test(k.surface_form) || !k.reading || k.reading === '*') continue;
    const r = toHira(k.reading);
    if (!HIRA_ONLY.test(r)) continue;
    if (!into[k.surface_form]) into[k.surface_form] = r;
    // 送り仮名를 뗀 한자만의 읽기(会い あい → 会 あ). 화면이 会와 い를 따로 나눠 읽을 때 쓴다
    const sf = [...k.surface_form], rd = [...r];
    while (sf.length > 1 && !KANJI.test(sf[sf.length - 1]) && sf[sf.length - 1] === rd[rd.length - 1]) { sf.pop(); rd.pop(); }
    const base = sf.join('');
    if (base !== k.surface_form && rd.length && !into[base]) into[base] = rd.join('');
  }
}

async function checkJa(result) {
  const t = await loadTokenizer();
  const warnings = [];
  let flagged = 0, compared = 0, filled = 0;
  const kuroMap = {};
  for (const s of result.sentences || []) {
    const text = s.zh || '';
    if (text && !/[぀-ヿ一-鿿]/.test(text)) warnings.push({ n: s.n, text: '번역문에 일본어 글자가 없어요. 다시 시도해 주세요.' });
    const words = s.words || [];
    if (words.map((w) => w.zh).join('') !== text) {
      warnings.push({ n: s.n, text: '단어 나누기가 번역문과 맞지 않아 단어별 읽기를 믿기 어려워요.' });
      s.words = []; // 화면이 글자 단위로 대신 처리
      collectKuro(t, text, kuroMap); // 단어별 읽기를 믿을 수 없으므로 분석 도구의 읽기를 화면에 넘긴다
      continue;
    }
    const toks = t ? t.tokenize(text) : null;
    let pos = 0;
    for (const w of words) {
      const start = pos, end = pos + w.zh.length; pos = end;
      if (!KANJI.test(w.zh)) continue;
      if (!HIRA_ONLY.test(w.reading || '')) { // 한자가 있는데 읽기가 없거나 히라가나가 아님: 분석 도구의 읽기로 채우고 확인 필요로 표시
        const kr = kuroOf(t, w.zh);
        if (kr) { w.reading = kr; w.kuro = kr; filled += 1; }
        w.check = true; flagged += 1; continue;
      }
      if (!toks) continue;
      const inside = toks.filter((k) => k.word_position - 1 >= start && k.word_position - 1 + k.surface_form.length <= end);
      if (inside.map((k) => k.surface_form).join('') !== w.zh) continue; // 분석기 단어가 경계를 넘으면 비교하지 않음
      const kuro = inside.map((k) => (k.reading && k.reading !== '*') ? k.reading : k.surface_form).join('');
      compared += 1;
      if (norm(kuro) !== norm(w.reading)) { w.check = true; w.kuro = toHira(kuro); flagged += 1; }
    }
  }
  // 단어 읽기 표가 없는 글들의 한자: 분석 도구 읽기를 넘긴다(화면은 AI 읽기가 없을 때만 쓰고, 확인 필요로 표시)
  (result.vocab || []).forEach((v) => { collectKuro(t, v.zh, kuroMap); collectKuro(t, v.example_zh, kuroMap); });
  (result.grammar || []).forEach((g) => collectKuro(t, g.example_zh, kuroMap));
  (result.extra_sentences || []).forEach((e) => collectKuro(t, e.zh, kuroMap));
  return { result: { ...result, ja_kuro: kuroMap, ambiguities: [...(result.ambiguities || []), ...warnings] }, stats: { compared, flagged, filled, tool: !!t } };
}

module.exports = { normalizeJa, checkJa };
