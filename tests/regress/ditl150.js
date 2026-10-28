// DITL 150 MW state (2.2.0-beta.3, src/world/ditl150.js): "Start at 150 MW" puts the DITL sheets in service too.
// Checks: MFT reset (03A-63 = 0); the DITL outputs that the ABC reads agree with the 150 MW load of the ABC (hmi-op.js AN_HMI_DI);
// BFWP A, IDF, PAF, SAF, FAB A and coal feeder A running; stays so for 60 s with the one world ON;
// BFWP A STOP P.B. -> 23A-55 = 0 -> ABC M.3343 = 0 -> force manual of FICFW1007 (M.0228);
// Reset -> cold DITL (MFT again); with the one world OFF the ABC inputs are not linked. Usage: node tests/regress/ditl150.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const r=await page.evaluate(async()=>{
  const out=(code,nn)=>{const d=S.sheets.find(s=>new RegExp('DITL-'+code+'$').test(s.name));const row=d.rows.findIndex(x=>+x.n===nn-50);return WORLD.out[d.name]&&WORLD.out[d.name].has(row)?1:0};
  const abc=(sh,l)=>{const S_=AN.sheets.find(s=>s.name===sh).S;const n=S_.lab.findIndex(x=>x&&String(x.t).trim()===l);return S_.rt.v[n]};
  const o={};await AN.ades();
  /* world OFF: the 150 MW state of the DITL does not link the ABC */
  WORLD.set(false);document.getElementById('load150').click();
  for(let k=0;k<100&&!DITL150.on;k++)await new Promise(r=>setTimeout(r,100));
  o.offOn=DITL150.on;o.offLinked=!!(AN.sheets.find(s=>s.name==='ABC-010').S.xlk||{})[AN.sheets.find(s=>s.name==='ABC-010').S.lab.findIndex(x=>x&&String(x.t).trim()==='M.3343')];
  o.offM3343=abc('ABC-010','M.3343');
  /* world ON */
  WORLD.set(true);document.getElementById('load150').click();DITL150.on=false;
  for(let k=0;k<100&&!DITL150.on;k++)await new Promise(r=>setTimeout(r,100));
  o.on=DITL150.on;o.rep=DITL150.rep&&{want:DITL150.rep.want,miss:DITL150.rep.miss.length};
  o.mft=out('03A',63);o.bfwp=out('23A',55);o.idf=out('25A',55);o.paf=out('26A',55);o.saf=out('27A',55);o.fab=out('28A',55);o.cf=out('19',57);
  let d=0;const L=[];for(const a of WORLD.idx.ain){const nm=String(AN.nm(a.sh.S,a.n)).trim(),h=AN.hmiDI[nm];if(!h)continue;const g=WORLD.out[a.d.name]&&WORLD.out[a.d.name].has(a.row)?1:0;if(g!==h[0]){d++;L.push(a.sh.name+' '+nm)}}o.diff=d;o.diffL=L;
  /* 60 s of the one world with the ABC */
  const all=AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name));for(let k=0;k<120;k++){for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}
  o.mft60=out('03A',63);o.bfwp60=abc('ABC-010','M.3343');o.mftAbc=abc('ABC-007','I.000F');o.lvl=abc('ABC-010','SI0256');
  /* BFWP A STOP P.B. on the CRT (DITL-23A, REMOTE, not AUTO) -> 23A-55 = 0 -> ABC M.3343 = 0 -> M.0228 force manual of FICFW1007 */
  const d23=S.sheets.find(s=>/DITL-23A$/.test(s.name));const ti=d23.rows.findIndex((x,i)=>/^BFWP A STOP P\.B\.$/.test((d23.cells[i+':S']||[]).map(t=>t.t).join(' ').trim()));
  d23.sig[ti+':S']=true;for(let k=0;k<4;k++){for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}delete d23.sig[ti+':S'];
  for(let k=0;k<10;k++){for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}
  o.tripRow=ti;o.bfwpT=out('23A',55);o.m3343T=abc('ABC-010','M.3343');o.fmT=abc('ABC-010','M.0228');
  /* protection from the ABC: main steam pressure < 72.9 kg/cm2 (ABC-001C M.310D) -> DITL-40 MAIN STEAM PRESSURE LOW LOW */
  {const d40=S.sheets.find(s=>/DITL-40$/.test(s.name)),S1=AN.sheets.find(s=>s.name==='ABC-001C').S,a=S1.blk.find(b=>b.k==='AI'&&(AN.nm(S1,b.o[0])||'').trim()==='AI0131');
   const ll=()=>{WORLD.live=true;const R=simSheet(d40);WORLD.live=false;return R.outOn.has(8)?1:0};o.ll0=ll();o.lnk=WORLD.stat.digFix.join(',')+'|'+((WORLD.idx.din.get(d40)||new Map()).get(d40.rows.findIndex(x=>+x.n===9))||[]).filter(q=>q.k==='a').map(q=>AN.nm(q.sh.S,q.n)).join(',');/* 2.3.0-beta.1: TO DITL 40-09 is tied to M.310D directly (S.dsTo), not through the analog-wire fix */
   for(const b of S1.procs||[])if(b.proc)b.proc.on=false;if(AN.unit)AN.unit.on=false;/* 2.2.0-beta.9: the unit model writes AI0131 too */S1.rt.st[a.id].val=S1.rt.st[a.id].act=60;for(let k=0;k<6;k++){for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}o.ll1=ll()}
  /* Reset = cold */
  AN.reset();WORLD.tick(1);WORLD.tick(1);o.resetOn=DITL150.on;o.mftR=out('03A',63);
  WORLD.set(false);return o});
ck(r.offOn&&!r.offLinked&&r.offM3343===1,'one world OFF: DITL 150 MW state built, ABC M.3343 stays the ABC input (1), not linked');
ck(r.on&&r.mft===0,'Start at 150 MW (one world ON): MFT 03A-63 = '+r.mft+' (checked DITL states '+(r.rep&&r.rep.want)+', not as wanted '+(r.rep&&r.rep.miss)+')');
ck(r.bfwp&&r.idf&&r.paf&&r.saf&&r.fab&&r.cf,'running: BFWP A '+r.bfwp+', IDF '+r.idf+', PAF '+r.paf+', SAF '+r.saf+', FAB A '+r.fab+', coal feeder A '+r.cf);
ck(r.diff===0,'DITL outputs read by the ABC = the 150 MW load of the ABC: '+r.diff+' differ '+r.diffL.join(', '));
ck(r.mft60===0&&r.bfwp60===1&&r.mftAbc===0&&Math.abs(r.lvl)<100,'after 60 s: MFT '+r.mft60+', ABC-010 M.3343 '+r.bfwp60+', ABC-007 I.000F '+r.mftAbc+', drum level '+(+r.lvl).toFixed(1)+' mm');
ck(r.tripRow>=0&&r.bfwpT===0&&r.m3343T===0&&r.fmT===1,'BFWP A STOP P.B. (DITL-23A row '+(r.tripRow+1)+'): 23A-55 '+r.bfwpT+', ABC-010 M.3343 '+r.m3343T+', M.0228 force manual FICFW1007 '+r.fmT);
ck(r.ll0===0&&r.ll1===1&&/M\.310D/.test(r.lnk),'DITL-40 MAIN STEAM PRESSURE LOW LOW from ABC-001C M.310D ('+r.lnk+'): at 150 MW '+r.ll0+', at 60 kg/cm2 '+r.ll1);
ck(r.resetOn===false&&r.mftR===1,'Reset: DITL cold again (MFT '+r.mftR+')');
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
