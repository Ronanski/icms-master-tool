// 3.2.0-beta.25 DRUM FILLING AS AN OPERATOR DOES IT (user 2026-10-24: "di makapag drum filling, kahit anong adjust ko sa faceplate ... pasado sa'yo,
// saken hindi?"): Training > "Gabay: Cold", only real clicks on the dock:
// 1. the cold drum is drained: LT-1 / 2 / 3 (ABC-010 LIBR10011 / 12 / 13) and the strip all at about -400 mm
// 2. BFWP step: "Field operator: ayusin" then START BFWP-A -> the BFWP runs (the analog interlock row 12 suction pressure is met)
// 3. filling step: the faceplate in the dock is styled and its MV box opens the ▲ ▼ box; ▲▲ x4 = MV 20 %: FW flow and the three
//    transmitters rise together; at -180 mm the step moves on; ▼▼ shuts the valve; the level holds near -150 mm and the step is done
// Usage: node tests/regress/training_drum.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let f=0;const ck=(ok,t)=>{console.log((ok?'PASS ':'FAIL ')+t);if(!ok)f++};
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));
await p.addInitScript(()=>{window.LS_HOME=false;window.LS_PVWIN=false;window.open=()=>null;try{localStorage.setItem('ls-tab','"logic"');localStorage.removeItem('ls-guide');localStorage.removeItem('ls-gdock-min')}catch(e){}});
await p.goto('file://'+require('path').resolve(html));await p.waitForTimeout(4000);
const clickTxt=async(sel,txt)=>{for(const e of await p.$$(sel)){const t=(await e.textContent()).trim();if(t.includes(txt)&&await e.isVisible()){await e.scrollIntoViewIfNeeded();await e.click();return true}}return false};
const rd=()=>p.evaluate(()=>{const S=AN.sheets.find(x=>x.name==='ABC-010').S;const g=n=>{const j=S.nets.findIndex((x,j)=>String(AN.nm(S,j)||'').trim()===n);return j<0?NaN:+S.rt.v[j]};
 return {cur:LS_GUIDE.cur,t:(LS_GUIDE.steps()[LS_GUIDE.cur]||{}).t||'',lvl:LS_GUIDE.h().lvl(),lt:[g('LIBR10011.PV'),g('LIBR10012.PV'),g('LIBR10013.PV')],fw:LS_GUIDE.h().FW(),bfp:LS_LIVE.val('M.3343'),mv:LS_LIVE.mvOf(LS_LIVE.fp('LICBR1001B'))}});
const until=async(fn,ms)=>{const t0=Date.now();let r;while(Date.now()-t0<ms){r=await rd();if(fn(r))return r;await p.waitForTimeout(500)}return r};
await clickTxt('button','Training');await p.waitForTimeout(800);
ck(await clickTxt('#trainws button','Gabay: Cold'),'Gabay pressed');await p.waitForTimeout(6000);
await clickTxt('#gdock .gd-seg button','×10');
let r=await rd();
ck(r.lt.every(x=>Math.abs(x+400)<3)&&Math.abs(r.lvl+400)<3,'cold drum drained: LT-1/2/3 '+r.lt.map(x=>x.toFixed(0)).join(' / ')+' mm, PV '+r.lvl.toFixed(0));
await p.evaluate(()=>{const S=LS_GUIDE.steps();LS_GUIDE.open(S.findIndex(s=>/feedwater pump \(BFWP\)/.test(s.t)));LS_DOCK.fill(true)});await p.waitForTimeout(2500);
ck(await clickTxt('#gdock .gd-card button','Field operator'),'field operator button pressed');await p.waitForTimeout(1500);
ck(await clickTxt('#gdock .gd-card button','START BFWP-A'),'START BFWP-A pressed');
r=await until(r=>r.bfp>0.5&&/drum filling/.test(r.t),20000);
ck(r.bfp>0.5&&/drum filling/.test(r.t),'BFWP-A running, the guide is on the filling step: '+r.t.slice(0,40));
const st=await p.evaluate(()=>{const g=document.querySelector('#gdock .gd-fp .fpg');return g?getComputedStyle(g).display:'none'});
ck(st==='flex','dock faceplate styled (bar graph display '+st+')');
const mvBox=(await p.$$('#gdock .gd-fp .fpb')).slice(-1)[0];await mvBox.scrollIntoViewIfNeeded();await mvBox.click();await p.waitForTimeout(500);
for(let k=0;k<4;k++){await clickTxt('#gdock .fpop button','▲▲');await p.waitForTimeout(250)}
r=await until(r=>r.lvl>-300,30000);
ck(Math.abs(r.mv-20)<0.5&&r.fw>5&&r.lvl>-300&&Math.max(...r.lt)-Math.min(...r.lt)<3,'faceplate ▲▲ x4: MV '+r.mv.toFixed(0)+' %, FW '+r.fw.toFixed(1)+' T/H, LT '+r.lt.map(x=>x.toFixed(0)).join(' / ')+' mm (rising together)');
r=await until(r=>/^Drum level −150/.test(r.t),40000);
ck(/^Drum level −150/.test(r.t),'at -180 mm the next step: '+r.t.slice(0,40)+' (level '+r.lvl.toFixed(0)+')');
for(let k=0;k<5;k++){await clickTxt('#gdock .fpop button','▼▼');await p.waitForTimeout(200)}
r=await until(r=>!/^Drum level −150/.test(r.t),30000);
ck(r.mv<0.5&&r.lvl>-200&&r.lvl<100&&!/^Drum level −150/.test(r.t),'valve shut (MV '+r.mv.toFixed(0)+' %), level '+r.lvl.toFixed(0)+' mm, step done -> '+r.t.slice(0,40));
ck(!errs.length,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(f?'FAILED '+f:'ALL PASS');await b.close();process.exit(f?1:0)})();
