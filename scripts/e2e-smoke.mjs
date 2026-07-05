/**
 * Headless smoke test — runs against local static server on port 3458.
 * Usage: node scripts/serve-test.mjs & node scripts/e2e-smoke.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:3458';
const errors = [];

async function click(page, selector, label) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 8000 });
  await el.click();
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

  // Nav tabs (v5 labels)
  for (const tab of ['battle', 'shop', 'index', 'coop', 'casino']) {
    await click(page, '[data-tab="' + tab + '"]', 'tab ' + tab);
  }

  // Boss / fight screen
  await click(page, '[data-tab="battle"]', 'back to battle');
  const boss = page.locator('.boss-arena');
  if (!(await boss.count())) errors.push('missing .boss-arena on battle tab');

  // Hub rocket → portal farm
  await click(page, '#hub-rocket-btn', 'toggle portal farm');
  await click(page, '[data-action="farm-tab"][data-id="upgrade"]', 'farm upgrade deck');
  await click(page, '[data-action="farm-tab"][data-id="control"]', 'farm control deck');
  await click(page, '#hub-rocket-btn', 'back to battle');

  // Shop pack
  await click(page, '[data-tab="shop"]', 'shop');
  await click(page, '[data-action="buy-pack"][data-pack="basic"]', 'open basic pack');
  await click(page, '[data-close="pack"]', 'close pack');

  // Index lift
  await click(page, '[data-tab="index"]', 'index');
  const card = page.locator('.binder-grid .liftable-wrap').first();
  if (await card.count()) {
    await card.click();
    await click(page, '[data-action="dismiss-lift"]', 'dismiss lift');
  }

  // Profile + settings
  await click(page, '[data-action="open-profile"]', 'profile');
  await click(page, '[data-action="open-settings"]', 'settings');
  await click(page, '[data-close="settings"]', 'close settings');
  await click(page, '[data-close="profile"]', 'close profile');

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
