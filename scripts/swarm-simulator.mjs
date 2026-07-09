/**
 * Phase 3 headless 12-stream swarm — local static server on port 3459.
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
const GOAL = Number(process.env.SWARM_GOAL || 100000000);
const MAX_WALL_MS = Number(process.env.SWARM_TIMEOUT_MS || 600000);

const BOT_NAMES = [
  'Bot_Aden', 'Bot_Dad', 'Bot_Jamie', 'Bot_Vex', 'Bot_Nova', 'Bot_Rift',
  'Bot_Pulse', 'Bot_Bloom', 'Bot_Flux', 'Bot_Surge', 'Bot_Mist', 'Bot_Spark',
];

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

function fmt(n) {
  if (n == null || Number.isNaN(n)) return '0';
  return '$' + Math.round(n).toLocaleString('en-US');
}

async function main() {
  const server = startServer();
  await waitForServer(BASE, 40);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    const t = msg.text();
    if (/SWARM|SwarmBug|VoidlineSwarm|STUDIO|METRIC|Progress earned|HOTFIX/i.test(t)) console.log(t);
  });

  page.on('pageerror', (err) => {
    console.error('[pageerror]', err.message);
  });

  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.VoidlineGalaxyFarm && window.VoidlineSwarm, null, { timeout: 20000 });

  const report = await page.evaluate(
    ({ goal, maxWallMs }) => {
      try {
        window.__SWARM_LAST_REPORT__ = null;
        if (!window.VoidlineGalaxyFarm.getPlayerId()) {
          var players = window.VoidlineGalaxyFarm.PLAYERS;
          var pid = players && players.length ? players[0].id : null;
          if (pid) window.VoidlineGalaxyFarm.selectPlayer(pid);
        }
        return window.VoidlineSwarm.runSync({
          sandbox: true,
          cashMult: 450,
          maxSteps: 800000,
          goalMode: 'totalEarned',
          goal,
          maxWallMs,
          tickMs: 1,
        });
      } catch (e) {
        console.error('[swarm-simulator] evaluate crash', e);
        return { success: false, crash: String(e && e.message ? e.message : e) };
      }
    },
    { goal: GOAL, maxWallMs: MAX_WALL_MS },
  );

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('\n=== PHASE 3 SWARM RESULT ===');
  console.log('Wall time:', elapsed + 's');
  if (!report) {
    console.error('No report returned.');
    await browser.close();
    server.kill('SIGTERM');
    process.exit(1);
  }

  if (report.crash) console.error('Crash:', report.crash);

  console.log('Goal mode:', report.goalMode || 'totalEarned');
  console.log('Total earned (all accounts):', fmt(report.totalEarned), '/ goal', fmt(GOAL));
  console.log('Success:', report.success, 'Timeout:', !!report.timeout);
  console.log('Sim elapsed:', report.elapsedSec + 's');
  console.log('Lease billing:', fmt(report.leaseCash));
  console.log('Cross-trades:', report.trades);
  console.log('Hotfix notes:', report.hotfixes || 0);
  const bugs = report.bugs || {};
  const bugsFixed = (bugs.healed || 0) + (bugs.patches || 0);
  console.log('Bugs healed:', bugs.healed, 'patches:', bugs.patches, 'found:', (bugs.errors || []).length, 'fixed(total):', bugsFixed);

  if (report.partitions) {
    console.log('\n-- Partition totals --');
    for (const [id, row] of Object.entries(report.partitions)) {
      console.log(id + ': cash', fmt(row.cash), 'earned', fmt(row.earned));
    }
  }

  console.log('\n-- 12 stream bots (last snapshot) --');
  const streams = report.streams || {};
  for (const name of BOT_NAMES) {
    const s = streams[name] || { steps: 0, cash: 0, earned: 0, partition: '?' };
    console.log(
      name,
      '| partition:', s.partition,
      '| steps:', s.steps,
      '| cash:', fmt(s.cash),
      '| earned:', fmt(s.earned),
    );
  }

  if (report.ledger && report.ledger.totals) {
    console.log('\n-- Studio ledger totals --');
    console.log(report.ledger.totals);
  }

  await browser.close();
  server.kill('SIGTERM');

  const ok = report.success || (report.totalEarned >= GOAL);
  if (!ok) {
    console.error('Swarm did not reach $100M totalCashEarned across accounts within limits.');
    process.exit(1);
  }
  console.log('\nPhase 3 swarm goal met.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

