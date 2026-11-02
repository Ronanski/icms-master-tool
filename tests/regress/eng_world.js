// The whole engine alone, the one world (3.2.0 Web Worker, stage b: tools/build/engine-bundle.js worldBundle: the DITL engine parts,
// the analog engine, src/world/world.js, ditl150.js; no DOM, here in a node vm as a worker will run it) against the page, in lockstep.
// Both: Reset of the ABC (AN.reset) and of the DITL (ditlStates, the Reset of the DITL bar), the ABC keyframe of the page into the
// engine (src/analog/engine/state.js), then STEPS times: ABC-001C 0.5 s + one scan of the world 0.5 s. Then every ABC value, input and
// block state, the numbers of the unit model (AN.unit), every DITL net, flip-flop, counter, timer, input switch, the world outputs W.out and the motors / valves (MST, MS, DREG)
// must be the same (0 differences). Then the keyframe of a moving plant (ABC + DITL) into the engine. From cold, then from 150 MW (the DITL in service: src/world/ditl150.js). Usage: node tests/regress/eng_world.js [html]
const {open}=require('./lib.js');const fs=require('fs'),vm=require('vm'),zlib=require('zlib'),path=require('path');
const {worldBundle}=require('../../tools/build/engine-bundle.js');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const STEPS=+(process.env.STEPS||120);
const gz=f=>zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(__dirname,'..','..','src','data',f),'utf8').trim(),'base64')).toString();
/* what is compared, the same text on both sides */
const DUMP=`((AN,DS,W,MST,MS,DREG)=>{const f=x=>x==null||!isFinite(x)?String(x):+(+x).toPrecision(12);const J=o=>JSON.stringify(o,(k,v)=>typeof v==='number'?f(v):v instanceof Set?[...v].sort():v);const d=[];
 for(const sh of AN.sheets){const S=sh.S;if(!S||!S.rt)continue;d.push(sh.name+'|v|'+Array.from(S.rt.v,f).join(','));d.push(sh.name+'|ext|'+J(S.rt.ext));for(const id of Object.keys(S.rt.st))d.push(sh.name+'|st'+id+'|'+J(S.rt.st[id]))}
 for(const s of DS){const nl=s.nl;d.push(s.name+'|sig|'+J(s.sig||{})+'|usw|'+J(s.usw||{}));if(!nl)continue;d.push(s.name+'|nv|'+(nl._v||[]).map(x=>x?1:0).join(''));
  d.push(s.name+'|g|'+J((nl.gates||[]).map(g=>g.t==='FF'?g.q:g.t==='CNT'?[g.N,g.pin,g.rp]:g.t==='TMR'?g.st:0)))}
 for(const k of Object.keys(W.out||{}).sort())d.push('out|'+k+'|'+J(W.out[k]));{const U=AN.unit||{};for(const k of Object.keys(U).sort()){const x=U[k];if(typeof x==='number'||typeof x==='boolean')d.push('unit|'+k+'|'+J(x));else if(Array.isArray(x)&&x.every(y=>typeof y==='number'))d.push('unit|'+k+'|'+J(x))}}d.push('MST|'+J(MST));d.push('MS|'+J(MS));d.push('DREG|'+J(DREG));return d})`;
