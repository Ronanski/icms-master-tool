// Reset is a clean start (user 2026-11-02 via the leader: "dapat iisa ang state pagkatapos ng Reset, kahit ano ang ginawa bago nito"):
// the whole engine state after Reset + Start at 150 MW (the keyframe of src/analog/engine/state.js: every sheet's values, inputs,
// block states, the plant model of every block, the unit / source / cycle models) is the same whatever ran before.
// A: Reset + 150 MW on the fresh page. B: 600 s of a moving plant (HP bypass by hand 20 %, Start cold, 300 s), then Reset + 150 MW.
// A = B in every record (0 differences). ABC only (one world OFF). Usage: node tests/regress/reset_clean.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(()=>AN.setCat('an'));await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54,null,{timeout:90000});await page.waitForTimeout(1000);
const r=await page.evaluate(()=>{
  const f=x=>x==null||!isFinite(x)?String(x):+(+x).toPrecision(12);
  /* the keys of an object in one order (a plant model gets its link fields before or after the Reset fields: the same state) */
  const srt=v=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v;
  const dump=()=>JSON.stringify(AN.engState.capture(),(k,v)=>typeof v==='number'?f(v):srt(v)).split(/(?<=\}),/);
  const C1=AN.sheets.find(s=>s.name==='ABC-001C');
  const run=n=>{for(let k=0;k<n;k++)AN.stepSet(C1,0.5)};
  AN.run=false;WORLD.set(false);
  AN.reset();AN.plantLoad150();const A=dump();
  /* something else first: HP bypass by hand, a cold start, the plant running */
  const S50=AN.sheets.find(s=>s.name==='ABC-050');const c=AN.hmiCtrls(S50.S).find(x=>x.tag==='PICMS1006');
  if(c&&c.manBlk&&S50.S.rt.st[c.manBlk.id]){AN.latchMode('PICMS1006','MAN');S50.S.rt.st[c.manBlk.id].val=20}
  run(1200);AN.reset();AN.plantCold();run(600);
  AN.reset();AN.plantLoad150();const B=dump();
  let n=0;const ex=[];const m=Math.max(A.length,B.length);
  for(let i=0;i<m;i++)if(A[i]!==B[i]){n++;if(ex.length<6)ex.push((A[i]||'').slice(0,110)+'  <>  '+(B[i]||'').slice(0,110))}
  return {n,len:A.length,ex}});
ck(r.n===0,'Reset + 150 MW after other runs = fresh Reset + 150 MW: '+r.n+' differences of '+r.len+' records'+(r.n?'\n   '+r.ex.join('\n   '):''));
ck(!errs.length,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
