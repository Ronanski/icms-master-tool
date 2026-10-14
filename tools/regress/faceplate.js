// Operator faceplate (AUTO / MAN / MV buttons): each controller must move the A/M STATION (the selector after the PID that has the manual source), not the first selector (FAULT hold / back-up).
// Usage: node tools/regress/faceplate.js [html]
const {open}=require('./lib.js');
(async()=>{const {browser,page,errs}=await open(process.argv[2]||require('fs').readdirSync('.').find(x=>/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x)));
const r=await page.evaluate(()=>{const res=[];let n=0,ok=0,noManual=0;
 for(const x of AN.sheets)if(x.S)for(const p of x.S.procs||[])p.proc.on=false;
 for(const sh of AN.sheets){if(/ABC-000/.test(sh.name))continue;const S=AN.ensure(sh);AN.go(AN.sheets.indexOf(sh));
  for(const c of AN.hmiCtrls(S)){n++;if(!c.amt){res.push(sh.name+' '+c.tag+': NO A/M switch');continue}
   // ground truth: the selector in the chain after the PID that has a manual source
   const po=c.b.o.find(m=>!S.nets[m].dig)??c.b.o[0];const chain=[];let cur=po;for(let g=0;g<6;g++){const sw=S.blk.find(z=>(z.k==='AMT'||z.k==='SW')&&z.a!=null&&z.b!=null&&z.o[0]!=null&&(z.a===cur||z.b===cur)&&!chain.includes(z));if(!sw)break;chain.push(sw);cur=sw.o[0]}
   let st=null;for(let i=0;i<chain.length&&!st;i++){const sw=chain[i];const pl=i===0?(sw.a===po?'A':'B'):(sw.a===chain[i-1].o[0]?'A':'B');const o=pl==='A'?sw.b:sw.a;if(o==null||o<0)continue;if((S.drv[o]||[]).some(d=>d.k==='MAN')||(S.ext.includes(o)&&!S.nets[o].dig))st=sw}
   if(!st){noManual++;continue}
   if(st===c.amt)ok++;else res.push(sh.name+' '+c.tag+': faceplate uses '+c.amt.k+'#'+c.amt.id+' but the A/M station is '+st.k+'#'+st.id)}}
 return {n,ok,noManual,wrong:res}});
const wrong=r.wrong.filter(x=>!/NO A\/M switch/.test(x)),none=r.wrong.filter(x=>/NO A\/M switch/.test(x));console.log((wrong.length?'FAIL':'PASS')+' operator faceplate: '+r.n+' controllers, '+r.ok+' use the right A/M station, '+wrong.length+' use a WRONG switch, '+none.length+' have no A/M switch after the PID (A/M on another sheet or after a summing block: not tested), '+r.noManual+' have no manual source');wrong.forEach(x=>console.log(' ',x));process.exitCode=wrong.length?1:0;await browser.close()})();
