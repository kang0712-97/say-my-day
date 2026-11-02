from pathlib import Path
import json,re,html,hashlib
from pypdf import PdfReader
Q=Path(__file__).resolve().parent;D=Q.parent;R=D.parent.parent
f=D/'발표_리디자인.html';text=f.read_text()
data=json.loads(re.search(r'<script type="application/json" id="presentation-data">(.*?)</script>',text,re.S)[1])
assert len(data['slides'])==14 and all(len(s['notes'])==3 for s in data['slides'])
qa=json.loads((Q/'qa.json').read_text())
assert not qa['errors'] and not qa['broken'] and not qa['external']
states=qa['states']+qa['responsive']
assert all(not s['overflow'] and not s['clipped'] and not s['overlapSource'] and s['documentFits'] and s['navFits'] for s in states)
assert len(qa['video'])==4 and all(v['ready']==4 and v['playing'] and not v['error'] for v in qa['video'])
assert qa['notes']['open'] and qa['notes']['paragraphs']==3 and qa['zoom'] and qa['videoDialog']
pdf=PdfReader(Q/'print-check.pdf')
assert len(pdf.pages)==14 and all(p.extract_text().strip() for p in pdf.pages)
assert abs(float(pdf.pages[0].mediabox.width)/float(pdf.pages[0].mediabox.height)-16/9)<.001
assert not re.search(r'<img(?![^>]*\bsrc=)[^>]*>',text)
assert 'repeating-linear-gradient' not in text
P=(R/'submission/프롬프트.md').read_text()
def rows(head):
 result=[]
 for l in P[P.index(head):].splitlines():
  if not l.startswith('|'):break
  if re.match(r'^\|[- :|]+\|$',l):continue
  result.append([x.strip() for x in l.strip('|').split('|')])
 return result[1:]
def plain(s):
 s=re.sub(r'<[^>]+>','',s)
 return re.sub(r'\s+','',html.unescape(s).replace('**','').replace(chr(96),''))
evidence=plain(data['slides'][13]['body'])
for row in rows('| 버전 |'):
 for t in row[1:]:assert plain(t) in evidence
for row in rows('| # | 무슨 일 |')[:6]:
 for t in row[1:]:assert plain(t) in evidence
