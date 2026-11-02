// The analog engine alone (3.2.0 Web Worker, stage a: tools/build/engine-bundle.js, no DOM, here in a node vm as a worker will run it)
// against the engine of the page, in lockstep. ABC only (one world OFF). The page: Reset + 150 MW, keyframe (src/analog/engine/state.js),
// then STEPS scans of ABC-001C (0.5 s). The engine alone: the same sheets (src/data/apre.txt), the keyframe, the same scans. Then every
// value, input and block state of every sheet must be the same (0 differences). The same once more from a moving plant (HP bypass by hand).
// Usage: node tests/regress/eng_headless.js [html]
const {open}=require('./lib.js');const fs=require('fs'),vm=require('vm'),zlib=require('zlib'),path=require('path');
const {bundle}=require('../../tools/build/engine-bundle.js');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const STEPS=200;
/* what is compared: rt.v, rt.ext, rt.st of every sheet, 12 digits */
const DUMP=`(AN=>{const f=x=>x==null||!isFinite(x)?String(x):+(+x).toPrecision(12);const d=[];for(const sh of AN.sheets){const S=sh.S;if(!S||!S.rt)continue;
 d.push(sh.name+'|v|'+Array.from(S.rt.v,f).join(','));d.push(sh.name+'|ext|'+JSON.stringify(S.rt.ext,(k,v)=>typeof v==='number'?f(v):v));
 for(const id of Object.keys(S.rt.st))d.push(sh.name+'|st'+id+'|'+JSON.stringify(S.rt.st[id],(k,v)=>typeof v==='number'?f(v):v))}return d})`;
function engine(){
  const code=bundle();
  const ctx={console:{log(){},warn(){},error(){}},structuredClone,setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},performance:{now:()=>Date.now()},localStorage:{getItem:()=>null,setItem(){}}};
  ctx.globalThis=ctx;ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);vm.runInContext(code,ctx,{filename:'engine-bundle.js'});
  const {AN,E}=ctx.ENGINE;
  AN.sheets=zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(__dirname,'..','..','src','data','apre.txt'),'utf8').trim(),'base64')).toString().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  AN.plantOn=true;for(const sh of AN.sheets)E.ensure(sh);
  return {AN,E,dump:vm.runInContext(DUMP,ctx)};
}
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(()=>AN.setCat('an'));await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54,null,{timeout:90000});await page.waitForTimeout(1000);
const eng=engine();
const cmp=(a,b)=>{let n=0;const ex=[];for(let i=0;i<Math.max(a.length,b.length);i++)if(a[i]!==b[i]){n++;if(ex.length<4)ex.push((a[i]||'').slice(0,90)+' <> '+(b[i]||'').slice(0,90))}return {n,len:a.length,ex}};
const lock=async(prep,label)=>{
  const r=await page.evaluate(([prep,steps,DUMP])=>{const dump=eval(DUMP);(new Function(prep))();const K=JSON.stringify(AN.engState.capture());
   const C1=AN.sheets.find(s=>s.name==='ABC-001C');for(let k=0;k<steps;k++)AN.stepSet(C1,0.5);return {K,d:dump(AN)}},[prep,STEPS,DUMP]);
  eng.AN.engState.apply(JSON.parse(r.K));const C1=eng.AN.sheets.find(s=>s.name==='ABC-001C');for(let k=0;k<STEPS;k++)eng.E.stepSet(C1,0.5);
  const c=cmp(r.d,eng.dump(eng.AN));
  ck(c.n===0,label+': '+STEPS+' scans in the page and in the engine alone = '+c.n+' differences of '+c.len+' records'+(c.n?'\n   '+c.ex.join('\n   '):''));
};
await lock("AN.run=false;WORLD.set(false);AN.reset();AN.plantLoad150();",'steady 150 MW');
await lock("const S50=AN.sheets.find(s=>s.name==='ABC-050');const c=AN.hmiCtrls(S50.S).find(x=>x.tag==='PICMS1006');AN.latchMode('PICMS1006','MAN');if(c.manBlk&&S50.S.rt.st[c.manBlk.id])S50.S.rt.st[c.manBlk.id].val=20;else S50.S.rt.ext[c.manNet]=20;const C1=AN.sheets.find(s=>s.name==='ABC-001C');for(let k=0;k<400;k++)AN.stepSet(C1,0.5);",'moving plant (HP bypass M 20 %, 200 s)');
ck(!errs.length,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
