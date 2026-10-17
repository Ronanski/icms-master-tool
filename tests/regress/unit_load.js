// M2 (2.2.0-beta.9): NORMAL OPERATION + LOAD DOWN / UP with the unit model (src/analog/engine/unit.js).
// Start at 150 MW, TARGET MW 60 on HIC-ULD (rate HIC-MWRL 3.0 MW/min, 33.PNG), then back to 150. Steps like the app: ONE stepSet
// of the boiler master sheet (ABC-001C) per 0.5 s (its 36 linked sheets step once each).
// The operator (PR-OPE-5003: "Maintain MS pressure 123-126 ksc"): below 220 T/H of main steam the drawing puts the boiler master in
// MANUAL (ABC-001C M.2013 = NOT M.0101, M.0101 = MSF > 220 T/H); the operator moves HIC-BM to hold the pressure and presses A again
// above 220 T/H. Pass: at 60 MW and at 150 MW the plant is within 5 % of the snapshots (02.png 60.3 MW: MSF 203.7 T/H, coal 41.8 T/H;
// 4.PNG / 03.png 150 MW: MSF 474 T/H), MSP within 5 % of its set point, drum level inside +-100 mm, no low-low pressure, no page error.
// Usage: node tests/regress/unit_load.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);if(process.env.UDBG)await page.evaluate(()=>{window.__dbg=1});let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(()=>{AN.reset();AN.plantLoad150();
 const L=AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name)),C1=AN.sheets.find(s=>s.name==='ABC-001C'),S=C1.S,v=S.rt.v;
 const lab=(S,l)=>S.lab.findIndex(x=>x&&String(x.t).trim()===l);
 let SU,bu;for(const sh of L){const z=sh.S.blk.find(z=>z.k==='MAN'&&(z.tag==='HIC-ULD'||(z.txt||[]).includes('HIC-ULD')));if(z){SU=sh.S;bu=z;break}}
 const tgt=(SU.drv[bu.i[bu.svI]]||[]).find(z=>z.k==='AMT').a;
 const bm=S.blk.find(b=>b.k==='AMT'&&b.sel===lab(S,'M.2013'));
 const S10=AN.sheets.find(s=>s.name==='ABC-010').S,lv=AN.hmiCtrls(S10).find(c=>c.tag==='LICBR1001');
 const cobm=AN.hmiCtrls(S).find(c=>c.tag==='PIC-COBM'),hbm=S.blk.find(b=>b.k==='MAN'&&b.tag==='HIC-BM'),htm=S.blk.find(b=>b.k==='MAN'&&b.tag==='EIC-TM'),tmA=S.blk.find(b=>b.k==='AMT'&&b.sel===lab(S,'M.2016'));
 window.__u={log:[],dbg:!!window.__dbg,C1,S,v,SU,tgt,bm,hbm,htm,tmA,goal:60,S10,lv,cobm,lab,man:0,minP:1e9,maxL:0,ll:0};
});
const run=(sec,rec)=>page.evaluate(async([sec,rec])=>{const u=window.__u,U=AN.unit,S=u.S,v=u.v;
 for(let t=0;t<sec;t+=10){for(let k=0;k<20;k++)AN.stepSet(u.C1,.5);
  const st=S.rt.st[u.bm.id],P=+v[u.lab(S,'AI0131')],sv=+v[u.cobm.q.sv],lvl=+u.S10.rt.v[u.lv.q.pv];
  const dP=u.pP==null?0:P-u.pP;u.pP=P;
  if(rec){u.minP=Math.min(u.minP,P);u.maxL=Math.max(u.maxL,Math.abs(lvl));if(+v[u.lab(S,'M.310D')]>0.5)u.ll=1}
  /* the operator: boiler master in MANUAL -> move HIC-BM (its COS) to hold the pressure; above 220 T/H press A */
  /* boiler master in AUTO again (above 230 T/H, PR-OPE-5002 "Put Boiler Master to Auto"): TARGET MW 150 */
  /* the operator. CCS (33.PNG): HIC-ULD TARGET MW drives the unit. Below 220 T/H of main steam the drawing puts the boiler master in
     MANUAL (ABC-001C M.2013 = NOT M.0101) and with it the turbine master (M.2016: boiler master not in AUTO); the unit load demand
     then tracks the generator MW. PR-OPE-5003 / 5002: the operator holds the main steam pressure with HIC-BM and moves the load with
     EIC-TM (MAN station, its MV is the MW to the TCS), 1.2 MW/min down; up: the firing first (HIC-BM), the turbine follows the
     pressure. Both stations go back to AUTO by themselves above 220 T/H (no latch on the drawing); then TARGET MW 150 */
  const tmS=S.rt.st[u.tmA.id],tm=S.rt.st[u.htm.id];
  if(st.pk==='B'){u.man=1;const m=S.rt.st[u.hbm.id];
   if(u.up){m.val=Math.min(100,m.val+0.05);if(tmS.pk==='B')tm.val=Math.max(0,Math.min(200,tm.val+Math.max(-0.2,Math.min(0.2,0.1*(P-sv)))));}
   else{m.val=Math.max(0,Math.min(100,m.val+Math.max(-1,Math.min(1,0.0011*(sv-P)-0.2*dP))));if(tmS.pk==='B')tm.val=Math.max(u.goal,tm.val-0.2);}}
  /* PR-OPE-5002 "At 230 T/H MSF ... Put Boiler Master to Auto" (CLAUDE.md 10): the stations stay MANUAL after the BU-CMD; the
     operator turns MAN off on HIC-BM, then on EIC-TM (CCS), above 230 T/H and with the BU-CMD gone */
  if(u.up&&st.pk==='B'&&U.ms>230&&+v[u.lab(S,'M.2013')]<0.5){u.bmA=(u.bmA||0)+1;for(const [S2,n] of AN.modeNets('HIC-BM'))S2.rt.ext[n]=0}
  if(u.up&&st.pk==='A'&&tmS.pk==='B'&&+v[u.lab(S,'M.2016')]<0.5){u.tmA2=(u.tmA2||0)+1;for(const [S2,n] of AN.modeNets('EIC-TM'))S2.rt.ext[n]=0}
  if(u.up&&u.man&&st.pk==='A'&&tmS.pk==='A'){u.auto=1}
  /* while the BU-CMD is still there, the station stays MANUAL; it must NOT go to AUTO by itself when the BU-CMD goes */
  if(u.up&&u.man&&!u.bmA&&st.pk==='A')u.selfAuto=1;
  if(u.auto&&st.pk==='A'&&tmS.pk==='A')u.SU.rt.ext[u.tgt]=150;
  if(u.dbg&&t%60===50)u.log.push('t+'+(t+10)+' dem='+(+u.SU.rt.v[u.lab(u.SU,'SI0226')]).toFixed(1)+' tgt='+(+u.SU.rt.ext[u.tgt]).toFixed(1)+' D='+(+v[u.lab(S,'SI0236')]).toFixed(1)+' MW='+U.MW.toFixed(1)+' P='+P.toFixed(1)+' Pd='+U.Pd.toFixed(1)+' ms='+U.ms.toFixed(0)+' Qs='+U.Qs.toFixed(0)+' BM='+(+v[u.lab(S,'HIC-BM.MV')]).toFixed(1)+' pk='+st.pk+' COBM='+(+v[u.lab(S,'PIC-COBM.MV')]).toFixed(1)+' FF='+(+v[u.lab(S,'SI0201')]).toFixed(1)+' M2013='+v[u.lab(S,'M.2013')]+' mb='+(U.mb||0).toFixed(0)+' bpv='+(U.vlv||[]).map(x=>(+x.S.rt.v[x.n]).toFixed(1)).join('/')+' CM='+(()=>{const S4=AN.sheets.find(x=>x.name==='ABC-004A').S;const c=AN.hmiCtrls(S4).find(c=>c.tag==='FIC-CM');const q=S4.rt.st[c.amt.id];const f=AN.hmiCtrls(S4).find(c=>c.tag==='HS-COAL');return 'pv'+(+S4.rt.v[c.q.pv]).toFixed(0)+'/sv'+(+S4.rt.v[c.q.sv]).toFixed(0)+'/mv'+(+S4.rt.v[c.out]).toFixed(0)+'/'+q.pk+(q.fman?'F':'')+' HS'+S4.rt.st[f.amt.id].pk+(S4.rt.st[f.amt.id].fman?'F':'')+' SI0010='+(+S4.rt.v[u.lab(S4,'SI0010')]).toFixed(0)})()+' TM='+tmS.pk+(+tm.val).toFixed(1)+' coal='+U.fuel.reduce((a,l)=>a+(+l[0][0].rt.st[l[0][1].id].val),0).toFixed(1));
  if(t%300===290)await new Promise(r=>setTimeout(r,0))}},[sec,rec]);
