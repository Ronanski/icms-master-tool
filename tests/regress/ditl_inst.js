// 3.2.0-beta.33 (CHECKLIST 0.2): machine B / C / D of a shared DITL drawing is a REAL page (user 2026-10-25, HANDOFF "SUSUNOD" #1).
// Checks, by clicks where the operator clicks:
// 1. the sheet list has a page for every machine copy (WORLD.inst), under drawing A; DITL-22 has the 4 aux. lube oil pumps
// 2. "DITL-16 · C" opens burner C: the drawing reads BURNER C and the burner C addresses (O.0727, not O.0087 of burner A)
// 3. the right panel (Inputs) reads the same; the state is its own (an input pressed on C does not change A)
// 4. a page link on a machine copy opens the other end on its own machine (DITL-29A · B row 8 SWP C RUNNING -> 29A · C)
// 5. the address table: every B / C / D address agrees with the machine letter of its I/O / memory list description
// 6. Training: the burner B step and the second SWP open their own pages (before: drawing A)
// Usage: node tests/regress/ditl_inst.js [html] [shotdir]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const shots=process.argv.slice(2).find(a=>!/\.html$/.test(a));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let f=0;const ck=(ok,t)=>{console.log((ok?'PASS ':'FAIL ')+t);if(!ok)f++};
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));
await p.addInitScript(()=>{window.LS_HOME=false;window.LS_PVWIN=false;window.open=()=>null;try{localStorage.setItem('ls-tab','"logic"');localStorage.removeItem('ls-guide')}catch(e){}});
await p.goto('file://'+require('path').resolve(html));await p.waitForTimeout(4000);
const shot=async n=>{if(shots)await p.screenshot({path:shots+'/inst-'+n+'.png'})};
await p.evaluate(()=>AN.setCat('dig'));await p.waitForTimeout(1500);
const filter=async t=>{await p.fill('#sidefl',t);await p.waitForTimeout(400)};
// 1
await filter('');
const l=await p.evaluate(()=>{const n22=[...document.querySelectorAll('#sidelist button.dinst')].length;return {btn:n22,inst:WORLD.inst.length,
 l22:WORLD.instOf.get(S.sheets.find(s=>/DITL-22$/.test(s.name))).map(x=>x.title)}});
await filter('DITL-22');const b22=await p.$$eval('#sidelist button.dinst',a=>a.map(x=>x.textContent));
ck(l.btn===l.inst&&l.inst>=75&&b22.length===3&&/LOP B/.test(b22[0])&&/BFWP B/.test(b22[2]),'sheet list: '+l.btn+' machine pages ('+l.inst+' machine copies); DITL-22 = '+b22.join(' | '));
// 2
await filter('DITL-16');await (await p.$('#sidelist button.dinst[data-k="2"]')).click();await p.waitForTimeout(900);await shot('16C');
const d=await p.evaluate(()=>{const t=[...document.querySelectorAll('#svg text')].map(x=>x.textContent).join(' \n ');return {name:cur().name,title:cur().title,
 c:/INSERT BURNER C COMMAND/.test(t),a:/INSERT BURNER A COMMAND/.test(t),adC:/O\.0727\b/.test(t),adA:/O\.0087\b/.test(t),ok:/O\.0720\b/.test(t)&&/DO1043-C1/.test(t)&&!/DO1043-A1/.test(t)}});
