// 2.5.0-beta.15 (user: "pre may mga DITL pages na wala pa. SAND LIMESTONE BOTTOM ASH SOOTBLOWER"): the 23 limestone injection sheets
// (L10)DITL-LS10 ~ (L240)DITL-LS240 (ROTOFEED, station 104), read from the Excel drawing (tools/data/ls_xlsx.py) and compared with
// the PDF print of it (docs/versions/v2.5.0/DITL_LS_AUDIT.md).
// In Run: LS-90 step 7 (AND -> OR seal-in -> AND with NOT STEP 8 / NOT TERMINATE -> STEP 7 FLAG, 3 s CYCLE RESET TIMER TR405),
// LS-230 pressure limits (X >= Y 2.5 kg/cm2, X <= Y 0.5 kg/cm2 INT. REGISTER), LS-214 1 s pulse TR432, the page links FROM / TO.
// Usage: node tests/regress/ditl_ls.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(()=>{try{WORLD.set(false)}catch(e){}AN.setCat('dig')});
await page.waitForFunction(()=>S.sheets.filter(s=>/^\(L\d+\)DITL-LS/.test(s.name)).length>=23,null,{timeout:60000});await page.waitForTimeout(500);
const L=await page.evaluate(()=>{const ls=S.sheets.filter(s=>/^\(L\d+\)DITL-LS/.test(s.name));
 const nl=ls.map(s=>[s,netlist(s)]);
 return {n:ls.length,cat:ls.every(s=>ditlCat(s)==='LIMESTONE INJECTION (ROTOFEED)'),out:nl.filter(([s,n])=>n.outs.length).length,
  und:nl.map(([s,n])=>{const d=new Set([...n.src.map(z=>z.n),...(n.mir||[]).map(m=>m.n)]);n.gates.forEach(g=>(g.out||[]).forEach(x=>d.add(x)));
   return n.gates.filter(g=>[...(g.ins||[]),...(g.s||[]),...(g.r||[])].some(x=>!d.has(x))).map(g=>s.name.replace(/^.*DITL-/,'')+' '+g.t)}).flat(),
  tm:nl.flatMap(([s,n])=>n.gates.filter(g=>g.t==='TMR').map(g=>(g.tm.tag||'-')+'='+g.tm.fv.v+(g.k==='pulse'?'P':''))).join(' ')}});
ck(L.n===23&&L.cat&&L.out===23,'23 limestone sheets in the LIMESTONE INJECTION (ROTOFEED) category, all with outputs ('+L.out+')');
ck(!L.und.length,'every block input has a wire from an input row or a block ('+(L.und.join(', ')||'none open')+')');
ck(/TR405=3 /.test(L.tm)&&/TR419=600 /.test(L.tm)&&/TR432=1P/.test(L.tm)&&/TR428=3P/.test(L.tm)&&/TR424=240 /.test(L.tm),'timers as drawn: '+L.tm);
const sim=async()=>page.evaluate(()=>{const b=[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()==='▶ Run');b.click()});
const reset=async()=>page.evaluate(()=>[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()==='Reset').click());
const go=async n=>{await page.evaluate(n=>{S.cur=S.sheets.findIndex(s=>s.name.endsWith('DITL-'+n));render()},n);await page.waitForTimeout(300)};
// LS-90 FILLING CYCLE STEP 7: rows 3, 4, 5 (STEP 6, DISP INLET DV SEAL PS, BALANCE DV FC SW) -> STEP 7 FLAG (rows 4 ~ 6) held by the
// OR seal-in, TR405 3 s -> row 8 CYCLE RESET TIMER FLAG; row 8 FILLING CYCLE TERMINATE (negated) drops it
await go('LS90');await sim();await page.waitForTimeout(400);
const st=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),ix=n=>s.rows.findIndex(r=>+r.n===n),o=n=>simSheet(s).outOn.has(ix(n));
 const a=o(4);[3,4,5].forEach(n=>s.sig[ix(n)+':S']=true);render();await sleep(400);const b=o(4)&&o(5)&&o(6),t0=o(8);
 [3,4,5].forEach(n=>s.sig[ix(n)+':S']=false);render();await sleep(3300);const c=o(4),t1=o(8);
 s.sig[ix(8)+':S']=true;render();await sleep(400);const d=o(4),t2=o(8);s.sig[ix(8)+':S']=false;render();await sleep(300);return {a,b,t0,c,t1,d,t2,e:o(4)}});
