from pathlib import Path
import json,html,re,shutil,hashlib,statistics
from decimal import Decimal,ROUND_HALF_UP
D=Path(__file__).resolve().parent.parent
R=D.parent.parent
M=json.loads((R/'submission/metrics.json').read_text());C=M['compare']
P=(R/'submission/프롬프트.md').read_text()
def e(x):return html.escape(str(x),quote=True)
def md(x):
 x=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',e(x))
 return re.sub(chr(96)+r'(.+?)'+chr(96),r'<code>\1</code>',x)
def table(head):
 rows=[]
 for l in P[P.index(head):].splitlines():
  if not l.startswith('|'):break
  if re.match(r'^\|[- :|]+\|$',l):continue
  rows.append([s.strip() for s in l.strip('|').split('|')])
 return rows[1:]
versions=table('| 버전 |');incidents=table('| # | 무슨 일 |')[:6]
SL=[]
def slide(t,a,k,b,bridge,notes,source='',cls=''):
 assert len(notes)==3
 SL.append(dict(title=t,answer=a,section=k,body=b,bridge=bridge,notes=notes,source=source,cls=cls))
def img(n,a=''):return f'<img src="../images/{e(n)}" alt="{e(a or n)}">'
def phone(n,a):return f'<figure class="phone-figure"><button class="image-open" data-enlarge aria-label="{e(a)} 확대">{img(n,a)}</button><figcaption>{e(a)} · 클릭하여 확대</figcaption></figure>'
def split(l,r):return f'<div class="split"><div class="copy">{l}</div><div class="media-column">{r}</div></div>'
def ps(*a):return ''.join('<p>'+s+'</p>' for s in a)
def tabs(items,cls=''):
 serial=tabs.n;tabs.n+=1
 bs=[];pan=[]
 for i,(a,b) in enumerate(items):
  bs.append(f'<button role="tab" id="t{serial}-{i}" aria-controls="p{serial}-{i}" aria-selected="{str(i==0).lower()}" tabindex="{0 if i==0 else -1}">{e(a)}</button>')
  pan.append(f'<div class="tab-panel" id="p{serial}-{i}" role="tabpanel" aria-labelledby="t{serial}-{i}" {"" if i==0 else "hidden"}>{b}</div>')
 return f'<div class="tab-group {cls}"><div class="tabs" role="tablist">{"".join(bs)}</div><div class="tab-panels">{"".join(pan)}</div></div>'
tabs.n=1
def reveal(items,cls=''):
 return '<div data-reveal class="reveal-flow '+cls+'">'+''.join(f'<button class="reveal-item {"current" if i==0 else ""}" aria-expanded="{str(i==0).lower()}"><span class="step-label">{e(a)}</span><span class="step-copy">{b}</span></button>' for i,(a,b) in enumerate(items))+'</div>'
def acc(items):
 n=acc.n;acc.n+=len(items)
 return '<div class="accordion" data-accordion>'+''.join(f'<div class="acc-item"><button aria-expanded="{str(i==0).lower()}" aria-controls="a{n+i}"><span>{e(a)}</span><span class="acc-symbol">{"−" if i==0 else "+"}</span></button><div class="acc-body" id="a{n+i}" {"" if i==0 else "hidden"}>{b}</div></div>' for i,(a,b) in enumerate(items))+'</div>'
acc.n=1

slide('Say My Day','내 하루 일기로 배우는 외국어','PO 프로젝트',
 split('<div class="hero-wordmark">'+img('wordmark.webp','Say My Day 로고')+'</div>'+ps('기록은 쌓이고,<br>내 문장은 배움이 됩니다.')+'<div class="identity">발표자 이름 미기재 · PO</div><button class="primary" data-next>시작하기 →</button>',phone('01-splash.png','앱 시작 화면')),
 '먼저, 왜 만들었는지부터 말씀드릴게요.',
 ['Say My Day는 내 하루 일기로 외국어를 배우는 앱입니다.','일기를 기록하고 그 문장을 학습 카드로 바꿉니다.','먼저 이 앱을 만들게 된 불편부터 말씀드리겠습니다.'],'자료: slides-outline.md','cover')
slide('왜 만들었나요?','번역기는 답만 주고, 단어 앱은 내 이야기와 상관없다','문제 정의',
 split('<div class="context-tag">대표 사용 장면 · 상상한 예</div>'+reveal([
 ('누가','하루를 외국어로 말하고 싶은 학습자'),('언제','모국어로 오늘의 일기를 쓴 직후'),('왜','내 이야기와 먼 예문은 기억에 남기 어렵다.'),('근거','제작자 본인이 쓰며 모은 요구를<br>학습자·화면 설계·개발 관점으로 검토했다.')]),phone('03-write.png','모국어로 일기 쓰기')),
 '그래서 일기를 학습으로 바꿔 주는 앱을 만들었어요.',
 ['대표 사용 장면은 제작자가 상상한 예입니다.','자신의 하루를 말하고 싶은 순간에 번역만으로는 학습이 이어지지 않았습니다.','제작자 본인이 쓰며 모은 요구를 바탕으로 문제를 정했습니다.'],'자료: T38 사용 여정 계획 · T44 학습 화면 제안')
