# T38a API 오류 대비
상태: 완료(사용자 할 일: API 크레딧 충전, 3000번 서버 재시작)
## 원인
"API 오류 400" = Anthropic API 크레딧 부족(`Your credit balance is too low`). 코드 버그 아님.
## 한 일
- 서버 `upstreamError`: 업스트림 실패를 credit/key/busy/service로 가르고 사람 말 문구 + `code`로 응답(503/502). 원문 메시지는 화면에 내지 않음. 크레딧 부족이면 서버 콘솔에 1분에 한 번 경고.
- 화면: `err.credit`·`err.key`·`err.service` 문구(한국어·중국어). 번역 실패는 기존 "다시 시도" 버튼, 글자 풀이는 기존 "다시 불러오기" 버튼과 서버 메모리 캐시 유지.
- 확인: 분리 서버에서 `/api/chars`·`/api/translate` 모두 503 `credit` + 친절한 문구, `npm test` 통과.
## 남은 것
- 충전은 사용자 몫(Plans & Billing). Render 환경변수의 키가 같은 계정인지 확인.
- 3000번 서버는 `server.js`가 바뀌어 **재시작해야** 새 문구가 적용된다(화면 파일은 새로고침만).
- 번역 결과 장기 캐시·예산 알림은 하지 않음(필요하면 별도 카드).
