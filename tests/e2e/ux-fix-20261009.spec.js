const { test, expect } = require('@playwright/test');
const { stubExportCdn } = require('../helpers/stub-cdn');
const fixture = require('../fixtures/snapshot-v1.json');

const snapshot = page => page.evaluate(() => window.SquadMakerContract.getState().snapshot);

async function ready(page) {
  await page.goto('/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
}

async function seed(page) {
  await page.evaluate(() => window.SquadMakerContract.run('retry-save'));
  await page.evaluate(value => localStorage.setItem('squad-maker-v1', value), JSON.stringify(fixture));
  await page.reload();
  await page.evaluate(() => window.SquadMakerContract.ready());
}

test.beforeEach(async ({ page }) => {
  await stubExportCdn(page);
  await ready(page);
});

test('player menu stays inside the viewport and identifies the selected player', async ({ page }, testInfo) => {
  const players = page.locator('#field .player');
  await players.nth(4).click();
  const target = players.nth(6);
  const name = await target.locator('.player-name').innerText();
  if (testInfo.project.name === 'mobile-390') {
    await target.scrollIntoViewIfNeeded();
    const bounds = await target.boundingBox();
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
    });
    await expect(page.locator('#ctxMenu')).toBeVisible();
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
  } else {
    await target.click({ button: 'right' });
  }
  await expect(page.locator('#ctxPlayerLabel')).toContainText(name);
  await expect(page.locator('#playerActionsName')).toContainText(name);
  const menu = await page.locator('#ctxMenu').boundingBox();
  const viewport = page.viewportSize();
  expect(menu.width).toBeLessThanOrEqual(260);
  expect(menu.x).toBeGreaterThanOrEqual(8);
  expect(menu.y).toBeGreaterThanOrEqual(8);
  expect(menu.x + menu.width).toBeLessThanOrEqual(viewport.width - 8);
  expect(menu.y + menu.height).toBeLessThanOrEqual(viewport.height - 8);
  await expect(page.locator('#colorPalette button')).toHaveCount(10);
  for (const swatch of await page.locator('#colorPalette button').all()) {
    await expect(swatch).toHaveAccessibleName(/^선수 색상 [^#]+$/);
    const box = await swatch.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 8);
  }
});

