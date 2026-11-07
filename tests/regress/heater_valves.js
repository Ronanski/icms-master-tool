// Water side of the heaters: a heater bypassed gives colder feedwater; tubes and bypass both shut stop the water.
// Usage: node tests/regress/heater_valves.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{await AN.ades();WORLD.set(true);document.getElementById('load150').click();await AN._startP;
  const U=AN.unit,all=AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name)),step=n=>{for(let k=0;k<n;k++){WORLD.live=true;for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}};
  step(10);const a={fw:U.hpT2,x:U.dMWx,fp:U.fwPath,cp:U.cdPath};
  AN.swValve('V-FW1014',100);AN.swValve('V-FW1012',0);AN.swValve('V-FW1013',0);step(120);const b={fw:U.hpT2,x:U.dMWx,fp:U.fwPath,fac:U.hpFac};
  AN.swValve('V-FW1014',0);step(4);const c={fp:U.fwPath};
  AN.swValve('V-FW1012',100);AN.swValve('V-FW1013',100);AN.swValve('V-CD1031',0);AN.swValve('V-CD1029',0);step(4);const d={cp:U.cdPath};AN.swValve('V-CD1029',100);
  return {a,b,c,d,tags:['V-FW1009','V-FW1014','V-CD1026','V-CD1031'].map(t=>t in AN.swValves())}});
console.log(JSON.stringify(r));
ck(r.a.fp===1&&r.a.cp===1&&r.a.x<0.5,'normal line-up changes nothing');
ck(r.b.fw<225&&r.b.x>2&&r.b.fp===1,'No.2 HP heater on its bypass: feedwater '+r.b.fw+' C, '+r.b.x+' MW, water still flows');
ck(r.c.fp===0,'tubes and bypass shut: feedwater stops');
ck(r.d.cp===0,'No.3 LP heater tubes and bypass shut: condensate stops');
ck(r.tags.every(Boolean),'the valves are field valves');
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
