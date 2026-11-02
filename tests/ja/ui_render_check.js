const out = [];
const data = await (await fetch('/ja-sim-out.json')).json();
render(data.result, false); showResult();
await new Promise(r => setTimeout(r, 500));
out.push('LANG=' + JSON.stringify(LANG) + ' tgt=' + document.documentElement.dataset.tgt);
out.push('chip=' + document.getElementById('lang-chip').textContent + ' | ring=' + document.getElementById('ring-text').textContent.slice(0, 30));
const s1 = document.querySelector('#sentences .cardx');
const cellsOf = (el) => [...el.querySelectorAll('.zhline.big .c')].map(c => (c.querySelector('.p').textContent || '') + '/' + c.querySelector('.h').textContent + (c.querySelector('.p.chk') ? '?' : '')).join(' ');
out.push('문장1: ' + cellsOf(s1));
out.push('문장2: ' + cellsOf(document.querySelectorAll('#sentences .cardx')[1]));
out.push('lang attr=' + s1.querySelector('.zhline').getAttribute('lang'));
out.push('vocab0 py=' + document.querySelector('.py').textContent);
// 단어 누르기 → 미니 카드(市場 = 확인 필요)
const wd = [...s1.querySelectorAll('.wd')].find(b => [...b.querySelectorAll('.h')].map(h => h.textContent).join('').includes('市場'));
wd.click(); await new Promise(r => setTimeout(r, 400));
out.push('mini: ' + document.getElementById('wmini').innerText.replace(/\n+/g, ' | ').slice(0, 220));
out.push('plainPinyin=' + plainPinyin('友達と市場'));
out.push('voice options=' + [...document.getElementById('opt-voice').options].map(o => o.value).join(','));
return out.join('\n');
