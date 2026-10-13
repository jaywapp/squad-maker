const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, devices } = require('playwright');
const { stubExportCdn } = require('../../../tests/helpers/stub-cdn');
const fixture = require('../../../tests/fixtures/snapshot-v1.json');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices['Pixel 5'], viewport: { width: 390, height: 844 } });
  const evidence = {};
  const page = await context.newPage();
  await stubExportCdn(page);
  await page.addInitScript(seed => {
    localStorage.setItem('squad-maker-v1', JSON.stringify(seed));
    window.SQUAD_MAKER_ANALYTICS_ID = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Synthetic clipboard denied'); } } });
  }, fixture);
  await page.goto('http://127.0.0.1:4397/index.html');
  await page.evaluate(() => window.SquadMakerContract.ready());
  await page.getByRole('tab', { name: '움직임 패턴', exact: true }).click();
  await page.evaluate(() => nextStep());
  const shared = await page.evaluate(() => window.SquadMakerContract.run('share-url'));
  evidence.patternSource = await page.evaluate(() => window.SquadMakerContract.getState().view);
  const viewer = await context.newPage();
  await stubExportCdn(viewer);
  await viewer.goto(shared.url);
  await viewer.evaluate(() => window.SquadMakerContract.ready());
  evidence.patternRecipient = await viewer.evaluate(() => ({ view: window.SquadMakerContract.getState().view,
    selectedTab: document.querySelector('.app-tab[aria-selected="true"]').textContent,
    notes: document.getElementById('notesWrap').innerText,
    overflow: document.documentElement.scrollWidth > innerWidth }));
  await viewer.screenshot({ path: path.join(__dirname, 'pattern-recipient-390.png'), fullPage: true });
  await page.evaluate(() => setAppMode('squad'));
  evidence.pngContents = await page.evaluate(() => { const scene = createExportScene();
    return { sourceTeamNote: document.getElementById('teamNote').value, sceneText: scene.innerText || scene.textContent,
      includesTeamNote: scene.textContent.includes('라인 간격을 유지한다'), includesPlayerNote: scene.textContent.includes('전방 압박 우선') }; });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(() => openShare());
  await page.getByRole('button', { name: '링크 복사', exact: true }).click();
  evidence.clipboardFallback = await page.evaluate(() => ({ activeId: document.activeElement.id,
    selectedText: getSelection().toString(), toast: document.querySelector('.toast')?.textContent,
    urlBoxTag: document.getElementById('shareUrlBox').tagName,
    urlBoxTabIndex: document.getElementById('shareUrlBox').tabIndex }));
  await page.locator('#shareUrlBox').click();
  evidence.clipboardFallback.pageErrors = errors;
  const broken = await context.newPage();
  await stubExportCdn(broken);
  await broken.goto('http://127.0.0.1:4397/index.html#s=broken');
  await broken.evaluate(() => window.SquadMakerContract.ready());
  evidence.malformedRecipient = await broken.evaluate(() => ({ view: window.SquadMakerContract.getState().view,
    team: window.SquadMakerContract.getState().snapshot.team,
    visibleViewerBar: getComputedStyle(document.getElementById('viewerBar')).display !== 'none',
    alerts: [...document.querySelectorAll('[role="alert"],.toast')].map(element => element.textContent),
    overflow: document.documentElement.scrollWidth > innerWidth }));
  await broken.screenshot({ path: path.join(__dirname, 'broken-share-recipient-390.png'), fullPage: true });
  const strategyContext = await browser.newContext({ ...devices['Pixel 5'], viewport: { width: 390, height: 844 } });
  const strategy = await strategyContext.newPage();
  await stubExportCdn(strategy);
  const coachSeed = JSON.parse(JSON.stringify(fixture));
  coachSeed.mode = '11v11';
  coachSeed.team = '전술 검증 FC';
  coachSeed.roster = Array.from({ length: 11 }, (_, index) => ({ id: index + 1, name: '선수 ' + (index + 1), color: '#85b8e4' }));
  const positions = [[240, 622], [90, 510], [190, 510], [290, 510], [390, 510], [120, 385], [240, 385], [360, 385], [90, 260], [240, 220], [390, 260]];
  for (const squad of Object.values(coachSeed.squads)) {
    squad.f = '4-3-3';
    squad.pos = Object.fromEntries(positions.map(([x, y], index) => [index + 1, { x, y }]));
  }
  coachSeed.squads.basic.tn = '공을 빼앗으면 즉시 오른쪽 윙으로 길게 연결';
  coachSeed.squads.basic.pn = { 9: '측면을 넓게 벌리고 뒷공간으로 침투' };
  await strategy.addInitScript(seed => {
    localStorage.setItem('squad-maker-v1', JSON.stringify(seed));
    window.SQUAD_MAKER_ANALYTICS_ID = '';
  }, coachSeed);
  await strategy.goto('http://127.0.0.1:4397/index.html');
  await strategy.evaluate(() => window.SquadMakerContract.ready());
  await strategy.getByRole('tab', { name: '매치 전략', exact: true }).click();
  await strategy.getByRole('button', { name: '전술 지침서 생성', exact: true }).click();
  evidence.strategy = await strategy.evaluate(() => {
    const state = window.SquadMakerContract.getState();
    const text = document.getElementById('manualOutput').innerText;
    return { teamNote: state.snapshot.squads.basic.tn, playerNote: state.snapshot.squads.basic.pn['9'],
      matchNotes: document.getElementById('matchNotes').value, manualText: text,
      includesCoachTeamNote: text.includes(state.snapshot.squads.basic.tn),
      includesCoachPlayerNote: text.includes(state.snapshot.squads.basic.pn['9']),
      includesContradictoryTransition: text.includes('무리한 전진보다 안전한 패스로 점유를 유지') };
  });
  await strategy.locator('#manualCard').screenshot({ path: path.join(__dirname, 'strategy-coach-note-omission-390.png') });
  await fs.writeFile(path.join(__dirname, 'mobile-probes.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
