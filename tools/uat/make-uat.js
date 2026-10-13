// Builds the UAT form (one html file) with the exact steps AND the expected values, from the simulator whose logic was
// checked against the drawings and workbooks:  node tools/uat/make-uat.js [html] [out]
const {open}=require('../regress/lib');
const html=process.argv[2]||require('fs').readdirSync('.').find(x=>/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x));
const ver=html.match(/v(\d+\.\d+\.\d+)/)[1];
const out=process.argv[3]||`docs/versions/v${ver}/UAT-v${ver}.html`;
(async()=>{const {browser,page}=await open(html);
const data=await page.evaluate(()=>{
 const fmt=x=>Math.abs(x)>=100?x.toFixed(0):Math.abs(x)>=10?x.toFixed(1):x.toFixed(2);
 const res=[];
 for(const sh of AN.sheets){if(/^ABC-000/.test(sh.name))continue;const S=AN.ensure(sh);
  const named={};for(const k in S.lab){const l=S.lab[k];if(l&&l.t){const t=l.t.trim();if(/^[A-Z][A-Za-z0-9.\-]{3,}$/.test(t)&&!/^(FROM|SIG|TO|AND|NOT|LINK)/i.test(t))named[+k]=t}}
  // AO values: tag text next to the AO block
  const ao=[];for(const b of S.blk.filter(q=>q.k==='AO')){let best=null,bd=1e9;for(const t of S.tx){if(!/^AO\d{3,4}/.test(t.t.trim()))continue;const d=Math.hypot(b.cx-t.x,b.cy-t.y);if(d<bd){bd=d;best=t.t.trim().split(/\s+/)[0]}}if(best&&bd<60&&b.i[0]!=null)ao.push([best,b.i[0]])}
  for(const [t,n] of ao)named[n]=t;
  const run=(force,secs)=>{AN.reset();for(const x of S.procs||[])x.proc.on=x.proc.on;S.rt.force={};for(const n in force)S.rt.force[n]=force[n];for(let i=0;i<secs*4;i++)AN.stepSet(sh,.25);const v={};for(const n in named)v[n]=S.rt.v[n];return v};
  const base=run({},12);
  const items=[];
  const aos=ao.slice(0,3).map(([t,n])=>t+' = '+fmt(base[n])).join(', ');
  items.push({n:'1. Normal, walang force',s:['I-click ang Reset (tuktok).','Walang ifo-force, walang babaguhin. Plant model ay naka-on (default).','I-click ang RUN.'],t:'Maghintay ng 12 segundo.',e:'Gumagalaw ang oras, walang error.'+(aos?' '+aos+'.':'')});
  const dig=[];for(const n of S.ext){if(!S.nets[n].dig)continue;const l=S.lab[n]&&S.lab[n].t&&S.lab[n].t.trim();if(l&&/^[A-Z][A-Za-z0-9.\-]{3,}$/.test(l)&&!/^(FROM|SIG)/i.test(l))dig.push([n,l])}
  let used=0;
  for(const [n,l] of dig){if(used>=2)break;const v1=run({[n]:1},10);const ch=[];for(const k in named){if(+k===n)continue;const a=base[k],b=v1[k];if(!isFinite(a)||!isFinite(b))continue;if(Math.abs(a-b)>0.01*Math.max(1,Math.abs(a)))ch.push([k,a,b])}
   if(!ch.length)continue;ch.sort((x,y)=>(/^(AO|M\.|SI|SO)/.test(named[y[0]])?1:0)-(/^(AO|M\.|SI|SO)/.test(named[x[0]])?1:0));
   const seen=new Set();const txt=ch.filter(c=>{if(seen.has(named[c[0]]))return false;seen.add(named[c[0]]);return true}).slice(0,4).map(c=>named[c[0]]+': '+fmt(c[1])+' → '+fmt(c[2])).join(' · ');
   items.push({n:(used+2)+'. Kondisyon: '+l+' = 1',s:['I-click ang Reset.','I-click ang RUN.','I-click ang tag '+l+' sa drawing, i-force sa 1.'],t:'Maghintay ng 10 segundo. Tingnan ang mga value sa baba. Tapos ibalik ang '+l+' sa 0.',e:txt+'. Pagbalik sa 0, bumabalik ang mga ito (maliban sa SET/RESET na hawak ang huling value).'});used++}
  // loop scenario: first PID whose SV is an operator input
  for(const b of S.blk.filter(z=>z.k==='PID'&&z.proc&&z.proc.on)){const q=AN.anPins(S,b);if(!q||q.sv==null||q.pv==null||q.pv<0||!S.ext.includes(q.sv))continue;const tag=(b.txt||[])[1];if(!tag||/^X+-/.test(tag))continue;
   AN.reset();const amt=S.blk.filter(z=>(z.k==='AMT'||z.k==='SW')&&(b.o.includes(z.a)||b.o.includes(z.b)))[0];
   const P=b.p,lo=P.rlo!=null?P.rlo:0,hi=P.rhi!=null?P.rhi:100,mid=lo+.5*(hi-lo);
   if(amt){const st=S.rt.st[amt.id];st.fm=b.o.includes(amt.a)?'A':'B'}
   S.rt.ext[q.sv]=mid;S.rt.force={};for(let i=0;i<240;i++)AN.stepSet(sh,.25);const pv0=S.rt.v[q.pv];
   for(let i=0;i<240;i++)AN.stepSet(sh,.25);const pv1=S.rt.v[q.pv];const mv=S.rt.v[b.o[0]];
   AN.reset();const span=Math.max(1e-9,hi-lo),pv00=pv0;if(!(Math.abs(pv1-pv00)>0.03*span&&Math.abs(pv1-mid)<Math.abs(pv00-mid)))continue;
   items.push({n:(used+2)+'. Loop '+tag+' sa AUTO',s:['I-click ang Reset.','I-click ang RUN.','I-click ang pink na COS diamond ng '+tag+', piliin ang "Back to AUTO (A)".','Sa COS SV ng '+tag+' i-click ang "Mid" ('+fmt(mid)+(P.unit?' '+P.unit:'')+').'],t:'Maghintay ng 60 segundo, tapos hanggang 120 segundo.',e:'Ang PV ng '+tag+' ay lumalapit sa SV '+fmt(mid)+': mga '+fmt(pv0)+' sa 60 s, mga '+fmt(pv1)+' sa 120 s. MV mga '+fmt(mv)+' %. Dahan-dahan ang galaw, hindi bumabaligtad, walang NaN. (Maghintay hanggang 120 s kung gusto mong makita ang huling value.)'});break}
  const sw=S.blk.filter(b=>b.k==='SW'||b.k==='AMT').slice(0,1);
  for(const b of sw){const p=S.rt.st[b.id]&&S.rt.st[b.id].pk;if(p)items.push({n:'Kulay ng linya',s:['Sa RUN, walang force.','Tingnan ang unang switch (T o A/M) sa drawing.'],t:'Tingnan ang kulay ng dalawang leg.',e:`Napili ang leg ${p}: DILAW at maliwanag ang linya ng ${p}, ABO ang kabilang leg. Kapag lumipat ang switch, magpapalit ang kulay.`})}
  res.push({name:sh.name,title:(sh.title||'').replace(/\s+/g,' ').trim(),items});
 }
 return res});
await browser.close();
const doc=`<!doctype html><html lang="tl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UAT Logic Sim v${ver}</title>
<style>:root{--bg:#10151a;--card:#18212a;--line:#2a3743;--tx:#dbe5ec;--dim:#8a9aa6;--ok:#6fbf8f;--bad:#d9786f;--acc:#6aaee0}*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.45 system-ui,sans-serif;padding:12px 16px 90px;max-width:760px;margin:auto}
h1{font-size:20px;margin:8px 0}p.s{color:var(--dim);margin:4px 0 10px}
#bar{position:sticky;top:0;background:var(--bg);padding:8px 0;border-bottom:1px solid var(--line);z-index:2}
#prog{height:8px;background:var(--line);border-radius:4px;overflow:hidden}#prog i{display:block;height:100%;background:var(--ok);width:0}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center}button,select{background:var(--card);color:var(--tx);border:1px solid var(--line);padding:9px 12px;font:inherit;border-radius:6px}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;margin:12px 0;padding:10px 12px}.card h2{font-size:16px;margin:0;color:var(--acc)}.card small{color:var(--dim)}
.hd{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}
.it{padding:9px 0;border-top:1px solid var(--line)}.g{margin:0 0 4px}.g b{color:var(--acc)}.e{margin:0 0 6px;color:#bfe3cc}.e b{color:var(--ok)}
.su{margin:2px 0 6px;padding-left:20px;color:var(--dim)}.fn{color:var(--ok);font-weight:bold}.b{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
button.okall.on{background:#1d3a2b;border-color:var(--ok);color:var(--ok)}button.bad.on{background:#3d2220;border-color:var(--bad);color:var(--bad)}
input.n{flex:1;min-width:140px;background:#0d1217;color:var(--tx);border:1px solid var(--line);padding:8px;border-radius:6px;font:inherit}
.hide{display:none}pre{white-space:pre-wrap;background:#0d1217;border:1px solid var(--line);padding:10px;border-radius:6px}</style></head><body>
<h1>UAT — Logic Sim v${ver}</h1>
<p class="s">Sa bawat sheet may mga scenario. Gawin ang <b>setup</b> (ang listahan), gawin ang <b>GAWIN</b>, tingnan kung pareho ang lumabas sa <b>DAPAT</b>. Kung pareho lahat, pindutin ang <b>OK lahat</b>: ang sheet ay <b>FUNCTIONAL</b>. Kung may hindi pareho, pindutin ang <b>MALI</b> sa linyang iyon at isulat ang nakita mo. Sa dulo: <b>Kopyahin ang mga MALI</b> at i-paste sa chat. Ang "DAPAT" ay galing sa lohika na na-check ko sa diagram at workbook. Naka-save sa browser mo.</p>
<div id="bar"><div id="prog"><i></i></div><div class="row"><span id="cnt"></span><select id="f"><option value="all">Lahat</option><option value="todo">Wala pang sagot</option><option value="bad">MALI lang</option></select><button id="cp">Kopyahin ang mga MALI</button><button id="rs">Burahin lahat</button></div></div>
<div id="out" class="hide"><pre id="txt"></pre></div><div id="list"></div>
<script>
const D=${JSON.stringify(data)};const KEY='uat2-v${ver}';let R={};try{R=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(R))}catch(e){}};const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const id=(s,i)=>s+'|'+i;const st=(s)=>{let ok=0,bad=0,n=s.items.length;s.items.forEach((_,i)=>{const r=R[id(s.name,i)]||{};if(r.v==='ok')ok++;if(r.v==='bad')bad++});return{ok,bad,n}};
function render(){const L=document.getElementById('list'),f=document.getElementById('f').value;L.innerHTML='';let tot=0,done=0,bad=0;
 for(const s of D){const t=st(s);tot+=t.n;done+=t.ok+t.bad;bad+=t.bad;const complete=t.ok+t.bad===t.n;
  if(f==='todo'&&complete)continue;if(f==='bad'&&!t.bad)continue;
  let h='<div class="hd"><div><h2>'+s.name+'</h2><small>'+esc(s.title)+'</small></div><button class="okall'+(t.ok===t.n?' on':'')+'" data-all="'+s.name+'">'+(t.ok===t.n?'FUNCTIONAL ✓':'OK lahat ('+t.n+')')+'</button></div>';
  s.items.forEach((it,i)=>{const r=R[id(s.name,i)]||{};h+='<div class="it"><p class="g"><b>'+esc(it.n)+'</b></p><ul class="su">'+it.s.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p class="g"><b>GAWIN:</b> '+esc(it.t)+'</p><p class="e"><b>DAPAT:</b> '+esc(it.e)+'</p><div class="b"><button class="bad'+(r.v==='bad'?' on':'')+'" data-i="'+id(s.name,i)+'">MALI</button><input class="n'+(r.v==='bad'?'':' hide')+'" placeholder="ano ang nakita mo" value="'+esc(r.n||'')+'" data-i="'+id(s.name,i)+'"></div></div>'});
  const c=document.createElement('div');c.className='card';c.innerHTML=h;L.append(c)}
 const fnc=D.filter(s=>st(s).ok===s.items.length).length;document.getElementById('cnt').textContent=fnc+' / '+D.length+' sheet FUNCTIONAL · '+bad+' MALI';document.querySelector('#prog i').style.width=(tot?done/tot*100:0)+'%'}
document.addEventListener('click',e=>{const a=e.target.closest('button[data-all]');if(a){const s=D.find(x=>x.name===a.dataset.all);const allOk=st(s).ok===s.items.length;s.items.forEach((_,i)=>{R[id(s.name,i)]=allOk?{}:{v:'ok'}});save();render();return}
 const b=e.target.closest('button.bad[data-i]');if(b){const i=b.dataset.i;R[i]=R[i]&&R[i].v==='bad'?{}:{v:'bad',n:(R[i]&&R[i].n)||''};save();render()}});
document.addEventListener('input',e=>{if(e.target.classList.contains('n')){const i=e.target.dataset.i;R[i]=Object.assign(R[i]||{v:'bad'},{n:e.target.value});save()}});
document.getElementById('f').onchange=render;
document.getElementById('rs').onclick=()=>{if(confirm('Burahin lahat ng sagot?')){R={};save();render()}};
document.getElementById('cp').onclick=()=>{const lines=[];for(const s of D)s.items.forEach((it,i)=>{const r=R[id(s.name,i)];if(r&&r.v==='bad')lines.push(s.name+' | '+it.n+' | Setup: '+it.s.join(' / ')+' | Gawin: '+it.t+' | Dapat: '+it.e+' | Nakita: '+(r.n||'(walang note)'))});
 const t=lines.length?'UAT v${ver}: '+lines.length+' MALI\\n'+lines.join('\\n'):'UAT v${ver}: walang MALI';document.getElementById('txt').textContent=t;document.getElementById('out').classList.remove('hide');try{navigator.clipboard.writeText(t)}catch(e){}};
render();
</script></body></html>`;
require('fs').writeFileSync(out,doc);
const n=data.reduce((a,s)=>a+s.items.length,0);console.log(out,data.length+' sheets,',n+' steps');
console.log(data.slice(0,2).map(s=>s.name+'\n'+s.items.map(i=>'  '+i.n+' | '+i.s.join(' / ')+'\n    GAWIN '+i.t+'\n    DAPAT '+i.e).join('\n')).join('\n'))})();
