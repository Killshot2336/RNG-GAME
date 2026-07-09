import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8765';

async function unlockMapForTest(page) {
  const unlocked = await page.evaluate(() => window.VoidlineGalaxyFarm.getState()?.mapUnlocked);
  if (unlocked) return;
  await page.locator('#bottom-dock [data-tab="battle"]').click();
  await page.waitForTimeout(300);
  const rocket = page.locator('[data-action="open-rocket-lift"]').first();
  if (await rocket.count()) {
    await rocket.click();
    await page.waitForTimeout(300);
    const buy = page.locator('[data-action="buy-map-unlock"]').first();
    if (await buy.count() && !(await buy.isDisabled())) {
      await buy.click();
      await page.waitForTimeout(400);
    }
  }
}

async function waitGame(page) {
  await page.goto(BASE + '/index.html?qa=0', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const guest = page.locator('[data-cloud-action="guest"]');
  if (await guest.count()) {
    await guest.click();
    await page.waitForTimeout(500);
  }
  const pick = page.locator('[data-action="pick-player"]').first();
  if (await pick.count()) {
    await pick.click();
    await page.waitForTimeout(500);
  }
  await page.waitForFunction(() => window.VoidlineGalaxyFarm && window.VoidlineGalaxyFarm.getState(), null, { timeout: 15000 });
}

async function activeTab(page) {
  return page.evaluate(() => {
    var dock = document.querySelector('#bottom-dock .nav-btn.active');
    return dock ? dock.getAttribute('data-tab') : null;
  });
}

async function panelPointerEvents(page) {
  return page.evaluate(() => {
    var panels = document.querySelectorAll('.cr-screen-panel');
    return Array.from(panels).map((p, i) => ({
      i,
      active: p.classList.contains('cr-screen-panel-active'),
      pe: getComputedStyle(p).pointerEvents,
      hasContent: p.textContent.trim().length > 20,
    }));
  });
}

async function clickNav(page, tab) {
  await page.locator('#bottom-dock [data-tab="' + tab + '"]').click();
  await page.waitForTimeout(350);
}

const failures = [];

async function expectTab(page, tab, label) {
  const got = await activeTab(page);
  if (got !== tab) failures.push(label + ': expected tab ' + tab + ' got ' + got);
}

async function clickAction(page, action, id) {
  const sel = id != null
    ? '[data-action="' + action + '"][data-id="' + id + '"]'
    : '[data-action="' + action + '"]';
  const el = page.locator(sel).first();
  const n = await el.count();
  if (!n) {
    failures.push('missing ' + sel);
    return false;
  }
  await el.click();
  await page.waitForTimeout(300);
  return true;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await waitGame(page);

  for (const tab of ['shop', 'index', 'battle', 'coop', 'map']) {
    await clickNav(page, tab);
    await expectTab(page, tab, 'nav ' + tab);
  }

  await clickNav(page, 'map');
  await unlockMapForTest(page);
  await clickNav(page, 'map');
  const pe = await panelPointerEvents(page);
  const mapPanel = pe.find((p) => p.i === 4);
  if (!mapPanel || mapPanel.pe === 'none') failures.push('map panel pointer-events blocked: ' + JSON.stringify(pe));

  await clickAction(page, 'map-sub-tab', 'farm');
  const farmTab = page.locator('.map-sub-tab.active');
  if (!(await farmTab.count()) || (await farmTab.getAttribute('data-id')) !== 'farm') {
    failures.push('map-sub-tab farm did not activate');
  }

  await clickAction(page, 'map-sub-tab', 'scan');

  const cell = page.locator('.galaxy-cell-planet:not(.galaxy-cell-far)').first();
  if (await cell.count()) {
    await cell.click();
    await page.waitForTimeout(300);
    const ok = await page.evaluate(() => {
      return !!document.querySelector('.galaxy-focus-panel') ||
        !!document.querySelector('#battle-toast-layer .battle-toast');
    });
    if (!ok) failures.push('galaxy in-range cell click had no visible response');
  } else {
    failures.push('no in-range galaxy cells rendered');
  }

  const card = page.locator('.index-strain-grid .cr-card, .binder-grid .liftable-wrap .cr-card').first();
  if (await card.count()) {
    await clickNav(page, 'index');
    await card.click();
    await page.waitForTimeout(300);
    const heroOpen = await page.evaluate(() => document.getElementById('overlay-card-hero')?.classList.contains('open'));
    if (!heroOpen) failures.push('index card tap did not open hero overlay');
    else {
      await page.locator('[data-action="dismiss-card-hero"]').first().click();
      await page.waitForTimeout(200);
    }
  }

  await clickNav(page, 'battle');
  const farmBtn = page.locator('[data-action="toggle-farm"]').first();
  if (await farmBtn.count()) {
    await farmBtn.click();
    await page.waitForTimeout(300);
    const farmVisible = await page.locator('.farm-screen, .portal-rm-scene, [data-action="farm-tab"]').count();
    if (!farmVisible) failures.push('toggle-farm did not show farm UI');
  }

  await page.locator('[data-action="open-profile"]').click();
  await page.waitForTimeout(300);
  const profileOpen = await page.evaluate(() => document.getElementById('overlay-profile').classList.contains('open'));
  if (!profileOpen) failures.push('open-profile failed');

  if (failures.length) {
    console.error('FAILURES:\n' + failures.map((f) => ' - ' + f).join('\n'));
    process.exit(1);
  }
  console.log('E2E click smoke OK');
} catch (e) {
  console.error('E2E error:', e);
  process.exit(1);
} finally {
  await browser.close();
}
