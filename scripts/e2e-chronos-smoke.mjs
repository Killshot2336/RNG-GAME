import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 8766;
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
  await page.goto(BASE + '/chronos/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });

  await page.waitForFunction(
    () => window.VoidlineChronos,
    null,
    { timeout: 15000 }
  );
  await page.evaluate(() => {
    if (window.VoidlineChronos.skipIntro) window.VoidlineChronos.skipIntro();
  });
  await page.waitForFunction(
    () => window.VoidlineChronos.getScene() === 'who',
    null,
    { timeout: 10000 }
  );

  const canvas = await page.locator('#game').count();
  if (!canvas) failures.push('missing #game canvas');

  const seats = await page.evaluate(() => window.VoidlineChronos.seats());
  if (seats < 3) failures.push('expected 3 warband seats, got ' + seats);

  await page.evaluate(() => window.VoidlineChronos.pick('aden'));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.VoidlineChronos.dismissStory());
  await page.waitForTimeout(100);

  let scene = await page.evaluate(() => window.VoidlineChronos.getScene());
  if (scene !== 'hub') failures.push('hub did not open after seat pick, got ' + scene);

  for (const mode of ['tree', 'forge', 'tower', 'gate', 'era', 'life', 'story']) {
    await page.evaluate((m) => window.VoidlineChronos.go(m), mode);
    await page.waitForTimeout(120);
    scene = await page.evaluate(() => window.VoidlineChronos.getScene());
    if (scene !== mode) failures.push('failed to open mode ' + mode + ' (got ' + scene + ')');
    await page.evaluate(() => window.VoidlineChronos.go('hub'));
    await page.waitForTimeout(80);
  }

  await page.evaluate(() => window.VoidlineChronos.go('tower'));
  await page.waitForTimeout(80);
  await page.evaluate(() => window.VoidlineChronos.startTower(false));
  await page.waitForTimeout(400);

  const live = await page.evaluate(() => window.VoidlineChronos.towerLive());
  scene = await page.evaluate(() => window.VoidlineChronos.getScene());
  if (scene !== 'tower' || !live) failures.push('tower did not start (scene=' + scene + ', live=' + live + ')');

  const nodes = await page.evaluate(() =>
    (window.ChronosData && window.ChronosData.TREE) ? window.ChronosData.TREE.length : 0
  );
  if (nodes < 20) failures.push('skill tree too small: ' + nodes);

  if (failures.length) {
    console.error('FAILURES:\n' + failures.map((f) => ' - ' + f).join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Chronos e2e smoke OK');
  }
} catch (e) {
  console.error('E2E error:', e);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
