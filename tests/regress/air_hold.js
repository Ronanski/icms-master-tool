// 3.2.1 (Mina 2026-11-09, re-shell test at 150 MW): after RUN with no operator action the total air went 593 -> 617 T/H and the O2
// 3.6 -> 4.5 % in 3 min. This holds 150 MW for 30 min of plant time (page engine, one step per 0.5 s, no operator action) and prints a row
// each minute: load, coal, the three air flows and their set points, the total air, the O2 PV / SV / MV and the boiler master.
// Report: whether air and O2 settle, and where. Usage: node tests/regress/air_hold.js
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(async()=>{await AN.ades();WORLD.set(true);DITL150.on=false;document.getElementById('load150').click();
 for(let k=0;k<600&&(!DITL150.on||AN._loading);k++)await new Promise(r=>setTimeout(r,100));window.__T={cs:AN.sheets.find(s=>s.name==='ABC-001C')}});
const run=sec=>page.evaluate(async sec=>{for(let t=0;t<sec;t+=0.5){AN.stepSet(window.__T.cs,.5);WORLD.tick(.5)}},sec);
const snap=()=>page.evaluate(()=>{const L=window.LS_LIVE,U=AN.unit,g=k=>{try{return +L.getV(k)}catch(e){return NaN}};
 const q=(t,w)=>{try{const f=L.fp(t);return w==='mv'?+L.mvOf(f):+f.S.rt.v[f.c.q[w]]}catch(e){return NaN}};
 return{MW:g('MW'),coal:g('coal'),PA:g('PA'),SA:g('SA'),FA:g('FA'),AIR:g('AIR'),O2:g('O2'),o2sv:q('AICFG112','sv'),o2mv:q('AICFG112','mv'),
  pasv:q('FICFA1071','sv'),sasv:q('FICFA1081','sv'),bm:q('PIC-COBM','mv'),msp:g('MSP')}});
const f=(x,d)=>isFinite(x)?x.toFixed(d):'NaN';
console.log('min,MW,coal,PA,PA_SV,SA,SA_SV,FA,AIR,O2,O2_SV,O2_MV,BM_MV,MSP');
const row=(m,x)=>console.log([m,f(x.MW,1),f(x.coal,1),f(x.PA,1),f(x.pasv,1),f(x.SA,1),f(x.sasv,1),f(x.FA,1),f(x.AIR,1),f(x.O2,2),f(x.o2sv,2),f(x.o2mv,1),f(x.bm,1),f(x.msp,1)].join(','));
const modes=()=>page.evaluate(()=>{const L=window.LS_LIVE,o={};for(const t of ['AICFG112','FICFA1071','FICFA1081','PIC-COBM','FIC-CM']){try{const f=L.fp(t);o[t]=JSON.stringify(L.modeOf(f))+' mv='+(+L.mvOf(f)).toFixed(1)+' sv='+(f.c.q.sv!=null?(+f.S.rt.v[f.c.q.sv]).toFixed(2):'-')+' sheet='+f.sh}catch(e){o[t]='ERR '+e.message}}return o});
console.log('MODES t0 '+JSON.stringify(await modes()));
const x0=await snap();row(0,x0);let x=x0,last5=[];
for(let m=1;m<=30;m++){await run(60);x=await snap();row(m,x);if(m>25)last5.push(x)}
console.log('MODES t30 '+JSON.stringify(await modes()));
const sp=k=>Math.max(...last5.map(y=>y[k]))-Math.min(...last5.map(y=>y[k]));
ck(sp('AIR')<10,'total air settled in the last 5 min (spread '+f(sp('AIR'),1)+' T/H, now '+f(x.AIR,1)+', start '+f(x0.AIR,1)+')');
ck(Math.abs(x.O2-x.o2sv)<0.5,'O2 near its set point after 30 min (PV '+f(x.O2,2)+', SV '+f(x.o2sv,2)+')');
ck(x.MW>145&&x.MW<155,'load holds (MW '+f(x.MW,1)+')');
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
