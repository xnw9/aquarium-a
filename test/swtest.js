const fs=require('fs'), vm=require('vm'), path=require('path');
const DIR=process.argv[2]; let errors=[];
const TOTAL=1000;
const BODY=Buffer.alloc(TOTAL); for(let i=0;i<TOTAL;i++) BODY[i]=i%256;

const store=new Map();
// Real cache.match() hands back a fresh Response every call, so store the
// bytes and rebuild one — otherwise the stub's body is consumed after one read.
const cacheObj={
  async match(k){ const e=store.get(String(k)); return e? new Response(e.body,{status:200,headers:e.headers}) : undefined; },
  async put(k,v){ const buf=Buffer.from(await v.arrayBuffer());
                  store.set(String(k), {body:buf, headers:{'Content-Type':v.headers.get('Content-Type')||'video/mp4'}}); },
  async addAll(){},
};
let netCalls=0;
const sandbox={
  self:{ registration:{scope:'https://xnw9.github.io/aquarium-a/'},
         location:{origin:'https://xnw9.github.io'},
         addEventListener(){}, skipWaiting(){}, clients:{claim(){}} },
  caches:{ async open(){return cacheObj;}, async match(){return undefined;}, async keys(){return[];}, async delete(){} },
  fetch: async (r)=>{ netCalls++;
    const u = typeof r==='string'?r:r.url;
    return new Response(BODY, {status:200, headers:{'Content-Type':'video/mp4','Content-Length':String(TOTAL)}});
  },
  URL, Response, Headers, Request, Blob, console, parseInt, isNaN, Promise, RegExp,
};
sandbox.self = Object.assign(sandbox.self, {caches:sandbox.caches});
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(DIR,'sw.js'),'utf8'),sandbox,{filename:'sw.js'});
const I=sandbox.self._internals;
const VURL='https://xnw9.github.io/aquarium-a/assets/ambiance-recode.mp4';
const mkReq=(range)=>({url:VURL, method:'GET', headers:{get:(k)=>k.toLowerCase()==='range'?range:null}});
const t=(n,c)=>{console.log((c?'ok  ':'FAIL')+'  '+n); if(!c)errors.push(n);};

(async()=>{
  // --- first visit: open-ended range, nothing cached
  let waits=[];
  let r = await I.handleVideo(mkReq('bytes=0-'), p=>waits.push(p));
  t('first visit returns 206', r.status===206);
  t('  Content-Range spans whole file', r.headers.get('Content-Range')===`bytes 0-${TOTAL-1}/${TOTAL}`);
  t('  Content-Length = full size', r.headers.get('Content-Length')===String(TOTAL));
  const b1=Buffer.from(await r.arrayBuffer());
  t('  body is the full file, intact', b1.length===TOTAL && b1.equals(BODY));
  await Promise.all(waits);
  t('  video got stored in cache', store.has(VURL));
  const after1=netCalls;
  t('  exactly one network fetch', after1===1);

  // --- second visit: served from cache, no network
  r = await I.handleVideo(mkReq('bytes=0-'), ()=>{});
  t('cached open-ended range -> 206', r.status===206);
  const b2=Buffer.from(await r.arrayBuffer());
  t('  body intact from cache', b2.equals(BODY));
  t('  no extra network call', netCalls===after1);

  // --- mid-file seek from cache
  r = await I.handleVideo(mkReq('bytes=200-299'), ()=>{});
  t('mid-file range -> 206', r.status===206);
  t('  Content-Range correct', r.headers.get('Content-Range')===`bytes 200-299/${TOTAL}`);
  const b3=Buffer.from(await r.arrayBuffer());
  t('  slice is 100 bytes', b3.length===100);
  t('  slice bytes match source', b3.equals(BODY.slice(200,300)));

  // --- suffix range (open end)
  r = await I.handleVideo(mkReq('bytes=900-'), ()=>{});
  t('open-ended tail range', r.status===206 && r.headers.get('Content-Range')===`bytes 900-${TOTAL-1}/${TOTAL}`);
  const b4=Buffer.from(await r.arrayBuffer());
  t('  tail length 100', b4.length===100 && b4.equals(BODY.slice(900)));

  // --- end beyond EOF gets clamped
  r = await I.handleVideo(mkReq('bytes=950-5000'), ()=>{});
  t('range past EOF clamps', r.status===206 && r.headers.get('Content-Range')===`bytes 950-${TOTAL-1}/${TOTAL}`);

  // --- start beyond EOF -> 416
  r = await I.handleVideo(mkReq('bytes=5000-'), ()=>{});
  t('start past EOF -> 416', r.status===416);

  // --- no Range header at all, from cache
  r = await I.handleVideo(mkReq(null), ()=>{});
  t('no Range header -> 200', r.status===200);
  t('  Accept-Ranges advertised', r.headers.get('Accept-Ranges')==='bytes');

  console.log(errors.length?'\nERRORS: '+errors.join(', '):'\nPASS');
  process.exit(errors.length?1:0);
})();
