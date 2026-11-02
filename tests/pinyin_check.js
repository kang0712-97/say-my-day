// pinyin-pro가 일기에 자주 나오는 다음자·변조·경성을 맞게 표기하는지 확인한다.
// 실행: node tests/pinyin_check.js
const pp = require('../app/public/vendor/pinyin-pro.js');
const { pinyin } = pp;
pp.customPinyin(require('../app/public/pinyin-fix.js')); // 앱과 같은 교정 사전 적용
const cases = [
  ['美好', 'měi hǎo', '3성 연속은 책처럼 본래 성조로 표기(소리만 변조)'],
  ['你好', 'nǐ hǎo', '3성 연속은 본래 성조로 표기'],
  ['考试', 'kǎo shì', '반3성은 표기하지 않음'],
  ['一天', 'yì tiān', '一 + 1성'],
  ['一个', 'yí gè', '一 + 4성'],
  ['一定', 'yí dìng', '一 + 4성'],
  ['不过', 'bú guò', '不 + 4성'],
  ['不错', 'bú cuò', '不 + 4성'],
  ['变得很清爽', 'biàn de hěn qīng shuǎng', '得는 de'],
  ['有意思', 'yǒu yì si', '교정 사전: 意思'],
  ['应该', 'yīng gāi', '应 1성'],
  ['醒来了', 'xǐng lái le', '了 경성'],
  ['还要准备', 'hái yào zhǔn bèi', '还 hái'],
  ['心情', 'xīn qíng', ''],
  ['今天过得很幸福', 'jīn tiān guò de hěn xìng fú', '교정 사전: 过得'],
  ['这件事情', 'zhè jiàn shì qing', '교정 사전: 事情'],
  ['女朋友', 'nǚ péng you', '교정 사전: 朋友'],
  ['早上', 'zǎo shang', '교정 사전: 早上'],
];
let fail = 0;
for (const [zh, want, why] of cases) {
  const got = pinyin(zh, { toneType: 'symbol', type: 'array' }).join(' ');
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'DIFF'} ${zh}  기대:${want}  실제:${got}  ${why}`);
}
console.log(fail ? `\n${fail}건 다름` : '\n전부 일치');
