// 150 MW start and Run in the same breath: when AN._startP resolves the DITL must already be in service,
// else Run scans a cold DITL (SAF stopped, MFT) under an ABC at 150 MW. Usage: node tests/regress/ditl150_startp.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const r=await page.evaluate(async()=>{
  const out=(code,nn)=>{const d=S.sheets.find(s=>new RegExp('DITL-'+code+'$').test(s.name));const row=d.rows.findIndex(x=>+x.n===nn-50);return WORLD.out[d.name]&&WORLD.out[d.name].has(row)?1:0};
  const o={};WORLD.set(true);DITL150.on=false;document.getElementById('load150').click();await AN._startP;
  o.on=DITL150.on;if(!o.on){for(let k=0;k<100&&!DITL150.on;k++)await new Promise(r=>setTimeout(r,100));o.late=DITL150.on}
  o.mft=out('03A',63);o.saf=out('27A',55);
  const all=AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name));for(let k=0;k<120;k++){for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}
  o.mft60=out('03A',63);o.saf60=out('27A',55);WORLD.set(false);return o});
console.log(JSON.stringify(r));
ck(r.on===true,'DITL in service when the start promise resolves');
ck(r.mft===0&&r.saf===1,'MFT reset and SAF running at the start: MFT '+r.mft+', SAF '+r.saf);
ck(r.mft60===0&&r.saf60===1,'after 60 s: MFT '+r.mft60+', SAF '+r.saf60);
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
