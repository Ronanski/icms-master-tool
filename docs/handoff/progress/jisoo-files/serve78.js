const http=require('http'),fs=require('fs'),path=require('path');
const f=path.join(__dirname,'worker78','index.html');
http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(f).pipe(r);}).listen(5178,()=>console.log('serving 5178'));
