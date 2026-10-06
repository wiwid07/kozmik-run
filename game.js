/* KOZMIK RUN v1.9 beta — geekz · temporada hallogeekz · pack gótico 32-bit
   Canvas 900×500. Mecánica original intacta: mantener = subir, soltar = bajar,
   práctica 7 s ilimitada, 3 carreras reales por día, kozmits ✦, localStorage.
   v1.9: idle de frente (pixel art, respira/parpadea) en menú, escoba voladora pixel-art en carrera, cometa que nace de la escoba,
         recorrido al azar en cada carrera (semilla nueva por carrera; ?test puede fijarla).
   v1.8.1: auras rojo/azul, más monedas, speed metal, animación del jugador.
   v1.8.2: música por acto (tempo fijo + melodía propia), game over con sting triste, animación con capa/orejas, aún más monedas.
   v1.8.3: banda sonora distinta por acto (16 compases A/B, tempo fijo que sube por acto), luna pixel-art nítida en todos los actos,
           obstáculos con más brillo (espada con destellos), sin parpadeo de pantalla al apretar «vuela».
   v1.8.4: cometa morado (cada 50 objetos: 9 s invencible, rompe obstáculos, imán; look 64-bit procedural) y
           cadenas de habilidad generadas simulando la física real del jugador (100 % recogibles, sin obstáculos encima). */
(()=>{
'use strict';
/* BETA: vidas infinitas para probar avance. poner false antes de lanzar. */
const BETA=true;
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),W=900,H=500;
ctx.imageSmoothingEnabled=false;if('imageSmoothingQuality' in ctx)ctx.imageSmoothingQuality='low';
const FLOOR_H=64; // franja de piedra de castillo inferior
const $=s=>document.querySelector(s);
const dateKey=()=>new Date().toLocaleDateString('en-CA');

/* ---------- guardado (misma clave que el prototipo original) ---------- */
const KEY='kozmicRun';
const blank=()=>({day:dateKey(),lives:3,wallet:0,best:0,runs:0});
let data;
try{data=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('kozmikRun')||'null')}catch(e){}
if(!data||data.day!==dateKey())data={...blank(),wallet:data?.wallet||0,best:data?.best||0,skin:data?.skin};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}};
save();

/* ---------- arte ---------- */
const IMG={};
const load=(k,src)=>{const i=new Image();i.onload=()=>i._ok=true;i.onerror=()=>i._ok=false;i.src=src;IMG[k]=i};
/* v1.8: objetos del pack gótico 32-bit → masN = coleccionables (N ✦) · menosN = obstáculos (tamaño ∝ N) */
const MAS_FILES=['mas1','mas2','mas3','mas4','mas6a','mas6b','mas6c','mas7','mas8'];
const MENOS_FILES=['menos0','menos1a','menos1b','menos1c','menos2','menos3','menos4a','menos4b','menos4c','menos5','menos6'];
[['gz01','gz01.png'],['player','player_front.png'],['moon32','moon_32bit.png'],
 ['catSit','cat_sit.png'],['catWitch','cat_witch.png'],['catCauldron','cat_cauldron.png'],['catBat','cat_bat.png'],
 ...MAS_FILES.map(k=>[k,k+'.png']),...MENOS_FILES.map(k=>[k,k+'.png']),
 ['bgTree','bg_tree.png'],['bgLantern','bg_lantern.png'],['bgFog','bg_fog.png'],['bgCemTile','bg_cem_tile.png'],
 ['bgFencePix','bg_fence_pix.png'],['bgTombPix','bg_tomb_pix.png'],['bgMoonbeam','bg_moonbeam.png'],
 ['bgLava','bg_lava_tile.png'],['bgCrack','bg_crack.png'],['bgPillar','bg_pillar.png'],['bgVoidGlow','bg_void_glow.png'],
 ['bgForestTile','bg_forest_tile.png'],['bgBatFar','bg_bat_far.png'],['bgVine','bg_vine_hang.png'],['bgWindow','bg_window.png'],['bgShard','bg_void_shard.png'],['bgCastleFloor','bg_castle_floor.png'],
 ['bgPanBosque','bg_pan_bosque.png'],['bgPanCementerio','bg_pan_cementerio.png'],['bgPanInfierno','bg_pan_infierno.png'],['bgPanOscuridad','bg_pan_oscuridad.png']].forEach(([k,f])=>load(k,'assets/'+f));
const ok=k=>IMG[k]&&IMG[k]._ok&&IMG[k].naturalWidth>0;
const CATS_GROUND=['catSit','catWitch','catCauldron'];
/* sprites grandes reducidos en pantalla: se dibujan con suavizado (los fondos SNES siguen pixelados).
   v1.8: los objetos 32-bit vienen a ~3× del tamaño en juego → suavizado alto para que el pixel art no "parpadee" */
const STICKER=new Set(['player','gz01','catSit','catWitch','catCauldron','catBat',...MAS_FILES,...MENOS_FILES]);
/* v1.8: 3 personajes de perfil (miran a la derecha = dirección de carrera), pack gótico 32-bit. sin escoba. */
const SKINS=[
  ['brujo','brujo',{trail:['#9a5cff','#ffd46a','#c4a0ff','#ffffff','#b386ff'],idle:['#7a5cff','#9a5cff']}],
  ['vampiro','vampiro',{trail:['#ff3b4a','#ff6b7a','#1a0508','#ffd0d4','#8b0000'],idle:['#8b0000','#ff3b4a']}],
  ['hombre-lobo','hombre lobo',{trail:['#c8c0b0','#ffb347','#8a8478','#fff4d8','#6a5f52'],idle:['#8a8478','#ffb347']}]
];
SKINS.forEach(([k])=>{load('skin_'+k,'assets/skin_'+k+'.png');STICKER.add('skin_'+k)});
/* v1.9: arte de FRENTE por personaje (hoja de 8 cuadros pixel art 1×: 4 de respiración + los mismos 4 con parpadeo)
   y escoba voladora pixel-art 32-bit (4 cuadros de paja que flamea, PNG a 2×) */
const FRONT_FRAMES=8,FRONT_SC=2;
SKINS.forEach(([k])=>load('front_'+k,'assets/front_'+k+'.png'));
load('broom32','assets/broom_32bit.png');
const DEFAULT_SKIN='brujo';
if(!SKINS.some(([k])=>k===data.skin)){data.skin=DEFAULT_SKIN;save()}
function skinTrail(){const s=SKINS.find(([k])=>k===data.skin);return s?s[2]:SKINS[0][2]}
// dibuja centrado en (x,y) con alto h; devuelve false si la imagen no está
function sprite(k,x,y,h,rot=0,sx=1,sy=1,alpha=1){
  if(!ok(k))return false;const im=IMG[k],w=h*im.naturalWidth/im.naturalHeight;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);if(rot)ctx.rotate(rot);if(sx!==1||sy!==1)ctx.scale(sx,sy);
  if(STICKER.has(k)){ctx.imageSmoothingEnabled=true;if('imageSmoothingQuality' in ctx)ctx.imageSmoothingQuality='high'}
  const pc=POLISH[k]&&polished(k);
  if(pc){const sc=h/im.naturalHeight,P=pc._pad*sc,src=sheenFrame(k,pc)||pc;ctx.drawImage(src,-w/2-P,-h/2-P,w+2*P,h+2*P)}
  else ctx.drawImage(im,-w/2,-h/2,w,h);
  ctx.restore();return true;
}
/* v1.8.3: obstáculos con más brillo/contraste para despegar del fondo oscuro (se mantiene el aura roja):
   contorno claro fino + contraste (overlay) + brillo (screen) + bisel de luz arriba-izquierda; espada y relicario con
   destello que recorre la hoja. todo con composición de canvas (sin leer píxeles → funciona también en file://). */
const POLISH={
  menos2:{b:.5,c:.55,rim:.75,bev:.55,sheen:1},   // espada: acero brillante
  menos6:{b:.32,c:.45,rim:.6,bev:.4,sheen:1},    // relicario
  menos4a:{b:.26,c:.4,rim:.5,bev:.4},menos4b:{b:.26,c:.4,rim:.5,bev:.4},menos4c:{b:.26,c:.4,rim:.5,bev:.4}, // tumbas
  menos1a:{b:.34,c:.3,rim:.42,bev:.3},menos1b:{b:.34,c:.3,rim:.42,bev:.3},menos1c:{b:.34,c:.3,rim:.42,bev:.3} // enredaderas
};
const polCache={},sheenCache={};let sheenPh=0;
function polished(k){
  if(polCache[k])return polCache[k];
  const im=IMG[k],P=POLISH[k],pad=8,w=im.naturalWidth,h=im.naturalHeight;
  const mk=()=>{const c=document.createElement('canvas');c.width=w+pad*2;c.height=h+pad*2;return c};
  const sil=mk(),sg=sil.getContext('2d');sg.drawImage(im,pad,pad);sg.globalCompositeOperation='source-in';sg.fillStyle='#fff0f2';sg.fillRect(0,0,sil.width,sil.height);
  const c=mk(),g=c.getContext('2d');
  g.globalAlpha=P.rim*.42; // contorno claro (dilatado ~5 px de origen ≈ 1–1.5 px en pantalla)
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;g.drawImage(sil,Math.cos(a)*5,Math.sin(a)*5)}
  g.globalAlpha=1;g.drawImage(im,pad,pad);
  g.globalCompositeOperation='overlay';g.globalAlpha=P.c;g.drawImage(im,pad,pad); // + contraste
  g.globalCompositeOperation='screen';g.globalAlpha=P.b;g.drawImage(im,pad,pad);  // + brillo
  // bisel: franja de luz en los bordes de arriba-izquierda
  const ed=mk(),eg=ed.getContext('2d');eg.drawImage(sil,0,0);eg.globalCompositeOperation='destination-out';eg.drawImage(im,pad+6,pad+6);
  g.globalCompositeOperation='lighter';g.globalAlpha=P.bev;g.drawImage(ed,0,0);
  g.globalCompositeOperation='source-over';g.globalAlpha=1;
  c._pad=pad;return polCache[k]=c;
}
const SHEEN_N=14;
function sheenFrame(k,pc){
  if(!POLISH[k].sheen)return null;
  const cyc=(t*.55+sheenPh*.13)%1;if(cyc>.34)return null; // destello ~0.6 s cada ~1.8 s
  const i=Math.min(SHEEN_N-1,Math.floor(cyc/.34*SHEEN_N)),key=k+i;
  if(sheenCache[key])return sheenCache[key];
  const c=document.createElement('canvas');c.width=pc.width;c.height=pc.height;const g=c.getContext('2d');
  g.drawImage(pc,0,0);
  const L=c.width+c.height,pos=-c.width+(i/(SHEEN_N-1))*L,gr=g.createLinearGradient(pos,0,pos+c.width*.9,c.width*.9);
  gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.45,'rgba(255,255,255,.0)');gr.addColorStop(.5,'rgba(255,255,255,.85)');gr.addColorStop(.56,'rgba(255,250,235,.0)');gr.addColorStop(1,'rgba(255,255,255,0)');
  g.globalCompositeOperation='source-atop';g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);
  return sheenCache[key]=c;
}
// destello de 4 puntas (pixel-art) — brillo en guarda/punta de la espada y gema del relicario
function glint(x,y,s,a){
  if(a<.02)return;ctx.save();ctx.globalAlpha*=Math.min(1,a);ctx.globalCompositeOperation='lighter';ctx.fillStyle='#fffbe8';
  const X=Math.round(x),Y=Math.round(y),r=Math.max(2,Math.round(s));
  ctx.fillRect(X-r,Y-1,r*2,2);ctx.fillRect(X-1,Y-r,2,r*2);ctx.fillStyle='#ffffff';ctx.fillRect(X-2,Y-2,4,4);
  ctx.globalAlpha*=.45;ctx.fillRect(X-Math.round(r*.5),Y-Math.round(r*.5),Math.round(r),Math.round(r));ctx.restore();
}
function glow(x,y,r,color,a=.5){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.save();ctx.globalAlpha=a;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore()}
function starPath(r1,r2,n=5){ctx.beginPath();for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,r=i%2?r2:r1;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath()}

/* ---------- sonido (Web Audio, sin archivos) ----------
   v1.8.2: tempo/intensidad POR ACTO (no sube con la velocidad); fill de batería + platillo al cambiar de acto; game over = sting triste + tema lento.
   v1.8.3: cada acto es una canción PROPIA de 16 compases (A+B): tonalidad, progresión, riff, melodía e instrumentos distintos.
     bosque la dórico 140 · cementerio re menor armónica 152 · infierno mi frigio/disminuido 164 · oscuridad si menor 176.
     el tempo solo sube al cambiar de acto (nunca con la velocidad). cambio de acto = fundido de colas + platillo. */