learn=[
 ('문장','내 문장부터 듣고 말하기','한 문장씩 듣고 소리 내어 따라 말합니다.','단어를 누르면 뜻과 발음을 확인합니다.','04-learn-sentence.png'),
 ('단어','문장 속 단어를 모아서 익히기','뜻을 가리고 기억을 떠올립니다.','학습한 단어는 복습 재료로 이어집니다.','05-learn-words.png'),
 ('문법','내 문장에 쓰인 규칙 이해하기','문법과 활용 예문을 함께 봅니다.','','06-learn-grammar.png'),
 ('전체 읽기','다시 내 이야기로 돌아오기','일기 전체를 처음부터 듣고 읽습니다.','','07-fullread.png'),
 ('오늘의 학습','학습한 하루가 눈에 남기','깃털과 학습 기록이 쌓이고 새가 자랍니다.','쉬었다 와도 누적한 학습 일수는 줄지 않습니다.','08-stats.png')]
slide('이 앱은 무엇인가요?','쓰고 → 번역하고 → 카드로 배우고 → 새가 자란다','서비스 소개',
 tabs([(a,split(ps('<strong>'+b+'</strong>',c,d) if d else ps('<strong>'+b+'</strong>',c),phone(im,a+' 화면'))) for a,b,c,d,im in learn],'phone-tabs'),
 '직접 쓰는 모습을 영상으로 볼게요.',
 ['모국어로 쓴 일기를 번역한 뒤 카드로 학습합니다.','문장과 단어, 문법을 익히고 일기 전체를 읽습니다.','학습한 날이 쌓이는 모습을 깃털과 새의 성장으로 보여 줍니다.'],'자료: README.md · T38 사용 여정 계획')

edited=Path('/Users/gimgang/Documents/Codex/2026-10-29/new-chat/outputs/say-my-day-demo-2026-11-03/Say_My_Day_시연영상.mp4')
plan=json.loads(edited.with_name('edit-plan.json').read_text())
pdf_start=plan['segments'][26]['outputStart'];pdf_end=plan['segments'][28]['outputEnd']
def video(start=None,end=None):
 attrs='' if start is None else f' data-start="{start:.3f}" data-end="{end:.3f}"'
 src='demo-edited.mp4' if start is None else f'demo-edited.mp4#t={start:.3f},{end:.3f}'
 return '<div class="video-layout"><div>'+ps('<strong>'+('일기 쓰기부터 학습과 복습까지' if start is None else '정상 생성된 PDF 확인')+'</strong>','시연 영상: 제출물 참고')+'<a class="text-link" href="demo-edited.mp4" target="_blank">영상 파일 열기 ↗</a></div>'+f'<video controls playsinline preload="metadata"{attrs} aria-label="시연영상"><source src="{src}" type="video/mp4">시연 영상: 제출물 참고</video></div>'
slide('어떻게 쓰나요?','일기 한 편이 학습으로 끝나는 과정을 보여 드립니다.','시연',
 tabs([('전체 시연',video()),('PDF 저장 구간',video(pdf_start,pdf_end))],'video-tabs'),
 '처음부터 이랬던 건 아니에요.',
 ['앞서 편집한 시연영상으로 실제 사용 흐름을 보여 드리겠습니다.','PDF 저장 구간은 정상 작동한 추가 촬영분으로 교체된 영상입니다.','재생이 안 되면 제출물의 시연영상 파일을 열겠습니다.'],'자료: 이번 대화에서 편집한 제출용 시연영상')
history=[
 ('첫 배포','번역과 해설을 한 페이지에','문장·단어·문법이 길게 이어졌습니다.','old/v1-0919-result.png'),
 ('B안','화면과 인트로를 바꾸기','구체적인 불편의 원인 기록은 자료가 부족합니다.','old/v2-0919-B-result.png'),
 ('Say My Day','배우는 언어의 범위 넓히기','쓰는 말과 배우는 말을 고르는 앱으로 바뀌었습니다.','old/v3-1029-pre-result.png'),
 ('그림일기','일기장 같은 느낌 더하기','기록하는 분위기와 함께하는 새를 중심에 뒀습니다.','old/v4-1030-picturediary-result.png'),
 ('카드 학습','많은 선택지와 긴 목록 줄이기','다음에 무엇을 할지 학습 흐름이 안내합니다.','04-learn-sentence.png')]
slide('처음엔 어땠고, 어떻게 달라졌나요?','다섯 번 바뀌었고 매번 사용해 본 불편을 따라갔다','만들어 온 과정',
 tabs([(a,split(ps('<strong>'+b+'</strong>',c),phone(im,a+' 결과 화면'))) for a,b,c,im in history],'phone-tabs'),
 '그 변화를 만들며 무엇을 먼저 하기로 했을까요?',
 ['다섯 시점의 화면을 같은 크기로 비교합니다.','그림일기에서는 기록하는 느낌을, 카드 학습에서는 한 번에 하는 행동을 정리했습니다.','이 변화의 근거는 제작자 본인이 쓰며 모은 요구입니다.'],'자료: slides-outline.md · images/README.md · 프롬프트.md')
