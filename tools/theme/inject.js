// Injects the diagram / UI themes (css + js) into the html between markers. Idempotent. Usage: node tools/theme/inject.js [html]
const fs=require('fs');
const html=process.argv[2]||fs.readdirSync('.').find(x=>/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x));
let s=fs.readFileSync(html,'utf8');const A='<!--THEME-BEGIN-->',B='<!--THEME-END-->';
const i=s.indexOf(A);if(i>=0){const j=s.indexOf(B);s=s.slice(0,i)+s.slice(j+B.length)}
const block=A+'<style id="themecss">'+fs.readFileSync(__dirname+'/theme.css','utf8')+'</style><script id="themejs">'+fs.readFileSync(__dirname+'/theme.js','utf8')+'</script>'+B;
const k=s.lastIndexOf('</body>');fs.writeFileSync(html,s.slice(0,k)+block+s.slice(k));console.log('theme injected into',html);