const Sound=(()=>{
  let ac=null,master,music,sfx,song=null,delay=null,delayFb=null,leadSend=null,noiseBuf,jetGain,timer=null,next=0,step=0;
  let mode='menu',act=0,pendingAct=0,overAt=0,overStep=0,rendering=false,cometLayer=false;
  let muted=false;try{muted=localStorage.getItem('kozmicRunMute')==='1'}catch(e){}
  let musicVol=1,sfxVol=.85;
  try{const mv=localStorage.getItem('kozmicRunMusicVol');if(mv!=null)musicVol=Math.max(0,Math.min(1,+mv))}catch(e){}
  try{const sv=localStorage.getItem('kozmicRunSfxVol');if(sv!=null)sfxVol=Math.max(0,Math.min(1,+sv))}catch(e){}
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  function applyBus(){
    if(!ac)return;
    master.gain.setTargetAtTime(muted?0:.95,ac.currentTime,.03);
    music.gain.setTargetAtTime(musicVol,ac.currentTime,.05);
    sfx.gain.setTargetAtTime(sfxVol,ac.currentTime,.05);
  }
  // cada "canción" va en su propio bus → se puede cortar en seco (game over / reinicio) sin colas
  function newSong(fade=.06,drive=2.4){
    if(!ac)return;
    if(song){const o=song;o.gain.setTargetAtTime(0,ac.currentTime,fade);setTimeout(()=>{try{o.disconnect()}catch(e){}},2500)}
    song=ac.createGain();song.gain.value=1;song.connect(music);
    leadSend=ac.createGain();leadSend.gain.value=1;leadSend.connect(delay);song._send=leadSend;
    // v1.8.3: distorsión suave por canción para las guitarras rítmicas (más "drive" en infierno/oscuridad)
    const ws=ac.createWaveShaper(),n=1024,cv=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;cv[i]=Math.tanh(drive*x)/Math.tanh(drive)}
    ws.curve=cv;ws.oversample='2x';const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=75;
    const cab=ac.createBiquadFilter();cab.type='lowpass';cab.frequency.value=3600;cab.Q.value=.7;const out=ac.createGain();out.gain.value=.5;
    ws.connect(hp);hp.connect(cab);cab.connect(out);out.connect(song);song._dist=ws;
  }
  function init(){
    if(ac){if(ac.state==='suspended')ac.resume();return}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    ac=new AC();
    buildGraph(muted?0:.95,musicVol,sfxVol);
    // "jet" suave mientras se mantiene el impulso
    const n=ac.createBufferSource();n.buffer=noiseBuf;n.loop=true;const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1100;bp.Q.value=.8;
    jetGain=ac.createGain();jetGain.gain.value=0;n.connect(bp);bp.connect(jetGain);jetGain.connect(sfx);n.start();
    next=ac.currentTime+.1;timer=setInterval(schedule,25);
  }
  function buildGraph(mg,mv,sv){
    const comp=ac.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3.5;comp.connect(ac.destination);
    master=ac.createGain();master.gain.value=mg;master.connect(comp);
    music=ac.createGain();music.gain.value=0;music.connect(master);music.gain.setTargetAtTime(mv,ac.currentTime,.5);
    sfx=ac.createGain();sfx.gain.value=sv;sfx.connect(master);
    // eco de la guitarra líder (corchea con puntillo, sigue el bpm del acto)
    delay=ac.createDelay(1.5);delayFb=ac.createGain();delayFb.gain.value=.28;
    const dOut=ac.createGain();dOut.gain.value=.32;const dLp=ac.createBiquadFilter();dLp.type='lowpass';dLp.frequency.value=2400;
    delay.connect(dLp);dLp.connect(delayFb);delayFb.connect(delay);dLp.connect(dOut);dOut.connect(music);
    song=null;newSong(.06,mode==='play'?ACTS[act].drive:2.4);setDelayFor(mode==='play'?ACTS[act].bpm:MENU_BPM);
    noiseBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    return comp;
  }
  // herramienta de prueba (headless, sin altavoces): renderiza un acto offline y devuelve niveles de la mezcla
  async function renderTest(ai=0,secs=8,wav=false,comet=false){
    rendering=true;const keep={ac,master,music,sfx,song,delay,delayFb,leadSend,noiseBuf,next,step,mode,act,pendingAct,cometLayer};cometLayer=comet;
    const oc=new OfflineAudioContext(2,Math.ceil(44100*secs),44100);ac=oc;
    mode=ai<0?'menu':'play';act=pendingAct=Math.max(0,ai);buildGraph(.95,1,.85);
    if(ai>=0){newSong(.01,ACTS[act].drive);setDelayFor(ACTS[act].bpm)}
    step=0;next=.05;scheduleTo(secs-.4);
    const buf=await oc.startRendering();
    ({ac,master,music,sfx,song,delay,delayFb,leadSend,noiseBuf,next,step,mode,act,pendingAct,cometLayer}=keep);rendering=false;
    const d=buf.getChannelData(0);let pk=0,sq=0,clip=0;for(let i=0;i<d.length;i++){const v=Math.abs(d[i]);if(v>pk)pk=v;sq+=v*v;if(v>.99)clip++}
    const r={peak:+pk.toFixed(3),rms:+Math.sqrt(sq/d.length).toFixed(4),clip};
    if(wav){const n=d.length,b=new DataView(new ArrayBuffer(44+n*2)),w=(o,str)=>{for(let i=0;i<str.length;i++)b.setUint8(o+i,str.charCodeAt(i))};
      w(0,'RIFF');b.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');b.setUint32(16,16,true);b.setUint16(20,1,true);b.setUint16(22,1,true);b.setUint32(24,44100,true);b.setUint32(28,88200,true);b.setUint16(32,2,true);b.setUint16(34,16,true);w(36,'data');b.setUint32(40,n*2,true);
      for(let i=0;i<n;i++)b.setInt16(44+i*2,Math.max(-1,Math.min(1,d[i]))*32767,true);
      let bin='';const u=new Uint8Array(b.buffer);for(let i=0;i<u.length;i+=32768)bin+=String.fromCharCode.apply(null,u.subarray(i,i+32768));r.wav=btoa(bin)}
    return r;
  }
  function setDelayFor(bpm){if(delay)delay.delayTime.setTargetAtTime(Math.min(1.4,60/bpm*.75),ac.currentTime,.05)}
  function env(g,t,vol,a,dur){g.gain.value=0;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+dur)}
  function tone(type,f0,f1,dur,vol,delayS=0,dest=sfx,cut=0){
    if(!ac)return;const t=ac.currentTime+delayS,o=ac.createOscillator(),g=ac.createGain();o.type=type;
    o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    env(g,t,vol,.006,dur);let node=o;
    if(cut){const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=cut;o.connect(f);node=f}
    node.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.05);
  }
  function noise(dur,vol,type,f0,f1,delayS=0,dest=sfx){
    if(!ac)return;const t=ac.currentTime+delayS,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
    s.buffer=noiseBuf;f.type=type;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+dur);
    env(g,t,vol,.004,dur);s.connect(f);f.connect(g);g.connect(dest);s.start(t,Math.random()*.5);s.stop(t+dur+.05);
  }
  // guitarra líder: saw + square desafinado, sustain con vibrato en notas largas, envío al eco
  function lead(m,when,dur,vol,cut=3000,soft=false){
    if(!ac||!song)return;const t=ac.currentTime+when,f=mtof(m);
    const g=ac.createGain(),lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=cut;lp.Q.value=soft?.7:2.2;
    g.gain.value=0;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.01);
    g.gain.setValueAtTime(vol*.82,t+Math.max(.02,dur*.7));g.gain.exponentialRampToValueAtTime(0.0001,t+dur+.04);
    const o1=ac.createOscillator(),o2=ac.createOscillator();
    o1.type=soft?'triangle':'sawtooth';o2.type=soft?'sine':'square';
    o1.frequency.value=f;o2.frequency.value=f*1.005;
    if(dur>.2){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=5.6;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.013,t+Math.min(.25,dur*.5));
      l.connect(lg);lg.connect(o1.frequency);lg.connect(o2.frequency);l.start(t);l.stop(t+dur+.06)}
    o1.connect(lp);o2.connect(lp);lp.connect(g);g.connect(song);if(song._send)g.connect(song._send);
    o1.start(t);o2.start(t);o1.stop(t+dur+.06);o2.stop(t+dur+.06);
  }
  // melodías v1.8.2 (menú): número = nota (midi), "." = sostener, "-" = silencio · semicorcheas
  function parseMel(str){
    const a=str.trim().split(/\s+/).map(x=>x==='.'?0:x==='-'?-1:+x),len=a.map(()=>0);
    for(let i=0;i<a.length;i++)if(a[i]>0){let j=i+1;while(j<a.length&&a[j]===0)j++;len[i]=j-i}
    return{n:a,len};
  }
  /* v1.8.3: notación por CORCHEAS con nombres de nota: "a4" nota · "." sostener · "-" silencio · "a4:b4" = 2 semicorcheas.
     16 compases (A = 1–8, B = 9–16) → 256 semicorcheas por canción. */
  const NN={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
  function nm(x){const r=/^([a-g])(#|b)?(\d)$/.exec(x);if(!r)return x==='.'?0:x==='-'?-1:+x;return 12*(+r[3]+1)+NN[r[1]]+(r[2]==='#'?1:r[2]==='b'?-1:0)}
  function parseMel8(str){
    const a=[];
    for(const tk of str.replace(/\|/g,' ').trim().split(/\s+/)){
      if(tk.includes(':')){const[x,y]=tk.split(':');a.push(nm(x),nm(y))}
      else if(tk==='.')a.push(0,0);else if(tk==='-')a.push(-1,0);else a.push(nm(tk),0);
    }
    const len=a.map(()=>0);
    for(let i=0;i<a.length;i++)if(a[i]>0){let j=i+1;while(j<a.length&&a[j]===0)j++;len[i]=j-i}
    return{n:a,len};
  }
  const Q={m:[0,3,7],M:[0,4,7],d:[0,3,6]};
  const parseChords=str=>str.replace(/\|/g,' ').trim().split(/\s+/).map(tk=>{const r=/^([a-g][#b]?\d)([mMd])$/.exec(tk);return{r:nm(r[1]),q:Q[r[2]]}});
  // tercera diatónica bajo la nota (dúo de guitarras) dentro de la escala dada
  function third(m,set){if(!set.has(m%12))return m-4;let k=m;for(let c=0;c<2;){k--;if(set.has(((k%12)+12)%12))c++}return k}
  // acorde → notas dentro de un registro [lo, lo+12)
  const voice=(ch,lo)=>ch.q.map(iv=>{let n=ch.r+iv;while(n<lo)n+=12;while(n>=lo+12)n-=12;return n});

  /* ---------- instrumentos ---------- */
  // guitarra rítmica: quinta (raíz + 5ª + octava grave) → distorsión del bus de la canción
  function gtr(r,when,dur,vol,cut,open){
    if(!ac||!song)return;const t=ac.currentTime+when,g=ac.createGain(),lp=ac.createBiquadFilter();
    lp.type='lowpass';lp.frequency.value=cut;lp.Q.value=open?.8:1.4;
    g.gain.value=0;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    const vs=[[r,'sawtooth',1],[r+7,'sawtooth',.75],[r-12,'square',.42]];if(open)vs.push([r+12,'sawtooth',.38]);
    for(const[m,ty,v]of vs){const o=ac.createOscillator(),og=ac.createGain();o.type=ty;o.frequency.value=mtof(m);o.detune.value=(Math.random()-.5)*10;og.gain.value=v;o.connect(og);og.connect(lp);o.start(t);o.stop(t+dur+.05)}
    lp.connect(g);g.connect(song._dist||song);
  }
  function bass(m,when,dur,vol,cut=320){tone('square',mtof(m),0,dur,vol,when,song,cut);tone('sine',mtof(m),0,dur,vol*.8,when,song)}
  const vib=(t,dur,cents,param,rate=5.6,delay=.16)=>{if(dur<.22)return;const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=rate;
    lg.gain.setValueAtTime(0,t);lg.gain.setValueAtTime(0,t+delay);lg.gain.linearRampToValueAtTime(cents,t+Math.min(dur,delay+.2));l.connect(lg);param.forEach(p=>lg.connect(p));l.start(t);l.stop(t+dur+.1)};
  // flauta/whistle celta (bosque): seno + triángulo, "corte" ornamental en notas largas, soplo de aire
  function whistle(m,when,dur,vol){
    if(!ac||!song)return;const t=ac.currentTime+when,f=mtof(m),g=ac.createGain(),o1=ac.createOscillator(),o2=ac.createOscillator(),g2=ac.createGain();
    o1.type='sine';o2.type='triangle';g2.gain.value=.28;
    if(dur>.3){o1.frequency.setValueAtTime(f*1.1225,t);o1.frequency.setValueAtTime(f,t+.04);o2.frequency.setValueAtTime(f*2.245,t);o2.frequency.setValueAtTime(f*2,t+.04)}
    else{o1.frequency.value=f;o2.frequency.value=f*2}
    vib(t,dur,16,[o1.detune,o2.detune],5.8,.14);
    g.gain.value=0;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.018);g.gain.setValueAtTime(vol*.88,t+Math.max(.03,dur*.75));g.gain.exponentialRampToValueAtTime(0.0001,t+dur+.06);
    o1.connect(g);o2.connect(g2);g2.connect(g);g.connect(song);if(song._send)g.connect(song._send);
    o1.start(t);o2.start(t);o1.stop(t+dur+.1);o2.stop(t+dur+.1);
    noise(.05,vol*.18,'bandpass',f*1.6,f*1.2,when,song);
  }
  // pulsado tipo bouzouki/arpa (arpegio folk del bosque)
  const pluck=(m,when,vol)=>{tone('triangle',mtof(m),0,.32,vol,when,song,2400);tone('square',mtof(m),0,.08,vol*.25,when,song,1800)};
  // órgano de iglesia (cementerio): sinusoides 8'+4'+2' + 16' + algo de lengüeta, trémolo lento
  function organ(m,when,dur,vol){
    if(!ac||!song)return;const t=ac.currentTime+when,g=ac.createGain(),lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;
    g.gain.value=0;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+.07);g.gain.setValueAtTime(vol,t+dur);g.gain.linearRampToValueAtTime(0.0001,t+dur+.22);
    const tr=ac.createOscillator(),tg=ac.createGain();tr.frequency.value=5.2;tg.gain.value=vol*.14;tr.connect(tg);tg.connect(g.gain);tr.start(t);tr.stop(t+dur+.3);
    for(const[k,ty,v]of[[1,'sine',1],[2,'sine',.55],[4,'sine',.2],[.5,'sine',.4],[1,'square',.1]]){const o=ac.createOscillator(),og=ac.createGain();o.type=ty;o.frequency.value=mtof(m)*k;og.gain.value=v;o.connect(og);og.connect(lp);o.start(t);o.stop(t+dur+.3)}
    lp.connect(g);g.connect(song);
  }
  // coro "aah" (formantes) — cementerio B y clímax de oscuridad
  function choir(m,when,dur,vol){
    if(!ac||!song)return;const t=ac.currentTime+when,f=mtof(m),g=ac.createGain(),mix=ac.createGain();mix.gain.value=1;
    g.gain.value=0;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+.28);g.gain.setValueAtTime(vol,t+dur);g.gain.linearRampToValueAtTime(0.0001,t+dur+.35);
    for(const[fr,q,v]of[[760,5,1],[1180,6,.7],[2600,8,.25]]){const b=ac.createBiquadFilter();b.type='bandpass';b.frequency.value=fr;b.Q.value=q;const bg=ac.createGain();bg.gain.value=v*2.2;mix.connect(b);b.connect(bg);bg.connect(g)}
    const os=[];for(const d of[-9,0,8]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=d;o.connect(mix);os.push(o)}
    vib(t,dur,14,os.map(o=>o.detune),5,.3);
    os.forEach(o=>{o.start(t);o.stop(t+dur+.4)});g.connect(song);
  }
  // cuerdas sintéticas (oscuridad): sierras desafinadas filtradas
  function strings(m,when,dur,vol){
    if(!ac||!song)return;const t=ac.currentTime+when,g=ac.createGain(),lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1700;lp.Q.value=.6;
    g.gain.value=0;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+.14);g.gain.setValueAtTime(vol,t+dur);g.gain.linearRampToValueAtTime(0.0001,t+dur+.3);
    for(const d of[-11,4,13]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=d;o.connect(lp);o.start(t);o.stop(t+dur+.35)}
    lp.connect(g);g.connect(song);
  }
  // campana tubular (toque fúnebre del cementerio)
  function bell(m,when,vol){
    if(!ac||!song)return;const t=ac.currentTime+when,f=mtof(m);
    for(const[k,v,d]of[[1,1,3.2],[2,.5,2.4],[2.76,.45,1.8],[5.4,.22,1],[8.93,.1,.6]]){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f*k;
      g.gain.value=0;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol*v,t+.006);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(song);if(song._send&&k<3)g.connect(song._send);o.start(t);o.stop(t+d+.05)}
  }
  const ride=(when,v)=>{noise(.16,v,'highpass',5200,4200,when,song);tone('square',2900,0,.05,v*.12,when,song,6000)};
  const china=(when,v=.07)=>noise(.42,v,'bandpass',3600,2200,when,song);
  const tamb=(when,v)=>{noise(.045,v,'highpass',8500,0,when,song)};
  function fill(s,when){snare(when,.06+(s-8)*.014);if(s%2===0)tom(when,220-(s-8)*14,.13)} // redoble hacia el acto siguiente

  /* ---------- las 4 canciones (v1.8.3: composiciones distintas, tempo fijo que SUBE por acto) ---------- */
  const ACTS=[
  /* BOSQUE — la dórico (6ª mayor celta), 140 bpm, galope. aventura misteriosa: whistle celta + arpegio folk en A,
     guitarra líder con dúo en B (la menor natural, cadencia con mi mayor). */
  {name:'bosque',bpm:140,drive:2.2,set:new Set([9,11,0,2,4,5,7]),
   chords:parseChords('a2m g2M d3M a2m c3M g2M d3M e2m | f2M c3M g2M a2m f2M g2M e2m e2M'),
   mel:parseMel8(`e5 . a5 . g5:f#5 e5 d5 e5 | d5 . b4 . g4 . a4:b4 d5 | f#5 . a5 . f#5 e5 d5 . | e5 . . . c5:d5 e5 a4 . |
                  g5 . e5 . c5 . e5:f#5 g5 | a5 . g5:f#5 e5 d5 . b4 d5 | f#5:g5 a5 f#5 d5 e5:f#5 d5 b4 a4 | b4 . . . - . e5:d5 b4 |
                  c5 . a4 . f4 . a4 c5 | e5 . d5 c5 g4 . e4 g4 | d5 . b4 . g4 a4 b4 d5 | c5 . b4 a4 e5 . . . |
                  a4 . c5 . f5 . e5:d5 c5 | d5 . g5 . b5 . a5:g5 f#5 | g5 . e5 . b4 . e5 g5 | g#5 . . . f#5:e5 d5 c5 b4`),
   drums(s,bar,when,S16){
     if(s%4!==1)kick(when,s%4===0?.28:.2);               // galope 1-2-3 en el bombo
     if(s===4||s===12)snare(when,.16);
     if(s%2===0)hat(when,s%4===0?.03:.022);
     if(s%4===2)tamb(when,.022);                          // pandero folk
     if(s===0&&bar%8===0)cymbal(when,.08);
     if((bar===7||bar===15)&&s>=12)tom(when,200-(s-12)*22,.12);
   },
   rhythm(s,bar,ch,when,S16){
     const B=bar>=8;
     if(s===0)gtr(ch.r,when,S16*3.6,.13,1300,true);
     else if(B&&s===8)gtr(ch.r,when,S16*3.4,.11,1200,true);
     else if(s%4!==1)gtr(ch.r,when,S16*.8,.1,640,false); // galope muteado
     if(s%2===0)bass(ch.r-12,when,S16*1.6,.05);
     if(!B&&s%2===0){const v=voice(ch,57),arp=[0,1,2,1,2,1,0,1];pluck(v[arp[(s/2)|0]%v.length]+12,when,.026)} // arpegio misterioso
   },
   voice(m,when,dur,bar,k){
     if(bar<8){whistle(m,when,dur,.088);if(bar>=4)whistle(m-12,when,dur,.03)}
     else{lead(m,when,dur,.082,2500);lead(third(m,this.set),when,dur,.045,2100);if(bar>=12)whistle(m+12,when,dur,.03)}
   }},
  /* CEMENTERIO — re menor armónica, 152 bpm. gótico/inquietante: órgano de iglesia + campana fúnebre,
     coro "aah" en B, guitarra neoclásica con pedal y arpegio disminuido (do# sensible). */
  {name:'cementerio',bpm:152,drive:2.6,set:new Set([2,4,5,7,9,10,1]),
   chords:parseChords('d3m a#2M g2m a2M d3m a#2M g2m a2M | g2m d3m a#2M a2M g2m d3m c#3d a2M'),
   mel:parseMel8(`a4 . d5 . f5 . e5:d5 c#5 | d5 . . . bb4 . f4 . | g4 . bb4 . d5 . g5 . | a5 . g5:f5 e5 c#5 . a4 . |
                  a4 . d5 . f5 . a5 . | bb5 . a5 . f5 . d5 . | g5 . f5:e5 d5 bb4 . g4 bb4 | c#5 . . . e5 . a5 . |
                  g5:d5 bb4:d5 g5:d5 bb4:d5 a5:d5 c6:d5 bb5 . | a5:d5 f5:d5 a5:d5 f5:d5 d6 . a5 . | f5:d5 bb4:d5 f5:d5 bb4:d5 g5 f5 d5 bb4 | c#5 . e5 . a5 . c#6 . |
                  d6 . bb5:a5 g5 bb5 . d5 . | f5 . e5:f5 a5 d6 . . . | e6 . c#6 . bb5 . g5 . | a5 . . . c#5:d5 e5 f5:e5 c#5`),
   drums(s,bar,when,S16){
     if(s%2===0)kick(when,.26);if(s===15)kick(when,.18);
     if(s===4||s===12)snare(when,.16);
     if(s%4===0)ride(when,s===0?.05:.035);else if(s%2===0)hat(when,.02);
     if(s===0&&(bar===0||bar===8))cymbal(when,.1);
   },
   rhythm(s,bar,ch,when,S16){
     if(s===0||s===6||s===10)gtr(ch.r,when,S16*2.2,.115,1250,true);   // acentos sincopados
     else if(s%2===0)gtr(ch.r,when,S16*.85,.085,560,false);            // chug a corcheas
     if(s%4===0)bass(ch.r-12,when,S16*3.6,.055);
   },
   pad(s,bar,ch,when,S16){
     if(s!==0)return;const D=S16*16*.97;
     voice(ch,57).forEach(n=>organ(n,when,D,.016));organ(ch.r-12,when,D,.014);
     if(bar>=8)voice(ch,64).forEach(n=>choir(n,when,D,.03));
     if(bar===0||bar===4)bell(62,when,.09);if(bar===8)bell(50,when,.1);
   },
   voice(m,when,dur,bar,k){
     lead(m,when,dur,.08,2500);
     if(bar>=4)lead(third(m,this.set),when,dur,bar>=8?.046:.032,2100);
   }},
  /* INFIERNO — mi frigio + disminuido, 164 bpm. agresivo/pesado: riff con b2 (fa) y tritono (si bemol),
     doble bombo a semicorcheas, china, solista áspera a octavas (A) y en terceras menores (B). */
  {name:'infierno',bpm:164,drive:4.2,set:new Set([4,5,7,9,11,0,2]),
   chords:parseChords('e2m e2m e2m e2m e2m e2m e2m e2m | f2M e2m f2M g2M a#2M a2m f2M e2m'),
   riff:[[0,0,1,0, 0,0,3,0, 0,0,1,0, 6,5,3,1],[0,0,1,0, 0,0,3,0, 0,0,1,0, 3,3,1,1]],
   mel:parseMel8(`e5 . f5 . e5 . b4 c5 | b4 . g4 . bb4 . a4:g4 f4 | e5 . f5 . g5 . f5:e5 f5 | e5 . . . - . e4:g4 bb4:c#5 |
                  e5:g5 bb5:g5 e5:g5 bb5:g5 c#6 . bb5 . | a5 . g5 . f5 . e5 . | e5:f5 g5:f5 e5:f5 g5:a5 bb5 . a5:g5 f5 | e5 . . . f5 . e5 . |
                  a5 . c6 . a5 . f5 . | g#5 . b5 . e6 . d6:c6 b5 | c6 . a5 . f5 . c5 . | d6 . b5 . g5 . f5 g5 |
                  bb5 . f5 . d5 . f5 bb5 | a5 . e5 . c6 . b5:a5 g5 | f5:a5 c6:a5 f5:a5 c6:a5 f6 . e6:d6 c6 | b5 . bb5 . g5 . f5 .`),
   drums(s,bar,when,S16){
     kick(when,s%2?.17:.25);                                // doble bombo continuo
     if(s===4||s===12)snare(when,.19);
     if(s%4===0)noise(.05,.035,'highpass',4500,5500,when,song);
     if(s===0&&(bar>=8||bar%2===0))china(when,.075);
     if(bar===15&&s>=8&&s%2===0)tom(when,190-(s-8)*16,.14);
   },
   rhythm(s,bar,ch,when,S16){
     if(bar<8){const off=this.riff[bar%2][s],r=40+off;
       if(off===0)gtr(r,when,S16*.75,.1,560,false);else gtr(r,when,S16*1.5,.12,1350,true);
       bass(r-12,when,S16*.9,.055,260);
     }else{const acc=s===0||s===3||s===6||s===10||s===12;
       gtr(ch.r,when,acc?S16*1.4:S16*.7,acc?.12:.095,acc?1300:560,acc);if(s%2===0)bass(ch.r-12,when,S16*1.6,.055,260)}
   },
   voice(m,when,dur,bar,k){
     lead(m,when,dur,.084,2900);
     if(bar<8)lead(m-12,when,dur,.042,1800);else lead(m-3,when,dur,.048,2300); // octavas → terceras menores (color disminuido)
   }},
  /* OSCURIDAD — si menor (armónica), 176 bpm. frenético/climático: blast beat, guitarras trémolo a semicorcheas,
     colchón de cuerdas, coro en el clímax, napolitano (do mayor) antes del fa# final. solista dramática en dúo + octava. */
  {name:'oscuridad',bpm:176,drive:3.4,set:new Set([11,1,2,4,6,7,9]),cset:new Set([0,2,4,5,7,9,11]),
   chords:parseChords('b2m g2M d3M a2M b2m g2M e2m f#2M | g2M a2M b2m b2m e2m c3M f#2M f#2M'),
   mel:parseMel8(`f#5 . . . b5 . . . | a5 . g5 . f#5 . e5:f#5 g5 | f#5 . . . d5 . a4 . | c#5 . e5 . a5 . g5:f#5 e5 |
                  d5 . f#5 . b5 . d6 . | e6 . d6 . b5 . g5 . | g5 . f#5 e5 b5 . g5:f#5 e5 | a#5 . . . c#6 . f#5 . |
                  b5:a5 g5:a5 b5 . d6 . b5 . | c#6:b5 a5:b5 c#6 . e6 . c#6 . | d6 . . . c#6:d6 e6 f#6 . | f#6:e6 d6:c#6 b5:a5 f#5:e5 d5 . f#5 . |
                  g5 . b5 . e6 . d6 . | e6 . . . c6 . g5 . | f#5:g5 a#5:c#6 f#5:g5 a#5:c#6 e6 . c#6 . | a#5 . . . . . c#6:a#5 f#5`),
   drums(s,bar,when,S16){
     if(bar===15){ // arranque final: redoble creciente
       if(s%4===0)kick(when,.28);snare(when,.05+s*.008);if(s===0)cymbal(when,.1);return}
     if(s%2===0)kick(when,.24);else snare(when,s===5||s===13?.12:.07); // blast beat
     if(s%4===0)ride(when,.04);
     if(s===0&&bar>=8)cymbal(when,.085);
     if(bar>=12&&s%4===0&&s)china(when,.05);
   },
   rhythm(s,bar,ch,when,S16){
     if(bar===15){const hit=[0,3,6,8,10,12,13,14,15].includes(s);if(hit)gtr(ch.r,when,S16*.95,.12,1400,true);if(s%2===0)bass(ch.r-12,when,S16,.055);return}
     gtr(ch.r,when,S16*.9,s%4===0?.105:.078,s%4===0?1500:1100,s%4===0); // trémolo
     if(s%2===0)bass(ch.r-12,when,S16*1.7,.055,300);
   },
   pad(s,bar,ch,when,S16){
     if(s!==0)return;const D=S16*16*.97;
     voice(ch,59).forEach(n=>strings(n,when,D,.022));
     if(bar>=12)voice(ch,66).forEach(n=>choir(n,when,D,.028));
   },
   voice(m,when,dur,bar,k){
     lead(m,when,dur,.088,3200);
     lead(third(m,bar===13?this.cset:this.set),when,dur,.05,2600);
     if(bar>=8)tone('triangle',mtof(m+12),0,dur,.024,when,song,4000);
   }}
  ];
  ACTS.forEach(A=>{if(A.mel.n.length!==256||A.chords.length!==16)console.warn('canción mal medida',A.name,A.mel.n.length,A.chords.length)});
  // menú: tema v1.8.2 (melodía/progresión del bosque antiguo) a 112 bpm, suave
  const MENU_BPM=112;
  const MENU={prog:[[40,47],[36,43],[43,50],[38,45]],
    mel:parseMel(`64 . 67 . 71 . 76 . 74 . 71 . 67 . 71 .
                  72 . . . 71 . 69 . 67 . 69 . 71 . . .
                  67 . 71 . 74 . 79 . 78 . 74 . 71 . 74 .
                  74 . . . 72 . 71 . 69 . 66 . 69 . - .`)};
  const SAD={prog:[[52,55,59,64,67,64,59,55],[48,52,55,60,64,60,55,52],[45,48,52,57,60,57,52,48],[47,51,54,59,63,59,54,51]],
    mel:parseMel(`71 . 67 . 64 . . . 72 . 71 . 67 . . .
                  69 . 72 . 71 . 69 . 66 . . . 63 . - .`)};
  function kick(when,vol){
    tone('sine',105,38,.07,vol,when,song);
    tone('triangle',70,32,.05,vol*.55,when,song);
    noise(.03,vol*.22,'lowpass',220,80,when,song);
  }
  const snare=(when,v)=>{noise(.06,v,'bandpass',2200,1400,when,song);tone('square',220,90,.04,v*.35,when,song,1800)};
  const hat=(when,v)=>noise(.018,v,'highpass',7000,9000,when,song);
  const cymbal=(when,v=.09)=>noise(1.1,v,'highpass',6000,2600,when,song);
  const tom=(when,f,v)=>tone('sine',f,f*.5,.13,v,when,song);
  function playBeat(A,s,bar,when,S16,changing){
    const ch=A.chords[bar];
    if(changing&&s>=8)fill(s,when);else A.drums(s,bar,when,S16);
    A.rhythm(s,bar,ch,when,S16);
    if(A.pad)A.pad(s,bar,ch,when,S16);
    const k=step%256,m=A.mel.n[k];
    if(m>0)A.voice(m,when,A.mel.len[k]*S16*.96,bar,k);
    if(cometLayer)cometArp(ch,s,when,S16);
  }
  /* v1.8.4: capa brillante del cometa morado — arpegio de campanitas a semicorcheas sobre el acorde del acto,
     con el MISMO S16 del acto (no toca el tempo) y envío al eco para que "brille". */
  function shimmer(m,when,dur,vol){
    if(!ac||!song)return;const t=ac.currentTime+when,f=mtof(m),g=ac.createGain();
    g.gain.value=0;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    for(const[k,ty,v,dt]of[[1,'sine',1,-4],[2,'triangle',.32,5],[3.01,'sine',.12,0]]){const o=ac.createOscillator(),og=ac.createGain();o.type=ty;o.frequency.value=f*k;o.detune.value=dt;og.gain.value=v;o.connect(og);og.connect(g);o.start(t);o.stop(t+dur+.05)}
    g.connect(song);if(song._send)g.connect(song._send);
  }
  const COMET_ARP=[0,1,2,3,4,5,4,3,1,2,3,4,5,6,5,4];
  function cometArp(ch,s,when,S16){
    const v=voice(ch,72),i=COMET_ARP[s],n=v[i%3]+12*Math.floor(i/3);
    shimmer(n,when,S16*2.4,s%4===0?.034:.024);
    if(s===0)shimmer(v[0]+24,when,S16*6,.016);
  }
  function menuBeat(s,bar,c,when,S16){
    if(s%8===0)kick(when,.16);
    if(s%8===4)noise(.05,.05,'bandpass',2000,1300,when,song);
    if(s%4===2)hat(when,.02);
    if(s===0){tone('sawtooth',mtof(c[0]+12),0,S16*14,.04,when,song,800);tone('triangle',mtof(c[1]+12),0,S16*14,.03,when,song,1200)}
    const k=step%64,m=MENU.mel.n[k];
    if(m>0)lead(m,when,MENU.mel.len[k]*S16*.95,.045,1500,true);
  }
  function schedule(){
    if(rendering||!ac||ac.state!=='running'||!song)return;
    scheduleTo(ac.currentTime+.15);
  }
  function scheduleTo(horizon){
    if(mode==='over'){scheduleOver(horizon);return}
    while(next<horizon){
      let s=step%16;
      if(mode==='play'&&s===0&&pendingAct!==act){ // el acto cambia en el downbeat → canción nueva (fundido de colas) + platillo
        act=pendingAct;step=0;s=0;newSong(.3,ACTS[act].drive);setDelayFor(ACTS[act].bpm);
        cymbal(Math.max(0,next-ac.currentTime),.11);
      }
      const play=mode==='play',A=ACTS[act],S16=60/(play?A.bpm:MENU_BPM)/4;
      const when=Math.max(0,next-ac.currentTime);
      if(play)playBeat(A,s,Math.floor(step/16)%16,when,S16,pendingAct!==act);
      else{const bar=Math.floor(step/16)%4;menuBeat(s,bar,MENU.prog[bar],when,S16)}
      next+=S16;step++;
    }
  }
  function scheduleOver(horizon){
    if(horizon<overAt)return; // sonando el sting
    if(next<overAt)next=overAt;
    const S8=60/72/2;
    while(next<horizon){
      const when=Math.max(0,next-ac.currentTime),s=overStep%8,bar=Math.floor(overStep/8)%4,arp=SAD.prog[bar];
      tone('triangle',mtof(arp[s]),0,S8*1.9,.045,when,song,1800);
      if(s===0){tone('sine',mtof(arp[0]-12),0,S8*8,.07,when,song);tone('triangle',mtof(arp[2]),0,S8*7.5,.02,when,song,900)}
      const k=overStep%32,m=SAD.mel.n[k];
      if(m>0)lead(m,when,SAD.mel.len[k]*S8*.95,.05,1700,true);
      next+=S8;overStep++;
    }
  }
  function startPlay(){mode='play';act=pendingAct=0;cometLayer=false;if(!ac)return;newSong(.05,ACTS[0].drive);step=0;next=ac.currentTime+.06;setDelayFor(ACTS[0].bpm)}
  function startMenu(){mode='menu';cometLayer=false;if(!ac)return;newSong(.25);step=0;next=ac.currentTime+.3;setDelayFor(MENU_BPM)}
  function gameOver(){
    mode='over';cometLayer=false;if(!ac)return;
    newSong(.04);overStep=0;
    const t0=.32;
    // sting de derrota: descenso cromático "wah-wah-wah-waaah" + acorde grave de mi menor
    [[71,0,.3],[70,.34,.3],[69,.68,.3],[68,1.02,1.15]].forEach(([m,d,len])=>{lead(m,t0+d,len,.1,1900);lead(m-3,t0+d,len,.05,1500)});
    const tc=t0+2.25;
    [[40,.16],[47,.1],[52,.08],[55,.06]].forEach(([m,v])=>tone('sawtooth',mtof(m),mtof(m)*.97,1.7,v,tc,song,700));
    tone('sine',mtof(28),mtof(26),1.6,.2,tc,song);kick(tc,.32);cymbal(tc,.07);
    noise(1.4,.05,'lowpass',600,90,tc,song);
    overAt=ac.currentTime+tc+1.9;next=overAt;
  }
  return{
    init,
    _render:renderTest,
    get muted(){return muted},
    get musicVol(){return musicVol},
    get sfxVol(){return sfxVol},
    setMusicVol(v){musicVol=Math.max(0,Math.min(1,v));try{localStorage.setItem('kozmicRunMusicVol',String(musicVol))}catch(e){}applyBus();},
    setSfxVol(v){sfxVol=Math.max(0,Math.min(1,v));try{localStorage.setItem('kozmicRunSfxVol',String(sfxVol))}catch(e){}applyBus();},
    toggle(){muted=!muted;try{localStorage.setItem('kozmicRunMute',muted?'1':'0')}catch(e){}
      applyBus();return muted},
    setIntensity(v){if(v>0)startPlay();else startMenu()},
    setTempo(){}, // v1.8.2: el tempo ya no sigue la velocidad (solo cambia por acto)
    setStage(s){pendingAct=Math.max(0,Math.min(3,s|0))},
    resetTempo(){pendingAct=0},
    gameOver,
    get mode(){return mode},
    suspend(){if(ac&&ac.state==='running')ac.suspend()},
    resume(){if(ac&&ac.state==='suspended')ac.resume()},
    jet(on){if(ac)jetGain.gain.setTargetAtTime(on?.045:0,ac.currentTime,on?.04:.08)},
    boost(){tone('square',260,640,.09,.07,0,sfx,2600);tone('triangle',520,1240,.08,.06)},
    collect(v=1){
      if(v>=10){[72,76,79,84,88].forEach((m,i)=>tone('square',mtof(m),0,.12,.07,i*.065,sfx,3500));tone('triangle',mtof(96),0,.4,.07,.33);return}
      if(v>=8){[74,78,81,86].forEach((m,i)=>tone('square',mtof(m),0,.11,.08,i*.055,sfx,3200));tone('triangle',mtof(93),0,.35,.07,.28);return}
      if(v>=6){[76,80,83,88].forEach((m,i)=>tone('square',mtof(m),0,.1,.075,i*.05,sfx,3000));tone('triangle',mtof(91),0,.28,.06,.22);return}
      if(v>=3){[81,85,88].forEach((m,i)=>tone('triangle',mtof(m),0,.1,.11,i*.05));return}
      tone('triangle',1318,0,.07,.12);tone('triangle',1976,0,.12,.11,.055);
    },
    chainDone(){[67,71,74,79,86].forEach((m,i)=>tone('triangle',mtof(m),0,.12,.09,i*.06));},
    bump(){tone('sine',220,110,.12,.12);noise(.06,.06,'lowpass',900,300)},
    crash(){noise(.55,.38,'lowpass',2600,110);tone('sawtooth',330,48,.6,.16,0,sfx,1600);tone('square',150,40,.35,.12)},
    ui(){tone('square',880,1320,.05,.05,0,sfx,3000)},
    jingle(){[69,72,76,81].forEach((m,i)=>tone('triangle',mtof(m),0,.14,.09,i*.08))},
    candy(){tone('triangle',988,1480,.06,.11);tone('square',1568,0,.08,.05,.05,sfx,3400);tone('triangle',2093,0,.1,.07,.1)},
    power(){[60,64,67,72,76,79,84].forEach((m,i)=>tone('square',mtof(m),0,.1,.07,i*.04,sfx,3600));tone('sawtooth',mtof(48),mtof(60),.4,.08,0,sfx,1400);noise(.25,.06,'highpass',3000,8000)},
    powerEnd(){[79,74,70,67].forEach((m,i)=>tone('triangle',mtof(m),0,.09,.08,i*.06))},
    shieldHit(){tone('sine',1200,600,.1,.08);tone('triangle',1800,900,.08,.05,.02)},
    record(){[76,79,84,88,91].forEach((m,i)=>tone('square',mtof(m),0,.12,.06,i*.07,sfx,3200))},
    /* v1.8.4: cometa morado */
    setComet(on){cometLayer=!!on},
    get comet(){return cometLayer},
    cometOn(){ // transformación: barrido ascendente + arpegio que sube + soplo
      tone('sawtooth',110,1320,.75,.06,0,sfx,2200);tone('triangle',220,1760,.8,.06);tone('sine',55,220,.6,.09);
      noise(.8,.05,'bandpass',300,7000);
      [60,63,67,70,72,75,79,82,84,87,91].forEach((m,i)=>tone('triangle',mtof(m),0,.16,.05+i*.003,.05+i*.045,sfx,5000));
      [84,88,91,96].forEach(m=>tone('sine',mtof(m),0,.9,.035,.58));
    },
    cometOff(){ // vuelta a la normalidad: barrido descendente
      tone('triangle',1760,180,.65,.07);tone('sawtooth',990,110,.6,.035,0,sfx,1600);
      [91,87,84,79,75,72,67].forEach((m,i)=>tone('sine',mtof(m),0,.14,.05,i*.05));
      noise(.5,.035,'bandpass',5000,300);
    },
    cometWarn(){tone('sine',mtof(91),0,.16,.04);tone('sine',mtof(86),0,.2,.03,.08)},
    smash(){noise(.28,.13,'lowpass',3200,180);tone('square',320,55,.22,.07,0,sfx,1500);tone('triangle',1400,2600,.09,.05,.02);tone('sine',mtof(84),0,.18,.04,.05)},
    chainPerfect(k=1){ // ¡cadena perfecta! — arpegio mayor que sube con la racha
      const b=Math.min(7,k-1);[67,71,74,79,83,86].forEach((m,i)=>tone('triangle',mtof(m+b),0,.13,.085,i*.05));
      tone('sine',mtof(91+b),0,.5,.05,.3);tone('square',mtof(79+b),0,.08,.03,.3,sfx,4000);
    }
  };
})();

