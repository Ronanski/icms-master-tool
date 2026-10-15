// SCENARIO TEST (user rule 2026-10-15: ang test ay dapat tama ang RESULTA, hindi lang walang error): mula INPUT hanggang OUTPUT ng mismong simulation engine,
// ayon sa drawing (PDF). Ang inaasahang sagot ay isinulat ng tao mula sa PDF (tests/scenarios/<sheet>.json), HINDI kinuwenta ng engine.
// Ang operator actions (AUTO, MAN, REMOTE, LOCAL, MV) ay pindot sa tunay na operator panel (DOM), parang user.
// Usage: node tests/scenarios/run.js [sheet ...]   (default: lahat ng .json sa folder na ito)
const fs=require('fs'),path=require('path');const {open}=require('../regress/lib.js');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+\.html$/.test(x));
const want=process.argv.slice(2).filter(a=>!/\.html$/.test(a));
const files=fs.readdirSync(__dirname).filter(f=>/^ABC-.*\.json$/.test(f)&&(!want.length||want.includes(f.replace('.json',''))));
/* "cases": talaan ng katotohanan (steady-state): bawat case = bagong simula, itakda ang mga input, maghintay, tingnan ang target. Walang umaasa sa oras maliban sa timer na nasa drawing (hinihintay nang sapat). */
const expand=sc=>{if(!sc.cases)return sc;const steps=[];for(const c of sc.cases){steps.push({do:'reset',say:'BAGONG SIMULA: '+c.say});steps.push({do:'wait',s:3,say:'hintayin ang startup pulse ng ibang sheet (hal. M.0098 ng ABC-003E ay 2 s na pulse pagkatapos ng Reset)'});for(const b of sc.base||[])steps.push(Object.assign({do:'set'},b));for(const x of c.set||[])steps.push(Object.assign({do:'set'},x));steps.push({do:'wait',s:c.wait||sc.wait||12});for(const e of c.expect)steps.push(Object.assign({expect:'signal'},e));}return Object.assign({},sc,{steps})};
(async()=>{const {browser,page,errs}=await open(html);let fail=0,pass=0;
for(const f of files){const spec=JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'));
 console.log('\n=== '+spec.sheet+' · '+spec.title+'  (PDF: '+spec.pdf+')');
 for(const sc0 of spec.scenarios){
  const sc=expand(sc0);
  await page.evaluate(s=>{AN.go(AN.sheets.findIndex(x=>x.name===s));AN.reset();AN.go(AN.sheets.findIndex(x=>x.name===s));[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Operator').forEach(b=>b.click());AN.run=false},spec.sheet);
  await page.waitForTimeout(1200);
  console.log('\n['+sc.id+'] '+sc.title+'\n   drawing: '+sc.drawing);
  let n=0;
  for(const st of sc.steps){n++;
   const r=await page.evaluate(([st,loop,sheet])=>{
    const sh=AN.sheets.find(x=>x.name===sheet),S=sh.S,rt=S.rt;
    const netOf=t=>{for(let n=0;n<S.nets.length;n++)if(S.lab[n]&&S.lab[n].t&&S.lab[n].t.trim()===t)return n;return -1};
    const nearOf=txt=>{const tx=(S.tx||[]).find(x=>x.t.trim()===txt);if(!tx)return -1;let bn=-1,bd=60;for(const m of S.ext)for(const i of S.nets[m].segs){const s=S.seg[i];for(const [x,y] of [[s.x1,s.y1],[s.x2,s.y2]]){const d=Math.hypot(tx.x-x,tx.y-y);if(d<bd){bd=d;bn=m}}}return bn};
    const net=o=>o.near?nearOf(o.near):netOf(o.tag);
    const step=k=>{for(let i=0;i<k*2;i++)AN.stepSet(sh,.5)};
    const ctl=AN.hmiCtrls(S).find(c=>c.tag===loop),fp=[...document.querySelectorAll('#opp .fp')].find(x=>x.querySelector('.tg b')&&x.querySelector('.tg b').textContent===loop);
    const btn=t=>fp&&[...fp.querySelectorAll('button')].find(e=>e.textContent.trim()===t);
    const stn=ctl&&ctl.amt?rt.st[ctl.amt.id]:null,mode=()=>!stn?'?':(stn.pk===ctl.autoLeg?'AUTO':'MANUAL');
    if(st.do==='set'&&st.sheet){/* ang signal ay galing sa ibang sheet: itakda doon (ang link ng dalawang sheet ang sinusubok) */const o=AN.sheets.find(x=>x.name===st.sheet);AN.ensure(o);const S2=o.S;let n2=-1;for(let n=0;n<S2.nets.length;n++)if(S2.lab[n]&&S2.lab[n].t&&S2.lab[n].t.trim()===st.tag)n2=n;if(n2<0)return{err:'walang '+st.tag+' sa '+st.sheet};S2.rt.force[n2]=st.value;try{AN.settle()}catch(e){}return{ok:1}}
    if(st.do==='set'){const n=net(st);if(n<0)return{err:'walang input na '+(st.tag||st.near)};if(S.xlk&&S.xlk[n]||!S.ext.includes(n))rt.force[n]=st.value;else rt.ext[n]=st.value;try{AN.settle()}catch(e){}return{ok:1}}
    if(st.do==='release'){const n=net(st);delete rt.force[n];try{AN.settle()}catch(e){}return{ok:1}}
    if(st.do==='wait'){step(st.s);return{ok:1}}
    if(st.do==='reset'){AN.reset();AN.go(AN.sheets.findIndex(x=>x.name===sheet));return{ok:1}}
    if(st.do==='press'){const b=btn(st.button);if(!b)return{err:'walang button '+st.button};if(b.disabled)return{ok:1,note:'disabled ang '+st.button+' (hindi napindot)'};b.click();step(.5);return{ok:1}}
    if(st.do==='mv'){const inp=[...fp.querySelectorAll('input')].find(i=>i.title===''||true);const ins=[...fp.querySelectorAll('input')];const mvIn=ins[ins.length-1];if(mvIn.disabled)return{ok:1,note:'disabled ang MV field'};mvIn.value=st.value;mvIn.dispatchEvent(new Event('change'));step(.5);return{ok:1}}
    if(st.do==='sv'){const ins=[...fp.querySelectorAll('input')];const svIn=ins[0];if(svIn.disabled)return{ok:1,note:'disabled ang SV field'};svIn.value=st.value;svIn.dispatchEvent(new Event('change'));step(.5);return{ok:1}}
    if(st.expect==='signal'){const n=net(st);if(n<0)return{err:'walang signal na '+(st.tag||st.near)};return{got:+rt.v[n].toFixed(3)}}
    if(st.do==='mark'){window.__mk=window.__mk||{};window.__mk[st.as]=st.what==='mv'?rt.v[ctl.out]:st.what==='sv'?rt.v[ctl.q.sv]:rt.v[ctl.q.pv];return{ok:1}}
    if(st.expect==='cmp'){const cur=st.what==='mv'?rt.v[ctl.out]:st.what==='sv'?rt.v[ctl.q.sv]:rt.v[ctl.q.pv],ref=window.__mk[st.than],d=cur-ref;if(st.min)return{got:(d>=st.min?'tumaas':d<=-st.min?'bumaba':'kulang ang galaw')+' ('+d.toFixed(1)+')'};return{got:Math.abs(d)<=(st.tol==null?1:st.tol)?'pareho':(d>0?'tumaas':'bumaba')+' ('+d.toFixed(1)+')'}}
    if(st.expect==='field'){const ins=[...fp.querySelectorAll('input')];const f=st.name==='SV'?ins[0]:ins[ins.length-1];return{got:f.disabled?'disabled':'enabled'}}
    if(st.expect==='sv'){return{got:+rt.v[ctl.q.sv].toFixed(2)}}
    if(st.expect==='near-pv'){const sv=rt.v[ctl.q.sv],pv=rt.v[ctl.q.pv],sp=(ctl.b.p.rhi-ctl.b.p.rlo)||100;return{got:Math.abs(sv-pv)<=sp*(st.pct||3)/100?'abot-SV':'malayo sa SV (SV '+sv.toFixed(1)+', PV '+pv.toFixed(1)+')'}}
    if(st.expect==='mode')return{got:mode()};
    if(st.expect==='disabled'){const b=btn(st.button);return{got:b?(b.disabled?'disabled':'enabled'):'walang button'}}
    if(st.expect==='faceplate'){const t=fp?fp.textContent:'';return{got:/FORCE MANUAL/.test(t)?'FORCE MANUAL':'wala'}}
    if(st.expect==='sv-switch'){const q=ctl.svSw&&rt.st[ctl.svSw.id];return{got:!q?'?':(q.pk==='A'?'A (logic / REMOTE)':'B (operator / LOCAL)')}}
    if(st.expect==='value'){return{got:+rt.v[ctl[st.what]].toFixed(3)}}
    if(st.expect==='mv'){return{got:+rt.v[ctl.out].toFixed(3)}}
    if(st.expect==='pv'){return{got:+rt.v[ctl.q.pv].toFixed(3)}}
    return{err:'hindi kilalang step '+JSON.stringify(st)}},[st,sc.loop,spec.sheet]);
   if(r.err){console.log('   ✘ #'+n+' '+r.err);fail++;continue}
   if(st.do)await page.waitForTimeout(450);/* the operator panel redraws on its own timer: wait like a person would */
   if(st.expect){const tol=st.tol==null?0.05:st.tol;const ok=typeof st.value==='number'?Math.abs(r.got-st.value)<=tol:(st.expect==='cmp'&&st.min?String(r.got).startsWith(String(st.value)):String(r.got)===String(st.value));
    console.log('   '+(ok?'✔':'✘')+' #'+n+' '+(st.say||st.expect)+'  → inaasahan: '+st.value+' | nakita: '+r.got+(st.why?'   ('+st.why+')':''));ok?pass++:fail++}
   else console.log('     · #'+n+' '+(st.say||st.do)+(r.note?'  ['+r.note+']':''))}}}
console.log('\nKABUUAN: '+pass+' tama, '+fail+' mali'+(errs.length?' | page errors: '+errs.slice(0,2):''));await browser.close();process.exit(fail?1:0)})();
