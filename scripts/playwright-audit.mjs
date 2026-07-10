import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8765';
const URL = BASE + '/index.html?qa=0';

const failures = [];
const consoleErrors = [];
const consoleWarnings = [];

function fail(area, msg, hint) {
  failures.push({ area, msg, hint: hint || null });
}

async function waitGame(page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
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
  await page.waitForFunction(
    () => window.VoidlineGalaxyFarm && window.VoidlineGalaxyFarm.getState(),
    null,
    { timeout: 15000 }
  );
}

async function activeTab(page) {
  return page.evaluate(() => {
    const dock = document.querySelector('#bottom-dock .nav-btn.active');
    return dock ? dock.getAttribute('data-tab') : null;
  });
}

async function clickNav(page, tab) {
  await page.locator('#bottom-dock [data-tab="' + tab + '"]').click();
  await page.waitForTimeout(400);
}

async function getZeroSizeCards(page, context) {
  return page.evaluate((ctx) => {
    const bad = [];
    document.querySelectorAll('.cr-card-frame').forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (r.width < 10 || r.height < 10) {
        const parent = el.closest('[data-lift]') || el.closest('.cr-card') || el.parentElement;
        bad.push({
          index: i,
          width: Math.round(r.width * 100) / 100,
          height: Math.round(r.height * 100) / 100,
          context: ctx,
          lift: parent?.getAttribute?.('data-lift') || null,
          tab: document.querySelector('#bottom-dock .nav-btn.active')?.getAttribute('data-tab'),
        });
      }
    });
    return bad;
  }, context);
}

