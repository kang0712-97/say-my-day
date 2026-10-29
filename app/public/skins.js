// 디자인 시험용 스킨 선택기. 주소에 ?skin=line|mono|soft|base 를 붙이면 그 스킨으로 보이고, 이후 화면 왼쪽 위의 작은 선택기로 바꿔 비교한다.
// 시험이 끝나면 index.html의 skins.js·skins.css 두 줄과 이 두 파일을 지우면 원래대로 돌아간다.
(function () {
  var K = 'skin', P = 'skin-picker', NAMES = ['base', 'line', 'mono', 'soft'];
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var q = new URLSearchParams(location.search).get('skin');
  if (q && NAMES.indexOf(q) >= 0) { set(K, q); set(P, '1'); }
  var cur = get(K);
  var FONTS = {
    line: 'Outfit:wght@300;400;500&family=Noto+Sans+KR:wght@300;400;500&family=Noto+Sans+SC:wght@300;400&family=Noto+Sans+JP:wght@300;400',
    mono: 'IBM+Plex+Mono:wght@400;500&family=Doto:wght@400;700&family=Noto+Sans+KR:wght@400;500&family=Noto+Sans+SC:wght@400&family=Noto+Sans+JP:wght@400',
    soft: 'Manrope:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Sans+SC:wght@400;500&family=Noto+Sans+JP:wght@400;500'
  };
  if (FONTS[cur]) {
    document.documentElement.setAttribute('data-skin', cur);
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + FONTS[cur] + '&display=swap'; document.head.appendChild(l);
  }
  if (get(P) !== '1') return;
  document.addEventListener('DOMContentLoaded', function () {
    var box = document.createElement('div'); box.id = 'skin-picker'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Design test');
    NAMES.forEach(function (n) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.setAttribute('aria-pressed', String((cur || 'base') === n));
      b.addEventListener('click', function () { set(K, n); location.reload(); }); box.appendChild(b);
    });
    document.body.appendChild(box);
  });
})();
