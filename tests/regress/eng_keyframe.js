// Engine keyframe (3.2.0 Web Worker, stage a, src/analog/engine/state.js): the whole state of the analog engine as one plain value and back.
// Checks, ABC only (one world OFF): Reset + 150 MW; keyframe K (through JSON, as a worker message carries it); 200 steps of ABC-001C ->
// state A; K applied; the same 200 steps -> state B; A = B in every value, input, block state of every sheet (0 differences). The same
// from a plant that moved (200 s after an HP bypass step), so the dynamic states (PID integral, actuators, unit model) are in the keyframe.
// Usage: node tests/regress/eng_keyframe.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(()=>AN.setCat('an'));await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54,null,{timeout:90000});await page.waitForTimeout(1000);
const r=await page.evaluate(()=>{
  const f=x=>x==null||!isFinite(x)?String(x):+(+x).toPrecision(12);
  /* the state compared: the keyframe itself (every sheet, block state, plant model, unit / source models), 12 digits */
  const dump=()=>JSON.stringify(AN.engState.capture(),(k,v)=>typeof v==='number'?f(v):v).split(/(?<=}),/);
  const C1=AN.sheets.find(s=>s.name==='ABC-001C');
  const run=n=>{for(let k=0;k<n;k++)AN.stepSet(C1,0.5)};
  const same=(A,B)=>{let n=0;const ex=[];A.forEach((x,i)=>{if(x!==B[i]){n++;if(ex.length<3)ex.push(x.slice(0,60))}});return {n,ex,len:A.length}};
  const o={};AN.run=false;WORLD.set(false);AN.reset();AN.plantLoad150();
  /* 1: the steady 150 MW */
  let K=JSON.stringify(AN.engState.capture());o.kb=K.length;
  run(200);const A=dump();AN.engState.apply(JSON.parse(K));run(200);o.s1=same(A,dump());
  /* 2: a plant that moves: HP bypass PICMS1006 M 20 % for 200 s, keyframe, 200 s more */
  const S50=AN.sheets.find(s=>s.name==='ABC-050');const c=AN.hmiCtrls(S50.S).find(x=>x.tag==='PICMS1006');
  if(c&&c.manBlk&&S50.S.rt.st[c.manBlk.id]){AN.latchMode('PICMS1006','MAN');S50.S.rt.st[c.manBlk.id].val=20}
  run(400);K=JSON.stringify(AN.engState.capture());run(400);const A2=dump();AN.engState.apply(JSON.parse(K));run(400);o.s2=same(A2,dump());
  o.mw=+AN.unit.MW;return o});
ck(r.s1.n===0,'steady 150 MW: keyframe '+Math.round(r.kb/1024)+' kB, 200 steps from it again = '+r.s1.n+' differences of '+r.s1.len+' records'+(r.s1.n?': '+r.s1.ex.join(' | '):''));
ck(r.s2.n===0,'moving plant (HP bypass by hand): 200 s from the keyframe again = '+r.s2.n+' differences'+(r.s2.n?': '+r.s2.ex.join(' | '):'')+' (MW '+r.mw.toFixed(1)+')');
ck(!errs.length,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
