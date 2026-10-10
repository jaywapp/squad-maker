// node shot.cjs <html file or url> <out.png> <w> <h> [dpr] [waitMs] [fullPage=1]
const { chromium } = require('playwright-core');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const [src, out, w, h, dpr = '1', wait = '300', full = '1'] = process.argv.slice(2);
  const exe = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
  const b = await chromium.launch({ executablePath: exe });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
  await p.goto(src.startsWith('http') ? src : pathToFileURL(src).href);
  await p.waitForTimeout(+wait);
  await p.screenshot({ path: out, fullPage: full === '1' });
  await b.close();
})();
