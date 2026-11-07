// Bed temperature against FHI Figures 8 and 12 at load, and the start-up law below 40 % load. Usage: node tests/regress/bed_fig8.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54,null,{timeout:120000});
const r=await page.evaluate(()=>{const U={Tamb:30,Tb0:850},k=850/840;const pts=[[.43,.612,660],[.525,.557,722],[.626,.622,755],[.715,.716,778],[.86,.861,808],[1,1,840]].map(([f,a,t])=>[f,+AN.bedSS(U,f,a).toFixed(1),+(t*k).toFixed(1)]);
 return {pts,two:AN.bedSS(U,.09,.6),rich:AN.bedSS(U,.626,.8),air:AN.bedSS(U,.626,.622)}});
console.log(JSON.stringify(r));
for(const [f,g,w] of r.pts)ck(Math.abs(g-w)<1,'share '+f+': '+g+' C, Fig 8 scaled '+w);
ck(r.two>300&&r.two<520,'two burners at light-off air stay on the start-up law: '+r.two);
ck(r.rich<r.air-30,'more air cools the bed: '+r.rich+' against '+r.air);
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
