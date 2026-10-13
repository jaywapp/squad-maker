// node frames.cjs <intro.html> <outDir> <w> <h> <dpr>  -> frame PNGs at fixed times + final
const { chromium } = require('playwright-core');
const path = require('path'); const fs = require('fs');
const { pathToFileURL } = require('url');
(async () => {
  const [src, out, w, h, dpr] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe') });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
  await p.goto(pathToFileURL(src).href);
  await p.evaluate(() => document.getAnimations().forEach(a => a.pause()));
  for (let t = 0; t <= 1600; t += 50) {
    await p.evaluate(t => document.getAnimations().forEach(a => { a.currentTime = t; }), t);
    await p.screenshot({ path: path.join(out, `f${String(t).padStart(4, '0')}.png`) });
  }
  await b.close();
})();