ck(d.name==='(30)DITL-16 #C'&&d.title==='BURNER C INPUT/OUTPUT (1)'&&d.c&&!d.a&&d.adC&&!d.adA&&d.ok,'DITL-16 · C: '+d.title+', "INSERT BURNER C COMMAND" O.0727 (no BURNER A, no O.0087)');
// 3
const pi=await p.evaluate(()=>{const t=(document.getElementById('dp')||{}).textContent||'';return {c:/O\.0727/.test(t)&&/INSERT BURNER C COMMAND/.test(t),a:/BURNER A|DO1043-A/.test(t),sv:/DO1043-C1/.test(t)}});
ck(pi.c&&pi.sv&&!pi.a,'right panel reads O.0727 INSERT BURNER C COMMAND and valve SV DO1043-C1 (no BURNER A, no DO1043-A)');
await p.evaluate(()=>{document.querySelector('.tbg-run button, #bar .tbg-run')&&0});
const st=await p.evaluate(async()=>{const C=cur(),A=S.sheets[S.cur];const i=C.rows.findIndex((r,k)=>/OPEN BURNER C OIL VALVE\(1\)/.test(WORLD.cellTexts(C,k+':S',(C.cells[k+':S']||[]).map(x=>x.t)).join(' ')));C.sig[i+':S']=true;await new Promise(r=>setTimeout(r,300));return {i,c:!!C.sig[i+':S'],a:!!A.sig[i+':S']}});
ck(st.i>=0&&st.c&&!st.a,'own state: burner C input row '+st.i+' ON on C, burner A unchanged');
await p.evaluate(i=>{cur().sig[i+':S']=false},st.i);
// 4
await filter('DITL-29A');await (await p.$('#sidelist button.dinst[data-k="1"]')).click();await p.waitForTimeout(900);
const lk=await p.evaluate(()=>{const s=cur();const i=s.rows.findIndex((r,k)=>/SEAWATER PUMP C RUNNING/.test(WORLD.cellTexts(s,k+':S',(s.cells[k+':S']||[]).map(x=>x.t)).join(' '))&&(s.cells[k+':F']||[]).length);
 const t=[...document.querySelectorAll('#svg text.plink')].find(e=>{const y=+e.getAttribute('y');return Math.abs(-y-s.rows[i].y)<4&&+e.getAttribute('x')<(s.vr||s.rng).F[1]+1});
 if(!t)return {i};const r=t.getBoundingClientRect();return {i,x:r.x+r.width/2,y:r.y+r.height/2,from:cur().name}});
if(lk.x){await p.mouse.click(lk.x,lk.y);await p.waitForTimeout(900)}
const lk2=await p.evaluate(()=>({name:cur().name,title:cur().title}));await shot('29A-link');
ck(lk.x&&lk.from==='(53)DITL-29A #B'&&lk2.name==='(53)DITL-29A #C','page link on DITL-29A · B row '+lk.i+' (SEAWATER PUMP C RUNNING) opens '+lk2.name+' = '+lk2.title);
await p.click('#ditlback, .dui-back').catch(()=>{});
// 5
const ia=await p.evaluate(async()=>{const A=await AN.ades();const {cellTxt}=WORLD._h;let n=0,bad=[];const T=window.INST_ADDR;
 const MR=/\b(?:BFWP|FAB|BURNER|BNR|FEEDER|PUMP|BLOWER|COOLER|COLLER|IGNITER|COMPRESSOR|DRYER|IWP|MWP|DOP|SWBP|SWP|LOP|CWP|CP|VALVE|SILO)\s*-?\(?([A-D])\)?(?![A-Z0-9])/gi;
 for(const nm in T){if(/DITL-22$/.test(nm))continue;const base=S.sheets.find(s=>s.name===nm),L=WORLD.instOf.get(base);const e=T[nm];
  for(const k in e.r)e.r[k].forEach((m,j)=>{if(!j||!m||!L[j])return;const i=+k.slice(1),x=L[j];
   const rt=k[0]==='L'?WORLD.remap(x,cellTxt(base,i,'S')+' '+cellTxt(base,i,'T')):WORLD.remap(x,cellTxt(base,i,'RS')+' '+cellTxt(base,i,'RT'));const mm=[...rt.matchAll(MR)],want=mm.length?mm[mm.length-1][1].toUpperCase():null;
   for(const a of m){n++;const d=(A[e.st][a]||{}).d;if(!d||!want)continue;
    const Lm=/(?:^|[^A-Z0-9])([A-D])-(?=[A-Z])/i.exec(d)||/\b(?:burner|bnr|feeder|igniter|spark|pump|cooler|blower|bfwp|dryer)\s*-?\s*([A-D])\b/i.exec(d);
    if(Lm&&Lm[1].toUpperCase()!==want)bad.push(nm+' '+k+' '+'ABCD'[j]+' '+a+' "'+d+'" row: '+rt.slice(0,50))}})}return {n,bad}});
