// Release report PDF from a markdown file (simple: #, ##, bullets, **bold**, `code`). Usage: node tools/build/report-pdf.js in.md out.pdf
const fs=require('fs');const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const inl=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`(.+?)`/g,'<code>$1</code>');
const [,, inp, out]=process.argv;let h='',ul=false;
for(const l of fs.readFileSync(inp,'utf8').split('\n')){const b=/^\s*[-*] (.*)/.exec(l);
 if(ul&&!b){h+='</ul>';ul=false}
 if(b){if(!ul){h+='<ul>';ul=true}h+='<li>'+inl(b[1])+'</li>'}
 else if(/^### /.test(l))h+='<h3>'+inl(l.slice(4))+'</h3>';else if(/^## /.test(l))h+='<h2>'+inl(l.slice(3))+'</h2>';else if(/^# /.test(l))h+='<h1>'+inl(l.slice(2))+'</h1>';
 else if(l.trim())h+='<p>'+inl(l)+'</p>'}
if(ul)h+='</ul>';
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const pg=await br.newPage();
await pg.setContent('<meta charset=utf-8><style>body{font:12px/1.45 system-ui,sans-serif;margin:0;color:#111}h1{font-size:20px}h2{font-size:15px;margin-top:18px;border-bottom:1px solid #999}code{background:#eee;padding:0 3px}li{margin:2px 0}</style>'+h);
await pg.pdf({path:out,format:'A4',margin:{top:'18mm',bottom:'18mm',left:'16mm',right:'16mm'}});await br.close()})();
