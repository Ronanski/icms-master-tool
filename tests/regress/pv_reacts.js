// Does the PV answer the MV? (user: "may mga sheet na di nag-rereact si PV kahit OK na ang SV at MV")
// For every controller (plant model ON, the default): LOCAL + MANUAL, MV set to a value, 20 s; MV changed by 25 % of its range, 60 s; the PV must move.
// Lists the loops where it does not, with the state of the plant model of that loop. Usage: node tests/regress/pv_reacts.js [html] [--sheets=ABC-007,...]
const {open}=require('./lib.js');const fs=require('fs');
const running=process.argv.includes('--running');/* diagnosis: every measurement (AI) that no controller drives starts at the middle of its range = boiler in service, not cold */
const only=(process.argv.find(a=>/^--sheets=/.test(a))||'').slice(9).split(',').filter(Boolean);
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);
const R=await page.evaluate(([only,running])=>{const out=[];const mid=()=>{for(const sh of AN.sheets){AN.go(AN.sheets.indexOf(sh));const S=sh.S;const pins=new Set();for(const b of S.procs||[])for(const id of (b.proc&&b.proc.allAI)||[])pins.add(id);for(const b of S.blk)if(b.k==='AI'&&!pins.has(b.id)&&b.rng&&S.rt.st[b.id]){const x=b.rng.lo+.5*(b.rng.hi-b.rng.lo);S.rt.st[b.id].val=x;S.rt.st[b.id].act=x}}};
 for(let i=0;i<AN.sheets.length;i++){const sh=AN.sheets[i];if(only.length&&!only.includes(sh.name))continue;AN.go(i);const S=sh.S;let cs=[];try{cs=AN.hmiCtrls(S)}catch(e){}
  for(const c of cs){if(!c.amt||c.manNet==null)continue;AN.reset();if(running){mid();AN.go(i)}const P=c.b.p,rlo=P.rlo!=null?P.rlo:0,rhi=P.rhi!=null?P.rhi:100,span=rhi-rlo;const man=c.autoLeg==='A'?'B':'A';
   const run=sec=>{for(let k=0;k<sec*2;k++)AN.stepSet(sh,.5)};
   try{
    if(c.svSw){const q=S.rt.st[c.svSw.id];if(q){q.al='A';q.fm='B'}}
    const st=S.rt.st[c.amt.id];st.al=c.autoLeg;st.fm=man;
    const setMV=v=>{if(c.manBlk&&S.rt.st[c.manBlk.id])S.rt.st[c.manBlk.id].val=v;else S.rt.ext[c.manNet]=v};
    setMV(40);run(20);const pv1=S.rt.v[c.q.pv],mv1=S.rt.v[c.out];setMV(65);run(60);const pv2=S.rt.v[c.q.pv],mv2=S.rt.v[c.out];
    const pr=(S.procs||[]).filter(b=>b.proc&&(b.id===c.b.id||(b.txt||[])[1]===c.tag)).map(b=>({on:b.proc.on,mode:b.proc.mode}));
    out.push({sh:sh.name,tag:c.tag,pv1:+pv1.toFixed(3),pv2:+pv2.toFixed(3),mv1:+mv1.toFixed(2),mv2:+mv2.toFixed(2),span,moved:Math.abs(pv2-pv1),pr,pk:st.pk,rem:!!st.rem})
   }catch(e){out.push({sh:sh.name,tag:c.tag,err:String(e.message).slice(0,100)})}}}
 return out},[only,running]);
const bad=R.filter(x=>x.err||(x.mv2-x.mv1>1&&x.moved<0.02*x.span)||x.pk!==(x.pk));
const nr=R.filter(x=>!x.err&&Math.abs(x.mv2-x.mv1)>1&&x.moved<0.02*x.span),mvStuck=R.filter(x=>!x.err&&Math.abs(x.mv2-x.mv1)<=1);
console.log('controllers tested',R.length,'| PV answers:',R.length-nr.length-mvStuck.length-R.filter(x=>x.err).length,'| PV does NOT answer:',nr.length,'| MV did not follow (manual not accepted):',mvStuck.length,'| errors:',R.filter(x=>x.err).length);
nr.forEach(x=>console.log('  NO REACTION',x.sh,x.tag,'MV',x.mv1,'->',x.mv2,'PV',x.pv1,'->',x.pv2,'(range',x.span+')','plant',JSON.stringify(x.pr)));
mvStuck.forEach(x=>console.log('  MV STUCK',x.sh,x.tag,'MV',x.mv1,'->',x.mv2,'pk',x.pk,'remote-lock',x.rem));
R.filter(x=>x.err).forEach(x=>console.log('  ERROR',x.sh,x.tag,x.err));
if(errs.length)console.log('page errors',errs.slice(0,3));await browser.close();process.exit(nr.length?1:0)})();
