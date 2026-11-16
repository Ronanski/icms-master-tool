const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});
await p.goto('file:///mnt/project-files/tutor-2026-11-11/signal-path-finder.html');await p.waitForTimeout(900);
await p.evaluate(()=>{document.getElementById('q').value=BY['AO0582'].g;render(BY['AO0582'])});await p.waitForTimeout(600);
const r=await p.evaluate(()=>{const m={};document.querySelectorAll('body *').forEach(e=>{if(e.closest('svg')&&e.tagName!=='text')return;const t=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(!t)return;const c=getComputedStyle(e);const k=c.fontFamily.split(',')[0]+' '+c.fontSize+' '+c.fontWeight+(e.tagName==='text'?' svg':'');(m[k]=m[k]||[]).push((e.className.baseVal??e.className)+':'+e.textContent.trim().slice(0,20))});return Object.entries(m).map(([k,v])=>k+' x'+v.length+'  e.g. '+v.slice(0,2).join(' | ')).sort()});
console.log(r.join('\n'));await b.close()})();
