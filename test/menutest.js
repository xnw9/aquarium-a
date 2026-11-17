const fs=require('fs'), vm=require('vm'), path=require('path');
const DIR=process.argv[2]; let errors=[];
const T=(n,c)=>{console.log((c?'ok  ':'FAIL')+'  '+n); if(!c)errors.push(n);};
const mk=(id,extra={})=>({id,dataset:{},attrs:{},_h:{},hidden:false,
  addEventListener(e,f){(this._h[e] ||= []).push(f);},
  setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},
  click(){(this._h.click||[]).forEach(f=>f());},...extra});
const els={menuToggle:mk('menuToggle'),controlsGroup:mk('controlsGroup'),
           volumePanel:mk('volumePanel',{hidden:true}),volumeBtn:mk('volumeBtn')};
const sandbox={document:{getElementById:id=>els[id]||null},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(DIR,'menu.js'),'utf8'),sandbox,{filename:'menu.js'});

T('controls start collapsed', els.controlsGroup.hidden===true);
T('menu button state = closed', els.menuToggle.dataset.state==='closed');
T('aria-expanded false', els.menuToggle.getAttribute('aria-expanded')==='false');
T('label invites opening', els.menuToggle.getAttribute('aria-label')==='Show controls');

els.menuToggle.click();
T('click expands', els.controlsGroup.hidden===false);
T('state = open', els.menuToggle.dataset.state==='open');
T('aria-expanded true', els.menuToggle.getAttribute('aria-expanded')==='true');
T('label invites closing', els.menuToggle.getAttribute('aria-label')==='Hide controls');

els.menuToggle.click();
T('second click collapses', els.controlsGroup.hidden===true);
T('state back to closed', els.menuToggle.dataset.state==='closed');

// volume panel left open then menu collapsed
els.menuToggle.click();                 // open
els.volumePanel.hidden=false;           // user opened the slider
els.volumeBtn.setAttribute('aria-expanded','true');
els.menuToggle.click();                 // collapse
T('collapsing also closes the volume panel', els.volumePanel.hidden===true);
T('  and resets its aria-expanded', els.volumeBtn.getAttribute('aria-expanded')==='false');

for(let i=0;i<7;i++) els.menuToggle.click();
T('odd clicks leave it open', els.controlsGroup.hidden===false);

// markup wiring
const html=fs.readFileSync(path.join(DIR,'index.html'),'utf8');
const css=fs.readFileSync(path.join(DIR,'style.css'),'utf8');
const ids=[...html.matchAll(/<button id="([a-zA-Z]+)"/g)].map(m=>m[1]);
const gi=html.indexOf('<div class="controls-group"');
const inside=[...html.slice(gi).matchAll(/<button id="([a-zA-Z]+)"/g)].map(m=>m[1]);
// landingPlay lives in the landing overlay, outside .controls entirely.
T('every control except the menu is inside the group',
  ids.filter(i=>!inside.includes(i)).join()==='landingPlay,menuToggle');
T('group hidden by default in markup', /<div class="controls-group" id="controlsGroup" hidden>/.test(html));
T('CSS overrides display for [hidden]', /\.controls-group\[hidden\]\s*\{\s*display:\s*none/.test(css));
T('menu/close icons swap on state', /#menuToggle\[data-state="open"\] \.i-menu/.test(css));
console.log(errors.length?'\nERRORS: '+errors.join(', '):'\nPASS');
process.exit(errors.length?1:0);
