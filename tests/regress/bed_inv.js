// Bed inventory: weight on the grate gives the furnace pressure drop, ash in and screws out move it, Fig 9 limits. Usage: node tests/regress/bed_inv.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{const P=(rpm,h)=>{const U={Fc:89,burn:1,lmQ:12,sdQ:0};for(let i=0;i<h*60;i++)AN.bedStep(U,60,rpm,354);return {I:U.bedI,inn:U.bedIn,k:U.bedK}};
  const hold=P(3.3,10),none=P(0,10),fast=P(8,10);const cold=AN.bedStep({cold:1,Fc:0,burn:0},1,0,0);
  await AN.ades();WORLD.set(true);document.getElementById('load150').click();await AN._startP;const U=AN.unit,all=AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name));for(let k=0;k<30;k++){for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}
  const s=all.find(x=>x.name==='ABC-006');return {hold,none,fast,cold,U:{I:U.bedI,k:U.bedK,inn:U.bedIn,out:U.bedOut,dp:U.bedDp.map(([L])=>L.length),sc:(U.bedSc||[]).length},MW:U.MW}});
console.log(JSON.stringify(r.U));
ck(Math.abs(r.hold.I-169.7)<4,'screws at the ash make the bed hold: '+r.hold.I+' t');
ck(r.none.I>180,'screws stopped: the bed grows: '+r.none.I);
ck(r.fast.I<160,'screws fast: the bed falls: '+r.fast.I);
ck(r.cold===0,'no air: no pressure drop');
ck(r.U.sc===4&&r.U.dp[0]>0&&r.U.dp[1]>0,'four screws and both transmitters are linked');
ck(Math.abs(r.U.k-1)<0.02,'at 150 MW the pressure drop stays at the snapshot: '+r.U.k);
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
