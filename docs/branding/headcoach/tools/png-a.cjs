// Render package A SVGs to transparent PNGs at fixed display heights and densities.
// Usage: node png-a.cjs <packageDir>
const { chromium } = require('playwright-core');
const path = require('path'); const fs = require('fs');
const pkg = process.argv[2];
const jobs = [
  ['logo-header.svg', [28, 32], [1, 2, 3]],
  ['logo-horizontal.svg', [48, 64], [1, 2, 3]],
  ['wordmark.svg', [64], [1, 2, 3]],
  ['logo-header-on-light.svg', [28, 32], [2, 3]],
  ['logo-horizontal-on-light.svg', [64], [2, 3]],
];
(async () => {
  const b = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe') });
  const outDir = path.join(pkg, 'assets/png');
  fs.mkdirSync(outDir, { recursive: true });
  const list = [];
  for (const [file, heights, scales] of jobs) {
    const src = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(pkg, 'assets/svg', file)).toString('base64');
    for (const h of heights) for (const s of scales) {
      const p = await b.newPage({ deviceScaleFactor: s, viewport: { width: 800, height: 200 } });
      await p.setContent(`<html><body style="margin:0;background:transparent"><img id="i" src="${src}" style="height:${h}px;width:auto;display:block"></body></html>`);
      await p.waitForFunction(() => { const i = document.getElementById('i'); return i.complete && i.naturalWidth > 0; });
      const el = await p.$('#i');
      const name = `${file.replace('.svg', '')}-${h}@${s}x.png`;
      await el.screenshot({ path: path.join(outDir, name), omitBackground: true });
      const box = await el.boundingBox();
      list.push(`${name} ${Math.round(box.width * s)}x${h * s}`);
      await p.close();
    }
  }
  await b.close();
  console.log(list.join('\n'));
})();
