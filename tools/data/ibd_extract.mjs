// IBD PDF -> segments + text with positions, one JSON per page. Usage: node ibdx.mjs <pdf> <outdir>
import fs from 'fs';
const root = 'C:/Users/Ronanski/Downloads/app-projects-ai-collections/projects/icms-master-tool/team-files/tools/pdf-render/node_modules/pdfjs-dist';
const pdfjs = await import('file:///' + root + '/legacy/build/pdf.mjs');
const d = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(process.argv[2])), verbosity: 0 }).promise;
const O = pdfjs.OPS;
const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const r1 = x => Math.round(x * 10) / 10;
const dec = s => (/^[\x20-\x60]*[A-Z]/.test(s) ? s : s);
const sum = [];
for (let p = 1; p <= d.numPages; p++) {
  const g = await d.getPage(p),
    ol = await g.getOperatorList(),
    tc = await g.getTextContent();
  let m = [1, 0, 0, 1, 0, 0];
  const st = [],
    segs = [],
    curves = [];
  ol.fnArray.forEach((f, i) => {
    const a = ol.argsArray[i];
    if (f === O.save) st.push(m.slice());
    else if (f === O.restore) m = st.pop() || m;
    else if (f === O.transform) m = mul(m, a);
    else if (f === O.constructPath) {
      const ops = a[0],
        c = a[1];
      let k = 0,
        x0 = 0,
        y0 = 0,
        sx = 0,
        sy = 0;
      for (const op of ops) {
        if (op === O.moveTo) {
          [x0, y0] = ap(m, c[k], c[k + 1]);
          sx = x0;
          sy = y0;
          k += 2;
        } else if (op === O.lineTo) {
          const [x, y] = ap(m, c[k], c[k + 1]);
          k += 2;
          segs.push([r1(x0), r1(y0), r1(x), r1(y)]);
          x0 = x;
          y0 = y;
        } else if (op === O.curveTo) {
          const [x, y] = ap(m, c[k + 4], c[k + 5]);
          k += 6;
          curves.push([r1(x0), r1(y0), r1(x), r1(y)]);
          x0 = x;
          y0 = y;
        } else if (op === O.curveTo2 || op === O.curveTo3) {
          const [x, y] = ap(m, c[k + 2], c[k + 3]);
          k += 4;
          curves.push([r1(x0), r1(y0), r1(x), r1(y)]);
          x0 = x;
          y0 = y;
        } else if (op === O.rectangle) {
          const [x, y] = ap(m, c[k], c[k + 1]),
            [x2, y2] = ap(m, c[k] + c[k + 2], c[k + 1] + c[k + 3]);
          k += 4;
          segs.push([r1(x), r1(y), r1(x2), r1(y)], [r1(x2), r1(y), r1(x2), r1(y2)], [r1(x2), r1(y2), r1(x), r1(y2)], [r1(x), r1(y2), r1(x), r1(y)]);
        } else if (op === O.closePath) {
          segs.push([r1(x0), r1(y0), r1(sx), r1(sy)]);
          x0 = sx;
          y0 = sy;
        }
      }
    }
  });
  const texts = tc.items.filter(t => t.str.trim()).map(t => ({ s: t.str, x: r1(t.transform[4]), y: r1(t.transform[5]), h: r1(Math.hypot(t.transform[2], t.transform[3])), w: r1(t.width), a: Math.round((Math.atan2(t.transform[1], t.transform[0]) * 180) / Math.PI), f: t.fontName }));
  fs.writeFileSync(process.argv[3] + '/p' + p + '.json', JSON.stringify({ p, segs, curves, texts }));
  const cnt = re => texts.filter(t => re.test(t.s.trim())).length;
  sum.push([p, segs.length, curves.length, texts.length, 'A' + cnt(/^A$/), 'OR' + cnt(/^OR$/), 'CMP' + cnt(/^CMP$/), 'DI' + cnt(/^(DI|DT)$/), 'S' + cnt(/^S$/), 'R' + cnt(/^R$/), 'V' + cnt(/^\d\/\d$/)].join(' '));
}
fs.writeFileSync(process.argv[3] + '/summary.txt', sum.join('\n') + '\n');
console.log('done', sum.length);
