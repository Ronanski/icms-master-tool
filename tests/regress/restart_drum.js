// 3.2.1 (Mina beta.170, CLAIMS 30): Warm / Hot restart start with the drum filled for the bottle-up (PR-OPE-5004 step 4: +200 mm), not
// the empty drum of Cold (-296 mm). Loads each restart, prints the drum level PV and pressure, runs 2 min of plant time paused-free.
// Pass: level within 200 +- 40 mm right after the load. Usage: node tests/regress/restart_drum.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(async()=>{await AN.ades();WORLD.set(true)});
for(const k of ['warm','hot']){
 const r=await page.evaluate(async k=>{await AN.loadStart(k,true);const L=window.LS_LIVE,pv=t=>{try{const f=L.fp(t);return +f.S.rt.v[f.c.q.pv]}catch(e){return NaN}};
  const a={lvl:pv('LICBR1001'),Pd:AN.unit.Pd,Tb:AN.unit.Tb};const cs=AN.sheets.find(s=>s.name==='ABC-001C');for(let t=0;t<120;t+=.5){AN.stepSet(cs,.5);WORLD.tick(.5)}
  a.lvl2=pv('LICBR1001');return a},k);
 console.log(k+': drum level '+r.lvl.toFixed(0)+' mm at load, '+r.lvl2.toFixed(0)+' mm after 2 min; drum pressure '+(+r.Pd).toFixed(1)+'; bed '+(+r.Tb).toFixed(0));
 ck(Math.abs(r.lvl-200)<40,k+' restart drum level near +200 mm (PR-OPE-5004 bottle-up)');
}
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
