const fs = require('fs'), vm = require('vm'), path = require('path');
const DIR = process.argv[2];

let drawCalls = 0, errors = [];
function ck(name, ...args) {
  for (const a of args) {
    if (typeof a === 'number' && !Number.isFinite(a)) errors.push(`${name}: non-finite ${a}`);
  }
}
const ctxStub = () => ({
  createRadialGradient: (...a) => { ck('gradient', ...a); return { addColorStop: (o,c) => ck('stop', o) }; },
  fillRect: (...a) => ck('fillRect', ...a),
  clearRect: (...a) => ck('clearRect', ...a),
  drawImage: (img, ...a) => { drawCalls++; ck('drawImage', ...a); if (!img) errors.push('drawImage: null sprite'); },
  setTransform: (...a) => ck('setTransform', ...a),
  translate: (...a) => ck('translate', ...a),
  rotate: (...a) => ck('rotate', ...a),
  set globalAlpha(v) { ck('globalAlpha', v); if (v < 0 || v > 1) errors.push(`alpha out of range: ${v}`); },
  get globalAlpha() { return 1; },
  globalCompositeOperation: '', fillStyle: null,
});
const mkCanvas = () => ({ width:0, height:0, style:{}, getContext: ctxStub, tagName:'CANVAS' });
const mkBtn = (id) => ({ id, dataset:{}, _h:{}, tagName:'BUTTON',
  addEventListener(e,f){ (this._h[e] ||= []).push(f); },
  setAttribute(){}, click(){ (this._h.click||[]).forEach(f=>f()); } });

const els = {
  player: { clientWidth:1600, clientHeight:900, videoWidth:1280, videoHeight:720,
            _h:{}, addEventListener(e,f){ (this._h[e] ||= []).push(f); } },
  bubbles: mkCanvas(), glare: mkCanvas(),
  bubbleToggle: mkBtn('bubbleToggle'), bubbleStop: mkBtn('bubbleStop'),
  glareToggle: mkBtn('glareToggle'), glareStop: mkBtn('glareStop'),
  toggle: mkBtn('toggle'), stop: mkBtn('stop'),
};
let rafQ = [];
const sandbox = {
  document: { getElementById: id => els[id] || null, createElement: () => mkCanvas(),
              addEventListener(){}, activeElement:null },
  window: { addEventListener(){}, matchMedia: () => ({ matches:false }) },
  requestAnimationFrame: fn => { rafQ.push(fn); return rafQ.length; },
  performance: { now: () => Date.now() },
  Math, Date, console,
};
sandbox.window = Object.assign(sandbox.window, sandbox);
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const f of ['overlay.js','bubbles.js','glare.js']) {
  try { vm.runInContext(fs.readFileSync(path.join(DIR,f),'utf8'), sandbox, {filename:f}); }
  catch (e) { console.error(`LOAD FAIL ${f}: ${e.message}`); process.exit(1); }
}
console.log('loaded: Overlay=%s bubbles=%s glare=%s',
  !!sandbox.window.Overlay, !!sandbox.window.bubbles, !!sandbox.window.glare);

// start both layers
els.bubbleToggle.click(); els.glareToggle.click();
let t = 0;
for (let i = 0; i < 300; i++) {
  const q = rafQ; rafQ = [];
  t += 16.7;
  for (const fn of q) { try { fn(t); } catch (e) { errors.push(`frame ${i}: ${e.message}`); } }
}
console.log('frames pumped, drawImage calls: %d', drawCalls);

// simulate metadata + resize while running
els.player._h.loadedmetadata.forEach(f => { try { f(); } catch(e){ errors.push('loadedmetadata: '+e.message); } });

// pause, then stop
els.bubbleToggle.click(); els.glareToggle.click();
els.bubbleStop.click();  els.glareStop.click();
// restart after stop (re-seeds)
els.bubbleToggle.click();
for (let i = 0; i < 20; i++) { const q = rafQ; rafQ = []; t += 16.7;
  for (const fn of q) { try { fn(t); } catch (e) { errors.push(`restart ${i}: ${e.message}`); } } }

console.log(errors.length ? 'ERRORS:\n' + errors.slice(0,10).join('\n') : 'PASS — no errors, all draw args finite');
process.exit(errors.length ? 1 : 0);
