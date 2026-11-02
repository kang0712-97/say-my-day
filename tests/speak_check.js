// 따라 말하기 비교·기록 로직 시험(가짜 인식 결과 사용). 마이크·실제 인식은 사용자 휴대폰에서 확인한다.
const S = require('../app/public/speak-check.js');
let bad = 0, n = 0;
const eq = (name, got, want) => { n++; if (JSON.stringify(got) !== JSON.stringify(want)) { bad++; console.log('FAIL', name, '→', JSON.stringify(got), '기대', JSON.stringify(want)); } };
const kinds = (r) => r.marks.map((m) => m.kind[0]).join('');

// 중국어: 전부 맞음 / 문장부호 무시 / 글자 놓침 / 잘못 말함 / 아무것도 못 알아들음
eq('zh 전부', S.compare('我今天很开心。', '我今天很开心').all, true);
eq('zh 부호 skip', kinds(S.compare('我，很好。', '我很好')), 'osoos');
eq('zh 놓침', kinds(S.compare('我今天很开心', '我今天开心')), 'ooomoo');
eq('zh 개수', (({ ok, missed, total }) => [ok, missed, total])(S.compare('我今天很开心', '我今天开心')), [5, 1, 6]);
eq('zh 틀림', S.compare('我喜欢你', '我讨厌你').missed, 2);
eq('zh 빈 인식', S.compare('我喜欢你', '').missed, 4);
eq('zh 빈 원문', S.compare('', '你好').all, false);
eq('zh 군더더기', S.compare('你好', '嗯你好啊').all, true); // 더 말한 글자는 감점하지 않는다
// 일본어: 가타카나=히라가나, 전각·반각
eq('ja 가타카나', S.compare('ともだち', 'トモダチ').all, true);
eq('ja 한자 다름', S.compare('友達', 'ともだち').ok, 0); // 표기가 다르면 맞다고 볼 수 없다(알려진 한계)
eq('ja 문장', S.compare('今日は雨です。', '今日は雨です').all, true);
// 후보 여러 개 중 가장 가까운 것
const b = S.best('我想喝咖啡', ['我想和咖啡', '我想喝咖啡', '']);
eq('best 선택', [b.heard, b.all], ['我想喝咖啡', true]);
eq('best 없음', S.best('你好', ['', '  ']), null);
// 기록
let log = [];
log = S.bump(log, 'zh', 's', '我很好', 1000); log = S.bump(log, 'zh', 's', '我很好', 2000); log = S.bump(log, 'zh', 'w', '好', 3000); log = S.bump(log, 'ja', 'w', '好', 4000);
eq('기록 고유', S.stats(log, 'zh'), { words: 1, sents: 1, wordTimes: 1, sentTimes: 2 });
eq('기록 전체', S.stats(log), { words: 2, sents: 1, wordTimes: 2, sentTimes: 2 });
eq('기록 원본 불변', log.find((x) => x.id === 'zh:s:我很好').n, 2);
const m = S.merge(log, [{ id: 'zh:s:我很好', k: 's', t: 'zh', zh: '我很好', n: 5, at: 500 }, { id: 'zh:s:新', k: 's', t: 'zh', zh: '新', n: 1, at: 9 }]);
eq('병합 횟수 큰 쪽', m.find((x) => x.id === 'zh:s:我很好'), { id: 'zh:s:我很好', k: 's', t: 'zh', zh: '我很好', n: 5, at: 2000 });
eq('병합 개수', m.length, 4);
eq('병합 멱등', S.merge(m, m).length, 4);
console.log(bad ? `${bad}건 실패` : `통과: ${n}개`);
process.exit(bad ? 1 : 0);