ck(ia.n>700&&ia.bad.length===0,'address table: '+ia.n+' addresses of machines B / C / D, each description (I/O / memory list) names the machine the row names'+(ia.bad.length?': '+ia.bad.slice(0,5).join(' | '):''));
// 6
const clickTxt=async(sel,txt)=>{for(const e of await p.$$(sel)){const t=(await e.textContent()).trim();if(t.includes(txt)&&await e.isVisible()){await e.click();return true}}return false};
await clickTxt('button','Training');await p.waitForTimeout(800);
ck(await clickTxt('#trainws button','Gabay: Cold'),'Training: Gabay pressed');await p.waitForTimeout(7000);
for(const [re,want,pre] of [[/Sindihan ang burner B/,'DITL-09 #B'],[/Simulan ang pangalawang SWP/,'DITL-29A #B','SWP-A']]){
 await p.evaluate(()=>AN.setCat('an'));await p.waitForTimeout(500);
 /* the second pump: the first one runs (its START in the card of step 1, a real click) */
 if(pre){await p.evaluate(()=>{const S2=LS_GUIDE.steps();LS_GUIDE.open(S2.findIndex(s=>/unang seawater/.test(s.t)));LS_DOCK.fill(true)});await p.waitForTimeout(1500);
  await clickTxt('#gdock button','Field operator');await p.waitForTimeout(1500);ck(await clickTxt('#gdock button','START '+pre),'Training: START '+pre+' pressed');await p.waitForTimeout(8000)}
 const r=await p.evaluate(async re=>{const S2=LS_GUIDE.steps();const i=S2.findIndex(s=>re.test(s.t));LS_GUIDE.open(i);LS_DOCK.fill(true);return {i}},re);await p.waitForTimeout(2500);
 /* the interlock box names the next pump once the first one runs (the start of the motor takes a few seconds) */
 for(let t=0;pre&&t<30;t++){if(await p.evaluate(w=>[...document.querySelectorAll('#gdock .gd-lk')].some(x=>x.textContent.includes(w.replace(' #',' · '))),want))break;await p.waitForTimeout(1000);await p.evaluate(()=>LS_DOCK.fill(true))}
 const g=await p.evaluate(()=>{const d=document.getElementById('gdock');const lkb=d&&[...d.querySelectorAll('.gd-lk')].map(x=>x.textContent);return {cat:AN.cat,name:typeof cur==='function'&&cur()?cur().name:'',lk:lkb}});
 /* the link in the interlock box too */
 /* the middle follows the step (DITL page of the motor / button); for the second pump that page comes when the first one runs: open the step again */
 let fol=g.name;if(pre&&!fol.endsWith(want)){await p.evaluate(()=>{LS_GUIDE.open(LS_GUIDE.cur-1);LS_DOCK.fill(true)});await p.waitForTimeout(800);await p.evaluate(i=>{LS_GUIDE.open(i);LS_DOCK.fill(true)},r.i);await p.waitForTimeout(2500);fol=await p.evaluate(()=>cur().name)}
 await shot('train-'+want.replace(/\W+/g,''));
 ck(r.i>=0&&fol.endsWith(want),'Training step #'+r.i+' "'+re.source+'": the middle opens '+fol);
 /* the link of the interlock box too */
 await p.evaluate(()=>AN.setCat('an'));await p.waitForTimeout(500);const bt=await p.$('#gdock .gd-lk');let after='';if(bt){await bt.click();await p.waitForTimeout(1200);after=await p.evaluate(()=>cur().name)}
 ck(after.endsWith(want)||!pre,'  its interlock link '+(g.lk||[]).join(', ')+' opens '+(after||'-'));}
ck(errs.length===0,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(f?f+' FAIL':'ALL PASS');await b.close();process.exit(f?1:0)})();
