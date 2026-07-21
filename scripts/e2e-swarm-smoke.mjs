import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 8771;
const BASE = 'http://127.0.0.1:' + PORT;

const server = spawn(process.execPath, [path.join(root, 'scripts/serve-test.mjs')], {
  cwd: root,
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe']
});

await new Promise((resolve) => {
  const t = setTimeout(() => resolve(), 2500);
  server.stdout.on('data', (d) => {
    if (String(d).includes('Test server')) {
      clearTimeout(t);
      resolve();
    }
  });
});

const failures = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForFunction(
    () => window.gameStore && document.getElementById('combatCanvas'),
    null,
    { timeout: 10000 }
  );

  const tabs = await page.locator('button[data-tab]').count();
  if (tabs !== 4) failures.push('expected 4 tabs, got ' + tabs);

  await page.click('button[data-tab="outpost"]');
  await page.waitForTimeout(150);
  if (!(await page.locator('[data-act="harvest"]').count())) failures.push('harvest missing');

  await page.click('button[data-tab="vault"]');
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    const p = window.gameStore.getActive();
    p.credits = Math.max(p.credits, 600);
    window.gameStore.syncUI();
    window.gameStore.save();
  });
  await page.click('button[data-chest="Rare"]');
  await page.waitForTimeout(150);
  const vaultCount = await page.evaluate(() => window.gameStore.sharedVault.length);
  if (vaultCount < 1) failures.push('chest did not add loot');

  await page.click('button[data-tab="profiles"]');
  await page.waitForTimeout(100);
  await page.click('button[data-switch="jamie"]');
  await page.waitForTimeout(80);
  const active = await page.evaluate(() => window.gameStore.activeProfileId);
  if (active !== 'jamie') failures.push('profile switch failed: ' + active);

  await page.click('button[data-tab="combat"]');
  await page.waitForTimeout(250);
  const live = await page.evaluate(
    () => !!document.getElementById('combatCanvas') && window.gameStore.activeTab === 'combat'
  );
  if (!live) failures.push('combat remount failed');

  if (failures.length) {
    console.error('FAILURES:\n' + failures.map((f) => ' - ' + f).join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Syndicate Swarm single-file e2e smoke OK');
  }
} catch (e) {
  console.error('E2E error:', e);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
