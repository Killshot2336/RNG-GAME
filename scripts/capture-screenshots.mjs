/**
 * Capture UI screenshots for VOIDLINE_PROJECT_GUIDE.md
 * Usage: node scripts/serve-test.mjs (background) && node scripts/capture-screenshots.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const shotDir = path.join(root, 'docs', 'screenshots');
const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:3458';
const SAVE_PREFIX = 'voidline_galaxy_farm_v2_';

fs.mkdirSync(shotDir, { recursive: true });

async function snap(page, name) {
  const file = path.join(shotDir, name);
  const shell = page.locator('#phone-shell');
  if (await shell.count()) {
    await shell.screenshot({ path: file });
  } else {
    await page.screenshot({ path: file, fullPage: true });
  }
  console.log('  📸', name);
}

async function click(page, sel, label) {
  const el = page.locator(sel).first();
  await el.waitFor({ state: 'attached', timeout: 15000 });
  try {
    await el.click({ timeout: 3000 });
  } catch {
    await page.evaluate((s) => document.querySelector(s)?.click(), sel);
  }
  await page.waitForTimeout(400);
  console.log('  ✓', label);
}

async function clickMapSub(page, id, label) {
  await page.waitForFunction(
    (subId) => !!document.querySelector('[data-action="map-sub-tab"][data-id="' + subId + '"]'),
    id,
    { timeout: 15000 },
  );
  await page.evaluate((subId) => {
    document.querySelector('[data-action="map-sub-tab"][data-id="' + subId + '"]')?.click();
  }, id);
  await page.waitForTimeout(500);
  console.log('  ✓', label);
}

async function pickAden(page) {
  if (await page.locator('[data-action="pick-player"]').count()) {
    await click(page, '[data-action="pick-player"][data-pid="aden"]', 'pick Aden');
    await page.waitForTimeout(600);
  }
}

async function captureUnlockedMap(browser) {
  const context = await browser.newContext({
    viewport: { width: 420, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await bootGuest(page, seedSave(true));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await pickAden(page);

  await click(page, '[data-tab="map"]', 'map scan');
  await page.waitForTimeout(800);
  await snap(page, '14-map-scan.png');

  await clickMapSub(page, 'farm', 'map farm');
  await snap(page, '15-map-farm.png');
  await clickMapSub(page, 'index', 'map index');
  await snap(page, '16-map-index.png');

  await click(page, '[data-tab="battle"]', 'home');
  await click(page, '[data-action="toggle-party-popup"]', 'party');
  await page.evaluate(() => document.querySelector('[data-action="party-mode"][data-id="dungeon"]')?.click());
  await page.waitForTimeout(700);
  await snap(page, '17-co-op-battle.png');

  await context.close();
}

function seedSave(mapUnlocked) {
  return {
    saveVersion: 12,
    cash: 500000,
    sp: 250,
    empireLevel: 8,
    empireXp: 120,
    name: 'VoidPilot_Aden',
    strains: [{ id: 's1', name: 'Nebula Haze', rarity: 'haze', thcPercent: 22, yield: 45, potency: 80, quantity: 3, hue: 200, abilities: ['boss_slayer'], abilityBoosts: {} }],
    equippedBattleIds: ['s1'],
    ownedPlanets: [],
    mapUnlocked: !!mapUnlocked,
    idleBuildings: [
      { id: 'shack', level: 2, rebirth: 0 },
      { id: 'lab', level: 1, rebirth: 0 },
      { id: 'port', level: 0, rebirth: 0 },
      { id: 'vault', level: 0, rebirth: 0 },
    ],
    lastTickAt: Date.now(),
    factoryFloors: [],
    sectorUpgrades: [
      { id: 'thrusters', name: 'Frictionless Thrusters', level: 1, maxLevel: 10, baseCost: 15000, scanRateBonus: 0.08 },
      { id: 'radar', name: 'Cosmic Radar', level: 0, maxLevel: 10, baseCost: 22000, scanRateBonus: 0.12 },
      { id: 'shield', name: 'Shield Insulation', level: 0, maxLevel: 10, baseCost: 18000, scanRateBonus: 0.06 },
    ],
    blitzEndsAt: Date.now() + 600000,
    purchasedBlitzIds: [],
    campaignNode: 3,
    campaignNodeClears: [1, 2],
    battlePassTier: 2,
    battlePassXp: 40,
    trophyPoints: 45,
  };
}

async function bootGuest(page, saveExtra) {
  await page.addInitScript(({ prefix, extraJson }) => {
    localStorage.setItem('voidline_auth_mode', 'guest');
    localStorage.setItem('voidline_last_player', 'aden');
    const extra = extraJson ? JSON.parse(extraJson) : {};
    const save = Object.assign({
      saveVersion: 12, cash: 500000, sp: 250, empireLevel: 5, empireXp: 0,
      name: 'VoidPilot_Aden', strains: [], equippedBattleIds: [],
      lastTickAt: Date.now(), mapUnlocked: false,
    }, extra);
    localStorage.setItem(prefix + 'aden', JSON.stringify(save));
    localStorage.setItem(prefix + 'aden_backup', JSON.stringify(save));
  }, { prefix: SAVE_PREFIX, extraJson: JSON.stringify(saveExtra || {}) });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 420, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Auth gate
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (await page.locator('#overlay-auth-gate.open').count()) {
    await snap(page, '01-auth-gate.png');
  }

  await bootGuest(page, seedSave(false));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  if (await page.locator('[data-action="pick-player"]').count()) {
    await pickAden(page);
    await page.waitForTimeout(200);
  }

  await click(page, '[data-tab="battle"]', 'home tab');
  await snap(page, '02-home.png');

  await click(page, '[data-tab="shop"]', 'shop');
  await snap(page, '03-shop.png');

  await click(page, '[data-tab="index"]', 'index');
  await snap(page, '04-index-strains.png');
  await click(page, '[data-action="index-pane"][data-id="mutations"]', 'mutations pane');
  await snap(page, '05-index-mutations.png');

  await click(page, '[data-tab="coop"]', 'group');
  await snap(page, '06-group.png');

  await click(page, '[data-tab="map"]', 'map locked');
  await snap(page, '07-map-locked.png');

  await click(page, '[data-tab="battle"]', 'back home');
  await click(page, '[data-action="toggle-idle-capitalist"]', 'idle empire');
  await snap(page, '08-idle-empire.png');
  await click(page, '[data-action="toggle-idle-capitalist"]', 'close idle');

  await click(page, '[data-action="toggle-party-popup"]', 'party');
  await snap(page, '09-party-popup.png');
  await click(page, '[data-action="toggle-party-popup"]', 'close party');

  await click(page, '[data-action="open-profile"]', 'profile');
  await page.waitForTimeout(500);
  await snap(page, '10-profile.png');
  await click(page, '[data-action="open-settings"]', 'settings');
  await page.waitForTimeout(400);
  await snap(page, '11-settings.png');
  await page.evaluate(() => document.querySelector('[data-close="settings"]')?.click());
  await page.evaluate(() => document.querySelector('[data-close="profile"]')?.click());
  await page.waitForTimeout(300);

  await click(page, '[data-action="open-battle-pass"]', 'battle pass');
  await page.waitForTimeout(500);
  await snap(page, '12-battle-pass.png');
  await click(page, '[data-action="close-battle-pass"]', 'close bp');

  await click(page, '[data-action="start-run"]', 'campaign trail');
  await page.waitForTimeout(600);
  await snap(page, '13-campaign-trail.png');

  // Map unlocked + co-op — fresh browser context (clean save seed)
  await captureUnlockedMap(browser);

  await browser.close();
  console.log('\nScreenshots saved to', shotDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
