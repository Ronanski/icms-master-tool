// 3.2.1 (Mina beta.146 ~ 154): the generator breaker 52G1 as the DITL shows it (pages 13 / 17): at 150 MW "GCB 52G1 ON" (DITL-89 row 15,
// I.0931) = 1 and "52G1 OPEN" (DITL-03E row 3, M.3220 from the station wiring = I.0932) = 0; after a turbine trip 52G1 OPEN = 1 and
// GCB 52G1 ON = 0 (IBD TA-6: 52G open by ST TRIP). Usage: node tests/regress/gcb.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const r=await page.evaluate(async()=>{await AN.ades();WORLD.set(true);DITL150.on=false;document.getElementById('load150').click();
 for(let k=0;k<300&&(!DITL150.on||AN._loading);k++)await new Promise(r=>setTimeout(r,100));
 const all=AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name)),step=n=>{for(let k=0;k<n;k++){for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}};
 const row=(nm,n)=>{const d=S.sheets.find(s=>s.name.endsWith(')'+nm));const i=d.rows.findIndex(x=>+x.n===n);return DUI.rowVal(d,i)};
 const o={};step(40);o.on0=row('DITL-89',15);o.open0=row('DITL-03E',3);o.mw0=AN.unit.MW;
 o.trip=AN.turbine('trip');step(40);o.on1=row('DITL-89',15);o.open1=row('DITL-03E',3);o.st=AN.unit.tb.st;return o});
ck(r.on0===1&&r.open0===0,'150 MW ('+(+r.mw0).toFixed(1)+' MW): GCB 52G1 ON (DITL-89 r15) '+r.on0+', 52G1 OPEN (DITL-03E r3) '+r.open0);
ck(r.on1===0&&r.open1===1,'after TURBINE TRIP ('+r.st+'): GCB 52G1 ON '+r.on1+', 52G1 OPEN '+r.open1+' (IBD TA-6: 52G open by ST TRIP)');
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
