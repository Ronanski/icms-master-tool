// Makes the icon files of the Operator Station from delivery/station/icon.svg (run by hand after the svg changes; the files are committed).
// usage: node tools/station/icons.js <path of the playwright package> [chrome executable]
// out: delivery/station/icons/png/icon-<n>.png, icon.ico, android/res/mipmap-*/ic_launcher*.png + values/ic_launcher_background.xml,
//      delivery/station/pwa/icon-192.png + icon-512.png
const fs = require('fs'),
  path = require('path');
const root = path.resolve(__dirname, '..', '..'),
  dir = path.join(root, 'delivery', 'station'),
  svg = fs.readFileSync(path.join(dir, 'icon.svg'), 'utf8'),
  /* the adaptive icon of Android: the marks only (the plate is the background colour of the launcher) */
  fore = svg.replace(/<rect[^>]*rx="88"[^>]*\/>\s*/g, ''),
  PLATE = '#14181C';
if (fore === svg) throw new Error('icon.svg: no plate rect (rx="88") found');
const uri = s => 'data:image/svg+xml;base64,' + Buffer.from(s).toString('base64');
const put = (f, b) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, b);
};
(async () => {
  const { chromium } = require(process.argv[2]);
  const b = await chromium.launch(
    process.argv[3] ? { executablePath: process.argv[3], headless: true } : { headless: true }
  );
  const p = await (await b.newContext({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 1 })).newPage();
  /* kind: 'sq' the icon as drawn, 'round' the marks at 78 % on a circle of the plate colour, 'fore' the marks at 66 % on a clear ground */
  const shot = async (n, kind) => {
    const img =
      kind === 'fore'
        ? `<img src="${uri(fore)}" style="width:66%;height:66%;margin:17%">`
        : kind === 'round'
          ? `<img src="${uri(fore)}" style="width:78%;height:78%;margin:11%">`
          : `<img src="${uri(svg)}" style="width:100%;height:100%">`;
    await p.setContent(
      `<body style="margin:0;background:transparent"><div id="i" style="width:${n}px;height:${n}px;overflow:hidden;${kind === 'round' ? 'border-radius:50%;background:' + PLATE : ''}">${img}</div></body>`
    );
    return p.locator('#i').screenshot({ omitBackground: true });
  };
  const png = {};
  for (const n of [16, 24, 32, 48, 64, 128, 192, 256, 512]) {
    png[n] = await shot(n, 'sq');
    put(path.join(dir, 'icons', 'png', 'icon-' + n + '.png'), png[n]);
  }
  put(path.join(dir, 'pwa', 'icon-192.png'), png[192]);
  put(path.join(dir, 'pwa', 'icon-512.png'), png[512]);
  /* ico: a directory of png pictures (16 to 256), as Windows reads it since Vista */
  const S = [16, 24, 32, 48, 64, 128, 256],
    head = Buffer.alloc(6 + 16 * S.length);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(S.length, 4);
  let off = head.length;
  S.forEach((n, i) => {
    const e = 6 + 16 * i;
    head[e] = n === 256 ? 0 : n;
    head[e + 1] = n === 256 ? 0 : n;
    head.writeUInt16LE(1, e + 4);
    head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(png[n].length, e + 8);
    head.writeUInt32LE(off, e + 12);
    off += png[n].length;
  });
  put(path.join(dir, 'icons', 'icon.ico'), Buffer.concat([head, ...S.map(n => png[n])]));
  for (const [d, n] of [
    ['mdpi', 48],
    ['hdpi', 72],
    ['xhdpi', 96],
    ['xxhdpi', 144],
    ['xxxhdpi', 192]
  ]) {
    const r = path.join(dir, 'icons', 'android', 'res', 'mipmap-' + d);
    put(path.join(r, 'ic_launcher.png'), await shot(n, 'sq'));
    put(path.join(r, 'ic_launcher_round.png'), await shot(n, 'round'));
    put(path.join(r, 'ic_launcher_foreground.png'), await shot((n * 108) / 48, 'fore'));
  }
  put(
    path.join(dir, 'icons', 'android', 'res', 'values', 'ic_launcher_background.xml'),
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">' +
      PLATE +
      '</color>\n</resources>\n'
  );
  await b.close();
  console.log('icons made in', path.join(dir, 'icons'));
})().catch(e => {
  console.error(e);
  process.exit(1);
});
