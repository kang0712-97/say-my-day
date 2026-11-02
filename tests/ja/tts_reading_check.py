import wave, array, math, subprocess, urllib.parse, urllib.request
T='/private/tmp/claude-501/trydata/'
def env(text, voice='ja-JP-NanamiNeural'):
    q=urllib.parse.urlencode(dict(text=text, voice=voice, rate='1'))
    open(T+'r.mp3','wb').write(urllib.request.urlopen('http://localhost:3002/api/tts?'+q).read())
    subprocess.run(['afconvert','-f','WAVE','-d','LEI16@16000',T+'r.mp3',T+'r.wav'],check=True)
    w=wave.open(T+'r.wav'); a=array.array('h'); a.frombytes(w.readframes(w.getnframes())); st=160
    e=[math.sqrt(sum(x*x for x in a[i:i+st])/st) for i in range(0,len(a)-st,st)]
    on=next(i for i,x in enumerate(e) if x>.08*max(e)); off=len(e)-next(i for i,x in enumerate(reversed(e)) if x>.08*max(e))
    return e[on:off]
def dist(a,b): # 간단한 DTW(거리가 작을수록 비슷한 발음)
    n,m=len(a),len(b); INF=1e18; D=[[INF]*(m+1) for _ in range(n+1)]; D[0][0]=0
    ma=max(a+b)
    for i in range(1,n+1):
        for j in range(max(1,i-30),min(m,i+30)+1):
            c=abs(a[i-1]-b[j-1])/ma; D[i][j]=c+min(D[i-1][j],D[i][j-1],D[i-1][j-1])
    return D[n][m]/(n+m)
CASES=[('今日は友達と{}に行った。','市場','いちば','しじょう'),('{}前に買った靴','二日','ふつか','ににち'),('{}で映画を見た。','一人','ひとり','いちにん'),('{}ほど待った。','十分','じゅっぷん','じゅうぶん'),('{}の友達が来た。','日本人','にほんじん','にっぽんじん'),('{}は静かだ。','大人','おとな','だいじん')]
CASES+=[('{}は雨だった。','今日','きょう','こんにち'),('{}に会おう。','明日','あした','みょうにち'),('{}の朝は寒い。','今朝','けさ','こんちょう'),('{}を食べた。','大人気','だいにんき','おおにんき'),('{}がとても上手だ。','上手','じょうず','うわて'),('{}に行く。','何人','なんにん','なにじん'),('{}の仕事。','人気','にんき','ひとけ'),('{}の生物を見た。','生物','せいぶつ','なまもの'),('{}へ行った。','東京','とうきょう','ひがしきょう'),('{}に住んでいる。','下町','したまち','げまち')]
for tpl,k,a,b in CASES:
    ek=env(tpl.format(k)); ea=env(tpl.format(a)); eb=env(tpl.format(b))
    da,db=dist(ek,ea),dist(ek,eb)
    print('%-6s 길이 %.2fs | 「%s」와의 거리 %.3f  「%s」와의 거리 %.3f → %s'%(k,len(ek)/100,a,da,b,db,'「'+(a if da<db else b)+'」에 가까움'))

# 바꾼 글(spoken)과 원문의 차이: 화면이 보내는 글이 いちば 쪽 소리인지 확인
print('--- 바꾼 글 확인 (화면은 市場→いちば로 보냄) ---')
base='今日は友達と{}に行った。'
eo=env(base.format('市場')); es=env(base.format('いちば')); ew=env(base.format('しじょう'))
print('원문 市場: いちば와 거리 %.3f, しじょう와 거리 %.3f'%(dist(eo,es),dist(eo,ew)))
print('바꾼 글 いちば: いちば와 거리 %.3f, しじょう와 거리 %.3f'%(dist(es,es),dist(es,ew)))
