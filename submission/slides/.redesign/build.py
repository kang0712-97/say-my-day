from pathlib import Path
import json,html,re,shutil,statistics
from decimal import Decimal,ROUND_HALF_UP
D=Path(__file__).resolve().parent.parent
R=D.parent.parent
Q=D/'.redesign'
M=json.loads((R/'submission/metrics.json').read_text())
C=M['compare'];P=(R/'submission/프롬프트.md').read_text()
font=Path('/Users/gimgang/Documents/Codex/2026-10-29/new-chat/outputs/say-my-day-reader/assets/fonts/PretendardVariable.ttf')
assets=D/'assets/saymyday';assets.mkdir(parents=True,exist_ok=True)
if not (assets/font.name).exists():shutil.copy2(font,assets/font.name)
def e(x):return html.escape(str(x),quote=True)
def md(x):
 x=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',e(x))
 return re.sub(chr(96)+r'(.+?)'+chr(96),r'<code>\1</code>',x)
def table(head):
 rows=[]
 for l in P[P.index(head):].splitlines():
  if not l.startswith('|'):break
  if re.match(r'^\|[- :|]+\|$',l):continue
  rows.append([x.strip() for x in l.strip('|').split('|')])
 return rows[1:]
versions=table('| 버전 |');incidents=table('| # | 무슨 일 |')[:6]
def img(n,alt='',cls=''):return f'<img src="../images/{e(n)}" alt="{e(alt or n)}" class="{cls}">'
def icon(name):
 body={'next':'<path d="m9 5 7 7-7 7M4 12h12"/>','prev':'<path d="m15 5-7 7 7 7M20 12H8"/>','play':'<path d="m8 5 11 7-11 7Z"/>','expand':'<path d="M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5"/>','close':'<path d="m6 6 12 12M6 18 18 6"/>'}[name]
 return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+body+'</svg>'
def p(*texts):return ''.join('<p>'+s+'</p>' for s in texts)
def shot(n,alt='',cls=''):
 return '<figure class="shot '+cls+'"><button data-zoom aria-label="'+e(alt)+' 확대">'+img(n,alt)+'</button><figcaption>'+e(alt)+' <span>전체 화면 보기</span></figcaption></figure>'
def group(items,cls='',label='상세 내용'):
 n=group.n;group.n+=1
 return '<div class="switch-group '+cls+'" data-group><div class="switches" role="tablist" aria-label="'+e(label)+'">'+''.join(f'<button role="tab" aria-selected="{str(i==0).lower()}" aria-controls="panel{n}-{i}" id="tab{n}-{i}" tabindex="{0 if i==0 else -1}">{e(a)}</button>' for i,(a,b) in enumerate(items))+'</div><div class="panels">'+''.join(f'<div role="tabpanel" class="panel" aria-labelledby="tab{n}-{i}" id="panel{n}-{i}" {"" if i==0 else "hidden"}>{b}</div>' for i,(a,b) in enumerate(items))+'</div></div>'
group.n=1
S=[]
def slide(title,body,notes,cls='',source='',chapter=''):
 S.append(dict(title=title,body=body,notes=notes,cls=cls,source=source,chapter=chapter))
def heading(t,sub=''):
 return '<header class="heading"><h2>'+t+'</h2>'+('<p class="sub">'+sub+'</p>' if sub else '')+'</header>'
slide('내 하루가 나만의 외국어 교재로.',
 '<div class="cover-copy">'+img('wordmark.webp','Say My Day','wordmark')+'<h1>내 하루가<br>나만의 외국어 교재로.</h1><p class="lead">일기를 쓰면, 그 이야기로<br>외국어를 듣고 말하고 복습합니다.</p><button class="primary" data-go="3">어떤 앱인지 보기 '+icon('next')+'</button><span class="cover-role">Say My Day · PO 프로젝트</span></div><div class="cover-art"><div class="diary-sheet"><span class="sheet-date">오늘의 이야기</span><p>오늘 친구와 우동을 먹었다.<br>내일은 이 이야기를<br>외국어로 말해 보고 싶다.</p><div class="ruled-lines"></div></div>'+img('bird.webp','일기장과 펜을 든 작은 새','cover-bird')+'</div>',
 ['Say My Day는 내가 쓴 일기를 나만의 외국어 교재로 바꾸는 웹앱입니다.','번역문을 얻는 데서 끝나지 않고, 그 문장을 듣고 말하고 다시 익히도록 만들었습니다.','먼저 어떤 불편에서 시작했는지 짧게 말씀드리겠습니다.'],'cover',chapter='내 이야기가 학습이 되기까지')