async function checkPanelActive(page, tabIndex, tabName) {
  const pe = await page.evaluate((idx) => {
    const panels = document.querySelectorAll('.cr-screen-panel');
    const p = panels[idx];
    if (!p) return { missing: true };
    return {
      active: p.classList.contains('cr-screen-panel-active'),
      pe: getComputedStyle(p).pointerEvents,
      hasContent: p.textContent.trim().length > 20,
      innerHtmlLen: p.innerHTML.length,
    };
  }, tabIndex);
  if (pe.missing) fail(tabName, 'screen panel index ' + tabIndex + ' missing', 'game.js render() / index.html #screen-root');
  else {
    if (!pe.active) fail(tabName, 'panel not active after nav', 'game.js setActiveTab / cr-screen-panel-active');
    if (pe.pe === 'none') fail(tabName, 'panel pointer-events:none blocks interaction', 'index.css .cr-screen-panel');
    if (!pe.hasContent) fail(tabName, 'panel has no meaningful content (' + pe.innerHtmlLen + ' chars html)', 'game.js render' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
  }
  return pe;
}

const TAB_CRITICAL = {
  shop: [
    { sel: '.shop-screen', label: 'shop screen root', hint: 'game.js renderShop()' },
    { sel: '.shop-hero', label: 'shop hero banner', hint: 'game.js renderShop()' },
    { sel: '.shop-chest-stack', label: 'premium chest tiers', hint: 'game.js renderShop() CHEST_TIERS' },
    { sel: '[data-action="buy-pack"], [data-action="buy-pack-cash"]', label: 'pack buy buttons', hint: 'game.js buyPack()' },
    { sel: '.shop-daily-grid', label: 'daily showcase grid', hint: 'game.js dailyShowcaseItems()' },
    { sel: '.store-item-card', label: 'general store items', hint: 'game.js renderShop() G.inventory' },
  ],
  index: [
    { sel: '.index-screen', label: 'index screen root', hint: 'game.js renderIndex()' },
    { sel: '.index-nav-grid', label: 'index nav (mutations/strains/decks)', hint: 'game.js renderIndex()' },
    { sel: '.index-nav-card', label: 'index nav cards', hint: 'game.js renderIndex()' },
    { sel: 'input[data-action="index-search"], .index-strain-grid, .text-muted', label: 'strain search or grid/empty', hint: 'game.js renderIndex() filteredStrains' },
  ],
  battle: [
    { sel: '.battle-hub', label: 'battle hub root', hint: 'game.js renderBattle()' },
    { sel: '[data-action="start-run"]', label: 'START run button', hint: 'game.js battleHubHeroHtml()' },
    { sel: '.home-bubble, .battle-hub-equip-link', label: 'home bubbles or equip link', hint: 'game.js battleHubHeroHtml()' },
    { sel: '.battle-hub-boss-hud, .battle-hub-hp-track', label: 'boss HP HUD on home', hint: 'game.js battleHubBossHudHtml()' },
  ],
  coop: [
    { sel: '.coop-screen', label: 'coop screen root', hint: 'game.js renderCoop()' },
    { sel: '.market-hero', label: 'syndicate hub hero', hint: 'game.js renderCoop()' },
    { sel: '.coop-hub-tabs, [data-action="coop-myshop"]', label: 'hub tabs or my shop btn', hint: 'game.js renderCoop()' },
    { sel: '.coop-player-card, .roadside-grid', label: 'family storefronts or shop grid', hint: 'game.js renderCoop() PLAYERS' },
  ],
  map: [
    { sel: '.map-screen', label: 'map screen root', hint: 'game.js renderMap()' },
  ],
};

const TAB_INDEX = { shop: 0, index: 1, battle: 2, coop: 3, map: 4 };

async function auditTab(page, tab) {
  await clickNav(page, tab);
  const got = await activeTab(page);
  if (got !== tab) {
    fail(tab, 'nav expected tab "' + tab + '" got "' + got + '"', 'game.js UI.activeTab / bottom-dock handlers');
    return;
  }

  await checkPanelActive(page, TAB_INDEX[tab], tab);

  const checks = TAB_CRITICAL[tab] || [];
  for (const c of checks) {
    const count = await page.locator(c.sel).count();
    if (count === 0) fail(tab, 'missing critical UI: ' + c.label + ' (' + c.sel + ')', c.hint);
  }

  if (tab === 'map') {
    const locked = await page.locator('.map-locked').count();
    const unlocked = await page.locator('.map-screen-nms').count();
    if (!locked && !unlocked) fail('map', 'neither locked nor unlocked map UI rendered', 'game.js renderMap() G.mapUnlocked');
  } else {
    const lockedOnly = await page.locator('.map-locked').count();
    if (lockedOnly) fail(tab, 'map locked UI shown on wrong tab', 'game.js setActiveTab panel swap');
  }

  const zeroCards = await getZeroSizeCards(page, tab);
  for (const z of zeroCards) {
    fail(tab, '0-size card frame w=' + z.width + ' h=' + z.height + (z.lift ? ' lift=' + z.lift : ''), 'index.css .cr-card-frame / game.js crCardHtml()');
  }
}

async function unlockMap(page) {
  const locked = await page.evaluate(() => {
    const G = window.VoidlineGalaxyFarm?.getState?.();
    return G && !G.mapUnlocked;
  });
  if (!locked) return;

  await clickNav(page, 'battle');
  await page.waitForTimeout(300);
  const rocket = page.locator('[data-action="open-rocket-lift"]');
  if (!(await rocket.count())) {
    await clickNav(page, 'map');
    await page.locator('[data-action="open-rocket-lift"]').click();
  } else {
    await rocket.click();
  }
  await page.waitForTimeout(400);

  const buyBtn = page.locator('[data-action="buy-map-unlock"]:not([disabled])');
  if (!(await buyBtn.count())) {
    fail('map', 'buy-map-unlock button missing or disabled (need ' + '75000' + ' cash)', 'game.js unlockMapTab() / battle hub rocket lift');
    return;
  }
  await buyBtn.click();
  await page.waitForTimeout(500);

  await clickNav(page, 'map');
  if (await page.locator('.map-locked').count()) {
    fail('map', 'map still locked after UI unlock flow (buy-map-unlock)', 'game.js unlockMapTab()');
  }
}

async function auditMapSubtabs(page) {
  for (const sub of ['scan', 'farm', 'index']) {
    const btn = page.locator('[data-action="map-sub-tab"][data-id="' + sub + '"]');
    if (!(await btn.count())) {
      fail('map/' + sub, 'map sub-tab button missing', 'game.js renderMap() map-sub-tabs');
      continue;
    }
    await btn.click();
    await page.waitForTimeout(350);
    const active = await page.locator('.map-sub-tab.active[data-id="' + sub + '"]').count();
    if (!active) fail('map/' + sub, 'sub-tab did not become active', 'game.js map-sub-tab handler');

    if (sub === 'scan') {
      const cells = await page.locator('[data-action="galaxy-cell"]').count();
      if (cells === 0) fail('map/scan', 'no galaxy cells rendered', 'game.js renderMapGalaxyScan() galaxy grid');
      else {
        const before = await page.evaluate(() => ({
          pos: window.VoidlineGalaxyFarm.getState()?.galaxyPos,
        }));
        await page.locator('[data-action="galaxy-cell"]:not(.galaxy-cell-far)').first().click();
        await page.waitForTimeout(400);
        const after = await page.evaluate(() => ({
          pos: window.VoidlineGalaxyFarm.getState()?.galaxyPos,
          hasFocusPanel: !!document.querySelector('.galaxy-focus-panel'),
          scanAnimating: !!document.querySelector('.miner-field-prospecting'),
          scanPending: !!window.VoidlineGalaxyFarm.getState()?.scanPending,
        }));
        const moved = before.pos?.qx !== after.pos?.qx || before.pos?.qy !== after.pos?.qy;
        const focused = after.hasFocusPanel;
        const scanned = after.scanAnimating || after.scanPending;
        if (!moved && !focused && !scanned) {
          fail('map/scan', 'galaxy cell click had no effect (no travel, focus, or scan)', 'game.js galaxy-cell handler travelGalaxyCell / scanGalaxyCell');
        }
      }
      const scanBtn = await page.locator('[data-action="map-scan"]').count();
      if (!scanBtn) fail('map/scan', 'missing SCAN SECTOR button', 'game.js renderMapGalaxyScan()');
    }
    if (sub === 'farm') {
      const portal = await page.locator('.portal-rm-scene, [data-action="buy-portal"]').count();
      if (!portal) fail('map/farm', 'missing portal farm scene', 'game.js renderMapFarmTab()');
    }
    if (sub === 'index') {
      const idx = await page.locator('.map-index-planet-wrap, .planet-owned-grid, .text-muted').count();
      if (!idx) fail('map/index', 'missing planet index content', 'game.js renderMapPlanetIndex()');
    }

    const zeroCards = await getZeroSizeCards(page, 'map/' + sub);
    for (const z of zeroCards) {
      fail('map/' + sub, '0-size card w=' + z.width + ' h=' + z.height, 'index.css map-screen .cr-card-frame');
    }
  }
}

async function auditIndexHero(page) {
  await clickNav(page, 'index');
  const card = page.locator('.index-strain-grid .liftable-wrap .cr-card-frame, .index-strain-grid [data-lift]').first();
  if (!(await card.count())) {
    const empty = await page.locator('.index-screen .text-muted').count();
    if (empty) fail('index/hero', 'no strains to test card tap (empty collection)', 'game.js G.strains / genPack');
    else fail('index/hero', 'no index strain cards found', 'game.js renderIndex() index-strain-grid');
    return;
  }
  await card.click();
  await page.waitForTimeout(400);
  const hero = await page.evaluate(() => {
    const el = document.getElementById('overlay-card-hero');
    return {
      hasContent: el && el.innerHTML.trim().length > 50,
      hasStage: !!document.querySelector('#overlay-card-hero .card-hero-stage .cr-card-frame'),
      hasDismiss: !!document.querySelector('.card-hero-footer [data-action="dismiss-card-hero"], .card-hero-backdrop[data-action="dismiss-card-hero"]'),
      overlayOpen: document.getElementById('overlay-card-hero')?.classList.contains('open'),
    };
  });
  if (!hero.hasContent) fail('index/hero', 'card tap did not populate overlay-card-hero', 'game.js openCardHeroFromEl()');
  if (!hero.hasStage) fail('index/hero', 'hero overlay missing card stage/frame', 'game.js renderCardHero() card-hero-stage');
  if (!hero.hasDismiss) fail('index/hero', 'hero overlay missing dismiss button', 'game.js cardHeroFooterHtml dismiss-card-hero');
  if (hero.hasContent) {
    const closeBtn = page.locator('.card-hero-footer [data-action="dismiss-card-hero"]');
    if (await closeBtn.count()) {
      await closeBtn.first().click();
    } else {
      await page.evaluate(() => {
        const btn = document.querySelector('.card-hero-backdrop');
        if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    }
    await page.waitForTimeout(250);
    const stillOpen = await page.evaluate(() => {
      const el = document.getElementById('overlay-card-hero');
      return el?.classList.contains('open') || (el?.innerHTML?.trim().length > 50);
    });
    if (stillOpen) fail('index/hero', 'dismiss did not close hero overlay', 'game.js dismiss-card-hero handler / index.css card-hero-backdrop z-index');

    await clickNav(page, 'index');
    const card2 = page.locator('.index-strain-grid .liftable-wrap').first();
    if (await card2.count()) {
      await card2.click();
      await page.waitForTimeout(350);
      const backdropHit = await page.evaluate(() => {
        const backdrop = document.querySelector('.card-hero-backdrop');
        if (!backdrop) return { missing: true };
        const r = backdrop.getBoundingClientRect();
        const x = r.left + 8;
        const y = r.top + r.height / 2;
        const top = document.elementFromPoint(x, y);
        return { isBackdrop: top === backdrop || top?.closest?.('.card-hero-backdrop'), topTag: top?.className || top?.tagName };
      });
      if (backdropHit.missing) fail('index/hero', 'card hero backdrop missing on reopen', 'game.js renderCardHero()');
      else if (!backdropHit.isBackdrop) {
        fail('index/hero', 'backdrop tap area blocked at left edge — ' + backdropHit.topTag, 'index.css .card-hero-backdrop z-index:0 vs .card-hero-shell z-index:1');
      } else {
        await page.mouse.click(8, 422);
        await page.waitForTimeout(250);
        const backdropClosed = await page.evaluate(() => !document.getElementById('overlay-card-hero')?.classList.contains('open'));
        if (!backdropClosed) fail('index/hero', 'backdrop edge click did not dismiss overlay', 'game.js dismiss-card-hero / index.css card-hero-backdrop');
      }
    }
  }
}

async function auditProfileSettings(page) {
  await page.locator('[data-action="open-profile"]').click();
  await page.waitForTimeout(350);
  let open = await page.evaluate(() => document.getElementById('overlay-profile').classList.contains('open'));
  if (!open) fail('profile', 'open-profile did not add .open to #overlay-profile', 'game.js open-profile handler renderProfile()');
  const profileBody = await page.locator('#profile-panel .profile-body, #profile-panel .farm-tabs').count();
  if (!profileBody) fail('profile', 'profile panel empty or missing tabs', 'game.js renderProfile()');

  const settingsBtn = page.locator('[data-action="open-settings"]').first();
  if (!(await settingsBtn.count())) fail('profile', 'SETTINGS button missing in profile', 'game.js renderProfile()');
  else {
    await settingsBtn.click();
    await page.waitForTimeout(350);
    const overlays = await page.evaluate(() => ({
      settingsOpen: document.getElementById('overlay-settings').classList.contains('open'),
      profileOpen: document.getElementById('overlay-profile').classList.contains('open'),
    }));
    if (!overlays.settingsOpen) fail('settings', 'open-settings did not open #overlay-settings', 'game.js open-settings handler');
    if (overlays.profileOpen) fail('profile', 'profile stayed open when settings opened (expected swap)', 'game.js open-settings sets profileOpen=false');
    const settingsContent = await page.locator('#settings-panel h3, #settings-panel [data-action="toggle-warp"]').count();
    if (!settingsContent) fail('settings', 'settings panel empty', 'game.js renderSettings()');
    await page.locator('#settings-panel button[data-close="settings"]').click();
    await page.waitForTimeout(250);
    const stillSettings = await page.evaluate(() => document.getElementById('overlay-settings').classList.contains('open'));
    if (stillSettings) fail('settings', 'settings close button did not dismiss overlay', 'game.js data-close=settings');
  }

  const profileStillOpen = await page.evaluate(() => document.getElementById('overlay-profile').classList.contains('open'));
  if (profileStillOpen) {
    await page.evaluate(() => {
      document.querySelector('.profile-close[data-close="profile"]')?.click();
    });
    await page.waitForTimeout(250);
  }
}

async function auditPackBuy(page) {
  await clickNav(page, 'shop');
  await page.waitForTimeout(300);

  const packBtn = page.locator('[data-action="buy-pack"]:not([disabled])').first();
  if (!(await packBtn.count())) {
    const cashBtn = page.locator('[data-action="buy-pack-cash"]:not([disabled])').first();
    if (!(await cashBtn.count())) {
      fail('shop/pack', 'no enabled pack buy button found', 'game.js renderShop() buyPack affordability');
      return false;
    }
    await cashBtn.click();
  } else {
    await packBtn.click();
  }
  await page.waitForTimeout(600);

  const packOpen = await page.evaluate(() => {
    const el = document.getElementById('overlay-pack-reveal');
    const pr = window.VoidlineGalaxyFarm?.getState?.()?.packReveal;
    return {
      overlayOpen: el?.classList.contains('open'),
      packRevealOpen: pr?.open,
      hasCard: !!document.querySelector('#pack-panel .cr-card-frame, #pack-panel .dual-pack-grid'),
      hasClose: !!document.querySelector('#pack-panel [data-close="pack"]'),
    };
  });
  if (!packOpen.overlayOpen) fail('shop/pack', 'pack reveal overlay not open after buy', 'game.js buyPack() renderPack()');
  if (!packOpen.packRevealOpen) fail('shop/pack', 'G.packReveal.open false after buy', 'game.js buyPack()');
  if (!packOpen.hasCard) fail('shop/pack', 'pack reveal missing card UI', 'game.js renderPack() crCardHtml');
  if (!packOpen.hasClose) fail('shop/pack', 'pack reveal missing ADD TO INDEX close btn', 'game.js renderPack() data-close=pack');

  if (packOpen.hasClose) {
    await page.locator('#pack-panel [data-close="pack"]').click();
    await page.waitForTimeout(350);
    const closed = await page.evaluate(() => {
      const el = document.getElementById('overlay-pack-reveal');
      const pr = window.VoidlineGalaxyFarm?.getState?.()?.packReveal;
      return !el?.classList.contains('open') && !pr?.open;
    });
    if (!closed) fail('shop/pack', 'closePack / data-close=pack did not dismiss reveal', 'game.js closePack()');
  }
  return packOpen.overlayOpen && packOpen.hasCard;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

page.on('console', (msg) => {
  const type = msg.type();
  const text = msg.text();
  if (type === 'error') consoleErrors.push(text);
  else if (type === 'warning') consoleWarnings.push(text);
});
page.on('pageerror', (err) => {
  consoleErrors.push('PAGE ERROR: ' + err.message);
});

try {
  await waitGame(page);

  for (const tab of ['shop', 'index', 'battle', 'coop', 'map']) {
    await auditTab(page, tab);
  }

  await unlockMap(page);
  await auditMapSubtabs(page);

  await auditPackBuy(page);
  await auditIndexHero(page);
  await auditProfileSettings(page);

  const uniqueErrors = [...new Set(consoleErrors)];
  for (const err of uniqueErrors) {
    if (/favicon|Failed to load resource.*404/i.test(err)) continue;
    fail('console', err, 'check browser console source — game.js / cloud-auth.js / catalog.js');
  }

  console.log(JSON.stringify({ failures, consoleErrorCount: uniqueErrors.length, consoleWarningCount: consoleWarnings.length }, null, 2));
  if (failures.length) process.exit(1);
  console.log('AUDIT OK — no failures');
} catch (e) {
  fail('runner', 'audit crashed: ' + e.message, 'scripts/playwright-audit.mjs');
  console.log(JSON.stringify({ failures, crash: String(e) }, null, 2));
  process.exit(1);
} finally {
  await browser.close();
}
