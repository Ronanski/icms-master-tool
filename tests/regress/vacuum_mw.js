// MW follows the vacuum: one condenser inlet closed makes the condenser warmer, and the turbine loses power at the same steam.
// Usage: node tests/regress/vacuum_mw.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{await AN.ades();WORLD.set(true);document.getElementById('load150').click();await AN._startP;
  const U=AN.unit,all=AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name));for(let k=0;k<60;k++){for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}
  const o={T0:U.cdT,d0:U.dMWv,MW0:U.MW,c:AN_CYC.vacLoss(U,U.cdT+5)-AN_CYC.vacLoss(U,U.cdT)};return o});
console.log(JSON.stringify(r));
ck(isFinite(r.T0)&&Math.abs(r.d0)<2,'at 150 MW the back pressure term is small: '+r.d0+' MW at '+r.T0+' C');
ck(r.c>2,'5 C warmer costs '+r.c+' MW');
ck(r.MW0>146&&r.MW0<154,'load stays: '+r.MW0);
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
