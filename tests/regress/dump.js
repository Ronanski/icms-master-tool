// Dumps the simulator data that refcheck.py compares with the reference workbooks (document-references/).
const {open}=require('./lib');
(async()=>{const {browser,page}=await open(process.argv[2]||'logic-sim-v1.20.29.html');
const d=await page.evaluate(()=>{const fx={},bl=[],ai=[];
 for(const sh of AN.sheets){const S=AN.ensure(sh);
  for(const b of S.blk){
   if(b.k==='FX'&&b.p.tbl)fx[b.p.tbl.key]={key:b.p.tbl.key,pts:b.p.tbl.pts,edited:!!b.p.tbl.edited,ln:b.p.ln,sheet:sh.name};
   if(['PID','PIDV','MAN','SUMA'].includes(b.k))bl.push({sheet:sh.name,k:b.k,id:b.id,tag:(b.txt||[])[1]||'',all:b.txt||[],mno:((b.txt||[])[2]||'').replace(/^S\d-MDL/,''),p:b.p});
   
  }
  for(const a of S.addr||[]){if(a.ai==null)continue;const b=S.blk.find(q=>q.id===a.ai);if(b&&b.rng)ai.push({sheet:sh.name,tag:a.t,rng:b.rng})}}
 return {fx:Object.values(fx),blocks:bl,ai}});
require('fs').writeFileSync(process.argv[3]||'/dev/stdout',JSON.stringify(d));
await browser.close()})();