/* ---------- estado (lógica original) ---------- */
let state='ready',mode='real',practiceLeft=7,last=performance.now(),world=0,speed=230,
    player={x:180,y:250,vy:0,rot:0},obs=[],sparkles=[],particles=[],texts=[],held=false,
    score=0,runCoins=0,spawnIn=1.1,seed=(Date.now()^Math.floor(Math.random()*1e9))>>>0,
    shake=0,flash=0,crashT=0,boostT=0,t=0,runTime=0,voidMode=false,chains={},
    invulnT=0,nextCatAt=0, // v1.6: poder gatuno (invencible 3 s) + enfriamiento de aparición de gatos
    comet=0,cometGrace=0,cometMeter=0,cometTrail=[],cometWarnAt=0,chainStreak=0,lastChainEnd=null; // v1.8.4
const INVULN_DUR=3,CAT_GAP=9;
/* v1.8.4: cometa morado — cada 50 objetos recogidos en la carrera (fuera del cometa) → 9 s de cometa,
   aviso en los últimos 2 s (solo el cometa titila suave) y 1.1 s de gracia invencible al salir. */
const COMET_EVERY=50,COMET_DUR=9,COMET_WARN=2,COMET_GRACE=1.1,COMET_SMASH=2;
// solo pruebas automáticas (?test): permite pausar el loop, apagar gatos/cometa y registrar cadenas/choques
const TESTCFG={paused:false,noCats:false,noComet:false,seed:null,god:false};
{const m=/[?&]test\b/.test(location.search)&&location.search.match(/[?&]seed=(\d+)/);if(m)TESTCFG.seed=+m[1]} // ?test&seed=N → recorrido fijo
let TESTLOG=null; // gato = 3 s invencible · gatos ≥9 s entre sí (v1.8: dulces retirados, los mas dan los puntos)
const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
// v1.9: semilla NUEVA en cada carrera (antes las reales usaban una semilla diaria → mismo recorrido todo el día).
// crypto.getRandomValues + reloj + Math.random; con ?test se puede fijar (TESTCFG.seed o ?seed=N) para pruebas.
function freshSeed(){
  let s=0;try{const a=new Uint32Array(2);crypto.getRandomValues(a);s=a[0]^Math.imul(a[1],2654435761)}catch(e){}
  s^=Math.imul(Date.now()|0,2246822519);s^=Math.floor(performance.now()*1000)|0;s^=Math.floor(Math.random()*4294967296);
  return (s>>>0)||0x9e3779b9;
}
let runSeed=0;

function ui(){
  $('#lives').textContent=BETA?'∞':data.lives;$('#wallet').textContent=data.wallet;$('#best').textContent=data.best;
  $('#runNo').textContent=(state==='playing'&&mode==='practice')?'libre':((state==='playing'||state==='crashing')&&mode==='real'?data.runs:Math.min(3,data.runs+1))+' / 3';
}
function panel(title,msg,practiceText,realText,hint){
  $('#title').innerHTML=title;$('#message').textContent=msg;$('#practice').textContent=practiceText;$('#start').textContent=realText;
  $('#start').disabled=!BETA&&data.lives<=0;$('#practice').disabled=false;$('#hint').textContent=hint;
  const ov=$('#overlay');ov.classList.remove('hidden');const card=ov.querySelector('.card');card.style.animation='none';void card.offsetWidth;card.style.animation='';
  $('#boost').classList.add('hidden');
}
function hide(){$('#overlay').classList.add('hidden')}
function setHeld(v){
  if(v&&state!=='playing')v=false;
  if(v&&!held){Sound.boost();boostT=0;animKick(-7);if(state==='playing'&&comet<=0)broomPuff()} // anticipación + v1.9: soplo de polvo mágico de la paja
  if(!v&&held)animKick(3)
  held=v;Sound.jet(v);$('#boost').classList.toggle('pressed',v);
}

function prepareRun(kind){
  if(state==='playing'||state==='crashing'||(kind==='real'&&!BETA&&data.lives<=0))return;
  Sound.init();Sound.ui();Sound.resetTempo();lastActAnnounced=-1;
  mode=kind;if(kind==='real'){if(!BETA)data.lives--;data.runs++;save()}
  practiceLeft=7;state='playing';world=0;speed=230;score=0;runCoins=0;spawnIn=1.05;
  runTime=0;voidMode=false;chains={};invulnT=0;nextCatAt=4;
  comet=0;cometGrace=0;cometMeter=0;cometTrail=[];chainStreak=0;lastChainEnd=null;Sound.setComet(false);
  obs=[];sparkles=[];particles=[];texts=[];held=false;shake=0;flash=0;
  player={x:180,y:250,vy:0,rot:0};
  seed=runSeed=TESTCFG.seed!=null?(TESTCFG.seed>>>0):freshSeed();
  rigPop=RIG_POP;broomPoof(true); // v1.9: se transforma en jinete de escoba (poof de partículas, sin flash)
  last=performance.now();
  $('#timer').textContent='';$('#distance').textContent='0 m';
  $('#distanceLabel').textContent=kind==='practice'?'práctica':'distancia';
  $('#modeLabel').textContent=kind==='practice'?'tiempo de práctica':'carrera de hoy';
  ui();hide();$('#boost').classList.remove('hidden');Sound.setIntensity(1);
  texts.push({x:W/2,y:H/2-20,text:kind==='practice'?'¡a practicar!':'¡vamos!',color:'#d7ff58',life:1,max:1,size:40,vy:-20});
}
function finishPractice(){
  state='ready';comet=0;cometGrace=0;Sound.setComet(false);setHeld(false);ui();Sound.setIntensity(0);Sound.resetTempo();Sound.jingle();
  panel('¡práctica<br>lista!','¡buen vuelo! la práctica es ilimitada: no gasta vidas ni suma puntos. ¿te lanzas a una carrera de verdad?','practicar otra vez · 7 seg','empezar carrera',BETA?'beta: vidas ∞. mantén «vuela» para subir; suelta para bajar.':'mantén «vuela» para subir; suelta para bajar. cada carrera usa 1 de tus 3 vidas diarias.');
}
function end(){
  state='over';setHeld(false); // v1.8.2: la música de game over ya suena desde crash()
  const earned=Math.max(0,Math.floor(score/5)+runCoins),dist=Math.floor(score),rec=dist>data.best&&dist>0;
  data.wallet+=earned;data.best=Math.max(data.best,dist);save();ui();if(rec)Sound.record();
  const left=BETA?'modo beta: vidas infinitas — sigue probando.':(data.lives?`te ${data.lives===1?'queda 1 carrera':`quedan ${data.lives} carreras`} hoy.`:'vuelve mañana por tres carreras nuevas.');
  panel(rec?'¡nuevo<br>récord!':'¡carrera<br>terminada!',`distancia: ${dist} m • kozmits: ${runCoins} • puntos ganados: ${earned}. ${left}`,
    'practicar otra vez · 7 seg',(BETA||data.lives)?'otra carrera':'sin carreras por hoy',BETA?'beta: vidas ∞ para probar el avance.':'la práctica sigue ilimitada. las carreras se reinician a medianoche.');
}
function crash(){
  state='crashing';crashT=.8;invulnT=0;comet=0;cometGrace=0;Sound.setComet(false);setHeld(false);Sound.crash();Sound.gameOver();shake=16;flash=.25;
  player.vy=-280;
  for(let i=0;i<34;i++){const a=Math.random()*Math.PI*2,s=80+Math.random()*320;
    particles.push({x:player.x,y:player.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.7+Math.random()*.5,max:1.2,size:2+Math.random()*4,color:['#a98cf0','#d7ff58','#ffffff','#ff9b42'][i%4],g:400,kind:i%3?'dot':'star'})}
  texts.push({x:player.x+30,y:player.y-40,text:'¡bu!',color:'#ffffff',life:.9,max:.9,size:34,vy:-50});
}

/* ---------- v1.8: coleccionables masN (N ✦, más raro cuanto mayor N) ---------- */
const MAS=[
  {n:1,keys:['mas1'],name:'moneda lunar',glow:'#ffd84a'},
  {n:2,keys:['mas2'],name:'gema amatista',glow:'#b05cff'},
  {n:3,keys:['mas3'],name:'grimorio',glow:'#9a5cff'},
  {n:4,keys:['mas4'],name:'llave calavera',glow:'#e0b050'},
  {n:6,keys:['mas6a','mas6b','mas6c'],name:'corazón',glow:'#ff3b5c'},
  {n:7,keys:['mas7'],name:'poción de maná',glow:'#5c8cff'},
  {n:8,keys:['mas8'],name:'poción de vida',glow:'#ff3b4a'}
];
const MAS_POW=1.35; // peso ∝ 1/N^1.35 · mas1 boost fuerte (v1.8.2: aún más monedas, ~88 % de sueltos)
const MAS_W=MAS.map(m=>m.n===1?7.5:1/Math.pow(m.n,MAS_POW)),MAS_WSUM=MAS_W.reduce((a,b)=>a+b,0);
const masByN=n=>MAS.find(m=>m.n===n)||MAS[0];
function pickMas(){let r=rand()*MAS_WSUM;for(let i=0;i<MAS.length;i++){r-=MAS_W[i];if(r<=0)return MAS[i]}return MAS[0]}
const masH=n=>30+n*2.6;            // alto en pantalla: moneda 33 px → poción 51 px
const masRad=n=>26+n*1.3;          // radio de recogida
function masItem(m,x,y,extra){return Object.assign({x,y,v:m.n,img:m.keys[Math.floor(rand()*m.keys.length)],ph:rand()*6},extra||{})}

/* ---------- v1.8: obstáculos menosN (alto = 40 + N·18 px; 0 = más chico, 6 = más grande) ---------- */
const menosH=n=>40+n*18;
// relación ancho/alto de respaldo (por si la imagen aún no cargó)
const MENOS_AR={menos0:.5,menos1a:.4,menos1b:3.3,menos1c:.52,menos2:.34,menos3:.68,menos4a:.75,menos4b:.55,menos4c:1.88,menos5:.56,menos6:.45};
// hitbox: recorte proporcional por sprite [x, arriba, abajo]
const MENOS_IN={menos0:[.24,.3,.06],menos1a:[.22,.04,.12],menos1b:[.06,.22,.08],menos1c:[.2,.08,.04],menos2:[.2,.03,.03],
  menos3:[.18,.26,.05],menos4a:[.08,.06,.03],menos4b:[.14,.05,.03],menos4c:[.05,.08,.03],menos5:[.2,.22,.04],menos6:[.18,.05,.06]};
