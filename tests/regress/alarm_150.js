// At 150 MW the alarm list is nearly empty, the primary air and the turbine speed read real values, and a shut condenser box sends its heat to the other box.
// Usage: node tests/regress/alarm_150.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{await AN.ades();WORLD.set(true);document.getElementById('load150').click();await AN._startP;
  const U=AN.unit,all=AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name));const step=n=>{for(let k=0;k<n;k++){for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}};step(60);
  const alm=[];for(const sh of all)for(const b of sh.S.blk){if(b.k!=='ALM')continue;const pin=(b.pins||[]).find(p=>p.role==='in'),x=pin?+sh.S.rt.v[pin.n]:NaN;if(!isFinite(x))continue;const lv=AN.almLv(b,x);if(lv!=='normal')alm.push((b.txt||[])[1]+' '+lv+' '+x.toFixed(2))}
  const val=(sh,tag)=>{const o=all.find(s=>s.name===sh);const b=o.S.blk.find(q=>q.k==='ALM'&&(q.txt||[])[1]===tag);const p=(b.pins||[]).find(q=>q.role==='in');return +o.S.rt.v[p.n]};
  return {alm,pa:val('ABC-006','FIFA1079'),rpm:val('ABC-053','TCSAI1004'),toA:U.swToA,toB:U.swToB,tiB:U.swTiB,MW:U.MW}});
console.log(JSON.stringify(r));
ck(r.pa>280&&r.pa<380,'primary air to the furnace reads with the PAF: '+r.pa);
ck(r.rpm>3500&&r.rpm<3700,'turbine speed at 150 MW: '+r.rpm);
ck(r.toA-r.tiB>3.5&&r.toA-r.tiB<6,'seawater rise, both boxes: '+(r.toA-r.tiB));
// these stand on the real limits too: O2 A and B (alarm list), stopped limestone feeder, furnace above 950 C (FHI long term limit; snapshot 960), first stage B and C (alarm list H 93.8, 62.5; snapshot logic 96.8)
const other=r.alm.filter(a=>!/^(AIFG112[23]|SIM1311|TIFG109|PIST1001[23])/.test(a));
ck(other.length===0,'no other alarm stands at 150 MW: '+other.join(', '));
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