slide('번역은 끝났는데, 내 말은 되지 않았다.',
 heading('번역은 끝났는데,<br>내 말은 되지 않았다.','자기 하루를 외국어로 말하고 싶은 초급 학습자에게 필요한 것은 무엇일까요?')+
 '<div class="problem-scene"><blockquote>“오늘 친구와 우동을 먹었다.”</blockquote><div class="translation-example"><span>번역문은 얻었습니다.</span><p lang="zh">今天和朋友吃了乌冬面。</p></div><div class="question-reveal"><button class="text-button" data-question aria-expanded="false">그다음은? '+icon('next')+'</button><p hidden>어떻게 읽지? · 이 단어는 무슨 뜻이지? · 내일도 말할 수 있을까?</p></div></div><div class="quiet-foot">사용 장면을 설명하기 위한 예시 · 문제의 출발점은 제작자 본인이 쓰며 모은 요구입니다.</div>',
 ['예를 들어 오늘 친구와 우동을 먹었다는 말을 번역했다고 해 보겠습니다.','번역문을 받아도 읽는 법과 단어 뜻, 다시 익히는 과정은 따로 필요합니다.','그래서 번역 다음에 이어질 학습 과정을 앱 안에 연결하려 했습니다.'],'problem',chapter='문제와 서비스')
journey=[]
for label,headline,desc,filename in [
 ('쓴다','오늘 있었던 일부터.','모국어로 한 줄이라도 쓰면 학습 재료가 됩니다.','03-write.png'),
 ('배운다','내 문장이라서, 처음부터 아는 이야기.','발음을 보며 듣고 말하고, 단어와 문법을 익힙니다.','04-learn-sentence.png'),
 ('쌓는다','지난 일기가 다시 배울 교재가 됩니다.','일기책을 다시 펼치고, 저장한 단어를 복습합니다.','09-hist.png')]:
 journey.append((label,'<div class="journey-panel"><div class="journey-copy"><h3>'+headline+'</h3><p>'+desc+'</p><div class="small-rule"></div><span class="language-note">한국어 → 중국어 · 한국어 → 일본어 · 중국어 → 일본어</span></div>'+shot(filename,label+' 화면')+'</div>'))
slide('쓰고, 배우고, 쌓는 하나의 흐름.',
 heading('쓰고, 배우고, 쌓는<br>하나의 흐름.')+group(journey,'journey','앱의 사용 흐름'),
 ['쓰는 재료는 내가 겪은 하루입니다. 한국어나 중국어로 쓴 이야기를 배우는 언어로 옮깁니다.','문장을 듣고 말하고, 그 안의 단어와 문법을 익힌 뒤 일기 전체를 읽습니다.','그 기록은 일기책과 복습 재료로 남습니다.'],'journey-slide',source='README.md',chapter='문제와 서비스')
chapters=[
 ('쓰기',6.2,22.7666666667,'오늘의 이야기를 기록합니다.','모국어로 쓴 일기가 학습 재료로 바뀝니다.'),
 ('학습',22.7666666667,83.2333333333,'내 문장을 듣고 따라 말합니다.','발음·단어·문법을 확인하고 일기 전체를 읽습니다.'),
 ('기록과 복습',83.2333333333,125.9,'배운 하루가 기록으로 남습니다.','새의 성장, 지난 일기, 저장한 단어의 복습으로 이어집니다.'),
 ('PDF',134.5,147.8,'기록을 PDF로 간직합니다.','정상 생성된 단어장과 일기책 PDF를 확인합니다.')]
video='<div class="demo-layout"><div class="demo-info"><h2>직접 보면,<br>더 간단합니다.</h2><p id="scene-title">'+chapters[0][3]+'</p><div class="scene-buttons">'+''.join(f'<button data-scene="{i}" aria-pressed="{str(i==0).lower()}"><span>{e(a)}</span>{icon("play")}</button>' for i,(a,_,__,___,____) in enumerate(chapters))+'</div><p class="demo-caption" id="scene-caption">'+chapters[0][4]+'</p><button class="text-button" data-full-video>전체 영상 재생</button><p class="video-fallback">시연 영상: 제출물 참고</p></div><div class="demo-player"><video id="demo-video" controls playsinline preload="metadata" poster="../images/03-write.png"><source src="demo-edited.mp4" type="video/mp4">시연 영상: 제출물 참고</video><button class="video-expand" data-video-expand>'+icon('expand')+' 크게 보기</button></div></div>'
slide('직접 보면, 더 간단합니다.',video,
 ['실제 사용 영상입니다. 쓰기, 학습, 기록과 복습, PDF 중 필요한 장면을 바로 보실 수 있습니다.','학습 장면에는 실제 문장 발음이 포함되어 있습니다.','전체 흐름이 필요하면 전체 영상 재생으로 보겠습니다.'],'cinema',chapter='실제 사용')