const MENOS_N={menos0:0,menos1a:1,menos1b:1,menos1c:1,menos2:2,menos3:3,menos4a:4,menos4b:4,menos4c:4,menos5:5,menos6:6};
const FLAMES=new Set(['menos0','menos3','menos5']);
const arOf=k=>ok(k)?IMG[k].naturalWidth/IMG[k].naturalHeight:(MENOS_AR[k]||.6);
const pick=a=>a[Math.floor(rand()*a.length)];
const wpick=list=>{let s=0;for(const [,w] of list)s+=w;let r=rand()*s;for(const [k,w] of list){r-=w;if(r<=0)return k}return list[0][0]};
// suelo por acto: bosque = enredaderas/espada · cementerio = tumbas · infierno = llamas · oscuridad = todo
const GROUND_BY_ACT=[
  [['menos1b',2],['menos1c',2],['menos2',1.2],['menos4b',.8],['menos0',.6]],
  [['menos4a',1.6],['menos4b',1.6],['menos4c',1.2],['menos2',.8],['menos1c',.8],['menos0',.4]],
  [['menos0',1.4],['menos3',1.6],['menos5',1.3],['menos2',.5],['menos4c',.5]],
  [['menos0',1],['menos1b',.8],['menos1c',.8],['menos2',1],['menos3',1],['menos4a',.8],['menos4b',.8],['menos4c',.7],['menos5',1]]
];
const CEIL_BY_ACT=[
  [['menos1a',3],['menos2',.8],['menos6',.5]],
  [['menos6',1.6],['menos1a',1.4],['menos2',1]],
  [['menos2',1.4],['menos6',1],['menos1a',.6]],
  [['menos1a',1],['menos2',1],['menos6',1.2]]
];
const FLOAT_BY_ACT=[
  [['menos0',1.2],['menos2',1.4],['menos6',.6]],
  [['menos6',1.4],['menos2',1.2],['menos0',1]],
  [['menos0',1.4],['menos3',1],['menos2',1]],
  [['menos0',1],['menos2',1.2],['menos3',.8],['menos6',1]]
];
const jit=()=>.92+rand()*.16; // ±8 %
// place: ground | ceil | float. maxH recorta para dejar siempre hueco jugable.
function menos(key,place,x,y,maxH){
  const n=MENOS_N[key],ar=arOf(key);
  let h=Math.round(menosH(n)*jit());
  const flying=place==='float'&&key==='menos2'; // espada voladora: de lado, punta hacia el jugador
  if(maxH)h=Math.min(h,Math.max(30,Math.round(maxH)));
  let w=Math.round(h*ar);
  if(flying){const t0=w;w=h;h=t0}
  const o={x,y:0,w,h,kind:'menos',img:key,n,place,fixed:place!=='float',flying,bob:rand()*8,
    flip:FLAMES.has(key)?1:(rand()<.5?1:-1)};
  if(key==='menos2'&&place!=='float')o.flip=1;
  if(key==='menos1a'||key==='menos6')o.flip=1;
  if(place==='ground')o.y=H-FLOOR_H-h;
  else if(place==='ceil')o.y=key==='menos6'?Math.round(6+rand()*24):0; // relicario cuelga de una cadena
  else o.y=y-h/2;
  return o;
}
// gato = poder; con enfriamiento para que no haya invencibilidad constante
const CAT_SZ={w:58,h:64};
function catReady(){if(TESTCFG.noCats||runTime<nextCatAt||invulnT>0)return false;nextCatAt=runTime+CAT_GAP+rand()*4;return true}
function catPower(x){return{x,y:H-FLOOR_H-CAT_SZ.h,w:CAT_SZ.w,h:CAT_SZ.h,kind:'cat',img:pick(CATS_GROUND),fixed:true,place:'ground',power:true}}
const MIN_ROOM=188; // hueco mínimo entre techo y suelo (v1.8.1: más holgado)
function obstacle(){
  const nw=[]; // v1.8.4: piezas nuevas → se ajustan para no tapar cadenas activas antes de entrar a obs
  let gap=voidMode?Math.max(110,155-Math.min(34,(runTime-ACT_DUR*3)*.7)):Math.max(162,235-Math.min(52,world*.0048));
  let center=145+rand()*(voidMode?180:210);let type=rand();
  if(voidMode&&type>.25)type=rand()*.5; // más fijos/combos en oscuridad
  const act=currentActIndex();
  if(type<.38){ // fijos de suelo (y a veces techo): tumbas / llamas / enredaderas / espada clavada / gato
    let gh=0;
    if(rand()<.2&&catReady()){nw.push(catPower(W+25));gh=CAT_SZ.h}
    else{const g=menos(wpick(GROUND_BY_ACT[act]),'ground',W+25,0,H-FLOOR_H-MIN_ROOM-40);gh=g.h;nw.push(g)}
    if(rand()<.6){
      const ox=W+25+(rand()<.4?Math.floor(rand()*36):0);
      const room=H-FLOOR_H-MIN_ROOM-gh; // siempre dejar un hueco jugable entre techo y suelo
      const ck=wpick(CEIL_BY_ACT[act]);
      const c=menos(ck,'ceil',ox,0,room-(ck==='menos6'?30:0));
      if(c.h>=30)nw.push(c);
    }
  }else if(type<.74){ // flotantes en el carril del hueco: fuego fatuo / espada voladora / relicario / gato-murciélago
    if(rand()<.1&&runTime>8&&catReady())nw.push({x:W+25,y:center-26+(rand()-.5)*gap*.4,w:58,h:52,kind:'catBat',bob:rand()*8,fixed:false,power:true});
    else{
      const k=wpick(FLOAT_BY_ACT[act]);
      nw.push(menos(k,'float',W+25,center+(rand()-.5)*gap*.45,gap*.62));
    }
  }else{ // combo: flotante arriba del hueco + fijo abajo
    const k=wpick(FLOAT_BY_ACT[act]);
    const f=menos(k,'float',W+25,0,Math.min(90,gap*.5));
    f.y=Math.max(8,center-gap/2-f.h-4);nw.push(f);
    if(rand()<.25&&catReady())nw.push(catPower(W+25));
    else{
      const roomBelow=H-FLOOR_H-(center+gap/2);
      nw.push(menos(wpick(GROUND_BY_ACT[act]),'ground',W+25,0,Math.max(40,Math.min(H-FLOOR_H-MIN_ROOM-40,roomBelow+30))));
    }
  }
  const paths=activeChainPaths();
  for(const o of nw){const f=fitAroundChains(o,paths);if(f){f.born=runTime;obs.push(f)}}
  // kozmits: cadenas de habilidad (v1.8.4: trayectoria física real) / objetos mas sueltos
  const roll=rand();
  const chainChance=voidMode?Math.min(.66,.55+(runTime-ACT_DUR*3)*.004):(.38+Math.min(.18,runTime/(ACT_DUR*3)*.18));
  const putLoose=it=>{if(!nearChainCoin(it.x,it.y))sparkles.push(it)};
  if(!(roll<chainChance&&spawnSkillChain(center,gap))){
    const m=pickMas(),y0=center+(rand()-.5)*gap*.5;
    putLoose(masItem(m,W+90,y0));
    // v1.8.2: casi siempre monedas lunares extra junto al suelto (2–3 en fila suave)
    if(rand()<.78){const y1=Math.max(60,Math.min(H-FLOOR_H-30,y0+(rand()-.5)*40));putLoose(masItem(masByN(1),W+90+44,y1));
      if(rand()<.5)putLoose(masItem(masByN(1),W+90+88,Math.max(60,Math.min(H-FLOOR_H-30,y1+(rand()-.5)*40))))}
  }
  // v1.8.2: migas de monedas entre obstáculos (mini fila de 3 en el carril del hueco)
  if(rand()<.5){const yb=Math.max(70,Math.min(H-FLOOR_H-40,center+(rand()-.5)*gap*.3)),dy=(rand()-.5)*30;
    for(let i=0;i<3;i++)putLoose(masItem(masByN(1),W+210+i*40,yb+dy*i))}
}
function nearChainCoin(x,y){for(const c of sparkles)if(c.chainId&&Math.abs(c.x-x)<44&&Math.abs(c.y-y)<44)return true;return false}
function hitBox(o){
  let ox,oy,ow,oh;
  if(o.kind==='menos'){
    const ins=MENOS_IN[o.img]||[.15,.1,.1];
    if(o.flying){ // espada de lado: recorte cruzado
      ox=o.x+o.w*.03;ow=o.w*.94;oy=o.y+o.h*.2;oh=o.h*.6;
    }else{
      let top=ins[1],bot=ins[2];
      if(o.place==='ceil'&&o.img!=='menos1a'&&o.img!=='menos6'&&o.img!=='menos2'){const tmp=top;top=bot;bot=tmp}
      ox=o.x+o.w*ins[0];ow=o.w*(1-ins[0]*2);oy=o.y+o.h*top;oh=o.h*(1-top-bot);
    }
  }else{
    const pad=({cat:6,catBat:6}[o.kind]??5);
    ox=o.x+pad;oy=o.y+pad;ow=o.w-pad*2;oh=o.h-pad*2;
  }
  return[ox,oy,ow,oh];
}
const PL_HX=20,PL_HY=18; // hitbox del jugador (±20 × ±18 alrededor de player.x/y)
function hit(o){const[ox,oy,ow,oh]=hitBox(o),px=player.x,py=player.y;return px+PL_HX>ox&&px-PL_HX<ox+ow&&py+PL_HY>oy&&py-PL_HY<oy+oh}


/* ---------- v1.8.4: cadenas de HABILIDAD ----------
   cada cadena nace de SIMULAR la física real del jugador (gravedad 720, impulso −980, vy ∈ [−370, 430], 60 fps)
   con una secuencia plausible de mantener/soltar, a la velocidad de scroll que habrá en ese momento (world/speed se
   predicen con la misma integración que update()). las monedas van a distancia regular SOBRE esa trayectoria → siempre
   se pueden juntar todas solo con habilidad. se verifica que quede en pantalla y que no cruce obstáculos (con margen);
   los obstáculos que salgan después se recortan / mueven / omiten si taparían una cadena activa. */
let chainSeq=0;
/* lo que se crea dentro de update() se mueve speed·dt en ese mismo frame (world ya avanzó) → referencia corregida */
let spawnShift=0;
const PHYS={up:-980,down:720,vmin:-370,vmax:430},SIM_DT=1/60,LEAD_F=30; // entrada de 0.5 s antes de la 1ª moneda
const CH_TOP=50,CH_BOT=H-FLOOR_H-38;  // la trayectoria (centro del jugador) queda entre 50 y 398
const CH_MX=10,CH_MY=14;             // margen extra jugador↔obstáculo a lo largo de la cadena
function chainDiff(){
  if(voidMode)return Math.min(1,.58+(runTime-ACT_DUR*3)/55);
  return Math.min(.58,runTime/(ACT_DUR*3)*.58);
}
// predicción exacta de world/runTime (misma integración que update())
function forecast(frames){
  let rt=runTime,w=world,sp=speed,vm=voidMode;const out=[{rt,w}];
  for(let k=0;k<frames;k++){rt+=SIM_DT;if(rt>=ACT_DUR*3)vm=true;w+=sp*SIM_DT;
    sp=vm?Math.min(680,490+(rt-ACT_DUR*3)*5.2+w*.009):Math.min(500,230+w*.017+rt*.95);out.push({rt,w})}
  return out;
}
function physStep(st,u,dt){st.vy+=(u?PHYS.up:PHYS.down)*dt;st.vy=Math.max(PHYS.vmin,Math.min(PHYS.vmax,st.vy));st.y+=st.vy*dt}
const rr=(a,b)=>a+rand()*(b-a);
// secuencia de entradas por frame (1 = mantener, 0 = soltar) según la forma; pulsos ≥ 0.11–0.15 s (humanos)
function chainInputs(kind,diff){
  const segs=[],minF=Math.round(Math.max(.11,.15-diff*.04)*60),F=sec=>Math.max(minF,Math.round(sec*60));
  const alt=(first,h,r,n)=>{let u=first;for(let i=0;i<n;i++){segs.push([u,F(u?h():r())]);u=1-u}};
  const HV=PHYS.down/(-PHYS.up); // ≈ .735 → mantener/soltar en esta proporción = vuelo nivelado
  if(kind==='ola'){const h=rr(.13,.19+diff*.13),k=rr(.85,1.12);alt(rand()<.5?1:0,()=>h*rr(.92,1.08),()=>h/HV*k*rr(.92,1.08),16)}
  else if(kind==='subida'){const h=rr(.15,.24+diff*.06);alt(1,()=>h,()=>h*rr(.72,1.02),16)}
  else if(kind==='picada'){const r=rr(.15,.26+diff*.06);alt(0,()=>r,()=>r*rr(.42,.6),16)}
  else if(kind==='arco'){ // colina: sube largo, cae largo y sigue ondulando suave
    segs.push([1,F(rr(.2,.3+diff*.14))],[0,F(rr(.4,.55+diff*.18))]);const h=rr(.14,.2);alt(1,()=>h,()=>h/HV,14)}
  else if(kind==='valle'){segs.push([0,F(rr(.24,.36+diff*.12))],[1,F(rr(.3,.42+diff*.14))]);const h=rr(.14,.2);alt(0,()=>h/HV,()=>h,14)}
  else{ // eses: curvas amplias (tarde / oscuridad)
    const h=rr(.24,.32+diff*.14);alt(rand()<.5?1:0,()=>h*rr(.9,1.1),()=>h/HV*rr(.9,1.12),14)}
  const u=[];for(const[v,n]of segs)for(let i=0;i<n;i++)u.push(v);
  return u;
}
function pickChainKind(diff){
  const r=rand();
  if(diff<.22)return r<.45?'ola':r<.62?'subida':r<.79?'picada':'arco';
  if(diff<.45)return r<.3?'ola':r<.45?'subida':r<.6?'picada':r<.8?'arco':'valle';
  if(diff<.72)return r<.22?'ola':r<.34?'subida':r<.46?'picada':r<.62?'arco':r<.76?'valle':'eses';
  return r<.18?'ola':r<.28?'subida':r<.38?'picada':r<.52?'arco':r<.66?'valle':'eses';
}
// deriva de obstáculos que se mueven: [vx extra hacia la izquierda (px/s), holgura vertical por el vaivén]
const obsDrift=o=>o.fixed?[0,0]:o.flying?[voidMode?80:50,voidMode?19:14]:o.kind==='catBat'?[voidMode?40:20,24]:[0,voidMode?19:14];
// ¿la trayectoria (coordenadas de mundo) pasa por el obstáculo? con margen y movimiento del obstáculo
function pathHits(path,o,mx=CH_MX,my=CH_MY){
  const[ox,oy,ow,oh]=hitBox(o),X0=ox+world-spawnShift,X1=X0+ow,[vx,ay]=obsDrift(o);
  for(const p of path){
    if(p.wx<world+player.x-30)continue;
    const sh=vx*(p.rt-runTime);
    if(p.wx+PL_HX+mx>X0-sh&&p.wx-PL_HX-mx<X1-sh&&p.y+PL_HY+my>oy-ay&&p.y-PL_HY-my<oy+oh+ay)return true;
  }
  return false;
}
function activeChainPaths(){const out=[];for(const id in chains){const c=chains[id];if(c.path&&c.wx1>world+player.x-40)out.push(c.path)}return out}
function resizeObs(o,nh){const ar=o.w/o.h;o.h=nh;o.w=Math.max(8,Math.round(nh*ar));if(o.place==='ground')o.y=H-FLOOR_H-nh}
// obstáculo nuevo vs cadenas activas: se recorta (suelo/techo), se mueve (flotante) o se omite
function fitAroundChains(o,paths){
  if(!paths.length||o.power)return o;
  const clear=()=>!paths.some(p=>pathHits(p,o));
  if(clear())return o;
  if(o.kind==='menos'&&o.fixed){const h0=o.h;for(let k=1;k<=6;k++){const nh=Math.round(h0*(1-k*.13));if(nh<30)break;resizeObs(o,nh);if(clear())return o}return null}
  if(o.kind==='menos'){const y0=o.y;for(const dy of[-70,70,-130,130,-190,190]){o.y=y0+dy;if(o.y<8||o.y+o.h>H-FLOOR_H-6)continue;if(clear())return o}}
  return null;
}
function spawnSkillChain(center,gap){
  const diff=chainDiff();
  // largo: temprano 7–9 · medio 8–11 · tarde 9–12 · oscuridad 10–13 (monedas a ~40–44 px → se lee como línea)
  const [nMin,nMax]=diff<.22?[7,9]:diff<.45?[8,11]:diff<.72?[9,12]:[10,13];
  const spacing=44-diff*4;
  const fc=forecast(Math.ceil(2.8*60+LEAD_F+(W+480)/Math.max(200,speed)*60));
  const here=world+player.x; // x de mundo del jugador ahora
  // 1ª moneda en x de pantalla ≥ W+60 y después de la cadena anterior (+0.5 s para reacomodarse + 0.5 s de entrada)
  let X1=world+W+60;
  const prev=lastChainEnd&&lastChainEnd.wx>here?lastChainEnd:null;
  if(prev){const need=prev.wx+Math.max(150,speed*.5)+speed*LEAD_F/60;if(need>X1)X1=need}
  if(X1>world+W+460)return false;
  let kC=1;while(kC<fc.length-1&&fc[kC].w+player.x<X1)kC++;
  const kS=kC-LEAD_F;if(kS<1)return false;
  for(let attempt=0;attempt<26;attempt++){
    const kind=pickChainKind(diff),n=nMin+Math.floor(rand()*(nMax-nMin+1));
    // estado de entrada: dentro del hueco (a veces libre), con vy realista
    let yC=attempt<14?center+(rand()-.5)*gap*.6:rr(CH_TOP+40,CH_BOT-40);
    if(prev){const dtp=Math.max(.2,fc[kS].rt-prev.rt);yC=prev.y+(rand()-.5)*Math.min(300,50+dtp*200)}
    yC=Math.max(CH_TOP+30,Math.min(CH_BOT-30,yC));
    const vyC=kind==='subida'?rr(-100,10):kind==='picada'?rr(-10,100):rr(-75,75); // entrada casi nivelada
    const u=chainInputs(kind,diff);
    // entrada: planeo recto de 0.5 s que termina en (yC, vyC) — también se verifica contra obstáculos
    const path=[];
    for(let k=kS;k<kC;k++)path.push({wx:fc[k].w+player.x,y:yC-vyC*(kC-k)*SIM_DT,vy:vyC,rt:fc[k].rt,u:-1});
    const st={y:yC,vy:vyC},coins=[];let arc=0,lastP=null,good=true,kEnd=kC;
    for(let k=kC,j=0;k<fc.length;k++,j++){
      const uj=j>0?u[Math.min(u.length-1,j-1)]:-1;
      if(j>0)physStep(st,uj,SIM_DT);
      const p={wx:fc[k].w+player.x,y:st.y,vy:st.vy,rt:fc[k].rt,u:uj};
      if(lastP)arc+=Math.hypot(p.wx-lastP.wx,p.y-lastP.y);
      path.push(p);lastP=p;
      if(p.y<CH_TOP||p.y>CH_BOT){good=false;break}
      if(!coins.length||arc>=spacing){coins.push(p);arc=0}
      if(coins.length>=n){kEnd=k;break}
    }
    if(!good||coins.length<n||path.some(p=>p.y<CH_TOP||p.y>CH_BOT))continue;
    // salida: desde la última moneda se tiene que poder recuperar (volver a vuelo nivelado) sin tocar techo/suelo;
    // los primeros 10 frames de esa salida también quedan libres de obstáculos (nada pegado a la última moneda)
    let safe=true;
    for(let k=kEnd+1,q=0;q<40;k++,q++){const ur=st.y>250?(st.vy>-60?1:0):(st.vy<60?0:1);physStep(st,ur,SIM_DT);
      if(st.y<CH_TOP-16||st.y>CH_BOT+16){safe=false;break}
      if(q<10&&k<fc.length)path.push({wx:fc[k].w+player.x,y:st.y,vy:st.vy,rt:fc[k].rt,u:ur})}
    if(!safe)continue;
    if(obs.some(o=>!o.power&&pathHits(path,o)))continue;
    // ¡vale! monedas (mundo → pantalla)
    const id='c'+(++chainSeq),last=coins[coins.length-1];
    const mult=1.15+diff*2.2+(voidMode?.55:0)+(kind==='eses'?.35:kind==='valle'||kind==='arco'?.2:0);
    chains[id]={got:0,total:n,kind,diff,mult,missed:false,path,wx1:last.wx,t0:path[0].rt,t1:last.rt};
    lastChainEnd={wx:last.wx,y:last.y,rt:last.rt};
    const m=masByN(diff>.65?2:1);
    coins.forEach((p,i)=>{const nx=coins[i+1];
      // punto guía a medio camino sobre la trayectoria real (destello tenue entre monedas)
      let mid=null;if(nx){const mw=(p.wx+nx.wx)/2;let best=p;for(const q of path)if(Math.abs(q.wx-mw)<Math.abs(best.wx-mw))best=q;mid={dx:best.wx-p.wx,dy:best.y-p.y}}
      sparkles.push(masItem(m,p.wx-world+spawnShift,p.y,{chainId:id,chainIdx:i,mid,ph:i*.55}))}); // giro en ola a lo largo de la cadena
    if(TESTLOG)TESTLOG.chains.push({id,n,kind,diff:+diff.toFixed(2),act:currentActIndex(),speed:Math.round(speed),t0:path[0].rt,t1:last.rt,path,attempt});
    return true;
  }
  return false;
}

