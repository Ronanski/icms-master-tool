const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
 for(const [w,h,tag] of [[1280,900,'pc'],[400,860,'ph']]){
  const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///mnt/project-files/tutor-2026-11-11/signal-path-finder.html');await p.waitForTimeout(800);
  for(const q of ['GCP-AO1005','PT-BR1001-1','ZSO-FW1111-1','XV-FW1111-1']){
   if(q!=='GCP-AO1005'){await p.fill('#q',q);await p.press('#q','Enter');await p.waitForTimeout(700)}
   const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   const n=await p.evaluate(()=>document.querySelectorAll('.stop').length);
   console.log(tag,q,'overflow',ov,'stops',n,'errs',errs.length,errs[0]||'');
   await p.screenshot({path:`/tmp/claude-0/tr2/${tag}-${q}.png`,fullPage:true});}
 }
 await b.close()})();