priority='<div class="priority-path"><span>내 이야기 쓰기</span>'+icon('next')+'<strong>내 문장으로 학습</strong>'+icon('next')+'<span>오늘의 학습 마무리</span></div>'
prior_panels=[
 ('먼저 만든 것','<div class="scope-detail">'+p('<strong>내 이야기가 학습이 되는가?</strong>','쓰기·번역에서 듣고 말하기, 단어, 전체 읽기, 마무리까지.','기능 수보다 한 번의 학습이 끝까지 이어지는 것을 우선했습니다.')+'</div>'),
 ('뒤로 미룬 것','<div class="scope-detail">'+p('<strong>핵심 흐름을 흐리지 않도록.</strong>','정밀 발음 평가·꾸미기·가리고 말하기는 보류했습니다.','마이크는 기본으로 끄고, 마이크 없이도 학습하게 했습니다.')+'</div>')]
slide('기능보다, 끝낼 수 있는 학습을 먼저.',
 heading('기능보다,<br>끝낼 수 있는 학습을 먼저.')+priority+group(prior_panels,'scope','기능 우선순위')+'<div class="decision-line">PO의 기준 <strong>“이 기능이 있어야 내 일기가 학습이 되는가?”</strong></div>',
 ['우선순위의 기준은 내 일기가 학습이 되는가였습니다.','쓰기와 번역을 넘어 듣고 말하고, 단어를 익혀 한 번의 학습을 마무리하도록 먼저 연결했습니다.','정밀 평가나 꾸미기는 뒤로 미루고, 기기 제약이 있는 마이크 없이도 흐름을 끝낼 수 있게 했습니다.'],'priority',source='T38·T44 설계 문서 · README.md',chapter='PO의 선택')
slide('모두 보여 줄까, 하나씩 안내할까.',
 '<div class="focus-copy"><h2>모두 보여 줄까,<br>하나씩 안내할까.</h2><p class="lead">긴 결과 목록을<br>한 번에 한 가지 하는 카드로.</p><div class="focus-toggle" data-focus-toggle><button aria-pressed="false" data-focus="before">이전 화면</button><button aria-pressed="true" data-focus="after">현재 화면</button></div><p class="focus-explain" id="focus-explain">다음 행동을 화면이 안내합니다.<br>설명은 필요할 때 더 볼 수 있습니다.</p><div class="cost-note">감수한 것 <strong>카드를 넘기는 조작은 늘어납니다.</strong></div></div><div class="focus-visual"><figure data-focus-picture="before" hidden>'+shot('20-before-first.png','이전 · 긴 결과 목록')+'</figure><figure data-focus-picture="after">'+shot('04-learn-sentence.png','현재 · 문장 중심 카드')+'</figure><div class="focus-label"><span id="focus-state">한 번에 한 가지</span><span>집중을 위한 설계 선택</span></div></div>',
 ['한 화면에 모든 결과를 이어 보여 주면 학습자가 다음 행동을 골라야 했습니다.','그래서 한 번에 한 가지 하는 카드로 바꾸고, 필요한 설명은 펼쳐 보게 했습니다.','다만 카드가 나뉜 만큼 넘기는 조작은 늘어납니다. 이 비용도 함께 확인했습니다.'],'focus-slide',source='T44 학습 흐름 제안 · compare.stepsToFinish',chapter='PO의 선택')
slide('매일의 기록이, 다시 돌아올 이유가 되도록.',
 heading('매일의 기록이,<br>다시 돌아올 이유가 되도록.')+
 '<div class="return-layout"><div class="return-copy">'+p('<strong>일기책에는 나의 이야기가,</strong>','<strong>작은 새에는 학습한 날이 쌓입니다.</strong>','쉬어도 누적한 학습 일수는 줄지 않습니다.')+'<div class="return-choice" data-return><button aria-pressed="true">쌓이는 기록</button><button aria-pressed="false">끊기지 않는 흐름</button></div><div class="return-detail"><p data-return-copy>지난 일기를 다시 펼치고,<br>저장한 단어로 다음 학습을 이어갑니다.</p><p data-return-copy hidden>학습 중 닫아도 자리를 기억하고,<br>번역이 실패해도 쓴 일기는 남깁니다.</p></div><span class="hypothesis">설계 의도 · 재방문 효과는 아직 검증 전입니다.</span></div><div class="return-shots">'+shot('10-book-cover.png','나의 일기책')+shot('08-stats.png','오늘의 학습과 성장')+'</div></div>',
 ['매일 다시 올 이유를 벌칙이나 연속 기록 손실 대신 내가 쌓은 것으로 보여 주려 했습니다.','일기책에는 이야기가 쌓이고, 새는 누적 학습 일수를 따라 자랍니다.','이것이 실제 재방문으로 이어지는지는 아직 확인해야 할 가설입니다.'],'return-slide',source='T38 사용 여정 계획 · stability.md',chapter='PO의 선택')

