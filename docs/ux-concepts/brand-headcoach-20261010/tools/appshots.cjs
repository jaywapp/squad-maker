// Inject concept header lockups into the real app (current main) and capture header crops.
// node appshots.cjs <appUrl> <conceptsDir> <outDir>
const { chromium } = require('playwright-core');
const path = require('path'); const fs = require('fs');
(async () => {
  const [url, dir, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe') });
  const variants = [
    { id: 'current', svg: null },
    { id: 'concept-01', svg: fs.readFileSync(path.join(dir, 'concept-01/assets/logo-header.svg'), 'utf8') },
    { id: 'concept-02', svg: fs.readFileSync(path.join(dir, 'concept-02/assets/logo-header.svg'), 'utf8') },
  ];
  const views = [
    { id: '390', ctx: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, h: 28, clipH: 150 },
    { id: '1280', ctx: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }, h: 32, clipH: 120 },
  ];
  for (const v of views) {
    const ctx = await b.newContext(v.ctx);
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    for (const c of variants) {
      if (c.svg) {
        await p.evaluate(({ svg, h }) => {
          const h1 = document.querySelector('h1.wordmark');
          h1.innerHTML = svg.replace(/<!--[\s\S]*?-->/g, '');
          const s = h1.querySelector('svg');
          s.removeAttribute('width'); s.removeAttribute('height');
          s.style.cssText = `height:${h}px;width:auto;display:block`;
          h1.style.cssText = 'display:flex;align-items:center;line-height:0;letter-spacing:0';
          document.title = '아이엠 헤드코치';
        }, { svg: c.svg, h: v.h });
        await p.waitForTimeout(150);
      }
      await p.screenshot({ path: path.join(out, `header-${c.id}-${v.id}.png`), clip: { x: 0, y: 0, width: v.ctx.viewport.width, height: v.clipH } });
      if (v.id === '390') await p.screenshot({ path: path.join(out, `screen-${c.id}-390.png`) });
    }
    await ctx.close();
  }
  await b.close();
})();