/* ---------- actos por tiempo (30 s c/u) → oscuridad a los ~90 s ---------- */
const ACT_DUR=30; // segundos por acto
const ACT_FADE_T=2.2; // fundido entre actos (seg)
const ACT_META=[
  {name:'bosque tenebroso',short:'bosque',lane:'#5cff9a',ground:'#1a2e1c',glow:'#2d6a32'},
  {name:'cementerio',short:'cementerio',lane:'#b386ff',ground:'#2a2438',glow:'#9a5cff'},
  {name:'infierno',short:'infierno',lane:'#ff6b3d',ground:'#3a1210',glow:'#ff3b2f'},
  {name:'oscuridad',short:'void',lane:'#c8b0ff',ground:'#1a1430',glow:'#7a5cff'}
];
let lastActAnnounced=-1;
function actWeights(rt){
  // pesos [bosque, cementerio, infierno, void] — 30 s c/u, fundido ~2.2 s
  if(voidMode||rt>=ACT_DUR*3)return[0,0,0,1];
  const fade=ACT_FADE_T;
  const edges=[ACT_DUR, ACT_DUR*2, ACT_DUR*3]; // transitions into act 1→2, 2→3, 3→void
  // base act from time
  let act=0;
  if(rt>=ACT_DUR*2)act=2; else if(rt>=ACT_DUR)act=1;
  const w=[0,0,0,0];
  // check if near a transition into next
  for(let i=0;i<3;i++){
    const edge=edges[i];
    if(rt>=edge-fade&&rt<=edge+fade){
      const t=Math.max(0,Math.min(1,(rt-(edge-fade))/(fade*2)));
      // from act i to act i+1 (i+1==3 → void)
      w[i]=1-t; w[i+1]=t; return w;
    }
  }
  w[act]=1; return w;
}
function currentActIndex(){
  if(voidMode||runTime>=ACT_DUR*3)return 3;
  const wt=actWeights(runTime);let best=0;
  for(let i=1;i<4;i++)if(wt[i]>wt[best])best=i;
  return best;
}
function maybeAnnounceAct(){
  const a=currentActIndex();
  if(a!==lastActAnnounced&&state==='playing'){
    if(lastActAnnounced>=0||a===3){
      const meta=ACT_META[a];
      texts.push({x:W/2,y:H/2-60,text:meta.name,color:meta.lane,life:1.6,max:1.6,size:a===3?36:28,vy:-28});
      if(a===3){flash=.35;shake=10}
    }
    lastActAnnounced=a;
  }
}
function enterVoid(){
  if(voidMode)return;
  voidMode=true;
  maybeAnnounceAct();
}

function randAt(n){let v=Math.sin(n*92.31+13.7)*43758.54;return v-Math.floor(v)}
const LANES=[125,250,375];
const skyCache={};

function skyFor(act){
  if(skyCache[act])return skyCache[act];
  // cielos a bandas duras estilo SNES (pocos stops, sin blur moderno)
  const g=ctx.createLinearGradient(0,0,0,H);
  if(act===0){g.addColorStop(0,'#081018');g.addColorStop(.28,'#0a1820');g.addColorStop(.55,'#0c2418');g.addColorStop(.78,'#14301c');g.addColorStop(1,'#1a3824')}
  else if(act===1){g.addColorStop(0,'#080610');g.addColorStop(.3,'#100c22');g.addColorStop(.6,'#18142e');g.addColorStop(1,'#22183a')}
  else if(act===2){g.addColorStop(0,'#140606');g.addColorStop(.3,'#280a08');g.addColorStop(.6,'#3a120c');g.addColorStop(1,'#4a1c10')}
  else{g.addColorStop(0,'#080414');g.addColorStop(.3,'#100820');g.addColorStop(.55,'#181030');g.addColorStop(.8,'#1e1438');g.addColorStop(1,'#261848')}
  return skyCache[act]=g;
}
function tileRow(key,y,h,par,extra=0){
  if(!ok(key))return;
  const im=IMG[key],tw=h*im.naturalWidth/im.naturalHeight;
  const shift=(world*par+extra)%tw;
  for(let x=-tw-shift;x<W+tw;x+=tw)ctx.drawImage(im,x,y,tw,h);
}
function drawPixGlow(x,y,r,cols,alpha){
  // glow a bloques (no radial suave) — look 32-bit
  ctx.save();ctx.globalAlpha=alpha;
  for(let i=3;i>=0;i--){
    const s=r*(i+1)/3,a=cols[Math.min(i,cols.length-1)];
    ctx.fillStyle=a;ctx.fillRect(x-s/2,y-s/2,s,s);
  }
  ctx.restore();
}
function drawCRT(){
  // v1.5.4: sin scanlines / rayas CRT horizontales (pedidas fuera)
}

/* v1.8.3: luna pixel-art 32-bit dedicada (assets/moon_32bit.png, hoja 6×2 de 72 px lógicos, escala ×2 sin suavizado):
   disco nítido con contorno oscuro, mares, cráteres con pared en sombra/luz, brillo de borde y halo a bandas con dither.
   bosque amarilla · cementerio blanca · infierno roja · oscuridad = núcleo plateado + fantasmas rojo/cian (anaglifo). */
const MOON_Y=82,MOON_FR=72,MOON_SC=2,MOON_H=MOON_FR*MOON_SC; // disco ≈ 90 px en pantalla
function moonX(){let mx=W-150-((world*.01)%(W+260));if(mx<-120)mx+=W+260;return mx}
// frames: fila 0 discos [bosque, cementerio, infierno, oscuridad, rojo, cian] · fila 1 halos [bosque … oscuridad]
function moonFrame(col,row,x,y,alpha,op){
  if(alpha<.01)return;
  const X=Math.round(x),Y=Math.round(y); // anclada a píxel entero → borde siempre nítido
  ctx.save();ctx.globalAlpha=alpha;if(op)ctx.globalCompositeOperation=op;ctx.imageSmoothingEnabled=false;
  if(ok('moon32'))ctx.drawImage(IMG.moon32,col*MOON_FR,row*MOON_FR,MOON_FR,MOON_FR,X-MOON_H/2,Y-MOON_H/2,MOON_H,MOON_H);
  else if(row===0){ctx.fillStyle=['#f2d460','#e8eefa','#e4582a','#c4c0e2','#d40c34','#00b4c8'][col];ctx.beginPath();ctx.arc(X,Y,45,0,7);ctx.fill()}
  ctx.restore();
}
function drawMoons(wt,fade){
  const mx=moonX();
  for(let i=0;i<3;i++){
    const a=wt[i]*fade;if(a<.02)continue;
    moonFrame(i,1,mx,MOON_Y,.95*a); // halo
    moonFrame(i,0,mx,MOON_Y,a);     // disco
  }
}
function drawStereoMoon(alpha){
  // anaglifo rojo/cian ANCLADO a un núcleo nítido: los fantasmas van detrás (solo asoman como bordes rojo/cian)
  // y un velo tenue encima; desfase lento y estable ~7 px (sin temblor rápido), glitch breve y raro.
  const mx=Math.round(moonX()),gl=Math.sin(t*.83)>.985?1.8:1,off=Math.round((7+Math.sin(t*1.2)*1.5)*gl),jy=gl>1?1:0;
  moonFrame(3,1,mx,MOON_Y,.9*alpha);
  moonFrame(4,0,mx-off,MOON_Y+jy,.95*alpha,'lighter');
  moonFrame(5,0,mx+off,MOON_Y-jy,.95*alpha,'lighter');
  moonFrame(3,0,mx,MOON_Y,alpha);                         // núcleo sólido
  moonFrame(4,0,mx-off,MOON_Y+jy,.22*alpha,'lighter');     // velo estéreo sobre los cráteres
  moonFrame(5,0,mx+off,MOON_Y-jy,.22*alpha,'lighter');
  if(gl>1){ctx.save();ctx.globalAlpha=alpha*.12;ctx.fillStyle='#ff2040';ctx.fillRect(mx-off-50,MOON_Y-2,100,2);ctx.fillStyle='#20f0ff';ctx.fillRect(mx+off-50,MOON_Y+6,100,2);ctx.restore()}
}

/* v1.7: panoramas pintados por acto (parallax horizontal) + luna coloreada encima */
const PAN_KEYS=['bgPanBosque','bgPanCementerio','bgPanInfierno','bgPanOscuridad'];
const PAN_PAR=[.12,.11,.13,.1]; // scroll lento de fondo

function drawPanorama(key,alpha,par){
  if(alpha<.01||!ok(key))return;
  const im=IMG[key];
  const dh=H, dw=dh*im.naturalWidth/im.naturalHeight; // 1800×500 → dw=1800
  let shift=(world*par)%dw; if(shift<0)shift+=dw;
  ctx.save();
  ctx.globalAlpha=alpha;
  // pintura: suavizado ON (sprites SNES siguen con smoothing=false global)
  ctx.imageSmoothingEnabled=true;
  if('imageSmoothingQuality' in ctx)ctx.imageSmoothingQuality='high';
  for(let x=-shift;x<W+dw;x+=dw)ctx.drawImage(im,x,0,dw,dh);
  ctx.restore();
  ctx.imageSmoothingEnabled=false;
  if('imageSmoothingQuality' in ctx)ctx.imageSmoothingQuality='low';
}

function drawActForest(alpha){
  if(alpha<.01)return;
  drawPanorama('bgPanBosque',alpha,PAN_PAR[0]);
  // niebla suave encima del pan (no tapa jugabilidad)
  if(alpha>.2&&ok('bgFog')){
    ctx.save();ctx.globalAlpha=alpha*.28;
    ctx.imageSmoothingEnabled=true;
    tileRow('bgFog',H-FLOOR_H-70,36,.18,0);
    tileRow('bgFog',H-FLOOR_H-40,28,.24,50);
    ctx.restore();ctx.imageSmoothingEnabled=false;
  }
}

function drawActCemetery(alpha){
  if(alpha<.01)return;
  drawPanorama('bgPanCementerio',alpha,PAN_PAR[1]);
  // rayos de luna tenues alineados a la luna del sistema de color
  if(alpha>.15){
    const mx=moonX();
    ctx.save();ctx.globalAlpha=alpha*.45;
    sprite('bgMoonbeam',mx-20,95,100,0,1,1,.7);
    sprite('bgMoonbeam',mx+20,110,80,0,1,1,.5);
    ctx.restore();
  }
}

function drawActHell(alpha){
  if(alpha<.01)return;
  drawPanorama('bgPanInfierno',alpha,PAN_PAR[2]);
  // pulso de lava bajo el playfield (encima del pan, bajo el suelo de castillo)
  if(alpha>.2){
    const gy=H-FLOOR_H;
    ctx.save();
    ctx.globalAlpha=alpha*(.18+.1*Math.sin(t*3));
    for(let x=0;x<W;x+=10){
      ctx.fillStyle=(x/10|0)%2?'#ff501066':'#ffb04044';
      ctx.fillRect(x,gy-14,10,14);
    }
    ctx.restore();
  }
}

function drawActVoid(alpha){
  if(alpha<.01)return;
  // panorama púrpura de ruinas + eclipse enmascarado; luna estereoscópica encima
  drawPanorama('bgPanOscuridad',alpha,PAN_PAR[3]);
  ctx.save();
  ctx.globalAlpha=alpha;
  drawStereoMoon(alpha);
  // viñeta suave a bloques (legibilidad del playfield)
  ctx.globalAlpha=alpha*.28;
  for(let i=0;i<5;i++){
    ctx.fillStyle=`rgba(4,0,16,${.05+i*.045})`;
    ctx.fillRect(i*10,i*8,W-i*20,H-i*16);
  }
  // dientes de techo sutiles
  ctx.globalAlpha=alpha*.55;
  for(let x=0;x<W;x+=30){
    const hh=8+((x/30|0)%3)*5;
    ctx.fillStyle=(x/30|0)%2?'#4a208066':'#2a105088';
    ctx.fillRect(x+6,0,10,hh);
  }
  ctx.restore();
}

/* suelo de castillo — franja inferior visible en todos los actos */
function drawCastleFloor(){
  const y=H-FLOOR_H;
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0); // ignorar shake — suelo anclado al canvas
  ctx.globalAlpha=1;
  // relleno opaco siempre
  ctx.fillStyle='#2a2638';
  ctx.fillRect(0,y,W,FLOOR_H);
  // tiles de piedra (o patrón de respaldo)
  const im=IMG.bgCastleFloor;
  if(im&&im.complete&&im.naturalWidth>0){
    const th=FLOOR_H, tw=Math.max(8, th*im.naturalWidth/im.naturalHeight);
    const shift=(world*.45)%tw;
    for(let x=-tw-shift;x<W+tw;x+=tw)ctx.drawImage(im,x,y,tw,th);
  }else{
    for(let row=0;row<5;row++){
      const bh=FLOOR_H/5, yy=y+row*bh, off=(row%2)*18;
      for(let x=-off-(world*.45%36);x<W+36;x+=36){
        ctx.fillStyle=(row+((x/36)|0))%2?'#6a6480':'#56506a';
        ctx.fillRect(x,yy,34,bh-2);
        ctx.fillStyle='#9a92b0';ctx.fillRect(x,yy,34,2);
        ctx.fillStyle='#3a3448';ctx.fillRect(x,yy+bh-3,34,2);
      }
    }
  }
  // cornisa a bloques (no rayas planas a todo el ancho)
  for(let x=0;x<W;x+=14){
    ctx.fillStyle=(x/14|0)%2?'#d4cce8':'#b8b0c8';ctx.fillRect(x,y,12,5);
    ctx.fillStyle='#5a5468';ctx.fillRect(x+10,y+1,2,5);
    ctx.fillStyle='#3a3448';ctx.fillRect(x,y+5,12,2);
  }
  // sombra corta a bloques sobre el playfield (no franja sólida)
  ctx.fillStyle=voidMode?'#00000028':'#00000044';
  for(let x=0;x<W;x+=10)ctx.fillRect(x,y-6,8,6);
  if(voidMode){
    for(let x=0;x<W;x+=12){ctx.fillStyle='#9a7cff55';ctx.fillRect(x,y-2,8,2)}
  }
  ctx.restore();
}

/* primer plano: acentos ligeros (el panorama ya trae profundidad) */
function drawForeground(){
  const wt=actWeights(state==='playing'||state==='crashing'?runTime:0);
  const a0=wt[0],a1=wt[1],a2=wt[2],a3=wt[3]||0;
  // bosque: enredaderas colgando ocasionales
  if(a0>.08){
    ctx.save();ctx.globalAlpha=a0*.55;
    let shift=world*.55%200;
    for(let i=-1;i<6;i++){
      const x=i*200-shift,k=i+Math.floor(world*.55/200)+90;
      if(k%2===0)sprite('bgVine',x+40,-8+randAt(k)*16,90+randAt(k+1)*30,0,1,1,.85);
    }
    ctx.restore();
  }
  // cementerio: puntas de reja bajas (no tapan sprites)
  if(a1>.08){
    ctx.save();ctx.globalAlpha=a1*.4;
    let shift=world*.5%150;
    for(let i=-1;i<8;i++){
      const x=i*150-shift;
      sprite('bgFencePix',x+50,H-FLOOR_H+10,56,0,1,1,.8);
    }
    ctx.restore();
  }
  // infierno: grietas/glow bajos
  if(a2>.08){
    ctx.save();ctx.globalAlpha=a2*.5;
    let shift=world*.58%170;
    for(let i=-1;i<7;i++){
      const x=i*170-shift;
      sprite('bgCrack',x+70,H-FLOOR_H-2,34,0,1,1,.9);
      drawPixGlow(x+70,H-FLOOR_H,22,['#ffd060','#ff401088','#0000'],.7);
    }
    ctx.restore();
  }
  // oscuridad: shards sutiles
  if(a3>.08||voidMode){
    ctx.save();ctx.globalAlpha=Math.max(a3,.35)*.55;
    let shift=world*.62%140;
    for(let i=-1;i<8;i++){
      const x=i*140-shift;
      sprite('bgShard',x+40,H-FLOOR_H+6,44,0,(i%2?1:-1),1,.75);
    }
    ctx.restore();
  }
}

function drawBg(){
  const wt=actWeights(state==='playing'||state==='crashing'?runTime:0);
  const voidA=wt[3]||0;

  if(voidA>.97){
    drawActVoid(1);
  }else{
    // cielo de respaldo por si el pan aún no cargó
    let order=[0,1,2].sort((a,b)=>wt[b]-wt[a]);
    ctx.globalAlpha=1;ctx.fillStyle=skyFor(order[0]);ctx.fillRect(0,0,W,H);
    for(let i=1;i<3;i++){
      if(wt[order[i]]>.02){ctx.globalAlpha=wt[order[i]];ctx.fillStyle=skyFor(order[i]);ctx.fillRect(0,0,W,H)}
    }
    if(voidA>.02){ctx.globalAlpha=voidA*.7;ctx.fillStyle='#0c0820';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}
    // panoramas con fundido entre actos
    drawActForest(wt[0]*(1-voidA));
    drawActCemetery(wt[1]*(1-voidA));
    drawActHell(wt[2]*(1-voidA));
    // estrellas tenues (si el pan es oscuro)
    for(let i=0;i<20;i++){let x=(i*197-world*.02)%W;if(x<0)x+=W;let y=10+(i*83)%90;
      ctx.globalAlpha=.22*(1-wt[2]*.4)*(1-voidA*.6);
      ctx.fillStyle='#ffffff';ctx.fillRect(x|0,y|0,2,2)}
    ctx.globalAlpha=1;
    // luna coloreada ENCIMA del pan (bosque amarilla · cementerio blanca · infierno roja)
    drawMoons(wt,1-voidA);
    if(voidA>.15)drawActVoid(voidA);
  }

  ctx.globalAlpha=1;
}

/* ---------- dibujo de entidades ---------- */
function drawObstacle(o){
  const cx=o.x+o.w/2,cy=o.y+o.h/2;
  // en oscuridad: halo suave para que siluetas sigan legibles
  if(voidMode)glow(cx,cy,Math.max(o.w,o.h)*.7,'#7a5cff',.16);
  if(o.kind==='menos'){
    const k=o.img,flame=FLAMES.has(k);
    // v1.8.1: aura roja clara en TODOS los obstáculos (menos)
    const pulse=.5+.5*Math.sin(t*5.5+o.bob);
    glow(cx,cy,Math.max(o.w,o.h)*(.95+.08*pulse),'#ff1e3a',.38+.1*pulse);
    glow(cx,cy,Math.max(o.w,o.h)*.55,'#ff6a7a',.22+.06*pulse);
    if(flame)glow(cx,o.y+o.h*.62,Math.max(o.w,o.h)*.75,'#ff7a20',.18+.05*Math.sin(t*9+o.bob));
    else if(k==='menos6')glow(cx,o.y+o.h*.55,o.w*1.2,'#ff2040',.12);
    if(o.place==='ground'&&!flame){ctx.save();ctx.globalAlpha*=.35;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(cx,o.y+o.h+1,o.w*.5,5,0,0,7);ctx.fill();ctx.restore()}
    if(o.place==='ceil'&&k==='menos6'&&o.y>2){ // cadena del relicario
      ctx.save();ctx.strokeStyle='#8a8498';ctx.lineWidth=2;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,o.y+4);ctx.stroke();ctx.restore();
    }
    let ok2;sheenPh=o.bob;
    if(k==='menos2'){ // v1.8.3: espada con destellos (guarda + punta) además del brillo de la hoja
      const fl=o.flying,yy=fl?cy+Math.sin(t*5+o.bob)*1.5:(o.place==='float'?cy+Math.sin(t*3+o.bob)*1.5:cy);
      const rot=fl?Math.PI/2+Math.sin(t*4+o.bob)*.05:0,hh=fl?o.w:o.h;
      ok2=sprite(k,cx,yy,hh,rot,fl?1:(o.flip||1),1);
      const at=ly=>[cx-ly*Math.sin(rot),yy+ly*Math.cos(rot)];
      const cyc=(t*.55+o.bob*.13)%1,[gx,gy]=at(-hh*.33),[tx,ty]=at(hh*.46);
      glint(gx,gy,4+2*Math.sin(t*5+o.bob),.55+.35*Math.sin(t*5+o.bob));
      if(cyc>.24&&cyc<.42)glint(tx,ty,7*Math.sin((cyc-.24)/.18*Math.PI),1);
    }else if(o.flying){ // espada voladora: girada 90°, punta hacia la izquierda
      ok2=sprite(k,cx,cy+Math.sin(t*5+o.bob)*1.5,o.w,Math.PI/2+Math.sin(t*4+o.bob)*.05);
    }else if(flame){ // llama: parpadeo (escala Y + espejo alterno), anclada abajo si está en el suelo
      const sy=1+.07*Math.sin(t*14+o.bob)+.03*Math.sin(t*23+o.bob*2),sx=(Math.sin(t*7+o.bob)>0?1:-1)*(1-.03*Math.sin(t*11+o.bob));
      const yy=o.place==='ground'?o.y+o.h-o.h*sy/2:cy;
      ok2=sprite(k,cx,yy,o.h,0,sx,sy);
    }else if(k==='menos6'){ // relicario: péndulo
      const sw=Math.sin(t*2.2+o.bob)*.12;
      ctx.save();ctx.translate(cx,o.y);ctx.rotate(sw);ok2=sprite(k,0,o.h/2,o.h);ctx.restore();
      glint(cx-o.h*.56*Math.sin(sw),o.y+o.h*.56*Math.cos(sw),3+2.5*Math.max(0,Math.sin(t*3.3+o.bob)),.4+.5*Math.max(0,Math.sin(t*3.3+o.bob)));
    }else if(k==='menos1a'){ // enredadera colgante: se mece
      ctx.save();ctx.translate(cx,o.y);ctx.rotate(Math.sin(t*1.6+o.bob)*.05);ok2=sprite(k,0,o.h/2,o.h);ctx.restore();
    }else{
      const by=o.place==='float'?cy+Math.sin(t*3+o.bob)*1.5:cy;
      ok2=sprite(k,cx,by,o.h,0,o.flip||1,1);
    }
    if(!ok2){ctx.fillStyle=flame?'#ff7a20':k.startsWith('menos1')?'#2d6a32':'#6a7080';ctx.fillRect(o.x+3,o.y+2,o.w-6,o.h-4)}
  }else if(o.kind==='cat'){
    // gato negro sentado en el suelo (fijo)
    ctx.save();ctx.globalAlpha*=.35;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(cx,o.y+o.h+1,o.w*.48,5,0,0,7);ctx.fill();ctx.restore();
    // v1.8.1: gato = poder · aura AZUL clara (coleccionable/power)
    const pu=.5+.5*Math.sin(t*6+o.x*.02);
    glow(cx,cy,58+pu*14,'#2a8cff',.36+pu*.16);glow(cx,cy,42,'#66d4ff',.28+pu*.1);
    drawPowerRing(cx,cy+4,36+pu*4);
    const ch=o.h+10;
    if(!sprite(o.img,cx,o.y+o.h-ch/2+3,ch)){ctx.fillStyle='#1a1224';ctx.beginPath();ctx.ellipse(cx,cy+6,22,24,0,0,7);ctx.fill()}
  }else if(o.kind==='catBat'){
    const pu=.5+.5*Math.sin(t*6+o.bob);
    glow(cx,cy,58+pu*14,'#2a8cff',.36+pu*.16);glow(cx,cy,42,'#66d4ff',.28+pu*.1);
    drawPowerRing(cx,cy,38+pu*4);
    if(!sprite('catBat',cx,cy,60,Math.sin(t*5+o.bob)*.14)){ctx.fillStyle='#1a1224';ctx.beginPath();ctx.arc(cx,cy,24,0,7);ctx.fill()}
  }
}
function drawPowerRing(x,y,r){
  ctx.save();ctx.translate(x,y);ctx.rotate(t*2);ctx.strokeStyle='#66d4ff';ctx.globalAlpha*=.8;ctx.lineWidth=2.5;ctx.setLineDash([6,7]);
  ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.stroke();ctx.restore();
}
/* v1.6: escudo de poder gatuno alrededor del jugador */
function drawShield(){
  if(invulnT<=0)return;
  const x=player.x,y=player.y-4;
  if(invulnT<.9&&Math.sin(t*40)<0)return; // parpadeo al terminar
  const hue=(t*240)%360,pu=.5+.5*Math.sin(t*14);
  glow(x,y,70+pu*8,`hsl(${hue},100%,65%)`,.32);
  ctx.save();ctx.translate(x,y);
  ctx.globalAlpha=.85;ctx.lineWidth=3;ctx.strokeStyle=`hsl(${hue},100%,70%)`;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=14;
  ctx.beginPath();ctx.arc(0,0,48+pu*3,0,7);ctx.stroke();
  ctx.rotate(-t*3);ctx.setLineDash([4,8]);ctx.lineWidth=2;ctx.strokeStyle='#ffffff';ctx.beginPath();ctx.arc(0,0,55,0,7);ctx.stroke();
  ctx.restore();
}
function drawKozmit(c){
  const p=1+.07*Math.sin(t*6+c.ph),bob=c.chainId!=null?(c.mag?0:Math.sin(t*3+c.chainIdx*.5)*2):Math.sin(t*3+c.ph)*4;
  // v1.8.4: guía tenue sobre la trayectoria real entre monedas de la cadena (curva suave + destello a medio camino)
  if(c.chainId!=null&&c.mid&&!c.mag){
    const m=sparkles.find(s=>s.chainId===c.chainId&&s.chainIdx===c.chainIdx+1);
    if(m){const mx=c.x+c.mid.dx,my=c.y+c.mid.dy+bob,tw=.5+.5*Math.sin(t*4.5-c.chainIdx*.9);
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=voidMode?.34:.24;ctx.strokeStyle='#ffe9a0';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(c.x,c.y+bob);ctx.quadraticCurveTo(2*mx-(c.x+m.x)/2,2*my-(c.y+m.y)/2-bob,m.x,m.y+bob);ctx.stroke();
      ctx.globalAlpha=.35+.45*tw;sparkle4(mx,my,3+2.5*tw,'#fff4c8');ctx.restore()}
  }
  const m=masByN(c.v),h=masH(c.v);
  // v1.8.1: aura AZUL clara en todos los coleccionables (mas)
  glow(c.x,c.y+bob,h*1.25,'#2a8cff',.42);
  glow(c.x,c.y+bob,h*.85,'#66d4ff',.28);
  glow(c.x,c.y+bob,h*.7,m.glow,c.v>=6?.4:.28); // tinte del ítem por dentro
  if(c.v>=6){ // raros: anillo giratorio
    ctx.save();ctx.translate(c.x,c.y+bob);ctx.rotate(t*1.4);ctx.strokeStyle='#66d4ff';ctx.globalAlpha=.7;ctx.lineWidth=2;ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(0,0,h*.72,0,7);ctx.stroke();ctx.restore();
  }
  // moneda: gira en X (canto) · resto: leve balanceo
  const spin=c.v===1?Math.max(c.chainId!=null?.42:.18,Math.abs(Math.cos(t*3.2+c.ph))):1;
  if(!sprite(c.img||m.keys[0],c.x,c.y+bob,h*p,c.v===1?0:Math.sin(t*2+c.ph)*.12,spin,1)){
    ctx.save();ctx.translate(c.x,c.y+bob);ctx.rotate(world*.008);ctx.fillStyle=m.glow;starPath(12,5);ctx.fill();ctx.restore()}
}
/* v1.8: jugador de PERFIL mirando a la derecha (pack gótico 32-bit), dibujado tal cual: sin sesgo, sin espejo,
   sin escoba. v1.8.2: resorte squash/stretch + capa/cola/orejas con deformación por tiras. */
