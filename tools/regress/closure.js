// Loop closure of every PID with its plant model (P-4): loop forced to auto, SV step of 15 % of the span, 900 s (dt 1 s).
// Usage: node tools/regress/closure.js html out.json
const {open}=require('./lib');
(async()=>{const {browser,page}=await open(process.argv[2]);
const r=await page.evaluate(()=>{const out={};
 for(const sh of AN.sheets){const S=AN.ensure(sh);for(const b of S.blk){
  if(b.k!=='PID')continue;const q=AN.anPins(S,b);if(!q||q.sv==null||q.pv==null||q.pv<0||!b.proc||!b.proc.on)continue;
  AN.reset();for(const x of S.procs||[])x.proc.on=true;
  const P=b.p,span=P.span||(P.rhi-P.rlo)||100;
  for(const a of S.blk){if(a.k!=='AMT'&&a.k!=='SW')continue;const st=S.rt.st[a.id];if(!st)continue;if(b.o.includes(a.a))st.fm='A';else if(b.o.includes(a.b))st.fm='B'}
  S.rt.force={};for(let i=0;i<120;i++)AN.stepSet(sh,1);
  const pv0=S.rt.v[q.pv],sv0=S.rt.v[q.sv];S.rt.force[q.sv]=sv0+.15*span;
  for(let i=0;i<900;i++)AN.stepSet(sh,1);
  const pv1=S.rt.v[q.pv];out[sh.name+'#'+b.id+' '+((b.txt||[])[1]||'')]={pv0,pv1,step:.15*span,prog:(pv1-pv0)/(.15*span),cut:P.cut,rlo:P.rlo}}}
 return out});
require('fs').writeFileSync(process.argv[3],JSON.stringify(r));await browser.close()})();