before_steps=float(Decimal(str(statistics.mean(C['stepsToFinish']['before_swipes']))).quantize(Decimal('0.1'),rounding=ROUND_HALF_UP))
after_steps=statistics.mean(C['stepsToFinish']['after_taps'])
def bars(label,unit,before,after,maximum,note=''):
 return '<div class="measure"><h3>'+label+'</h3>'+''.join(f'<div class="bar-row {cls}"><span>{name}</span><div class="bar-track"><i style="--fill:{v/maximum*100:.3f}%"></i></div><b>{v:g}<small>{unit}</small></b></div>' for name,cls,v in [('이전','before',before),('현재','after',after)])+'<p class="measure-note">'+note+'</p></div>'
measure=bars('한 화면에서 보이는 선택지','개',25.9,13.2,25.9,'선택할 것을 줄이려 한 설계가 화면 수치로 드러났습니다.')
measure+=bars('끝까지 보는 조작 횟수','회',before_steps,after_steps,after_steps,'이전: 화면 스와이프 / 현재: 카드 넘기기 탭 · 서로 다른 행동입니다.')
slide('선택지는 줄었고, 넘기는 횟수는 늘었습니다.',
 heading('선택지는 줄었고,<br>넘기는 횟수는 늘었습니다.')+'<div class="metrics-layout"><div class="measures">'+measure+'</div><div class="metric-reading">'+p('<strong>좋아진 수치만 고르지 않았습니다.</strong>','한 번에 보이는 선택지는 줄었지만,<br>카드를 넘기는 비용은 늘었습니다.','실제로 더 배우기 쉬워졌는지는<br>사람과 확인해야 합니다.')+'<button class="text-button" data-evidence="3">단어와 길이 측정도 보기 '+icon('next')+'</button></div></div><div class="quiet-foot">사람 없이 잰 화면 지표 · 동일한 입력 4건 · 사용자 관찰과 학습 효과 검증은 아직 진행하지 않았습니다.</div>',
 ['같은 일기 결과를 이전과 현재 버전에서 같은 코드로 측정했습니다.','한 화면에서 보이는 선택지는 줄었지만 끝까지 보는 조작 횟수는 늘었습니다.','이 수치만으로 학습이 쉬워졌다고 결론내릴 수는 없습니다. 다음에는 실제 사용 과정을 확인해야 합니다.'],'metrics-slide',source='metrics.json / compare.visibleChoices · stepsToFinish',chapter='검증과 한계')
prompt_stories=[
 ('기준','v0.1','먼저, 답이 지킬 경계부터.','일기에 없는 사실을 더하지 않고<br>쉬운 말로 번역하게 했습니다.','자연스러운 문장과 학습용 설명의 기준을 정했습니다.'),
 ('읽기','v0.2','길면 읽기 어렵고,<br>이유가 없으면 배우기 어렵습니다.','긴 문장을 나누고<br>단어를 고른 이유를 붙였습니다.','읽고 소리 내어 말할 수 있는 단위로 만들려 했습니다.'),
 ('뜻','v0.3','예문의 뜻을 몰라<br>다시 번역하지 않도록.','단어·문법·활용 예문에<br>한국어 뜻을 함께 넣었습니다.','학습자가 뜻을 확인하는 과정까지 연결했습니다.'),
 ('감수','v0.4','AI가 만든 답을<br>다른 관점으로 다시 확인했습니다.','원문 변형·어감 누락·발음 오류를 찾아<br>원문 보존과 규칙·교정 표로 보완했습니다.','AI의 설명을 곧바로 정답으로 받아들이지 않았습니다.'),
 ('연결','v0.5','단어를 눌러 배우려면,<br>답의 구조부터 달라야 했습니다.','문장을 단어 단위로 나누고,<br>모호한 부분에 문장 번호를 붙였습니다.','프롬프트도 화면에서 하려는 행동에 맞춰 바꿨습니다.')]