slide('무엇부터 만들었나요?','핵심 흐름 하나를 끝까지','PO의 우선순위',
 '<div class="decision-question">판단 기준 <strong>“내 일기가 학습이 되는가”</strong></div>'+reveal([
 ('쓰기 → 번역','내가 쓴 일기가 학습 재료가 되는가'),('듣고 말하기','그 문장을 내 입으로 말해 볼 수 있는가'),('단어','내 문장 속 단어를 다시 익힐 수 있는가'),('전체 읽기','배운 것을 다시 하나의 이야기로 읽는가'),('오늘의 학습','끝냈다는 느낌과 쌓인 기록이 남는가')],'priority'),
 '만든 것만큼 안 만든 것도 중요했어요.',
 ['무엇부터 만들지는 내 일기가 학습이 되는가를 기준으로 정했습니다.','쓰기와 번역에서 시작해 듣고 말하고, 단어를 익혀 전체를 읽게 했습니다.','학습을 마쳤다는 느낌과 누적 기록까지 이어지는 흐름을 우선했습니다.'],'자료: T38 사용 여정 계획 · T44 학습 화면 제안')

omit=[
 ('발음 정밀 평가','확인되지 않은 발음 점수보다<br>소리 내어 말하는 흐름을 먼저 만듭니다.'),
 ('마이크 기본 켜기','기기와 접속 환경의 제약이 있어<br>마이크 없이도 학습하도록 했습니다.'),
 ('깃털 나무·배지·공유 틀','꾸미기보다 쓰고 배우는 핵심 흐름을<br>먼저 완성하기 위해 보류했습니다.'),
 ('유료 결제','이번 서비스 범위에서<br>유료 결제는 만들지 않았습니다.'),
 ('가리고 말하기','학습 흐름을 단순하게 정리하고<br>다음 단계로 보류했습니다.')]
flips='<div class="flip-grid" data-flips>'+''.join(f'<button class="flip-card" aria-pressed="false"><span class="flip-front"><strong>{e(a)}</strong><span class="hint">이유 보기 ＋</span></span><span class="flip-back" hidden><strong>{e(a)}</strong><span>{b}</span><span class="hint">다시 누르면 닫기</span></span></button>' for a,b in omit)+'</div>'
slide('무엇을 일부러 안 만들었나요?','못 만든 게 아니라 안 만든 것','PO의 범위 결정',flips,
 '하나를 얻으면 하나를 잃기도 했어요.',
 ['기능을 더하는 것뿐 아니라 이번에 만들지 않을 범위도 정했습니다.','마이크는 환경 제약이 있어 기본으로 켜지 않고, 꾸미기는 핵심 흐름 뒤로 미뤘습니다.','가리고 말하기도 다음 단계로 남겨 지금의 사용 흐름을 단순하게 했습니다.'],'자료: slides-outline.md · README.md · T38·T44')
trade=[
 ('긴 스크롤 → 카드','한 번에 한 행동에 집중','다음으로 넘기는 조작이 늘어남'),
 ('단어 자동 담기','복습 재료가 자연스럽게 쌓임','단어장이 불어날 수 있어 빼기 필요'),
 ('설명 접어 두기','첫 화면의 정보량이 줄어듦','설명을 보려면 한 번 더 눌러야 함')]
b='<div data-tradeoffs><div class="tradeoff-grid">'+''.join(f'<button class="tradeoff" aria-expanded="{str(i==0).lower()}"><strong>{e(a)}</strong><span class="hint">얻은 것과 잃은 것 보기</span></button>' for i,(a,_,__) in enumerate(trade))+'</div><div class="tradeoff-details">'+''.join(f'<div class="tradeoff-panel" {"" if i==0 else "hidden"}><div><span class="label">얻은 것</span><p>{e(a)}</p></div><div><span class="label">잃은 것</span><p>{e(b)}</p></div></div>' for i,(_,a,b) in enumerate(trade))+'</div></div>'
slide('무엇과 무엇을 맞바꿨나요?','얻은 것과 잃은 것을 함께 적었다','PO의 설계 판단',b,
 '그럼 예상 밖 상황엔 어떻게 되는지 볼게요.',
 ['긴 화면을 카드로 나누면 집중할 수 있지만 넘기는 조작이 늘어납니다.','단어를 자동으로 담으면 복습은 쉬워지지만 단어장이 불어날 수 있습니다.','설명을 접으면 첫 화면은 단순해져도 한 번 더 눌러야 합니다.'],'자료: T44 학습 화면 제안 · metrics.json / compare')
exceptions=[
 ('빈 입력','빈 일기는 먼저 안내하고 요청을 보내지 않습니다.','11-err-empty.png'),
 ('글자 수 초과','입력할 수 있는 길이를 제한하고 안내합니다.','12-err-long.png'),
 ('언어 불일치','입력 언어를 확인하고 바꿀 수 있게 안내합니다.','13-err-lang.png'),
 ('서버 오류','쓴 일기는 남겨 두고 다시 시도할 수 있습니다.','14-err-api.png'),
 ('빈 화면','쓴 일기가 없으면 새 일기 버튼을 보여 줍니다.','15-empty-hist.png'),
 ('중간 이탈','닫은 카드 위치를 저장해 이어서 학습합니다.','17-resume.png')]
