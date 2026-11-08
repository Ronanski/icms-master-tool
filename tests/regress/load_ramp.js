// 3.2.1 b6 / e3 (user testing plan 2026-11-08): the load ramp as the operator does it (Mina's live way): Start at 150 MW (one world),
// HIC-MWRL MANUAL 1.2 MW/min (PR-OPE-5003), HIC-ULD target 90 MW in AUTO (the Training dock arrows, guide.js A.target), hold, back to
// 150. Every sheet and the DITL step as in the app. Prints one CSV row per plant minute (the same columns as the app recorder) for
// the PC-only comparison with the plant trends (team-files/tools/trend-compare), and checks what needs no plant data: no trip, the
// load reaches the target, MSP near its set point, drum level inside +-150 mm. Usage: node tests/regress/load_ramp.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(async()=>{await AN.ades();WORLD.set(true);DITL150.on=false;document.getElementById('load150').click();
 for(let k=0;k<300&&(!DITL150.on||AN._loading);k++)await new Promise(r=>setTimeout(r,100));
 if(window.LS_LIVE&&LS_LIVE.recClear)LS_LIVE.recClear();
 /* one step of the app per 0.5 s (sched.js: stepSet of the page sheet steps every active sheet). Stepping each sheet gave ~50 plant minutes per test minute */window.__R={cs:AN.sheets.find(s=>s.name==='ABC-001C'),all:AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name)),rows:[],mx:{lvl:0},trip:0};});
/* run sec seconds of plant time, a row each minute */
const run=sec=>page.evaluate(async sec=>{const R=window.__R,L=window.LS_LIVE;
 for(let t=0;t<sec;t+=60){for(let k=0;k<120;k++){AN.stepSet(R.cs,.5);WORLD.tick(.5)}
  if(L.recNow)L.recNow();
  const U=AN.unit;R.trip=R.trip||(U.tb&&U.tb.st==='off'?1:0);
  const row={t:Math.round(U.t/60),MW:U.MW};R.rows.push(row);
  await new Promise(r=>setTimeout(r,0))}},sec);
const snap=()=>page.evaluate(()=>{const L=window.LS_LIVE,U=AN.unit,pv=t=>{try{const f=L.fp(t);return f.kind==='ctl'?+f.S.rt.v[f.c.q.pv]:NaN}catch(e){return NaN}},sv=t=>{try{const f=L.fp(t);return +f.S.rt.v[f.c.q.sv]}catch(e){return NaN}};
 return{MW:U.MW,MSP:pv('PIC-COBM'),SV:sv('PIC-COBM'),lvl:pv('LICBR1001'),MST:pv('TICMS1004'),RHT:pv('TICHR1002'),tb:U.tb&&U.tb.st}});
const act=(f,a)=>page.evaluate(([f,a])=>{const A=window.LS_GUIDE&&LS_GUIDE.A;return A?A[f](...a):'no guide'},[f,a]);
await run(300);const a=await snap();
ck(Math.abs(a.MW-150)<3&&a.tb==='load','150 MW holds 5 min: MW '+a.MW.toFixed(1)+', MSP '+a.MSP.toFixed(1)+' (SV '+a.SV.toFixed(1)+')');
console.log('     MWRL 1.2: '+await act('man',['HIC-MWRL',1.2])+' · ULD target 90: '+await act('target',['HIC-ULD',90]));
let lo=1e9,hi=-1e9,lv=0;
for(let m=0;m<60;m+=5){await run(300);const x=await snap();lo=Math.min(lo,x.MSP-x.SV);hi=Math.max(hi,x.MSP-x.SV);lv=Math.max(lv,Math.abs(x.lvl));console.log('     t+'+(m+5)+' min: MW '+x.MW.toFixed(1)+', MSP '+x.MSP.toFixed(1)+' / SV '+x.SV.toFixed(1)+', drum '+x.lvl.toFixed(0)+' mm, MST '+x.MST.toFixed(0)+', RHT '+x.RHT.toFixed(0)+', turbine '+x.tb)}
const b=await snap();
ck(Math.abs(b.MW-90)<3,'down at 1.2 MW/min: 90 MW reached ('+b.MW.toFixed(1)+')');
console.log('     ULD target 150: '+await act('target',['HIC-ULD',150]));
for(let m=0;m<60;m+=5){await run(300);const x=await snap();lo=Math.min(lo,x.MSP-x.SV);hi=Math.max(hi,x.MSP-x.SV);lv=Math.max(lv,Math.abs(x.lvl));console.log('     up t+'+(m+5)+' min: MW '+x.MW.toFixed(1)+', MSP '+x.MSP.toFixed(1)+' / SV '+x.SV.toFixed(1)+', drum '+x.lvl.toFixed(0)+' mm, MST '+x.MST.toFixed(0)+', RHT '+x.RHT.toFixed(0)+', turbine '+x.tb)}
const c=await snap();
ck(Math.abs(c.MW-150)<3,'back up: 150 MW reached ('+c.MW.toFixed(1)+')');
ck(lo>-8&&hi<8,'MSP within 8 kg/cm2 of its set point all the way (from '+lo.toFixed(1)+' to +'+hi.toFixed(1)+')');
ck(lv<150,'drum level inside +-150 mm (max '+lv.toFixed(0)+')');
const tr=await page.evaluate(()=>window.__R.trip);ck(!tr,'no turbine trip');
console.log('RECORDER CSV');console.log(await page.evaluate(()=>window.LS_LIVE&&LS_LIVE.recCsv?LS_LIVE.recCsv():'none'));
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
