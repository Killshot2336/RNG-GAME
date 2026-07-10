/**
 * Headless smoke test — runs against local static server.
 * Usage: node scripts/serve-test.mjs & BASE_URL=http://127.0.0.1:3458 node scripts/e2e-smoke.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL || process.env.BASE_URL || 'http://127.0.0.1:8765';
const errors = [];

async function click(page, selector, label, opts) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 8000 });
  await el.click(opts && opts.force ? { force: true } : undefined);
  console.log('  ok:', label);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/supabase-config|404/.test(msg.text())) {
      errors.push('console: ' + msg.text());
    }
  });

  await page.goto(BASE + '/index.html?qa=0', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const guest = page.locator('[data-cloud-action="guest"]');
  if (await guest.count()) {
    await guest.click();
    await page.waitForTimeout(500);
  }

  const pick = page.locator('[data-action="pick-player"]').first();
  if (await pick.count()) {
    await click(page, '[data-action="pick-player"]', 'pick first player');
  }

  await page.waitForFunction(() => window.VoidlineGalaxyFarm && window.VoidlineGalaxyFarm.getState(), null, { timeout: 15000 });

  for (const tab of ['shop', 'index', 'battle', 'coop', 'map']) {
    await click(page, '#bottom-dock [data-tab="' + tab + '"]', 'tab ' + tab);
  }

  await click(page, '#bottom-dock [data-tab="battle"]', 'back to battle');
  const boss = page.locator('.boss-arena, .battle-hub, .battle-hub-hero');
  if (!(await boss.count())) errors.push('missing battle hub on battle tab');

  const equipBest = page.locator('[data-action="equip-best"]');
  if (await equipBest.count()) await click(page, '[data-action="equip-best"]', 'equip best loadout');

  const rocket = page.locator('[data-action="open-rocket-lift"], #hub-rocket-btn');
  if (await rocket.count()) {
    await click(page, '[data-action="open-rocket-lift"], #hub-rocket-btn', 'toggle portal farm / rocket');
    const farmTab = page.locator('[data-action="farm-tab"][data-id="upgrade"]');
    if (await farmTab.count()) {
      await click(page, '[data-action="farm-tab"][data-id="upgrade"]', 'farm upgrade deck');
      await click(page, '[data-action="farm-tab"][data-id="control"]', 'farm control deck');
    }
    const dismiss = page.locator('[data-action="dismiss-lift"], [data-action="toggle-farm"]');
    if (await dismiss.count()) await dismiss.first().click();
  }

  await click(page, '#bottom-dock [data-tab="shop"]', 'shop');
  const packBtn = page.locator('[data-action="buy-pack"][data-pack="basic"]');
  if (await packBtn.count() && !(await packBtn.first().isDisabled())) {
    await click(page, '[data-action="buy-pack"][data-pack="basic"]', 'open basic pack');
    await page.waitForTimeout(600);
    await page.locator('button.game-btn-green[data-close="pack"]').click();
    await page.waitForFunction(() => !document.getElementById('overlay-pack-reveal')?.classList.contains('open'));
    console.log('  ok: close pack');
  }

  await click(page, '#bottom-dock [data-tab="index"]', 'index');
  const card = page.locator('.index-strain-grid .cr-card, .binder-grid .liftable-wrap .cr-card').first();
  if (await card.count()) {
    await card.click();
    await page.waitForTimeout(400);
    const hero = page.locator('#overlay-card-hero.open');
    if (!(await hero.count())) errors.push('index card did not open hero overlay');
    else {
      const closeHero = page.locator('#overlay-card-hero .lift-footer [data-action="dismiss-card-hero"], #overlay-card-hero button.game-btn[data-action="dismiss-card-hero"]').first();
      if (await closeHero.count()) await closeHero.click({ force: true });
      else await page.locator('[data-action="dismiss-card-hero"]').first().click({ force: true });
      await page.waitForTimeout(200);
      console.log('  ok: dismiss card hero');
    }
  }

  const mergeLab = page.locator('[data-action="open-merge-lab"]');
  if (await mergeLab.count()) {
    await click(page, '[data-action="open-merge-lab"]', 'open merge lab');
    await click(page, '#overlay-merge-lab .profile-close[data-action="close-merge-lab"]', 'close merge lab');
  }

  await click(page, '[data-action="open-profile"]', 'profile');
  await click(page, '[data-action="profile-tab"][data-id="modifiers"]', 'profile modifiers tab');
  if (!(await page.locator('.profile-stats-scroll, .profile-body').count())) errors.push('missing profile content');
  await click(page, '[data-action="open-settings"]', 'settings');
  const help = page.locator('[data-action="toggle-help"]');
  if (await help.count()) {
    await help.click();
    await help.click();
  }
  await click(page, '#settings-panel button[data-close="settings"]', 'close settings');

  await click(page, '#bottom-dock [data-tab="coop"]', 'group');
  const coopShop = page.locator('[data-action="coop-myshop"]');
  if (await coopShop.count()) {
    await coopShop.click();
    await page.locator('[data-action="coop-back"]').click();
  }

  await browser.close();

  if (errors.length) {
    console.error('\nFAILURES:');
    errors.forEach((e) => console.error(' -', e));
    process.exit(1);
  }
  console.log('\nAll smoke interactions passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
