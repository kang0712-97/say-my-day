// 중국어 화면 문구 검수표: ZH 사전(원문→중국어)과 T 사전(고정 문구)을 CSV로 내보낸다. 중국인 친구에게 보내 '검수 메모' 칸을 채워 받는다.
// 실행: node tests/quality/export_zh.js  → design/zh-review.csv (엑셀·구글 시트에서 열림)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..'), html = fs.readFileSync(path.join(root, 'app', 'public', 'index.html'), 'utf8');
const lines = html.split('\n');
const zhLine = lines.findIndex((l) => l.startsWith('const ZH = '));
const ZH = JSON.parse(lines[zhLine].replace(/^const ZH = /, '').replace(/;\s*$/, ''));
const m = html.match(/const T = (\{[\s\S]*?\n\});\n/); const T = eval('(' + m[1] + ')');
const sections = []; lines.forEach((l, i) => { const h = l.match(/^\s*(?:\/\/|<!--)\s*-{5,}\s*(.+?)\s*(?:-{5,}.*)?(?:-->)?$/); if (h) sections.push([i, h[1].replace(/\s*-+\s*$/, '')]); });
const where = (key) => {
  for (let i = 0; i < lines.length; i++) { if (i === zhLine) continue; if (lines[i].includes(key.slice(0, 40))) { const s = [...sections].reverse().find(([n]) => n <= i); return `${i + 1}행${s ? ' · ' + s[1] : ''}`; } }
  return '(정적/조합 문구)';
};
const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
const rows = [['구분', '원문(한국어)', '중국어', '쓰인 곳', '검수 메모']];
for (const [k, v] of Object.entries(ZH)) rows.push(['화면 문구', k, v, where(k), '']);
for (const [k, v] of Object.entries(T.zh || {})) rows.push(['고정 문구(T)', (T.ko || {})[k] || k, v, 'T.' + k, '']);
const out = path.join(root, 'design', 'zh-review.csv');
fs.writeFileSync(out, '﻿' + rows.map((r) => r.map(q).join(',')).join('\n') + '\n');
console.log(`ZH ${Object.keys(ZH).length}개 + T ${Object.keys(T.zh || {}).length}개 → ${path.relative(root, out)}`);
