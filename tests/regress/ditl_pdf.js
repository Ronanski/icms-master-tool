// 2.5.0-beta.11 (user: "PANO DITL? YUNG PDF REFERENCE ... PAG NAINTINDIHAN MO ANG FLOW AS PDF. KAPAREHA DAPAT NG SA APP"):
// the DITL sheets compared with the drawing PDF (docs/versions/v2.5.0/DITL_PDF_AUDIT.md). Each line below is the logic READ ON THE PDF
// for a place where the app was wrong before 2.5.0-beta.11; the app's reading (same text as tests/regress/ditl_export.js) must hold it.
// Then in SIMULATE: the overtime alarm of DITL-38 (function block FB2-OT, drawn on DITL-50) and the off-sheet connector DITL-26B (A) -> 26A.
// Usage: node tests/regress/ditl_pdf.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const WANT=[
 ['DITL-61A','OUT5','OFF-DELAY 2 s(IN9), OR(IN10, IN8))','row 8 PUMP B TRIP into the small OR (row 11 crosses without a dot)'],
 ['DITL-112','OUT8','ON-DELAY 3 s(IN12))','the 3 s ON DELAY takes row 12 only'],
 ['DITL-26A','OUT5','ON-DELAY 60 s(NOT(IN6))','the 60 s ON DELAY takes NOT row 6 only'],
 ['DITL-26A','OUT5','FROM-DITL-26B(A)','connector (A) from DITL-26B'],
 ['DITL-25A','OUT5','FROM-DITL-25B(1)','connector (1) from DITL-25B'],
 ['DITL-76','OUT5','AND(IN12, IN5, IN4, ON-DELAY 5 s(IN9))','TR533 AND has REMOTE row 5'],
 ['DITL-76','OUT5','AND(IN5, IN4, FROM-DITL-77(7))','auto start AND = REMOTE, AUTO, connector (7) from DITL-77'],
 ['DITL-77','OUT5','FROM-DITL-76(6)','connector (6) from DITL-76'],
 ['DITL-21A','OUT15','AND(ON-DELAY 15 s(IN19), NOT(OFF-DELAY 5 s(IN20)))','connector (13) SPEED LOW'],
 ['DITL-21A','OUT7','SAME-ADDRESS-AS-IN17','row 57 MIT = input row 17 (same address)'],
 ['DITL-35','OUT3','NOT-OF-IN6','row 9 "-M.0172" = NOT row 6'],
 ['DITL-69','OUT22','PULSE 3 s(IN15)','TR23 = 3 SEC.'],
 ['DITL-03A','OUT13','PULSE 2 s(IN21)','TR254 pulse on BOILER PURGE COMPLETED'],
 ['DITL-29A','OUT5','AND(1,','MOP-P1501A = "1"'],
 ['DITL-63','','CMP(>=','limit >= 85 °C'],
 ['DITL-55','','CMP(< S= 0.7','limit S= 0.7 kg/cm2'],
 ['DITL-112','OUT28','CMP(<','/L < 5.6 kg/cm2'],
 ['DITL-38','OUT18','ON-DELAY 11 s(FF[','FB2-OT OPEN OVERTIME (DITL-50)'],
 ['DITL-73','MV','"open":"SV-CR1011  = NOT(IN23','SV-CR1011 from OPEN COMMAND row 23']
];
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(()=>{try{WORLD.set(false)}catch(e){}AN.setCat('dig')});await page.waitForTimeout(800);
const ex=await page.evaluate(()=>{const R={};
 for(const s of S.sheets){const nl=s.nl=netlist(s);const L=[];
  const srcOf=new Map();nl.src.forEach(z=>{if(!srcOf.has(z.n))srcOf.set(z.n,[]);srcOf.get(z.n).push(z.row)});
  const drv=new Map();nl.gates.forEach((g,gi)=>(g.out||[]).forEach(n=>{if(!drv.has(n))drv.set(n,[]);drv.get(n).push(gi)}));
  const one=new Set([...(nl.one||[])]);const rl=i=>'IN'+s.rows[i].n;
  const gn=g=>{if(g.t==='TMR'){const k=g.k==='on'?'ON-DELAY':g.k==='off'?'OFF-DELAY':g.k==='pulse'?'PULSE':g.k==='npulse'?(g.nc?'N.C.CONTACT':'FALL-PULSE'):g.k;return k+' '+tmSecs(g.tm)+' s'}
   if(g.t==='CMP')return 'CMP('+g.cmp+(g.eq?'=':'')+' '+(g.sptxt||g.sp)+')';return g.t};
  const ex=(n,d,seen)=>{if(one.has(n))return '1';const r=srcOf.get(n),G=drv.get(n)||[],p=[];
   if(r&&r.length)p.push(r.map(i=>{const m=(nl.mir||[]).find(m=>m.row===i&&m.neg);return m?'NOT-OF-'+rl(nl.src.find(z=>z.n===m.n).row):rl(i)}).join('|'));
   (nl.ind||[]).filter(m=>m.n===n).forEach(m=>p.push('SAME-ADDRESS-AS-IN'+s.rows[m.row].n));
   (nl.xcon||[]).filter(c=>c.n===n&&c.dir==='in').forEach(c=>p.push('FROM-DITL-'+c.peer+'('+c.num+')'));
   if(seen.has(n))return '↺';if(d>14)return '…';const sn=new Set(seen);sn.add(n);
   for(const gi of G){const g=nl.gates[gi];
    if(g.t==='FF')p.push('FF[S:'+g.s.map(x=>ex(x,d+1,sn)).join(' OR ')+' ; R:'+g.r.map(x=>ex(x,d+1,sn)).join(' OR ')+']');
    else if(g.t==='CMP')p.push(gn(g));else p.push(gn(g)+'('+g.ins.map(x=>ex(x,d+1,sn)).join(', ')+')')}
   return p.length?p.length>1?'WIRED-OR('+p.join(', ')+')':p[0]:'NOTHING'};
  const seen=new Set();nl.outs.forEach(o=>{if(seen.has(o.row+':'+o.n))return;seen.add(o.row+':'+o.n);L.push('OUT'+s.rows[o.row].n+' = '+ex(o.n,0,new Set()))});
  (nl.mv||[]).forEach(b=>L.push('MV {"open":"'+(b.open?b.open.tag+' '+b.open.adr+' = '+(b.open.n>=0?ex(b.open.n,0,new Set()):'-'):'')+'"}'));
  R[s.name]=L}
 return R});
