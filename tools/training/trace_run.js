/* Code-run trace of the Training (Cold -> Practice) for the plant model audit (CHECKLIST 0.5): one line per step and every 8 s of
   MW / MSF / MSP / MST / O2 / PA / bed / coal / drum level / FW / RHP / blow-off / HP bypass. Not a human test (that is human_run.js).
   Usage: npm run build; node tools/training/trace_run.js <absolute path of the html> > trace.txt   (about 15 min) */
const {chromium}=require(process.env.PW||'playwright');
(async()=>{const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});const p=await (await b.newContext({viewport:{width:1440,height:860}})).newPage();
await p.addInitScript(()=>{window.LS_PVWIN=false;window.open=()=>null;try{localStorage.clear()}catch(e){}});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(4000);
await p.evaluate(()=>new Promise(r=>{LS_DOCK.start();setTimeout(r,6000)}));
await p.evaluate(()=>{const b=[...document.querySelectorAll('#gdock .gd-seg button')].find(x=>x.textContent==='×300');b.click()});
/* 3.2.0 walkthrough #1: the Training starts PAUSED; the trainee presses RUN (the pill of the panel) */
await p.evaluate(()=>{const b=document.querySelector('#gdock .gd-pill');if(b&&/PAUSED/.test(b.textContent))b.click()});await p.waitForTimeout(500);
let last=-1,lt=0;const t0=Date.now();
const f=(x,d)=>x==null||!isFinite(x)?'-':(+x).toFixed(d||0);
while(Date.now()-t0<25*60e3){const r=await p.evaluate(()=>{const s0=LS_GUIDE.steps()[LS_GUIDE.cur];for(const a of (s0&&s0.a)||[])if(a.ad)try{LS_DOCK.fieldSet(LS_DOCK.fieldOf(a.ad).field)}catch(e){}LS_GUIDE.doIt();LS_GUIDE.scan();const H=LS_GUIDE.h(),U=AN.unit||{};
 const g=k=>{try{return H[k]()}catch(e){return null}};
 return {cur:LS_GUIDE.cur,t:s0&&s0.t,simt:AN.sheets[0].S?AN.sheets[0].S.rt.t:0,MW:g('MW'),MSF:g('MSF'),MSP:g('MSP'),MST:g('MST'),O2:g('O2'),PA:g('PA'),lvl:g('lvl'),FW:g('FW'),RHP:g('RHP'),Tb:U.Tb,Fc:U.Fc,blo:H.mv?H.mv('ABC-013','PICMS1002'):null,hpb:H.mv?H.mv('ABC-050','PICMS1006'):null}});
 const line=()=>'t'+f(r.simt/60,1)+'m MW '+f(r.MW,1)+' MSF '+f(r.MSF)+' MSP '+f(r.MSP,1)+' MST '+f(r.MST)+' O2 '+f(r.O2,1)+' PA '+f(r.PA)+' bed '+f(r.Tb)+' coal '+f(r.Fc,1)+' lvl '+f(r.lvl)+' FW '+f(r.FW)+' RHP '+f(r.RHP,1)+' blo '+f(r.blo)+' hpb '+f(r.hpb);
 if(r.cur!==last){last=r.cur;console.log('#'+(r.cur+1)+' '+String(r.t).slice(0,60)+' | '+line())}
 else if(Date.now()-lt>8000){lt=Date.now();console.log('    '+line())}
 if(r.cur>=64)break;await p.waitForTimeout(700)}
await b.close()})();
