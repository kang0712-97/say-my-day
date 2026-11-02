// splitSentences 구간 나누기 시험. server.js에서 해당 부분만 잘라 실행한다.
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../app/server.js', 'utf8');
const a = src.indexOf('const SPLIT_MAX'), b = src.indexOf('// 모델 응답의 sentences를');
const splitSentences = new Function(src.slice(a, b) + '; return splitSentences;')();
const cases = [
  ['ko', '오늘 아침에 일어나서 밥을 먹고 학교에 갔는데 친구를 만나서 같이 점심을 먹고 도서관에서 공부를 하다가 집에 와서 저녁을 먹고 잤다'],
  ['ko', '오늘은 날씨가 좋다. 기분이 좋다.'],
  ['ko', '학교에서 친구를 만났다'],
  ['zh', '今天早上我和朋友去了市场然后买了很多水果但是天气很热所以我们回家休息了一会儿后来又去了公园散步'],
  ['zh', '今天天气很好，我很开心。'],
];
for (const [l, t] of cases) { const r = splitSentences(t, l); console.log(l, r.length, JSON.stringify(r)); if (r.join('').replace(/\s/g, '') !== t.replace(/\s/g, '')) console.log('!! 글자가 달라짐'); }
