// Puts the shell (css + js) into the html between markers. Idempotent. Usage: node src/ui/shell/inject.js [html]
const fs=require('fs');
const html=process.argv[2]||fs.readdirSync('dist').map(x=>'dist/'+x).find(x=>/logic-sim-v\d+\.\d+\.\d+\.html$/.test(x));
let s=fs.readFileSync(html,'utf8');const A='<!--SHELL-BEGIN-->',B='<!--SHELL-END-->';
const i=s.indexOf(A);if(i>=0){const j=s.indexOf(B);s=s.slice(0,i)+s.slice(j+B.length)}
const block=A+'<style id="shellcss">'+fs.readFileSync(__dirname+'/shell.css','utf8')+'</style><script id="shelljs">'+fs.readFileSync(__dirname+'/shell.js','utf8')+'</script>'+B;
const k=s.lastIndexOf('</body>');fs.writeFileSync(html,s.slice(0,k)+block+s.slice(k));console.log('shell injected into',html);
