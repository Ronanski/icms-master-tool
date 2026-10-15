// Headless driver for logic-sim: opens the HTML, switches to the Analog (ABC) category, waits until the 54 sheets are loaded.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
async function open(html){
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const page=await browser.newPage();const errs=[];
  page.on('pageerror',e=>errs.push(String(e.message)));
  await page.goto('file://'+require('path').resolve(html));
  await page.waitForTimeout(1500);
  await page.evaluate(()=>AN.setCat('an'));
  await page.waitForFunction(()=>window.AN&&AN.sheets&&AN.sheets.length>=54,null,{timeout:60000});
  await page.waitForTimeout(500);
  return {browser,page,errs};
}
module.exports={open};