videoHash=hashlib.sha256((D/'demo-edited.mp4').read_bytes()).hexdigest()
assert videoHash=='a81a5a3c4dc2f1ca47fd1ad420f4bf1be7bc59b90e5f4c42d6df981fcb3a8a8f'
summary={'html':str(f),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'mainSlides':12,'appendixSlides':2,'interactionStates':len(qa['states']),'responsiveStates':len(qa['responsive']),'javascriptErrors':0,'overflowStates':0,'brokenImages':0,'videoSegmentsPlayed':4,'printPages':14,'originalPromptAndIncidentRecords':True,'videoUnchanged':True,'review':'first review found mobile typography/tabs; all three listed fixes resolved in independent verdict pass'}
(Q/'verification.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
m=json.loads((Q/'manifest.json').read_text())
guide='''# Say My Day 발표 자료 리디자인 안내

## 열 파일
발표_리디자인.html

기존 발표.html은 그대로 보존했습니다. 새 파일은 앱을 처음 보는 청중을 기준으로 구성과 디자인을 다시 설계한 버전입니다.

## 구성과 의도
본문 12장, 상세 근거 부록 2장입니다.
제품을 먼저 이해한 뒤 PO의 선택과 AI 활용 과정을 따라가도록 만들었습니다. 세부 원문은 부록으로 옮겨 발표 중 모든 기록을 읽지 않아도 되게 했습니다.

'''
guide+='\n'.join(f'{i}. {s["title"]}' for i,s in enumerate(data['slides'],1))
guide+='''
 
## 디자인
- 앱의 워드마크와 일기장·펜을 가진 작은 새를 사용합니다.
- 흰 종이와 따뜻한 종이색, 잉크색 글씨를 기본으로 합니다.
- 시연과 앱 내부 AI 이야기는 어두운 면으로 구분합니다.
- 각 장의 목적에 맞게 표지·예시·실제 화면·영상·흐름·측정·사건 기록의 레이아웃을 달리했습니다.
- 모바일은 작은 슬라이드를 축소해 보여주는 대신 읽을 수 있는 크기의 세로 화면으로 전환됩니다.

## 발표 조작
- ← → / PageUp·PageDown: 이전·다음
- Home / End: 첫 장·마지막 부록
- 데스크톱의 빈 곳 클릭 / Space: 다음 장
- N: 발표 대본 열기, Esc: 닫기
- G: 목차, F: 전체 화면
- 근거 자료: 부록 바로가기
- 앱 캡처 클릭: 원본 확대
- 시연 장의 쓰기·학습·기록과 복습·PDF 버튼: 해당 구간부터 실제 영상 재생, 구간 끝에서 정지
- 전체 영상 재생: 구간 제한 없이 처음부터
- 크게 보기: 집중해서 볼 수 있는 큰 영상 창
- 휴대폰: 화면을 아래로 스크롤해 읽고, 하단 버튼으로 장 이동
- 브라우저 인쇄: 선택된 탭과 내용을 장마다 한 쪽으로 인쇄

## 사실과 서사
- 사용 장면의 일기 문장은 이해를 돕는 발표용 예시입니다.
- 실제 사용자 조사나 학습 효과·재방문 효과를 검증한 결과로 표현하지 않았습니다.
- 주어진 기록을 바탕으로 PO의 판단과 이야기 흐름은 새로 작성했습니다.
- 프롬프트 변경과 실제 AI 실수 사건의 원문은 부록에서 확인할 수 있습니다.
- 비교 수치는 metrics.json의 compare 항목만 사용했습니다.
- 단어 비율은 예시 한 건과 real_03을 구분했습니다. 1.02처럼 1을 넘는 집계값도 숨기지 않고 정의를 더 확인해야 한다고 표시했습니다.
- 기존 영상은 수정하지 않고 HTML의 구간 재생만 제어합니다.

## 사용한 이미지
모두 submission/images 아래의 기존 이미지입니다.

'''
guide+='\n'.join('- '+n for n in m['images'])
guide+='''
 
## 수치 출처
| 수치 | submission/metrics.json 경로 |
|---|---|
| 선택지 25.9 → 13.2 | compare.visibleChoices.before_avg_of_4 / after_avg_of_4 |
| 조작 9.3 → 13 | compare.stepsToFinish.before_swipes / after_taps 평균. 이전 9.25를 소수 첫째 자리 일반 반올림 |
| 단어 포함 38% → 100% | compare.wordCoverage.before["mock.json"] / after["mock.json"], 백분율 |
| real_03 0.21 → 1.02 | compare.wordCoverage.before["real_03"] / after["real_03"] |
| 가장 긴 단위 7.6~11 → 1.7~6.2화면 | compare.longestUnit.before_whole_page / after_tallest_card의 최솟값·최댓값 |
| 동일 입력 4건 | compare.visibleChoices.per_input 배열 길이 |

## 검수
'''
guide+=f'- 브라우저 상호작용 {len(qa["states"])}상태, 화면 크기별 {len(qa["responsive"])}상태를 검수했습니다.\n'
guide+='''- 스크립트 오류·글자 넘침·깨진 이미지 없음
- 영상 4구간 실제 재생 확인
- 원문 기록 대조, 영상 파일 해시 보존 확인
- 인쇄 14쪽, 모두 본문 있음
- 독립 디자인 검토에서 발견한 모바일 한국어 줄바꿈과 탭 가시성을 수정했고, 해당 수정 항목 모두 해결 판정을 받았습니다.
- 검수 기록과 제작 소스는 .redesign/ 안에 있습니다.
- 새 디자인 기준 기록은 .redesign/DESIGN.md와 .redesign/.impeccable/design.json입니다.

## 파일을 옮길 때
HTML은 원래 위치에서 여는 것이 기준입니다. 다른 위치로 옮겨 전달할 경우 submission/images, slides/demo-edited.mp4, slides/assets/saymyday도 상대 경로 구조와 함께 보존해야 합니다.
'''
(D/'발표_리디자인_안내.md').write_text(guide)
print(json.dumps(summary,ensure_ascii=False,indent=2))