prompt_html='<div class="prompt-timeline" data-prompt>'+''.join(f'<button data-prompt-step="{i}" aria-pressed="{str(i==4).lower()}"><span>{a}</span><small>{v}</small></button>' for i,(a,v,_,__,___) in enumerate(prompt_stories))+'</div>'
prompt_html+='<div class="prompt-stories">'+''.join(f'<article data-prompt-story="{i}" {"" if i==4 else "hidden"}><h3>{headline}</h3><div class="prompt-change"><span>바꾼 것</span><p>{detail}</p></div><p class="prompt-reason">{reason}</p></article>' for i,(_,__,headline,detail,reason) in enumerate(prompt_stories))+'</div>'
slide('앱 속 AI도, 학습을 위해 답하도록.',
 heading('앱 속 AI도,<br>학습을 위해 답하도록.','프롬프트는 AI가 번역과 설명을 어떻게 만들지 정해 주는 지시입니다.')+prompt_html+'<button class="source-on-dark" data-evidence="0">버전별 기록 원문 보기 '+icon('next')+'</button>',
 ['여기서 말하는 AI는 앱 안에서 번역과 학습 설명을 만드는 AI입니다.','읽기 어려운 길이, 예문의 뜻, 원문과 어감의 보존을 차례로 다듬었습니다.','마지막에는 단어를 누르면 뜻을 보는 학습 행동에 맞게 AI 응답의 구조를 바꿨습니다.'],'prompt-slide dark',source='프롬프트.md §1·2',chapter='AI와 만든 과정')
work_panels=[
 ('한 번에 한 작업','<div class="work-proof"><h3>큰 주문 대신,<br>끝낼 수 있는 작업 카드.</h3><p>완료 기준 → 시험 → 기록 → 로컬 변경 기록</p><blockquote>“이 학습 부분 설계를 심도있게 검토해서 제안해줘.<br>이게 이 앱의 핵심이야.”</blockquote></div>'),
 ('프로젝트 규칙','<div class="work-proof"><h3>CLAUDE.md에<br>작업의 경계를 남겼습니다.</h3><p>실제 데이터는 건드리지 않기 · 키는 출력·커밋하지 않기</p><p>분리한 환경에서 시험하기 · 푸시는 사용자 승인 뒤에</p></div>'),
 ('디자인 스킬','<div class="work-proof"><h3>같은 기준을,<br>반복해서 적용했습니다.</h3><p>/say-my-day-design · 확정 디자인 기준을 적용</p><p>contrast-check · 밝고 어두운 화면의 글자 대비를 점검</p></div>')]
slide('AI가 만들고, 사람이 결정했다.',
 heading('AI가 만들고,<br>사람이 결정했습니다.')+'<div class="work-route"><span>사용자 요구</span>'+icon('next')+'<span>대안 검토</span>'+icon('next')+'<strong>사용자 승인</strong>'+icon('next')+'<span>구현·시험·기록</span></div>'+group(work_panels,'work-group','AI와 일하는 방식'),
 ['이번에는 앱을 개발하는 데 사용한 AI 이야기입니다.','요구를 검토하고 사용자가 방향을 승인하면 한 번에 한 작업을 구현하고 확인했습니다.','반복해서 지켜야 할 규칙은 CLAUDE.md에, 화면과 대비의 기준은 스킬에 담았습니다.'],'work-slide',source='프롬프트.md §3·4',chapter='AI와 만든 과정')
case_data=[
 ('사전 문맥','음식 이야기도 사람 이름으로 번역될까?','사용자가 같은 말이 음식과 별명으로 쓰일 수 있다고 질문했습니다.','“항상 이 이름으로”라는 규칙이 음식 문맥과 충돌했습니다.','문맥 우선 규칙과 이름·표현 종류 선택을 추가했습니다.','반영 표시와 사전 없이 다시 번역하는 길을 남겼습니다.'),
 ('유료 호출','시험이 실제 API 키를 읽고 있었습니다.','사용자가 API 사용량을 물어 확인했습니다.','시험 서버가 실제 키가 든 설정 파일을 읽었습니다.','시험 서버의 키를 빈 값으로 덮어쓰게 했습니다.','시험에서 유료 호출을 하지 않는 규칙을 남겼습니다.'),
 ('데이터','시험 기록이 실제 기록에 섞였습니다.','화면을 확인하다 새 단계가 잘못 올라간 것을 발견했습니다.','가짜 학습일이 실제 동기화 파일에 섞였습니다.','정리 전 파일을 보관하고, 가짜 항목만 제거했습니다.','날짜 형식 검사와 시험 환경 분리 규칙을 추가했습니다.'),
 ('삭제','삭제 확인이 바로 닫혀 버렸습니다.','사용자 신고를 브라우저에서 재현했습니다.','새로 그려진 단추를 “바깥 클릭”으로 잘못 판단했습니다.','화면에 연결된 요소만 바깥 클릭으로 처리했습니다.','같은 문제가 다시 생기지 않도록 삭제 시험을 추가했습니다.'),
 ('마이크','학습 설계가 마이크 상태를 놓쳤습니다.','구현 중 코드에서 마이크가 꺼져 있다는 사실을 확인했습니다.','제안 단계에서 기능의 실제 상태를 놓쳤습니다.','마이크 없이도 진행하는 흐름부터 만들었습니다.','사용자에게 사실을 보고하고 기기 검증의 한계를 남겼습니다.'),
 ('큰 파일','디자인 제작 파일이 변경 기록에 섞였습니다.','배포 전 푸시 크기를 점검하며 발견했습니다.','대용량 디자인 제작 파일이 커밋에 포함됐습니다.','원본을 보존한 별도 복사본에서 기록을 정리했습니다.','해당 제작 폴더를 버전 관리에서 제외했습니다.')]