test('destructive confirmation defaults to cancellation and Enter preserves data', async ({ page }) => {
  const before = await snapshot(page);
  await page.locator('#modePills button').filter({ hasText: '8vs8' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-labelledby', /\S+/);
  await expect(dialog).toHaveAttribute('aria-describedby', /\S+/);
  await expect(dialog.locator('[data-r="0"]')).toBeFocused();
  await expect(dialog.locator('[data-r="1"]')).toHaveText('8vs8로 바꾸기');
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  expect(await snapshot(page)).toEqual(before);
  await page.locator('#modePills button').filter({ hasText: '8vs8' }).click();
  await dialog.locator('[data-r="1"]').click();
  await expect.poll(async () => (await snapshot(page)).mode).toBe('8v8');
  await page.reload();
  await expect.poll(async () => (await snapshot(page)).mode).toBe('8v8');
});

test('feedback preparation failure disables submission, retries and returns focus on Escape', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/feedback', route => {
    requests++;
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  const opener = page.locator('.topbar').getByRole('button', { name: '제보', exact: true });
  await opener.click();
  await expect(page.locator('#feedbackStatus')).toContainText('준비하지 못했습니다');
  await expect(page.locator('#feedbackSubmit')).toBeDisabled();
  await expect(page.locator('#feedbackSubmit')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('#feedbackRetryBtn').click();
  await expect.poll(() => requests).toBe(2);
  await expect(page.locator('#feedbackSubmit')).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('#feedbackModal')).toBeHidden();
  await expect(opener).toBeFocused();
});

test('backup restore keeps error, cancelled and saved results next to the action', async ({ page }) => {
  const before = await snapshot(page);
  await page.locator('#exportOpenBtn').click();
  const file = page.locator('#sqFileInput');
  const status = page.locator('#exportStatus');
  await file.setInputFiles({ name: 'bad.sq', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await expect(status).toHaveAttribute('data-tone', 'error');
  await expect(status).not.toBeEmpty();
  expect(await snapshot(page)).toEqual(before);
  const valid = { name: 'saved.sq', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) };
  await file.setInputFiles(valid);
  await expect(status).toBeEmpty();
  await page.getByRole('alertdialog').locator('[data-r="0"]').click();
  await expect(status).toHaveAttribute('data-tone', 'neutral');
  expect(await snapshot(page)).toEqual(before);
  await file.setInputFiles(valid);
  await page.getByRole('alertdialog').locator('[data-r="1"]').click();
  await expect(status).toHaveAttribute('data-tone', 'success');
  await expect(status).toContainText('복원');
  expect(await snapshot(page)).toEqual(fixture);
  await page.reload();
  expect(await snapshot(page)).toEqual(fixture);
});

test('capacity and name limits are readable and visible labels lead accessible names', async ({ page }) => {
  await expect(page.locator('#addPlayerBtn')).toBeDisabled();
  await expect(page.locator('#addPlayerBtn')).toHaveAttribute('aria-describedby', 'addPlayerHint');
  await expect(page.locator('#addPlayerHint')).toHaveText('9명 모두 배치됨');
  await expect(page.locator('#modePills button[aria-pressed="true"]')).toHaveCount(1);
  const player = page.locator('#field .player').nth(4);
  const visibleNumber = await player.locator('.player-circle').innerText();
  const visibleName = await player.locator('.player-name').innerText();
  await expect(player).toHaveAccessibleName(new RegExp(`^${visibleNumber} ${visibleName},`));
  await player.click();
  await page.locator('#playerActions').getByRole('button', { name: '이름', exact: true }).click();
  const input = player.locator('input');
  await input.fill('가나다라마바사아자차카타');
  await expect(input).toHaveAttribute('maxlength', '12');
  await expect(player.locator('.player-name-count')).toHaveText('12/12');
  await input.press('Enter');
  await expect(page.locator('#playerActionsName')).toHaveAttribute('title', /가나다라마바사아자차카타/);
});

test('playback owns step navigation and unlocks it when stopped', async ({ page }) => {
  await seed(page);
  await page.locator('.app-tab[data-app="pattern"]').click();
  await page.locator('#playBtn').click();
  await expect(page.locator('#stepCounter')).toHaveText(/^재생 중 [12]\/2$/);
  await expect(page.locator('.step-nav button').first()).toBeDisabled();
  await expect(page.locator('.step-nav button').last()).toBeDisabled();
  await page.locator('#playBtn').click();
  await expect(page.locator('#stepCounter')).toHaveText(/^단계 [12] \/ 2$/);
  await expect(page.locator('.step-nav button').first()).toBeEnabled();
  await expect(page.locator('.step-nav button').last()).toBeEnabled();
});

test('help names the current workflow and does not focus an action on opening', async ({ page }) => {
  await page.locator('.topbar').getByRole('button', { name: '도움말' }).click();
  const modal = page.locator('#helpModal');
  for (const text of ['배치', '움직임 패턴', '매치 전략', '백업에서 복원', '전술 목록', '내보내기']) {
    await expect(modal).toContainText(text);
  }
  const focused = await page.evaluate(() => ({
    tag: document.activeElement.tagName,
    label: document.activeElement.getAttribute('aria-label'),
    text: document.activeElement.textContent.trim(),
  }));
  expect(/^H[1-6]$/.test(focused.tag) || /닫기/.test(focused.label || focused.text)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
});

test('every supplied player color keeps its data and a readable number at display scale', async ({ page }) => {
  await page.locator('#field .player').nth(4).click();
  const id = await page.locator('#field .player').nth(4).getAttribute('data-id');
  const colors = ['#E53935', '#1E88E5', '#00C853', '#FB8C00', '#8E24AA', '#00ACC1', '#F06292', '#FFD600', '#546E7A', '#ffffff'];
  for (let index = 0; index < colors.length; index++) {
    await page.locator('#playerActions').getByRole('button', { name: '색상·더보기' }).click();
    await page.locator('#colorPalette button').nth(index).click();
    const measured = await page.locator(`#field .player[data-id="${id}"] .player-circle`).evaluate(el => {
      const css = getComputedStyle(el);
      const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
      const luminance = value => rgb(value).map(n => n / 255).map(n => n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)).reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
      const foreground = luminance(css.color), background = luminance(css.backgroundColor);
      return {
        ratio: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
        fontSize: parseFloat(css.fontSize) * el.getBoundingClientRect().width / el.offsetWidth,
        weight: Number(css.fontWeight),
      };
    });
    expect(measured.weight).toBeGreaterThanOrEqual(700);
    const large = measured.fontSize >= 18.66 && measured.weight >= 700;
    expect(measured.ratio).toBeGreaterThanOrEqual(large ? 3 : 4.5);
    expect((await snapshot(page)).roster.find(player => String(player.id) === id).color).toBe(colors[index]);
  }
});

test('a completed player drag updates the selected tools to its actual target', async ({ page }, testInfo) => {
  await page.locator('#field .player').nth(4).click();
  const target = page.locator('#field .player').nth(6);
  const id = Number(await target.getAttribute('data-id'));
  const name = await target.locator('.player-name').innerText();
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (testInfo.project.name === 'mobile-390') {
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + 24, y: start.y }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 24, start.y, { steps: 4 });
    await page.mouse.up();
  }
  await expect.poll(() => page.evaluate(() => window.SquadMakerContract.getState().view.selectedPlayerId)).toBe(id);
  await expect(page.locator('#playerActionsName')).toContainText(name);
});
