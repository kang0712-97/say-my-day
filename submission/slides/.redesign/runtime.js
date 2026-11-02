(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const slides=$$('.slide'),stage=$('#stage'),viewport=$('.viewport');
let current=0,endAt=null,motionTimer;
const data=JSON.parse($('#presentation-data').textContent);
const player=$('#demo-video'),largePlayer=$('#large-video');
function fit(){if(innerWidth<=760){stage.style.transform='';stage.style.margin='';return}const r=viewport.getBoundingClientRect(),k=Math.min(r.width/1600,r.height/900);stage.style.transform='scale('+k+')';stage.style.margin=((900*k-900)/2)+'px '+((1600*k-1600)/2)+'px';}
function pauseVideos(){$$('video').forEach(v=>v.pause())}
function fillNotes(){const a=$('aside.notes',slides[current]);$('#notes-content').innerHTML=a?.innerHTML||'';$('#notes-title').textContent=slides[current].dataset.title;}
function go(n){current=Math.max(0,Math.min(slides.length-1,n-1));pauseVideos();clearTimeout(motionTimer);slides.forEach((s,i)=>{s.classList.toggle('active',i===current);s.classList.remove('entering');s.inert=i!==current;s.setAttribute('aria-hidden',i!==current)});const active=slides[current];active.classList.add('entering');motionTimer=setTimeout(()=>active.classList.remove('entering'),420);$('#count').textContent=(current+1)+' / '+slides.length;$('#chapter').textContent=active.dataset.chapter;$('#progress').style.width=((current+1)/slides.length*100)+'%';$('#previous').disabled=current===0;$('#next').disabled=current===slides.length-1;$$('#overview-list button').forEach((b,i)=>b.setAttribute('aria-current',i===current));viewport.scrollTop=0;fillNotes();history.replaceState(null,'','#'+(current+1));}
function selectGroup(g,n){const bs=Array.from($('.switches',g).children),ps=Array.from($('.panels',g).children);bs.forEach((b,i)=>{b.setAttribute('aria-selected',i===n);b.tabIndex=i===n?0:-1});ps.forEach((p,i)=>p.hidden=i!==n);}
$$('[data-group]').forEach(g=>{const bs=Array.from($('.switches',g).children);bs.forEach((b,i)=>{b.onclick=()=>selectGroup(g,i);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopPropagation();const n=(i+(e.key==='ArrowRight'?1:-1)+bs.length)%bs.length;selectGroup(g,n);bs[n].focus()}}})});
$('[data-question]').onclick=()=>{const b=$('[data-question]'),on=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',on);b.nextElementSibling.hidden=!on;};
$$('[data-focus]').forEach(b=>b.onclick=()=>{const after=b.dataset.focus==='after';$$('[data-focus]').forEach(x=>x.setAttribute('aria-pressed',x===b));$$('[data-focus-picture]').forEach(x=>x.hidden=x.dataset.focusPicture!==b.dataset.focus);$('#focus-explain').innerHTML=after?'다음 행동을 화면이 안내합니다.<br>설명은 필요할 때 더 볼 수 있습니다.':'문장·단어·문법을 긴 목록으로 이어 보여 줬습니다.<br>다음에 할 일을 학습자가 골라야 했습니다.';$('#focus-state').textContent=after?'한 번에 한 가지':'한 페이지에 모두';});
$$('[data-return] button').forEach((b,i)=>b.onclick=()=>{$$('[data-return] button').forEach((x,j)=>x.setAttribute('aria-pressed',i===j));$$('[data-return-copy]').forEach((x,j)=>x.hidden=i!==j);});
$$('[data-prompt-step]').forEach((b,i)=>b.onclick=()=>{$$('[data-prompt-step]').forEach((x,j)=>x.setAttribute('aria-pressed',i===j));$$('[data-prompt-story]').forEach((x,j)=>x.hidden=i!==j);});
$$('[data-case]').forEach((b,i)=>b.onclick=()=>{$$('[data-case]').forEach((x,j)=>x.setAttribute('aria-pressed',i===j));$$('[data-case-story]').forEach((x,j)=>x.hidden=i!==j);});
$$('[data-records]').forEach(r=>$('select',r).onchange=()=>{$$('[data-record]',r).forEach((x,i)=>x.hidden=i!==Number($('select',r).value))});
$$('[data-evidence]').forEach(b=>b.onclick=()=>{go(14);selectGroup($('.records-group'),Number(b.dataset.evidence));});
$$('[data-go],[data-slide]').forEach(b=>b.onclick=()=>go(Number(b.dataset.go||b.dataset.slide)));
function sceneText(i){$('#scene-title').textContent=data.chapters[i][3];$('#scene-caption').textContent=data.chapters[i][4];$$('[data-scene]').forEach((b,j)=>b.setAttribute('aria-pressed',i===j));}
async function playFrom(start,end){endAt=end;const run=async()=>{player.currentTime=start;try{await player.play()}catch(e){$('#scene-caption').textContent='화면의 재생 버튼을 눌러 주세요.'}};if(player.readyState)await run();else player.addEventListener('loadedmetadata',run,{once:true});}
$$('[data-scene]').forEach((b,i)=>b.onclick=()=>{sceneText(i);const a=data.chapters[i];playFrom(a[1],a[2])});
$('[data-full-video]').onclick=()=>{endAt=null;$('#scene-title').textContent='쓰기부터 PDF까지, 전체 흐름';$('#scene-caption').textContent='필요한 장면은 위 버튼으로 바로 볼 수 있습니다.';$$('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',false));playFrom(0,null);};
[player,largePlayer].forEach(v=>v.addEventListener('timeupdate',()=>{if(endAt!==null&&v.currentTime>=endAt){v.pause();v.currentTime=endAt}}));
player.addEventListener('loadedmetadata',()=>{if(!player.currentTime)player.currentTime=6.2},{once:true});
$('[data-video-expand]').onclick=async()=>{const t=player.currentTime;player.pause();$('#video-dialog').showModal();const run=async()=>{largePlayer.currentTime=t;try{await largePlayer.play()}catch(e){}};if(largePlayer.readyState)await run();else largePlayer.addEventListener('loadedmetadata',run,{once:true});};
$('#video-dialog').addEventListener('close',()=>{largePlayer.pause();if(player.readyState)player.currentTime=largePlayer.currentTime;});
$$('[data-zoom]').forEach(b=>b.onclick=()=>{const s=$('img',b),z=$('#zoom-image');z.src=s.src;z.alt=s.alt;z.className=s.naturalHeight>s.naturalWidth*1.5?'portrait':'';$('#zoom-title').textContent=s.alt;$('#zoom-dialog').showModal();$('#zoom-dialog').scrollTop=0;});
$$('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
slides.forEach((s,i)=>{const b=document.createElement('button');b.textContent=(i<12?(i+1)+'. ':'부록 · ')+s.dataset.title;b.onclick=()=>{$('#overview-dialog').close();go(i+1)};$('#overview-list').append(b);});
$('#previous').onclick=()=>go(current);$('#next').onclick=()=>go(current+2);$('#overview').onclick=()=>$('#overview-dialog').showModal();
function notes(){pauseVideos();fillNotes();$('#notes-dialog').showModal();}
$('#notes').onclick=notes;
$('#evidence-nav').onclick=()=>go(13);
function fullscreen(){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.().catch(()=>{})}
$('#fullscreen').onclick=fullscreen;
stage.addEventListener('click',e=>{if(!e.target.closest('button,a,input,select,video,table,figure,dl,aside')&&innerWidth>760)go(current+2)});
addEventListener('keydown',e=>{const k=e.key;if(k==='Escape'){$$('dialog[open]').forEach(d=>d.close());return}if($('dialog[open]'))return;if(e.target.closest('input,select,textarea'))return;if(k.toLowerCase()==='n'){e.preventDefault();notes();return}if(k.toLowerCase()==='g'){e.preventDefault();$('#overview-dialog').showModal();return}if(k.toLowerCase()==='f'){e.preventDefault();fullscreen();return}if(e.target.closest('video'))return;if(['ArrowRight','PageDown','ArrowLeft','PageUp','Home','End'].includes(k)){e.preventDefault();if(k==='Home')go(1);else if(k==='End')go(slides.length);else go(current+(['ArrowRight','PageDown'].includes(k)?2:0))}else if(k===' '&&!e.target.closest('button,a')){e.preventDefault();go(current+2)}});
addEventListener('resize',fit);addEventListener('hashchange',()=>{const n=Number(location.hash.slice(1));if(n>=1&&n<=slides.length)go(n)});
const n=Number(location.hash.slice(1));go(n>=1&&n<=slides.length?n:1);fit();
window.presentation={go,selectGroup,count:slides.length};
})();