case_buttons='<div class="case-buttons">'+''.join(f'<button data-case="{i}" aria-pressed="{str(i==1).lower()}">{a}</button>' for i,(a,_,__,___,____,_____) in enumerate(case_data))+'</div>'
case_html='<div class="case-stories">'+''.join('<article data-case-story="'+str(i)+'" '+('' if i==1 else 'hidden')+'><h3>'+headline+'</h3><dl>'+''.join('<div><dt>'+label+'</dt><dd>'+e(t)+'</dd></div>' for label,t in [('발견',found),('원인',cause),('수정',fixed),('다시 막기',rule)])+'</dl></article>' for i,(_,headline,found,cause,fixed,rule) in enumerate(case_data))+'</div>'
slide('실수는, 다음 작업의 규칙이 됐다.',
 heading('실수는,<br>다음 작업의 규칙이 됐습니다.')+case_buttons+case_html+'<button class="text-button case-source" data-evidence="1">실제 사건 기록 보기 '+icon('next')+'</button>',
 ['AI와 만들며 생긴 실수도 발견한 계기와 수정 내용을 기록했습니다.','예를 들어 시험이 실제 유료 키를 읽은 사건은 시험 환경의 키를 비우는 규칙으로 이어졌습니다.','잘 만드는 것과 함께, 잘못된 일이 반복되지 않게 하는 장치도 남겼습니다.'],'case-slide',source='프롬프트.md §5 · 실제 기록을 쉬운 말로 재구성',chapter='AI와 만든 과정')
slide('내일의 한 줄이, 오늘보다 쉬워지도록.',
 '<div class="closing-copy">'+img('wordmark.webp','Say My Day','closing-mark')+'<h2>내일의 한 줄이,<br>오늘보다 쉬워지도록.</h2><p class="lead">내 이야기를 기록하고,<br>그 이야기를 내 언어로 만들어 갑니다.</p><div class="next-test"><strong>다음에 확인할 것</strong><p>실제 학습자가 끝까지 배우는가?<br>시간과 만족도는 어떠한가?</p><span>단어 리스트 길이·마이크·AI 번역의 한계도 남아 있습니다.</span></div><a class="primary" href="https://chinese-diary.onrender.com" target="_blank" rel="noopener">앱 열어 보기 '+icon('next')+'</a></div>'+img('bird.webp','일기장과 함께하는 작은 새','closing-bird'),
 ['이번에 만든 것은 내 이야기를 번역에서 학습으로 잇는 흐름입니다.','화면 지표는 확인했지만 실제 학습자와 사용성과 학습 효과를 검증하지는 못했습니다.','다음에는 기능을 더하기 전에 끝까지 배우는지, 얼마나 걸리고 어떻게 느끼는지 확인하겠습니다.'],'closing',chapter='회고와 다음 단계')
links=[('직접 사용하기','배포된 앱','https://chinese-diary.onrender.com'),('구현과 실행 방법','GitHub 저장소','https://github.com/kang0712-97/say-my-day'),('AI 활용 원기록','프롬프트.md','../프롬프트.md'),('완성된 시연영상','제출용 MP4','demo-edited.mp4')]
slide('발표의 근거와 제출물.',
 heading('발표의 근거와 제출물.','필요한 자료를 바로 확인할 수 있습니다.')+'<div class="resources"><div class="resource-links">'+''.join(f'<a href="{u}" target="_blank" rel="noopener"><span>{a}</span><strong>{b}</strong>{icon("next")}</a>' for a,b,u in links)+'</div><div class="evidence-index"><h3>질문에 따라 더 살펴보기</h3>'+''.join(f'<button data-evidence="{i}">{label}{icon("next")}</button>' for i,label in enumerate(['프롬프트 변경 원문','AI 실수의 발견과 수정','실패·빈 화면·중간 이탈','화면 지표의 전체 비교']))+'<button data-slide="4">시연영상으로 돌아가기 '+icon('play')+'</button></div></div>',
 ['앱과 저장소, 원기록과 시연영상 링크입니다.','오른쪽에서는 질문에 맞는 상세 근거를 열어볼 수 있습니다.','부록은 발표 중 다 읽기보다 질의응답에서 필요한 부분만 보도록 구성했습니다.'],'appendix',source='README.md · submission 자료',chapter='부록')
