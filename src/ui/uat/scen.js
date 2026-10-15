/* SCENARIO UAT (in the page): isang operator + proseso nang sabay, mula INPUT hanggang OUTPUT ng mismong engine.
   Ang mga hakbang at ang inaasahang sagot ay nasa src/ui/uat/scenarios/<sheet>.json at isinulat mula sa drawing (PDF), hindi kinuwenta ng engine.
   Ang AUTO / MAN / REMOTE / LOCAL / MV / SV ay pindot sa tunay na operator panel. Ginagamit ito ng app (UAT panel) at ng tests/scenarios/run.js. */
window.UATS=(function(){
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const expand=sc=>{if(!sc.cases)return sc;const steps=[];for(const c of sc.cases){steps.push({do:'reset',say:'Bagong simula: '+c.say});steps.push({do:'wait',s:3,say:'hintayin ang startup pulse ng ibang sheet'});for(const b of sc.base||[])steps.push(Object.assign({do:'set'},b));for(const x of c.set||[])steps.push(Object.assign({do:'set'},x));steps.push({do:'wait',s:c.wait||sc.wait||12,say:'maghintay'});for(const e of c.expect)steps.push(Object.assign({expect:'signal'},e,{say:c.say+': '+(e.say||e.tag)}))}return Object.assign({},sc,{steps})};
 const labTxt=(S,n)=>S.lab[n]&&S.lab[n].t?S.lab[n].t.trim():'';
 function ctx(sheet,loop){const sh=AN.sheets.find(x=>x.name===sheet),S=sh.S,rt=S.rt;
  const netOf=t=>{for(let n=0;n<S.nets.length;n++)if(labTxt(S,n)===t)return n;return -1};
  const nearOf=txt=>{const tx=(S.tx||[]).find(x=>x.t.trim()===txt);if(!tx)return -1;let bn=-1,bd=60;for(const m of S.ext)for(const i of S.nets[m].segs){const s=S.seg[i];for(const [x,y] of [[s.x1,s.y1],[s.x2,s.y2]]){const d=Math.hypot(tx.x-x,tx.y-y);if(d<bd){bd=d;bn=m}}}return bn};
  const net=o=>o.near?nearOf(o.near):netOf(o.tag);
  const ctl=AN.hmiCtrls(S).find(c=>c.tag===loop),fp=[...document.querySelectorAll('#opp .fp')].find(x=>x.querySelector('.tg b')&&x.querySelector('.tg b').textContent===loop);
  return{sh,S,rt,net,ctl,fp,stn:ctl&&ctl.amt?rt.st[ctl.amt.id]:null}}
 const stepSim=async(sh,secs)=>{const n=Math.round(secs*2);for(let i=0;i<n;i++){AN.stepSet(sh,.5);if(i%150===149)await sleep(0)}};
 /* run one scenario: returns {lines:[{k:'do'|'ok'|'bad',t,exp,got}],pass,fail} */
 async function run(sheet,sc0,onLine){const sc=expand(sc0),L=[],run0=AN.run,mk={};let pass=0,fail=0;
  const push=l=>{L.push(l);if(onLine)onLine(l)};
  const idx=AN.sheets.findIndex(x=>x.name===sheet);AN.go(idx);AN.reset();AN.go(idx);
  [...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Operator').forEach(b=>b.click());AN.run=false;await sleep(1200);
  try{for(const st of sc.steps){const c=ctx(sheet,sc.loop),{sh,S,rt,net,ctl,fp,stn}=c;const btn=t=>fp&&[...fp.querySelectorAll('button')].find(e=>e.textContent.trim()===t);const mode=()=>!stn?'?':(stn.pk===ctl.autoLeg?'AUTO':'MANUAL');
   const val=w=>w==='mv'?rt.v[ctl.out]:w==='sv'?rt.v[ctl.q.sv]:rt.v[ctl.q.pv];
   if(st.do){let note='';
    if(st.do==='set'&&st.sheet){const o=AN.sheets.find(x=>x.name===st.sheet);AN.ensure(o);const S2=o.S;let n2=-1;for(let n=0;n<S2.nets.length;n++)if(labTxt(S2,n)===st.tag)n2=n;if(n2<0){push({k:'bad',t:'walang '+st.tag+' sa '+st.sheet});fail++;continue}S2.rt.force[n2]=st.value;try{AN.settle()}catch(e){}}
    else if(st.do==='set'){const n=net(st);if(n<0){push({k:'bad',t:'walang input na '+(st.tag||st.near)});fail++;continue}if(S.xlk&&S.xlk[n]||!S.ext.includes(n))rt.force[n]=st.value;else rt.ext[n]=st.value;try{AN.settle()}catch(e){}}
    else if(st.do==='wait')await stepSim(sh,st.s);
    else if(st.do==='reset'){AN.reset();AN.go(idx);}
    else if(st.do==='press'){const b=btn(st.button);if(!b){push({k:'bad',t:'walang button '+st.button});fail++;continue}if(b.disabled)note=' (disabled, hindi napindot)';else{b.click();await stepSim(sh,.5)}}
    else if(st.do==='mv'||st.do==='sv'){const ins=[...fp.querySelectorAll('input')],f=st.do==='sv'?ins[0]:ins[ins.length-1];if(f.disabled)note=' (disabled ang field)';else{f.value=st.value;f.dispatchEvent(new Event('change'));await stepSim(sh,.5)}}
    else if(st.do==='mark')mk[st.as]=val(st.what);
    if(st.say&&st.do!=='wait'&&st.do!=='mark')push({k:'do',t:st.say+note});
    await sleep(450);continue}
   let got,ok;const tol=st.tol==null?0.05:st.tol;
   if(st.expect==='signal'){const n=net(st);if(n<0){push({k:'bad',t:'walang signal na '+(st.tag||st.near)});fail++;continue}got=+rt.v[n].toFixed(3)}
   else if(st.expect==='mode')got=mode();
   else if(st.expect==='disabled'){const b=btn(st.button);got=b?(b.disabled?'disabled':'enabled'):'walang button'}
   else if(st.expect==='field'){const ins=[...fp.querySelectorAll('input')],f=st.name==='SV'?ins[0]:ins[ins.length-1];got=f.disabled?'disabled':'enabled'}
   else if(st.expect==='faceplate')got=/FORCE MANUAL/.test(fp.textContent)?'FORCE MANUAL':'wala';
   else if(st.expect==='sv-switch'){const q=ctl.svSw&&rt.st[ctl.svSw.id];got=!q?'?':(q.pk==='A'?'A (logic / REMOTE)':'B (operator / LOCAL)')}
   else if(st.expect==='sv')got=+rt.v[ctl.q.sv].toFixed(2);
   else if(st.expect==='near-pv'){const sv=rt.v[ctl.q.sv],pv=rt.v[ctl.q.pv],sp=(ctl.b.p.rhi-ctl.b.p.rlo)||100;got=Math.abs(sv-pv)<=sp*(st.pct||3)/100?'abot-SV':'malayo sa SV (SV '+sv.toFixed(1)+', PV '+pv.toFixed(1)+')'}
   else if(st.expect==='cmp'){const d=val(st.what)-mk[st.than];got=st.min?(d>=st.min?'tumaas':d<=-st.min?'bumaba':'kulang ang galaw')+' ('+d.toFixed(1)+')':(Math.abs(d)<=(st.tol==null?1:st.tol)?'pareho':(d>0?'tumaas':'bumaba')+' ('+d.toFixed(1)+')')}
   else{push({k:'bad',t:'hindi kilalang tseke '+st.expect});fail++;continue}
   ok=typeof st.value==='number'?Math.abs(got-st.value)<=tol:(st.expect==='cmp'&&st.min?String(got).startsWith(String(st.value)):String(got)===String(st.value));
   ok?pass++:fail++;push({k:ok?'ok':'bad',t:(st.say||st.expect),exp:st.value,got,why:st.why})}
  }finally{try{AN.reset()}catch(e){}AN.run=run0}
  return{lines:L,pass,fail}}
 return{run,expand}})();
