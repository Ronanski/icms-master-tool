// Switch test (every SW / AMT block of every ABC sheet): force each control signal ON, release, force OFF, release (plant model off).
// A run with the same time line and no force is the reference: after the release the switch (leg A / B) must be where the reference is.
// Usage: node tests/regress/switches.js [html]   (about 3 min)
const {open}=require('./lib.js');
(async()=>{const {browser,page}=await open(process.argv[2]||require('fs').readdirSync('dist').map(x=>'dist/'+x).find(x=>/logic-sim-v\d+\.\d+\.\d+\.html$/.test(x)));
const r=await page.evaluate(()=>{const out=[];let tot=0,bykind={};
 const plant=[];for(const x of AN.sheets)if(x.S)for(const b of x.S.procs||[]){plant.push([b,b.proc.on]);b.proc.on=false}
 for(const sh of AN.sheets){if(/ABC-000/.test(sh.name))continue;let S;try{S=AN.ensure(sh)}catch(e){continue}
  for(const b of S.blk){if(b.k!=='SW'&&b.k!=='AMT')continue;
   const ctl=new Set();if(b.sel>=0)ctl.add(b.sel);for(const c of b.cs||[])ctl.add(c.n);
   for(const n of ctl){
    const pk=()=>S.rt.st[b.id].pk;
    const run=(force)=>{AN.reset();for(let i=0;i<6;i++)AN.stepSet(sh,0);const r=[];const st=k=>{for(let i=0;i<k;i++)AN.stepSet(sh,.25)};
      st(8);r.push(pk());
      if(force)S.rt.force[n]=1;st(8);r.push(pk());if(force)delete S.rt.force[n];st(16);r.push(pk());
      if(force)S.rt.force[n]=0;st(8);r.push(pk());if(force)delete S.rt.force[n];st(16);r.push(pk());return r};
    const ref=run(false),got=run(true);const [base,f1,rel1,f0,rel0]=got;
    const bad=rel1!==ref[2]||rel0!==ref[4];
    tot++;const key=b.k+(b.latch?'+latch':'')+((b.cs&&b.cs.length>1)?'+cs':'')+(b.q4?'+q4':'');
    bykind[key]=bykind[key]||[0,0];bykind[key][0]++;if(bad){bykind[key][1]++;out.push({sh:sh.name,id:b.id,key,txt:(b.txt||[]).join('/'),net:n,isSel:n===b.sel,base,f1,rel1,f0,rel0,ref:ref.join('')})}}}}
 for(const [b,o] of plant)b.proc.on=o;return {tot,out,bykind}});
console.log((r.out.length?'FAIL':'PASS')+' switches: '+r.tot+' control cases, '+r.out.length+' not back where the reference is');console.log(JSON.stringify(r.bykind));
r.out.forEach(x=>console.log(x.sh,x.id,x.key,x.txt,'net'+x.net,x.isSel?'SEL':'cs','base',x.base,'f1',x.f1,'rel1',x.rel1,'f0',x.f0,'rel0',x.rel0,'ref',x.ref));
await browser.close()})();
