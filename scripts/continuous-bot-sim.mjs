/**
 * Continuous 3-bot simulation with studio expansion waves when bots idle.
 * Usage: node scripts/continuous-bot-sim.mjs
 * Stop: Ctrl+C or kill the process — saves restore automatically.
 */
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';
import fs from 'fs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.SIM_PORT || 3460);
const BASE = process.env.SIM_URL || `http://127.0.0.1:${PORT}`;
const POLL_MS = Number(process.env.SIM_POLL_MS || 30000);
const LOG_PATH = process.env.SIM_LOG || path.join(root, 'continuous-sim.log');

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
  });
}

function fmtCash(n) {
  if (n == null || Number.isNaN(n)) return '$0';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + Math.round(n).toLocaleString();
}

function logLine(msg) {
  const line = '[' + new Date().toISOString() + '] ' + msg;
  console.log(line);
  try {
    fs.appendFileSync(LOG_PATH, line + '\n');
  } catch (e) { /* ignore */ }
}

async function bootAndStart(page) {
  await page.goto(BASE + '/index.html?qa=0&swarm=0', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => window.VoidlineSwarm && window.VoidlineGalaxyFarm, null, { timeout: 30000 });

  const boot = await page.evaluate(() => {
    if (!window.VoidlineGalaxyFarm.getPlayerId()) {
      var players = window.VoidlineGalaxyFarm.PLAYERS;
      if (players && players.length) window.VoidlineGalaxyFarm.selectPlayer(players[0].id);
    }
    return window.VoidlineSwarm.runContinuous({
      sandbox: true,
      cashMult: 300,
      goal: 20000000,
      tickMs: 2,
      idleWallMs: 20000,
    });
  });

  if (!boot || !boot.ok) {
    throw new Error('runContinuous failed: ' + JSON.stringify(boot));
  }
  return boot;
}

async function pollStatus(page) {
  return page.evaluate(() => {
    if (!window.VoidlineSwarm || !window.VoidlineSwarm.getStatus) return null;
    return window.VoidlineSwarm.getStatus();
  });
}

async function main() {
  logLine('Starting continuous bot simulation on ' + BASE);
  const server = startServer();
  await waitForServer(BASE + '/index.html', 50);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    const t = msg.text();
    if (/VoidlineSwarm|STUDIO WAVE|Progress earned|SwarmBug/i.test(t)) logLine('[browser] ' + t);
  });
  page.on('pageerror', (err) => logLine('[pageerror] ' + err.message));

  const boot = await bootAndStart(page);
  logLine('Core bots online: ' + (boot.streams || 3) + ' streams · mode ' + boot.mode);

  let stopping = false;
  const shutdown = async (sig) => {
    if (stopping) return;
    stopping = true;
    logLine('Stopping (' + (sig || 'shutdown') + ') — restoring sandbox saves…');
    try {
      await page.evaluate(() => { if (window.VoidlineSwarm) window.VoidlineSwarm.stop(); });
    } catch (e) { /* page may be gone */ }
    try { await browser.close(); } catch (e) { /* ignore */ }
    try { server.kill('SIGTERM'); } catch (e) { /* ignore */ }
    logLine('Continuous simulation halted.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  const poll = async () => {
    if (stopping) return;
    try {
      const st = await pollStatus(page);
      if (!st) {
        logLine('Status unavailable — simulation may have stopped');
        return;
      }
      const playerLine = (st.players || [])
        .map((p) => p.label + ' ' + fmtCash(p.cash) + ' (earned ' + fmtCash(p.earned) + ')')
        .join(' · ');
      const lastWave = st.expansionLog && st.expansionLog.length
        ? st.expansionLog[st.expansionLog.length - 1].label
        : 'none yet';
      logLine(
        'WAVE ' + st.expansionWave +
        ' · bots ' + st.streamCount +
        ' · step ' + st.loopCount +
        ' · earned ' + fmtCash(st.totalEarned) + '/' + fmtCash(st.activeGoal) +
        ' · strains ' + st.strains +
        ' · trades ' + st.trades +
        ' · idle ' + st.idleChecks
      );
      logLine('Players: ' + playerLine);
      logLine('Last studio pack: ' + lastWave);
      logLine('Active bots: ' + (st.streams || []).join(', '));
    } catch (e) {
      logLine('Poll error: ' + e.message);
    }
  };

  await poll();
  setInterval(poll, POLL_MS);

  logLine('Running until you say stop (SIGINT/SIGTERM). Log: ' + LOG_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
