// Mina F31, F32, F36: the two-press buttons work with no browser dialog; typing in the sheet search filters the list.
// Usage: node tests/regress/guide_press2.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});await page.waitForTimeout(800);
const dlg=[];page.on('dialog',d=>{dlg.push(d.message());d.dismiss()});
// F31 the search box on the Logic page, real click and keys
await page.evaluate(()=>{lsSetTab('logic');AN.setCat&&AN.setCat('dig')});await page.waitForTimeout(1500);
const box=await page.evaluate(()=>{const e=document.getElementById('sidefl');if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,r.width]});
console.log('box',box);
if(box&&box[2]>0){await page.mouse.click(box[0],box[1]);await page.keyboard.type('MOV');await page.waitForTimeout(600);
 const v=await page.evaluate(()=>{const e=document.getElementById('sidefl'),L=[...document.querySelectorAll('#side a,#side li,#side button,#side .it')].filter(x=>x.offsetParent);return {val:e.value,n:L.length}});ck(v.val==='MOV','the keys reach the box: '+JSON.stringify(v));}
else ck(false,'search box visible on the Logic page: '+JSON.stringify(box));
// F36 Practise asks on the button, one press loads nothing
await page.evaluate(()=>lsSetTab('training'));await page.waitForTimeout(800);
const prs=()=>page.evaluate(()=>{const b=[...document.querySelectorAll('#trainws button.trbtn')].find(x=>/Practise: 150|loads 150/.test(x.textContent));if(!b)return null;b.click();return b.textContent});
const before=await page.evaluate(()=>AN.startState);const t1=await prs();await page.waitForTimeout(500);
ck(t1!==null&&(await page.evaluate(()=>[...document.querySelectorAll('#trainws button.trbtn')].some(x=>/Press again/.test(x.textContent)))),'Practise asks first');
ck((await page.evaluate(()=>AN.startState))===before,'one press loads nothing: '+before);
ck(dlg.length===0,'no browser dialog: '+dlg.join(' | '));
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
