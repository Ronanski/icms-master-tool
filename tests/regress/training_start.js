// 3.2.0-beta.21 (Training bugs, user 2026-10-24: "ang hirap nya paganahin ... irrun mo ba. pag bumalik ka ng logic magiging VIEW"):
// 1. The page opens on DITL; Training > "Practise: Cold start" (a real click) loads the ABC engine first: the plant is really cold
//    (drum 0 kg/cm2, bed 30 C, turbine off, MSP 0; before: MSP 75, bed 850 C, 3600 rpm) and the simulation RUNS (before: VIEW).
// 2. A tag of a step (info card) while the simulation runs: it keeps running (before: the look put the page in VIEW).
// Usage: node tests/regress/training_start.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));let f=0;const ck=(ok,t)=>{console.log((ok?'PASS ':'FAIL ')+t);if(!ok)f++};
await p.addInitScript(()=>{window.LS_HOME=false;window.LS_PVWIN=false;window.open=()=>null;try{localStorage.setItem('ls-tab','"logic"');localStorage.setItem('ditl.cat','dig');localStorage.removeItem('ls-train');localStorage.removeItem('ls-train-auto')}catch(e){}});
await p.goto('file://'+require('path').resolve(html));await p.waitForTimeout(4000);
const clickTxt=async(sel,txt)=>{for(const e of await p.$$(sel)){const t=(await e.textContent()).trim();if(t.includes(txt)&&await e.isVisible()){await e.click();return true}}return false};
const st=()=>p.evaluate(()=>{const U=AN.unit||{},h=window.CHECK&&AN.sheets&&AN.sheets.length>50?CHECK.H():null;return {cat0:AN.cat,view:AN.view,run:AN.run,ss:AN.startState,Pd:U.Pd,Tb:U.Tb,tb:U.tb&&U.tb.st,MSP:h?+h.MSP().toFixed(1):null}});
const c0=await p.evaluate(()=>AN.cat);
await clickTxt('button','Training');await p.waitForTimeout(800);
ck(await clickTxt('#trainws button','Practise: Cold start'),'Practise: Cold start pressed (page was on '+c0+')');
await p.waitForTimeout(7000);
const a=await st();
ck(a.ss==='plantCold'&&a.Pd===0&&a.Tb<=40&&a.tb==='off'&&a.MSP<1,'really cold: '+JSON.stringify(a));
ck(a.run&&!a.view,'the simulation runs (RUN, not VIEW)');
await clickTxt('button','Training');await p.waitForTimeout(800);
await p.evaluate(()=>lsHome.show(24));await p.waitForTimeout(500);
const tags=await p.$$('#trainws .trtag');let hit=false;
for(const t of tags){const x=(await t.textContent()).trim();if(/FICFA|PICFG|HIC/.test(x)){await t.click();hit=x;break}}
if(!hit&&tags[0]){await tags[0].click();hit='first tag'}
await p.waitForTimeout(1500);const c=await st();
ck(c.run&&!c.view,'tag '+hit+' opened while running: still RUN ('+JSON.stringify(c)+')');
ck(!errs.length,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(f?'FAILED '+f:'ALL PASS');await b.close();process.exit(f?1:0)})();
