const fs=require('fs'), vm=require('vm'), path=require('path');
const DIR=process.argv[2]; let errors=[];
const T=(n,c)=>{console.log((c?'ok  ':'FAIL')+'  '+n); if(!c)errors.push(n);};
let timers=[];
const cls=(set=new Set())=>({add:c=>set.add(c),remove:c=>set.delete(c),contains:c=>set.has(c),_set:set});
const landing={id:'landing',hidden:false,classList:cls(),_h:{},
  addEventListener(e,f,o){(this._h[e] ||= []).push({f,o});},
  fire(e){(this._h[e]||[]).forEach(x=>x.f());}};
let played=0;
const video={play(){played++;return Promise.resolve();}};
const button={_h:{},addEventListener(e,f){(this._h[e] ||= []).push(f);},
  click(){(this._h.click||[]).forEach(f=>f());}};
const body={classList:cls()};
const sandbox={document:{getElementById:id=>({landing,landingPlay:button,player:video})[id]||null, body},
  setTimeout:(f,ms)=>{timers.push(f);return timers.length;}, console, Promise};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(DIR,'landing.js'),'utf8'),sandbox,{filename:'landing.js'});

T('glass visible on landing', landing.hidden===false);
T('controls not yet revealed', body.classList.contains('ready')===false);
T('video not playing yet', played===0);

button.click();
T('click starts playback', played===1);
T('click reveals the controls', body.classList.contains('ready')===true);
T('click fades the glass out', landing.classList.contains('is-gone')===true);
T('glass still present mid-fade', landing.hidden===false);

landing.fire('transitionend');
T('glass removed once faded', landing.hidden===true);

// second click must not replay or re-fade
button.click();
T('second click is a no-op', played===1);

// fallback path: transitionend never fires
const l2={hidden:false,classList:cls(),_h:{},addEventListener(e,f,o){(this._h[e] ||= []).push({f,o});}};
timers=[]; played=0;
const b2={_h:{},addEventListener(e,f){(this._h[e] ||= []).push(f);},click(){(this._h.click||[]).forEach(f=>f());}};
const body2={classList:cls()};
const sb2={document:{getElementById:id=>({landing:l2,landingPlay:b2,player:video})[id]||null, body:body2},
  setTimeout:(f)=>{timers.push(f);}, console, Promise};
sb2.window=sb2; sb2.globalThis=sb2; vm.createContext(sb2);
vm.runInContext(fs.readFileSync(path.join(DIR,'landing.js'),'utf8'),sb2,{filename:'landing.js'});
b2.click();
T('fallback timer scheduled', timers.length===1);
timers.forEach(f=>f());
T('fallback removes the glass if transitionend never fires', l2.hidden===true);

// markup + css wiring
const html=fs.readFileSync(path.join(DIR,'index.html'),'utf8');
const css=fs.readFileSync(path.join(DIR,'style.css'),'utf8');
T('landing is inside .video-wrap', html.indexOf('id="landing"')>html.indexOf('class="video-wrap"')
   && html.indexOf('id="landing"')<html.indexOf('<script'));
T('landing sits above the controls', /\.landing \{[\s\S]*?z-index: 3/.test(css));
T('frosted glass declared', /\.landing \{[\s\S]*?backdrop-filter: blur/.test(css));
T('controls hidden until .ready', /\.controls \{\s*opacity: 0;/.test(css)
   && /body\.ready \.controls \{ opacity: 1/.test(css));
T('both fades have a transition', /\.landing \{[\s\S]*?transition: opacity/.test(css)
   && /\.controls \{[\s\S]*?transition: opacity/.test(css));
T('landing.js precached', /'landing\.js'/.test(fs.readFileSync(path.join(DIR,'sw.js'),'utf8')));
console.log(errors.length?'\nERRORS: '+errors.join(', '):'\nPASS');
process.exit(errors.length?1:0);
