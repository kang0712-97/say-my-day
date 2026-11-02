import wave, json, array, math, subprocess, urllib.parse, urllib.request, sys
T='/private/tmp/claude-501/trydata/'
def get(path, **q):
    return urllib.request.urlopen('http://localhost:3002'+path+'?'+urllib.parse.urlencode(q)).read()
def measure(text, voice):
    q=dict(text=text, voice=voice, rate='0.9')
    open(T+'m.mp3','wb').write(get('/api/tts', **q)); b=json.loads(get('/api/tts-timing', **q))['bounds']
    subprocess.run(['afconvert','-f','WAVE','-d','LEI16@16000',T+'m.mp3',T+'m.wav'],check=True)
    w=wave.open(T+'m.wav'); a=array.array('h'); a.frombytes(w.readframes(w.getnframes())); sr=w.getframerate()
    st=int(sr*.01); env=[math.sqrt(sum(x*x for x in a[i:i+st])/st) for i in range(0,len(a)-st,st)]; mx=max(env)
    on=next(i for i,e in enumerate(env) if e>.08*mx)*10
    off=len(env)-next(i for i,e in enumerate(reversed(env)) if e>.08*mx)
    return on-b[0]['o'], off*10-(b[-1]['o']+b[-1]['d'])
S={'ja-JP-NanamiNeural':['今日は友達と市場に行きました。','一人で映画を見に行きました。','来月の三日に東京へ行きます。','最近、仕事が忙しくて疲れています。','風邪をひいたので、病院に行きました。','水を飲んで、少し休みました。'],
   'zh-CN-XiaoxiaoNeural':['今天天气很好。','我昨天和朋友去了市场。','最近工作很忙，我有点累。']}
for v,ts in S.items():
    print(v)
    for t in ts:
        a,b=measure(t,v); print('  시작 어긋남 %+5dms / 끝 어긋남 %+5dms  %s'%(a,b,t))
