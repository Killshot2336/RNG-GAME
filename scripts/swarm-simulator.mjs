/**
 * Headless three-bot swarm grind — runs against local static server on port 3459.
 * Usage: node scripts/swarm-simulator.mjs
 */
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.PORT || 3459);
const BASE = process.env.SWARM_URL || `http://127.0.0.1:${PORT}`;
const GOAL = 100000000;

function waitForServer(url, attempts) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        n++;
        if (n >= attempts) reject(new Error('Server not reachable: ' + url));
        else setTimeout(tick, 250);
      });
    };
    tick();
  });
}

function startServer() {
  return spawn(process.execPath, [path.join(root, 'scripts', 'serve-test.mjs')], {
    cwd: root,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
    detached: false,
  });
}

async function main() {
  const server = startServer();
  await waitForServer(BASE, 40);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    const t = msg.text();
    if (/SWARM|SwarmBug|VoidlineSwarm|METRIC/i.test(t)) console.log(t);
  });

  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.VoidlineGalaxyFarm && window.VoidlineSwarm, null, { timeout: 15000 });

  const report = await page.evaluate(() => {
    window.__SWARM_LAST_REPORT__ = null;
    if (!window.VoidlineGalaxyFarm.getPlayerId()) {
      window.VoidlineGalaxyFarm.selectPlayer('aden');
    }
    return window.VoidlineSwarm.runSync({ sandbox: true, cashMult: 500, maxSteps: 250000 });
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('\n=== SWARM SIMULATOR RESULT ===');
  console.log('Wall time:', elapsed + 's');
  if (report) {
    console.log('Sim elapsed:', report.elapsedSec + 's');
    console.log('Aden:', report.aden, 'Dad:', report.dad, 'Jamie:', report.jamie);
    console.log('Lease billing:', report.leaseCash);
    console.log('Bugs healed:', report.bugs?.healed, 'patches:', report.bugs?.patches);
    console.log('Cross-trades:', report.trades);
    console.log('Success:', report.success);
  }

  await browser.close();
  server.kill('SIGTERM');

  const ok = report && report.aden >= GOAL && report.dad >= GOAL && report.jamie >= GOAL;
  if (!ok) {
    console.error('Swarm simulation did not reach $100M for all bots.');
    process.exit(1);
  }
  console.log('All three bots reached $100M.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