const PLAYER_H=80;        // alto del sprite del jugador en carrera
const PLAYER_DY=-12;      // centro del sprite respecto a player.y (pies ≈ player.y+28)
function playerTilt(){return state==='crashing'?player.rot:Math.max(-.22,Math.min(.28,player.vy/900))}
// punto de emisión de la estela (detrás del personaje, a la altura de la cola) en coords mundo
function broomTip(){
  const rot=playerTilt();
  const lx=BROOM.ox+4,ly=BROOM.oy+BROOM.hy; // v1.9: punta de la paja de la escoba (relativo a player.(x,y))
  const c=Math.cos(rot),s=Math.sin(rot);
  return{x:player.x+lx*c-ly*s,y:player.y+lx*s+ly*c,rot};
}
/* v1.9: ESCOBA VOLADORA pixel-art. el aparejo (escoba + personaje de perfil) rota entero con la velocidad vertical
   (rotación, no sesgo). la escoba es solo dibujo: el hitbox del jugador NO cambia (PL_HX/PL_HY). la parte del mango
   que cruza el cuerpo se dibuja encima → se lee como montado. */
const BROOM={fw:128,fh:40,S:2,hy:19,ox:-71,oy:-11,cut:64}; // coords lógicas del sprite; ox/oy = esquina sup-izq relativa a player
const RIG_POP=.42;let rigPop=0,cometIgnA=1;
const COMET_IGN=.55; // s: la estela de la escoba se enciende y se vuelve cometa
function drawBroom(x,y,rot,part,alpha=1,sc=1){
  if(!ok('broom32'))return false;
  const im=IMG.broom32,{fw,fh,S,ox,oy,cut}=BROOM,fr=Math.floor(t*(held?15:9))%4;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);if(rot)ctx.rotate(rot);if(sc!==1)ctx.scale(sc,sc);
  ctx.imageSmoothingEnabled=true;
  if(part==='front')ctx.drawImage(im,(fr*fw+cut)*S,0,(fw-cut)*S,fh*S,ox+cut,oy,fw-cut,fh);
  else ctx.drawImage(im,fr*fw*S,0,fw*S,fh*S,ox,oy,fw,fh);
  ctx.restore();return true;
}
function broomPoof(start){ // nube de partículas al transformarse (local, nunca flash de pantalla)
  const pal=skinTrail(),cols=[...pal.trail,'#ffffff'];
  const spots=start?[[IDLE_X,IDLE_FEET-70,30],[player.x-8,player.y,22]]:[[player.x-8,player.y,18]];
  for(const[x0,y0,n]of spots)for(let i=0;i<n;i++){const a=i/n*Math.PI*2+Math.random()*.4,sp=60+Math.random()*170;
    particles.push({x:x0+(Math.random()-.5)*20,y:y0+(Math.random()-.5)*24,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-30,life:.45+Math.random()*.4,max:.85,size:4+Math.random()*7,color:cols[i%cols.length],g:-40,kind:i%3?'soft':'glint',drag:3.2})}
}
function broomPuff(){ // soplo extra de polvo mágico desde la paja al apretar «vuela»
  const tip=broomTip(),cols=skinTrail().trail;
  for(let i=0;i<8;i++){const life=.35+Math.random()*.35;
    particles.push({x:tip.x+(Math.random()-.5)*8,y:tip.y+(Math.random()-.5)*12,vx:-60-Math.random()*120-speed*.25,vy:(Math.random()-.5)*90+30,life,max:life,size:3+Math.random()*5,color:cols[i%cols.length],g:0,kind:i%2?'soft':'dot',drag:2.4})}
}
/* v1.9: IDLE DE FRENTE (menú): hoja real por personaje, cuadros pixel art a escala entera, sin suavizado.
   respiración en 4 cuadros (reposo · inhala · reposo · exhala, con capa/orejas que se mecen), parpadeo cada ~3 s
   (a veces doble) y un flote a pasos de 1 px lógico — animación de sprite, no interpolación. */
const IDLE_DUR=[.36,.22,.36,.22],IDLE_HOVER=[0,1,2,1],IDLE_X=180,IDLE_FEET=404;
function idleFrame(time,sd=0){
  const cyc=IDLE_DUR[0]+IDLE_DUR[1]+IDLE_DUR[2]+IDLE_DUR[3];let u=((time%cyc)+cyc)%cyc,i=0;while(i<3&&u>IDLE_DUR[i]){u-=IDLE_DUR[i];i++}
  const P=3.3,tt=time+sd,k=Math.floor(tt/P),ph=tt-k*P,h=Math.abs(Math.sin(k*91.7+sd*13.1)),at=.9+h*1.9;
  const bl=(ph>at&&ph<at+.13)||(h>.62&&ph>at+.27&&ph<at+.39);
  return i+(bl?4:0);
}
function drawFrontIdle(g,k,cx,feetY,sc,time,sd=0,still=false){
  const key='front_'+k;if(!ok(key))return false;
  const im=IMG[key],fw=im.naturalWidth/FRONT_FRAMES,fh=im.naturalHeight,f=still?0:idleFrame(time,sd);
  const hov=still?0:IDLE_HOVER[Math.floor((time+sd)*3.1)%4]*sc;
  g.save();g.imageSmoothingEnabled=false;
  g.drawImage(im,f*fw,0,fw,fh,Math.round(cx-fw*sc/2),Math.round(feetY-fh*sc-hov),fw*sc,fh*sc);g.restore();return true;
}
/* v1.8.2: animación más clara — resorte de squash/stretch (anticipación al apretar), aleteo con golpe de ala,
   y deformación por tiras: capa/cola flamean atrás, sombrero/orejas se mecen arriba, pies patalean. */
const ANIM={sq:0,sqV:0,flut:5,flutF:7,lift:0,top:0,legs:2,legF:6,ph:0,phT:0,phL:0};
function animKick(v){ANIM.sqV+=v}
function animTick(dt){
  if(rigPop>0)rigPop=Math.max(0,rigPop-dt);
  const A=ANIM,play=state==='playing',crashing=state==='crashing';
  const rising=play&&player.vy<-50,falling=play&&player.vy>90;
  // resorte squash/stretch: objetivo según vy (subiendo = estirado, cayendo = aplastado)
  const tgt=crashing?0:play?Math.max(-.9,Math.min(1,-player.vy/330)):Math.sin(t*3.1)*.25;
  A.sqV+=((tgt-A.sq)*190-A.sqV*13)*dt;A.sq+=A.sqV*dt;A.sq=Math.max(-1.6,Math.min(1.6,A.sq));
  // capa/cola/sombrero (px en coords del sprite ~240 alto)
  const k=Math.min(1,dt*7);
  const tf=crashing?24:held?17:falling?9:6, ta=crashing?16:held?13:falling?9:6;
  const tl=crashing?0:held?9:falling?-12:-2;       // + = la capa cuelga abajo (subiendo) · − = se infla arriba (cayendo)
  const tt=crashing?0:held?-10:falling?6:0;        // sombrero/orejas: hacia atrás al subir, adelante al caer
  const lg=crashing?10:held?7:falling?2.5:3, lf=crashing?22:held?15:falling?5:6;
  A.flutF+=(tf-A.flutF)*k;A.flut+=(ta-A.flut)*k;A.lift+=(tl-A.lift)*k;A.top+=(tt-A.top)*k;A.legs+=(lg-A.legs)*k;A.legF+=(lf-A.legF)*k;
  A.ph+=A.flutF*dt;A.phT+=(held?11:4.2)*dt;A.phL+=A.legF*dt;
}
function playerAnim(){
  const A=ANIM;
  // aleteo: con impulso, golpe de ala marcado (sube en el downstroke); sin impulso, flote suave
  const bob=held?(-Math.abs(Math.sin(t*11))*6+3):Math.sin(t*4.4)*3.6;
  const sx=1-A.sq*.12,sy=1+A.sq*.15;
  const wob=held?Math.sin(t*22)*.035:Math.sin(t*5)*.02;
  const lean=playerTilt()+wob;
  return{bob,sx,sy,lean};
}
const warpCache={};
function warpCanvas(k){
  const im=IMG[k],iw=im.naturalWidth,ih=im.naturalHeight,P=Math.ceil(ih*.09);
  let w=warpCache[k];
  if(!w){const mk=()=>{const c=document.createElement('canvas');c.width=iw+P*2;c.height=ih+P*2;return c};w=warpCache[k]={a:mk(),b:mk(),P,iw,ih}}
  return w;
}
// deformación en 2 pasadas (filas → dx, columnas → dy); devuelve canvas o null
function warpSkin(k){
  if(!ok(k))return null;
  const A=ANIM,w=warpCanvas(k),{a,b,P,iw,ih}=w,ga=a.getContext('2d'),gb=b.getContext('2d');
  ga.clearRect(0,0,a.width,a.height);gb.clearRect(0,0,b.width,b.height);
  ga.imageSmoothingEnabled=gb.imageSmoothingEnabled=true;
  const im=IMG[k],RS=3;
  // pasada 1 — filas: sombrero/orejas (arriba) se mecen · pies patalean (abajo)
  for(let y=0;y<ih;y+=RS){
    const v=(y+RS/2)/ih;
    const wt=Math.pow(Math.max(0,(.4-v)/.4),1.4),wf=Math.max(0,(v-.8)/.2);
    const dx=wt*(A.top+Math.sin(A.phT)*4.5)+wf*Math.sin(A.phL+v*3)*A.legs;
    ga.drawImage(im,0,y,iw,RS,P+dx,P+y,iw,RS+.6);
  }
  // pasada 2 — columnas: capa/cola (lado de atrás = izquierda) flamean con una onda que viaja hacia atrás
  const CS=3,W2=a.width;
  for(let x=0;x<W2;x+=CS){
    const u=(x-P+CS/2)/iw,wb=Math.pow(Math.max(0,Math.min(1,(.55-u)/.55)),1.5);
    const dy=wb*(A.lift+Math.sin(A.ph*1.0-u*7)*A.flut);
    gb.drawImage(a,x,0,CS,a.height,x,dy,CS+.6,a.height);
  }
  return b;
}
function drawWarped(k,x,y,h,rot,sx,sy){
  const cv=warpSkin(k);if(!cv)return false;
  const w=warpCache[k],sc=h/w.ih,dw=cv.width*sc,dh=cv.height*sc;
  ctx.save();ctx.translate(x,y);if(rot)ctx.rotate(rot);ctx.scale(sx,sy);
  ctx.imageSmoothingEnabled=true;if('imageSmoothingQuality' in ctx)ctx.imageSmoothingQuality='high';
  ctx.drawImage(cv,-dw/2,-dh/2,dw,dh);ctx.restore();return true;
}
/* v1.8.4: COMETA MORADO — dibujo procedural "64-bit": capas de gradientes radiales en mezcla aditiva,
   lóbulos de plasma que orbitan con tonos distintos (violeta, magenta, índigo, lila, toques cian/rosa),
   núcleo blanco-lila, cola-cinta que sigue la historia de la cabeza, remolinos y destellos; silueta del
   personaje adentro. nada de flashes de pantalla: en el aviso final solo el cometa titila suave. */
