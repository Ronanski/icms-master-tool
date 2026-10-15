// Puts the shell (css + js) into the html between markers. Idempotent. Usage: node src/ui/shell/inject.js [html]
const fs = require('fs');
const html =
  process.argv[2] ||
  fs
    .readdirSync('dist')
    .map(x => 'dist/' + x)
    .find(x => /logic-sim-v\d+\.\d+\.\d+(?:-beta\.\d+)?\.html$/.test(x));
let s = fs.readFileSync(html, 'utf8');
const A = '<!--SHELL-BEGIN-->',
  B = '<!--SHELL-END-->';
const i = s.indexOf(A);
if (i >= 0) {
  const j = s.indexOf(B);
  s = s.slice(0, i) + s.slice(j + B.length);
}
/* fonts built into the app (offline), OFL licences in src/ui/fonts (1.23.0) */
const FD = __dirname + '/../fonts/',
  FACES = [
    ['Inter', 'inter', [400, 600]],
    ['JetBrains Mono', 'jetbrains-mono', [400, 600]],
    ['IBM Plex Sans', 'ibm-plex-sans', [400, 600]],
    ['IBM Plex Mono', 'ibm-plex-mono', [400, 600]],
    ['Roboto', 'roboto', [400, 500]],
    ['Roboto Mono', 'roboto-mono', [400, 600]]
  ],
  fontCss = FACES.map(([fam, f, ws]) =>
    ws
      .map(
        w =>
          "@font-face{font-family:'" +
          fam +
          "';font-style:normal;font-weight:" +
          (w === 500 ? '500 700' : w === 600 ? '600 700' : w) +
          ';font-display:swap;src:url(data:font/woff2;base64,' +
          fs.readFileSync(FD + f + '-latin-' + w + '-normal.woff2').toString('base64') +
          ") format('woff2')}"
      )
      .join('')
  ).join('');
const block =
  A +
  '<style id="fontcss">' +
  fontCss +
  '</style><style id="shellcss">' +
  fs.readFileSync(__dirname + '/shell.css', 'utf8') +
  '</style><script id="shelljs">' +
  fs.readFileSync(__dirname + '/shell.js', 'utf8') +
  '</script>' +
  B;
const k = s.lastIndexOf('</body>');
fs.writeFileSync(html, s.slice(0, k) + block + s.slice(k));
console.log('shell injected into', html);
