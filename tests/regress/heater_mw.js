// No.2 HP heater shut at 150 MW: feedwater colder, steam made per coal less, the extraction stays in the turbine, the unit holds.
// Usage: node tests/regress/heater_mw.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{await AN.ades();WORLD.set(true);document.getElementById('load150').click();await AN._startP;
  const U=AN.unit,all=AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name)),h=S.sheets.find(x=>x.name.endsWith(')DITL-94'));let shut=false;const step=n=>{for(let k=0;k<n;k++){WORLD.live=true;if(shut)MST[h.name][0].pos=0;for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}};
  step(30);const a={MW:U.MW,fw:U.hpT2,fac:U.hpFac,x:U.dMWx,xt:U.xtra};
  shut=true;
  step(200);const b={MW:U.MW,fw:U.hpT2,fac:U.hpFac,x:U.dMWx,xt:U.xtra,tr:U.tb&&U.tb.st};return {a,b}});
console.log(JSON.stringify(r));
ck(r.a.x<0.5&&r.a.fac>0.995,'all heaters in: no effect at 150 MW: '+r.a.x+' MW, factor '+r.a.fac);
ck(r.b.fw<232,'feedwater falling toward 195.7 C (lag 120 s, 100 s here): '+r.b.fw);
ck(r.b.fac<0.975&&r.b.fac>0.89,'steam per coal falls: factor '+r.b.fac);
ck(r.b.x>2&&r.b.x<16,'the extraction works in the turbine: '+r.b.x+' MW, '+r.b.xt+' T/H');
ck(r.b.MW>143&&r.b.MW<157,'the unit stays on load: '+r.b.MW);
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
