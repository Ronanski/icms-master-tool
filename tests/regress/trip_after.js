// 3.2.1 (CLAIMS sweep 14 / 32, "reading" items): after a turbine trip and an MFT at 150 MW, what the drum level, the feedwater, the
// reheat pressure and the LP bypass do. Mina saw: LP bypass 0 after the trip (one reading), drum level +170 mm in 3 min with the
// feedwater still about 475 T/H (before beta.177). Prints a row every 30 s for 5 min after the trip (page engine, one step per 0.5 s).
// Pass: drum level inside +-250 mm (HH trip band) and the LP bypass opens while the reheat holds pressure. Usage: node tests/regress/trip_after.js
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(async()=>{await AN.ades();WORLD.set(true);DITL150.on=false;document.getElementById('load150').click();
 for(let k=0;k<600&&(!DITL150.on||AN._loading);k++)await new Promise(r=>setTimeout(r,100));window.__T={cs:AN.sheets.find(s=>s.name==='ABC-001C')}});
const run=sec=>page.evaluate(async sec=>{for(let t=0;t<sec;t+=0.5){AN.stepSet(window.__T.cs,.5);WORLD.tick(.5)}},sec);
const snap=()=>page.evaluate(()=>{const L=window.LS_LIVE,U=AN.unit,pv=t=>{try{const f=L.fp(t);return +f.S.rt.v[f.c.q.pv]}catch(e){return NaN}},mv=t=>{try{return +L.mvOf(L.fp(t))}catch(e){return NaN}},v=a=>{try{return +L.val(a)}catch(e){return NaN}};
 const sv=t=>{try{const f=L.fp(t);return +f.S.rt.v[f.c.q.sv]}catch(e){return NaN}};return{ms:+U.ms,Pd:+U.Pd,fwsv:sv('FICFW1007'),lvsv:sv('LICBR1001'),lvmv:mv('LICBR1001'),MW:U.MW,lvl:pv('LICBR1001'),fw:pv('FICFW1007'),fwmv:mv('FICFW1007'),msp:pv('PIC-COBM'),rhp:pv('PICHR1003'),lpb:mv('PICHR1003'),MFT:v('I.000F'),tb:U.tb&&U.tb.st}});
await run(60);
console.log('t_s,MW,drum_mm,FW_TH,FW_SV,FW_MV,LIC_SV,LIC_MV,steam_out_model,Pd,MSP,RHP,LPbypass_MV,MFT,turbine');
const row=(t,x)=>console.log([t,x.MW.toFixed(1),x.lvl.toFixed(0),x.fw.toFixed(0),x.fwsv.toFixed(0),x.fwmv.toFixed(1),x.lvsv.toFixed(0),x.lvmv.toFixed(1),x.ms.toFixed(1),x.Pd.toFixed(1),x.msp.toFixed(1),x.rhp.toFixed(2),x.lpb.toFixed(1),x.MFT,x.tb].join(','));
row(0,await snap());
console.log('     turbine trip: '+await page.evaluate(()=>AN.turbine('trip')));
let lmax=-1e9,lmin=1e9,lpbMax=0;
for(let t=30;t<=300;t+=30){await run(30);const x=await snap();row(t,x);lmax=Math.max(lmax,x.lvl);lmin=Math.min(lmin,x.lvl);if(isFinite(x.lpb))lpbMax=Math.max(lpbMax,x.lpb)}
ck(lmax<250&&lmin>-250,'drum level inside +-250 mm after the trip (from '+lmin.toFixed(0)+' to '+lmax.toFixed(0)+')');
ck(lpbMax>1,'LP bypass opens after the trip (max MV '+lpbMax.toFixed(1)+' %)');
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
