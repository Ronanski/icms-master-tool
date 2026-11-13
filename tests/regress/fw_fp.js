// Mina's live test 2026-11-05 (FEEDWATER, beta.31):
// 1. BFWP-A START needs its auxiliary lube oil pump (DITL-22), the page has no symbol for it: the BFWP faceplate has an AUXILIARY row.
// 2. MV-FW1001 (DITL-38 copy, no addresses on its rows) had no FIELD SELECTOR (the REMOTE row has no I. address).
// 3. XV-FW1111-1 OPEN at Cold said EXECUTED and did nothing: the faceplate names what blocks it (MFT, steam flow < 10 %).
// Real mouse clicks on the page. Usage: node tests/regress/fw_fp.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
/* 3.2.3-beta.189: the default layout opens on its start screen (#scstart), which covered the page: every click landed on it. The test
   loads Cold itself, so it closes the start screen with "Open without a start state" first (the cep_auto.js way) */
await page.evaluate(()=>{const k=document.querySelector('#scstart .scskip');if(k&&k.offsetParent)k.click()});await page.waitForTimeout(1000);
await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);await AN.plantCold();if(AN.view)AN.viewSet(false);AN.run=true});
/* and opens the page as the layout does (lsShellC.openPage, cep_auto.js); the old layout through its page list */
await page.evaluate(()=>window.lsShellC&&lsShellC.openPage?lsShellC.openPage('MK06'):(lsPlant(true),document.querySelector('#pllist button[data-id="MK06"]').click()));await page.waitForTimeout(2000);
const wait=ms=>page.waitForTimeout(ms);
const clk=async sel=>{const b=await page.evaluate(sel=>{const e=[...document.querySelectorAll(sel)].find(x=>x.getBoundingClientRect().width>0);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},sel);if(b)await page.mouse.click(b[0],b[1]);return !!b};
const btn=async t=>{const b=await page.evaluate(t=>{const p=document.getElementById('fpop');if(!p)return null;const e=[...p.querySelectorAll('button')].find(x=>x.textContent.trim()===t&&x.offsetParent);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,e.disabled]},t);if(b&&!b[2])await page.mouse.click(b[0],b[1]);return b?(b[2]?'disabled':'ok'):'none'};
const txt=()=>page.evaluate(()=>((document.getElementById('fpop')||{}).innerText||'').split('\n').join(' · '));
// 1
ck(await clk('[data-hit="PA"]'),'BFWP-A on the page');await wait(700);
/* the default layout writes the section names in sentence case (Auxiliary, Mode), the old one in capitals: the same row */
ck(/AUXILIARY/i.test(await txt()),'BFWP-A faceplate has the AUXILIARY row');
ck(await btn('Lube oil pump A')==='ok','AUXILIARY: Lube oil pump A');await wait(800);
ck(/DITL-22/.test(await txt()),'the lube oil pump A faceplate (DITL-22) opened: '+(await txt()).slice(0,80));
ck(await btn('START')!=='none','its START buttons are there');
await page.evaluate(()=>window.LS_FPOP&&LS_FPOP.close());await wait(300);
// 2
ck(await clk('[data-hit="MA"]'),'MV-FW1001 on the page');await wait(700);
ck(/FIELD SELECTOR/.test(await txt()),'MV-FW1001 has the FIELD SELECTOR');
ck(await btn('REMOTE')==='ok','REMOTE');await wait(300);await btn('EXECUTE');await wait(2500);
ck(/MODE · REMOTE/i.test(await txt()),'MV-FW1001 MODE REMOTE ('+(await txt()).match(/MODE · \w+/i)+')');
await page.evaluate(()=>window.LS_FPOP&&LS_FPOP.close());await wait(300);
// 3
ck(await clk('[data-hit="X11A"]'),'XV-FW1111-1 on the page');await wait(700);
ck(await btn('OPEN')==='ok','OPEN');await wait(300);await btn('EXECUTE');await wait(4000);/* beta.52: the press is judged 3 s later, by what the valve did */
const t3=await txt();
ck(/The logic asks for/.test(t3)&&/MFT/.test(t3),'the reason is shown: '+(t3.match(/⚠[^·]*/)||[''])[0]);
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
