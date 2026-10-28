# T16 `npm test` 묶기 + 화면 스모크 시험
상태: 대기
근거: `hardening-plan.md §5 T16` (읽고 시작)

## 할 일
기존 순수 검사들을 `npm test`로 묶고, 오늘 쓴 임시 화면 시험(`/private/tmp/claude-501/phone/*.js`, `t10c/check.js`)을 `tests/smoke/`로 승격. 러너가 분리 서버를 띄우고 끈다. 검사: 언어 문구 누출·자리표·360px 넘침·콘솔 오류.

## 완료 기준
- `npm test` 한 줄 통과/실패, 일부러 문구를 깨면 실패.

## 결과
(끝나면 한 줄 요약+수치)
