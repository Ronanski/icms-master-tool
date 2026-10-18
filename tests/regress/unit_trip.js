// M3 (2.2.0-beta.12): TRIPS with the unit model (src/analog/engine/unit.js). From "Start at 150 MW" the operator forces the DITL
// signals the ABC reads (CLAUDE.md 7: the DITL is forced), and the ABC must answer as the drawing says (force manual, BU-CMD,
// interlock) while the plant answers as the physics says. Scenarios (argv[2], default: all, one after the other):
//   tt   turbine trip: STN102 I.0400 (ABC-050) -> M.3200 on STN101 by the station wiring; HIC-BM / EIC-TM MANUAL (M.2013 / M.2016),
//        HP / LP bypass and blow-off open, MW 0, steam through the bypass (FT-MS1031 sees it: no M.2001); TURBINE TRIP is an MFT
//        first out (STN104 memory list M.053F / B.125F; PR-OPE-5003): the DITL MFT is forced with it, the boiler cools down
//   mft  I.000F MFT FROM IRP on every station, M.0341 MFT TPs, coal feeders stopped: coal 0, O2 21, spray closed (M.0240 / M.0230),
//        temperatures fall with the firing, PA / SA masters MANUAL (M.0098), pressure falls to MAIN STEAM PRESSURE LOW LOW (M.310D)
//   bfwp both BFWP stopped (M.3343 / M.3344): FW 0, FICFW1007 force manual (M.0228), ALL BFWP STOPPED after 15 s (M.0702) blocks the
//        HP bypass (BU-CMD), the drum level falls to low low (M.0170 / M.0172, -254 mm) -> the DITL trips the boiler (forced here)
//   idf  IDF stopped (M.3304): PICFG108 force manual and demand 0 held (M.020F pulse, BU-CMD tracking), furnace pressure rises
//        (M.3107 > 30 mmH2O) to the H.H. -> the DITL trips the boiler and the other fans (forced here), the pressure comes back
//   paf  PAF stopped (M.3302): PA flow 0, FICFA1071 force manual (M.0180), furnace pressure dips and the ID fan follows, the coal is
//        cut by the air / fuel cross limit (LN40), then the DITL trips the boiler (forced here)
//   hh   the operator puts FICFW1007 LOCAL + MANUAL and opens the feedwater valve 100 %: drum level high high (M.0173 / M.0175, +254 mm) -> MFT (forced)
// Usage: node tests/regress/unit_trip.js [tt|mft|bfwp|idf|paf|hh] [html]   (a scenario per process runs them in parallel)
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const want=process.argv.slice(2).filter(a=>!/\.html$/.test(a));const SC=want.length?want:['tt','mft','bfwp','idf','paf','hh'];
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
for(const sc of SC){
 const r=await page.evaluate(async(sc)=>{AN.reset();AN.plantLoad150();
  const sh=k=>AN.sheets.find(s=>s.name===k).S,C1=AN.sheets.find(s=>s.name==='ABC-001C'),S=C1.S,v=S.rt.v,ALL=AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name));
  const lab=(S,l)=>S.lab.findIndex(x=>x&&String(x.t).trim()===l),nm=(S,l)=>{for(let n=0;n<S.lab.length;n++)if((AN.nm(S,n)||'').trim()===l)return n;return -1};
  /* an input of the drawing (ext net) by its label, on one sheet or on every sheet that has it; a station prefix ("S2 I.000F") is accepted */
  const setx=(k,l,x)=>{let n=0;for(const s of (k?[AN.sheets.find(s=>s.name===k)]:ALL)){const T=s.S;for(const e of T.ext){const t=T.lab[e]&&String(T.lab[e].t).trim();if(t===l||(t&&t.replace(/^S\d\s+/,'')===l)){if(T.rt.force[e]===undefined)T.rt.ext[e]=x;n++}}}return n};
  const ctl=(k,t)=>AN.hmiCtrls(sh(k)).find(c=>c.tag===t),pk=(k,t)=>{const c=ctl(k,t);return c&&c.amt?sh(k).rt.st[c.amt.id].pk:'?'};
  const bit=(k,l)=>{const T=sh(k);let n=lab(T,l);if(n<0)n=nm(T,l);return n<0?NaN:+T.rt.v[n]},val=(k,l)=>{const T=sh(k);const n=nm(T,l);return n<0?NaN:+T.rt.v[n]};
  const pv=(k,t)=>+sh(k).rt.v[ctl(k,t).q.pv],mv=(k,t)=>+sh(k).rt.v[ctl(k,t).out];
  const U=AN.unit,coal=()=>U.fuel.reduce((a,l)=>a+(l.length&&isFinite(l[0][0].rt.st[l[0][1].id].val)?+l[0][0].rt.st[l[0][1].id].val:0),0);
  const MSP=()=>+v[lab(S,'AI0131')],MSF=()=>+v[U.cn],MW=()=>+v[lab(S,'AI0419')],SV=()=>+v[ctl('ABC-001C','PIC-COBM').q.sv];
  const hbm=S.blk.find(b=>b.k==='MAN'&&b.tag==='HIC-BM'),bmA=S.blk.find(b=>b.k==='AMT'&&b.sel===lab(S,'M.2013'));
  const o={sc,ck:[],log:[]},C=(ok,w)=>o.ck.push([!!ok,w]);const seen={};const mark=(k,cond)=>{if(cond)seen[k]=1};
  const S10=sh('ABC-010'),lic=ctl('ABC-010','LICBR1001'),fwc=ctl('ABC-010','FICFW1007'),mv7=nm(sh('ABC-008'),'PICFG108.MV');
  const lvl=()=>+S10.rt.v[lic.q.pv],FW=()=>+S10.rt.v[fwc.q.pv],FP=()=>pv('ABC-008','PICFG108'),PA=()=>val('ABC-006','FIFA1071.PV'),O2=()=>pv('ABC-002','AICFG112');
  const say=t=>o.log.push(t+'s MW '+MW().toFixed(1)+' MSP '+MSP().toFixed(1)+' Pd '+U.Pd.toFixed(1)+' MSF '+MSF().toFixed(0)+' coal '+coal().toFixed(1)+' FW '+FW().toFixed(0)+' lvl '+lvl().toFixed(0)+' FurnP '+FP().toFixed(0)+' PA '+PA().toFixed(0)+' O2 '+O2().toFixed(1)+' MST '+pv('ABC-012','TICMS1004').toFixed(0)+' HPB '+mv('ABC-050','PICMS1006').toFixed(1)+' LPB '+mv('ABC-052','PICHR1003').toFixed(1)+' BLO '+mv('ABC-013','PICMS1002').toFixed(1)+' BM '+bit('ABC-001C','M.2013')+' TM '+bit('ABC-001C','M.2016')+' IDF '+pk('ABC-008','PICFG108')+' '+(+sh('ABC-008').rt.v[mv7]).toFixed(1)+'/'+mv('ABC-008','PICFG108').toFixed(1));
  const mft=()=>{setx(null,'I.000F',1);for(const k of ['ABC-003B','ABC-003C','ABC-003D'])setx(k,'M.0341',1);for(const l of ['M.3400','M.3401','M.3402','M.3405'])setx(null,l,0);o.mftAt=t};
  let t=0,mftT=null;const run=(sec,cb)=>{for(let i=0;i<sec*2;i++){AN.stepSet(C1,.5);t+=0.5;if(o.mftAt!=null&&Math.abs(t-o.mftAt-2)<0.01)for(const k of ['ABC-003B','ABC-003C','ABC-003D'])setx(k,'M.0341',0);if(cb)cb(t);if(Math.abs(t%20)<0.01)say(t)}};
  run(60);say(0);const P0=MSP(),L0=lvl(),F0=coal(),FP0=FP(),FW0=FW();o.t0=t;
  if(sc==='tt'){
   /* STN104 memory list: "TURBINE TRIP FIRST OUT" (M.053F / B.125F) is one of the MFT first-out causes, like DRUM LVL HI-HI and FURNACE
      PRESSURE H.H.; PR-OPE-5003 normal shutdown: "bypass turbine trip alarm at MFT and boiler interlock to maintain boiler operation"
      (so a turbine trip that is NOT bypassed trips the boiler). The DITL is forced: the MFT comes with the turbine trip */
   const n=setx('ABC-050','I.0400',1);C(n===1,'turbine trip input STN102 I.0400 (ABC-050) set');mft();
   let mspMax=0,hpbMax=0,lpbMax=0,bloMax=0,m2001=0,mw60=null,msf60=null;
   run(300,t=>{mark('M.0124',bit('ABC-050','M.0124')>0.5);mark('M.0705',bit('ABC-050','M.0705')>0.5);mark('BM',S.rt.st[bmA.id].pk==='B');
    mspMax=Math.max(mspMax,MSP());hpbMax=Math.max(hpbMax,mv('ABC-050','PICMS1006'));lpbMax=Math.max(lpbMax,mv('ABC-052','PICHR1003'));bloMax=Math.max(bloMax,mv('ABC-013','PICMS1002'));if(t-o.t0<=60&&bit('ABC-001C','M.2001')>0.5)m2001++;
    if(Math.abs(t-o.t0-60)<0.01){mw60=MW();msf60=MSF()}});
   C(bit('ABC-001C','M.3200')>0.5&&bit('ABC-010','M.3200')>0.5,'station wiring: STN101 M.3200 T/B TRIP (ABC-001C, ABC-010) follows STN102 I.0400');
   C(seen.BM&&bit('ABC-001C','M.2013')>0.5,'boiler master HIC-BM MANUAL by the BU-CMD M.2013 (turbine trip)');
   C(bit('ABC-001C','M.2016')>0.5,'turbine master EIC-TM MANUAL by M.2016 (turbine trip)');
   C(seen['M.0124'],'ABC-050 M.0124 TURBINE TRIP / HOUSE LOAD / 52G OPEN pulse (5 s)');
   C(seen['M.0705'],'ABC-050 M.0705 HP bypass BU-CMD pulse');
   C(bit('ABC-010','M.022B')>0.5,'ABC-010 M.022B (turbine trip): feedwater demand from the LAG of the steam flow');
   C(mw60<5,'MW '+mw60.toFixed(1)+' after 60 s (turbine valves closed by the TCS)');
   C(msf60>46&&msf60<260,'main steam flow '+msf60.toFixed(0)+' T/H after 60 s: the steam of the cooling bed goes through the HP bypass and the blow-off (FT-MS1031 sees it)');
   C(m2001===0,'M.2001 BOILER STEAM FLOW < 46 T/H not set in the first 60 s (steam flows through the bypass)');
   C(hpbMax>20,'HP bypass PICMS1006 opened (max '+hpbMax.toFixed(1)+' %)');C(lpbMax>10,'LP bypass PICHR1003 opened (max '+lpbMax.toFixed(1)+' %)');C(bloMax>50,'blow-off PICMS1002 opened (max '+bloMax.toFixed(1)+' %)');
   C(mspMax<=150.5&&MSP()<mspMax-10&&MSP()<135,'main steam pressure max '+mspMax.toFixed(1)+' kg/cm2 (range 150), '+MSP().toFixed(1)+' after 300 s (was '+P0.toFixed(1)+'): the stored steam goes out through the bypass and the blow-off, the pressure comes down');
   C(coal()<1,'coal '+coal().toFixed(1)+' T/H after the MFT');
  }
  if(sc==='mft'){
   const n=setx(null,'I.000F',1);C(n>=9,'I.000F MFT FROM IRP set on '+n+' sheets (every station)');mft();
   let c10=null,sprayMV=null,pa5=null,sa5=null;
   run(400,t=>{if(Math.abs(t-o.t0-10)<0.01){c10=coal();sprayMV=[mv('ABC-012','TICBR1150'),mv('ABC-011','TICBR1130')]}if(Math.abs(t-o.t0-5)<0.01){pa5=pk('ABC-007','FICFA1071');sa5=pk('ABC-007','FICFA1081')}});
   C(c10<1,'coal '+c10.toFixed(1)+' T/H 10 s after the MFT (feeders stopped)');
   C(sprayMV[0]<0.5&&sprayMV[1]<0.5,'SH spray closed by the MFT: TICBR1150 '+sprayMV[0].toFixed(1)+' %, TICBR1130 '+sprayMV[1].toFixed(1)+' % (M.0240 / M.0230)');
   C(pa5==='B'&&sa5==='B','PA / SA masters MANUAL after the MFT (M.0098 -> M.0180 / M.0190): '+pa5+' / '+sa5);
   C(O2()>15,'O2 '+O2().toFixed(1)+' % (no fuel, the fans run)');
   C(pv('ABC-012','TICMS1004')<500,'main steam temperature '+pv('ABC-012','TICMS1004').toFixed(0)+' C after 400 s without firing (superheat lost)');
   C(MSP()<P0-30,'main steam pressure '+MSP().toFixed(1)+' kg/cm2 (was '+P0.toFixed(1)+'): the stored steam is used up');
   C(bit('ABC-001C','M.310D')>0.5,'M.310D MAIN STEAM PRESSURE LOW LOW (< 72.9) reached -> DITL-40');
   C(bit('ABC-001C','M.2013')>0.5&&bit('ABC-001C','M.2016')>0.5,'boiler and turbine masters MANUAL (steam flow < 220 T/H, M.0101)');
  }
  if(sc==='bfwp'){
   setx('ABC-010','M.3343',0);setx('ABC-050','M.3343',0);C(bit('ABC-010','M.3344')<0.5,'BFWP B was standby (M.3344 = 0), BFWP A stopped: no BFWP running');
   let fw3=null,ll=null,hpbPk=null;
   run(150,t=>{if(Math.abs(t-o.t0-3)<0.01)fw3=FW();mark('M.0702',bit('ABC-050','M.0702')>0.5);mark('M.0705',bit('ABC-050','M.0705')>0.5);if(bit('ABC-050','M.0702')>0.5&&!hpbPk)hpbPk=pk('ABC-050','PICMS1006');
    if(ll==null&&bit('ABC-010','M.0170')>0.5&&bit('ABC-010','M.0172')>0.5){ll=t-o.t0;/* the DITL: DRUM LEVEL L.L. -> MFT, STN104 M.3407 to the ABC */setx('ABC-055','M.3407',1);mft()}});
   C(fw3<5,'feedwater flow '+fw3.toFixed(1)+' T/H 3 s after the pumps stopped');
   C(bit('ABC-010','M.0228')>0.5&&pk('ABC-010','FICFW1007')==='B','FICFW1007 FEED WATER CONTROL FORCE MANUAL (M.0228)');
   C(seen['M.0702']&&seen['M.0705'],'ABC-050 M.0702 ALL BFWP STOPPED (TON 15 s) and M.0705 HP bypass BU-CMD');
   C(hpbPk==='B','HP bypass PICMS1006 MANUAL (BU-CMD, no spray water without a BFWP)');
   C(ll!=null&&ll<120,'drum level low low M.0170 / M.0172 (-254 mm) after '+(ll==null?'-':ll.toFixed(0))+' s -> DITL drum level L.L. (M.3407) and MFT (forced)');
   C(coal()<1,'coal '+coal().toFixed(1)+' T/H after the MFT');
   C(bit('ABC-055','M.3407')>0.5&&bit('ABC-055','M.0315')<0.5,'ABC-055 M.0315 stays 0 with the drum level L.L. (NOT M.3407 in the AND)');
  }
  if(sc==='idf'){
   setx(null,'M.3304',0);let hiAt=null,hhAt=null,mv3=null,mv10=null,fpEnd=null;
   run(200,t=>{mark('M.020F',bit('ABC-008','M.020F')>0.5);const d=t-o.t0;if(Math.abs(d-3)<0.01)mv3=+sh('ABC-008').rt.v[mv7];if(Math.abs(d-10)<0.01)mv10=+sh('ABC-008').rt.v[mv7];
    if(hiAt==null&&bit('ABC-008','M.3107')>0.5)hiAt=d;if(hhAt==null&&FP()>300){hhAt=d;/* the DITL: FURNACE PRESSURE H.H. -> MFT; IDF stopped -> PAF / SAF trip */mft();setx(null,'M.3302',0);setx(null,'M.3303',0)}});
   C(bit('ABC-008','M.0205')>0.5&&pk('ABC-008','PICFG108')==='B','PICFG108 furnace pressure control force manual (M.0205, IDF not running)');
   C(seen['M.020F'],'M.020F IDF NOT RUNNING TPs pulse');
   C(mv3<0.5&&mv10<0.5,'IDF demand PICFG108.MV 0 at 3 s and still 0 at 10 s ('+mv3.toFixed(1)+' / '+mv10.toFixed(1)+' %): the BU-CMD value is held by the COS');
   C(hiAt!=null&&hiAt<60,'furnace pressure high M.3107 (> 30 mmH2O) after '+(hiAt==null?'-':hiAt.toFixed(1))+' s (air in, no ID fan)');
   C(hhAt!=null,'furnace pressure > 300 mmH2O (ALM H.H.) after '+(hhAt==null?'-':hhAt.toFixed(1))+' s -> DITL MFT and PAF / SAF trip (forced)');
   C(Math.abs(FP())<150,'furnace pressure '+FP().toFixed(0)+' mmH2O at the end (no air in, no ID fan: near the anchor)');
   C(coal()<1&&PA()<5,'coal '+coal().toFixed(1)+' T/H, PA flow '+PA().toFixed(0)+' T/H after the MFT');
  }
  if(sc==='paf'){
   setx(null,'M.3302',0);let pa3=null,fpMin=1e9,idfMin=1e9,c120=null;
   run(200,t=>{const d=t-o.t0;if(Math.abs(d-3)<0.01)pa3=PA();if(d<120){fpMin=Math.min(fpMin,FP());idfMin=Math.min(idfMin,mv('ABC-008','PICFG108'))}if(Math.abs(d-120)<0.01){c120=coal();/* the DITL: PA fan stopped / PA flow L.L. -> MFT */mft()}});
   C(pa3<5,'primary air flow '+pa3.toFixed(1)+' T/H 3 s after the PAF stopped');
   C(pk('ABC-007','FICFA1071')==='B','FICFA1071 PA master MANUAL (M.0180)');
   C(fpMin<FP0-20,'furnace pressure dipped to '+fpMin.toFixed(0)+' mmH2O (was '+FP0.toFixed(0)+'): less air in');
   C(idfMin<mv('ABC-008','PICFG108')+100&&idfMin<45,'ID fan demand came down to '+idfMin.toFixed(1)+' % (PICFG108 in AUTO answers the dip)');
   C(c120<0.6*F0,'coal '+c120.toFixed(1)+' T/H after 120 s (was '+F0.toFixed(1)+'): cut by the air / fuel cross limit LN40');
   C(O2()>15&&coal()<1,'after the MFT: coal '+coal().toFixed(1)+' T/H, O2 '+O2().toFixed(1)+' %');
  }
  if(sc==='hh'){
   /* the operator at the FICFW1007 faceplate: L (LOCAL: the SV switch leaves the cascade of LICBR1001; REMOTE locks the station in AUTO,
      hmi.js bMan.disabled = rem), then M, then MV 100 % (the COS manual input is an ext net of the sheet) */
   const q=S10.rt.st[fwc.svSw.id];q.al='A';q.fm='B';const st=S10.rt.st[fwc.amt.id];st.al=fwc.autoLeg;st.fm=fwc.autoLeg==='A'?'B':'A';
   if(fwc.manBlk&&S10.rt.st[fwc.manBlk.id])S10.rt.st[fwc.manBlk.id].val=100;else S10.rt.ext[fwc.manNet]=100;
   let hhAt=null,fwMax=0;run(300,t=>{fwMax=Math.max(fwMax,FW());if(hhAt==null&&bit('ABC-010','M.0173')>0.5&&bit('ABC-010','M.0175')>0.5){hhAt=t-o.t0;/* the DITL: DRUM LEVEL H.H. -> MFT */mft()}});
   C(pk('ABC-010','FICFW1007')==='B'&&fwMax>FW0+30,'FICFW1007 LOCAL + MANUAL 100 %: feedwater up to '+fwMax.toFixed(0)+' T/H (was '+FW0.toFixed(0)+')');
   C(hhAt!=null&&hhAt<280,'drum level high high M.0173 / M.0175 (+254 mm) after '+(hhAt==null?'-':hhAt.toFixed(0))+' s -> DITL MFT (forced)');
   C(hhAt!=null&&coal()<1,'coal '+coal().toFixed(1)+' T/H after the MFT');
  }
  say(t);o.lvl=[L0,lvl()];return o},sc);
 console.log('=== '+sc);for(const l of r.log)console.log('     '+l);for(const [ok,w] of r.ck)ck(ok,w);
}
ck(errs.length===0,'no page error'+(errs.length?': '+errs.join(' | '):''));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
