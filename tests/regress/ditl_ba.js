// 2.5.0-beta.14 (user: "pre may mga DITL pages na wala pa. SAND LIMESTONE BOTTOM ASH SOOTBLOWER"): the 67 bottom ash sheets
// (B1)DITL-BA01 ~ (B74)DITL-BA74 (HD600 BA-01 ~ 58, conveyors BA-59 ~ 74; the blank BA-30/31/32/35/57/58/70 are not pages), imported
// from the DXF (tools/data/ditl_import.js), compared with the PDF (docs/versions/v2.5.0/DITL_BA_AUDIT.md).
// In Run: the step register SI0130 (BA-11 M.1333 "STEP=8" -> input "STEP≥8" (row 23) -> M.1367), the flasher of BA-52, the spare line of
// BA-11 M.1331 is not an input, the page links FROM "BA01-11" and TO "BA-56/46/11".
// Usage: node tests/regress/ditl_ba.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(()=>{try{WORLD.set(false)}catch(e){}AN.setCat('dig')});
await page.waitForFunction(()=>S.sheets.filter(s=>/^\(B\d+\)DITL-BA/.test(s.name)).length>=67,null,{timeout:60000});await page.waitForTimeout(500);
const L=await page.evaluate(()=>{const ba=S.sheets.filter(s=>/^\(B\d+\)DITL-BA/.test(s.name));
 return {n:ba.length,cat:ba.every(s=>ditlCat(s)==='BOTTOM ASH HD600 / CONVEYORS'),nl:ba.filter(s=>{try{const nl=netlist(s);return nl.outs.length+nl.term.length>0}catch(e){return false}}).length,
  lamp:ba.map(s=>[s,netlist(s)]).filter(([s,nl])=>!nl.outs.length).map(([s,nl])=>s.name.replace(/^.*DITL-/,'')+' '+nl.term.length).join(', ')}});
ck(L.n===67&&L.cat&&L.nl===67,'67 bottom ash sheets in the BOTTOM ASH HD600 / CONVEYORS category, all with outputs or lamps ('+L.nl+'; lamp sheets '+L.lamp+')');
const sim=async()=>page.evaluate(()=>{const b=[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()==='▶ Run');b.click()});
const go=async n=>{await page.evaluate(n=>{S.cur=S.sheets.findIndex(s=>new RegExp('^\\(B\\d+\\)DITL-'+n+'$').test(s.name));render()},n);await page.waitForTimeout(300)};
// BA-11: the spare line into the AND of M.1331 is not an input (15 inputs drawn, 14 rows + the OR)
await go('BA11');
const sp=await page.evaluate(()=>{const s=cur(),o=s.nl.outs.find(o=>+s.rows[o.row].n===7),g=s.nl.gates.find(g=>(g.out||[]).includes(o.n));return g?g.t+' '+g.ins.length:'none'});
ck(sp==='AND 14','BA-11 M.1331 CONVEYING PRECONDITION OK: '+sp+' inputs (the spare line is not one)');
// BA-11 step register: M.1331 CONVEYING PRECONDITION OK (rows 1, 3 ~ 6, 12 ON: remote, valves closed, step 7 finished; row 19 is the
// same M.1331) + row 20 AUTOMATIC START -> M.1333 (STEP=8, SI0130 = 8) -> input "STEP≥8" (row 23) -> M.1367 STEP_8
await sim();await page.waitForTimeout(500);
const st=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),ix=n=>s.rows.findIndex(r=>+r.n===n),o=()=>simSheet(s).outOn;
 const a=o().has(ix(23)),r0=DREG.SI0130||0,P=[1,3,4,5,6,12];P.forEach(n=>s.sig[ix(n)+':S']=true);s.sig[ix(20)+':S']=true;render();await sleep(400);
 const m=o().has(ix(20)),r1=DREG.SI0130,b=o().has(ix(23));P.forEach(n=>s.sig[ix(n)+':S']=false);s.sig[ix(20)+':S']=false;render();await sleep(300);const c=o().has(ix(23));
 [...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()==='Reset').click();await sleep(400);
 return {a,r0,m,r1,b,c,r2:DREG.SI0130||0,d:simSheet(cur()).outOn.has(ix(23))}});
ck(!st.a&&st.r0===0&&st.m&&st.r1===8&&st.b&&st.c&&st.r2===0&&!st.d,'BA-11 step: M.1333 ON '+st.m+' -> SI0130 '+st.r0+' -> '+st.r1+', STEP_8 (row 23) '+st.a+' -> '+st.b+', stays '+st.c+' (step kept), Reset -> SI0130 '+st.r2+' / row 23 '+st.d);
// BA-52 FLASHER (ON 1 s / OFF 0.5 s): the output blinks while the input is ON
await go('BA52');await sim();await page.waitForTimeout(400);
const fl=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),o=()=>simSheet(s).outOn.has(0);s.sig['0:S']=true;const seen=new Set();
 for(let k=0;k<20;k++){await sleep(100);seen.add(o())}s.sig['0:S']=false;await sleep(300);const off=o();const g=s.nl.gates.find(g=>g.k==='flash');return {on:seen.has(true),of:seen.has(false),off,fl:g&&g.fl.join('/')}});
