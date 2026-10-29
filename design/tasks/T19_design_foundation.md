# T19 디자인 토대: 토큰·글꼴·자산·스킨 정리
상태: 완료(미확인: 휴대폰 화면, 실제 360px 스크린샷)
근거: `design/redesign-plan.md`(읽고 시작), `/say-my-day-design` 스킬 절차, DESIGN.md '색상과 대비·서체·간격과 형태', tokens.css

## 할 일
1. `tokens.css` 값을 `app/public/index.html`의 `:root`·다크 변수로 옮긴다. 기존 변수 이름은 유지하고 값을 바꿔(`--paper`→canvas 등) 화면이 깨지지 않게 하며, 새 이름(`--control-border`, `--warning-*`, `--danger-*`)을 추가한다. 다크는 `data-theme`과 `prefers-color-scheme` 두 곳 모두.
2. 글꼴: Pretendard(없으면 Noto Sans KR), 중국어 Noto Sans SC, 일본어 Noto Sans JP. 세리프·손글씨 글꼴 링크와 `--f-serif/--f-hand` 사용 제거.
3. 기본 컴포넌트: 주요 버튼 56px 캡슐, 일반 버튼·칩 조작 영역 44px, 입력 18/30, 배너(확인 필요=호박, 삭제=붉은, 정보), 포커스 2px 외곽선+2px 간격, 움직임 줄이기, 간격 4·8·12·16·24·32·48.
4. 새 이미지 12종을 WebP(가로 약 480px 이하, 투명 유지)로 줄여 `app/public/img/bird/`에 두고, `bird(name, size)` 도우미(`alt=""` 장식, 상태 문구는 따로)를 만든다.
5. 스킨 시험 제거: `app/public/skins.js`·`skins.css`, `index.html`의 두 줄, `design/skin-test.md`, `tests`의 `SKIN` 처리.

## 반드시 유지할 기능 (기능 확인표 번호는 계획서 §4)
전 기능 그대로(색·글꼴·크기만 바뀐다). F2 글꼴 전환(ko/zh/ja), F13 반응형.

## 완료 기준
- 옛 세리프/손글씨 글꼴·붉은 포인트 참조 0(`grep`), 스킨 파일 0.
- 새 자산 합계 ≤ 1MB, 투명 배경 유지, 12종 모두 로드.
- `contrast-report.json`의 토큰 쌍을 앱의 실제 사용 쌍으로 다시 계산해 전부 통과.
- 레이아웃은 아직 이전 구성이어도 가로 넘침·겹침 0.

## 검증 방법
`npm test` 통과(분리 서버), 라이트·다크 × ko>zh·ko>ja·zh>ja × 폭 360/390 스크린샷을 해당 보드와 나란히 비교, 글자 200% 가로 넘침 0, 사용한 색 쌍을 `contrast-check`로 재계산. 소리·실기기는 "미확인"으로 적고 사용자에게 요청.
추가: `du -ch app/public/img/bird/*`, `grep -n "Gowun\|Playfair\|Nanum Pen\|Noto Serif" app/public/index.html`이 0건.

## 결과
토큰(`--smd-*`)을 `:root`·다크 두 곳에 넣고 기존 변수 이름은 새 토큰으로 연결(`--accent`=본문색, 병음=보조 글자색, `--hl`=보조 면). 확인 필요(`.banner.warn`·`.flag`·`.note`)만 호박색. 세리프·손글씨·Gowun/Playfair 참조 0, 스킨 파일·`SKIN` 처리 삭제. 새 12종 WebP 480px 합계 200KB(투명 유지), `bird(name,size)` 도우미와 서버 `.webp` 타입 추가. 대비 라이트·다크 17쌍 전부 통과(본문 17.6/16.6, 호박 5.4/9.4, 컨트롤 테두리 4.3/5.6). `npm test` 전부 통과, 스크린샷 3조합×라이트/다크 확인.
남긴 것: 레이아웃은 이전 구성 그대로(T21~). 따라 읽기 글자색 진행은 임시로 본문색→작은 안내색(T23에서 새로). 헤드리스 창 최소폭이 485px라 360px 실물 스크린샷은 못 찍음(스모크 시험이 360px 가로 넘침 0 확인). Pretendard는 jsdelivr CDN(속도는 T27). 퀴즈 정오는 아직 `--ok`=본문색, `--err`=붉은색(T24에서 아이콘·문구로 교체).
