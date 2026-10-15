// prints the version of the html in dist/ (logic-sim-vX.Y.Z.html); --github writes version/tag/html to $GITHUB_OUTPUT
const fs=require('fs');const f=fs.readdirSync('dist').filter(x=>/^logic-sim-v\d+\.\d+\.\d+(?:-beta\.\d+)?\.html$/.test(x));
if(f.length!==1){console.error('expected exactly one logic-sim-vX.Y.Z.html in dist/, found: '+f.join(', '));process.exit(1)}
const v=f[0].match(/v(\d+\.\d+\.\d+(?:-beta\.\d+)?)\.html/)[1];
if(process.argv.includes('--github')&&process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`version=${v}\ntag=v${v}\nhtml=${f[0]}\n`);
console.log(v);