const st=()=>page.evaluate(()=>{const u=window.__u,U=AN.unit,v=u.v,S=u.S;return{dem:+u.SU.rt.v[u.lab(u.SU,'SI0226')],D:+v[u.lab(S,'SI0236')],MW:U.MW,MSP:+v[u.lab(S,'AI0131')],SV:+v[u.cobm.q.sv],MSF:+v[U.cn],coal:U.fuel.reduce((a,l)=>a+(+l[0][0].rt.st[l[0][1].id].val),0),FW:+u.S10.rt.v[u.lab(u.S10,'AI0256')],lvl:+u.S10.rt.v[u.lv.q.pv],bm:u.S.rt.st[u.bm.id].pk}});
const say=(w,x)=>console.log('     '+w+': MW '+x.MW.toFixed(1)+' (demand '+x.dem.toFixed(1)+'), MSP '+x.MSP.toFixed(1)+' (SV '+x.SV.toFixed(1)+'), MSF '+x.MSF.toFixed(1)+' T/H, coal '+x.coal.toFixed(1)+' T/H, FW '+x.FW.toFixed(1)+' T/H, drum level '+x.lvl.toFixed(0)+' mm, boiler master '+(x.bm==='A'?'AUTO':'MANUAL'));
const near=(x,ref,p)=>Math.abs(x-ref)<=Math.abs(ref)*p/100;
await run(300,1);const a=await st();say('150 MW, 5 min',a);
ck(near(a.MW,150,3)&&near(a.MSF,474.1,5)&&near(a.MSP,a.SV,5),'Start at 150 MW stays: MW '+a.MW.toFixed(1)+', MSF '+a.MSF.toFixed(1)+', MSP '+a.MSP.toFixed(1));
await page.evaluate(()=>{const u=window.__u;u.SU.rt.ext[u.tgt]=60});
await run(600,1);const b=await st();say('TARGET 60, after 10 min',b);
ck(b.dem<125&&b.dem>115&&near(b.MW,b.D,3),'load down at 3 MW/min: demand '+b.dem.toFixed(1)+' after 10 min; MW '+b.MW.toFixed(1)+' follows the turbine demand SI0236 '+b.D.toFixed(1)+' (LAG 150 s of ABC-001C)');
await run(1200+1200,1);const c=await st();say('60 MW, settled',c);
ck(near(c.MW,60.3,5)&&near(c.MW,c.D,3),'60 MW: MW '+c.MW.toFixed(1)+' (02.png 60.3)');
ck(near(c.MSF,203.7,5),'60 MW: main steam flow '+c.MSF.toFixed(1)+' T/H (02.png 203.7)');
ck(near(c.coal,41.8,5),'60 MW: coal '+c.coal.toFixed(1)+' T/H (02.png 41.8)');
ck(near(c.MSP,c.SV,5),'60 MW: MSP '+c.MSP.toFixed(1)+' at its set point '+c.SV.toFixed(1)+' (PR-OPE-5003: maintain MS pressure)');
ck(c.bm==='B','60 MW: boiler master MANUAL (MSF < 220 T/H, M.2013 = NOT M.0101)');
await page.evaluate(()=>{const u=window.__u;u.up=1});
await run(5400,1);const d=await st();say('back to 150, settled',d);
ck(near(d.MW,150,3)&&near(d.MSF,474.1,5)&&near(d.MSP,d.SV,5),'back to 150 MW: MW '+d.MW.toFixed(1)+', MSF '+d.MSF.toFixed(1)+' (474.1), MSP '+d.MSP.toFixed(1));
ck(d.bm==='A','150 MW: boiler master back in AUTO (operator turned MAN off above 230 T/H, PR-OPE-5002)');
{const z2=await page.evaluate(()=>{const u=window.__u;return{self:!!u.selfAuto,bm:u.bmA||0,tm:u.tmA2||0}});
 ck(!z2.self&&z2.bm>0,'BU-CMD latch: the boiler master stayed MANUAL after the BU-CMD went, until the operator selected AUTO ('+(z2.self?'went to AUTO BY ITSELF':'operator AUTO pressed')+')')}
const z=await page.evaluate(()=>{const u=window.__u;return{minP:u.minP,maxL:u.maxL,ll:u.ll}});
ck(z.maxL<=100&&!z.ll,'no trip: drum level within '+z.maxL.toFixed(0)+' mm (limit 100), lowest MSP '+z.minP.toFixed(1)+' (LL 72.9: '+(z.ll?'REACHED':'not reached')+')');
if(process.env.UDBG)console.log((await page.evaluate(()=>window.__u.log)).join('\n'));
ck(!errs.length,'no page error'+(errs.length?': '+errs[0]:''));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