function cRad(x,y,r,stops,sx=1,sy=1){ctx.save();ctx.translate(x,y);ctx.scale(sx,sy);const g=ctx.createRadialGradient(0,0,0,0,0,r);for(const[o,c]of stops)g.addColorStop(o,c);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.restore()}
const silCache={};
function skinSilhouette(k){
  if(silCache[k])return silCache[k];if(!ok(k))return null;
  const im=IMG[k],w=im.naturalWidth,h=im.naturalHeight,pad=Math.ceil(h*.06),mk=()=>{const c=document.createElement('canvas');c.width=w+pad*2;c.height=h+pad*2;return c};
  const dark=mk(),dg=dark.getContext('2d');dg.drawImage(im,pad,pad);dg.globalCompositeOperation='source-in';
  const gr=dg.createLinearGradient(0,0,0,dark.height);gr.addColorStop(0,'#5a2a9a');gr.addColorStop(1,'#2a0f5c');dg.fillStyle=gr;dg.fillRect(0,0,dark.width,dark.height);
  const lite=mk(),lg=lite.getContext('2d');lg.drawImage(im,pad,pad);lg.globalCompositeOperation='source-in';lg.fillStyle='#f0d8ff';lg.fillRect(0,0,lite.width,lite.height);
  return silCache[k]={dark,lite,pad,h};
}
function cometAlpha(){return cometIgnA*(comet<COMET_WARN?.55+.45*(.5+.5*Math.cos(t*Math.PI*2*(comet<.8?4:2.4))):1)}
function drawComet(){
  const x=player.x+6,y=player.y-4,A=cometAlpha(),hb=282+Math.sin(t*1.15)*18; // tono base: violeta ↔ púrpura-magenta
  const hs=(o,s,l,a)=>`hsla(${((hb+o)%360+360)%360},${s}%,${l}%,${a})`;
  const tr=cometTrail,N=tr.length;
  // 0) base en mezcla normal: cinta afilada + orbe violeta profundo → morado saturado sobre cualquier fondo
  ctx.save();ctx.globalAlpha=A*.62;
  if(N>3){
    const up=[],dn=[];
    for(let i=0;i<N;i++){const p=tr[i],f=(i+1)/N,w=3+30*Math.pow(f,1.25)+Math.sin(t*7+i*.6)*1.5*(1-f);up.push([p.x+6,p.y-w]);dn.push([p.x+6,p.y+w])}
    up.push([x+4,y-34]);dn.push([x+4,y+34]);
    const g=ctx.createLinearGradient(tr[0].x,0,x,0);
    g.addColorStop(0,'rgba(60,200,255,0)');g.addColorStop(.25,hs(-80,95,52,.35));g.addColorStop(.55,hs(-35,95,45,.6));g.addColorStop(.8,hs(30,100,50,.75));g.addColorStop(1,hs(0,100,55,.9));
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(up[0][0],up[0][1]);
    for(let i=1;i<up.length;i++)ctx.lineTo(up[i][0],up[i][1]);
    for(let i=dn.length-1;i>=0;i--)ctx.lineTo(dn[i][0],dn[i][1]);
    ctx.closePath();ctx.fill();
  }
  ctx.globalAlpha=A*.9;
  cRad(x-8,y,62,[[0,hs(0,100,58,.95)],[.45,hs(-14,95,42,.8)],[.8,hs(-30,90,28,.35)],[1,hs(-30,90,20,0)]],1.25,1);
  ctx.restore();
  // 1) silueta del personaje dentro del orbe (debajo del plasma aditivo → se ve "adentro" del cometa)
  const sil=skinSilhouette('skin_'+data.skin),silRot=Math.max(-.2,Math.min(.25,player.vy/1000)),silY=y-1+Math.sin(t*5)*1.2;
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=A;
  // 2) cola: discos suaves sobre la historia de la cabeza (violeta → magenta → índigo → cian en la punta),
  //    con un leve corrimiento de tono por disco para que la cola "tornasole"
  for(let i=0;i<N;i++){const p=tr[i],f=(i+1)/N,r=6+26*Math.pow(f,1.3),o=(f>.7?0:f>.48?48:f>.26?-42:-108)+28*Math.sin(i*.75-t*5),wob=Math.sin(t*9+i*.7)*2*(1-f);
    cRad(p.x+6,p.y+wob,r,[[0,hs(o,100,66,.2*f+.05)],[.5,hs(o,100,55,.12*f+.03)],[1,hs(o,100,45,0)]],1.3,1)}
  // 2b) hebra brillante en el centro de la cola (define la forma)
  if(N>3){const i0=Math.floor(N*.35);ctx.globalAlpha=A*.55;ctx.lineCap='round';ctx.lineJoin='round';
    for(const[lw,c]of[[7,hs(10,100,75,.3)],[2,'rgba(255,240,255,.55)']]){ctx.lineWidth=lw;ctx.strokeStyle=c;ctx.beginPath();ctx.moveTo(tr[i0].x+6,tr[i0].y);
      for(let i=i0+1;i<N;i++)ctx.lineTo(tr[i].x+6,tr[i].y);ctx.lineTo(x,y);ctx.stroke()}
    ctx.globalAlpha=A}
  // 3) halo exterior alargado hacia atrás (forma de lágrima)
  cRad(x-18,y,112,[[0,hs(0,100,62,.42)],[.32,hs(38,100,55,.2)],[.65,hs(-48,95,48,.1)],[1,hs(-48,95,40,0)]],1.4,1);
  // 4) lóbulos de plasma que orbitan, cada uno con su tono (violeta, magenta, índigo, lila, cian, rosa)
  //    (cian y rosa orbitan más afuera → asoman por el borde del orbe)
  const LOB=[[0,100,60,12],[48,100,58,14],[-42,100,56,15],[16,90,74,10],[-100,100,62,26],[72,100,70,24]];
  for(let i=0;i<LOB.length;i++){const[o,sa,l,R]=LOB[i],a=t*(1.7+i*.21)*(i%2?-1:1)+i*1.047,r=R+7*Math.sin(t*2.4+i*1.7);
    cRad(x-4+Math.cos(a)*r*1.3,y+Math.sin(a)*r,(R>20?18:25)+5*Math.sin(t*3.1+i),[[0,hs(o,sa,l,R>20?.6:.42)],[.55,hs(o,sa,l-10,.18)],[1,hs(o,sa,l-20,0)]])}
  ctx.restore();
  // silueta del personaje adentro del orbe (sombra violeta translúcida entre el plasma y el brillo del núcleo)
  if(sil){const h=48,sc=h/sil.h,dw=sil.dark.width*sc,dh=sil.dark.height*sc;
    ctx.save();ctx.translate(x+3,silY);ctx.rotate(silRot);ctx.imageSmoothingEnabled=true;
    ctx.globalAlpha=A*.5;ctx.drawImage(sil.dark,-dw/2,-dh/2,dw,dh);ctx.restore()}
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=A;
  // 5) núcleo lila-blanco + borde de luz del orbe
  cRad(x+4,y-3,30,[[0,'rgba(255,248,255,.34)'],[.4,hs(14,100,80,.22)],[1,hs(14,100,70,0)]]);
  cRad(x+12,y-11,12,[[0,'rgba(255,255,255,.7)'],[1,'rgba(255,235,255,0)']]);
  ctx.globalAlpha=A*.5;ctx.strokeStyle=hs(20,100,80,1);ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(x-2,y,36,32,0,0,7);ctx.stroke();
  // contorno lila tenue de la silueta
  if(sil){const h=46,sc=h/sil.h,dw=sil.lite.width*sc,dh=sil.lite.height*sc;
    ctx.save();ctx.translate(x+3,silY);ctx.rotate(silRot);ctx.imageSmoothingEnabled=true;ctx.globalAlpha=A*.22;ctx.drawImage(sil.lite,-dw/2,-dh/2,dw,dh);ctx.restore()}
  ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';
  // 6) reflejo interior encima de la silueta (se siente "dentro" del plasma)
  ctx.globalAlpha=A*.45;cRad(x+12,y-12,13,[[0,'rgba(255,255,255,.85)'],[1,'rgba(255,230,255,0)']]);
  // 7) remolinos de energía (arcos parciales con brillo, distinto ritmo y tono)
  const SW=[[30,0],[-60,1],[60,2],[-105,3]];
  for(const[o,k]of SW){ctx.globalAlpha=A*(.55+.2*Math.sin(t*3+k));ctx.strokeStyle=hs(o,100,70,1);ctx.shadowColor=hs(o,100,60,1);ctx.shadowBlur=8;ctx.lineWidth=2.8-k*.4;ctx.lineCap='round';
    const st=t*(2.3+k*.6)*(k%2?-1:1)+k*1.6;ctx.beginPath();ctx.ellipse(x-4,y,42+k*7,31+k*5,0,st,st+1.3+k*.25);ctx.stroke()}
  ctx.shadowBlur=0;
  // 8) destellos alrededor
  for(let k=0;k<7;k++){const ph=t*1.9+k*.9,tw=Math.max(0,Math.sin(t*5.3+k*2.1));if(tw<.15)continue;
    const r=40+12*Math.sin(ph*1.3);ctx.globalAlpha=A*tw;sparkle4(x-10+Math.cos(ph)*r*1.35,y+Math.sin(ph)*r,3+4.5*tw,k%3?'#ffffff':COMET_COLS[(k*3)%COMET_COLS.length])}
  ctx.restore();
}
function drawRig(alpha=1){ // escoba + personaje de perfil (en carrera)
  const x=player.x,y=player.y,a=playerAnim(),sk='skin_'+data.skin;
  const pk=rigPop>0?1-rigPop/RIG_POP:1,sc=pk<.25?.55:pk<.5?.82:pk<.75?1.1:1; // pop a pasos al transformarse
  const c=Math.cos(a.lean),s=Math.sin(a.lean),foot=PLAYER_H*.5*(a.sy-1);
  const bx=x,by=y+a.bob*.6;
  ctx.save();ctx.globalAlpha*=alpha;
  if(sc!==1){ctx.translate(x,y);ctx.scale(sc,sc);ctx.translate(-x,-y)}
  drawBroom(bx,by,a.lean,'back');
  const px=x-PLAYER_DY*s+foot*s,py=y+PLAYER_DY*c+a.bob-foot*c;
  if(!(drawWarped(sk,px,py,PLAYER_H,a.lean,a.sx,a.sy)||sprite('player',px,py,PLAYER_H-6,a.lean,a.sx,a.sy)||sprite('gz01',px,py,PLAYER_H-10,a.lean,a.sx,a.sy)))drawFallback(px,py,a.lean);
  drawBroom(bx,by,a.lean,'front');
  ctx.restore();
}
function drawMascot(){
  if(comet>0&&state==='playing'){ // v1.9: la estela de la escoba se enciende y se convierte en el cometa
    const ig=Math.max(0,Math.min(1,(COMET_DUR-comet)/COMET_IGN));
    if(ig<1){
      drawRig(1-ig);
      const tip=broomTip();ctx.save();ctx.globalCompositeOperation='lighter';
      for(let i=0;i<7;i++){const f=i/6,px=tip.x+(player.x-tip.x)*f*ig,py=tip.y+(player.y-4-tip.y)*f*ig,r=(10+26*ig)*(1-f*.5)*(.85+.15*Math.sin(t*20+i));
        ctx.globalAlpha=.55*(1-f*.4)*Math.min(1,ig*3);ctx.drawImage(softDot(COMET_COLS[i%COMET_COLS.length]),px-r,py-r,r*2,r*2)}
      ctx.restore();
    }
    if(ig>0){const tip=broomTip(),e=1-Math.pow(1-ig,3),sc=.28+.72*e;
      ctx.save();ctx.translate(tip.x,tip.y);ctx.scale(sc,sc);ctx.translate(-tip.x,-tip.y);cometIgnA=Math.min(1,ig*1.6);drawComet();cometIgnA=1;ctx.restore()}
    return;
  }
  const x=player.x,y=player.y;
  if(cometGrace>0&&state==='playing'){const g=cometGrace/COMET_GRACE;glow(x,y-6,72,'#b06cff',.4*g);glow(x,y-6,44,'#ff7ce0',.22*g)}
  const palG=skinTrail(),front=state!=='playing'&&state!=='crashing';
  if(!front)glow(x,y+PLAYER_DY,58,held?palG.trail[0]:palG.idle[0],held?.45:.3);
  const sk='skin_'+data.skin;
  if(front){ // v1.9: menú — personaje DE FRENTE con idle pixel art (respira, parpadea, capa/orejas), flotando en su lugar
    glow(IDLE_X,IDLE_FEET+24,46,palG.idle[0],.28);
    ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='#0b0718';ctx.beginPath();ctx.ellipse(IDLE_X,IDLE_FEET+26,34-IDLE_HOVER[Math.floor(t*3.1)%4]*2,6,0,0,7);ctx.fill();ctx.restore();
    if(drawFrontIdle(ctx,data.skin,IDLE_X,IDLE_FEET,FRONT_SC,t))return;
    const bob=Math.sin(t*2.4)*5; // respaldo si la hoja de frente no cargó: perfil como antes
    if(!(drawWarped(sk,x,y-6+bob,86,0,1,1)||sprite('player',x,y-6+bob,80)||sprite('gz01',x,y-6+bob,74)))drawFallback(x,y+bob,0);
    return;
  }
  // sombra mágica bajo la escoba — se encoge al subir
  glow(x-14,y+30,40*(1-ANIM.sq*.15),held?palG.trail[1]||palG.trail[0]:palG.idle[1]||palG.idle[0],held?.3:.15);
  if(cometGrace>COMET_GRACE-.5&&state==='playing'){const tip=broomTip(),g=(cometGrace-(COMET_GRACE-.5))/.5;glow(tip.x,tip.y,40,'#b06cff',.55*g);glow(tip.x,tip.y,22,'#ff7ce0',.4*g)} // la paja aún arde morada al volver
  drawRig();
  drawShield();
}
function drawFallback(x,y,rot){ // figura de respaldo de frente
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,0,25,29,0,0,7);ctx.fill();
  ctx.fillStyle='#b8a8e8';ctx.beginPath();ctx.ellipse(0,0,21,25,0,0,7);ctx.fill();
  ctx.fillStyle='#7a5cc8';ctx.beginPath();ctx.ellipse(0,-4,17,8,0,0,7);ctx.fill();
  ctx.fillStyle='#171326';ctx.beginPath();ctx.arc(-7,-4,3,0,7);ctx.arc(7,-4,3,0,7);ctx.fill();
  ctx.restore();
}
const softCache={};
function softDot(col){ // punto de luz suave pre-renderizado (para mezclar en 'lighter')
  if(softCache[col])return softCache[col];
  const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d'),gr=g.createRadialGradient(24,24,0,24,24,24);
  gr.addColorStop(0,'rgba(255,255,255,.75)');gr.addColorStop(.14,col);gr.addColorStop(.45,col+'66');gr.addColorStop(1,col+'00');
  g.fillStyle=gr;g.fillRect(0,0,48,48);return softCache[col]=c;
}
function sparkle4(x,y,s,col){ctx.save();ctx.translate(x,y);ctx.fillStyle=col;starPath(s,s*.2,4);ctx.fill();ctx.rotate(Math.PI/4);ctx.globalAlpha*=.5;starPath(s*.5,s*.15,4);ctx.fill();ctx.restore()}
function drawParticles(){
  for(const p of particles){
    const a=Math.max(0,p.life/p.max);
    if(p.kind==='soft'||p.kind==='glint'||p.kind==='ring'){
      ctx.save();ctx.globalCompositeOperation='lighter';
      if(p.kind==='soft'){ctx.globalAlpha=Math.min(1,a*.95);const r=p.size*(1.3+1.2*a);ctx.drawImage(softDot(p.color),p.x-r,p.y-r,r*2,r*2)}
      else if(p.kind==='glint'){ctx.globalAlpha=Math.min(1,a*1.2);sparkle4(p.x,p.y,p.size*(1.2+a)*(.7+.3*Math.sin(p.life*28)),p.color)}
      else{const r=p.r0+(p.r1-p.r0)*(1-a*a);ctx.globalAlpha=a*.85;ctx.strokeStyle=p.color;ctx.lineWidth=1+p.size*a;ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.stroke()}
      ctx.restore();continue;
    }
    if(p.kind==='shard'){ctx.save();ctx.globalAlpha=Math.min(1,a*1.3);ctx.translate(p.x,p.y);ctx.rotate(p.rot+p.life*9);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size*.3,p.size,p.size*.6);ctx.restore();continue}
    const br=p.bright||0;
    ctx.globalAlpha=Math.min(1,a*(.85+br*.5));
    ctx.fillStyle=p.color;
    if(br>.4){ctx.shadowColor=p.color;ctx.shadowBlur=6+br*10}
    if(p.kind==='star'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.life*6);starPath(p.size*1.6,p.size*.6,4);ctx.fill();ctx.restore()}
    else{ctx.beginPath();ctx.arc(p.x,p.y,p.size*(.4+.6*a),0,7);ctx.fill()}
    ctx.shadowBlur=0;
  }
  ctx.globalAlpha=1;
}
function drawTexts(){
  ctx.textAlign='center';
  for(const f of texts){const a=Math.min(1,f.life/f.max*2);ctx.globalAlpha=a;ctx.font=`900 ${f.size}px system-ui,sans-serif`;ctx.lineWidth=5;ctx.strokeStyle='#110d24';ctx.strokeText(f.text,f.x,f.y);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y)}
  ctx.globalAlpha=1;ctx.textAlign='left';
}
function draw(){
  ctx.save();
  if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  drawBg();
  for(const c of sparkles)drawKozmit(c);
  drawParticles();drawMascot();
  // primer plano delante del jugador (profundidad)
  drawForeground();
  // v1.5.5: obstáculos sticker encima del primer plano → siempre legibles (antes los tapaban árboles/rejas)
  if(mode==='practice'&&state==='playing')ctx.globalAlpha=.85;
  for(const o of obs)drawObstacle(o);
  ctx.globalAlpha=1;
  drawTexts();
  if(state==='playing'||state==='crashing'){
    const ai=currentActIndex(),meta=ACT_META[ai];
    ctx.textAlign='center';ctx.font='800 12px system-ui,sans-serif';ctx.lineWidth=3;ctx.strokeStyle='#110d24cc';
    ctx.strokeText(meta.name,W/2,28);ctx.fillStyle=meta.lane;ctx.fillText(meta.name,W/2,28);
    if(invulnT>0){ // barra de poder gatuno
      const bw=150,bx=W/2-bw/2,by=40;
      ctx.fillStyle='#110d24cc';ctx.fillRect(bx-2,by-2,bw+4,10);
      ctx.fillStyle=`hsl(${(t*240)%360},100%,62%)`;ctx.fillRect(bx,by,bw*Math.min(1,invulnT/INVULN_DUR),6);
      ctx.font='900 14px system-ui,sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#110d24';
      const tx='🐈‍⬛ poder gatuno '+invulnT.toFixed(1)+' s';ctx.strokeText(tx,W/2,64);ctx.fillStyle='#d7ff58';ctx.fillText(tx,W/2,64);
    }
    if(comet>0){ // v1.8.4: barra del cometa morado (fija, sin parpadeo)
      const bw=170,bx=W/2-bw/2,by=invulnT>0?78:40;
      ctx.fillStyle='#110d24cc';ctx.fillRect(bx-2,by-2,bw+4,10);
      const g=ctx.createLinearGradient(bx,0,bx+bw,0);g.addColorStop(0,'#5a4cff');g.addColorStop(.5,'#b06cff');g.addColorStop(1,'#ff5cd6');
      ctx.fillStyle=g;ctx.fillRect(bx,by,bw*Math.min(1,comet/COMET_DUR),6);
      ctx.font='900 14px system-ui,sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#110d24';
      const tx='cometa morado '+Math.max(0,comet).toFixed(1)+' s';ctx.strokeText(tx,W/2,by+24);ctx.fillStyle='#e2b8ff';ctx.fillText(tx,W/2,by+24);
    }
    ctx.textAlign='left';
  }
  // v1.8.3: sin velo/parpadeo de pantalla completa al apretar «vuela» (queda la estela, el resorte y el sonido)
  ctx.restore();
  // suelo anclado (fuera del shake) — siempre visible abajo
  drawCastleFloor();
  drawFloorHud();
  drawCRT();
  if(flash>0){ctx.fillStyle=`rgba(255,255,255,${Math.min(.7,flash*3)})`;ctx.fillRect(0,0,W,H)}
}

