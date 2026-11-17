const fs=require('fs'), vm=require('vm'), path=require('path');
const DIR=process.argv[2]; let errors=[];
const T=(n,c)=>{console.log((c?'ok  ':'FAIL')+'  '+n); if(!c)errors.push(n);};

// ---- 1. the tone curve, read straight out of index.html
const html=fs.readFileSync(path.join(DIR,'index.html'),'utf8');
const tables=[...html.matchAll(/<feFunc([RGB]) type="table" tableValues="([^"]+)"/g)];
T('three channel tables present', tables.length===3);
const vals=tables.map(m=>m[2].trim().split(/\s+/).map(Number));
T('all three tables identical (no colour cast)',
  JSON.stringify(vals[0])===JSON.stringify(vals[1]) && JSON.stringify(vals[1])===JSON.stringify(vals[2]));
T('sRGB interpolation declared', /color-interpolation-filters="sRGB"/.test(html));

const t=vals[0], n=t.length-1;
const curve=(x)=>{ const p=x*n, i=Math.min(Math.floor(p),n-1), f=p-i; return t[i]+(t[i+1]-t[i])*f; };

console.log('\n  in  -> out');
for(const x of [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0])
  console.log('  '+x.toFixed(2)+' -> '+curve(x).toFixed(3)+(Math.abs(curve(x)-x)<0.005?'   (unchanged)':''));

T('\n  black stays black', curve(0)===0);
T('  shadows untouched (<=0.4)', [0,0.1,0.2,0.3,0.4].every(x=>Math.abs(curve(x)-x)<0.005));
T('  white is pulled down', curve(1) < 0.85 && curve(1) > 0.6);
T('  curve is monotonic (no banding/inversion)', (()=>{
  for(let x=0;x<1;x+=0.01) if(curve(x+0.01) < curve(x)-1e-9) return false; return true; })());
T('  slope never increases (true rolloff, no boost)', (()=>{
  let prev=Infinity;
  for(let i=0;i<n;i++){ const s=(t[i+1]-t[i]); if(s>prev+1e-9) return false; prev=s; }
  return true; })());
console.log('  peak brightness: '+Math.round(curve(1)*100)+'% of original'+
            '  (reduction '+Math.round((1-curve(1))*100)+'%)');

// grey stays neutral
const g=[0.95,0.95,0.95].map(curve);
T('  grey stays neutral (no tint)', g[0]===g[1] && g[1]===g[2]);

// ---- 2. the toggle script
let cls=new Set();
const button={dataset:{},attrs:{},_h:{},addEventListener(e,f){(this._h[e] ||= []).push(f);},
  setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},
  click(){(this._h.click||[]).forEach(f=>f());}};
const video={classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c)}};
const sandbox={document:{getElementById:id=>({player:video,filterToggle:button})[id]||null},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(DIR,'filter.js'),'utf8'),sandbox,{filename:'filter.js'});

console.log('');
T('starts off', button.dataset.state==='off' && !cls.has('filtered'));
T('aria-pressed false initially', button.getAttribute('aria-pressed')==='false');
button.click();
T('click turns it on', button.dataset.state==='on' && cls.has('filtered'));
T('aria-pressed true when on', button.getAttribute('aria-pressed')==='true');
button.click();
T('click turns it off again', button.dataset.state==='off' && !cls.has('filtered'));
for(let i=0;i<9;i++) button.click();
T('odd number of clicks leaves it on', cls.has('filtered'));

// the CSS hook must match the class the script sets
const css=fs.readFileSync(path.join(DIR,'style.css'),'utf8');
T('CSS targets video.filtered with the filter', /video\.filtered\s*\{[^}]*filter:\s*url\(#highlightRolloff\)/.test(css));
T('filter id in CSS matches the SVG filter id', /id="highlightRolloff"/.test(html));

console.log(errors.length?'\nERRORS: '+errors.map(e=>e.trim()).join(', '):'\nPASS');
process.exit(errors.length?1:0);
