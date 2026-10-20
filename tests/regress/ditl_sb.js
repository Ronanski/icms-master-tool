// 2.5.0-beta.12 (user: "pre may mga DITL pages na wala pa. SAND LIMESTONE BOTTOM ASH SOOTBLOWER"): the 17 sootblower sheets
// (S3)DITL-80 ~ (S23)DITL-80T, imported from the DXF (tools/data/ditl_import.js), compared with the PDF (docs/versions/v2.5.0/DITL_SB_AUDIT.md).
// In SIMULATE: the COUNTER of DITL-80 counts and Reset clears it; the SB PANEL output O.077D of DITL-80K follows the trip input;
// the motor valve of DITL-80S gives its feedback (REMOTE / LOCAL SELECTED, FULL CLOSED); the page links of the set (80K row 14 FROM DITL-43).
// Usage: node tests/regress/ditl_sb.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(()=>{try{WORLD.set(false)}catch(e){}AN.setCat('dig')});
await page.waitForFunction(()=>S.sheets.filter(s=>/^\(S\d+\)DITL-80/.test(s.name)).length>=17,null,{timeout:60000});await page.waitForTimeout(500);
const L=await page.evaluate(()=>{const sb=S.sheets.filter(s=>/^\(S\d+\)DITL-80/.test(s.name));
 return {n:sb.length,cat:sb.every(s=>ditlCat(s)==='SOOTBLOWER'),cats:DITL_CATS.includes('SOOTBLOWER'),names:sb.map(s=>s.name.replace(/^\(S\d+\)DITL-/,'')).join(' ')}});
ck(L.n===17&&L.cat&&L.cats,'17 sootblower sheets in the SOOTBLOWER category: '+L.names);
const sim=async()=>page.evaluate(()=>{const b=[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()==='SIMULATE');b.click()});
const go=async n=>{await page.evaluate(n=>{S.cur=S.sheets.findIndex(s=>new RegExp('^\\(S\\d+\\)DITL-'+n+'$').test(s.name));render()},n);await page.waitForTimeout(300)};
// DITL-80 COUNTER: count input = AND(row 9, OR(PULSE row 17, ...), row 8); the input 1 -> 0 = N + 1
await go('80');await sim();await page.waitForTimeout(600);
const cn=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),ix=n=>s.rows.findIndex(r=>+r.n===n),g=s.nl.gates.find(g=>g.t==='CNT');
 const N0=g.N||0;s.sig[ix(8)+':S']=true;
 /* the count input (AND of rows 8, 9 and the step OR) goes 1 -> 0 = one step */
 for(let k=0;k<2;k++){s.sig[ix(9)+':S']=true;await sleep(500);s.sig[ix(9)+':S']=false;await sleep(500)}
 const N2=g.N,j=g.ks.indexOf(N2),o2=j>=0&&!!simSheet(s).v[g.out[j]];
 s.sig[ix(8)+':S']=false;s.sig[ix(9)+':S']=false;
 [...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()==='Reset').click();await sleep(400);return {N0,N2,o2,Nr:g.N,ks:g.ks.join(',')}});
ck(cn.N0===0&&cn.N2===2&&cn.o2&&cn.Nr===0,'DITL-80 COUNTER (outputs '+cn.ks+'): row 9 ON / OFF twice counts '+cn.N0+' -> '+cn.N2+', output N='+cn.N2+' ON '+cn.o2+', Reset -> '+cn.Nr);
// DITL-80K SB PANEL outputs; row 10 AIR PREHEATER SOOTBLOWER TRIP (I.073D) -> O.077D MAIN POWER LINE BACKWARD STARTER (3 s pulse)
await go('80K');await sim();await page.waitForTimeout(600);
const pk=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),ix=n=>s.rows.findIndex(r=>+r.n===n),po=s.nl.pout||[],d=po.find(p=>/77D$/.test(p.adr||p.t||''))||po.find(p=>/77D/.test(JSON.stringify(p)));
 const v=()=>d?!!simSheet(s).v[d.n]:null,a=v();s.sig[ix(10)+':S']=true;await sleep(700);const b=v();s.sig[ix(10)+':S']=false;await sleep(3200);const c=v();
 return {n:po.length,adr:po.map(p=>JSON.stringify(p).match(/[O0]\.0\w{3}/)||['?']).map(m=>m[0]).join(' '),a,b,c}});
ck(pk.n===3&&pk.a===false&&pk.b===true&&pk.c===false,'DITL-80K SB PANEL outputs '+pk.adr+'; row 10 TRIP -> O.077D pulse ('+pk.a+' -> '+pk.b+' -> '+pk.c+' after 3 s)');
// DITL-80S motor valve: REMOTE SELECTED (row 53) = input row 1, LOCAL SELECTED (row 54) = NOT row 53, FULL CLOSED (row 56) with the valve closed
await go('80S');await sim();await page.waitForTimeout(600);
const mv=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur(),ix=n=>s.rows.findIndex(r=>+r.n===n),o=()=>simSheet(s).outOn;
 const fb=(s.nl.mv[0]||{fb:[]}).fb.map(f=>f.ty).sort().join(',');s.sig[ix(1)+':S']=true;await sleep(500);const r1=o().has(ix(3)),l1=o().has(ix(4)),c1=o().has(ix(6));
 s.sig[ix(1)+':S']=false;await sleep(500);const r0=o().has(ix(3)),l0=o().has(ix(4));return {fb,r1,l1,c1,r0,l0}});
ck(mv.fb==='MIL,MIT,TS,ZSC,ZSO'&&mv.r1&&!mv.l1&&mv.c1&&!mv.r0&&mv.l0,'DITL-80S valve feedback '+mv.fb+': REMOTE input ON -> 53 REMOTE '+mv.r1+' / 54 LOCAL '+mv.l1+', 56 FULL CLOSED '+mv.c1+'; OFF -> REMOTE '+mv.r0+' / LOCAL '+mv.l0);
// page links: 80K row 14 FROM "DITL-43-70" opens the main DITL-43; "80K" from DITL-43 opens the sootblower 80K
const pl=await page.evaluate(()=>{const k=S.sheets.findIndex(s=>/\)DITL-80K$/.test(s.name)),m=S.sheets.findIndex(s=>/DITL-43$/.test(s.name)&&!isSB(s));
 const a=S.sheets[ditlIdx('43',S.sheets[k])],b=S.sheets[ditlIdx('80K',S.sheets[m])],c=S.sheets[ditlIdx('80A',S.sheets[k])];return {a:a&&a.name,b:b&&b.name,c:c&&c.name}});
ck(/DITL-43$/.test(pl.a)&&!/^\(S/.test(pl.a)&&/^\(S\d+\)DITL-80K$/.test(pl.b)&&/^\(S\d+\)DITL-80A$/.test(pl.c),'page links: 80K -> 43 = '+pl.a+', 43 -> 80K = '+pl.b+', 80K -> 80A = '+pl.c);
ck(!errs.length,'no page error'+(errs.length?' '+errs.slice(0,2).join(' | '):''));
await browser.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0)})();