def record_browser(entries,cls):
 return '<div class="record-browser '+cls+'" data-records><label>기록 선택 <select aria-label="상세 기록 선택">'+''.join(f'<option value="{i}">{e(a)}</option>' for i,(a,_) in enumerate(entries))+'</select></label>'+''.join(f'<article data-record="{i}" {"" if i==0 else "hidden"}>{b}</article>' for i,(_,b) in enumerate(entries))+'</div>'
prompt_records=record_browser([(v,'<table><tbody><tr><th>바꾼 것</th><td>'+md(change)+'</td></tr><tr><th>왜 바꿨나</th><td>'+md(why)+'</td></tr></tbody></table>') for v,change,why in versions],'prompt-records')
incident_records=record_browser([(event,'<table><tbody><tr><th>무슨 일</th><td>'+md(event)+'</td></tr><tr><th>어떻게 발견했나</th><td>'+md(found)+'</td></tr><tr><th>고친 것</th><td>'+md(fix)+'</td></tr></tbody></table>') for _,event,found,fix in incidents],'incident-records')
exception_records=record_browser([(a,p('<strong>'+a+'</strong>',b)+shot(im,a)) for a,b,im in [('빈 입력','번역 요청 전에 일기를 입력하도록 안내합니다.','11-err-empty.png'),('긴 입력','입력 길이를 제한하고 안내합니다.','12-err-long.png'),('언어 불일치','입력한 언어가 맞는지 확인하도록 안내합니다.','13-err-lang.png'),('서버 오류','입력한 일기는 그대로 남기고 다시 시도할 수 있습니다.','14-err-api.png'),('빈 일기장','일기를 새로 쓰는 다음 행동을 안내합니다.','15-empty-hist.png'),('중간 이탈','닫은 카드 위치를 저장해 이어서 학습합니다.','17-resume.png')]],'exception-records')
metric_records='<table class="all-metrics"><thead><tr><th>지표</th><th>이전</th><th>현재</th><th>범위·읽는 법</th></tr></thead><tbody><tr><th>한 화면 선택지</th><td>25.9개</td><td>13.2개</td><td>동일 입력 4건의 평균</td></tr><tr><th>단어 포함 비율</th><td>38%</td><td>100%</td><td>mock.json 예시 한 건</td></tr><tr><th>단어 포함 비율</th><td>0.21</td><td>1.02</td><td>real_03 · 1을 넘는 집계값은 정의를 더 확인해야 함</td></tr><tr><th>끝까지 보는 조작</th><td>9.3회</td><td>13회</td><td>평균 · 스와이프와 탭</td></tr><tr><th>가장 긴 단위</th><td>7.6~11화면</td><td>1.7~6.2화면</td><td>이전 전체 페이지 / 현재 가장 긴 카드</td></tr></tbody></table><p class="record-caution">단어 분해가 없는 옛 응답은 비율을 계산하지 않았습니다.<br>학습 효과·완주율·사용 시간·만족도·번역 정확도는 측정 전입니다.</p>'
slide('원기록을 확인합니다.',
 heading('원기록을 확인합니다.')+group([('프롬프트',prompt_records),('AI 실수',incident_records),('예외 상황',exception_records),('화면 지표',metric_records)],'records-group','근거 종류'),
 ['본문에서는 판단과 의미를 먼저 설명했고, 여기에는 원문 기록을 남겼습니다.','선택 메뉴로 필요한 프롬프트 버전이나 사건을 골라볼 수 있습니다.','수치의 비교 조건과 아직 측정하지 않은 영역도 함께 표시했습니다.'],'records-slide appendix',source='프롬프트.md · stability.md · metrics.json / compare',chapter='부록')
assert len(S)==14

CSS=(Q/'style.css').read_text();JS=(Q/'runtime.js').read_text()
sections=[]
for i,s in enumerate(S,1):
 sections.append(f'<section class="slide {s["cls"]}" data-title="{e(s["title"])}" data-chapter="{e(s["chapter"])}" aria-label="{i} {e(s["title"])}">{s["body"]}'+('<div class="source">'+e(s['source'])+'</div>' if s['source'] else '')+'<aside class="notes">'+''.join('<p>'+e(n)+'</p>' for n in s['notes'])+'</aside></section>')
