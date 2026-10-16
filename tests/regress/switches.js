// Switch test (every SW / AMT block of every ABC sheet): force each control signal ON, release, force OFF, release (plant model off).
// A run with the same time line and no force is the reference: after the release a switch (leg A / B) must be where the reference is;
// an A/M station keeps the forced leg until the operator's mode press, which must bring it back (user rule 2026-10-15).
// Usage: node tests/regress/switches.js [html]   (about 3 min)
const {open}=require('./lib.js');
(async()=>{const {browser,page}=await open(process.argv[2]||require('fs').readdirSync('dist').map(x=>'dist/'+x).find(x=>/logic-sim-v\d+\.\d+\.\d+(?:-beta\.\d+)?\.html$/.test(x)));
const r=await page.evaluate(()=>{const out=[];let tot=0,bykind={},amKept=0;
 const plant=[];for(const x of AN.sheets)if(x.S)for(const b of x.S.procs||[]){plant.push([b,b.proc.on]);b.proc.on=false}
 for(const sh of AN.sheets){if(/ABC-000/.test(sh.name))continue;let S;try{S=AN.ensure(sh)}catch(e){continue}
  for(const b of S.blk){if(b.k!=='SW'&&b.k!=='AMT')continue;
   const ctl=new Set();if(b.sel>=0)ctl.add(b.sel);for(const c of b.cs||[])ctl.add(c.n);
   for(const n of ctl){
    const pk=()=>S.rt.st[b.id].pk;
    /* an A/M station (the engine knows its AUTO leg, st.al) keeps the leg that an active select / force-manual signal asked for after the
       signal is gone, until the operator selects the mode (user rule 2026-10-15, CLAUDE.md "HINDI NAGBABAGO" 2; tests/regress/force_manual.js).
       So for a station: after the release it must KEEP the forced leg, and the operator's mode press must bring it back to the reference.
       A plain switch (SW) follows its select signal and must be back by itself. */
    const run=(force,ref)=>{AN.reset();for(let i=0;i<6;i++)AN.stepSet(sh,0);const r=[];const st=k=>{for(let i=0;i<k;i++)AN.stepSet(sh,.25)};
      const amS=S.rt.st[b.id].al!=null,w=[];
      st(8);r.push(pk());
      if(force)S.rt.force[n]=1;st(8);r.push(pk());if(force)delete S.rt.force[n];st(16);r.push(pk());
      if(force&&amS&&r[2]!==ref.r[2])S.rt.st[b.id].fm=ref.r[2];st(8);w.push(pk());/* the operator's press, or the same wait without it (same time line: a TON of the drawing, e.g. ABC-050 M.0703 = both BFWP stopped 15 s) */
      if(force)S.rt.force[n]=0;st(8);r.push(pk());if(force)delete S.rt.force[n];st(16);r.push(pk());
      if(force&&amS&&r[4]!==ref.r[4])S.rt.st[b.id].fm=ref.r[4];st(8);w.push(pk());
      return {r,w}};
    const R0=run(false),G=run(true,R0),ref=R0.r,got=G.r;const [base,f1,rel1,f0,rel0]=got;
    const am=S.rt.st[b.id].al!=null;
    /* a switch: back by itself. A station: kept the forced leg after the release (= f1), and after the operator's press it is where
       the reference is at the same moment (w) */
    const bad=am?((rel1!==ref[2]&&(rel1!==f1||G.w[0]!==R0.w[0]))||(rel0!==ref[4]&&G.w[1]!==R0.w[1])):(rel1!==ref[2]||rel0!==ref[4]);
    const op=G.w.join('');
    if(am&&rel1!==ref[2]&&!bad)amKept++;
    tot++;const key=b.k+(b.latch?'+latch':'')+((b.cs&&b.cs.length>1)?'+cs':'')+(b.q4?'+q4':'');
    bykind[key]=bykind[key]||[0,0];bykind[key][0]++;if(bad){bykind[key][1]++;out.push({sh:sh.name,id:b.id,key,txt:(b.txt||[]).join('/'),net:n,isSel:n===b.sel,base,f1,rel1,f0,rel0,op,ref:ref.join('')+'/'+R0.w.join('')})}}}}
 for(const [b,o] of plant)b.proc.on=o;return {tot,out,bykind,amKept}});
console.log((r.out.length?'FAIL':'PASS')+' switches: '+r.tot+' control cases, '+r.out.length+' not back where the reference is ('+r.amKept+' A/M stations kept the forced leg after the release and came back with the operator\'s mode press, as the rule says)');console.log(JSON.stringify(r.bykind));
r.out.forEach(x=>console.log(x.sh,x.id,x.key,x.txt,'net'+x.net,x.isSel?'SEL':'cs','base',x.base,'f1',x.f1,'rel1',x.rel1,'f0',x.f0,'rel0',x.rel0,'op',x.op,'ref',x.ref));
await browser.close()})();
