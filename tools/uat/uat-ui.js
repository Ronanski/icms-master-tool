/* In-app UAT (injected into the html by tools/uat/inject.js). The panel does the setup (reset, force, switch, set point), runs the
   simulation, shows the expected value next to the live value, says TUGMA / HINDI TUGMA by itself, and the user only presses OK or MALI. */
(function(){
const DATA=JSON.parse(document.getElementById('uatdata').textContent),VER=DATA.ver,SC=DATA.sheets,KEY='uat-in-app-'+VER;
let R={};try{R=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(R))}catch(e){}};
const E=(t,a,c)=>{const e=document.createElement(t);if(a)for(const k in a){if(k==='txt')e.textContent=a[k];else if(k==='cls')e.className=a[k];else if(k==='on')e.onclick=a[k];else e.setAttribute(k,a[k])}(c||[]).forEach(x=>e.append(x));return e};
const css=E('style',{txt:`#uatb{position:fixed;left:8px;bottom:36px;z-index:50;background:#1d3a2b;color:#bfe3cc;border:1px solid #6fbf8f;padding:8px 14px;border-radius:8px;font:600 14px system-ui;cursor:pointer}
#uatp{position:fixed;left:0;top:0;bottom:0;width:min(400px,100vw);z-index:60;background:#10151a;color:#dbe5ec;border-right:1px solid #2a3743;overflow:auto;font:14px/1.4 system-ui;padding:10px 12px 40px;display:none}
#uatp h3{margin:0 0 4px;font-size:16px;color:#6aaee0}#uatp .sub{color:#8a9aa6;font-size:12px;margin-bottom:8px}
#uatp .sc{background:#18212a;border:1px solid #2a3743;border-radius:8px;padding:8px 10px;margin:10px 0}#uatp .sc.act{border-color:#6aaee0}
#uatp button{background:#18212a;color:#dbe5ec;border:1px solid #2a3743;padding:8px 12px;border-radius:6px;font:inherit;cursor:pointer}
#uatp button.go{background:#16324a;border-color:#6aaee0}#uatp button.ok.on{background:#1d3a2b;border-color:#6fbf8f;color:#6fbf8f}#uatp button.bad.on{background:#3d2220;border-color:#d9786f;color:#d9786f}
#uatp table{width:100%;border-collapse:collapse;margin:6px 0;font-size:13px}#uatp td{padding:3px 4px;border-top:1px solid #2a3743}#uatp td.v{text-align:right;font-variant-numeric:tabular-nums}
#uatp .y{color:#6fbf8f}#uatp .n{color:#d9786f}#uatp .w{color:#d8b860}#uatp .row{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;align-items:center}
#uatp input{flex:1;min-width:120px;background:#0d1217;color:#dbe5ec;border:1px solid #2a3743;padding:7px;border-radius:6px;font:inherit}#uatp .big{font-weight:700;font-size:15px}#uatp pre{white-space:pre-wrap;background:#0d1217;padding:8px;border-radius:6px}`});
document.head.append(css);
const btn=E('button',{id:'uatb',txt:'UAT',on:()=>{P.style.display=P.style.display==='block'?'none':'block';draw()}});
const P=E('div',{id:'uatp'});document.body.append(btn,P);
const sheet=()=>AN.sheets[AN.i];const fmt=x=>x==null||!isFinite(x)?'—':Math.abs(x)>=100?x.toFixed(0):Math.abs(x)>=10?x.toFixed(1):x.toFixed(2);
let act=null,lastSheet=null;
function find(n){const sh=sheet(),S=sh.S,net=S.nets[n];if(!net)return;
 const anp=document.getElementById('anp');if(!anp||anp.getBoundingClientRect().width<5){const pb=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Panel');if(pb)pb.click()}
 AN.sel={net:n};try{AN.selBox()}catch(e){}try{AN.paint()}catch(e){}
 const g=S.seg[net.segs[0]];if(!g)return;const gx=(g.x1+g.x2)/2,gy=(g.y1+g.y2)/2;
 const svg=document.getElementById('svg'),r=svg.getBoundingClientRect(),v=AN.av&&AN.av[sh.name];if(!v)return;const upx=v[2]/r.width;
 const visL=P.style.display==='block'?Math.max(0,P.getBoundingClientRect().right-r.left):0,ap=document.getElementById('anp'),visR=r.width-(ap?Math.max(0,r.right-ap.getBoundingClientRect().left):0);
 const cx=(visL+Math.max(visL+50,visR))/2;v[0]=gx-cx*upx;v[1]=-gy-(r.height/2)*upx;svg.setAttribute('viewBox',v.join(' '));
 const old=svg.querySelector('#uatring');if(old)old.remove();const ring=document.createElementNS('http://www.w3.org/2000/svg','circle');ring.setAttribute('id','uatring');ring.setAttribute('cx',gx);ring.setAttribute('cy',-gy);ring.setAttribute('r',18*upx);ring.setAttribute('fill','none');ring.setAttribute('stroke','#ffe14a');ring.setAttribute('stroke-width',3*upx);ring.setAttribute('pointer-events','none');svg.append(ring);setTimeout(()=>ring.remove(),6000)}
function setup(i){const sh=sheet(),sc=SC[sh.name][i],S=AN.ensure(sh);AN.reset();S.rt.force={};for(const n in sc.force)S.rt.force[n]=sc.force[n];for(const n in sc.ext)S.rt.ext[n]=sc.ext[n];for(const id in sc.fm){const st=S.rt.st[id];if(st)st.fm=sc.fm[id]}
 act={name:sh.name,i,t0:S.rt.t};if(!AN.run){const b=[...document.querySelectorAll('button')].find(x=>/Run/.test(x.textContent)&&/▶/.test(x.textContent));if(b)b.click()}draw()}
function rowState(sc,r,S,done){const a=S.rt.v[r.k];const ok=isFinite(a)&&Math.abs(a-r.v)<=r.tol;return{a,ok}}
function id(i){return sheet().name+'|'+i}
function sheetStat(name){const L=SC[name]||[];let ok=0,bad=0;L.forEach((_,i)=>{const r=R[name+'|'+i];if(r&&r.v==='ok')ok++;if(r&&r.v==='bad')bad++});return{n:L.length,ok,bad}}
function draw(){if(P.style.display!=='block')return;const sh=sheet();if(!sh)return;const L=SC[sh.name]||[];const S=sh.S||AN.ensure(sh);
 if(P.dataset.sheet!==sh.name||P.dataset.act!==(act?act.name+act.i:'')||P.dataset.drawn!=='1'){build()}
 // live values only
 P.querySelectorAll('[data-live]').forEach(td=>{const [i,j]=td.dataset.live.split(',');const sc=L[+i],r=sc.rows[+j];const a=S.rt.v[r.k];const on=act&&act.name===sh.name&&act.i===+i;const el=on?S.rt.t-act.t0:0;const ok=isFinite(a)&&Math.abs(a-r.v)<=r.tol;td.textContent=on?fmt(a):'—';td.className='v '+(on?(ok?'y':(el>=sc.secs?'n':'w')):'')});
 P.querySelectorAll('[data-st]').forEach(el=>{const i=+el.dataset.st,sc=L[i],on=act&&act.name===sh.name&&act.i===i;if(!on){el.textContent='';return}const t=S.rt.t-act.t0;const all=sc.rows.every(r=>{const a=S.rt.v[r.k];return isFinite(a)&&Math.abs(a-r.v)<=r.tol});
  el.textContent=t<sc.secs?('Hintay: '+Math.max(0,Math.ceil(sc.secs-t))+' s (takbo '+t.toFixed(0)+' / '+sc.secs+' s)'+(all?' · tugma na ngayon':'')):(all?'TUGMA ✔ — pindutin ang OK':'HINDI TUGMA ✖ — pindutin ang MALI at isulat ang nakita mo');el.className='big '+(t<sc.secs?'w':(all?'y':'n'))})}
let autoMsg='';
async function autoAll(){const run0=AN.run;AN.run=false;const names=Object.keys(SC);let n=0,bad=0,sheets=0;const t0=Date.now();
 for(const name of names){const sh=AN.sheets.find(x=>x.name===name);if(!sh)continue;const S=AN.ensure(sh);
  for(let i=0;i<SC[name].length;i++){const sc=SC[name][i];if(!sc.secs)continue;
   AN.reset();S.rt.force={};for(const k in sc.force)S.rt.force[k]=sc.force[k];for(const k in sc.ext)S.rt.ext[k]=sc.ext[k];for(const id in sc.fm){const st=S.rt.st[id];if(st)st.fm=sc.fm[id]}
   for(let k=0;k<sc.secs*4;k++)AN.stepSet(sh,.25);
   const miss=sc.rows.filter(r=>!(isFinite(S.rt.v[r.k])&&Math.abs(S.rt.v[r.k]-r.v)<=r.tol));n++;
   if(miss.length){bad++;R[name+'|'+i]={v:'bad',auto:1,n:'AUTO: '+miss.map(r=>r.t+' dapat '+fmt(r.v)+' nakita '+fmt(S.rt.v[r.k])).join('; ')}}else R[name+'|'+i]={v:'ok',auto:1}}
  sheets++;autoMsg='AUTO-TEST: '+sheets+' / '+names.length+' sheet ('+n+' scenario, '+bad+' HINDI TUGMA)...';P.dataset.drawn='0';draw();await new Promise(r=>setTimeout(r,0))}
 AN.reset();AN.run=run0;save();autoMsg='TAPOS ang AUTO-TEST: '+n+' scenario sa '+sheets+' sheet, '+(n-bad)+' TUGMA, '+bad+' HINDI TUGMA ('+Math.round((Date.now()-t0)/1000)+' s). Ang natitira: kulay ng linya (ikaw ang titingin).';P.dataset.drawn='0';draw()}
function looksOk(){for(const n in SC)SC[n].forEach((sc,i)=>{if(!sc.secs&&!(R[n+'|'+i]&&R[n+'|'+i].v==='bad'))R[n+'|'+i]={v:'ok'}});save();P.dataset.drawn='0';draw()}
function build(){const sh=sheet(),L=SC[sh.name]||[];P.dataset.sheet=sh.name;P.dataset.act=act?act.name+act.i:'';P.dataset.drawn='1';P.innerHTML='';
 const tot=Object.keys(SC).length;let fnc=0;for(const n in SC){const s=sheetStat(n);if(s.n&&s.ok===s.n)fnc++}
 const s0=sheetStat(sh.name);
 P.append(E('div',{cls:'row'},[E('h3',{txt:sh.name+(s0.n&&s0.ok===s0.n?'  FUNCTIONAL ✓':'')}),E('button',{txt:'✕',on:()=>{P.style.display='none'}})]));
const names=Object.keys(SC),pos=names.indexOf(sh.name);const go=k=>{const nm=names[(pos+k+names.length)%names.length];AN.go(AN.sheets.findIndex(x=>x.name===nm))};
 const sel=E('select',{});names.forEach(nm=>{const o=E('option',{txt:nm+(sheetStat(nm).n&&sheetStat(nm).ok===sheetStat(nm).n?' ✓':'')});o.value=nm;sel.append(o)});sel.value=sh.name;sel.onchange=()=>AN.go(AN.sheets.findIndex(x=>x.name===sel.value));
 P.append(E('div',{cls:'row'},[E('button',{txt:'◀',on:()=>go(-1)}),sel,E('button',{txt:'▶',on:()=>go(1)})]));
 P.append(E('div',{cls:'sub',txt:fnc+' / '+tot+' sheet FUNCTIONAL · pumili ng sheet sa itaas (◀ ▶). I-click ang SETUP: ako na ang bahala sa reset, force at set point. Ang 📍 ay dadalhin ka sa tag at bubuksan ang monitor sa kanan, hindi nagbabago ang zoom.'}));
 P.append(E('div',{cls:'sc'},[E('b',{txt:'Pinakamabilis: walang gagawin'}),E('div',{cls:'sub',txt:'Ang AUTO-TEST ay ako ang gumagawa ng setup at pagbabasa sa lahat ng sheet. Mga 1 ~ 3 minuto. Mamaya, ang mga HINDI TUGMA lang ang titingnan mo.'}),E('div',{cls:'row'},[E('button',{cls:'go',txt:'▶ AUTO-TEST LAHAT',on:()=>{autoAll()}}),E('button',{txt:'Kulay: OK lahat',on:()=>{looksOk()}})]),E('div',{cls:'big w',txt:autoMsg})]));
 if(!L.length)P.append(E('div',{txt:'Walang scenario ang sheet na ito (legend / contents).'}));
 L.forEach((sc,i)=>{const on=act&&act.name===sh.name&&act.i===i,r=R[id(i)]||{};const box=E('div',{cls:'sc'+(on?' act':'')});
  box.append(E('b',{txt:sc.n}));box.append(E('div',{cls:'sub',txt:sc.s}));
  box.append(E('div',{cls:'row'},[E('button',{cls:'go',txt:'▶ SETUP at takbo',on:()=>setup(i)})]));
  const tb=E('table');tb.append(E('tr',{},[E('td',{txt:'Tag'}),E('td',{cls:'v',txt:'DAPAT'}),E('td',{cls:'v',txt:'NGAYON'}),E('td',{txt:''})]));
  sc.rows.forEach((rw,j)=>{tb.append(E('tr',{},[E('td',{txt:rw.t}),E('td',{cls:'v',txt:rw.txt||fmt(rw.v)}),E('td',{'data-live':i+','+j,cls:'v',txt:'—'}),E('td',{},[E('button',{txt:'📍',title:'Hanapin sa diagram',on:()=>find(rw.k)})])]))});
  box.append(tb);box.append(E('div',{'data-st':i,cls:'big'}));
  if(sc.look)box.append(E('div',{cls:'sub',txt:sc.look}));
  const ok=E('button',{cls:'ok'+(r.v==='ok'?' on':''),txt:'✔ OK',on:()=>{R[id(i)]={v:r.v==='ok'?'':'ok'};save();build()}}),bad=E('button',{cls:'bad'+(r.v==='bad'?' on':''),txt:'✖ MALI',on:()=>{R[id(i)]={v:'bad',n:(r.n||'')};save();build()}});
  box.append(E('div',{cls:'row'},[ok,bad]));
  if(r.auto)box.append(E('div',{cls:'sub',txt:'Sinagot ng AUTO-TEST: '+(r.v==='ok'?'TUGMA':'HINDI TUGMA')+(r.n?' — '+r.n:'')}));if(r.v==='bad'){const inp=E('input',{placeholder:'ano ang nakita mo',value:r.n||''});inp.oninput=()=>{R[id(i)]={v:'bad',n:inp.value};save()};box.append(inp)}
  P.append(box)});
 const cp=E('button',{txt:'Kopyahin ang mga MALI',on:()=>{const out=[];for(const n in SC)SC[n].forEach((sc,i)=>{const r=R[n+'|'+i];if(r&&r.v==='bad')out.push(n+' | '+sc.n+' | Dapat: '+sc.rows.map(x=>x.t+'='+(x.txt||fmt(x.v))).join(', ')+' | Nakita: '+(r.n||'(walang note)'))});const t=out.length?'UAT v'+VER+': '+out.length+' MALI\n'+out.join('\n'):'UAT v'+VER+': walang MALI';pre.textContent=t;pre.style.display='block';try{navigator.clipboard.writeText(t)}catch(e){}}});
 const pre=E('pre');pre.style.display='none';P.append(E('div',{cls:'row'},[cp]),pre)}
setInterval(()=>{try{const sh=sheet();if(sh&&sh.name!==lastSheet){lastSheet=sh.name;P.dataset.drawn='0'}draw()}catch(e){}},400);
})();
