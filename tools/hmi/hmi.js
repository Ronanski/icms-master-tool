/* Operator faceplate (mini HMI): second tab of the right pane. UI only: it reads the simulator (AN) and writes the same operator values the existing pane writes
   (input values, forced signals, the position of the A/M switch); the simulation engine is not changed. */
(function(){
 const $=id=>document.getElementById(id);
 const E=(t,a,c)=>{const e=document.createElement(t);if(a)for(const k in a){if(k==='txt')e.textContent=a[k];else if(k==='cls')e.className=a[k];else if(k==='on')e.onclick=a[k];else e.setAttribute(k,a[k])}(c||[]).forEach(x=>e.append(x));return e};
 const fmt=x=>x==null||!isFinite(x)?'—':Math.abs(x)>=1000?x.toFixed(0):Math.abs(x)>=100?x.toFixed(1):Math.abs(x)>=10?x.toFixed(2):x.toFixed(3);
 const sheet=()=>AN.sheets&&AN.sheets[AN.i];
 let opp=null,body=null,built='',live=[],trends={},filter='',lastT=-1;
 const setIn=(S,n,v)=>{S.rt.ext[n]=v;try{AN.settle()}catch(e){}};
 function tagOf(S,id){for(const a of S.addr||[])if(a.ai===id&&a.t)return a.t;return ''}
 function describe(sh,t){try{const a=AN.adesFind&&AN.adesFind(sh,t);if(a&&a.rec){const r=a.rec;return r.k==='io'?[r.tag,r.d].filter(Boolean).join(' · '):[r.d,r.r].filter(Boolean).join(' · ')}}catch(e){}return ''}
 function ctrls(S){const out=[];for(const b of S.blk){if(b.k!=='PID'&&b.k!=='PIDV')continue;const tag=(b.txt||[])[1];if(!tag||/^X+-/.test(tag))continue;let q=null;try{q=AN.anPins(S,b)}catch(e){}if(!q||q.pv==null||q.pv<0)continue;
   const amt=S.blk.find(z=>(z.k==='AMT'||z.k==='SW')&&z.a!=null&&z.b!=null&&(b.o.includes(z.a)||b.o.includes(z.b))&&z.o[0]!=null);const autoLeg=amt?(b.o.includes(amt.a)?'A':'B'):null;const manNet=amt?(autoLeg==='A'?amt.b:amt.a):null;
   out.push({b,tag,q,amt,autoLeg,manNet,out:amt?amt.o[0]:b.o[0],desc:(b.face&&b.face.desc)||''})}return out}
 function trendOf(key){return trends[key]||(trends[key]={t:[],pv:[],sv:[],mv:[]})}
 function drawTrend(svg,tr,rlo,rhi){const W=360,H=96;let s='';const n=tr.t.length;if(n<2){svg.innerHTML='<text x="10" y="50" fill="#7d8e9a" font-size="12">Walang data pa: i-RUN ang simulation.</text>';return}
  const t0=tr.t[0],t1=tr.t[n-1],dt=Math.max(1,t1-t0);const all=tr.pv.concat(tr.sv).filter(isFinite);let lo=isFinite(rlo)?rlo:Math.min(...all),hi=isFinite(rhi)?rhi:Math.max(...all);if(hi-lo<1e-9){hi=lo+1}
  const X=t=>4+(t-t0)/dt*(W-8),Yp=v=>H-6-(v-lo)/(hi-lo)*(H-12),Ym=v=>H-6-Math.max(0,Math.min(100,v))/100*(H-12);
  for(let g=1;g<4;g++)s+=`<line x1="0" x2="${W}" y1="${g*H/4}" y2="${g*H/4}" stroke="#1e2c36"/>`;
  const pl=(arr,Y,c,w,d)=>`<polyline fill="none" stroke="${c}" stroke-width="${w}" ${d?'stroke-dasharray="4 3"':''} points="${tr.t.map((t,i)=>X(t).toFixed(1)+','+Y(arr[i]).toFixed(1)).join(' ')}"/>`;
  s+=pl(tr.mv,Ym,'#6fe3a0',1.4,true)+pl(tr.sv,Yp,'#5cc8ff',1.4,false)+pl(tr.pv,Yp,'#ffd84a',2,false);
  s+=`<text x="4" y="10" fill="#7d8e9a" font-size="9">${fmt(hi)}</text><text x="4" y="${H-2}" fill="#7d8e9a" font-size="9">${fmt(lo)}</text><text x="${W-4}" y="${H-2}" text-anchor="end" fill="#7d8e9a" font-size="9">${Math.round(dt)} s</text>`;svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.innerHTML=s}
 function build(){const sh=sheet();if(!sh||!sh.S)return;const S=sh.S;built=sh.name;live=[];body.innerHTML='';
  body.append(E('div',{cls:'hdr',txt:sh.name}),E('div',{cls:'sub',txt:(sh.title||'').replace(/\s+/g,' ')}));
  // 1. controllers
  const cs=ctrls(S);
  if(cs.length)body.append(E('h4',{txt:'Mga controller (faceplate)'}));
  cs.forEach(c=>{const P=c.b.p,rlo=P.rlo!=null?P.rlo:0,rhi=P.rhi!=null?P.rhi:100,unit=P.unit||'';const key=sh.name+'|'+c.b.id;
   const pv=E('b',{txt:'—'}),sv=E('b',{txt:'—'}),mv=E('b',{txt:'—'});const barPv=E('i'),barSvm=E('u'),barMv=E('i');
   const bAuto=E('button',{cls:'b',txt:'AUTO'}),bMan=E('button',{cls:'b man',txt:'MAN'});
   const svIn=E('input',{cls:'n',type:'number',step:'any'}),mvIn=E('input',{cls:'n',type:'number',step:'any'});
   const svOk=S.ext.includes(c.q.sv),mvOk=c.manNet!=null&&S.ext.includes(c.manNet);
   const svRow=E('div',{cls:'row'},[E('span',{txt:'SV'}),svIn,E('button',{cls:'b',txt:'−',on:()=>{const v=(+svIn.value||0)-(rhi-rlo)/100;svIn.value=v.toFixed(3);setIn(S,c.q.sv,v)}}),E('button',{cls:'b',txt:'+',on:()=>{const v=(+svIn.value||0)+(rhi-rlo)/100;svIn.value=v.toFixed(3);setIn(S,c.q.sv,v)}}),E('span',{cls:'sub',txt:unit})]);
   const mvRow=E('div',{cls:'row'},[E('span',{txt:'MV (MAN)'}),mvIn,E('button',{cls:'b',txt:'0',on:()=>{mvIn.value=0;setIn(S,c.manNet,0)}}),E('button',{cls:'b',txt:'50',on:()=>{mvIn.value=50;setIn(S,c.manNet,50)}}),E('button',{cls:'b',txt:'100',on:()=>{mvIn.value=100;setIn(S,c.manNet,100)}})]);
   if(svOk){svIn.onchange=()=>setIn(S,c.q.sv,+svIn.value)}else{svIn.disabled=true;svRow.append(E('span',{cls:'sub',txt:'(SV galing sa logic)'}))}
   if(mvOk){mvIn.onchange=()=>setIn(S,c.manNet,+mvIn.value)}else{mvIn.disabled=true;mvRow.append(E('span',{cls:'sub',txt:'(walang manual input)'}))}
   const setMode=m=>{if(!c.amt)return;const st=S.rt.st[c.amt.id];if(!st)return;const manLeg=c.autoLeg==='A'?'B':'A';st.fm=m==='A'?c.autoLeg:manLeg;try{AN.settle()}catch(e){}};
   bAuto.onclick=()=>setMode('A');bMan.onclick=()=>setMode('M');
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','tr');
   const card=E('div',{cls:'fp'},[E('div',{cls:'tg'},[E('b',{txt:c.tag}),E('span',{txt:(c.desc||'')+(unit?'  ['+fmt(rlo)+' ~ '+fmt(rhi)+' '+unit+']':'')})]),
    E('div',{cls:'dg'},[E('div',{cls:'pv'},[E('small',{txt:'PV'}),pv]),E('div',{cls:'sv'},[E('small',{txt:'SV'}),sv]),E('div',{cls:'mv'},[E('small',{txt:'MV %'}),mv])]),
    E('div',{cls:'bar'},[barPv,barSvm]),E('div',{cls:'bar'},[barMv]),
    E('div',{cls:'row'},[bAuto,bMan,E('span',{cls:'sub',txt:c.amt?'':'(walang A/M switch)'})]),svRow,mvRow,svg,
    E('div',{cls:'lg'},[E('span',{},[E('i',{style:'background:#ffd84a'}),document.createTextNode('PV')]),E('span',{},[E('i',{style:'background:#5cc8ff'}),document.createTextNode('SV')]),E('span',{},[E('i',{style:'background:#6fe3a0'}),document.createTextNode('MV')])])]);
   body.append(card);
   live.push(()=>{const v=S.rt.v,pvv=v[c.q.pv],svv=v[c.q.sv],mvv=v[c.out];pv.textContent=fmt(pvv);sv.textContent=fmt(svv);mv.textContent=fmt(mvv);
    const f=x=>Math.max(0,Math.min(100,(x-rlo)/(rhi-rlo)*100));barPv.style.cssText='width:'+f(pvv)+'%;background:#ffd84a';barSvm.style.left=f(svv)+'%';barMv.style.cssText='width:'+Math.max(0,Math.min(100,mvv))+'%;background:#6fe3a0';
    const pk=c.amt&&S.rt.st[c.amt.id]?S.rt.st[c.amt.id].pk:c.autoLeg;const isAuto=!c.amt||pk===c.autoLeg;bAuto.classList.toggle('on',isAuto);bMan.classList.toggle('on',!isAuto);
    if(document.activeElement!==svIn&&isFinite(svv))svIn.value=(+svv.toFixed(3));if(document.activeElement!==mvIn&&c.manNet!=null&&isFinite(v[c.manNet]))mvIn.value=(+v[c.manNet].toFixed(2));
    const tr=trendOf(key);if(S.rt.t!==tr.last){tr.last=S.rt.t;tr.t.push(S.rt.t);tr.pv.push(pvv);tr.sv.push(svv);tr.mv.push(mvv);if(tr.t.length>600){for(const k of ['t','pv','sv','mv'])tr[k].shift()}}drawTrend(svg,tr,rlo,rhi)})});
  // 2. manual stations
  const mans=S.blk.filter(b=>b.k==='MAN'&&b.o[0]!=null&&(b.txt||[])[0]);
  if(mans.length)body.append(E('h4',{txt:'Manual station'}));
  mans.forEach(b=>{const P=b.p,lo=P.lo!=null?P.lo:0,hi=P.hi!=null?P.hi:100,tag=(b.txt||[])[0];const val=E('b',{txt:'—'}),inp=E('input',{cls:'n',type:'number',step:'any'});
   const set=v=>{const st=S.rt.st[b.id];if(st){st.val=Math.max(lo,Math.min(hi,v))}try{AN.settle()}catch(e){}};
   inp.onchange=()=>set(+inp.value);
   body.append(E('div',{cls:'fp'},[E('div',{cls:'tg'},[E('b',{txt:tag}),E('span',{txt:fmt(lo)+' ~ '+fmt(hi)+(P.u?' '+P.u:'')})]),E('div',{cls:'row'},[E('span',{txt:'Value'}),inp,E('button',{cls:'b',txt:'−',on:()=>set((+inp.value||0)-(hi-lo)/100)}),E('button',{cls:'b',txt:'+',on:()=>set((+inp.value||0)+(hi-lo)/100)}),val])]));
   live.push(()=>{const v=S.rt.v[b.o[0]];val.textContent=fmt(v);if(document.activeElement!==inp&&isFinite(v))inp.value=+v.toFixed(3)})});
  // 3. digital inputs: operator buttons and force
  const dig=[];for(const n of S.ext){if(!S.nets[n].dig)continue;const l=S.lab[n]&&S.lab[n].t&&S.lab[n].t.trim();if(l&&!/^\(/.test(l)&&!dig.some(x=>x[1]===l))dig.push([n,l])}
  const sig=S.blk.filter(b=>b.k==='SIGAB'&&b.o[0]!=null&&(b.txt||[])[1]);
  body.append(E('h4',{txt:'Mga button (digital input): ON / OFF at FORCE'}));
  const fin=E('input',{cls:'f',placeholder:'hanapin ang tag o description…'});body.append(fin);const dlist=E('div');body.append(dlist);
  const rows=[];
  dig.forEach(([n,l])=>{const desc=describe(sh,l);const state=E('button',{cls:'b',txt:'OFF'}),fb=E('button',{cls:'b',txt:'FORCE',title:'I-force ang value kahit ano ang logic'});
   const linked=()=>!!(S.xlk&&S.xlk[n]);state.onclick=()=>{const cur=S.rt.force[n]!==undefined?S.rt.force[n]:(linked()?S.rt.v[n]:(S.rt.ext[n]||0));const nv=cur>.5?0:1;if(S.rt.force[n]!==undefined||linked())S.rt.force[n]=nv;else S.rt.ext[n]=nv;try{AN.settle()}catch(e){}};
   fb.onclick=()=>{if(S.rt.force[n]!==undefined)delete S.rt.force[n];else S.rt.force[n]=S.rt.v[n]>.5?1:0;try{AN.settle()}catch(e){}};
   const tr=E('tr',{},[E('td',{},[E('b',{txt:l}),E('small',{txt:desc+((S.xlk&&S.xlk[n])?'  (galing sa ibang sheet: ON/OFF = force)':'')})]),E('td',{cls:'v'},[state,document.createTextNode(' '),fb])]);tr._h=(l+' '+desc).toLowerCase();rows.push(tr);
   live.push(()=>{const f=S.rt.force[n]!==undefined,on=(f?S.rt.force[n]:S.rt.v[n])>.5;state.textContent=on?'ON':'OFF';state.classList.toggle('on',on);fb.classList.toggle('fon',f)})});
  sig.forEach(b=>{const tg=(b.txt||[])[1];const st=E('button',{cls:'b',txt:'OK'});st.onclick=()=>{const q=S.rt.st[b.id];if(q){q.val=q.val>.5?0:1;try{AN.settle()}catch(e){}}};
   const tr=E('tr',{},[E('td',{},[E('b',{txt:'SIG.AB '+tg}),E('small',{txt:'Bad signal (simulation lang)'})]),E('td',{cls:'v'},[st])]);tr._h=('sig.ab '+tg+' bad signal').toLowerCase();rows.push(tr);
   live.push(()=>{const q=S.rt.st[b.id];const bad=q&&q.val>.5;st.textContent=bad?'BAD':'OK';st.classList.toggle('fon',!!bad)})});
  const tb=E('table',{cls:'tbl'});rows.forEach(r=>tb.append(r));dlist.append(tb);if(!rows.length)dlist.append(E('div',{cls:'sub',txt:'Walang digital input ang sheet na ito.'}));
  fin.oninput=()=>{const q=fin.value.trim().toLowerCase();rows.forEach(r=>r.style.display=!q||r._h.indexOf(q)>=0?'':'none')};
  // 4. monitoring: analog inputs to outputs
  const ais=S.blk.filter(b=>b.k==='AI'&&b.o[0]!=null);
  if(ais.length)body.append(E('h4',{txt:'Monitoring: mga input (transmitter)'}));
  if(ais.length){const t=E('table',{cls:'tbl'});ais.forEach(b=>{const tag=tagOf(S,b.id)||('AI#'+b.id);const unit=(b.rng&&b.rng.u)||'';const inp=E('input',{cls:'n',type:'number',step:'any'});const lab=E('small',{txt:describe(sh,tag)});
    inp.onchange=()=>{const st=S.rt.st[b.id];if(st){st.val=+inp.value}try{AN.settle()}catch(e){}};
    t.append(E('tr',{},[E('td',{},[E('b',{txt:tag}),lab]),E('td',{cls:'v'},[inp,document.createTextNode(' '+unit)])]));
    live.push(()=>{const v=S.rt.v[b.o[0]];if(document.activeElement!==inp&&isFinite(v))inp.value=+v.toFixed(3)})});body.append(t)}
  const aos=[];for(const b of S.blk.filter(q=>q.k==='AO'&&q.i[0]!=null)){let best=null,bd=1e9;for(const t of S.tx){if(!/^AO\d{3,4}/.test(t.t.trim()))continue;const d=Math.hypot(b.cx-t.x,b.cy-t.y);if(d<bd){bd=d;best=t.t.trim().split(/\s+/)[0]}}aos.push([b,best&&bd<80?best:('AO#'+b.id)])}
  if(aos.length){body.append(E('h4',{txt:'Monitoring: mga output (AO)'}));const t=E('table',{cls:'tbl'});aos.forEach(([b,tag])=>{const v=E('td',{cls:'v',txt:'—'});t.append(E('tr',{},[E('td',{},[E('b',{txt:tag}),E('small',{txt:describe(sh,tag)})]),v]));live.push(()=>{v.textContent=fmt(S.rt.v[b.i[0]])+' %'})});body.append(t)}
  // 5. flags (named digital nets that the logic drives)
  const flags=[];for(const k in S.lab){const l=S.lab[k]&&S.lab[k].t&&S.lab[k].t.trim();const n=+k;if(!l||!S.nets[n]||!S.nets[n].dig||S.ext.includes(n))continue;if(/^(M|B)\.[0-9A-F]{3,4}$/i.test(l)&&!flags.some(f=>f[1]===l))flags.push([n,l])}
  if(flags.length){body.append(E('h4',{txt:'Mga flag ng logic (lamp: pula = 1)'}));const t=E('table',{cls:'tbl'});flags.slice(0,60).forEach(([n,l])=>{const lamp=E('span',{cls:'lamp'});t.append(E('tr',{},[E('td',{},[lamp,E('b',{txt:l}),E('small',{txt:describe(sh,l)})])]));live.push(()=>lamp.classList.toggle('on',S.rt.v[n]>.5))});body.append(t)}
 }
 function tick(){try{
  if(!opp)return;const pb=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Panel');const on=!!(pb&&pb.classList.contains('on'));const op=document.body.classList.contains('ophmi');
  opp.style.display=(on&&op)?'flex':'none';if(!(on&&op))return;
  const sh=sheet();if(!sh||!sh.S)return;if(built!==sh.name)build();for(const f of live)f()}catch(e){}}
 function tabs(active){const w=E('div',{cls:'hmitabs'},[E('button',{cls:active==='d'?'on':'',txt:'Detalye',on:()=>mode(false)}),E('button',{cls:active==='o'?'on':'',txt:'Operator',on:()=>mode(true)})]);w.dataset.hmi='1';return w}
 function mode(op){document.body.classList.toggle('ophmi',op);try{localStorage.setItem('ls.rightpane',op?'o':'d')}catch(e){}if(op){built=''}tick()}
 function init(){const mid=$('mid'),anp=$('anp');if(!mid||!anp||opp)return false;
  opp=E('div',{id:'opp'});body=E('div',{cls:'body'});opp.append(tabs('o'),body);anp.after(opp);
  const ins=()=>{if(!anp.querySelector('.hmitabs'))anp.prepend(tabs('d'))};ins();new MutationObserver(ins).observe(anp,{childList:true});
  try{if(localStorage.getItem('ls.rightpane')==='o')document.body.classList.add('ophmi')}catch(e){}
  setInterval(tick,250);return true}
 let n=0;const iv=setInterval(()=>{try{if(init()||++n>60)clearInterval(iv)}catch(e){clearInterval(iv)}},300);
})();
