// 2.5.0-beta.13 (user: "same function sa ABC ang DITL. so kung ano ang toolbar, ganun din ang DITL. sa left pane, wala ang option na
// by order/category. sa right pane, kung ano ang selected cell, nakikita sa right pane"): the DITL page works like the ABC page.
//  - bar [VIEW | ▶ Run] + Reset, the sheet header with the mode badge (VIEW / TRACE - NO SIMULATION, SIMULATION - RUNNING);
//  - sheet list By order / By category;
//  - right panel tabs Selected / Inputs / Timers / Valves / Outputs (each tab shows its rows);
//  - a click on an output row, a gate or a wire selects it (Selected tab, drawn on the sheet);
//  - "To make it 1": on many sheets, an output that is 0 at rest becomes 1 when the input rows the list names are switched (read
//    again after each round, as an operator does; the list is read from the netlist, this checks it against the simulation).
// Usage: node tests/regress/ditl_selected.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.evaluate(()=>{try{WORLD.set(false)}catch(e){}AN.setCat('dig')});await page.waitForTimeout(800);
// 3.2.0-beta.1: VIEW | RUN is the one switch of the top bar (3.1 shell); Reset, Back, Zoom, Panel are in the ribbon (.g-ditl)
const bar=()=>page.evaluate(()=>[...document.querySelectorAll('#gsbar .seg button,#gsbar .g-ditl button')].filter(b=>b.offsetParent).map(b=>b.textContent.trim()));
const click=t=>page.evaluate(t=>(t==='VIEW'?document.querySelector('#gsbar .seg button:first-child'):t==='▶ Run'?document.querySelector('#gsbar .seg button:last-child'):[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()===t)).click(),t);
const go=async n=>{await page.evaluate(n=>{S.cur=S.sheets.findIndex(s=>new RegExp('^\\(\\d+\\)DITL-'+n+'$').test(s.name));render()},n);await page.waitForTimeout(400)};
await go('03A');
const b=await bar();ck(b.includes('VIEW')&&b.includes('RUN')&&b.includes('Reset')&&!b.includes('SIMULATE'),'DITL bar: '+b.join(' | '));
const badge=()=>page.evaluate(()=>{const m=document.getElementById('dmode');return m&&m.offsetParent?m.textContent:''});
await click('VIEW');await page.waitForTimeout(400);const b1=await badge();
await click('▶ Run');await page.waitForTimeout(500);const b2=await badge();
const hd=await page.evaluate(()=>document.getElementById('dmeta').innerText.replace(/\s+/g,' '));
ck(b1==='VIEW / TRACE - NO SIMULATION'&&b2==='SIMULATION - RUNNING'&&/^DITL-03A SHEET 8 · MASTER FUEL TRIP \(1\)/.test(hd),'header "'+hd.slice(0,60)+'", badge VIEW "'+b1+'", RUN "'+b2+'"');
// sheet list
const side=async m=>{await page.evaluate(m=>document.querySelector('#dsort button[data-m='+m+']').click(),m);await page.waitForTimeout(200);
 return page.evaluate(()=>({n:document.querySelectorAll('#sidelist button').length,h:document.querySelectorAll('#sidelist .fh').length,first:[...document.querySelectorAll('#sidelist button .sn')].slice(0,3).map(e=>e.textContent).join(' ')}))};
const so=await side('order'),sc=await side('cat');
ck(so.n===S_N(so)&&so.h===0&&sc.h>=20&&sc.n===so.n,'sheet list By order: '+so.n+' sheets, no headers ('+so.first+'); By category: '+sc.h+' groups');
function S_N(x){return x.n}
// tabs
const tabs=await page.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms)),o={};for(const b of [...document.querySelectorAll('#dp>.lo-tabs>button')]){b.click();await sl(80);
 o[b.textContent]=[...document.querySelectorAll('#dp>*')].filter(e=>e.offsetHeight&&!e.matches('.dp-top,.lo-tabs')).length}return o});
