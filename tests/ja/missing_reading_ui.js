// T8 화면 검사: 한자 칸 중 후리가나가 덮지 못한 칸을 센다. 사용: ja-sim-out.json을 app/public에 임시로 두고 browser_check로 실행
const data = await (await fetch('/ja-sim-out.json')).json();
render(data.result, false); showResult();
await new Promise(r => setTimeout(r, 600));
// 번역 글줄·활용 문장·문법 예문 등 .zhline 전체의 칸을 앞에서부터 훑는다. .rg(덩어리 읽기)는 --n칸을 덮는다
let kan = 0, bare = 0, bareList = [];
document.querySelectorAll('.zhline').forEach((line) => {
  let cover = 0;
  line.querySelectorAll('.c').forEach((c) => {
    const h = c.querySelector('.h').textContent, rg = c.querySelector('.rg'), p = c.querySelector('.p');
    if (rg && rg.textContent) cover = Number(rg.style.getPropertyValue('--n')) || 1;
    const isK = /[一-鿿々〆]/.test(h);
    if (isK) { kan++; if (cover <= 0 && !(p && p.textContent)) { bare++; bareList.push(h); } }
    if (cover > 0 && !(rg && rg.textContent)) cover--; else if (rg && rg.textContent) cover--;
  });
});
// 예문(.zh-font 아래 plainPinyin 줄)은 글로 읽기를 보여 준다
const plains = [...document.querySelectorAll('.zh-font + .py')].map((e) => e.textContent);
const emptyPlain = plains.filter((t, i) => /[一-鿿]/.test(t)).length;
return `한자 칸 ${kan}개 중 후리가나 없음 ${bare}개 ${bareList.join('')} | 예문 읽기 줄 ${plains.length}줄 중 한자 남은 줄 ${emptyPlain} | 확인필요 점선 칸 ${document.querySelectorAll('.zhline .p.chk').length}`;
