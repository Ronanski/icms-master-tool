// Builds operator-station-v<ver>.html: the built logic-sim html plus the operator station frame (src/station).
// The logic-sim html itself is not changed.
// usage: node tools/station/build.js <built logic-sim html> <out dir>
const fs = require('fs'),
  path = require('path');
const root = path.resolve(__dirname, '..', '..'),
  src = process.argv[2],
  out = path.resolve(process.argv[3] || '.');
let h = fs.readFileSync(src, 'utf8');
const css = fs.readFileSync(path.join(root, 'src/station/station.css'), 'utf8'),
  frame = fs.readFileSync(path.join(root, 'src/station/station-frame.css'), 'utf8'),
  js = fs.readFileSync(path.join(root, 'src/station/station.js'), 'utf8');
const i = h.lastIndexOf('</body>');
if (i < 0) throw new Error('no </body> in ' + src);
h =
  h.slice(0, i) +
  '<style id="stationcss">' +
  css +
  '</style><script id="stationjs">window.LS_STATION=1;window.LS_STATION_CSS=' +
  JSON.stringify(frame).split('</').join('<\\/') +
  ';' +
  js.split('</script').join('<\\/script') +
  '</script>' +
  h.slice(i);
h = h.replace(/<title>[^<]*<\/title>/, '<title>Unit 1 Operator Station</title>');
const ver = (path.basename(src).match(/v(.+)\.html$/) || [])[1] || 'dev';
fs.mkdirSync(out, { recursive: true });
const f = path.join(out, 'operator-station-v' + ver + '.html');
fs.writeFileSync(f, h);
console.log('built', f, h.length);