slide('예상 밖 상황엔 어떻게 되나요?','이탈·빈 화면·실패에도 길을 잃지 않게','예외 상황 설계',
 tabs([(a,split(ps('<strong>'+a+'</strong>',b),phone(im,a))) for a,b,im in exceptions],'phone-tabs'),
 '그럼 잘 만들었는지 어떻게 확인했을까요?',
 ['입력이 비어 있거나 언어가 다를 때는 요청 전에 안내합니다.','서버가 실패해도 입력한 일기는 지키고 다시 시도하게 합니다.','데이터가 없거나 학습 중 나가더라도 다음 행동이 보이도록 했습니다.'],'자료: submission/stability.md')
slide('잘 만들었는지 어떻게 확인했나요?','사람 없이 잴 수 있는 것부터 쟀다','평가 방법',
 reveal([('진단','선택지가 많다 · 단어가 빠진다 · 한 번에 너무 길다'),('지표','선택지 · 단어 포함 비율 · 조작 횟수 · 가장 긴 단위'),('방법','같은 일기 결과를 이전·현재 버전에서 같은 코드로 측정했다.'),('한계','사람 없이 잰 화면 지표이며,<br>사용성이나 학습 효과가 좋아졌다는 증거는 아니다.')]),
 '결과를 보겠습니다.',
 ['화면에서 드러나는 문제를 먼저 정하고 비교할 지표를 골랐습니다.','같은 일기 결과를 이전 버전과 현재 버전에서 같은 코드로 측정했습니다.','사람 없이 잰 화면 지표이므로 실제 사용성과 학습 효과는 아직 측정 전입니다.'],'자료: submission/metrics.json / compare')
choices=C['visibleChoices'];word=C['wordCoverage'];steps=C['stepsToFinish'];longest=C['longestUnit']
bs=float(Decimal(str(statistics.mean(steps['before_swipes']))).quantize(Decimal('0.1'),rounding=ROUND_HALF_UP))
ast=statistics.mean(steps['after_taps'])
def chart(title,sub,before,after,vb,va,m):
 return f'<div class="metric"><div class="metric-head"><h3>{e(title)}</h3><span>{e(sub)}</span></div><div class="bar-pair"><div class="bar-line"><span class="bar-name">이전</span><div class="bar-track"><i style="--bar:{vb/m*100:.4f}%"></i></div><b>{e(before)}</b></div><div class="bar-line after"><span class="bar-name">현재</span><div class="bar-track"><i style="--bar:{va/m*100:.4f}%"></i></div><b>{e(after)}</b></div></div></div>'
bars=chart('한 화면의 선택지','같은 입력 묶음의 평균','25.9개','13.2개',choices['before_avg_of_4'],choices['after_avg_of_4'],choices['before_avg_of_4'])
bars+=chart('문장 속 단어 포함 비율','例: mock.json 한 건','38%','100%',word['before']['mock.json'],word['after']['mock.json'],1)
bars+=chart('끝까지 보는 조작 횟수','이전: 스와이프 / 현재: 탭',f'{bs:g}회',f'{ast:g}회',bs,ast,ast)
bars+=chart('가장 긴 단위','막대: 최대값 / 라벨: 범위','7.6~11화면','1.7~6.2화면',max(longest['before_whole_page']),max(longest['after_tallest_card']),max(longest['before_whole_page']))
compare='<div class="full-compare" data-compare><div class="comparison-pair"><figure>'+img('20-before-first.png','카드 도입 직전 전체 캡처')+'<figcaption>이전 · 긴 결과 목록</figcaption></figure><figure>'+img('04-learn-sentence.png','현재 문장 카드 전체 캡처')+'<figcaption>현재 · 문장 카드</figcaption></figure></div><label class="range-label">비교 비중 조절 <input type="range" min="25" max="75" value="50" aria-label="전후 화면 비교 비중"><output>균등 비교</output></label></div>'
b=tabs([('수치 비교','<div class="results-layout"><div class="bars">'+bars+'</div><figure class="comparison-index"><button class="image-open" data-enlarge aria-label="전후 비교 이미지 확대">'+img('21-before-after.png','이전 긴 화면과 현재 카드 학습 비교')+'</button><figcaption>전후 화면 · 클릭하여 확대</figcaption></figure></div>'),('화면 비교',compare)],'result-tabs')
slide('결과는 어땠나요?','선택지는 약 절반, 단어 포함은 38% → 100%','평가 결과',b,
 '다 좋아진 건 아니에요. 아쉬운 점과 이유를 말씀드릴게요.',
 ['한 화면에서 보이는 선택지는 줄었고, 예시 결과의 단어 포함 비율은 높아졌습니다.','조작 횟수는 오히려 늘었으며, 이전 스와이프와 현재 탭은 다른 행동이라는 점도 고려해야 합니다.','가장 긴 카드는 여전히 여러 화면에 걸쳐 있어 다음 개선 과제로 남았습니다.'],
 '출처: metrics.json / compare · 단어 비율은 mock.json 한 건 · 사람 없이 잰 화면 지표')
