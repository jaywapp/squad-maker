async (page) => {
  // A UI 화면 검증 (docs/a-ui-20261007-tasks.md V-02). 임시 데이터만 사용, 외부 전송 없음.
  const BASE = 'http://127.0.0.1:4320/index.html';
  const SHOTS = 'D:/station/.worktrees/squad-maker-a-ui-20261007/docs/a-ui-20261007/screenshots/';
  const browser = page.context().browser();
  const report = {};

  const metrics = p => p.evaluate(() => {
    const W = document.documentElement.clientWidth, H = innerHeight;
    const lum = c => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return { L: 0.2126 * r + 0.7152 * g + 0.0722 * b, a: m[3] === undefined ? 1 : +m[3] }; };
    const bgOf = el => { while (el) { const l = lum(getComputedStyle(el).backgroundColor); if (l && l.a > 0.9) return l.L; el = el.parentElement; } return lum(getComputedStyle(document.body).backgroundColor).L; };
    const low = [];
    document.querySelectorAll('body *').forEach(el => {
      if (el.closest('#field, canvas, .sr-only, #saveStatus')) return;
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === 'hidden' || r.bottom < 0 || r.top > H) return;
      const fg = lum(cs.color); if (!fg) return;
      const bg = bgOf(el); const ratio = (Math.max(fg.L, bg) + 0.05) / (Math.min(fg.L, bg) + 0.05);
      const fs = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
      if (ratio < ((fs >= 24 || (bold && fs >= 18.66)) ? 3 : 4.5)) low.push(el.textContent.trim().slice(0, 14) + ' ' + ratio.toFixed(2));
    });
    const coarse = matchMedia('(pointer: coarse)').matches;
    const min = coarse ? 47.5 : 39.5;
    const small = [...document.querySelectorAll('button, a[href], input, select, textarea, [role=button], [role=tab]')].filter(e => {
      if (e.closest('#field')) return false;
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && r.top < H && r.bottom > 0 && (r.height < min || r.width < min);
    }).map(e => ((e.getAttribute('aria-label') || e.innerText || e.id || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 16)) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
    const label = document.querySelector('#field .player-name');
    const circle = document.querySelector('#field .player-circle');
    return { overflowX: document.documentElement.scrollWidth - W, lowContrast: [...new Set(low)].slice(0, 10), smallTargets: small.slice(0, 12),
      nameFontPx: label ? +(label.getBoundingClientRect().height / 1.35).toFixed(1) : null,
      tokenPx: circle ? Math.round(circle.getBoundingClientRect().width) : null };
  });
  const box = async (p, sel) => p.locator(sel).first().boundingBox();
  const snap = p => p.evaluate(() => { const s = window.SquadMakerContract.getState(); return { sel: s.view.selectedPlayerId, pat: s.view.patternIndex, step: s.view.stepIndex, rev: s.revision, file: s.localLibrary.fileId, y: scrollY }; });
  const open = async (vp, opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.m ? 2 : 1, isMobile: vp.m, hasTouch: vp.m, locale: 'ko-KR', reducedMotion: opts.reducedMotion || 'no-preference' });
    if (opts.init) await ctx.addInitScript(opts.init);
    const p = await ctx.newPage();
    p._errs = []; p.on('pageerror', e => p._errs.push(e.message));
    p.on('dialog', d => d.dismiss());
    await p.goto(BASE); await p.evaluate(() => window.SquadMakerContract.ready());
    await p.waitForTimeout(300);
    return { ctx, p };
  };
  const selectPlayer = async (p, vp, index = 7) => {
    const el = p.locator('#field .player').nth(index); const b = await el.boundingBox();
    if (vp.m) await p.touchscreen.tap(b.x + b.width / 2, b.y + 12); else await el.click();
    await p.waitForTimeout(350);
  };

  const viewports = [
    { n: 'm360', w: 360, h: 800, m: true }, { n: 'm390', w: 390, h: 844, m: true }, { n: 'm412', w: 412, h: 915, m: true },
    { n: 'd1366', w: 1366, h: 768, m: false }, { n: 'd1440', w: 1440, h: 900, m: false },
  ];
  for (const vp of viewports) {
    const r = report[vp.n] = {};
    const { ctx, p } = await open(vp);
    r.initial = await metrics(p);
    await selectPlayer(p, vp);
    const field = await box(p, '#fieldWrapper'), tools = await box(p, '#playerActions');
    r.selected = (await snap(p)).sel;
    r.pitchAndTools = { fieldBottom: Math.round(field.y + field.height), toolsTop: Math.round(tools.y), toolsBottom: Math.round(tools.y + tools.height),
      bothInView: field.y >= 0 && tools.y + tools.height <= vp.h && (vp.m ? field.y + field.height <= tools.y + 0.5 : true) && tools.x + tools.width <= vp.w + 0.5 };
    r.selectedMetrics = await metrics(p);
    await p.screenshot({ path: SHOTS + `${vp.n}-select.png` });
    const before = await snap(p);
    await p.locator('#fileTitleBtn').click(); await p.waitForTimeout(350);
    await p.screenshot({ path: SHOTS + `${vp.n}-library.png` });
    r.libraryInView = await p.evaluate(() => { const b = document.querySelector('#librarySheet .ui-sheet-panel').getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth + 0.5 && b.top >= 0; });
    await p.locator('#libraryCloseBtn').click(); await p.waitForTimeout(250);
    const after = await snap(p);
    r.libraryRoundTrip = { same: JSON.stringify(before) === JSON.stringify(after), focusBack: await p.evaluate(() => document.activeElement?.id) };
    await p.locator('#exportOpenBtn').click(); await p.waitForTimeout(350);
    await p.screenshot({ path: SHOTS + `${vp.n}-export.png` });
    r.exportInView = await p.evaluate(() => { const b = document.getElementById('exportPanel').getBoundingClientRect(); return b.left >= -0.5 && b.right <= innerWidth + 0.5 && b.top >= 0; });
    r.exportMetrics = await metrics(p);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    r.exportClosedByEsc = await p.evaluate(() => !document.getElementById('exportPanel').classList.contains('as-sheet'));
    await p.locator('.app-tab[data-app="pattern"]').click(); await p.waitForTimeout(450);
    await p.evaluate(() => scrollTo(0, 0));
    const play = await box(p, '#playBtn'), next = await box(p, '[aria-label="다음 단계"]'), prev = await box(p, '[aria-label="이전 단계"]');
    r.patternControls = { playInView: play.x >= 0 && play.x + play.width <= vp.w + 0.5 && play.y + play.height <= vp.h, nextInView: next.x + next.width <= vp.w + 0.5 && next.y + next.height <= vp.h,
      prevInView: prev.x >= 0, playBottom: Math.round(play.y + play.height) };
    r.patternMetrics = await metrics(p);
    await p.screenshot({ path: SHOTS + `${vp.n}-pattern.png` });
    r.errors = p._errs;
    await ctx.close();
  }

  // 긴 한글 이름 + 글자 200% (360) — 데모용 메모리 조작, 저장하지 않음
  {
    const vp = { n: 'm360-long-large', w: 360, h: 800, m: true };
    const { ctx, p } = await open(vp);
    await p.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
      roster.forEach((r, i) => { r.name = ['김가나다라마바사아자차카', '박하늘바다구름별빛달빛해'][i % 2]; });
      renderPlayers(); renderNotesPanel(); applyFieldScale();
    });
    await p.waitForTimeout(300);
    await selectPlayer(p, vp, 3);
    const r = report[vp.n] = await metrics(p);
    r.trayOverflow = await p.evaluate(() => { const t = document.getElementById('playerActions'); return [...t.querySelectorAll('button')].some(b => b.scrollWidth > b.clientWidth + 1); });
    r.nameEllipsis = await p.evaluate(() => { const n = document.querySelector('#field .player-name'); return n.scrollWidth > n.clientWidth; });
    await p.screenshot({ path: SHOTS + 'm360-long-name-200pct.png' });
    await p.locator('.app-tab[data-app="pattern"]').click(); await p.waitForTimeout(400);
    r.patternOverflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const play = await box(p, '#playBtn');
    r.playInsideWidth = play.x >= 0 && play.x + play.width <= 360.5;
    await p.screenshot({ path: SHOTS + 'm360-200pct-pattern.png', fullPage: false });
    await ctx.close();
  }

  // 키보드만 사용 (데스크톱)
  {
    const { ctx, p } = await open({ w: 1366, h: 768, m: false });
    const k = report.keyboard = {};
    await p.locator('#field .player').nth(1).focus();
    await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    k.selectByEnter = (await snap(p)).sel;
    k.focusRing = await p.evaluate(() => getComputedStyle(document.activeElement.querySelector('.player-circle')).outlineStyle);
    await p.locator('#playerActions').getByRole('button', { name: '이름', exact: true }).focus();
    await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    await p.keyboard.type('키보드이름'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    k.renamed = await p.evaluate(() => window.SquadMakerContract.getState().view.selectedPlayerName);
    await p.locator('#fileTitleBtn').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    k.libraryFocus = await p.evaluate(() => document.activeElement?.className || document.activeElement?.id);
    let trapped = true;
    const lost = [];
    for (let i = 0; i < 12; i++) {
      await p.keyboard.press('Tab');
      if (i === 2 || i === 7) {
        // 시트가 열린 채로 저장 상태 변화(자동 저장 pending → saved)를 일으켜 포커스가 유지되는지 확인
        await p.evaluate(n => { const el = document.getElementById('teamName'); el.value = '포커스 확인 ' + n; el.dispatchEvent(new Event('input', { bubbles: true })); }, i);
        await p.waitForTimeout(1200);
      }
      const inside = await p.evaluate(() => document.getElementById('librarySheet').contains(document.activeElement));
      if (!inside) { trapped = false; lost.push(i); }
    }
    k.libraryFocusTrapped = trapped;
    k.focusLostAtTab = lost;
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    k.focusReturned = await p.evaluate(() => document.activeElement?.id);
    k.visibleFocus = await p.evaluate(() => { const cs = getComputedStyle(document.activeElement); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2; });
    await p.screenshot({ path: SHOTS + 'd1366-keyboard-focus.png' });
    await ctx.close();
  }

  // reduced-motion: 시트 애니메이션 없음
  {
    const { ctx, p } = await open({ w: 390, h: 844, m: true }, { reducedMotion: 'reduce' });
    await p.locator('#exportOpenBtn').click(); await p.waitForTimeout(100);
    report.reducedMotion = await p.evaluate(() => getComputedStyle(document.getElementById('exportPanel')).animationName);
    await ctx.close();
  }

  // 저장 실패 주입 → 경고 띠 + 다시 저장 + 백업
  {
    const { ctx, p } = await open({ w: 390, h: 844, m: true });
    await p.evaluate(() => { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (String(k).startsWith('squad-maker')) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } return orig.call(this, k, v); }; });
    await p.evaluate(() => { const i = document.getElementById('teamName'); i.value = '저장실패 팀'; i.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.waitForTimeout(1500);
    report.saveError = await p.evaluate(() => ({ status: window.SquadMakerContract.getState().storage, chip: document.getElementById('saveChipText').textContent,
      banner: getComputedStyle(document.getElementById('saveStatus')).position, retry: !document.getElementById('retrySaveBtn').hidden,
      backupVisible: getComputedStyle(document.querySelector('.save-status-backup')).display !== 'none' }));
    await p.screenshot({ path: SHOTS + 'm390-save-error.png' });
    await ctx.close();
  }

  // 내보내기: native 가짜 어댑터로 취소·실패, 웹 저장 성공
  {
    const { ctx, p } = await open({ w: 390, h: 844, m: true });
    const e = report.export = {};
    await p.evaluate(() => { window.__nativeResult = { status: 'cancelled', code: null, completion: null }; window.SquadPlatform = { native: true, publicShareBase: 'https://squad-maker.vercel.app/', exportFile: async () => window.__nativeResult, showTestAd: async () => {} }; window.SquadMakerContract.run('select-player', { id: 1 }); });
    await p.locator('#exportOpenBtn').click(); await p.waitForTimeout(250);
    e.shareButtonsVisible = await p.locator('#exportPanel .native-only').first().isVisible();
    await p.locator('#exportPanel button:has-text("이미지 공유")').click();
    await p.waitForFunction(() => document.getElementById('exportStatus').textContent && !window.SquadMakerContract.getState().export.busy, null, { timeout: 40000 });
    e.cancelled = await p.locator('#exportStatus').textContent();
    await p.screenshot({ path: SHOTS + 'm390-export-cancelled.png' });
    await p.evaluate(() => { window.__nativeResult = { status: 'error', code: 'export-failed', completion: null }; document.getElementById('exportStatus').textContent = ''; });
    await p.locator('#exportPanel button:has-text("백업 파일 저장")').click();
    await p.waitForFunction(() => document.getElementById('exportStatus').textContent, null, { timeout: 20000 });
    e.failed = await p.locator('#exportStatus').textContent();
    e.failedTone = await p.locator('#exportStatus').getAttribute('data-tone');
    await p.evaluate(() => { window.__nativeResult = { status: 'success', code: null, completion: 'share-sheet-finished' }; document.getElementById('exportStatus').textContent = ''; });
    await p.locator('#exportPanel button:has-text("GIF 공유")').click();
    await p.waitForFunction(() => document.getElementById('exportStatus').dataset.tone === 'ok', null, { timeout: 90000 });
    e.shareFinished = await p.locator('#exportStatus').textContent();
    e.stateAfter = await snap(p);
    await p.screenshot({ path: SHOTS + 'm390-export-shared.png' });
    await ctx.close();
  }

  // 슬롯 테스트 정책(limit 1) → 가득 참 안내, 무료 정책처럼 보이지 않는지
  {
    const { ctx, p } = await open({ w: 390, h: 844, m: true }, { init: () => { window.SQUAD_MAKER_PREVIEW_POLICY = { limit: 1 }; } });
    const s = report.slots = {};
    await p.locator('#fileTitleBtn').click(); await p.waitForTimeout(250);
    s.text = await p.locator('#libSlots').textContent();
    await p.locator('[data-lib="create-file"]').click(); await p.waitForTimeout(150);
    await p.locator('#libFormSubmit').click(); await p.waitForTimeout(800);
    s.createResult = await p.locator('#libStatus').textContent();
    await p.screenshot({ path: SHOTS + 'm390-slots-full-test-policy.png' });
    await ctx.close();
  }

  // 전술 생성 → 열기 전환 → 삭제(확인) → 되돌리기 → 마지막 파일 삭제 시 빈 상태
  {
    const { ctx, p } = await open({ w: 412, h: 915, m: true });
    const l = report.library = {};
    await p.locator('#fileTitleBtn').click(); await p.waitForTimeout(200);
    await p.locator('[data-lib="create-file"]').click();
    await p.locator('#libFormInput').fill('주말 리그 4-3-3 전환 연습용 전술');
    await p.locator('#libFormSubmit').click(); await p.waitForTimeout(800);
    l.created = await p.locator('#libStatus').textContent();
    l.header = await p.locator('#fileName').textContent();
    l.items = (await p.evaluate(() => window.SquadMakerContract.getState().localLibrary.items.length));
    await p.screenshot({ path: SHOTS + 'm412-library-two-files.png' });
    await p.locator('.lib-file .icon-btn.danger').first().click(); await p.waitForTimeout(250);
    l.confirmShown = await p.getByRole('alertdialog').isVisible();
    await p.locator('.dlg [data-r="1"]').click(); await p.waitForTimeout(800);
    l.afterDelete = await p.locator('#libStatus').textContent();
    l.undoVisible = await p.locator('#libUndoBtn').isVisible();
    await p.locator('#libUndoBtn').click(); await p.waitForTimeout(800);
    l.afterUndo = await p.locator('#libStatus').textContent();
    // 모든 파일 삭제 → 빈 상태
    for (let i = 0; i < 3; i++) {
      const del = p.locator('.lib-file .icon-btn.danger').first();
      if (!(await del.count())) break;
      await del.click(); await p.waitForTimeout(200);
      await p.locator('.dlg [data-r="1"]').click(); await p.waitForTimeout(700);
    }
    await p.locator('#libraryCloseBtn').click(); await p.waitForTimeout(250);
    l.emptyCardVisible = await p.locator('#emptyFileCard').isVisible();
    l.storage = await p.evaluate(() => window.SquadMakerContract.getState().storage.status);
    await p.screenshot({ path: SHOTS + 'm412-no-file.png' });
    await ctx.close();
  }

  // 짧은 탭 판정: 드래그 종료·스크롤·길게 누르기를 탭으로 오인하지 않는지, 선택 호출이 중복되지 않는지
  {
    const { ctx, p } = await open({ w: 390, h: 844, m: true });
    const cdp = await ctx.newCDPSession(p);
    const t = report.tapDetection = {};
    await p.evaluate(() => {
      window.__selectCalls = 0;
      const original = window.selectPlayerForEdit;
      window.selectPlayerForEdit = function (...args) { window.__selectCalls++; return original.apply(this, args); };
    });
    const center = async i => { const b = await p.locator('#field .player').nth(i).boundingBox(); return { x: b.x + b.width / 2, y: b.y + 12 }; };
    const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    const reset = () => p.evaluate(() => { clearSelectedPlayer(); window.__selectCalls = 0; });
    // 1) 짧은 탭 → 선택 1회
    let c = await center(6);
    await touch('touchStart', c.x, c.y); await p.waitForTimeout(60); await touch('touchEnd');
    await p.waitForTimeout(300);
    t.shortTap = await p.evaluate(() => ({ selected: window.SquadMakerContract.getState().view.selectedPlayerId, calls: window.__selectCalls }));
    // 2) 드래그 종료 → 선택 없음, 위치만 바뀜
    await reset();
    c = await center(4);
    const beforePos = await p.locator('#field .player').nth(4).evaluate(e => e.style.left + ',' + e.style.top);
    await touch('touchStart', c.x, c.y);
    for (let i = 1; i <= 6; i++) { await touch('touchMove', c.x + i * 5, c.y - i * 6); await p.waitForTimeout(16); }
    await touch('touchEnd'); await p.waitForTimeout(300);
    t.dragEnd = await p.evaluate(() => ({ selected: window.SquadMakerContract.getState().view.selectedPlayerId, calls: window.__selectCalls }));
    t.dragMoved = beforePos !== await p.locator('#field .player').nth(4).evaluate(e => e.style.left + ',' + e.style.top);
    // 3) 7px 이내 흔들림 + 짧은 시간 → 탭으로 인정
    await reset();
    c = await center(2);
    await touch('touchStart', c.x, c.y); await touch('touchMove', c.x + 4, c.y + 4); await touch('touchEnd'); await p.waitForTimeout(300);
    t.jitterTap = await p.evaluate(() => window.__selectCalls);
    // 4) 길게 누르기 → 메뉴만, 선택 없음
    await reset();
    c = await center(3);
    await touch('touchStart', c.x, c.y); await p.waitForTimeout(700); await touch('touchEnd'); await p.waitForTimeout(300);
    t.longPress = await p.evaluate(() => ({ menu: document.getElementById('ctxMenu').classList.contains('visible'), calls: window.__selectCalls }));
    await p.evaluate(() => hideCtxMenu());
    // 5) 피치 밖(설정 영역)에서 시작한 스크롤 → 선택 없음, 페이지 스크롤됨
    await reset();
    const y0 = await p.evaluate(() => scrollY);
    const hint = await p.locator('#hintText').boundingBox();
    const sy = Math.min(830, hint.y + hint.height / 2);
    t.scrollStartY = Math.round(sy);
    await touch('touchStart', 195, sy);
    for (let i = 1; i <= 8; i++) { await touch('touchMove', 195, sy - i * 25); await p.waitForTimeout(16); }
    await touch('touchEnd'); await p.waitForTimeout(400);
    t.scroll = await p.evaluate(y0 => ({ calls: window.__selectCalls, scrolled: scrollY !== y0 }), y0);
    // 6) 피치 빈 곳 탭 → 선택 없음
    await reset();
    const fb = await p.locator('#fieldWrapper').boundingBox();
    await touch('touchStart', fb.x + 20, fb.y + fb.height / 2); await touch('touchEnd'); await p.waitForTimeout(300);
    t.emptyPitchTap = await p.evaluate(() => window.__selectCalls);
    t.errors = p._errs;
    await ctx.close();
  }

  // closeTopLayer: 시트 하나만 닫고 선택 유지
  {
    const { ctx, p } = await open({ w: 390, h: 844, m: true });
    await p.evaluate(() => window.SquadMakerContract.run('select-player', { id: 3 }));
    await p.locator('#fileTitleBtn').click(); await p.waitForTimeout(200);
    report.closeTopLayer = await p.evaluate(() => {
      const first = window.SquadUi.closeTopLayer();
      const second = window.SquadUi.closeTopLayer();
      return { first, second, libraryHidden: document.getElementById('librarySheet').hidden, selected: window.SquadMakerContract.getState().view.selectedPlayerId };
    });
    await ctx.close();
  }
  return report;
}
