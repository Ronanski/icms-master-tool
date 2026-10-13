// Builds the UAT form (one html file, no server) from the simulator: node tools/uat/make-uat.js [html] [out]
const {open}=require('../regress/lib');
const html=process.argv[2]||require('fs').readdirSync('.').find(x=>/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x));
const ver=html.match(/v(\d+\.\d+\.\d+)/)[1];
const out=process.argv[3]||`docs/versions/v${ver}/UAT-v${ver}.html`;
(async()=>{const {browser,page}=await open(html);
const data=await page.evaluate(()=>AN.sheets.map(sh=>{const S=AN.ensure(sh);
  const dig=[];for(const n of S.ext){if(!S.nets[n].dig)continue;const l=S.lab[n]&&S.lab[n].t&&S.lab[n].t.trim();if(l&&!dig.includes(l)&&!/^\(/.test(l))dig.push(l)}
  const pid=S.blk.filter(b=>b.k==='PID'||b.k==='PIDV').map(b=>({tag:(b.txt||[])[1]||'',d:(b.face&&b.face.desc)||''})).filter(p=>p.tag&&!/^X+-/.test(p.tag));
  const sw=S.blk.filter(b=>b.k==='SW'||b.k==='AMT'||b.k==='HS'||b.k==='LS').length;
  const ai=S.blk.filter(b=>b.k==='AI').length;
  return {name:sh.name,title:(sh.title||'').replace(/\s+/g,' ').trim(),dig:dig.slice(0,3),pid,sw,ai}}));
await browser.close();
const sheets=data.filter(s=>!/^ABC-000/.test(s.name));
const items=[];
for(const s of sheets){const it=[];
  it.push({k:'run',t:'RUN: gumagalaw ang oras, walang error, may value ang mga linya.'});
  if(s.dig.length)it.push({k:'force',t:`Force / pindot ${s.dig.join(', ')}: 1 tapos 0. Sumusunod ba ang output at ang switch ayon sa diagram?`});
  if(s.sw)it.push({k:'color',t:'Kulay: ang napiling leg ng switch ay DILAW / maliwanag, ang hindi napili ay ABO. Pareho kapag lumipat.'});
  for(const p of s.pid)it.push({k:'pid:'+p.tag,t:`${p.tag}${p.d?' ('+p.d+')':''}: auto, ibahin ang SV. Sumusunod ang PV, tama ang direksyon ng MV, walang kakaibang value?`});
  items.push({name:s.name,title:s.title,items:it})}
const doc=`<!doctype html><html lang="tl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UAT Logic Sim v${ver}</title>
<style>:root{--bg:#10151a;--card:#18212a;--line:#2a3743;--tx:#dbe5ec;--dim:#8a9aa6;--ok:#6fbf8f;--bad:#d9786f;--acc:#6aaee0}*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.45 system-ui,sans-serif;padding:12px 16px 90px;max-width:760px;margin:auto}
h1{font-size:20px;margin:8px 0}p.s{color:var(--dim);margin:4px 0 10px}
#bar{position:sticky;top:0;background:var(--bg);padding:8px 0;border-bottom:1px solid var(--line);z-index:2}
#prog{height:8px;background:var(--line);border-radius:4px;overflow:hidden}#prog i{display:block;height:100%;background:var(--ok);width:0}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}button,select{background:var(--card);color:var(--tx);border:1px solid var(--line);padding:9px 12px;font:inherit;border-radius:6px}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;margin:12px 0;padding:10px 12px}.card h2{font-size:16px;margin:0 0 2px;color:var(--acc)}.card small{color:var(--dim)}
.it{padding:9px 0;border-top:1px solid var(--line)}.it p{margin:0 0 6px}.b{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.b button.on.ok{background:#1d3a2b;border-color:var(--ok);color:var(--ok)}.b button.on.bad{background:#3d2220;border-color:var(--bad);color:var(--bad)}
input.n{flex:1;min-width:140px;background:#0d1217;color:var(--tx);border:1px solid var(--line);padding:8px;border-radius:6px;font:inherit}
.hide{display:none}pre{white-space:pre-wrap;background:#0d1217;border:1px solid var(--line);padding:10px;border-radius:6px}</style></head><body>
<h1>UAT — Logic Sim v${ver}</h1>
<p class="s">Buksan ang simulator (Analog · ABC), pumili ng sheet, pindutin ang RUN. Sa bawat linya pindutin ang <b>OK</b> o <b>MALI</b>. Kung MALI, isulat sa kahon kung ano ang nakita (hal. "I.024E = 1, hindi gumalaw ang switch"). Naka-save ito sa browser mo. Sa dulo, pindutin ang <b>Kopyahin ang mga MALI</b> at i-paste sa chat.</p>
<div id="bar"><div id="prog"><i></i></div><div class="row"><span id="cnt"></span><select id="f"><option value="all">Lahat</option><option value="todo">Wala pang sagot</option><option value="bad">MALI lang</option></select><button id="cp">Kopyahin ang mga MALI</button><button id="rs">Burahin lahat</button></div></div>
<div id="out" class="hide"><pre id="txt"></pre></div><div id="list"></div>
<script>
const D=${JSON.stringify(items)};const KEY='uat-v${ver}';let R={};try{R=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(R))}catch(e){}};
const id=(s,k)=>s+'|'+k;
function render(){const L=document.getElementById('list'),f=document.getElementById('f').value;L.innerHTML='';let tot=0,done=0,bad=0;
 for(const s of D){let html='',shown=0;for(const it of s.items){const i=id(s.name,it.k),r=R[i]||{};tot++;if(r.v)done++;if(r.v==='bad')bad++;
   if(f==='todo'&&r.v)continue;if(f==='bad'&&r.v!=='bad')continue;shown++;
   html+='<div class="it"><p>'+it.t.replace(/</g,'&lt;')+'</p><div class="b"><button class="ok'+(r.v==='ok'?' on':'')+'" data-i="'+i+'" data-v="ok">OK</button><button class="bad'+(r.v==='bad'?' on':'')+'" data-i="'+i+'" data-v="bad">MALI</button><input class="n" placeholder="ano ang nakita (kung MALI)" value="'+(r.n||'').replace(/"/g,'&quot;')+'" data-i="'+i+'"></div></div>'}
  if(shown){const c=document.createElement('div');c.className='card';c.innerHTML='<h2>'+s.name+'</h2><small>'+s.title.replace(/</g,'&lt;')+'</small>'+html;L.append(c)}}
 document.getElementById('cnt').textContent=done+' / '+tot+' sagot · '+bad+' MALI';document.querySelector('#prog i').style.width=(tot?done/tot*100:0)+'%'}
document.addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(!b)return;const i=b.dataset.i;R[i]=Object.assign(R[i]||{},{v:R[i]&&R[i].v===b.dataset.v?'':b.dataset.v});save();render()});
document.addEventListener('input',e=>{if(e.target.classList.contains('n')){const i=e.target.dataset.i;R[i]=Object.assign(R[i]||{},{n:e.target.value});save()}});
document.getElementById('f').onchange=render;
document.getElementById('rs').onclick=()=>{if(confirm('Burahin lahat ng sagot?')){R={};save();render()}};
document.getElementById('cp').onclick=()=>{const lines=[];for(const s of D)for(const it of s.items){const r=R[id(s.name,it.k)];if(r&&r.v==='bad')lines.push(s.name+' | '+it.t+' | '+(r.n||'(walang note)'))}
 const t=lines.length?'UAT v${ver}: '+lines.length+' MALI\\n'+lines.join('\\n'):'UAT v${ver}: walang MALI';document.getElementById('txt').textContent=t;document.getElementById('out').classList.remove('hide');
 try{navigator.clipboard.writeText(t)}catch(e){}};
render();
</script></body></html>`;
require('fs').mkdirSync(require('path').dirname(out),{recursive:true});require('fs').writeFileSync(out,doc);
console.log(out,items.length+' sheets,',items.reduce((a,s)=>a+s.items.length,0)+' items')})();
