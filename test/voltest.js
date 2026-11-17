const fs=require('fs'), vm=require('vm'), path=require('path');
const DIR=process.argv[2]; let errors=[];
const docHandlers={};
const mk=(id,extra={})=>({id,dataset:{},attrs:{},_h:{},tagName:'BUTTON',hidden:false,
  addEventListener(e,f){(this._h[e] ||= []).push(f);},
  setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},
  focus(){}, fire(e,ev={}){(this._h[e]||[]).forEach(f=>f(Object.assign({stopPropagation(){}},ev)));},
  ...extra});
const video={muted:false,volume:1,_h:{},addEventListener(e,f){(this._h[e] ||= []).push(f);},
  fire(e){(this._h[e]||[]).forEach(f=>f());}};
const els={player:video,volume:mk('volume'),volumeBtn:mk('volumeBtn'),
  volumePanel:mk('volumePanel',{hidden:true}),
  volumeSlider:mk('volumeSlider',{value:'1',tagName:'INPUT'})};
const sandbox={document:{getElementById:id=>els[id]||null,
  addEventListener(e,f){(docHandlers[e] ||= []).push(f);},activeElement:null},
  window:{addEventListener(){}},Math,parseFloat,console};
sandbox.window=Object.assign(sandbox.window,sandbox); sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(DIR,'volume.js'),'utf8'),sandbox,{filename:'volume.js'});
const t=(name,cond)=>{console.log((cond?'ok  ':'FAIL')+'  '+name); if(!cond)errors.push(name);};

t('starts closed', els.volumePanel.hidden===true);
t('initial icon = high', els.volumeBtn.dataset.level==='high');
els.volumeBtn.fire('click'); t('click opens panel', els.volumePanel.hidden===false);
t('aria-expanded true', els.volumeBtn.getAttribute('aria-expanded')==='true');
els.volumeBtn.fire('click'); t('second click closes', els.volumePanel.hidden===true);
els.volumeBtn.fire('click');
docHandlers.click.forEach(f=>f({})); t('outside click closes', els.volumePanel.hidden===true);
els.volumeBtn.fire('click');
els.volumePanel.fire('click'); t('click inside panel keeps it open', els.volumePanel.hidden===false);
docHandlers.keydown.forEach(f=>f({key:'Escape'})); t('Escape closes', els.volumePanel.hidden===true);
els.volumeSlider.value='0.3'; els.volumeSlider.fire('input');
t('volume set to 0.3', Math.abs(video.volume-0.3)<1e-9);
t('icon = low below 50%', els.volumeBtn.dataset.level==='low');
els.volumeSlider.value='0'; els.volumeSlider.fire('input');
t('zero mutes', video.muted===true && els.volumeBtn.dataset.level==='mute');
els.volumeSlider.value='0.8'; els.volumeSlider.fire('input');
t('unmutes above zero', video.muted===false && els.volumeBtn.dataset.level==='high');
video.volume=0.2; video.fire('volumechange');
t('external change syncs slider', els.volumeSlider.value===0.2);
console.log(errors.length?'\nERRORS: '+errors.join(', '):'\nPASS');
process.exit(errors.length?1:0);
