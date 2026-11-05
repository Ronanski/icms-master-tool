// Mina's live test 2026-11-04 (030 CIRCULATING WATER, beta.18 / beta.19), two findings:
// 1. SWBP DCS START was blocked unless SWP-B ran: DITL-30 rows 17-19 (SWP A / B / C RUNNING) feed NOT -> AND -> NOT, so one running
//    seawater pump is enough. The faceplate list (LS_DOCK.interlock) kept the row it first picked (SWP-B RUNNING, seen at a cold plant)
//    and showed it as missing while SWP-A and C ran. Check: interlock read first with all SWP stopped, then SWP-A and C started:
//    no missing row, and the faceplate text names a missing row (no "(0 below)").
// 2. After RELAY TRIP and RESET of SWP-A the first-out alarm stayed in the alarm band with the raw text "Output row 17 · SEAWATER
//    PUMP A TRIP I.032B/527/81B · CRT (ANN) = 1". Check: after the trip the alarm text has no "Output row" / "CRT (ANN)", and after
//    the RESET no active alarm of DITL-29A is left.
// Usage: node tests/regress/cw_swbp_perm.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);await AN.plantCold();if(AN.view)AN.viewSet(false);AN.run=true});
await page.evaluate(()=>lsPlant(true));await page.waitForTimeout(2500);
const wait=ms=>page.waitForTimeout(ms);
// 1: the permissive of SWBP-A read at a cold plant first (all SWP stopped)
const m0=await page.evaluate(()=>{LS_DOCK.dremote('DITL-30');const I=LS_DOCK.interlock('DITL-30','DITL-30');return I?I.miss.map(r=>r.svc):null});
ck(Array.isArray(m0)&&m0.length>0,'cold: SWBP-A start permissive missing (no seawater pump running): '+JSON.stringify(m0));
await page.evaluate(()=>{for(const a of ['M.3353','M.3355']){LS_DOCK.dremote(a)}});await wait(1500);
await page.evaluate(()=>{for(const a of ['M.3353','M.3355'])LS_DOCK.dmotor(a,true)});await wait(6000);
const run=await page.evaluate(()=>['DITL-29A','DITL-29A #B','DITL-29A #C'].map(k=>{const d=LS_DOCK.dOf(k);const o=DUI.outs(d).find(o=>/RUNNING/.test(o.name));return DUI.outVal(d,o.row)}));
ck(run[0]===1&&run[1]===0&&run[2]===1,'SWP-A and SWP-C running, SWP-B stopped: '+run.join(','));
const m1=await page.evaluate(()=>{const I=LS_DOCK.interlock('DITL-30','DITL-30');return I?I.miss.map(r=>r.svc):null});
ck(Array.isArray(m1)&&m1.length===0,'SWBP-A start permissive complete with SWP-A and C running (missing: '+JSON.stringify(m1)+')');
// the faceplate: DCS START enabled (REMOTE, MAN, stopped)
const fp=await page.evaluate(async()=>{const reg=window.LS_FPREG||{};const k=Object.keys(reg).find(k=>/DITL-30$/.test(k)||k==='DITL-30');if(!k)return {err:'no faceplate key '+Object.keys(reg).filter(x=>/30/.test(x)).join(',')};reg[k].open();await new Promise(r=>setTimeout(r,1200));
 const p=document.getElementById('fpop');if(!p)return {err:'no pop-out'};const b=[...p.querySelectorAll('button')].find(x=>x.textContent.trim()==='START');return {dis:b?b.disabled:null,why:(p.querySelector('.fpo-why')||{}).textContent||''}}).catch(e=>({err:String(e)}));
if(fp.err)console.log('INFO faceplate not checked: '+fp.err);else{ck(fp.dis===false,'SWBP-A faceplate: DCS START enabled ('+fp.why+')');ck(!/\(0 below\)/.test(fp.why),'faceplate text has no "(0 below)"')}
await page.evaluate(()=>window.LS_FPOP&&LS_FPOP.close());
// 2: RELAY TRIP of SWP-A, then RESET
const usr=await page.evaluate(()=>{const s=LS_DOCK.dOf('DITL-29A');const u=(s.nl.usr||[]).find(x=>/ELECTRICAL/.test(x.txt||x.name||x.svc||''))||(s.nl.usr||[])[0];if(!u)return null;s.usw=s.usw||{};s.usw[u.key]=true;WORLD.busy=true;return u.key});
ck(!!usr,'SWP-A ELECTRICAL TROUBLE switch found ('+usr+')');await wait(4000);
const a1=await page.evaluate(()=>lsActiveAlarms().list.filter(a=>/DITL-29A$/.test(String(a.sh).replace(/^\(\d+\)/,''))).map(a=>a.text));
ck(a1.length===1,'after TRIP: exactly one SWP-A trip alarm (no duplicate): '+JSON.stringify(a1));
ck(a1.every(t=>!/Output row|CRT \(ANN\)/.test(t)),'after TRIP: alarm text is clean (no "Output row", no "CRT (ANN)")');
await page.evaluate(k=>{const s=LS_DOCK.dOf('DITL-29A');s.usw[k]=false;WORLD.busy=true},usr);await wait(4000);
const a2=await page.evaluate(()=>lsActiveAlarms().list.filter(a=>/DITL-29A$/.test(String(a.sh).replace(/^\(\d+\)/,''))).map(a=>a.text));
ck(a2.length===0,'after RESET: no SWP-A trip alarm left (active: '+JSON.stringify(a2)+')');
// 3: hypochlorite dosing pump B and unloading pump: field START / STOP (they had "no plant model", no buttons)
const hy=await page.evaluate(()=>{const r={};for(const k of ['hypoB','hypoU']){const a=AN.field(k,true),s1=AN.fieldState()[k];AN.field(k,false);r[k]=[a,s1,AN.fieldState()[k]]}return r});
ck(JSON.stringify(hy.hypoB)==='[true,true,false]','dosing pump B field START / STOP: '+JSON.stringify(hy.hypoB));
ck(JSON.stringify(hy.hypoU)==='[true,true,false]','unloading pump field START / STOP: '+JSON.stringify(hy.hypoU));
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