for(const [sh,out,txt,why] of WANT){const k=Object.keys(ex).find(n=>new RegExp(sh+'$').test(n));const L=(ex[k]||[]).filter(l=>l.startsWith(out));
 ck(L.some(l=>l.includes(txt)),sh+' '+out+': '+why+(L.some(l=>l.includes(txt))?'':' | app: '+(L[0]||'none').slice(0,200)))}
// SIMULATE: DITL-38 MCV OPEN OVERTIME (TON_ON 11 s of the MV-BD1001 column) and the OVERTIME FAIL: the valve is made slow (60 s
// travel, a stuck valve) so it is not full opened when the 11 s run out
const sim=async()=>page.evaluate(()=>{const b=[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()==='SIMULATE');b.click()});
await page.evaluate(()=>{S.cur=S.sheets.findIndex(s=>/DITL-38$/.test(s.name));render()});await page.waitForTimeout(300);await sim();await page.waitForTimeout(800);
const ot=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur();s.mvt={0:60};const ix=n=>s.rows.findIndex(r=>+r.n===n),o=()=>simSheet(s).outOn;
 s.sig[ix(2)+':S']=true;await sleep(300);s.sig[ix(5)+':S']=true;await sleep(600);s.sig[ix(5)+':S']=false;
 const a=o().has(ix(18));await sleep(13500);const b=o().has(ix(18)),f=o().has(ix(19));s.mvt={0:1};await sleep(2500);const c=o().has(ix(18));
 s.mvt={};s.sig[ix(2)+':S']=false;return {a,b,f,c}});
ck(!ot.a&&ot.b&&ot.f&&!ot.c,'DITL-38 OPEN P.B. with the valve not full opened: OPEN OVERTIME after 11 s ('+ot.a+' -> '+ot.b+'), OVERTIME FAIL '+ot.f+', the valve reaches FULL OPENED: cleared ('+ot.c+')');
// SIMULATE with the one world: DITL-26B (A) REHEATER OUTLET TEMP > 568 C for 10 s -> DITL-26A connector (A) -> PAF stop OR
const cn=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));WORLD.set(true);await sleep(600);
 const A=S.sheets.find(s=>/DITL-26A$/.test(s.name)),B=S.sheets.find(s=>/DITL-26B$/.test(s.name)),c=A.nl.xcon.find(c=>c.num==='A'),P=xconPeer(A,c);
 const g=B.nl.gates.find(g=>g.t==='TMR'&&g.out.includes(P.c.n));const v0=!!simSheet(A).v[c.n];
 /* the timer input of (A) on DITL-26B: the comparator of row 1 (analog); force the timer input net high as the comparator would */
 const inN=g.ins[0];const was=B.nl.ufx;B.nl.usr=B.nl.usr||[];B.nl.usr.push({n:inN,key:'TST',x:0,y:0});B.usw=B.usw||{};B.usw.TST=1;await sleep(11500);
 const v1=!!simSheet(A).v[c.n];B.usw.TST=0;B.nl.usr.pop();WORLD.set(false);return {v0,v1}});
ck(!cn.v0&&cn.v1,'DITL-26B (A) ON for 10 s reaches DITL-26A connector (A) ('+cn.v0+' -> '+cn.v1+')');
ck(!errs.length,'no page error'+(errs.length?' '+errs.slice(0,2).join(' | '):''));
await browser.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0)})();
