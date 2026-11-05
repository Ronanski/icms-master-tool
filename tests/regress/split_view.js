// 3.2.1 loop check split view (user 2026-11-05, approved mockup https://claude.ai/artifact/LZf2whSWvZqX7ncNnYGy27).
// Real clicks: rail Split -> HMI left + logic right; ACWP-A on MAKE-UP AND CLOSED COOLING WATER -> batch DITL-76, the tag table lists
// I.0088 (rows 5 / 19 / 20); REMOTE on the faceplate -> I.0088 live 1, an event of the batch; TICLO1002 -> controller tags with the
// settings (range, P I D) and live PV / SV / MV; dragging the dividers changes the sizes; Float puts the events in a window.
// Usage: node tests/regress/split_view.js [html] [screenshot.png]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const shot=process.argv.find(a=>/\.png$/.test(a));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);await AN.plantCold();if(AN.view)AN.viewSet(false);AN.run=true});
await page.evaluate(()=>lsPlant(true));await page.waitForTimeout(1500);
await page.evaluate(()=>document.querySelector('#pllist button[data-id="MK02"]').click());await page.waitForTimeout(1500);
const wait=ms=>page.waitForTimeout(ms);
const clk=async sel=>{const b=await page.evaluate(sel=>{const e=[...document.querySelectorAll(sel)].find(x=>x.getBoundingClientRect().width>0);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},sel);if(b)await page.mouse.click(b[0],b[1]);return !!b};
const btn=async t=>{const b=await page.evaluate(t=>{const p=document.getElementById('fpop');if(!p)return null;const e=[...p.querySelectorAll('button')].find(x=>x.textContent.trim()===t&&x.offsetParent);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,e.disabled]},t);if(b&&!b[2])await page.mouse.click(b[0],b[1]);return b?(b[2]?'disabled':'ok'):'none'};
ck(await page.evaluate(()=>!!window.LS_SPLIT),'split module loaded');
const rb=await page.evaluate(()=>{const b=[...document.querySelectorAll('.tabs button')].find(b=>b.textContent.trim()==='Split');if(!b)return null;const r=b.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]});
ck(!!rb,'rail button Split');if(rb)await page.mouse.click(rb[0],rb[1]);await wait(1500);
const g=await page.evaluate(()=>{const p=document.getElementById('plantws').getBoundingClientRect(),m=document.getElementById('mid').getBoundingClientRect();return {on:LS_SPLIT.on,cls:document.body.classList.contains('lssplit'),tab:document.body.dataset.tab,pw:Math.round(p.width),pl:Math.round(p.left),ml:Math.round(m.left+parseFloat(getComputedStyle(document.getElementById('mid')).marginLeft)),disp:getComputedStyle(document.getElementById('plantws')).display}});
ck(g.on&&g.cls&&g.tab==='logic'&&g.disp==='grid'&&g.pw>300,'split on: logic tab and the HMI shown ('+JSON.stringify(g)+')');
ck(await clk('[data-hit="ACA"]'),'ACWP-A on the HMI');await wait(1500);
const b1=await page.evaluate(()=>[LS_SPLIT.batch,LS_SPLIT.rows().filter(r=>r.adr==='I.0088').map(r=>r.where.join(';')),LS_SPLIT.rows().length,AN.cat]);
ck(b1[0]==='MK02:ACA','faceplate -> batch = the equipment ACWP-A ('+b1[0]+')');
ck(b1[1].length>=1&&/r5/.test(b1[1].join()),'tag table: I.0088 used in '+JSON.stringify(b1[1]));
ck(b1[2]>=15,'tag table rows: '+b1[2]);
const eqs=await page.evaluate(()=>{LS_SPLIT.setBatch('MK03:iac0',false,true);const r=LS_SPLIT.rows();const o={n:r.length,bad:r.filter(x=>/COMPRESSOR [BC]/.test(x.name)).length,eq:document.querySelectorAll('#splbar select option').length};LS_SPLIT.setBatch('MK02:ACA',false,true);return o});
ck(eqs.n>=2&&eqs.bad===0,'compressor A batch: only its rows ('+JSON.stringify(eqs)+')');
ck(eqs.eq>=60,'Batch list = the equipment of the HMI pages: '+eqs.eq);
ck(await btn('REMOTE')==='ok','faceplate REMOTE');await wait(300);await btn('EXECUTE');await wait(2500);
const v=await page.evaluate(()=>LS_SPLIT.rows().filter(r=>r.adr==='I.0088').map(r=>r.v));
ck(v.length&&v.every(x=>x===1),'I.0088 live = 1 after REMOTE ('+v+')');
const ev=await page.evaluate(()=>document.querySelectorAll('#splbot .splp[data-p="ev"] .ev, .splfl[data-p="ev"] .ev').length);
ck(ev>=1,'events of the batch: '+ev);
await page.keyboard.press('Escape');await wait(400);
ck(await clk('[data-hit="TIC"]'),'TICLO1002 on the HMI');await wait(1500);
// the controller faceplate now opens its ABC sheet on the right; this test never picked a starting state (AN.plantCold above), so the app
// asks for one on the sheet change: answer "Not now" as an operator would
const ask=await page.evaluate(()=>{const d=document.getElementById('lsask');if(!d)return 0;const b=[...d.querySelectorAll('button')].find(x=>x.textContent.trim()==='Not now');if(b)b.click();return 1});
if(ask){console.log('NOTE starting-state prompt answered "Not now"');await wait(500);}
ck(await page.evaluate(()=>AN.cat==='an'&&/ABC-053/.test(AN.sheets[AN.i].name)),'controller faceplate -> its ABC sheet on the right');
const ct=await page.evaluate(()=>{const t=document.getElementById('splctl');return t?t.innerText.split('\n').join(' | '):''});
ck(/TICLO1002/.test(ct)&&/°C/.test(ct),'controller tags: '+ct.slice(0,200));
// drag the HMI | logic divider 200 px to the right
const x0=await page.evaluate(()=>LS_SPLIT.layout.x);
const vd=await page.evaluate(()=>{const r=document.getElementById('splvd').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]});
await page.mouse.move(vd[0],vd[1]);await page.mouse.down();await page.mouse.move(vd[0]+200,vd[1],{steps:5});await page.mouse.up();await wait(500);
const x1=await page.evaluate(()=>LS_SPLIT.layout.x);
ck(x1>x0+0.05,'divider drag: HMI share '+x0.toFixed(2)+' -> '+x1.toFixed(2));
const hd=await page.evaluate(()=>{const r=document.getElementById('splhd').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]});
const b0=await page.evaluate(()=>LS_SPLIT.layout.b);console.log('HD',JSON.stringify(hd),await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);const h=document.getElementById('splhd');const r=h.getBoundingClientRect();return (e&&(e.id||e.className))+' hd:'+[r.x,r.y,r.width,r.height].map(Math.round)+' disp:'+getComputedStyle(h).display},hd));
await page.mouse.move(hd[0],hd[1]);await page.mouse.down();await page.mouse.move(hd[0],hd[1]-80,{steps:5});await page.mouse.up();await wait(500);
const bb=await page.evaluate(()=>LS_SPLIT.layout.b);
ck(bb>b0+40,'bottom divider drag: '+b0+' -> '+bb);
if(shot)await page.screenshot({path:shot});
// float the events panel
const fb=await page.evaluate(()=>{const p=document.querySelector('.splp[data-p="ev"]');const b=[...p.querySelectorAll('button')].find(x=>x.textContent==='Float');const r=b.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]});
await page.mouse.click(fb[0],fb[1]);await wait(500);
ck(await page.evaluate(()=>!!document.querySelector('.splfl[data-p="ev"]')),'events panel floats');
// a controller batch picked in Batch (user 2026-11-05 "dapat nagrereflect ung command mo sa controller doon mismo sa logic"): its ABC sheet on the right, the HMI on its page, the mode and PV / SV / MV rows live
const cb=await page.evaluate(async()=>{LS_SPLIT.setBatch('MK06:CSU',true);await new Promise(r=>setTimeout(r,2500));const r=LS_SPLIT.rows();return {sh:AN.sheets[AN.i]&&AN.sheets[AN.i].name,cat:AN.cat,pg:(document.querySelector('select.plpick')||{}).value,adr:r.map(x=>x.adr)}});
ck(cb.sh==='ABC-010'&&cb.cat==='an','controller batch LICBR1001B -> ABC-010 on the right ('+JSON.stringify(cb)+')');
ck(cb.pg==='MK06','controller batch -> HMI on the Feedwater page ('+cb.pg+')');
ck(cb.adr.includes('LICBR1001B.MAN')&&cb.adr.includes('PV')&&cb.adr.includes('MV'),'controller batch rows: '+cb.adr.join(', '));
const nf=await page.evaluate(()=>{const o=[...document.querySelectorAll('#splbar select option')].filter(o=>!/DITL/.test(o.textContent));const bad=[];for(const x of o){LS_SPLIT.setBatch(x.value,false,true);if(!LS_SPLIT.rows().length)bad.push(x.value)}LS_SPLIT.setBatch('MK06:CSU',false,true);return {n:o.length,bad}});
ck(nf.n>=50&&nf.bad.length===0,'every controller batch found on the ABC sheets ('+nf.n+', not found: '+nf.bad.join(' ')+')');
// the instruments of the HMI pages are batches too (user 2026-11-05 "Wala ung mga instrument?"): LTCD1110 = AI0640 on ABC-031, the HMI shows the same value
const ib=await page.evaluate(async()=>{const n=[...document.querySelectorAll('#splbar select option')].filter(o=>/:i:/.test(o.value)).length;LS_SPLIT.setBatch('MK05:i:LTCD1110',true);await new Promise(r=>setTimeout(r,2500));const r=LS_SPLIT.rows();return {n,sh:AN.sheets[AN.i].name,pg:(document.querySelector('select.plpick')||{}).value,r:r.map(x=>[x.adr,x.where.join(','),x.v])}});
ck(ib.n>=400,'instrument batches: '+ib.n);
ck(ib.r[0]&&ib.r[0][0]==='AI0640'&&ib.r[0][1].includes('ABC-031')&&ib.sh==='ABC-031'&&ib.pg==='MK05','LTCD1110 -> AI0640 on ABC-031, HMI on 028 CONDENSATE ('+JSON.stringify(ib)+')');
ck(ib.r[1]&&ib.r[1][0]==='HMI'&&ib.r[0][2]!=null&&Math.abs(ib.r[1][2]-ib.r[0][2])<0.6,'LTCD1110: HMI value = logic value ('+ib.r[0][2]+' / '+(ib.r[1]&&ib.r[1][2])+')');
// analogs (user 2026-11-05 "included ang mga analogs"): the motor batch carries its current / pressure; an analog row has a range point to check
const an=await page.evaluate(()=>{LS_SPLIT.setBatch('MK02:ACA',false,true);return LS_SPLIT.rows().map(x=>x.adr+' '+x.name).filter(x=>/P1108A|CW1108-A/.test(x))});
ck(an.some(x=>/IT-P1108A/.test(x))&&an.some(x=>/DPT-CW1108-A/.test(x)),'ACWP-A batch has its current and strainer pressure: '+JSON.stringify(an));
const ax=await page.evaluate(async()=>{LS_SPLIT.setBatch('MK05:i:LTCD1110',false,true);await new Promise(r=>setTimeout(r,800));const tr=[...document.querySelectorAll('.splp[data-p="tags"] tbody tr')][0];const b=tr&&tr.querySelector('button.ex');if(!b)return 'no button';b.click();await new Promise(r=>setTimeout(r,500));const t2=[...document.querySelectorAll('.splp[data-p="tags"] tbody tr')][0];return t2.innerText.replace(/\t/g,' | ')});
ck(/0 % = -436 mm/.test(ax)&&/[✓✗]/.test(ax),'analog expected = a point of the I/O list range: '+ax);
const rbo=await page.evaluate(()=>{const b=[...document.querySelectorAll('.tabs button')].find(b=>b.textContent.trim()==='Split');const r=b.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]});
await page.mouse.click(rbo[0],rbo[1]);await wait(800);
ck(await page.evaluate(()=>!LS_SPLIT.on&&!document.body.classList.contains('lssplit')&&!document.querySelector('.splfl')),'Split again: off, nothing left on the page');
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