limits=[
 ('조작 횟수는 늘었다',ps('<strong>발견</strong> 이전 9.3회 → 현재 13회','<strong>원인</strong> 학습 흐름을 카드로 나눴습니다.','<strong>다음</strong> 실제 사용자가 끝까지 하는지 확인합니다.')),
 ('단어 리스트는 여전히 길다',ps('<strong>발견</strong> 단어 48개가 있는 경우, 가장 긴 카드가 6.2화면입니다.','<strong>원인</strong> 문장 속 단어를 더 많이 담았습니다.','<strong>다음</strong> 단어 리스트 접기를 검토합니다.')),
 ('옛 응답은 단어 포함 비율을 못 잰다',ps('<strong>발견</strong> 단어 분해 정보가 없는 옛 응답은 계산에서 뺐습니다.','<strong>원인</strong> 옛 응답과 현재 응답의 정보 구조가 다릅니다.','<strong>다음</strong> 비교 조건을 맞춰 다시 확인합니다.')),
 ('번역은 틀릴 수 있다',ps('<strong>발견</strong> 번역의 정확도는 측정 전입니다.','<strong>원인</strong> 번역은 AI 응답에 달려 있습니다.','<strong>다음</strong> “확인 필요” 표시와 다시 번역으로 보완합니다.'))]
slide('무엇이 아쉬웠고, 왜 그런가요?','조작 횟수는 늘었고, 단어 리스트는 길다','평가의 한계',acc(limits),
 '번역이 덜 틀리게는 어떻게 했는지 볼게요.',
 ['조작 횟수가 늘어난 이유는 학습을 카드로 나눴기 때문입니다.','단어를 더 많이 보여 주면서 단어 리스트 길이는 남은 문제가 됐습니다.','비교할 수 없는 옛 응답은 제외했고 번역 정확도는 아직 측정 전입니다.'],
 '출처: metrics.json / compare.stepsToFinish · wordCoverage · longestUnit')

vpan=[]
version_story=[
 ('기준 세우기','먼저, 번역의 기준을 정했습니다.','쉬운 말로 옮기고, 일기에 없는 사실은 더하지 않게 했습니다.','AI가 답을 만들기 전에 지켜야 할 경계부터 정했습니다.'),
 ('읽기 좋게','길면 읽기 어렵고, 이유가 없으면 배우기 어렵습니다.','긴 문장을 나누고, 단어를 고른 이유를 붙이도록 했습니다.','번역 결과를 읽고 이해할 수 있게 바꿨습니다.'),
 ('뜻 확인','예문이 좋아도 뜻을 모르면 학습이 멈춥니다.','예문마다 한국어 뜻을 함께 주도록 바꿨습니다.','학습자가 다시 번역기를 찾는 빈틈을 줄이려 했습니다.'),
 ('원문·어감 보호','AI의 설명도, 다른 관점으로 다시 확인했습니다.','원문 변형·어감 누락·어려운 말·발음 오류를 감수로 찾았습니다.','원문은 앱이 보존하고, 규칙과 교정 표로 보완했습니다.'),
 ('단어 연결','단어를 눌러 배우려면, 답의 구조부터 달라야 했습니다.','문장을 단어로 나누고, 모호한 부분에 문장 번호를 붙였습니다.','프롬프트도 화면에서 하려는 행동에 맞춰 바꿨습니다.')]
for i,(version,change,why) in enumerate(versions):
 label,headline,detail,reason=version_story[i]
 original=f'<div class="prompt-version"><div class="context-tag">{e(version)} · 프롬프트 원문 기록</div><table class="source-table"><tbody><tr><th scope="row">바꾼 것</th><td>{md(change)}</td></tr><tr><th scope="row">왜 바꿨나</th><td>{md(why)}</td></tr></tbody></table></div>'
 narrative='<div class="prompt-story">'+ps('<strong>'+headline+'</strong>',detail,reason)+'</div>'
 vpan.append((version+' '+label,'<div class="source-switch" data-source><div class="source-story">'+narrative+'</div><div class="source-original" hidden>'+original+'</div><button class="source-toggle" aria-expanded="false">기록 표 원문 보기 ＋</button></div>'))
safe='<div class="safety-layout"><div>'+ps('<strong>AI 출력을 그대로 쓰지 않는 장치</strong>','병음은 앱이 만들고 교정 표로 보정합니다.','원문은 보존하고, 표현 사전은 문맥에 맞을 때만 적용합니다.','문장 나누기·읽기 누락은 자동 시험으로 확인합니다.')+'</div><button class="image-open architecture" data-enlarge aria-label="앱 구조도 확대">'+img('23-architecture.png','브라우저·서버·AI·음성 구조와 안전장치')+'</button></div>'
vpan.append(('안전장치',safe))
slide('번역이 덜 틀리게 어떻게 했나요?','AI를 믿지 않는 장치를 겹쳤다','AI 활용 · 프롬프트',
 tabs(vpan,'prompt-tabs'),'AI와 어떻게 일했는지도 기록했어요.',
 ['프롬프트는 길이와 예문 뜻, 원문 보존, 단어 구조를 다듬으며 바꿨습니다.','각 버전에서 무엇을 왜 바꿨는지는 기록 표의 내용을 그대로 보여 드립니다.','프롬프트 밖에서도 병음 교정과 원문 보존, 자동 시험으로 보완했습니다.'],'자료: 프롬프트.md §1·2 · 버전별 표 원문')
workflow=[
 ('요구','사용자가 겪은 불편을 작업 카드로 나눕니다.'),
 ('관점 검토','학습자·화면 설계·개발 관점에서 제안을 비교합니다.'),
 ('사용자 승인','사용자가 범위와 방향을 정한 뒤 구현합니다.'),
 ('구현','한 번에 한 작업을 끝낼 수 있게 진행합니다.'),
 ('시험','완료 기준을 확인하고 실제 데이터와 키를 보호합니다.'),
 ('기록','진행 기록과 로컬 변경 기록을 남깁니다.')]
