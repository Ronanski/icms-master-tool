// Preload: Worker mode for the regress tests without touching them. Sets localStorage ls-worker=1 before the page loads,
// and after the test's own "sheets >= 54" wait, also waits until the engine is in the worker (ENG.mode==='mirror') or failed.
const pw=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const INIT=()=>{try{localStorage.setItem('ls-worker','1')}catch(e){}};
const pages=[];
const wrapPage=p=>{pages.push(p);const wf=p.waitForFunction.bind(p);
 p.waitForFunction=async(fn,arg,opt)=>{const r=await wf(fn,arg,opt);const s=String(fn);
  if(/sheets/.test(s)&&/54/.test(s)){const t0=Date.now();await wf(()=>window.ENG&&(ENG.mode==='mirror'||ENG.err),null,{timeout:180000}).catch(()=>{});
   const m=await p.evaluate(()=>({mode:window.ENG&&ENG.mode,err:window.ENG&&ENG.err})).catch(()=>({}));console.log('[worker] waited '+((Date.now()-t0)/1000).toFixed(1)+' s, mode='+m.mode+(m.err?' err='+JSON.stringify(m.err):''))}
  return r};return p};
const wrapCtx=c=>{c.addInitScript(INIT);const np=c.newPage.bind(c);c.newPage=async(...a)=>wrapPage(await np(...a));return c};
const L=pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch=async(...a)=>{const b=await L(...a);const nc=b.newContext.bind(b),np=b.newPage.bind(b),cl=b.close.bind(b);
 b.newContext=async(...x)=>wrapCtx(await nc(...x));
 b.newPage=async(...x)=>{const p=await np(...x);await p.context().addInitScript(INIT);return wrapPage(p)};
 b.close=async()=>{for(const p of pages){const m=await p.evaluate(()=>({mode:window.ENG&&ENG.mode,err:window.ENG&&ENG.err,bar:!!document.getElementById('engerr')})).catch(()=>null);if(m)console.log('[worker] at end: mode='+m.mode+(m.err?' err='+JSON.stringify(m.err):'')+(m.bar?' RED BAR':''))}return cl()};
 return b};
