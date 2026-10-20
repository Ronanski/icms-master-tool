// 2.5.0-beta.9 (user: "either VIEW at SIMULATE ON/OFF nalang. dapat working ito either plant model on/off, DITL+ABC on off. pati mga
// signal continuity at page linking two ways"): the DITL bar is [VIEW | SIMULATE] + Reset (no ▶▶ step, no step size, no speed).
// For each of the 4 cases ABC+DITL (one world) OFF / ON x plant model OFF / ON (Start at 150 MW):
//  - SIMULATE runs the DITL (real time, 1x), VIEW stops it;
//  - a hand input changes a DITL output (DITL-03A BOILER EMERGENCY TRIP P.B. -> MFT) while SIMULATE is on;
//  - ABC+DITL ON: the DITL runs the one world from the DITL page; every ABC "FROM DITL" input equals its DITL output and every DITL
//    row "FROM ABC / TO DITL" equals its ABC net (signal continuity both ways);
//  - ABC+DITL OFF: no DITL row is driven by the ABC (FROM DITL / ABC are free inputs).
//  - ABC+DITL ON: a FORCE on the ABC reaches the DITL row; a hand input on the DITL reaches the ABC input (both ways).
// Desktop. Usage: node tests/regress/ditl_sim.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const ctx=await browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.addInitScript(()=>{try{localStorage.setItem('ditl.cat','an');localStorage.setItem('ls-tab','logic');localStorage.setItem('ls-world','0')}catch(e){}});
await page.goto('file://'+require('path').resolve(html));
await page.waitForFunction(()=>window.AN&&AN.sheets&&AN.sheets.length>=54&&window.DUI&&S.sheets.length>50&&document.querySelector('#gsbar .g-ditl .dui-run'),null,{timeout:60000});
await page.waitForTimeout(800);
const wait=ms=>page.waitForTimeout(ms);
// the DITL bar
await page.evaluate(()=>AN.setCat('dig'));await wait(500);
const bar=await page.evaluate(()=>{const g=document.querySelector('#gsbar .g-ditl'),vis=e=>!!e&&e.offsetParent!==null&&e.offsetHeight>0;
 return {txt:[...g.querySelectorAll('button,select')].filter(vis).map(b=>b.textContent.trim()),step:[...document.querySelectorAll('#gsbar button,#gsbar select')].filter(vis).some(b=>/^▶▶$|⏱/.test(b.textContent.trim())&&b.closest('.g-ditl,.lo-pg'))}});
