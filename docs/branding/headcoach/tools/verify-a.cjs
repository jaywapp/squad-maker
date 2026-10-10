// Verify package A snippets on the Run Line (PR #47) code copy. node verify-a.cjs <url> <outDir>
const { chromium } = require('playwright-core');
const path = require('path'); const fs = require('fs');
(async () => {
  const [url, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe') });
  const res = {};
  const errs = [];
  // 1. web, mobile + desktop
  for (const [id, opt] of [['390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['1280', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const ctx = await b.newContext(opt); const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error') errs.push(`${id}: ${m.text()}`); });
    p.on('pageerror', e => errs.push(`${id}: ${e.message}`));
    await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    res[`web-${id}`] = await p.evaluate(() => {
      const logo = document.querySelector('h1.wordmark svg.wordmark-logo');
      const r = logo.getBoundingClientRect();
      return { intro: !!document.getElementById('brandIntro'), label: logo.getAttribute('aria-label'), h: Math.round(r.height), w: Math.round(r.width), title: document.title, overflowX: document.documentElement.scrollWidth > innerWidth };
    });
    await p.screenshot({ path: path.join(out, `header-${id}.png`), clip: { x: 0, y: 0, width: opt.viewport.width, height: id === '390' ? 150 : 120 } });
    await ctx.close();
  }
  // 2. native emulation: intro shows, then closes after ready
  for (const reduce of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    await ctx.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true }; });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(`native: ${e.message}`));
    const t0 = Date.now();
    await p.goto(url);
    const shown = await p.locator('#brandIntro').isVisible().catch(() => false);
    if (!reduce) {
      await p.evaluate(() => document.getAnimations().forEach(a => a.pause()));
      await p.evaluate(() => document.getAnimations().forEach(a => { a.currentTime = 1400; }));
      await p.screenshot({ path: path.join(out, 'intro-final-360@3x.png') });
      await p.evaluate(() => document.getAnimations().forEach(a => a.play()));
    }
    await p.waitForSelector('#brandIntro', { state: 'detached', timeout: 8000 });
    res[`native${reduce ? '-reduced' : ''}`] = { shown, closedAfterMs: Date.now() - t0, label: 'ok' };
    await ctx.close();
  }
  res.errors = errs;
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
