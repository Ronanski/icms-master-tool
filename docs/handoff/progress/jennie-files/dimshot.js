const { chromium } = require('C:/Users/Ronanski/Downloads/app-projects-ai-collections/projects/icms-master-tool/icms-master-tool/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
 const p = await b.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
 await p.goto('file:///C:/Users/Ronanski/Downloads/app-projects-ai-collections/projects/icms-master-tool/team-files/hmi-mockups/furnace-cyclone-study.html');
 await (await p.$('#dims svg')).screenshot({ path: process.argv[2] }); await b.close(); })();
