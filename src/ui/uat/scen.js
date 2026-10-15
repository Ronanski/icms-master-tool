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
  const net=o=>o.net!==undefined?o.net:o.near?nearOf(o.near):netOf(o.tag);
  const ctl=AN.hmiCtrls(S).find(c=>c.tag===loop),fp=[...document.querySelectorAll('#opp .fp')].find(x=>x.querySelector('.tg b')&&x.querySelector('.tg b').textContent===loop);
  return{sh,S,rt,net,ctl,fp,stn:ctl&&ctl.amt?rt.st[ctl.amt.id]:null}}
 const stepSim=async(sh,secs)=>{const n=Math.round(secs*2);for(let i=0;i<n;i++){AN.stepSet(sh,.5);if(i%150===149)await sleep(0)}};
 /* run one scenario: returns {lines:[{k:'do'|'ok'|'bad',t,exp,got}],pass,fail} */
 async function run(sheet,sc0,onLine){const sc=expand(sc0),L=[],run0=AN.run,mk={};let pass=0,fail=0;
  const push=l=>{L.push(l);if(onLine)onLine(l)};
  const idx=AN.sheets.findIndex(x=>x.name===sheet);AN.go(idx);AN.reset();AN.go(idx);
  [...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Operator').forEach(b=>b.click());AN.run=false;await sleep(1200);
  try{for(const st of sc.steps){const c=ctx(sheet,sc.loop),{sh,S,rt,net,ctl,fp,stn}=c;const AL={AUTO:'A',MAN:'M',REMOTE:'R',LOCAL:'A'},btn=t=>fp&&[...fp.querySelectorAll('button')].find(e=>e.textContent.trim()===(AL[t]||t));const mode=()=>!stn?'?':(stn.pk===ctl.autoLeg?'AUTO':'MANUAL');
   const val=w=>w==='mv'?rt.v[ctl.out]:w==='sv'?rt.v[ctl.q.sv]:rt.v[ctl.q.pv];
   if(st.do){let note='';
    if(st.do==='set'&&st.sheet){const o=AN.sheets.find(x=>x.name===st.sheet);AN.ensure(o);const S2=o.S;let n2=-1;for(let n=0;n<S2.nets.length;n++)if(labTxt(S2,n)===st.tag)n2=n;if(n2<0){push({k:'bad',t:'walang '+st.tag+' sa '+st.sheet});fail++;continue}S2.rt.force[n2]=st.value;try{AN.settle()}catch(e){}}
    else if(st.do==='set'){const n=net(st);if(n<0){push({k:'bad',t:'walang input na '+(st.tag||st.near)});fail++;continue}if(S.xlk&&S.xlk[n]||!S.ext.includes(n))rt.force[n]=st.value;else rt.ext[n]=st.value;try{AN.settle()}catch(e){}}
    else if(st.do==='wait')await stepSim(sh,st.s);
    else if(st.do==='reset'){AN.reset();AN.go(idx);}
    else if(st.do==='press'){const b=btn(st.button);if(!b){push({k:'bad',t:'walang button '+st.button});fail++;continue}if(b.disabled)note=' (disabled, hindi napindot)';else{b.click();await stepSim(sh,.5)}}
    else if(st.do==='mv'||st.do==='sv'){const ins=[...fp.querySelectorAll('input')],f=st.do==='sv'?ins[0]:ins[ins.length-1];if(f.disabled)note=' (disabled ang field)';else{f.value=st.value;f.dispatchEvent(new Event('change'));await stepSim(sh,.5)}}
    else if(st.do==='popopen'){const ins=[...fp.querySelectorAll('input')],f=st.name==='SV'?ins[0]:ins[ins.length-1];f.closest('.fpb').click()}
    else if(st.do==='popbtn'){const pp=fp.querySelector('.fpop'),b=pp&&[...pp.querySelectorAll('button')].find(e=>e.textContent.trim()===st.button);if(!b){push({k:'bad',t:'walang button '+st.button+' sa popup'});fail++;continue}b.click();await stepSim(sh,.5)}
    else if(st.do==='popclose'){const pp=fp.querySelector('.fpop'),b=pp&&[...pp.querySelectorAll('button')].find(e=>e.textContent.trim()==='✕');if(b)b.click()}
    else if(st.do==='dump'){const a=ctl.amt,q=rt.st[a.id];push({k:'do',t:'DUMP mv='+rt.v[ctl.out].toFixed(2)+' pv='+rt.v[ctl.q.pv].toFixed(1)+' sv='+rt.v[ctl.q.sv].toFixed(1)+' pk='+q.pk+' fman='+q.fman+' fm='+q.fm+' COSext='+(+rt.ext[a.b]).toFixed(2)+' forced='+(rt.force[a.b]!==undefined)+' A='+(+rt.v[a.a]).toFixed(2)})}
    else if(st.do==='watch'){let seen=0;const n=Math.round(st.s*2);for(let i=0;i<n;i++){AN.stepSet(sh,.5);for(const z of ctl.sigs)if(z.role==='AUTO'&&rt.v[z.n]>.5)seen=z.name;if(i%150===149)await sleep(0)}mk.__autoSeen=seen}
    else if(st.do==='mark')mk[st.as]=val(st.what);
    if(st.say&&st.do!=='wait'&&st.do!=='mark')push({k:'do',t:st.say+note});
    await sleep(450);continue}
   let got,ok;const tol=st.tol==null?0.05:st.tol;
   if(st.expect==='signal'){const n=net(st);if(n<0){push({k:'bad',t:'walang signal na '+(st.tag||st.near)});fail++;continue}got=+rt.v[n].toFixed(3)}
   else if(st.expect==='pop'){const pp=fp.querySelector('.fpop');got=pp&&pp.style.display==='block'?'bukas':'hindi bumukas'}
   else if(st.expect==='mv')got=+rt.v[ctl.out].toFixed(2);
   else if(st.expect==='cut'){const g=(ctl.dn||[]).find(d=>{const t=rt.st[d.id];return t&&t.pk==='B'});got=g?'putol':'malaya'}
   else if(st.expect==='mode-after-clear'){const sn=mk.__autoSeen;got=mode()+(sn?' (may AUTO signal ng drawing: '+sn+')':'')}
   else if(st.expect==='bumpless'){const cut=(ctl.dn||[]).find(d=>{const t=rt.st[d.id];return t&&t.pk==='B'}),d=rt.v[ctl.out]-mk[st.than];got=cut?'putol ng interlock ng drawing':(Math.abs(d)<=(st.tol==null?0.3:st.tol)?'pareho':(d>0?'tumaas':'bumaba')+' ('+d.toFixed(1)+')')}
   else if(st.expect==='mode')got=mode();
   else if(st.expect==='disabled'){const b=btn(st.button);got=b?(b.disabled?'disabled':'enabled'):'walang button'}
   else if(st.expect==='field'){const ins=[...fp.querySelectorAll('input')],f=st.name==='SV'?ins[0]:ins[ins.length-1];got=f.disabled?'disabled':'enabled'}
   else if(st.expect==='faceplate')got=/FORCE MANUAL/.test(fp.textContent)?'FORCE MANUAL':'wala';
   else if(st.expect==='sv-switch'){const q=ctl.svSw&&rt.st[ctl.svSw.id];got=!q?'?':(q.pk==='A'?'A (logic / REMOTE)':'B (operator / LOCAL)')}
   else if(st.expect==='sv')got=+rt.v[ctl.q.sv].toFixed(2);
   else if(st.expect==='near-pv'){const sv=rt.v[ctl.q.sv],pv=rt.v[ctl.q.pv],sp=(ctl.b.p.rhi-ctl.b.p.rlo)||100;got=Math.abs(sv-pv)<=sp*(st.pct||3)/100?'abot-SV':'malayo sa SV (SV '+sv.toFixed(1)+', PV '+pv.toFixed(1)+')'}
   else if(st.expect==='cmp'){const d=val(st.what)-mk[st.than];got=st.min?(d>=st.min?'tumaas':d<=-st.min?'bumaba':'kulang ang galaw')+' ('+d.toFixed(1)+')':(Math.abs(d)<=(st.tol==null?1:st.tol)?'pareho':(d>0?'tumaas':'bumaba')+' ('+d.toFixed(1)+')')}
   else{push({k:'bad',t:'hindi kilalang tseke '+st.expect});fail++;continue}
   if(st.expect==='bumpless')ok=got==='pareho'||/^putol/.test(got);else if(st.expect==='mode-after-clear')ok=String(got).startsWith(mk.__autoSeen?'AUTO':'MANUAL');else ok=typeof st.value==='number'?Math.abs(got-st.value)<=tol:(st.expect==='cmp'&&st.min?String(got).startsWith(String(st.value)):String(got)===String(st.value));
   ok?pass++:fail++;push({k:ok?'ok':'bad',t:(st.say||st.expect),exp:st.value,got,why:st.why})}
  }finally{try{AN.reset()}catch(e){}AN.run=run0}
  return{lines:L,pass,fail}}

 /* GENERIC: ang karaniwang scenario ng operator + proseso para sa BAWAT controller, kusang ginagawa mula sa drawing (walang isinusulat na isa-isa).
    Ang panimulang estado (walang force, walang putol na output) at ang input na nagpapa-force-manual ay hinahanap ng pagsubok sa engine; ang INAASAHAN ay ang mga patakaran ng operator (user): M = ang operator ang MV; A = SV ng operator; sa AUTO ang SV ang ginagalaw; bumpless; REMOTE = AUTO talaga;
    force manual = MANUAL agad, walang talon ng MV, hindi automatic na bumabalik sa AUTO. */
 async function generic(sheet,tag,onNote){const sh=AN.sheets.find(x=>x.name===sheet),idx=AN.sheets.indexOf(sh);AN.go(idx);AN.reset();AN.go(idx);const S=sh.S,run0=AN.run;AN.run=false;
  try{const c0=AN.hmiCtrls(S).find(c=>c.tag===tag);if(!c0||!c0.amt||c0.manNet==null)return null;
   const dg=S.ext.filter(n=>S.nets[n].dig),P=c0.b.p,rlo=P.rlo!=null?P.rlo:0,rhi=P.rhi!=null?P.rhi:100,span=rhi-rlo;
   let seed=777;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff};
   const bases=[[],dg.map(n=>[n,1]),dg.map((n,k)=>[n,k%2]),dg.map((n,k)=>[n,(k+1)%2])];for(let j=0;j<10;j++)bases.push(dg.map(n=>[n,rnd()<.3?1:0]));
   /* mga analog na input mula sa ibang sheet / field (flow, pressure ...) ay nasa GITNA ng range ("boiler in service"), hindi 0: ang 0 ay nagti-trip ng mga low-flow interlock; hindi kasama ang PV, SV at MV ng mismong controller */
   const an=S.ext.filter(n=>!S.nets[n].dig&&n!==c0.q.pv&&n!==c0.q.sv&&n!==c0.manNet&&!(S.lab[n]&&S.lab[n].t==='COS manual value')).map(n=>{const r=AN.extRange&&AN.extRange(S,n);return[n,r&&r.hi>r.lo?(r.lo+r.hi)/2:50]});
   const setup=async(sets)=>{AN.reset();AN.go(idx);sets=an.concat(sets);for(const [n,v] of sets){if(S.xlk&&S.xlk[n]||!S.ext.includes(n))S.rt.force[n]=v;else S.rt.ext[n]=v}try{AN.settle()}catch(e){}await stepSim(sh,8);const c=AN.hmiCtrls(S).find(c=>c.tag===tag),st=S.rt.st[c.amt.id];return{st,c}};
   /* score = force + putol (1000 bawat isa) + dami ng aktibong net sa itaas ng pumipiling signal: may "slope" ang paghahanap kahit OR ng maraming NOT (hal. lahat ng running feedback ay kailangang 1) */
   const msig=c0.sigs.filter(z=>z.role==='MAN').map(z=>z.n),up=new Set();{const q=msig.slice();while(q.length&&up.size<500){const n=q.pop();if(up.has(n))continue;up.add(n);if(S.ext.includes(n))continue;for(const g of S.drv[n]||[])for(const i of g.i||[])if(i>=0)q.push(i)}}
   const score=async(b)=>{const {st,c}=await setup(b);const cut=(c.dn||[]).some(d=>{const t=S.rt.st[d.id];return t&&t.pk==='B'});let cnt=0;for(const n of up)if(!S.ext.includes(n)&&S.rt.v[n]>.5)cnt++;return (st.fman?1000:0)+(cut?1000:0)+cnt};
   let base=null,best=null,bs0=1e9;for(const b of bases){const sc0=await score(b);if(sc0<bs0){bs0=sc0;best=b}}
   if(bs0>=1000&&best){let cur=best.map(x=>x.slice()),cs=bs0;for(let it=0;it<14&&cs>=1000;it++){let imp=false;for(const n of dg){const nb=cur.filter(x=>x[0]!==n).concat([[n,((cur.find(x=>x[0]===n)||[n,0])[1])?0:1]]);const sc1=await score(nb);if(sc1<cs){cur=nb;cs=sc1;imp=true;if(cs<1000)break}}if(!imp)break}if(cs<1000)base=cur}else if(best)base=best;
   if(!base)return{loop:tag,note:'walang malinis na estado (laging may force manual o putol na output sa 14 na panimulang kondisyon)'};
   let trig=null;for(const n of dg){const cur=(base.find(x=>x[0]===n)||[n,0])[1];const {st}=await setup(base.filter(x=>x[0]!==n).concat([[n,cur?0:1]]));if(st.fman){trig=[n,cur?0:1];break}}
   const bs=an.concat(base).map(([n,v])=>({do:'set',net:n,value:v})),hasR=!!c0.remote;
   const pr=(S.procs||[]).find(b=>b.id===c0.b.id),T=pr&&pr.proc&&pr.proc.T?pr.proc.T:150,wp=Math.max(120,Math.min(1500,Math.round(T*6)));
   const sc=[];const pre=bs.concat([{do:'wait',s:10}]).concat(hasR?[{do:'press',button:'A',say:'A (lumabas muna sa REMOTE kung nasa REMOTE)'}]:[]);
   sc.push({id:'G1',loop:tag,title:tag+': MANUAL — MV field at mga button (0 / 50 / 100); proseso',drawing:'A/M switch B = manual MV ng operator; ang MV ay lumalabas sa output ng A/M switch.',steps:pre.concat([
     {do:'press',button:'M',say:'pindutin ang M'},{expect:'mode',value:'MANUAL',say:'mode'},{expect:'field',name:'MV',value:'enabled',say:'MV field sa MANUAL'},
     {do:'mv',value:75,say:'i-type ang MV = 75'},{do:'wait',s:2},{expect:'mv',value:75,tol:0.6,say:'MV'},
     {do:'press',button:'0',say:'pindutin ang 0'},{do:'wait',s:2},{expect:'mv',value:0,tol:0.6,say:'MV matapos ang 0'},
     {do:'press',button:'50',say:'pindutin ang 50'},{do:'wait',s:2},{expect:'mv',value:50,tol:0.6,say:'MV matapos ang 50'},
     {do:'press',button:'100',say:'pindutin ang 100'},{do:'wait',s:2},{expect:'mv',value:100,tol:0.6,say:'MV matapos ang 100'},{do:'popopen',name:'MV',say:'i-click ang kahon ng MV'},{expect:'pop',name:'MV',value:'bukas',say:'lumabas ang control ng MV (MANUAL)'},{do:'popbtn',button:'▼▼',say:'pindutin ang ▼▼ (-10)'},{do:'wait',s:2},{expect:'mv',value:90,tol:0.6,say:'MV pagkatapos ng ▼▼'},{do:'popbtn',button:'▲',say:'pindutin ang ▲ (+1)'},{do:'wait',s:2},{expect:'mv',value:91,tol:0.6,say:'MV pagkatapos ng ▲'},{do:'popbtn',button:'50',say:'pindutin ang 50 sa popup'},{do:'wait',s:2},{expect:'mv',value:50,tol:0.6,say:'MV pagkatapos ng 50'},{do:'popclose'}])});
   if(pr&&pr.proc&&pr.proc.on)sc.push({id:'G2',loop:tag,title:tag+': ang PV ay sumasagot sa MV (proseso)',drawing:'Ang proseso ay first-order na may dead time; ang PV ay lumilipat ayon sa MV.',steps:pre.concat([
     {do:'press',button:'M',say:'M'},{do:'mv',value:0,say:'MV = 0'},{do:'wait',s:wp},{do:'mark',what:'pv',as:'p0'},{do:'mv',value:100,say:'MV = 100'},{do:'wait',s:wp},
     {expect:'cmp',what:'pv',than:'p0',value:Math.abs(pr.proc.sg)===1&&pr.proc.sg<0?'bumaba':'tumaas',min:span*0.08,say:'PV pagkatapos ng '+wp+' s sa MV = 100 kumpara sa MV = 0',why:'ang direksyon ay ayon sa action ng controller / proseso'}])});
   sc.push({id:'G3',loop:tag,title:tag+': SV ng operator (LOCAL) — SV field, + at −',drawing:'SV switch B = SV ng operator (o ang SV pin ng controller kung walang switch).',steps:pre.concat([
     {do:'press',button:'M',say:'M'},{expect:'field',name:'SV',value:'disabled',say:'SV field sa MANUAL',why:'SV ay para sa AUTO lang'},{do:'popopen',name:'SV',say:'i-click ang kahon ng SV sa MANUAL'},{expect:'pop',name:'SV',value:'hindi bumukas',say:'control ng SV sa MANUAL'},{do:'press',button:'A',say:'A'},
     {do:'sv',value:+(rlo+span*0.4).toFixed(3),say:'i-type ang SV = 40 % ng range'},{do:'wait',s:1},{expect:'sv',value:+(rlo+span*0.4).toFixed(3),tol:span*0.002,say:'SV'},
     {do:'press',button:'+',say:'pindutin ang +'},{do:'wait',s:1},{expect:'sv',value:+(rlo+span*0.41).toFixed(3),tol:span*0.002,say:'SV pagkatapos ng +'},{do:'popopen',name:'SV',say:'i-click ang kahon ng SV'},{expect:'pop',name:'SV',value:'bukas',say:'lumabas ang control ng SV'},{do:'popbtn',button:'▲▲',say:'pindutin ang ▲▲ (+10 %)'},{do:'wait',s:1},{expect:'sv',value:+(rlo+span*0.51).toFixed(3),tol:span*0.002,say:'SV pagkatapos ng ▲▲'},{do:'popbtn',button:'▼',say:'pindutin ang ▼ (-1 %)'},{do:'wait',s:1},{expect:'sv',value:+(rlo+span*0.50).toFixed(3),tol:span*0.002,say:'SV pagkatapos ng ▼'},{do:'popbtn',button:'▼▼',say:'pindutin ang ▼▼ (-10 %)'},{do:'wait',s:1},{expect:'sv',value:+(rlo+span*0.40).toFixed(3),tol:span*0.002,say:'SV pagkatapos ng ▼▼'},{do:'popclose'},
     {do:'press',button:'−',say:'pindutin ang −'},{do:'wait',s:1},{expect:'sv',value:+(rlo+span*0.39).toFixed(3),tol:span*0.002,say:'SV pagkatapos ng − (40 % → 39 %)'}])});
   sc.push({id:'G4',loop:tag,title:tag+': AUTO — MV field naka-disable; AUTO -> MAN na walang talon ng MV (bumpless)',drawing:'Sa AUTO, ang SV ang ginagalaw ng operator, hindi ang MV. Ang PID at ang COS ay sumusunod sa output kaya walang talon.',steps:pre.concat([
     {do:'press',button:'M',say:'M'},{do:'mv',value:50,say:'MV = 50'},{do:'wait',s:30},{do:'press',button:'A',say:'pindutin ang A'},{do:'sv',value:+(rlo+span*0.5).toFixed(3),say:'SV = 50 % ng range'},{expect:'mode',value:'AUTO',say:'mode'},
     {expect:'field',name:'MV',value:'disabled',say:'MV field sa AUTO'},{do:'popopen',name:'MV',say:'i-click ang kahon ng MV sa AUTO'},{expect:'pop',name:'MV',value:'hindi bumukas',say:'control ng MV sa AUTO',why:'MV ay para sa MANUAL lang'},{do:'wait',s:wp},{do:'mark',what:'mv',as:'mA'},{do:'press',button:'M',say:'pindutin ang M'},{do:'wait',s:1},{expect:'mode',value:'MANUAL',say:'mode'},{expect:'cmp',what:'mv',than:'mA',value:'pareho',tol:0.3,say:'MV pagkatapos ng M kumpara sa MV bago ito (bumpless, eksakto)'}])});
   if(hasR)sc.push({id:'G5',loop:tag,title:tag+': REMOTE — AUTO talaga, hindi mamamanual, pati SV; A ay bumabalik sa operator',drawing:'REMOTE: ang SV switch ay A (SV galing sa logic). Ang operator ay hindi makapag-M, SV o MV.',steps:pre.concat([
     {do:'press',button:'R',say:'pindutin ang R'},{do:'wait',s:3},{do:'mark',what:'sv',as:'svR'},{expect:'sv-switch',value:'A (logic / REMOTE)',say:'SV switch'},{expect:'mode',value:'AUTO',say:'mode'},{expect:'disabled',button:'M',value:'disabled',say:'M button'},{expect:'field',name:'SV',value:'disabled',say:'SV field'},{expect:'field',name:'MV',value:'disabled',say:'MV field'},{do:'popopen',name:'SV',say:'i-click ang kahon ng SV sa REMOTE'},{expect:'pop',name:'SV',value:'hindi bumukas',say:'control ng SV sa REMOTE',why:'REMOTE: hindi mababago ng operator ang SV'},
     {do:'press',button:'A',say:'pindutin ang A'},{do:'wait',s:1},{expect:'cmp',what:'sv',than:'svR',value:'pareho',tol:span*0.002,say:'SV pagkatapos ng A kumpara sa SV sa REMOTE (bumpless)'},{expect:'sv-switch',value:'B (operator / LOCAL)',say:'SV switch pagkatapos ng A'},{expect:'disabled',button:'M',value:'enabled',say:'M button'},{expect:'field',name:'SV',value:'enabled',say:'SV field'}])});
   if(trig)sc.push({id:'G6',loop:tag,title:tag+': trip (force manual) habang AUTO — MANUAL agad na walang talon ng MV; pagkawala ng signal ay HINDI automatic na AUTO',drawing:'Ang signal na pumipili ng B leg ng A/M switch (force manual) ay may prayoridad. Ang operator ang pipili ng AUTO pagkatapos.',steps:pre.concat([
     {do:'press',button:'M',say:'M'},{do:'mv',value:50,say:'MV = 50'},{do:'wait',s:30},{do:'press',button:'A',say:'A'},{do:'sv',value:+(rlo+span*0.5).toFixed(3),say:'SV'},{do:'wait',s:Math.min(wp,300)},{expect:'mode',value:'AUTO',say:'mode bago ang trip'},{do:'mark',what:'mv',as:'mT'},
     {do:'set',net:trig[0],value:trig[1],say:'itakda ang input na nagpapa-force: '+(labTxt(S,trig[0])||'n'+trig[0])+' = '+trig[1]},{do:'wait',s:1},
     {expect:'mode',value:'MANUAL',say:'mode pagkatapos ng trip'},{expect:'bumpless',than:'mT',value:'pareho',tol:0.3,say:'MV pagkatapos ng trip kumpara sa dati (bumpless, eksakto; maliban kung may interlock na pumuputol sa output sa drawing)'},{expect:'disabled',button:'A',value:'disabled',say:'A button'},
     {do:'set',net:trig[0],value:trig[1]?0:1,say:'alisin ang trip'},{do:'watch',s:15},{expect:'mode-after-clear',value:'MANUAL',say:'mode pagkatapos mawala ang trip',why:'hindi automatic, maliban kung ang drawing mismo ay may 1:A (AUTO) signal'},{expect:'disabled',button:'A',value:'enabled',say:'A button'},
     {do:'press',button:'A',say:'pindutin ang A'},{expect:'mode',value:'AUTO',say:'mode pagkatapos pindutin ang A'}])});
   return{loop:tag,scenarios:sc,base:base.length,trig:trig?labTxt(S,trig[0])||('n'+trig[0]):null}
  }finally{try{AN.reset()}catch(e){}AN.run=run0}}
 return{run,expand,generic}})();