ck(!st.a&&st.b&&!st.t0&&st.c&&st.t1&&!st.d&&!st.t2&&!st.e,'LS-90 STEP 7 FLAG '+st.a+' -> '+st.b+', held '+st.c+'; TR405 3 s '+st.t0+' -> '+st.t1+'; TERMINATE -> '+st.d+' / '+st.t2+', stays off '+!st.e);
await reset();await page.waitForTimeout(300);
// LS-230 conveying pressure PILM1812.PV: high limit row 4/5 (X >= 2.5 kg/cm2), low limit row 7 (X <= 0.5 kg/cm2)
await go('LS230');await sim();await page.waitForTimeout(400);
const cp=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),ix=n=>s.rows.findIndex(r=>+r.n===n),o=n=>simSheet(s).outOn.has(ix(n));
 const an=s.nl.an.map(a=>a.key+'='+a.def+a.unit).join(' '),r=[];s.av=s.av||{};
 for(const v of [1.5,3,2.5,0.5,0.2]){s.av.r5=v;render();await sleep(250);r.push(v+':'+(o(4)?'H':'')+(o(5)?'H':'')+(o(7)?'L':''))}delete s.av.r5;return {an,r:r.join(' ')}});
ck(cp.an==='r5=1.5kg/cm2 r6=2.5kg/cm2 r9=0.5kg/cm2'&&cp.r==='1.5: 3:HH 2.5:HH 0.5:L 0.2:L','LS-230 analog inputs '+cp.an+'; PV -> limits '+cp.r);
await reset();await page.waitForTimeout(300);
// LS-214 PO TR432: a 1 s pulse when its input turns ON
await go('LS214');await sim();await page.waitForTimeout(400);
const po=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),g=s.nl.gates.find(g=>g.t==='TMR'&&g.k==='pulse'),
 z=s.nl.src.find(z=>z.n===g.ins[0]),v=()=>!!simSheet(s).v[g.out[0]];if(!z)return {row:'none'};
 const a=v();s.sig[z.row+':S']=true;render();await sleep(300);const b=v();await sleep(1200);const c=v();s.sig[z.row+':S']=false;render();await sleep(200);return {row:s.rows[z.row].n,a,b,c}});
ck(po.row===14&&!po.a&&po.b&&!po.c,'LS-214 TR432 1 s pulse from row '+po.row+': '+po.a+' -> '+po.b+' -> '+po.c);
await reset();await page.waitForTimeout(300);
// page links: FROM "SHEET 30 - LINE 3" (LS-40 row 3) = LS-30 output row 3; TO "SHEET 40 - LINE 3" of LS-30 row 3 = LS-40 input row 3
const pl=await page.evaluate(()=>{const s=S.sheets.find(s=>s.name.endsWith('DITL-LS30')),ri=s.rows.findIndex(r=>+r.n===3),f=DUI.refs('SHEET 30 - LINE 3')[0];
 return {f:f&&DUI.labelOf(f),t:DUI.refs((s.cells[ri+':RT']||[]).map(x=>x.t).join(' '),s,ri,'RT').map(r=>DUI.labelOf(r)).join(' | ')}});
ck(pl.f==='(L30)DITL-LS30 item 3 (output row 3)'&&pl.t==='(L40)DITL-LS40 (input row 3)','page links: FROM = '+pl.f+'; TO = '+pl.t);
ck(!errs.length,'no page error'+(errs.length?' '+errs.slice(0,2).join(' | '):''));
await browser.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0)})();
