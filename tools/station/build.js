// Builds the Operator Station page: the built logic-sim html plus the operator station frame (src/station).
// The logic-sim html itself is not changed.
// usage: node tools/station/build.js <built logic-sim html> <out dir | out file .html>
//   out dir  -> <out dir>/operator-station-v<ver>.html
//   out file -> that file (the site and the apk / exe use index.html)
// What differs from the logic-sim html, besides the frame:
//   - the address the update check and the channel switch ask (the site of the simulator) gets "station/" added, so the station
//     updates from its own pages (/station/ Stable, /station/beta/ Beta) and never swaps itself for the old app;
//   - the tab icon and the theme colour are the station's.
// The <title> stays "Logic Sim v<ver>": the update check of the app reads the version, and tells a complete download, from it.
// The name the user sees (window title, tab) is set by the frame at start (LS_STATION_NAME).
const fs = require('fs'),
  path = require('path');
const NAME = 'Unit 1 Operator Station',
  SITE = "'https://ronanski.github.io/icms-master-tool/'";
const root = path.resolve(__dirname, '..', '..'),
  src = process.argv[2],
  out = path.resolve(process.argv[3] || '.');
if (!src) throw new Error('usage: node tools/station/build.js <built logic-sim html> <out dir | out file .html>');
let h = fs.readFileSync(src, 'utf8');
const css = fs.readFileSync(path.join(root, 'src/station/station.css'), 'utf8'),
  frame = fs.readFileSync(path.join(root, 'src/station/station-frame.css'), 'utf8'),
  js = fs.readFileSync(path.join(root, 'src/station/station.js'), 'utf8'),
  png = n =>
    'data:image/png;base64,' +
    fs.readFileSync(path.join(root, 'delivery/station/icons/png/icon-' + n + '.png')).toString('base64');
const ver =
  (path.basename(src).match(/v(\d.+)\.html$/) || h.match(/<title>[^<]*?v(\d+(?:\.\d+)+(?:-beta\.\d+)?)/) || [])[1] ||
  'dev';
const i = h.lastIndexOf('</body>');
if (i < 0) throw new Error('no </body> in ' + src);
h =
  h.slice(0, i) +
  '<style id="stationcss">' +
  css +
  '</style><script id="stationjs">window.LS_STATION=1;window.LS_STATION_NAME=' +
  JSON.stringify(NAME) +
  ';window.LS_STATION_VER=' +
  JSON.stringify('v' + ver) +
  ';window.LS_STATION_CSS=' +
  JSON.stringify(frame).split('</').join('<\\/') +
  ';' +
  js.split('</script').join('<\\/script') +
  '</script>' +
  h.slice(i);
const n = h.split(SITE).length - 1;
if (!n) throw new Error('the site address of the update check was not found in ' + src);
h = h.split(SITE).join(SITE.slice(0, -1) + "station/'");
const swap = (re, to, what) => {
  if (!re.test(h)) throw new Error(what + ' not found in ' + src);
  h = h.replace(re, to);
};
swap(/<link rel="icon"[^>]*>/, '<link rel="icon" type="image/png" sizes="64x64" href="' + png(64) + '">', 'tab icon');
swap(/<link rel="apple-touch-icon"[^>]*>/, '<link rel="apple-touch-icon" href="' + png(192) + '">', 'touch icon');
swap(/<meta name="theme-color"[^>]*>/, '<meta name="theme-color" content="#14181c">', 'theme colour');
const f = /\.html$/i.test(out) ? out : path.join(out, 'operator-station-v' + ver + '.html');
fs.mkdirSync(path.dirname(f), { recursive: true });
fs.writeFileSync(f, h);
console.log('built', f, h.length, '| site address changed in', n, 'places');
