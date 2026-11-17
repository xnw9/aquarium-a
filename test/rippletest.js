const fs=require('fs'), vm=require('vm'), path=require('path');
const DIR=process.argv[2]; let errors=[], draws=[];
const ck=(n,...a)=>{for(const v of a) if(typeof v==='number'&&!Number.isFinite(v)) errors.push(n+': non-finite');};
const ctxStub=()=>({ createRadialGradient:()=>({addColorStop:()=>{}}), fillRect(){}, clearRect(){},
  drawImage:(img,x,y,w,h)=>{ draws.push({x,y,w,h}); ck('drawImage',x,y,w,h); if(!img) errors.push('null sprite'); },
  setTransform(){}, translate(){}, rotate(){},
  set globalAlpha(v){ ck('alpha',v); if(v<0||v>1) errors.push('alpha out of range '+v); }, get globalAlpha(){return 1;},
  globalCompositeOperation:'', fillStyle:null });
const mkCanvas=(id)=>({id,width:0,height:0,style:{},getContext:ctxStub,tagName:'CANVAS',
  getBoundingClientRect:()=>({left:100,top:50,width:1280,height:720})});
const mkEl=(id,tag)=>({id,dataset:{},_h:{},tagName:tag||'BUTTON',
  addEventListener(e,f){(this._h[e] ||= []).push(f);}, setAttribute(){}, 
  fire(e,ev={}){(this._h[e]||[]).forEach(f=>f(ev));}, click(){this.fire('click',{stopPropagation(){}});}});
const els={ player:{clientWidth:1280,clientHeight:720,videoWidth:1280,videoHeight:720,_h:{},
             addEventListener(e,f){(this._h[e] ||= []).push(f);}},
  videoWrap:mkEl('videoWrap','DIV'), ripples:mkCanvas('ripples'),
  rippleToggle:mkEl('rippleToggle') };
let rafQ=[];
const sandbox={ document:{getElementById:id=>els[id]||null,createElement:()=>mkCanvas(),addEventListener(){},activeElement:null},
  window:{addEventListener(){},matchMedia:()=>({matches:false})},
  requestAnimationFrame:fn=>{rafQ.push(fn);return 1;}, performance:{now:()=>Date.now()}, Math,Date,console };
sandbox.window=Object.assign(sandbox.window,sandbox); sandbox.globalThis=sandbox;
vm.createContext(sandbox);
for(const f of ['overlay.js','ripples.js'])
  vm.runInContext(fs.readFileSync(path.join(DIR,f),'utf8'),sandbox,{filename:f});

let t=0; const pump=(n=1)=>{for(let i=0;i<n;i++){const q=rafQ;rafQ=[];t+=16.7;
  q.forEach(f=>{try{f(t);}catch(e){errors.push(e.message);}});}};
const click=(cx,cy,target)=>els.videoWrap.fire('click',{clientX:cx,clientY:cy,
  target:target||{closest:()=>null}});
const T=(n,c)=>{console.log((c?'ok  ':'FAIL')+'  '+n); if(!c)errors.push(n);};

T('layer created', !!sandbox.window.ripples);
T('starts disabled', sandbox.window.ripples.isRunning()===false);
click(500,300); pump(5);
T('click while disabled draws nothing', draws.length===0);

els.rippleToggle.click();
T('toggle enables', sandbox.window.ripples.isRunning()===true);
pump(2); draws=[];
click(500,300); pump(3);
T('click while enabled draws', draws.length>0);
const d=draws[0];
T('  ripple centred on click (x)', Math.abs(d.x + d.w/2 - 400) < 1);   // 500-100
T('  ripple centred on click (y)', Math.abs(d.y + d.h/2 - 250) < 1);   // 300-50
T('  starts small', d.w < 720*0.22*2);

draws=[]; pump(20);
T('second staggered ring appears', draws.length>0);
let maxW=0; draws.forEach(x=>{if(x.w>maxW)maxW=x.w;});
draws=[]; pump(30); let laterMax=0; draws.forEach(x=>{if(x.w>laterMax)laterMax=x.w;});
T('ring expands over time', laterMax>maxW);

// run well past GROW + stagger so everything retires
pump(200); draws=[]; pump(5);
T('rings retire after fading', draws.length===0);

// click on the controls is ignored
draws=[]; click(500,300,{closest:(s)=>s==='.controls'?{}:null}); pump(5);
T('click on controls ignored', draws.length===0);

// click outside the picture is ignored
draws=[]; click(50,10); pump(5);
T('click outside video rect ignored', draws.length===0);

// toggling off clears in-flight ripples as well as disabling
click(600,400); pump(2);
els.rippleToggle.click();
T('toggle off disables', sandbox.window.ripples.isRunning()===false);
draws=[]; pump(5);
T('toggle off clears in-flight ripples', draws.length===0);
els.rippleToggle.click(); els.rippleToggle.click();   // on then off again
T('toggle is idempotent', sandbox.window.ripples.isRunning()===false);

// many clicks don't leak
els.rippleToggle.click();
for(let i=0;i<50;i++){ click(300+i,300); pump(1); }
pump(300); draws=[]; pump(5);
T('no particles leak after 50 clicks', draws.length===0);

console.log(errors.length?'\nERRORS: '+[...new Set(errors)].join(', '):'\nPASS');
process.exit(errors.length?1:0);
