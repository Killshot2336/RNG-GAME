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

await new Promise((resolve, reject) => {
  const t = setTimeout(() => resolve(), 2500);
  server.stdout.on('data', (d) => {
    if (String(d).includes('Test server')) {
      clearTimeout(t);
      resolve();
    }
  });
  server.stderr.on('data', () => {});
  server.on('error', reject);
});

const failures = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('#combat-canvas', { timeout: 10000 });
  const tabs = await page.locator('.tabbar button').count();
  if (tabs !== 4) failures.push('expected 4 tabs, got ' + tabs);

  await page.click('.tabbar button[data-tab="outpost"]');
  await page.waitForTimeout(200);
  const harvest = await page.locator('[data-act="harvest"]').count();
  if (!harvest) failures.push('outpost harvest missing');

  await page.click('.tabbar button[data-tab="vault"]');
  await page.waitForTimeout(200);
  await page.click('button[data-chest="Common"]');
  await page.waitForTimeout(200);
  const cards = await page.locator('.loot-card').count();
  if (cards < 1) failures.push('loot chest did not add vault item');

  await page.click('.tabbar button[data-tab="profiles"]');
  await page.waitForTimeout(150);
  await page.click('button[data-switch="jamie"]');
  await page.waitForTimeout(100);
  const hdr = await page.locator('#hdr-profile').textContent();
  if (!hdr || !hdr.includes('Jamie')) failures.push('profile switch failed: ' + hdr);

  await page.click('.tabbar button[data-tab="combat"]');
  await page.waitForTimeout(300);
  const canvas = await page.locator('#combat-canvas').count();
  if (!canvas) failures.push('combat canvas missing after remount');

  if (failures.length) {
    console.error('FAILURES:\n' + failures.map((f) => ' - ' + f).join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Syndicate Swarm e2e smoke OK');
  }
} catch (e) {
  console.error('E2E error:', e);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