ck(bar.txt.includes('VIEW')&&bar.txt.includes('▶ Run')&&bar.txt.includes('Reset')&&!bar.txt.some(t=>/▶▶|⏱|^\d+x$|^\d+ s$/.test(t))&&!bar.step,'DITL bar: '+bar.txt.join(' | ')+' (no step, no step size, no speed)');
const click=sel=>page.evaluate(sel=>{const b=[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()===sel);b.click()},sel);
for(const world of [false,true])for(const plant of ['off','on']){
 const tag='ABC+DITL '+(world?'ON':'OFF')+', plant model '+plant.toUpperCase()+': ';
 await page.evaluate(([world,plant])=>{if(SIM)document.getElementById('bmode').click();AN.run=false;AN.reset();
  if(plant==='on')AN.plantLoad150();else for(const x of AN.sheets)if(x.S)for(const b of x.S.procs||[])b.proc.on=false;
  WORLD.set(world);AN.setCat('dig');S.cur=S.sheets.findIndex(s=>/DITL-03A$/.test(s.name));render()},[world,plant]);await wait(600);
 await click('▶ Run');await wait(1500);
 const st=await page.evaluate(()=>({SIM,DPAUSE,TSP,live:WORLD.live,won:WORLD.on,on:document.querySelector('#gsbar .g-ditl .dui-run').classList.contains('on')}));
 ck(st.SIM&&!st.DPAUSE&&st.TSP===1&&st.on&&st.live===st.won,tag+'SIMULATE runs the DITL in real time (SIM '+st.SIM+', 1x, one world running '+st.live+')');
 // a hand input -> a DITL output (DITL-03A: the push buttons and switches of the MFT)
 const hand=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=cur();const outs=()=>{const R=simSheet(s);return [...R.outOn].sort().join(',')};
  for(let i=0;i<s.rows.length;i++){if(!fbk(s,i,'S')||lockd(s,i))continue;if(s._win&&s._win.has(i))continue;
   const o0=outs(),was=!!s.sig[i+':S'];s.sig[i+':S']=!was;await sleep(500);const o1=outs();s.sig[i+':S']=was;await sleep(400);
   if(o0!==o1)return {row:+s.rows[i].n,txt:(s.cells[i+':S']||[]).map(x=>x.t).join(' ').slice(0,50),o0,o1}}return null});
 ck(!!hand,tag+(hand?'hand input row '+hand.row+' "'+hand.txt+'" changes the outputs ('+hand.o0+' -> '+hand.o1+')':'no hand input changed an output'));
 if(world){
  // (2.5.0-beta.11) the DITL copy of an ABC bit is taken at the world tick: a bit that changes between the tick and the read (plant
  // model ON, the furnace pressure of the 150 MW load settling, DITL-40 row 14) is one tick late. Read twice: only a row that differs
  // both times is wrong
  const inv1=await page.evaluate(()=>{const {din}=WORLD.idx;const b=[];din.forEach((m,s)=>m.forEach((srcs,row)=>{if(srcs.length!==1||srcs[0].k!=='a')return;const q=srcs[0];if(!q.sh.S)return;if((q.sh.S.rt.v[q.n]>0.5)!==!!(s._win&&s._win.has(row)))b.push(s.name+' row '+(row+1))}));return b});
  await wait(600);
  const inv=await page.evaluate(()=>{const {ain,din}=WORLD.idx;let a=0,abad=[];
   for(const q of ain){const A=q.sh.S;if(!A)continue;const l=A.xlk&&A.xlk[q.n];if(l&&!l.ditl)continue;a++;const want=WORLD.out[q.d.name]&&WORLD.out[q.d.name].has(q.row)?1:0;if(A.rt.ext[q.n]!==want)abad.push(q.sh.name+' '+AN.nm(A,q.n)+' '+A.rt.ext[q.n]+' want '+want)}
   let t=0,tbad=[];din.forEach((m,s)=>m.forEach((srcs,row)=>{if(srcs.length!==1||srcs[0].k!=='a')return;const q=srcs[0];if(!q.sh.S)return;t++;const want=q.sh.S.rt.v[q.n]>0.5,got=!!(s._win&&s._win.has(row));if(want!==got)tbad.push(s.name+' row '+(row+1))}));
   return {a,abad:abad.slice(0,6),t,tbad:tbad.slice(0,6)}});
  ck(!inv.abad.length,tag+'DITL -> ABC: '+inv.a+' ABC inputs equal their DITL output'+(inv.abad.length?': '+inv.abad.join(' | '):''));
  inv.tbad=inv.tbad.filter(x=>inv1.includes(x));
  ck(!inv.tbad.length,tag+'ABC -> DITL: '+inv.t+' DITL rows equal their ABC net'+(inv.tbad.length?': '+inv.tbad.join(' | '):''));
  // 2.5.0-beta.10 (user: "kapag from DITL nagforce ako, madedetect ito ng buong sheet DITL at ABC? vice versa?"):
  // a FORCE on the ABC reaches the DITL row, and a hand input on the DITL reaches the ABC input that reads it
  const fa=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const {din}=WORLD.idx;let hit=null;
   for(const [s,m] of din){if(s._inst&&s._inst.k)continue;for(const [row,srcs] of m){if(srcs.length!==1||srcs[0].k!=='a'||!srcs[0].sh.S)continue;const q=srcs[0],A=q.sh.S;
    const was=!!(s._win&&s._win.has(row)),nv=was?0:1;A.rt.force[q.n]=nv;await sleep(1200);const got=!!(s._win&&s._win.has(row));delete A.rt.force[q.n];await sleep(900);const back=!!(s._win&&s._win.has(row));
    hit={abc:q.sh.name+' '+String(AN.nm(A,q.n)).trim(),ditl:s.name+' row '+s.rows[row].n,was,got,back};if(got!==was)return hit}}return hit});
  ck(!!fa&&fa.got!==fa.was&&fa.back===fa.was,tag+'ABC FORCE -> DITL: '+(fa?fa.abc+' forced '+(fa.was?0:1)+' -> '+fa.ditl+' '+(fa.was?1:0)+'->'+(fa.got?1:0)+', force released -> '+(fa.back?1:0):'none'));
  const fd=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const {ain,din}=WORLD.idx;
   for(const q of ain){const d=q.d,A=q.sh.S;if(!A)continue;const l=A.xlk&&A.xlk[q.n];if(l&&!l.ditl)continue;const m=din.get(d)||new Map();
    for(let i=0;i<d.rows.length;i++){if(m.has(i)||!d.cells[i+':S']||!d.nl.src.some(z=>z.row===i))continue;
     const before=WORLD.out[d.name].has(q.row),e0=A.rt.ext[q.n];d.sig[i+':S']=!d.sig[i+':S'];await sleep(900);const after=WORLD.out[d.name].has(q.row),e1=A.rt.ext[q.n],v1=A.rt.v[q.n];d.sig[i+':S']=!d.sig[i+':S'];
     if(after!==before){await sleep(900);return {sheet:d.name,row:+d.rows[i].n,txt:d.cells[i+':S'].map(x=>x.t).join(' ').slice(0,40),abc:q.sh.name+' '+String(AN.nm(A,q.n)).trim(),e0,e1,v1,before,after}}}}return null});
  ck(!!fd&&fd.e0===(fd.before?1:0)&&fd.e1===(fd.after?1:0)&&fd.v1===fd.e1,tag+'DITL hand input -> ABC: '+(fd?fd.sheet+' row '+fd.row+' "'+fd.txt+'" -> '+fd.abc+' '+fd.e0+'->'+fd.e1+' (the ABC logic reads '+fd.v1+': the ABC runs with the DITL)':'none'));
 }else{
  const w=await page.evaluate(()=>S.sheets.filter(s=>s._win&&s._win.size).length);
  ck(w===0,tag+'no DITL row is driven by the ABC ('+w+' sheets)');
 }
 await click('VIEW');await wait(300);
 ck(await page.evaluate(()=>!SIM&&!WORLD.live),tag+'VIEW stops the simulation');
}
await page.evaluate(()=>{WORLD.set(false);try{localStorage.setItem('ls-world','0')}catch(e){}});
ck(!errs.length,'no page error'+(errs.length?' '+errs.slice(0,2).join(' | '):''));
await browser.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0)})();
