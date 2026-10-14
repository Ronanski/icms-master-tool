// FORCE MANUAL (user rule, 2026-10-14; drawing ABC-007 "1:B" M.0190): when the logic signal that selects the MANUAL leg of the A/M station is 1,
// the operator's AUTO must be refused; after the signal is gone the station stays manual until the operator presses AUTO again.
// For every controller with an A/M station on all 54 sheets: force the manual-leg select signal to 1, press AUTO, expect MANUAL; release, expect still MANUAL; press AUTO, expect AUTO.
// Controllers whose manual-leg select signal cannot be found are listed as NOT TESTED with the reason. Usage: node tests/regress/force_manual.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv[2]||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);
const r=await page.evaluate(()=>{const R={pass:0,fail:[],nt:{}};const nt=(k,w)=>{R.nt[k]=(R.nt[k]||[]);R.nt[k].push(w)};
 for(let i=0;i<AN.sheets.length;i++){const sh=AN.sheets[i];AN.go(i);const S=sh.S;let cs=[];try{cs=AN.hmiCtrls(S)}catch(e){}
  for(const c of cs){const w=sh.name+' '+c.tag;if(!c.amt){nt('no A/M station',w);continue}
   const amt=c.amt,man=c.autoLeg==='A'?'B':'A';
   let nets=[];if(amt.cs&&amt.cs.length>1){nets=amt.cs.filter(q=>(q.A?'A':'B')===man).map(q=>q.n)}else if(amt.sel>=0){const P=amt.p||{};if(((P.selA?'A':'B'))===man)nets=[amt.sel]}
   if(!nets.length){nt('the select signal asks for the AUTO leg or there is none',w);continue}
   const n=nets[0];const st=()=>S.rt.st[amt.id];const step=k=>{for(let j=0;j<k;j++)AN.stepSet(sh,.5)};
   const press=m=>{const s=st();s.al=c.autoLeg;s.fm=m==='A'?c.autoLeg:man;try{AN.settle()}catch(e){}};
   try{
    AN.reset();step(2);delete S.rt.force[n];S.rt.force[n]=1;step(4);press('A');step(6);const a=st().pk===man&&st().fman===1;
    delete S.rt.force[n];step(6);const b=st().pk===man;const still=S.rt.v[n]>.5;/* the logic itself may still ask for manual (a real force-manual condition): then AUTO must stay refused */press('A');step(6);const d=(still||S.rt.v[n]>.5)?st().pk===man:st().pk===c.autoLeg;/* the logic can ask for manual by itself after AUTO (a real condition): then manual is right */
    if(a&&b&&d)R.pass++;else R.fail.push(w+' '+(a?'':'AUTO accepted while forced; ')+(b?'':'went AUTO by itself after release; ')+(d?'':(still?'went AUTO although the logic still forces manual':'cannot go AUTO after release')));
   }catch(e){nt('error',w+' '+e.message)}
   delete S.rt.force[n]}}
 return R});
console.log('PASS',r.pass,' FAIL',r.fail.length);r.fail.slice(0,20).forEach(x=>console.log('  FAIL',x));
for(const k in r.nt)console.log('NOT TESTED ('+r.nt[k].length+'):',k,r.nt[k].slice(0,6).join(', '));
if(errs.length)console.log('page errors',errs.slice(0,3));await browser.close();process.exit(r.fail.length?1:0)})();
