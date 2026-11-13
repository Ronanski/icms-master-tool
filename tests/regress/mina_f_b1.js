// Mina findings batch 1, real mouse clicks where a person would press. F2 alarm name, F6 no shutdown text at load, F7 no DITL-777 trip at the
// load, F18 refused LCP START says why, F21 first MWP does not bring the AUTO pumps (DITL-112 TR25 3 s on delay), F29 MANUAL on MV-TS1001.
// Usage: node tests/regress/mina_f_b1.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{let {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
await page.evaluate(()=>{const k=document.querySelector('#scstart .scskip');if(k&&k.getClientRects().length)k.click()});await page.waitForTimeout(800); /* layout C: the start screen closed first, as the operator */
const wait=ms=>page.waitForTimeout(ms);
const clk=async sel=>{const b=await page.evaluate(sel=>{const e=[...document.querySelectorAll(sel)].find(x=>x.getBoundingClientRect().width>0);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},sel);if(b)await page.mouse.click(b[0],b[1]);return !!b};
const btn=async t=>{const b=await page.evaluate(t=>{const p=document.getElementById('fpop');if(!p)return null;const e=[...p.querySelectorAll('button')].find(x=>x.textContent.trim()===t&&x.offsetParent);if(!e)return null;if(e.disabled)return 'off';const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},t);if(b==='off')return 'off';if(!b)return 'none';await page.mouse.click(b[0],b[1]);return 'ok'};
const txt=()=>page.evaluate(()=>((document.getElementById('fpop')||{}).innerText||'').split('\n').join(' · '));
/* layout C: the plant page opens through the shell (lsShellC.openPage, as ash_fp.js / field_ctl.js); the old path (lsPlant + #pllist) is under the start screen */
const go=async(id)=>{await page.evaluate(id=>lsShellC.openPage(id),id);await wait(2000)};
// 150 MW: F2, F6, F7
const a=await page.evaluate(async()=>{await AN.ades();WORLD.set(true);const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);document.getElementById('load150').click();await AN._startP;
  const s=S.sheets.find(x=>x.name.endsWith(')DITL-777')),o=()=>DUI.outVal(s,12);const o0=o();
  return {o0,sw:AN.unit.sd.sw.seal,pa:AN.unit.paPU}});
console.log(JSON.stringify(a));
ck(a.sw===1,'the dome valve seal stands from the load: '+a.sw+' (air '+a.pa+')');
await page.evaluate(()=>{if(AN.view)AN.viewSet(false);AN.run=true});await wait(6000);
const b=await page.evaluate(()=>({o2:(()=>{const T=AN.sheets.find(s=>s.name==='ABC-002').S,n=T.lab.findIndex(x=>x&&String(x.t).trim()==='AI0273');return n<0?NaN:+T.rt.v[n]})(),L:lsAlarms.list().map(x=>x.nm+' '+x.lv+' sd='+!!x.sd),sup:lsAlarms.suppressed(),ev:[...document.querySelectorAll('#evbox *')].length,log:(window.lsEventLog?lsEventLog():[])}));
console.log(b.L.join(' | '));
ck(b.sup===0,'at 150 MW nothing is suppressed: '+b.sup);
ck(b.L.length>0&&b.L.every(x=>/^[A-Z]{2,}[A-Z0-9]*\d/.test(x)&&!/^(SQRT|SUM|AI\d)/.test(x)),'each alarm shows its tag');
/* 3.2.3: at beta.54 the APH inlet O2 AIFG1122 stood HIGH at 150 MW (> 5 %, ABC-002 ALM AI0273 h 5); the plant model now gives 3.7 %, as the HMI
   snapshot (hmi-op.js 1|AI0273 3.6 %) and the FHI excess air 20 %: no HIGH there. F2 (the name) is checked on the alarms that stand: tag + service */
