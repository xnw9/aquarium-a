const fs=require('fs'), vm=require('vm'), path=require('path');
const DIR=process.argv[2];
let errors=[], rafQ=[];
const mkBtn=(id)=>({id,dataset:{},_h:{},tagName:'BUTTON',
  addEventListener(e,f){(this._h[e] ||= []).push(f);},setAttribute(){},click(){(this._h.click||[]).forEach(f=>f());}});
const video={ clientWidth:1600,clientHeight:900,videoWidth:1280,videoHeight:720,
  duration:293.9166, currentTime:0, paused:true, style:{}, _h:{},
  addEventListener(e,f){(this._h[e] ||= []).push(f);},
  fire(e){(this._h[e]||[]).forEach(f=>f());},
  play(){this.paused=false;this.fire('play');return Promise.resolve();},
  pause(){this.paused=true;this.fire('pause');} };
const els={player:video,toggle:mkBtn('toggle'),stop:mkBtn('stop')};
const sandbox={ document:{getElementById:id=>els[id]||null,createElement:()=>({getContext:()=>({}),style:{}}),
  addEventListener(){},activeElement:null},
  window:{addEventListener(){},matchMedia:()=>({matches:false})},
  requestAnimationFrame:fn=>{rafQ.push(fn);return rafQ.length;},
  performance:{now:()=>Date.now()},Math,Date,console,isFinite,Promise };
sandbox.window=Object.assign(sandbox.window,sandbox); sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(DIR,'script.js'),'utf8'),sandbox,{filename:'script.js'});
function pump(){ const q=rafQ; rafQ=[]; q.forEach(f=>{try{f(Date.now());}catch(e){errors.push(e.message);}}); }
function at(t){ video.currentTime=t; pump(); return parseFloat(video.style.opacity); }
const T=(n,got,want)=>{const ok=Math.abs(got-want)<0.01;
  console.log(`${ok?'ok  ':'FAIL'}  ${n}: opacity=${got} expected=${want}`); if(!ok)errors.push(n);};

video.fire('loadedmetadata');
console.log(video.style.opacity==='1' ? 'ok    first frame visible before play (opacity 1)'
  : 'FAIL  first frame hidden: '+video.style.opacity);
if(video.style.opacity!=='1') errors.push('landing frame');

video.play();
const D=video.duration;
console.log('\n-- opening play: no dip to black, the frame is already on screen --');
T('t=0',        at(0),    1);
T('t=0.75',     at(0.75), 1);
T('t=1.5',      at(1.5),  1);
T('t=150 (mid)',at(150),  1);
console.log('\n-- end of first pass: fades out as before --');
T('t=D-1.5',    at(D-1.5),  1);
T('t=D-0.75',   at(D-0.75), 0.5);
T('t=D',        at(D),      0);
console.log('\n-- second loop: now it fades in --');
T('t=0',        at(0),    0);
T('t=0.75',     at(0.75), 0.5);
T('t=1.5',      at(1.5),  1);

video.pause(); pump();
console.log(rafQ.length===0 ? '\nok    rAF loop stops on pause' : '\nFAIL  rAF kept running');
if(rafQ.length!==0) errors.push('rAF leak');
video.play(); at(0); els.stop.click();
console.log(video.style.opacity==='1' ? 'ok    Stop resets opacity to 1' : 'FAIL  Stop left '+video.style.opacity);
if(video.style.opacity!=='1') errors.push('stop opacity');
video.duration=2; video.play();
console.log(at(0)===1 ? 'ok    short video stays opaque' : 'FAIL  short video faded');
console.log(errors.length?'\nERRORS: '+errors.join(', '):'\nPASS');
process.exit(errors.length?1:0);