b='<div class="workflow" data-workflow><div class="workflow-steps">'+''.join(f'<button aria-pressed="{str(i==0).lower()}">{e(a)}</button>' for i,(a,_) in enumerate(workflow))+'</div><div class="workflow-detail">'+''.join(f'<p {"" if i==0 else "hidden"}>{e(b)}</p>' for i,(_,b) in enumerate(workflow))+'</div></div>'
rules=tabs([
 ('CLAUDE.md',ps('<strong>작업의 경계</strong>','시험은 분리한 서버에서, 실제 데이터는 건드리지 않습니다.','키는 출력·커밋하지 않고, 푸시는 사용자 승인 뒤에 합니다.')),
 ('디자인 스킬',ps('<strong>같은 기준으로 만들기</strong>','/say-my-day-design으로 확정 디자인 기준을 확인합니다.','contrast-check로 밝은 화면과 어두운 화면의 글자 대비를 점검합니다.')),
 ('실제 지시','<blockquote>“사용자 입장과 UIUX전문가의 입장에서 이 학습 부분 설계를 심도있게 검토해서 제안해줘. 이게 이 앱의 핵심이야.”</blockquote>')
 ],'evidence-tabs')
slide('AI와 어떻게 일했나요?','카드 한 장씩, 검토한 뒤 승인받고 만들었다','AI 활용 · PO의 작업 방식',
 b+'<div class="evidence">'+rules+'</div>','그 과정에서 AI도 실수를 했어요.',
 ['요구를 관점별로 검토하고 사용자가 승인하면 구현하는 순서로 진행했습니다.','CLAUDE.md에는 데이터와 키 보호, 승인 뒤 푸시 같은 경계를 뒀습니다.','디자인 기준과 글자 대비 검사는 스킬로 같은 기준을 적용했습니다.'],
 '자료: 프롬프트.md §3·4')
accitems=[]
for ident,event,found,fixed in incidents:
 accitems.append((event,f'<h3 class="incident-story">{md(event)}</h3><table class="source-table incident-table"><tbody><tr><th scope="row">어떻게 발견했나</th><td>{md(found)}</td></tr><tr><th scope="row">고친 것</th><td>{md(fixed)}</td></tr></tbody></table>'))
short_cases=['모순된 사전 규칙','유료 키로 돌아간 시험','실제 기록에 섞인 시험 데이터','바로 닫히는 삭제 확인','놓친 마이크 제약','기록에 섞인 큰 파일']
b='<div class="incident-browser" data-incidents><div class="incident-list">'+''.join(f'<button aria-expanded="{str(i==0).lower()}" aria-controls="incident-{i}"><span class="incident-index">{i+1:02}</span>{e(short_cases[i])}</button>' for i,(a,_) in enumerate(accitems))+'</div><div class="incident-details">'+''.join(f'<div id="incident-{i}" {"" if i==0 else "hidden"}>{b}</div>' for i,(_,b) in enumerate(accitems))+'</div></div>'
slide('AI는 어떤 실수를 했고, 어떻게 고쳤나요?','실수를 잡는 장치가 곧 품질이다','AI 활용 · 실제 실수 기록',
 b,'마지막으로 한계와 다음 단계입니다.',
 ['실수 기록에는 발견한 계기와 고친 내용을 함께 남겼습니다.','비용과 데이터 보호 문제는 시험 환경을 분리하는 규칙으로 이어졌습니다.','기능의 전제를 놓친 경우에는 범위를 조정하고 사실을 사용자에게 보고했습니다.'],
 '자료: 프롬프트.md §5 · 원문 표의 첫 여섯 사례')
def reflection(items):return '<div class="reflection-grid">'+''.join('<div class="reflection-item"><span class="label">'+a+'</span><p>'+b+'</p></div>' for a,b in items)+'</div>'
b=tabs([
 ('한계',reflection([('실제 사용자','완주율·시간·만족도는 측정 전입니다.'),('마이크','실제 기기에서 충분히 확인하지 못했습니다.'),('단어 리스트','많은 단어가 있는 카드는 아직 깁니다.'),('AI 번역','틀릴 가능성이 남아 있습니다.')])),
 ('다음 검증',reflection([('실제 사용자와 확인','끝까지 학습하는지·얼마나 걸리는지·어떻게 느끼는지 봅니다.'),('학습 흐름 보완','가리고 말하기와 단어 리스트 접기를 검토합니다.'),('다음 방문으로 잇기','복습 알림을 검토합니다.'),('번역 확인 보완','번역을 평가하는 기준을 보정합니다.')]))],'reflection-tabs')
slide('회고: 한계와 다음 단계','만든 것의 한계를 알고, 다음 검증을 정했다','회고',b,'감사합니다.',
 ['사람 없이 잰 화면 지표만으로는 실제 사용 경험을 확인할 수 없습니다.','마이크와 긴 단어 리스트, AI 번역의 한계도 남아 있습니다.','다음에는 실제 학습자와 완주 여부, 걸린 시간, 만족도를 확인하겠습니다.'],
 '자료: slides-outline.md · README.md · T44의 확인 방법')