runtime_data=json.dumps({'chapters':chapters,'slides':S},ensure_ascii=False).replace('</','<\\/')
chrome='<nav class="nav" aria-label="발표 조작"><button id="previous" aria-label="이전 장">'+icon('prev')+'</button><span class="count" id="count" aria-live="polite"></span><button id="next" aria-label="다음 장">'+icon('next')+'</button><span class="chapter" id="chapter"></span><span class="shortcuts">← → 이동 · N 대본</span><button id="evidence-nav">근거 자료</button><button id="overview">목차</button><button id="notes">대본</button><button id="fullscreen" aria-label="전체 화면">'+icon('expand')+'</button></nav><div class="progress" id="progress"></div>'
dialogs='<dialog id="overview-dialog"><div class="dialog-head"><h2>발표 목차</h2><button data-close aria-label="목차 닫기">'+icon('close')+'</button></div><div id="overview-list" class="overview-grid"></div></dialog><dialog id="zoom-dialog" class="zoom-dialog"><div class="dialog-head"><h2 id="zoom-title">화면 확대</h2><button data-close aria-label="확대 화면 닫기">'+icon('close')+'</button></div><img id="zoom-image" alt=""></dialog><dialog id="video-dialog" class="video-dialog"><div class="dialog-head"><h2>실제 사용 영상</h2><button data-close aria-label="영상 닫기">'+icon('close')+'</button></div><video id="large-video" controls playsinline preload="metadata" src="demo-edited.mp4"></video></dialog><dialog id="notes-dialog" class="notes-dialog"><div class="dialog-head"><h2 id="notes-title">발표 대본</h2><button data-close aria-label="대본 닫기">'+icon('close')+'</button></div><div id="notes-content"></div></dialog>'
comment='''새 발표 구성: 12장 본문 + 2장 부록. 기존 발표.html과 기존 자료는 수정하지 않음.
원본 데이터: submission/metrics.json / compare
선택지 25.9 → 13.2: compare.visibleChoices.before_avg_of_4 / after_avg_of_4
조작 9.3 → 13: mean(compare.stepsToFinish.before_swipes)=9.25, 소수 첫째 자리 일반 반올림 / mean(after_taps)=13
단어 포함 38% → 100%: compare.wordCoverage.before["mock.json"] / after["mock.json"] ×100 (예시 한 건)
real_03 0.21 → 1.02: compare.wordCoverage.before["real_03"] / after["real_03"]; 1 초과 집계의 정의 확인 필요 표기
가장 긴 단위 7.6~11 → 1.7~6.2: min/max(compare.longestUnit.before_whole_page / after_tallest_card)
입력 4건: len(compare.visibleChoices.per_input.before)
프롬프트 버전 및 실제 사건의 원문 숫자는 비교 통계가 아닌 원기록 식별자·조건.
사용자 관찰·사용성·학습 효과·재방문 효과를 검증했다고 주장하지 않음.
표지와 문제의 일기 문장은 발표를 위한 설명용 예시. 측정 데이터나 실제 사용자 발언이 아님.
본문의 판단·원인 설명은 기록에 근거한 발표용 서사이며 부록에서 원기록을 별도 제공.
영상은 기존 편집본 demo-edited.mp4 사용. 구간 재생은 HTML 재생 시점만 제어하며 원본 수정 없음.
'''
out='<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Say My Day — 내 하루가 나만의 외국어 교재로</title><style>'+CSS+'</style></head><body><main class="viewport"><div class="stage" id="stage">'+''.join(sections)+'</div></main>'+chrome+dialogs+'<script type="application/json" id="presentation-data">'+runtime_data+'</script><script>'+JS+'</script></body></html>\n<!--\n'+comment+'\n-->\n'
file=D/'발표_리디자인.html'
file.write_text(out)
used=sorted(set(re.findall(r'src="\.\./images/([^"]+)"',out)))
for n in used:assert (R/'submission/images'/n).is_file(),n
manifest={'file':str(file),'mainSlides':12,'appendixSlides':2,'images':used,'video':'demo-edited.mp4','sources':['README.md','submission/프롬프트.md','submission/metrics.json','submission/stability.md','design/tasks/T38_journey_redesign_plan.md','design/tasks/T44_learning_flow_proposal.md'],'structure':[s['title'] for s in S]}
(Q/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps(manifest,ensure_ascii=False,indent=2))



