# Say My Day — 내 하루 일기로 배우는 외국어
한국어(또는 중국어)로 쓴 일기를 중국어·일본어로 번역하고, **카드 학습 세션**(문장 듣고 따라 말하기 → 단어 리스트 → 문법 → 전체 읽기 → 오늘의 학습 통계)으로 내 문장을 입으로 말해 보게 하는 웹앱입니다. 학습 일수가 쌓이면 곁의 새가 자랍니다.

- 배포: https://chinese-diary.onrender.com (무료 서버라 한동안 쓰지 않으면 첫 접속이 최대 1분 걸립니다)
- 대상 사용자: 자기 하루를 외국어로 말하고 싶은 학습자(초급~초중급, 휴대폰 우선)
- 문제 정의·설계 판단·평가는 `submission/` 폴더, 작업 기록은 `design/`에 있습니다.

## 빠르게 실행하기 (API 키 없이)
```bash
git clone https://github.com/kang0712-97/say-my-day.git && cd say-my-day
npm install            # 일본어 읽기용 kuromoji 한 개만 설치됩니다
npm start              # http://localhost:3000
```
키가 없으면 **목업 모드**로 실행되어 번역 결과 대신 예시 결과(`app/public/mock.json`)를 보여 주므로, 카드 학습·통계·일기장 등 화면은 모두 써 볼 수 있습니다.

## 실제 번역까지 쓰려면
1. `app/.env.example`을 `app/.env.local`로 복사하고 키를 하나 넣습니다(`GEMINI_API_KEY` 또는 `ANTHROPIC_API_KEY`, 둘 다 있으면 Gemini).
2. `npm start` → 터미널에 `[Claude API …]` 또는 Gemini 표시가 뜨면 연결된 것입니다.
3. 휴대폰에서 확인하려면 `LAN=1 npm start` 후 같은 와이파이에서 `http://<컴퓨터 주소>:3000`(마이크 기능은 https에서만 동작).

## 시험
```bash
npm test               # 8단계, API 호출 없음(키가 있어도 시험 서버는 키를 비워 실행)
npm run quality        # 번역 품질 세트(실제 API 호출, 수동 실행)
```
`npm test`는 병음 교정·문장 나누기·문구 사전 키·일본어 읽기·화면 스모크(3개 언어 조합)·접근성(90화면)을 돌립니다. 크롬이 필요합니다(macOS 경로 기준, `tests/browser_check.js`의 `CH` 상수에서 바꿀 수 있습니다).

## 폴더 구조
| 경로 | 내용 |
|---|---|
| `app/server.js` | 정적 서버, `/api/translate`, `/api/chars`, `/api/tts*`, `/api/data`, 입력 검사·요청 제한 |
| `app/public/index.html` | 화면 전부(마크업·스타일·스크립트 한 파일), `img/` 새 그림·로고 |
| `prompts/` | 번역·해설 시스템 프롬프트(현재 `system_prompt.md` v0.5, 이전 `system_prompt_v0.1~0.4.md`) |
| `tests/` | `run_all.js`와 단계별 시험, `a11y/`·`smoke/` 화면 시험, `quality/` 번역 품질 세트 |
| `design/` | 작업 카드(`tasks/T*.md` 66장), 설계·계획 문서, 진행 기록 `PROGRESS.md` |
| `submission/` | 제출 자료: 프롬프트.md, 안정성, 수치 측정(`measure.js`·`metrics.json`), 캡처, 발표 개요 |

## 한계
- 번역 품질은 AI 응답에 달려 있어 틀릴 수 있습니다(번역 옆 "확인 필요" 표시와 사전 없이 다시 번역 버튼으로 보완).
- 따라 말하기(마이크)는 환경 제약(https·크롬)으로 기본 꺼져 있고, 지금은 카드의 "다음" 버튼으로 넘기는 자기 확인 방식입니다.
- 사용자 테스트는 아직 하지 않았습니다. 수치는 사람 없이 재는 화면 지표입니다(`submission/metrics.json`).