reqs=[('문제 정의',[2]),('서비스 소개·사용법',[3,4,5]),('PO 설계 판단',[6,7,8,9]),('평가 리포트',[10,11,12]),('AI 활용 과정',[13,14,15]),('회고',[16])]
req='<div class="requirement-grid">'+''.join('<div class="requirement"><strong>'+a+'</strong><span>'+''.join(f'<button class="chip" data-goto="{n}">{n}장</button>' for n in ns)+'</span></div>' for a,ns in reqs)+'</div>'
links='<div class="submission-links">'+''.join(f'<a href="{u}" target="_blank" rel="noopener"><span>{a}</span><b>{b} ↗</b></a>' for a,b,u in [
 ('GitHub','kang0712-97 / say-my-day','https://github.com/kang0712-97/say-my-day'),
 ('배포 주소','chinese-diary.onrender.com','https://chinese-diary.onrender.com'),
 ('AI 활용 기록','프롬프트.md','../프롬프트.md'),
 ('시연 영상','제출용 편집본','demo-edited.mp4')])+'</div>'
slide('제출물·요구 대응표','필요한 근거와 해당 장으로 바로 이동합니다.','부록',
 '<div class="appendix-layout">'+links+req+'</div>','발표를 마칩니다. 질문을 받겠습니다.',
 ['저장소와 배포 주소, 프롬프트 기록, 시연영상으로 바로 이동할 수 있습니다.','요구 항목의 버튼을 누르면 해당 장으로 돌아갑니다.','문제 정의부터 설계 판단, 평가와 AI 활용, 회고까지 빠짐없이 담았습니다.'],
 '자료: README.md · slides-outline.md §3')
assert len(SL)==17

# Final narrative pass: the user authorized adding the PO's interpretation.
# It adds reasoning and illustrative scenes, not invented measurements or development events.
SL[1]['body']=SL[1]['body'].replace('하루를 외국어로 말하고 싶은 학습자','“오늘 친구와 우동을 먹었다”를<br>외국어로 말해 보고 싶은 학습자').replace('내 이야기와 먼 예문은 기억에 남기 어렵다.','번역문을 얻는 것과<br>스스로 말하는 것 사이에 학습이 비어 있다.')
SL[4]['body']=SL[4]['body'].replace('구체적인 불편의 원인 기록은 자료가 부족합니다.','PO의 해석: 처음 들어온 사람이<br>무엇을 하는 앱인지 알게 만드는 단계입니다.')
SL[4]['body']=SL[4]['body'].replace('번역과 해설을 한 페이지에','답은 모였지만, 할 일은 사용자가 골랐다').replace('화면과 인트로를 바꾸기','이 앱의 쓰임을 첫 화면에서 알리기').replace('배우는 언어의 범위 넓히기','내 언어로 쓰고, 원하는 언어로 배우기').replace('일기장 같은 느낌 더하기','기록을 다시 펼치고 싶게 만들기').replace('많은 선택지와 긴 목록 줄이기','이제 화면이 다음 학습을 안내한다')
for old,new in [('>첫 배포</button>','>10/19 첫 배포</button>'),('>B안</button>','>10/19 B안</button>'),('>Say My Day</button>','>10/27~29 Say My Day</button>'),('>그림일기</button>','>10/30 그림일기</button>'),('>카드 학습</button>','>11/03 카드 학습</button>')]:
 SL[4]['body']=SL[4]['body'].replace(old,new)
SL[5]['body']=SL[5]['body'].replace('내가 쓴 일기가 학습 재료가 되는가','내 일기가 학습 재료로 바뀌는가').replace('끝냈다는 느낌과 쌓인 기록이 남는가','오늘 끝낸 일과 쌓인 기록이 보여 다시 올 이유가 있는가')
SL[7]['body']=SL[7]['body'].replace('얻은 것</span>','얻으려 한 것</span>').replace('잃은 것</span>','감수한 것</span>')
SL[9]['body']=SL[9]['body'].replace('사용성이나 학습 효과가 좋아졌다는 증거는 아니다.','진짜로 배우기 쉬워졌는지는<br>실제 사용 과정에서 확인해야 한다.')
SL[9]['body']=SL[9]['body'].replace('같은 일기 결과를 이전·현재 버전에서 같은 코드로 측정했다.','같은 일기 결과 4건을 이전·현재 버전에서 같은 코드로 측정했다.')
SL[15]['notes']=['이번에 만든 것은 내 이야기를 학습으로 잇는 하나의 흐름입니다.','카드로 집중하게 했지만 조작은 늘었고, 더 많은 단어를 담자 목록이 길어졌습니다.','다음에는 기능을 더하기 전에 실제 학습자가 끝까지 배우는지 확인하겠습니다.']

CSS=(D/'.qa/style.css').read_text();JS=(D/'.qa/runtime.js').read_text()
sections=[]
for i,s in enumerate(SL,1):
 tag='h1' if i==1 else 'h2';index='A' if i==17 else str(i).zfill(2)
 sections.append(f'<section class="slide {s["cls"]}" data-title="{e(s["title"])}" data-section="{e(s["section"])}" aria-label="{i}장 {e(s["title"])}"><header><div class="kicker"><span class="index">{index}</span>{e(s["section"])}</div><{tag}>{e(s["title"])}</{tag}><p class="answer">{e(s["answer"])}</p></header><div class="body">{s["body"]}</div><div class="source">{e(s["source"])}</div><footer class="bridge"><span>다음</span>{e(s["bridge"])}</footer><aside class="notes">'+''.join('<p>'+e(n)+'</p>' for n in s['notes'])+'</aside></section>')