function engine(){
  const ctx={console:{log(){},warn(){},error(){}},structuredClone,setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},performance:{now:()=>Date.now()},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},addEventListener(){},msg(){},atob:s=>Buffer.from(s,'base64').toString('binary')};
  ctx.globalThis=ctx;ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);vm.runInContext(worldBundle(),ctx,{filename:'world-bundle.js'});
  const {AN,DITL,WORLD}=ctx;
  AN.sheets=gz('apre.txt').split('\n').filter(Boolean).map(l=>JSON.parse(l));AN.plantOn=true;for(const sh of AN.sheets)ctx.ENGINE.E.ensure(sh);
  AN.adesPut(JSON.parse(gz('ades.txt')));
  DITL.S={sheets:gz('pre.txt').split('\n').filter(Boolean).map(l=>JSON.parse(l)),cur:0};
  WORLD.set(true);
  return {ctx,AN,DITL,WORLD,dump:()=>vm.runInContext(DUMP,ctx)(AN,DITL.S.sheets,WORLD,DITL.MST,DITL.MS,DITL.DREG)};
}
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(()=>AN.setCat('an'));await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(3000);
const eng=engine();
const cmp=(a,b)=>{let n=0;const ex=[];for(let i=0;i<Math.max(a.length,b.length);i++)if(a[i]!==b[i]){n++;if(ex.length<5)ex.push((a[i]||'').slice(0,140)+' <> '+(b[i]||'').slice(0,140))}return {n,len:a.length,ex}};
const lock=async(prep,label)=>{
  const r=await page.evaluate(([prep,steps,DUMP])=>{const dump=eval(DUMP);AN.run=false;AN.reset();ditlStates();(new Function(prep))();const K=JSON.stringify(AN.engState.capture());
   const C1=AN.sheets.find(s=>s.name==='ABC-001C');for(let k=0;k<steps;k++){AN.stepSet(C1,0.5);WORLD.tick(0.5)}return {K,i:AN.i,d:dump(AN,S.sheets,WORLD,MST,MS,DREG)}},[prep,STEPS,DUMP]);
  eng.AN.i=r.i;eng.AN.run=false;eng.AN.reset();eng.DITL.ditlStates();eng.ctx.__prep=prep;vm.runInContext('(new Function(__prep))()',eng.ctx);
  eng.AN.engState.apply(JSON.parse(r.K));const C1=eng.AN.sheets.find(s=>s.name==='ABC-001C');for(let k=0;k<STEPS;k++){eng.ctx.ENGINE.E.stepSet(C1,0.5);eng.WORLD.tick(0.5)}
  const c=cmp(r.d,eng.dump());
  ck(c.n===0,label+': '+STEPS+' scans (ABC + world) in the page and in the engine alone = '+c.n+' differences of '+c.len+' records'+(c.n?'\n   '+c.ex.join('\n   '):''));
};
await lock('','cold (Reset)');
await lock('AN.plantLoad150();DITL150.apply();','150 MW (Start at 150 MW, the DITL in service: DITL150.apply)');
/* the keyframe of a moving plant (the way the worker starts from the page): the page runs first (150 MW, HP bypass by hand, a DITL
   push button), then its ABC keyframe and its DITL keyframe (src/digital/parts/03d-state.js) go into the engine, whatever it ran before */
{
  const r=await page.evaluate(([steps,DUMP])=>{const dump=eval(DUMP);AN.run=false;AN.reset();ditlStates();AN.plantLoad150();DITL150.apply();
   const C1=AN.sheets.find(s=>s.name==='ABC-001C');const S50=AN.sheets.find(s=>s.name==='ABC-050');const c=AN.hmiCtrls(S50.S).find(x=>x.tag==='PICMS1006');
   AN.latchMode('PICMS1006','MAN');if(c.manBlk&&S50.S.rt.st[c.manBlk.id])S50.S.rt.st[c.manBlk.id].val=20;
   for(let k=0;k<100;k++){AN.stepSet(C1,0.5);WORLD.tick(0.5)}
   const K=JSON.stringify(AN.engState.capture()),KD=JSON.stringify(ditlCapture());
   for(let k=0;k<steps;k++){AN.stepSet(C1,0.5);WORLD.tick(0.5)}return {K,KD,i:AN.i,kb:K.length+KD.length,d:dump(AN,S.sheets,WORLD,MST,MS,DREG)}},[STEPS,DUMP]);
  eng.AN.i=r.i;eng.AN.engState.apply(JSON.parse(r.K));eng.DITL.ditlApply(JSON.parse(r.KD));
  const C1=eng.AN.sheets.find(s=>s.name==='ABC-001C');for(let k=0;k<STEPS;k++){eng.ctx.ENGINE.E.stepSet(C1,0.5);eng.WORLD.tick(0.5)}
  const c=cmp(r.d,eng.dump());
  ck(c.n===0,'keyframe of a moving plant ('+Math.round(r.kb/1024)+' kB, ABC + DITL) into the engine, then '+STEPS+' scans = '+c.n+' differences of '+c.len+' records'+(c.n?'\n   '+c.ex.join('\n   '):''));
}
ck(!errs.length,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
