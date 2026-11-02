// node pdfclip.js <pdf> <page> <outprefix> <scale> <rotation> <cols> <rows>  -> renders rotated page, splits into tiles
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
(async () => {
  const [pdf, pg, out, sc, rot, fx, fy, fw, fh] = process.argv.slice(2);
  const b64 = fs.readFileSync(pdf).toString('base64');
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM });
  const p = await b.newPage({ viewport: { width: 1600, height: 1200 } });
  await p.setContent('<body style="margin:0"><canvas id="c"></canvas></body>');
  await p.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js' });
  const dim = await p.evaluate(async ([d, pg, sc, rot]) => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const bytes = Uint8Array.from(atob(d), c => c.charCodeAt(0));
    const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
    const page = await doc.getPage(+pg);
    const vp = page.getViewport({ scale: +sc, rotation: +rot });
    const c = document.getElementById('c'); c.width = vp.width; c.height = vp.height;
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    return [vp.width, vp.height, doc.numPages];
  }, [b64, pg, sc, rot]);
  await p.setViewportSize({ width: Math.ceil(dim[0]), height: Math.ceil(dim[1]) });
  await p.screenshot({ path: out, clip: { x: dim[0]*fx, y: dim[1]*fy, width: dim[0]*fw, height: dim[1]*fh } });
  console.log('dim', dim);
  await b.close();
})();
