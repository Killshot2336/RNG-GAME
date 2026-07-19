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
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(500);

  const seats = await page.locator('.seat').count();
  if (seats < 3) failures.push('expected 3 warband seats, got ' + seats);

  await page.locator('.seat').first().click();
  await page.waitForTimeout(400);

  if (!(await page.locator('.hub-stage').count())) failures.push('hub did not open after seat pick');

  for (const mode of ['tree', 'forge', 'tower', 'gate', 'era']) {
    const hs = page.locator('[data-action="mode"][data-id="' + mode + '"]').first();
    if (!(await hs.count())) {
      failures.push('missing hotspot ' + mode);
      continue;
    }
    await hs.click();
    await page.waitForTimeout(300);
    const hubBtn = page.locator('[data-action="mode"][data-id="hub"]').first();
    if (await hubBtn.count()) await hubBtn.click();
    else {
      const flee = page.locator('[data-action="flee-tower"]').first();
      if (await flee.count()) await flee.click();
    }
    await page.waitForTimeout(200);
  }

  await page.locator('[data-action="mode"][data-id="tower"]').click();
  await page.waitForTimeout(200);
  await page.locator('[data-action="start-tower"]').click();
  await page.waitForTimeout(900);
  if (!(await page.locator('.tower-arena').count())) failures.push('tower did not start');

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
