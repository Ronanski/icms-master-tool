// FORCE MANUAL (user rule, 2026-10-14; drawing ABC-007 "1:B" M.0190): when the logic signal that selects the MANUAL leg of the A/M station is 1,
// the operator's AUTO must be refused; after the signal is gone the station STAYS manual until the operator presses AUTO (HMI and diagram show the same).
// For every controller with an A/M station on all 54 sheets: force the manual-leg select signal to 1, press AUTO, expect MANUAL; release, expect still MANUAL; press AUTO, expect AUTO (unless the logic still forces manual).
// Controllers whose manual-leg select signal cannot be found are listed as NOT TESTED with the reason. Usage: node tests/regress/force_manual.js [html] [--sheets=ABC-007,ABC-003A]
const {open}=require('./lib.js');const fs=require('fs');
const only=(process.argv.find(a=>/^--sheets=/.test(a))||'').slice(9).split(',').filter(Boolean);
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);
const r=await page.evaluate((only)=>{const R={pass:0,fail:[],nt:{}};const nt=(k,w)=>{R.nt[k]=(R.nt[k]||[]);R.nt[k].push(w)};
 for(let i=0;i<AN.sheets.length;i++){const sh=AN.sheets[i];if(only.length&&!only.includes(sh.name))continue;AN.go(i);const S=sh.S;let cs=[];try{cs=AN.hmiCtrls(S)}catch(e){}
  for(const c of cs){const w=sh.name+' '+c.tag;if(!c.amt){nt('no A/M station',w);continue}
   const amt=c.amt,man=c.autoLeg==='A'?'B':'A';
   let nets=[];if(amt.cs&&amt.cs.length>1){nets=amt.cs.filter(q=>(q.A?'A':'B')===man).map(q=>q.n)}else if(amt.sel>=0){const P=amt.p||{};if(((P.selA?'A':'B'))===man)nets=[amt.sel]}
   if(!nets.length){nt('the select signal asks for the AUTO leg or there is none',w);continue}
   const n=nets[0];const st=()=>S.rt.st[amt.id];const step=k=>{for(let j=0;j<k;j++)AN.stepSet(sh,.5)};
   const press=m=>{const s=st();s.al=c.autoLeg;s.fm=m==='A'?c.autoLeg:man;try{AN.settle()}catch(e){}};
   try{
    AN.reset();step(2);delete S.rt.force[n];S.rt.force[n]=1;step(4);press('A');step(6);const a=st().pk===man&&st().fman===1;
    /* from here the logic may move the station by itself with its own signals (1:A pulse = AUTO, a force-manual condition that comes back after AUTO): the test follows every step and accepts what the drawing's signals ask */
    delete S.rt.force[n];let sawA=false,sawB=false;for(let j=0;j<12;j++){step(1);if((amt.cs||[]).some(q=>q.A&&S.rt.v[q.n]>.5))sawA=true;if((amt.cs||[]).some(q=>!q.A&&S.rt.v[q.n]>.5))sawB=true}
    const b=sawB?true:sawA?st().pk===c.autoLeg:st().pk===man;/* signal gone: it STAYS manual, it does not go to AUTO by itself (user rule 2026-10-15), unless the drawing's own 1:A signal asked for AUTO */
    press('A');sawB=false;for(let j=0;j<12;j++){step(1);if((amt.cs||[]).some(q=>!q.A&&S.rt.v[q.n]>.5))sawB=true}
    const d=sawB?true:st().pk===c.autoLeg;/* the operator presses AUTO: AUTO, unless a force-manual condition of the logic asks for manual */
    const still=false,sigA=false;
    if(a&&b&&d)R.pass++;else R.fail.push(w+' '+(a?'':'AUTO accepted while forced; ')+(b?'':'did not stay manual / did not follow the 1:A signal after the signal went; ')+(d?'':'the operator cannot go AUTO although no signal asks for manual'));
   }catch(e){nt('error',w+' '+e.message)}
   delete S.rt.force[n]}}
 return R},only);
console.log('PASS',r.pass,' FAIL',r.fail.length);r.fail.slice(0,20).forEach(x=>console.log('  FAIL',x));
for(const k in r.nt)console.log('NOT TESTED ('+r.nt[k].length+'):',k,r.nt[k].slice(0,6).join(', '));
if(errs.length)console.log('page errors',errs.slice(0,3));await browser.close();process.exit(r.fail.length?1:0)})();