ck(Object.keys(tabs).join(',')==='Selected,Inputs,Timers,Valves,Outputs'&&tabs.Inputs>5&&tabs.Timers>0&&tabs.Outputs>5&&tabs.Selected===1,'right panel tabs '+JSON.stringify(tabs));
// pick: output row, gate, wire (screen clicks)
const clickAt=async(x,y)=>{const p=await page.evaluate(([x,y])=>{const q=new DOMPoint(x,-y).matrixTransform(document.getElementById('svg').getScreenCTM());return [q.x,q.y]},[x,y]);await page.mouse.click(p[0],p[1]);await page.waitForTimeout(450)};
const st=()=>page.evaluate(()=>({sel:DUI.sel(),pt:document.getElementById('dp').dataset.pt,t:document.querySelector('#dp .dp-sel').innerText.replace(/\s+/g,' '),hl:document.querySelectorAll('#svg .dsel *').length}));
const P=await page.evaluate(()=>{const s=cur(),VR=s.vr||s.rng,o=s.nl.outs.find(o=>/MFT 2/.test(s.cells[o.row+':RS'].map(t=>t.t).join(' '))),g=s.nl.gates.find(g=>g.t==='FF'),q=s.nl.segs.find(q=>q.h&&q.x2-q.x1>20);
 return {o:[(VR.RL[0]+VR.RL[1])/2,s.rows[o.row].y+1],g:[(g.box.x1+g.box.x2)/2,(g.box.y1+g.box.y2)/2],w:[(q.x1+q.x2)/2,q.y1]}});
await page.evaluate(()=>LO.setDi('in'));
await clickAt(...P.o);let r=await st();
ck(r.sel&&r.sel.t==='row'&&r.sel.side==='R'&&r.pt==='sel'&&/OUTPUT · ROW 16 MFT 2/.test(r.t)&&/DRIVEN BY/.test(r.t)&&/TO MAKE IT 1/.test(r.t)&&r.hl>=2,'click output row 16 (RUN): Selected tab "'+r.t.slice(0,110)+'..."');
await clickAt(...P.g);r=await st();ck(r.sel&&r.sel.t==='g'&&/FLIP-FLOP/.test(r.t)&&/SET/.test(r.t)&&/RESET/.test(r.t),'click the flip-flop: "'+r.t.slice(0,90)+'..."');
await clickAt(...P.w);r=await st();ck(r.sel&&r.sel.t==='n'&&/WIRE/.test(r.t)&&/GOES TO/.test(r.t),'click a wire: "'+r.t.slice(0,90)+'..."');
await click('VIEW');await page.waitForTimeout(400);await clickAt(...P.o);r=await st();ck(/– \(VIEW\)/.test(r.t)&&/Press RUN/.test(r.t),'VIEW: the selection shows the logic without values');
// "To make it 1" against the simulation, many sheets
await click('▶ Run');await page.waitForTimeout(400);
const W=await page.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=[],skip=0,sheets=0;
 const reset=()=>[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>b.textContent.trim()==='Reset').click();
 for(let k=0;k<S.sheets.length;k+=3){const s=S.sheets[k];S.cur=k;render();if(!s.nl||!s.nl.outs.length)continue;sheets++;
  const rows=[...new Set(s.nl.outs.map(o=>o.row))];
  for(const row of rows){reset();await sl(0);let R=simSheet(s);if(R.outOn.has(row)||mvOut(s,simIn(s)).has(row)){skip++;continue}
   /* as the operator does it: switch what the list names, read the list again (an interlock can then name the next input), up to 4 rounds */
   const n=DUI.rowNets(s,row,'R')[0],set=[];let done=false,sk=false;
   for(let k=0;k<4&&!done&&!sk;k++){const L=DUI.why(s,n,1);
    if(!L.length||L.some(x=>x.row===undefined||x.auto)){sk=true;break}
    L.forEach(x=>{s.sig[x.row+':S']=!!x.want;set.push(x.row)});await sl(350);R=simSheet(s);done=R.outOn.has(row)}
   if(done)ok++;else if(sk)skip++;else bad.push(s.name+' row '+s.rows[row].n);
   set.forEach(i=>delete s.sig[i+':S'])}
  reset()}
 return {ok,bad,skip,sheets}});
ck(W.ok>100&&!W.bad.length,'"To make it 1" on '+W.sheets+' sheets: '+W.ok+' outputs became 1 with the input rows the list names'+(W.bad.length?'; NOT: '+W.bad.slice(0,8).join(', '):'')+' ('+W.skip+' others: already 1, or need a timer / flip-flop / other sheet)');
ck(!errs.length,'no page error'+(errs.length?' '+errs.slice(0,2).join(' | '):''));
await browser.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0)})();