ck(b.L.length>0&&b.L.every(x=>/^[A-Z]{2,}[A-Z0-9]*\d\S* \S.{6,}/.test(x)),'each alarm stands with its tag and its service name: '+b.L.slice(0,2).join(' | '));
ck(b.o2>2.5&&b.o2<5&&!b.L.some(x=>/^AIFG1122 /.test(x)),'APH inlet O2 AIFG1122 '+(+b.o2).toFixed(1)+' % at 150 MW: normal (LOW 2.5 / HIGH 5), no alarm');
ck(!b.L.some(x=>/SYSTEM TRIP/.test(x)),'no SYSTEM TRIP at the load');
// F29 MV-TS1001 on the Extraction page
await go('MK18');
ck(await clk('[data-hit="S1"]'),'MV-TS1001 on the page');await wait(700);
let t=await txt();ck(/AUTO \/ MANUAL/.test(t)&&/AUTO/.test(t),'MV-TS1001 has the AUTO / MANUAL row: '+t.slice(0,160));
ck(await btn('AUTO')==='off','AUTO is the selected one');
ck(await btn('MANUAL')==='ok','MANUAL');await wait(300);await btn('EXECUTE');await wait(2500);t=await txt();
ck(/REMOTE · MANUAL/.test(t),'mode MANUAL: '+(t.match(/MODE · [^·]*· \w+/)||[''])[0]);
ck(await btn('CLOSE')==='ok','CLOSE');await wait(300);await btn('EXECUTE');await wait(5000);
const p=await page.evaluate(()=>+MST[LS_DOCK.dOf('DITL-94').name][0].pos);ck(p<99,'the valve moves: '+p);
await btn('AUTO');await wait(300);await btn('EXECUTE');await wait(1500);t=await txt();ck(/REMOTE · AUTO/.test(t),'back to AUTO');
await page.evaluate(()=>window.LS_FPOP&&LS_FPOP.close());
// Cold: F18 and F21, a fresh page
await browser.close();({browser,page,errs}=await open(html));await page.setViewportSize({width:1600,height:900});
await page.evaluate(()=>{const k=document.querySelector('#scstart .scskip');if(k&&k.getClientRects().length)k.click()});await page.waitForTimeout(800); /* layout C: the start screen closed first, as the operator */
await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);await AN.plantCold();if(AN.view)AN.viewSet(false);AN.run=true});await wait(1500);
await go('MK06');
ck(await clk('[data-hit="PA"]'),'BFWP-A on the page');await wait(700);
if((await txt()).match(/SELECTOR/)){await btn('LOCAL')==='ok'&&(await wait(300),await btn('EXECUTE'));await wait(1500)}
t=await txt();ck(/LOCAL, START blocked/.test(t)&&/LUB/i.test(t),'LOCAL, lube oil off: the line says why: '+(t.match(/Selector at LOCAL[^·]*/)||[''])[0]);
ck(/INTERLOCK/.test(t),'chip INTERLOCK');
ck(await btn('START')!=='none','LCP START');
await page.evaluate(()=>{const p=document.getElementById('fpop');const b=[...p.querySelectorAll('button')].filter(x=>x.textContent.trim()==='START').pop();b.disabled||b.click()});await wait(300);await btn('EXECUTE');await wait(5500);
t=await txt();ck(/LCP START not taken/.test(t)&&/LUB/i.test(t),'refused: '+(t.match(/LCP START not taken[^·]*/)||[''])[0]);
await page.evaluate(()=>window.LS_FPOP&&LS_FPOP.close());
const c=await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');
  const run=(sec)=>{for(let i=0;i<sec*2;i++){AN.stepSet(C,.5);WORLD.live=true;WORLD.tick(.5)}};
  const sh=n=>S.sheets.concat(WORLD.inst||[]).find(x=>x.name.endsWith(n));
  AN.run=false;
  const rem=n=>{const s=sh(n);for(let r=0;r<40;r++){const I=DUI.rowInfo(s,r);if(/REMOTE MODE SELECTED/.test(I.svc||''))s.sig[r+':S']=true}};
  ['DITL-112','DITL-112 #B','DITL-112 #C'].forEach(rem);
  for(const k of ['V-MU0001','V-MU0002','V-MU0003','V-MU0004','V-MU0005','V-MU0007','V-MU0009','V-MU0011','V-MU0013','V-MU0015','V-MU0017'])AN.swValve(k,100);
  run(2);const st=n=>LS_DOCK.mst(n);const o={};
  WORLD.dset('DITL-112',14,true);WORLD.dset('DITL-112 #B',14,true);run(3);o.p0=AN.unit.muP;
  LS_DOCK.dmotor('DITL-112 #C',1);const L=[];for(let k=0;k<20;k++){run(.5);L.push([(k+1)/2,+AN.unit.muP.toFixed(2),st('DITL-112')[0],st('DITL-112 #B')[0],st('DITL-112 #C')[0]].join(' '))}
  o.L=L;o.A=st('DITL-112');o.B=st('DITL-112 #B');o.C=st('DITL-112 #C');o.P=AN.unit.muP;
  /* the header stays low with the discharge of the pump shut: the drawing's standby start after TR25 3 s */
  return o});
console.log(c.L.join(' | '));
ck(c.C==='RUN','MWP-C started: '+c.C);
ck(c.A==='STOP'&&c.B==='STOP','the header comes up inside the 3 s of TR25: the AUTO pumps stay stopped: '+c.A+' '+c.B+' at '+c.P);
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
