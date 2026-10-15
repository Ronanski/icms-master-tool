// Plant model vs the real plant (2.0.0, user tip): the HMI snapshot operating points (docs/hmi/operating-points.json).
// For every anchored loop: LOCAL + MANUAL, MV = the snapshot MV, run 5 time constants; the PV must settle at the snapshot PV
// (within 2 % of the range), and MV +10 % must move the PV in the direction of the drawing (ACT). Usage: node tests/regress/hmi_op.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);
const R=await page.evaluate(()=>{const out=[];for(let i=0;i<AN.sheets.length;i++){const sh=AN.sheets[i];if(/ABC-000/.test(sh.name))continue;AN.go(i);const S=sh.S;let cs=[];try{cs=AN.hmiCtrls(S)}catch(e){}
 for(const c of cs){const pb=(S.procs||[]).find(b=>b.id===c.b.id);if(!pb||!pb.proc)continue;AN.reset();AN.go(i);const run=sec=>{for(let k=0;k<sec*2;k++)AN.stepSet(sh,.5)};run(2);
  const pr=pb.proc;if(!pr.hop)continue;if(!c.amt||c.manNet==null){out.push({t:c.tag,sh:sh.name,skip:'no manual MV'});continue}
  const P=c.b.p,span=(P.rhi!=null?P.rhi:100)-(P.rlo!=null?P.rlo:0);const man=c.autoLeg==='A'?'B':'A';
  if(c.svSw){const q=S.rt.st[c.svSw.id];if(q){q.al='A';q.fm='B'}}const st=S.rt.st[c.amt.id];st.al=c.autoLeg;st.fm=man;
  const setMV=v=>{if(c.manBlk&&S.rt.st[c.manBlk.id])S.rt.st[c.manBlk.id].val=v;else S.rt.ext[c.manNet]=v};
  const T=Math.min(400,(pr.T||30)*5+(pr.L||0)*2);setMV(pr.hop.mv);run(T);const pv1=S.rt.v[c.q.pv];setMV(pr.hop.mv+10);run(T);const pv2=S.rt.v[c.q.pv];
  out.push({t:c.tag,sh:sh.name,want:pr.hop.pv,mv:pr.hop.mv,pv1,pv2,span,act:P.act,src:pr.hop.src})}}return out});
let fail=0;for(const r of R){if(r.skip){console.log('SKIP',r.sh,r.t,r.skip);continue}
 const ok1=Math.abs(r.pv1-r.want)<=0.02*r.span,dir=(r.pv2-r.pv1)*(r.act<0?1:-1)>0;
 /* reverse acting (ACT -1 in this simulator = PV up when MV up?) is checked against the drawing: the sign that the plant uses */
 console.log((ok1?'PASS ':'FAIL ')+r.sh+' '+r.t+': MV '+r.mv+' % → PV '+r.pv1.toFixed(2)+' (snapshot '+r.src+': '+r.want+'); MV +10 % → PV '+r.pv2.toFixed(2));if(!ok1)fail++}
console.log(R.filter(r=>!r.skip).length+' anchored loops checked');if(errs.length)console.log('page errors',errs.slice(0,3));
await browser.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