ck(fl.on&&fl.of&&!fl.off&&fl.fl==='1/0.5','BA-52 M.133F flasher '+fl.fl+' s: blinks ON '+fl.on+' / OFF '+fl.of+' in 2 s, input OFF -> '+fl.off);
// BA-20 COUNTER 1 (+1, =4): AND(M.1306 = the output M.1306 of the sheet (M.1301 STOP(DCS), M.1361 STEP_2, M.1304 AUTOMATIC START),
// I.0498 BUFFER TANK LOW LEVEL, M.136E STEP_15 BATCH FINISHED); the rows with the same address are one signal. The sand venting fan
// runs (MIR-M1301), else M.1305 AUTOMATIC STOP (= M.1304 AND M.136E AND NOT fan running) resets the counter at once -> PULSE TR353 -> count; 4 counts = M.1307 LAST CYCLE OVER
await go('BA20');await sim();await page.waitForTimeout(400);
const cn=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),ix=n=>s.rows.findIndex(r=>+r.n===n),G=()=>cur().nl.gates.find(g=>g.t==='CNT'),o=()=>!!simSheet(s).v[G().out[0]];
 const T=a=>s.rows.map((_,i)=>i).filter(i=>(s.cells[i+':T']||[]).some(t=>t.t===a)),on=(a,v)=>T(a).forEach(i=>s.sig[i+':S']=v);
 ['M.1301','M.1361','M.1304','I.0498','MIR-M1301'].forEach(a=>on(a,true));const N=[];let o3=null;
 let o4=false,st4=false;const stop=R=>s.nl.outs.some(q=>R.v[q.n]&&(s.cells[q.row+':RS']||[]).some(t=>t.t==='AUTOMATIC STOP'));
 for(let k=0;k<4;k++){on('M.136E',true);if(k===3){/* the 4th count: LAST CYCLE OVER -> AUTOMATIC STOP -> RESET of the counter, in one scan */const a=G().N;
   /* every scan of the sheet is watched (one scan = LAST CYCLE OVER and AUTOMATIC STOP, the next = the counter reset) */
   const f0=window.simulate;window.simulate=function(nl,act){const v=f0(nl,act);if(nl===s.nl){if(v[G().out[0]])o4=true;if(stop({v}))st4=true}return v};
   await sleep(600);window.simulate=f0;N.push(a+1)}else{await sleep(300);N.push(G().N)}
  if(k===2)o3=o();on('M.136E',false);await sleep(2100)}
 const N4=G().N;[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()==='Reset').click();await sleep(400);const g=G();return {N:N.join(','),o3,o4,st4,N4,pre:g.ks[0],r:g.r.length,Nr:g.N}});
ck(cn.N==='1,2,3,4'&&cn.o3===false&&cn.o4&&cn.st4&&cn.pre===4&&cn.r===1&&cn.N4===0&&cn.Nr===0,'BA-20 COUNTER 1 (=4): counts '+cn.N+', LAST CYCLE OVER at 3 = '+cn.o3+'; at 4 the AUTOMATIC STOP resets it (the drawing: M.1305 = M.1306 AND M.1307 -> R) -> N '+cn.N4+' (seen LAST CYCLE OVER '+cn.o4+', AUTOMATIC STOP '+cn.st4+'), Reset -> '+cn.Nr);
// page links
const pl=await page.evaluate(()=>{const k=S.sheets.findIndex(s=>/DITL-BA11$/.test(s.name)),s=S.sheets[k];S.cur=k;
 const f=DUI.refs('BA01-11')[0],fo=f&&ditlItem(S.sheets[ditlIdx(f.code,s)],f.nn),ti=s.rows.findIndex(r=>+r.n===7),T=DUI.refs('BA-56/46/11',s,ti);
 return {f:f&&DUI.labelOf(f),fo:fo&&fo.side,t:T.map(r=>DUI.labelOf(r)).join(' | '),n01:DUI.refs('01-11').map(r=>r.code).join()}});
ck(/DITL-BA01 item 11 \(output row/.test(pl.f)&&pl.fo==='R'&&/DITL-BA56 \(input row \d+\) \| .*DITL-BA46 \(input row \d+\) \| .*DITL-BA11 \(input row 19\)/.test(pl.t)&&pl.n01==='01','page links: FROM BA01-11 = '+pl.f+'; TO of BA-11 M.1331 = '+pl.t);
// one world: BA-11 row 3 INLET GATE VALVE CLOSE (FROM BA01-11) is linked to BA-01 output NO. 11
const w=await page.evaluate(async()=>{WORLD.set(true);await new Promise(r=>setTimeout(r,800));const s=S.sheets.find(s=>/DITL-BA11$/.test(s.name));const L=(WORLD.links||WORLD.idx||{});
 const st=WORLD.stat||{};WORLD.set(false);return JSON.stringify(st).slice(0,200)});
console.log('     world: '+w);
ck(!errs.length,'no page error'+(errs.length?' '+errs.slice(0,2).join(' | '):''));
await browser.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0)})();
