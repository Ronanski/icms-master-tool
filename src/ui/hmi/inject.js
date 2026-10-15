// Puts the operator faceplate (css + js) into the html between markers. Idempotent. Usage: node src/ui/hmi/inject.js [html]
const fs = require('fs');
const html =
  process.argv[2] ||
  fs
    .readdirSync('dist')
    .map(x => 'dist/' + x)
    .find(x => /logic-sim-v\d+\.\d+\.\d+(?:-beta\.\d+)?\.html$/.test(x));
let s = fs.readFileSync(html, 'utf8');
const A = '<!--HMI-BEGIN-->',
  B = '<!--HMI-END-->';
const i = s.indexOf(A);
if (i >= 0) {
  const j = s.indexOf(B);
  s = s.slice(0, i) + s.slice(j + B.length);
}
const block =
  A +
  '<style id="hmicss">' +
  fs.readFileSync(__dirname + '/hmi.css', 'utf8') +
  '</style><script id="hmijs">' +
  fs.readFileSync(__dirname + '/hmi.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/overview.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/events.js', 'utf8') +
  '</script><style id="plantcss">' +
  fs.readFileSync(__dirname + '/../plant/plant.css', 'utf8') +
  '</style><script id="plantjs">' +
  (fs.existsSync(__dirname + '/../plant/systems.js') ? fs.readFileSync(__dirname + '/../plant/systems.js', 'utf8') : '') +
  '\n' +
  fs.readFileSync(__dirname + '/../plant/values.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/../plant/plant.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/../plant/library.js', 'utf8') +
  '</script>' +
  B;
const k = s.lastIndexOf('</body>');
fs.writeFileSync(html, s.slice(0, k) + block + s.slice(k));
console.log('operator faceplate injected into', html);
