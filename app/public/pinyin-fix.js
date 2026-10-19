// pinyin-pro가 경성·구조조사 得를 잘못 표기하는 단어의 교정 사전.
// 브라우저에서는 전역 PINYIN_FIX, Node 테스트에서는 module.exports 로 쓴다.
// 목록에 없는 단어는 pinyin-pro 기본값을 따른다. 틀린 단어를 발견하면 여기에 추가한다.
const PINYIN_FIX = {
  // 구조조사 得 (동사 + 得 + 상태): dé가 아니라 de
  '过得': 'guò de', '活得': 'huó de', '睡得': 'shuì de', '吃得': 'chī de', '玩得': 'wán de',
  '说得': 'shuō de', '做得': 'zuò de', '写得': 'xiě de', '跑得': 'pǎo de', '唱得': 'chàng de',
  '学得': 'xué de', '长得': 'zhǎng de', '忙得': 'máng de', '累得': 'lèi de', '高兴得': 'gāo xìng de',
  // 경성으로 읽는 단어
  '事情': 'shì qing', '意思': 'yì si', '东西': 'dōng xi', '朋友': 'péng you', '女朋友': 'nǚ péng you',
  '男朋友': 'nán péng you', '时候': 'shí hou', '知道': 'zhī dao', '学生': 'xué sheng', '谢谢': 'xiè xie',
  '容易': 'róng yi', '舒服': 'shū fu', '晚上': 'wǎn shang', '早上': 'zǎo shang', '名字': 'míng zi',
  '出来': 'chū lai', '起来': 'qǐ lai', '关系': 'guān xi', '地方': 'dì fang', '故事': 'gù shi',
};
if (typeof module !== 'undefined') module.exports = PINYIN_FIX;
