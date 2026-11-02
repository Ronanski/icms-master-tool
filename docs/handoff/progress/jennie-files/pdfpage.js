// Render one PDF page to PNG with pdf.js inside headless Chrome: node pdfpage.js <pdf> <page> <out.png> [scale]
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
(async () => {
  const [pdf, pg, out, sc] = process.argv.slice(2);
  const b64 = fs.readFileSync(pdf).toString('base64');
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM });
  const p = await b.newPage({ viewport: { width: 1600, height: 1200 } });
  await p.setContent('<canvas id="c"></canvas>');
  await p.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js' });
  const n = await p.evaluate(async ([d, pg, sc]) => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const bytes = Uint8Array.from(atob(d), c => c.charCodeAt(0));
    const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
    const page = await doc.getPage(+pg);
    const vp = page.getViewport({ scale: +sc || 1.6 });
    const c = document.getElementById('c'); c.width = vp.width; c.height = vp.height;
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    return doc.numPages;
  }, [b64, pg, sc]);
  await (await p.$('#c')).screenshot({ path: out });
  console.log('pages', n);
  await b.close();
})();
