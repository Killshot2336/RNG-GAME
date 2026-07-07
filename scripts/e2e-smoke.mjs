/**
 * Headless smoke test — runs against local static server on port 3458.
 * Usage: node scripts/serve-test.mjs & node scripts/e2e-smoke.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:3458';
const errors = [];

async function click(page, selector, label, opts) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 8000 });
  await el.click(opts && opts.force ? { force: true } : undefined);
  console.log('  ok:', label);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });

  // Player picker
  await click(page, '[data-action="pick-player"][data-pid="aden"]', 'pick Aden');

  // Nav tabs
  for (const tab of ['battle', 'shop', 'index', 'map', 'coop', 'casino']) {
    await click(page, '[data-tab="' + tab + '"]', 'tab ' + tab);
  }

  // Boss / fight screen
  await click(page, '[data-tab="battle"]', 'back to battle');
  const boss = page.locator('.boss-arena');
  if (!(await boss.count())) errors.push('missing .boss-arena on battle tab');

  // Battle loadout
  await click(page, '[data-action="equip-best"]', 'equip best loadout');

  // Hub rocket → portal farm (rocket stays visible in farm view)
  await click(page, '#hub-rocket-btn', 'toggle portal farm');
  await click(page, '[data-action="farm-tab"][data-id="upgrade"]', 'farm upgrade deck');
  await click(page, '[data-action="farm-tab"][data-id="control"]', 'farm control deck');
  await click(page, '#hub-rocket-btn', 'back to battle');

  // Shop pack
  await click(page, '[data-tab="shop"]', 'shop');
  await click(page, '[data-action="buy-pack"][data-pack="basic"]', 'open basic pack');
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector('.pack-reveal-card [data-close="pack"]')?.click());
  await page.waitForFunction(() => !document.getElementById('overlay-pack-reveal')?.classList.contains('open'));
  console.log('  ok: close pack');

  // Index lift + merge lab
  await click(page, '[data-tab="index"]', 'index');
  const card = page.locator('.binder-grid .liftable-wrap').first();
  if (await card.count()) {
    await card.click();
    await page.evaluate(() => document.querySelector('[data-action="dismiss-lift"]')?.click());
    await page.waitForFunction(() => !document.getElementById('overlay-card-lift')?.innerHTML);
    console.log('  ok: dismiss lift');
  }
  await click(page, '[data-action="open-merge-lab"]', 'open merge lab');
  await click(page, '#overlay-merge-lab .profile-close[data-action="close-merge-lab"]', 'close merge lab');

  // Profile stats + settings help
  await click(page, '[data-action="open-profile"]', 'profile');
  const statsGrid = page.locator('.profile-stat-grid');
  if (!(await statsGrid.count())) errors.push('missing profile stats grid');
  await click(page, '[data-action="profile-tab"][data-id="custom"]', 'profile customize tab');
  await click(page, '[data-action="profile-tab"][data-id="stats"]', 'profile stats tab');
  await click(page, '[data-action="open-settings"]', 'settings');
  await click(page, '[data-action="toggle-help"]', 'open game encyclopedia');
  await click(page, '[data-action="toggle-help"]', 'close game encyclopedia');
  await click(page, '#settings-panel button[data-close="settings"]', 'close settings');

  // Casino
  await click(page, '[data-tab="casino"]', 'casino');
  await click(page, '[data-action="casino-select"][data-id="blackjack"]', 'blackjack');
  await click(page, '[data-action="blackjack-deal"]', 'blackjack deal');
  await click(page, '[data-action="casino-select"][data-id="menu"]', 'casino menu');
  await click(page, '[data-action="casino-select"][data-id="poker"]', 'poker room');
  await click(page, '[data-action="poker-ready"]', 'poker ready');

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