/* v1.8.4: hud sobre la franja de piedra (antes el contador quedaba tapado por el suelo): monedas + medidor del cometa */
function drawFloorHud(){
  if(state!=='playing'&&state!=='crashing')return;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  const y=H-FLOOR_H/2+4;
  ctx.fillStyle='#110d24a8';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(8,H-FLOOR_H+12,300,40,10);else ctx.rect(8,H-FLOOR_H+12,300,40);ctx.fill();
  if(!sprite('mas1',28,y-2,24)){ctx.save();ctx.translate(28,y-2);ctx.fillStyle='#d7ff58';starPath(11,5);ctx.fill();ctx.restore()}
  ctx.textAlign='left';ctx.font='900 18px system-ui,sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#110d24';ctx.fillStyle='#fff';
  ctx.strokeText(String(runCoins),44,y+5);ctx.fillText(String(runCoins),44,y+5);
  const bx=110,bw=126,by=y,bh=8,f=comet>0?comet/COMET_DUR:cometMeter/COMET_EVERY;
  ctx.font='800 11px system-ui,sans-serif';ctx.lineWidth=3;
  const lab=comet>0?'¡cometa morado!':cometGrace>0?'cometa · gracia':'cometa morado';
  ctx.strokeText(lab,bx,by-5);ctx.fillStyle='#e2c8ff';ctx.fillText(lab,bx,by-5);
  ctx.fillStyle='#0a0718';ctx.fillRect(bx-2,by-2,bw+4,bh+4);
  const g=ctx.createLinearGradient(bx,0,bx+bw,0);g.addColorStop(0,'#5a4cff');g.addColorStop(.55,'#b06cff');g.addColorStop(1,'#ff5cd6');
  ctx.fillStyle=g;ctx.fillRect(bx,by,bw*Math.max(0,Math.min(1,f)),bh);
  if(comet<=0){ctx.fillStyle='#0a071888';for(let i=1;i<5;i++)ctx.fillRect(Math.round(bx+bw*i/5)-1,by,1,bh)}
  const tx=comet>0?comet.toFixed(1)+' s':cometMeter+'/'+COMET_EVERY;
  ctx.font='800 12px system-ui,sans-serif';ctx.strokeText(tx,bx+bw+8,by+8);ctx.fillStyle='#fff';ctx.fillText(tx,bx+bw+8,by+8);
  ctx.restore();
}
/* ---------- actualización ---------- */
function emitTrail(dt){
  boostT+=dt;
  const tip=broomTip();
  const pal=skinTrail();
  const spdF=Math.max(0,Math.min(1,(speed-250)/(voidMode?450:250)));
  const power=(held?1:.22)*(0.45+spdF*0.9+(held?Math.min(.35,boostT*.15):0));
  const n=held?Math.floor(3+power*7+spdF*3):(Math.random()<.4?1:0); // v1.9: sin «vuela» la paja suelta un polvito mágico
  const cols=held?pal.trail:pal.idle;
  for(let i=0;i<n;i++){
    const ox=(Math.random()-.5)*(10+power*14),oy=(Math.random()-.5)*(8+power*10);
    const life=.3+power*.55+Math.random()*.35;
    particles.push({
      x:tip.x+ox,y:tip.y+oy,
      vx:-speed*(.5+.25*power)-Math.random()*(90+power*120),
      vy:(held?50+power*50:15)+(Math.random()-.4)*(70+power*60),
      life,max:life+.05,
      size:(held?2.2:1.2)+power*4.5+Math.random()*2.2,
      color:cols[Math.floor(Math.random()*cols.length)],
      g:0,kind:held&&(Math.random()<.25+power*.25)?'star':'dot',
      bright:power
    });
  }
}
function burst(x,y,v){
  const g=masByN(v).glow;
  const cols=v>=6?[g,'#ffd46a','#ffffff',g]:v>=3?[g,'#d8b4ff','#ffffff']:v===2?['#b05cff','#d8b4ff','#ffffff']:['#ffd84a','#ffe9a0','#ffffff'];
  const n=Math.round(12+v*4);
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2+Math.random()*.3,s=120+Math.random()*(v>=6?300:200);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.4+Math.random()*.4,max:.8,size:2+Math.random()*3,color:cols[i%cols.length],g:120,kind:i%2?'star':'dot',drag:3})}
}
/* ---------- v1.8.4: cometa morado ---------- */
const COMET_COLS=['#b06cff','#ff5cd6','#6a5cff','#d8b4ff','#7af0ff','#ff9be8','#8a3cff','#f4e8ff'];
function cometBurst(x,y,out){ // estallido local de transformación (sin flash de pantalla)
  for(let i=0;i<46;i++){const a=i/46*Math.PI*2+Math.random()*.2,s=(out?160:90)+Math.random()*260;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.5+Math.random()*.5,max:1,size:3+Math.random()*5,color:COMET_COLS[i%COMET_COLS.length],g:0,kind:i%3?'soft':'glint',drag:2.6})}
  particles.push({x,y,vx:0,vy:0,life:.6,max:.6,kind:'ring',r0:18,r1:out?150:110,color:'#d8b4ff',size:3});
  particles.push({x,y,vx:0,vy:0,life:.45,max:.45,kind:'ring',r0:10,r1:out?95:70,color:'#ff7ce0',size:2});
}
function startComet(){
  comet=COMET_DUR;cometGrace=0;cometWarnAt=COMET_WARN;cometTrail=[];Sound.cometOn();Sound.setComet(true);shake=Math.max(shake,4);
  cometBurst(player.x,player.y-4,true);
  texts.push({x:W/2,y:H/2-50,text:'¡cometa morado!',color:'#e2b8ff',life:1.6,max:1.6,size:36,vy:-24});
  texts.push({x:W/2,y:H/2-20,text:'invencible · rompe obstáculos · imán',color:'#ffd6f6',life:1.6,max:1.6,size:15,vy:-24});
}
function endComet(){
  comet=0;cometGrace=COMET_GRACE;cometTrail=[];Sound.cometOff();Sound.setComet(false);cometBurst(player.x,player.y-4,false);rigPop=RIG_POP*.7; // v1.9: vuelve a la escoba
  texts.push({x:player.x+40,y:player.y-46,text:'fin del cometa',color:'#c8b0ff',life:.9,max:.9,size:16,vy:-40});
}
function emitComet(dt){
  const n=Math.random()<.5?4:3;
  for(let i=0;i<n;i++){const life=.35+Math.random()*.45;particles.push({x:player.x-12+(Math.random()-.5)*14,y:player.y-4+(Math.random()-.5)*20,vx:-speed*(.55+Math.random()*.4)-40,vy:(Math.random()-.5)*70,life,max:life,size:3+Math.random()*6,color:COMET_COLS[Math.floor(Math.random()*COMET_COLS.length)],g:0,kind:'soft',drag:.6})}
  if(Math.random()<.6){const life=.4+Math.random()*.5;particles.push({x:player.x-20+(Math.random()-.5)*30,y:player.y-4+(Math.random()-.5)*36,vx:-speed*(.45+Math.random()*.3),vy:(Math.random()-.5)*40,life,max:life,size:2+Math.random()*3,color:Math.random()<.5?'#ffffff':COMET_COLS[Math.floor(Math.random()*COMET_COLS.length)],g:0,kind:'glint'})}
}
function smashObstacle(o){ // el obstáculo estalla en trozos + chispas moradas, pequeño bonus
  const cx=o.x+o.w/2,cy=o.y+o.h/2,n=Math.min(42,16+Math.round((o.w+o.h)/8));
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=120+Math.random()*300,chunk=i%3===0;
    particles.push({x:cx+(Math.random()-.5)*o.w*.6,y:cy+(Math.random()-.5)*o.h*.6,vx:Math.cos(a)*s+120,vy:Math.sin(a)*s-60,life:.5+Math.random()*.5,max:1,
      size:3+Math.random()*(chunk?4:5),color:chunk?['#ff3b4a','#ff9b42','#d8d4e8','#8a8498'][i%4]:COMET_COLS[i%COMET_COLS.length],g:chunk?520:0,kind:chunk?'shard':'soft',drag:chunk?0:2.2,rot:Math.random()*6})}
  particles.push({x:cx,y:cy,vx:0,vy:0,life:.4,max:.4,kind:'ring',r0:10,r1:Math.max(60,Math.max(o.w,o.h)*.8),color:'#ff9be8',size:2.5});
  Sound.smash();shake=Math.max(shake,5);
  if(mode==='real'){runCoins+=COMET_SMASH;score+=20*COMET_SMASH}
  texts.push({x:cx,y:cy-30,text:mode==='real'?'¡pum! +'+COMET_SMASH+' ✦':'¡pum!',color:'#ffb8f0',life:.8,max:.8,size:20,vy:-55});
}
function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){particles.splice(i,1);continue}
    if(p.drag){p.vx*=1-p.drag*dt;p.vy*=1-p.drag*dt}p.vy+=(p.g||0)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}
  if(particles.length>700)particles.splice(0,particles.length-700);
  for(let i=texts.length-1;i>=0;i--){const f=texts[i];f.life-=dt;f.y+=(f.vy||-40)*dt;if(f.life<=0)texts.splice(i,1)}
  shake=Math.max(0,shake-dt*40);flash=Math.max(0,flash-dt);
}
function update(dt,now){
  runTime+=dt;
  if(runTime>=ACT_DUR*3)enterVoid();
  world+=speed*dt;
  // velocidad: normal hasta acto 3; en oscuridad mucho más agresiva
  if(voidMode){
    const voidT=runTime-ACT_DUR*3;
    speed=Math.min(680,490+voidT*5.2+world*.009);
  }else{
    // v1.8.1: arranque más lento / rampa más suave
    speed=Math.min(500,230+world*.017+runTime*.95);
  }
  if(mode==='real')score+=dt*(speed/8);else{practiceLeft-=dt;$('#timer').textContent=Math.max(0,practiceLeft).toFixed(1)+' seg'}
  $('#distance').textContent=(mode==='practice'?Math.floor(world/12):Math.floor(score))+' m';
  if(invulnT>0){invulnT-=dt;
    if(Math.random()<.5){const a=Math.random()*7;particles.push({x:player.x+Math.cos(a)*48,y:player.y-4+Math.sin(a)*48,vx:-speed*.3,vy:-20,life:.4,max:.4,size:2+Math.random()*2,color:`hsl(${(t*240)%360},100%,70%)`,g:0,kind:'star',bright:.8})}
    if(invulnT<=0){invulnT=0;Sound.powerEnd();texts.push({x:player.x+30,y:player.y-44,text:'fin del poder',color:'#c8b0ff',life:.8,max:.8,size:16,vy:-40})}}
  player.vy+=(held?-980:720)*dt;player.vy=Math.max(-370,Math.min(430,player.vy));player.y+=player.vy*dt;
  // v1.8.4: cometa morado (cola con historia de la cabeza, chispas, aviso suave en los últimos 2 s)
  if(comet>0){comet-=dt;
    for(const p of cometTrail)p.x-=speed*dt*1.5;
    cometTrail.push({x:player.x,y:player.y-4});
    while(cometTrail.length>36||(cometTrail.length&&cometTrail[0].x<player.x-330))cometTrail.shift();
    emitComet(dt);
    if(comet<cometWarnAt&&cometWarnAt>.5){cometWarnAt-=1;Sound.cometWarn()}
    if(comet<=0)endComet();
  }else{if(cometGrace>0)cometGrace=Math.max(0,cometGrace-dt);emitTrail(dt)}
  spawnIn-=dt;
  if(spawnIn<=0){
    spawnShift=speed*dt;obstacle();spawnShift=0;
    if(voidMode)spawnIn=Math.max(.38,.72- (runTime-ACT_DUR*3)*.009)+rand()*.26;
    else spawnIn=Math.max(.82,1.7-world/11000-runTime*.0032)+rand()*.55;
  }
  Sound.setStage(currentActIndex());
  maybeAnnounceAct();
  for(let i=obs.length-1;i>=0;i--){let o=obs[i];o.x-=speed*dt;
    if(!o.fixed){
      if(o.kind==='menos'){
        if(o.flying){o.y+=Math.sin(now/150+o.bob)*(voidMode?60:44)*dt;o.x-=(voidMode?80:50)*dt} // espada voladora: más rápida
        else if(o.img==='menos6')o.y+=Math.sin(now/220+o.bob)*(voidMode?40:30)*dt;               // relicario flotante
        else o.y+=Math.sin(now/170+o.bob)*(voidMode?55:40)*dt;                                     // fuego fatuo
      }
      else if(o.kind==='catBat'){o.y+=Math.sin(now/200+o.bob)*(voidMode?70:52)*dt;o.x-=(voidMode?40:20)*dt}
    }
    if(hit(o)){
      if(TESTLOG&&o.kind==='menos'){TESTLOG.hits.push(runTime);(TESTLOG.hitInfo||(TESTLOG.hitInfo=[])).push({o,rt:runTime,img:o.img,place:o.place,fixed:o.fixed,flying:o.flying,x:o.x,y:o.y,w:o.w,h:o.h,py:player.y,born:o.born})}
      if(o.power){ // v1.6: gato = invencible 3 s
        invulnT=INVULN_DUR;Sound.power();flash=.12;shake=5;
        const cx=o.x+o.w/2,cy=o.y+o.h/2;
        for(let k=0;k<30;k++){const a=k/30*Math.PI*2,sp=140+Math.random()*200;particles.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.6,max:.6,size:2+Math.random()*3,color:['#d7ff58','#b05cff','#ffffff','#66f4ff'][k%4],g:60,kind:k%2?'star':'dot',drag:3})}
        texts.push({x:cx,y:cy-40,text:'¡poder gatuno! 3 s',color:'#d7ff58',life:1.1,max:1.1,size:24,vy:-50});
        obs.splice(i,1);continue;
      }
      if(comet>0&&o.kind==='menos'){smashObstacle(o);obs.splice(i,1);continue} // v1.8.4: el cometa lo hace añicos
      if(cometGrace>0){o.shielded=true} // gracia tras el cometa: atraviesa sin daño
      else if(invulnT>0){if(!o.shielded){o.shielded=true;Sound.shieldHit()}} // atraviesa sin daño
      else if(mode==='real'&&!TESTCFG.god){crash();return}
      else
      if(!o.bumped){o.bumped=true;Sound.bump();shake=4;texts.push({x:player.x+20,y:player.y-36,text:'¡uy! choque',color:'#ff9bd6',life:.7,max:.7,size:18,vy:-50})}
    }
    if(o.x+o.w<-60)obs.splice(i,1)}
  for(let i=sparkles.length-1;i>=0;i--){let c=sparkles[i];c.x-=speed*dt;
    if(comet>0){ // imán del cometa: atrae lo que viene adelante
      const dx=c.x-player.x,dy=c.y-player.y;
      if(dx<360&&dx>-70&&Math.abs(dy)<320){const k=Math.min(1,dt*(5+Math.max(0,360-Math.abs(dx))*.022));c.x-=dx*k*.7;c.y-=dy*k;c.mag=1}
    }
    const rad=masRad(c.v);
    if(Math.hypot(c.x-player.x,c.y-player.y)<rad){
      let gained=c.v, chainBonus=0;
      if(c.chainId&&chains[c.chainId]){
        const ch=chains[c.chainId];
        ch.got++;
        if(ch.got>=ch.total){
          // v1.8.4: ¡cadena perfecta! bonus = largo × dificultad (+2 por cada cadena seguida de la racha)
          chainStreak++;
          chainBonus=Math.max(ch.total,Math.round(ch.total*ch.mult))+(chainStreak-1)*2;
          gained+=chainBonus;
          Sound.chainPerfect(chainStreak);
          const sz=18+Math.min(10,ch.total*.8+ch.diff*6);
          texts.push({x:Math.min(W-140,c.x+20),y:c.y-44,text:'¡cadena perfecta! +'+chainBonus+' ✦',color:'#ffe066',life:1.25,max:1.25,size:sz,vy:-50});
          if(chainStreak>1)texts.push({x:Math.min(W-140,c.x+20),y:c.y-20,text:'racha ×'+chainStreak,color:'#d8b4ff',life:1.1,max:1.1,size:15,vy:-50});
          for(let k=0;k<14;k++){const a=k/14*Math.PI*2;particles.push({x:c.x,y:c.y,vx:Math.cos(a)*190,vy:Math.sin(a)*190,life:.55,max:.55,size:3+Math.random()*2,color:k%2?'#ffe9a0':'#ffffff',g:0,kind:'glint',drag:2.5})}
          if(TESTLOG)TESTLOG.done[c.chainId]=runTime;
          delete chains[c.chainId];
        }
      }
      if(mode==='real'){runCoins+=gained;score+=20*gained}
      // v1.8.4: medidor del cometa — cada objeto recogido fuera del cometa suma 1; a los 50 → ¡cometa morado!
      if(comet<=0&&!TESTCFG.noComet&&++cometMeter>=COMET_EVERY){cometMeter=0;startComet()}
      const mm=masByN(c.v);
      Sound.collect(c.v);burst(c.x,c.y,c.v);
      const label=mode==='real'?(c.v>=3&&!c.chainId?`+${c.v} ✦ ${mm.name}`:`+${c.v} ✦`):'✦';
      texts.push({x:c.x,y:c.y-18,text:label,color:c.v>=6?'#ffb0c0':c.v>=3?'#d8b4ff':'#ffe066',life:c.v>=6?.95:.7,max:c.v>=6?.95:.7,size:c.v>=6?24:c.v>=3?20:18,vy:-60});
      sparkles.splice(i,1)}
    else if(c.x<-40){
      // cadena incompleta: se siente como fallo (penalización leve una sola vez)
      if(c.chainId&&chains[c.chainId]&&!chains[c.chainId].missed){
        const ch=chains[c.chainId];
        ch.missed=true;chainStreak=0;if(TESTLOG)TESTLOG.missed[c.chainId]=runTime;
        const left=Math.max(0,ch.total-ch.got);
        const pen=Math.max(1,Math.ceil(left*(.4+ch.diff*.6)));
        if(mode==='real'){
          runCoins=Math.max(0,runCoins-pen);
          score=Math.max(0,score-12*pen);
        }
        texts.push({x:Math.max(60,c.x),y:c.y-24,text:'cadena rota −'+pen+' ✦',color:'#ff6b9a',life:.9,max:.9,size:16,vy:-40});
        delete chains[c.chainId];
      }
      sparkles.splice(i,1)}
  }
  if(invulnT>0||comet>0||cometGrace>0){ // con poder / cometa: rebota en techo/suelo en vez de chocar
    if(player.y<30){player.y=30;player.vy=Math.abs(player.vy)*.45}
    if(player.y>H-FLOOR_H-24){player.y=H-FLOOR_H-24;player.vy=-Math.abs(player.vy)*.45}
  }
  if(mode==='real'&&!TESTCFG.god&&(player.y<14||player.y>H-FLOOR_H-4)){crash();return}
  if(TESTCFG.god){player.y=Math.max(14,Math.min(H-FLOOR_H-4,player.y))}
  if(mode==='practice'){
    if(player.y<30){player.y=30;player.vy=Math.abs(player.vy)*.45}
    if(player.y>H-FLOOR_H-24){player.y=H-FLOOR_H-24;player.vy=-Math.abs(player.vy)*.45} // escoba apoyada sobre el suelo
    if(practiceLeft<=0){finishPractice();return}
  }
}
function updateCrash(dt){
  crashT-=dt;speed=Math.max(0,speed-speed*4*dt);world+=speed*dt;
  for(const o of obs)o.x-=speed*dt;for(const c of sparkles)c.x-=speed*dt;
  player.vy+=900*dt;player.y+=player.vy*dt;player.rot+=9*dt;
  if(crashT<=0)end();
}
function idle(dt){
  world+=dt*40;player.x+=(180-player.x)*Math.min(1,dt*4);player.rot=0;
  player.y=250+Math.sin(performance.now()/500)*8;player.vy=0;
  if(Math.random()<.3){const id=skinTrail().idle;particles.push({x:IDLE_X+(Math.random()-.5)*70,y:IDLE_FEET+20-Math.random()*8,vx:-30-Math.random()*30,vy:20+Math.random()*30,life:.6,max:.6,size:1.5+Math.random()*2,color:id[Math.floor(Math.random()*id.length)],g:0,kind:'star'})}
  for(let i=obs.length-1;i>=0;i--){obs[i].x-=dt*120;if(obs[i].x<-80)obs.splice(i,1)}
  for(let i=sparkles.length-1;i>=0;i--){sparkles[i].x-=dt*120;if(sparkles[i].x<-40)sparkles.splice(i,1)}
}
function frame(now){
  if(TESTCFG.paused){last=now;requestAnimationFrame(frame);return}
  const dt=Math.min(.04,(now-last)/1000);last=now;t+=dt;
  if(state==='playing')update(dt,now);else if(state==='crashing')updateCrash(dt);else idle(dt);
  animTick(dt);updateParticles(dt);draw();drawMenuIdles();
  requestAnimationFrame(frame);
}

/* ---------- selector de skin ---------- */
const picker=$('#skins'),hero=$('#hero');
function paintSkins(){
  picker.querySelectorAll('button').forEach(b=>{const on=b.dataset.skin===data.skin;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
  const lbl=SKINS.find(([k])=>k===data.skin);$('#skinName').textContent=lbl?lbl[1]:'';
}
function setSkin(k,fx=true){
  if(k===data.skin||!SKINS.some(([s])=>s===k))return;data.skin=k;save();paintSkins();
  if(fx){Sound.init();Sound.ui();burst(IDLE_X,IDLE_FEET-70,3)}
}
SKINS.forEach(([k,label])=>{const b=document.createElement('button');b.type='button';b.className='skin';b.dataset.skin=k;b.title=label;b.setAttribute('aria-label','skin '+label);
  const cv=document.createElement('canvas');cv.width=cv.height=96;cv.className='front';b.appendChild(cv); // v1.9: miniatura de frente
  b.addEventListener('click',()=>{setSkin(k);b.blur()});picker.appendChild(b)});
// v1.9: héroe de la tarjeta y miniaturas = idle de frente (la miniatura elegida se anima)
function drawMenuIdles(){
  if($('#overlay').classList.contains('hidden'))return;
  if(hero&&hero.getContext){const g=hero.getContext('2d');g.clearRect(0,0,hero.width,hero.height);drawFrontIdle(g,data.skin,hero.width/2,hero.height-2,2,t,.7)}
  picker.querySelectorAll('canvas.front').forEach(cv=>{const k=cv.parentNode.dataset.skin,g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);drawFrontIdle(g,k,cv.width/2,cv.height-2,1,t,k.length*.37,k!==data.skin)});
}
paintSkins();
function cycleSkin(d){const i=SKINS.findIndex(([k])=>k===data.skin);setSkin(SKINS[(i+d+SKINS.length)%SKINS.length][0])}

/* ---------- controles ---------- */
const muteBtn=$('#mute'),volMusic=$('#volMusic'),volSfx=$('#volSfx');
function paintMute(){const m=Sound.muted;muteBtn.textContent=m?'🔇 silencio':'🔊 sonido';muteBtn.classList.toggle('off',m);muteBtn.setAttribute('aria-pressed',String(m))}
function paintVol(){if(volMusic)volMusic.value=String(Math.round(Sound.musicVol*100));if(volSfx)volSfx.value=String(Math.round(Sound.sfxVol*100))}
muteBtn.addEventListener('click',()=>{Sound.init();Sound.toggle();paintMute();Sound.ui();muteBtn.blur()});
if(volMusic)volMusic.addEventListener('input',()=>{Sound.init();Sound.setMusicVol(+volMusic.value/100)});
if(volSfx)volSfx.addEventListener('input',()=>{Sound.init();Sound.setSfxVol(+volSfx.value/100);Sound.ui()});
paintMute();paintVol();
['pointerdown','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,()=>Sound.init(),{passive:true}));
$('#practice').addEventListener('click',()=>prepareRun('practice'));
$('#start').addEventListener('click',()=>prepareRun('real'));
const boostBtn=$('#boost');
const boostOn=e=>{e.preventDefault();if(state==='playing'){setHeld(true);try{boostBtn.setPointerCapture(e.pointerId)}catch(err){}}};
const boostOff=e=>{e.preventDefault();setHeld(false)};
boostBtn.addEventListener('pointerdown',boostOn);boostBtn.addEventListener('pointerup',boostOff);boostBtn.addEventListener('pointercancel',boostOff);
boostBtn.addEventListener('lostpointercapture',()=>setHeld(false));
canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(state==='playing'){setHeld(true);try{canvas.setPointerCapture(e.pointerId)}catch(err){}}});
canvas.addEventListener('pointerup',()=>setHeld(false));canvas.addEventListener('pointercancel',()=>setHeld(false));
window.addEventListener('keydown',e=>{
  if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(state==='playing'&&!e.repeat)setHeld(true)}
  if(e.code==='Enter'&&e.target.tagName!=='BUTTON'&&state!=='playing'&&state!=='crashing'&&(BETA||data.lives>0)){e.preventDefault();prepareRun('real')}
  if(e.code==='KeyM'){Sound.init();Sound.toggle();paintMute()}
  if((e.code==='ArrowLeft'||e.code==='ArrowRight')&&state!=='playing'&&state!=='crashing'){e.preventDefault();cycleSkin(e.code==='ArrowLeft'?-1:1)}
});
window.addEventListener('keyup',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code))setHeld(false)});
document.addEventListener('visibilitychange',()=>{if(document.hidden){setHeld(false);Sound.suspend()}else Sound.resume()});
// cambio de día con la página abierta
setInterval(()=>{if(data.day!==dateKey()&&state!=='playing'&&state!=='crashing'){data={...blank(),wallet:data.wallet,best:data.best,skin:data.skin};save();ui();$('#start').disabled=false}},30000);

ui();
panel('KOZMIK<br>RUN','elige brujo, vampiro u hombre lobo, súbete a la escoba y vuela 30 s por acto (bosque → cementerio → infierno). a los 90 s llega la oscuridad. junta monedas, gemas, grimorios, llaves, corazones y pociones ✦ (cuanto más raro, más vale). esquiva llamas, tumbas, enredaderas, espadas y relicarios. toca un gato: 3 s invencible. cada 50 objetos tu escoba se enciende: ¡cometa morado! (9 s invencible, rompe obstáculos). junta cadenas enteras: ¡cadena perfecta!',
  'práctica · 7 seg',(BETA||data.lives>0)?'empezar carrera':'sin carreras por hoy','mantén «vuela», la barra espaciadora o cualquier parte del juego. la práctica es ilimitada; las carreras reales son 3 por día.');
// gancho solo para pruebas automáticas (index.html?test): no afecta al juego normal
if(/[?&]test\b/.test(location.search))window.__kr={Sound,
  jump(rt){runTime=rt;if(rt>=ACT_DUR*3)enterVoid()},clear(){obs=[];sparkles=[];particles=[];texts=[]},
  spawnDemo(){obs=[];const mk=(img,x,y,h,extra={})=>{const im=IMG[img],w=h*im.naturalWidth/im.naturalHeight;obs.push({x,y,w,h,kind:'menos',img,n:0,place:'float',fixed:true,bob:x*.01,flip:1,...extra})};
    mk('menos2',300,140,112);mk('menos2',430,300,60,{flying:true,w:112,h:30});mk('menos4a',560,H-FLOOR_H-112,112,{place:'ground'});mk('menos6',640,40,130,{place:'ceil'});mk('menos1a',520,0,140,{place:'ceil'});mk('menos3',180,330,90)},
  state:()=>({state,runTime,voidMode,act:currentActIndex(),mode:Sound.mode,comet,cometGrace,cometMeter,runCoins,chainStreak,runSeed}),
  idleFrame,rigPop:v=>{rigPop=v},setT:v=>{t=v},skin:k=>setSkin(k,false),start:k=>{state='ready';prepareRun(k||'real')},hold(v){held=v},
  player(y){player.y=y;player.vy=0},
  // v1.8.4: pruebas del cometa y de las cadenas (loop pausable, paso fijo, registro de cadenas/choques)
  cfg(o){Object.assign(TESTCFG,o);return TESTCFG},
  log(){TESTLOG={chains:[],hits:[],done:{},missed:{}};return TESTLOG},
  S(){return{state,runTime,world,speed,player,held,voidMode,comet,cometMeter,obs,sparkles,chains,TESTLOG,practiceLeft}},
  setHeld(v){held=!!v},seed(v){seed=v>>>0},practice(v){practiceLeft=v},meter(v){cometMeter=v},
  comet(left){startComet();if(left!=null)comet=left},cometOff(){comet=0;cometGrace=0;cometTrail=[];Sound.setComet(false)},clearTexts(){texts=[]},
  warp(rt){let r=0,w=0,sp=230,vm=false;while(r<rt-1e-9){r+=1/60;if(r>=ACT_DUR*3)vm=true;w+=sp/60;sp=vm?Math.min(680,490+(r-ACT_DUR*3)*5.2+w*.009):Math.min(500,230+w*.017+r*.95)}
    runTime=r;world=w;speed=sp;voidMode=false;if(vm)enterVoid();obs=[];sparkles=[];chains={};lastChainEnd=null;spawnIn=.25},
  step(dt,n=1){for(let i=0;i<n;i++){testNow+=dt*1000;t+=dt;if(state==='playing')update(dt,testNow);else if(state==='crashing')updateCrash(dt);else idle(dt);animTick(dt);updateParticles(dt);if(state!=='playing')break}},
  pathHits,hitBox,draw(){draw()},spawnChain(c=250,g=200){return spawnSkillChain(c,g)}};
let testNow=0;
requestAnimationFrame(frame);
})();