metric_sources={
 '25.9 → 13.2개':['compare.visibleChoices.before_avg_of_4','compare.visibleChoices.after_avg_of_4'],
 '38% → 100% (mock.json 예시 한 건)':['compare.wordCoverage.before["mock.json"] * 100','compare.wordCoverage.after["mock.json"] * 100'],
 '9.3 → 13회':['mean(compare.stepsToFinish.before_swipes) = 9.25, 소수 첫째 자리 half-up 반올림','mean(compare.stepsToFinish.after_taps) = 13'],
 '7.6~11 → 1.7~6.2화면':['min/max(compare.longestUnit.before_whole_page)','min/max(compare.longestUnit.after_tallest_card)'],
 '단어 48개':['compare.wordCoverage.words_in_list.after[1]']}
metric_sources['비교 입력 4건']=['len(compare.visibleChoices.per_input.before) = 4','len(compare.visibleChoices.per_input.after) = 4']
comment='수치 출처: submission/metrics.json (compare 항목만 사용)\n'+json.dumps(metric_sources,ensure_ascii=False,indent=2)+'''
측정 전: 사용자 완주율, 학습 시간, 만족도, 번역 정확도. 작업 카드·커밋 집계는 허용된 compare 범위 밖이라 제외.
구조 번호·프롬프트 버전·원문 표의 조건/사건 수치는 비교 통계가 아니며 프롬프트.md 원문을 유지.
개요 반영: 본문 16장과 부록, 누락 없음. 사용자가 개요 v2 기준을 확인함.
개요의 시연 시간·작업 집계 숫자 중 compare 밖 수치는 생략하거나 측정 전으로 표시.
세로 캡처: 16:9 안에서 원본 전체를 보존. 미디어 열 폭 34%, 이미지 contain. 확대창에서 확대 및 세로 스크롤.
전후 슬라이더는 두 이미지의 비교 비중만 바꿈. 이미지 자체를 가리거나 잘라 비교하지 않음.
영상: demo-edited.mp4는 앞선 편집본과 바이트가 같은 복사본. 기존 demo1.mp4·demo2.mp4는 변경하지 않음.
자료 부족: 발표자 이름. B안 개편의 이유는 실제 사건이 아닌 PO의 해석으로 표시.
후속 사용자 지시: 논리적 설득력을 위한 서사 보강을 허용. 사용 장면·PO 해석을 추가하되 수치와 개발 사건은 기록에 맞춤.
'''
manuscript=json.dumps({'slides':SL,'metricSources':metric_sources},ensure_ascii=False).replace('</','<\\/')
document='<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Say My Day | PO 프로젝트 발표</title><style>'+CSS+'</style></head><body><div class="top-progress" id="progress"></div><main class="viewport"><div class="stage" id="stage">'+''.join(sections)+'</div></main>'+'''
<nav class="chrome" aria-label="발표 이동"><button id="prev" aria-label="이전 장">←</button><span class="counter" id="counter" aria-live="polite"></span><button id="next" aria-label="다음 장">→</button><span class="section-label" id="section-label"></span><span class="keyhint">← → 이동 · Home / End</span><button id="overview-toggle">목차 G</button><button id="notes-toggle" aria-pressed="false">대본 N</button><button id="fullscreen">전체 화면 F</button></nav>
<aside class="notes-panel" id="notes-panel" hidden aria-label="발표 대본"><button class="notes-close" id="notes-close" aria-label="대본 닫기">닫기</button><h2>발표 대본</h2><div id="notes-body"></div></aside>
<dialog id="overview"><div class="dialog-top"><h2>목차</h2><button data-close>닫기</button></div><div class="overview-grid" id="overview-grid"></div></dialog>
<dialog class="lightbox" id="lightbox"><div class="dialog-top"><h2 id="lightbox-label">화면 확대</h2><button data-close>닫기</button></div><img id="lightbox-image" alt=""></dialog>
'''+f'<script type="application/json" id="deck-manuscript">{manuscript}</script><script>{JS}</script></body></html>\n<!--\n{comment}\n-->\n'
(D/'발표.html').write_text(document)
target=D/'demo-edited.mp4'
if not target.exists():shutil.copy2(edited,target)
assert hashlib.sha256(target.read_bytes()).digest()==hashlib.sha256(edited.read_bytes()).digest()
used=sorted(set(re.findall(r'src="\.\./images/([^"]+)"',document)))
for n in used:assert (R/'submission/images'/n).is_file(),n
report={'file':str(D/'발표.html'),'slides':16,'appendices':1,'usedImages':used,'metricSources':metric_sources,'missing':['발표자 이름'],'video':{'file':'demo-edited.mp4','bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()},'contentNotes':['개요 순서와 장 제목 유지','시연 장 한 문장 답에서 compare 밖 시간 표현 제외','작업 카드·커밋 수는 compare 밖이므로 표시하지 않음','원문 표의 식별자·수준·사건 조건은 원문 보존','사용자 허용에 따라 사용 장면과 PO의 해석 보강']}
(D/'.qa/manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))

