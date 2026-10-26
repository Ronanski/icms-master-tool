// 3.2.0-beta.40 (user: "pre may mga DITL pages na wala pa. SAND LIMESTONE BOTTOM ASH SOOTBLOWER"): the 7 sand injection sheets
// (D71)DITL-771 ~ (D77)DITL-777 (SAND INJECTION SYSTEM CONTROL LOGIC (1) ~ (7), station 103 FM0007), read from the vector PDF
// E10210-3-771 ~ 777 (tools/data/sand_sheet.py, audit docs/versions/v3.2.0/DITL_SAND_AUDIT.md).
// In Run: 771 START -> SYSTEM ON seal-in -> STOP; 773 fluidizing air valves 3 s one after the other; 775 limit switch -> lamp; the FROM / TO page links.
// Usage: node tests/regress/ditl_sand.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(()=>{try{WORLD.set(false)}catch(e){}AN.setCat('dig')});
await page.waitForFunction(()=>S.sheets.filter(s=>/^\(D\d+\)DITL-77\d$/.test(s.name)).length>=7,null,{timeout:60000});await page.waitForTimeout(500);
const L=await page.evaluate(()=>{const ls=S.sheets.filter(s=>/^\(D\d+\)DITL-77\d$/.test(s.name));
 const nl=ls.map(s=>[s,netlist(s)]);
 return {n:ls.length,cat:ls.every(s=>ditlCat(s)==='SAND INJECTION (SD1300)'),out:nl.filter(([s,n])=>n.outs.length).length,
  und:nl.map(([s,n])=>{const d=new Set([...n.src.map(z=>z.n),...(n.mir||[]).map(m=>m.n)]);n.gates.forEach(g=>(g.out||[]).forEach(x=>d.add(x)));
   return n.gates.filter(g=>[...(g.ins||[]),...(g.s||[]),...(g.r||[])].some(x=>!d.has(x))).map(g=>s.name.replace(/^.*DITL-/,'')+' '+g.t)}).flat(),
  tm:nl.flatMap(([s,n])=>n.gates.filter(g=>g.t==='TMR').map(g=>(g.tm.tag||'-')+'='+g.tm.fv.v+(g.k==='pulse'?'P':''))).join(' '),
  // every FROM flag (in) has the TO flag (out) with the same number on the sheet it names
  link:nl.flatMap(([s,n])=>n.xcon.filter(c=>c.dir==='in').map(c=>{const p=nl.find(([t])=>t.name.endsWith('DITL-'+c.peer));const me=s.name.replace(/^.*DITL-/,'');
   return p&&p[1].xcon.some(o=>o.dir==='out'&&o.num===c.num&&String(o.peer)===me)?null:me+' FROM '+c.peer+' '+c.num}).filter(Boolean)),
  nx:nl.reduce((a,[s,n])=>a+n.xcon.length,0)}});
ck(L.n===7&&L.cat&&L.out===7,'7 sand sheets in the SAND INJECTION (SD1300) category, all with outputs ('+L.out+')');
ck(!L.und.length,'every block input has a wire from an input row or a block ('+(L.und.join(', ')||'none open')+')');
ck(/TR307=3 /.test(L.tm)&&/TR311=12 /.test(L.tm)&&/TR312=30 /.test(L.tm)&&/TR315=600 /.test(L.tm)&&/TR328=300 /.test(L.tm)&&/TR329=180 /.test(L.tm)&&/TR386=10 /.test(L.tm)&&/TR385=1P/.test(L.tm),'timers as drawn: '+L.tm);
ck(L.nx>=40&&!L.link.length,'page links FROM / TO: '+L.nx+' flags, every FROM has its TO ('+(L.link.join(', ')||'none open')+')');
const run=async()=>page.evaluate(()=>[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()==='▶ Run').click());
const reset=async()=>page.evaluate(()=>[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()==='Reset').click());
const go=async n=>{await page.evaluate(n=>{S.cur=S.sheets.findIndex(s=>s.name.endsWith('DITL-'+n));render()},n);await page.waitForTimeout(300)};
// 771: SYSTEM READY (row 2) + REMOTE switch (row 5), START (row 3) -> SYSTEM ON (row 15) + SYSTEM START lamp (row 16); held after START is released; STOP (row 4) drops it
await go('771');await run();await page.waitForTimeout(400);
const st=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),ix=n=>s.rows.findIndex(r=>+r.n===n),o=n=>simSheet(s).outOn.has(ix(n)),t=(n,v)=>{s.sig[ix(n)+':S']=v;render()};
 const a=o(15);t(2,true);t(5,true);await sleep(300);const b0=o(15);t(3,true);await sleep(400);const b=o(15)&&o(16);t(3,false);await sleep(400);const c=o(15);
 t(4,true);await sleep(400);const d=o(15);t(4,false);await sleep(300);const e=o(15);await sleep(2500);
 t(3,true);await sleep(300);t(3,false);await sleep(300);const g0=o(15);t(1,true);await sleep(400);const f=g0&&!o(15)&&o(14);
 return {a,b0,b,c,d,e,f,g0,m:o(14)}});
ck(!st.a&&!st.b0&&st.b&&st.c&&!st.d&&!st.e&&st.f,'771 SYSTEM ON: idle '+st.a+', ready without START '+st.b0+', START '+st.b+', held '+st.c+', STOP '+st.d+' stays off '+!st.e+'; MFT BOILER STOP (row 1) drops it and lights the flag '+st.f+' (held again '+st.g0+', flag '+st.m+')');
await reset();await page.waitForTimeout(300);
// 773: INLET DV OPEN (row 1) -> fluidizing air valve #1 for 3 s, then valve #2 for 3 s (TR317 ~ TR320, TR321 3 s pulse)
await go('773');await run();await page.waitForTimeout(400);
const fl=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),o=n=>simSheet(s).outOn.has(s.rows.findIndex(r=>+r.n===n)),r=[];
 s.sig['0:S']=true;render();
 for(let i=0;i<6;i++){await sleep(1500);r.push((o(2)?1:0)+''+(o(4)?1:0))}
 s.sig['0:S']=false;render();await sleep(500);r.push((o(2)?1:0)+''+(o(4)?1:0));return r.join(' ')});
ck(fl==='10 10 00 00 01 01 00','773 fluidizing air valves #1 then #2 (every 1.5 s): '+fl);
await reset();await page.waitForTimeout(300);
// 775: each limit switch row lights its own lamp row (VENT VALVE FULLY OPEN LS I.056A -> VENT VALVE OPEN)
await go('775');await run();await page.waitForTimeout(400);
const ls=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),ix=n=>s.rows.findIndex(r=>+r.n===n),o=n=>simSheet(s).outOn.has(ix(n)),r=[];
 for(const [i,l] of [[1,8],[2,9],[3,10],[4,11],[5,12],[6,13]]){s.sig[ix(i)+':S']=true;render();await sleep(250);r.push((o(l)?'1':'0')+([8,9,10,11,12,13].filter(x=>o(x)).length));s.sig[ix(i)+':S']=false;render();await sleep(150)}
 return r.join(' ')});
ck(ls==='11 11 11 11 11 11','775 limit switch -> lamp, one at a time: '+ls);
await reset();await page.waitForTimeout(300);
ck(!errs.length,'no page error'+(errs.length?' '+errs.slice(0,2).join(' | '):''));
await browser.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0)})();
