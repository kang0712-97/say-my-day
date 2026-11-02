# 폴더 연동 GPT용 지시문 (복사해서 한 번에 붙여 넣기)

작업 폴더: `say-my-day/` (이 저장소 루트). 아래 경로는 모두 이 폴더 기준입니다.

## 목표
`submission/slides/발표.html` 한 파일을 만들어 주세요. 16:9 슬라이드 15장 + 부록 구성의 HTML 발표 자료입니다(외부 라이브러리 없이 HTML·CSS·약간의 JS).

## 먼저 읽을 자료 (이 순서로)
1. `submission/slides-outline.md` — **장별 구성의 기준**. 장 제목, 한 문장 답, 내용, 쓸 이미지, 다음 장으로 잇는 말, 요구 대응표가 있습니다. 이 구성과 순서를 그대로 따르세요.
2. `submission/metrics.json` — **수치는 여기 값만** 사용합니다(`compare` 항목). 없는 수치는 만들지 말고 "측정 전"이라고 쓰세요.
3. `submission/images/README.md` — 이미지 색인(어느 장에 어떤 파일을 쓰는지).
4. `submission/프롬프트.md` — 12~14장(번역 품질·AI 활용·AI 실수)의 내용 근거. 표의 내용을 그대로 옮기세요.
5. `submission/stability.md` — 8장(예외 상황) 내용 근거.
6. `design/tasks/T38_journey_redesign_plan.md`, `design/tasks/T44_learning_flow_proposal.md` — 2장(문제 정의)·5~7장(설계 판단)을 쉬운 말로 요약할 때 참고. 문장을 그대로 복사하지 말고 쉬운 말로 줄이세요.
7. `README.md` — 부록(제출물·주소)에 쓸 정보.

## 이미지·영상 쓰는 법
- 이미지는 `submission/images/` 아래 파일만 씁니다. HTML이 `submission/slides/`에 있으므로 경로는 `../images/파일명`(하위 폴더는 `../images/old/…`, `../images/design/…`)입니다.
- **쓰면 안 되는 것**: 저장소 루트의 `old/` 폴더(이름이 든 원본 캡처), `submission/images/old/user_personal/`, 루트의 `*.mp4` 파일(`submission/slides/`의 영상 2개는 예외로 사용). 옛 화면은 `submission/images/old/v1-0919-result.png`, `v2-0919-B-result.png`, `v3-1029-pre-result.png`, `v4-1030-picturediary-result.png`만 씁니다.
- 영상은 `submission/slides/`에 이미 복사돼 있습니다: `demo1.mp4`(앱 사용 영상 1), `demo2.mp4`(앱 사용 영상 2, PDF 다운로드 부분 추가본). 4장(시연)에 두 영상을 모두 `<video controls preload="metadata" src="demo1.mp4">`, `<video controls preload="metadata" src="demo2.mp4">`로 넣고(탭으로 전환하거나 나란히), 영상 설명은 "앱 사용 영상 1", "앱 사용 영상 2(PDF 저장 포함)"로만 쓰세요. 영상 내용은 보지 못하므로 내용을 지어내지 마세요. 영상이 열리지 않을 때를 위해 "시연 영상: 제출물 참고"라는 문구도 함께 두세요. 영상 파일은 수정·삭제하지 마세요.
- 이미지 안의 글자를 가리거나 자르지 말고, 휴대폰 캡처는 한 장 폭을 화면의 30~40%로 나란히 배치하세요.

## 만드는 규칙
1. **수치·사실은 위 자료에서만**. 장 제목 바로 아래에 "한 문장 답"을 큰 글씨로, 장 맨 아래에 "다음 장으로 잇는 말"을 작은 글씨로 넣어 흐름이 이어지게 하세요.
2. "사용자 테스트 결과"라는 표현은 쓰지 않습니다(하지 않았음). 평가는 "사람 없이 잰 화면 지표"로 부릅니다. 실제 사용자 근거가 없는 곳은 "제작자 본인이 쓰며 모은 요구"라고 씁니다.
3. 어려운 말은 `slides-outline.md` 1절의 쉬운 말로 바꾸고, 처음 듣는 사람도 이해하는 문장으로 쓰세요.
4. 디자인: 흰 바탕, 잉크색 글자(#111), 회색 면(#f1f1ee), 굵고 둥근 고딕(`-apple-system, "Apple SD Gothic Neo", "Noto Sans KR"`). 포인트 색 없이 선 굵기·검은 채움으로 강조, 이모지 금지. 제목 40px 이상, 본문 22px 이상. 한 장에 표 하나·이미지 3장·문장 4줄 이내.
5. 10장의 수치 비교는 가로 막대 그래프(CSS div 폭 %)로 그리고 값 라벨을 꼭 표시합니다. `submission/images/21-before-after.png`를 함께 넣으세요.
6. 조작: ← → 키·클릭으로 장 이동, 하단 쪽 번호(n / 전체), Home·End. `@media print`에서는 장마다 한 쪽(PDF 저장 가능).
7. 각 장에 발표 대본 3줄을 `<aside class="notes">`로 넣고 화면에서는 숨기되 `N` 키로 보이게 합니다. 대본은 개요의 "한 문장 답"과 내용만 풀어 쓰고 새 사실을 추가하지 마세요.
8. **`submission/slides/` 밖의 파일은 수정·삭제하지 마세요.** (코드, 설정, 다른 문서 모두)
9. 마지막에 HTML 맨 끝 주석(`<!-- -->`)으로 사용한 수치 목록과 각 수치의 `metrics.json` 경로를 남기고, 개요의 장 중 빠진 것이 있으면 알려 주세요.

## 끝낸 뒤 보고할 것
- 만든 파일 경로, 사용한 이미지 목록, 사용한 수치와 출처, 자료가 부족해서 비워 둔 곳.
