import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const gamePath = path.join(root, "game.js");
let src = fs.readFileSync(gamePath, "utf8").replace(/\r\n/g, "\n");

const corrupt = "\n})();\netPlayerId:";
const ci = src.indexOf(corrupt);
if (ci !== -1) src = src.slice(0, ci + "\n})();".length) + "\n";

function insAfter(needle, insert) {
  const i = src.indexOf(needle);
  if (i === -1) throw new Error("needle missing: " + needle.slice(0, 40));
  const at = i + needle.length;
  src = src.slice(0, at) + insert + src.slice(at);
}

function replaceBetween(start, end, middle) {
  const s0 = src.indexOf(start);
  const s1 = src.indexOf(end, s0);
  if (s0 === -1 || s1 === -1) throw new Error("range missing");
  src = src.slice(0, s0) + start + middle + end + src.slice(s1 + end.length);
}

// --- state vars after activeGoal ---
insAfter(
  "    var activeGoal = GOAL;\n",
  `    var goalMode = "totalEarned";
    var maxWallMs = 600000;
    var timeoutHit = false;
    var hotfixLog = [];
    var streamStats = {};
    var STREAMS = [
      { name: "Bot_Aden", partition: "aden", role: "grind" },
      { name: "Bot_Dad", partition: "dad", role: "trade" },
      { name: "Bot_Jamie", partition: "jamie", role: "lease" },
      { name: "Bot_Vex", partition: "aden", role: "chest" },
      { name: "Bot_Nova", partition: "dad", role: "chest" },
      { name: "Bot_Rift", partition: "jamie", role: "chest" },
      { name: "Bot_Pulse", partition: "aden", role: "campaign" },
      { name: "Bot_Bloom", partition: "dad", role: "campaign" },
      { name: "Bot_Flux", partition: "jamie", role: "scan" },
      { name: "Bot_Surge", partition: "aden", role: "shop" },
      { name: "Bot_Mist", partition: "dad", role: "blitz" },
      { name: "Bot_Spark", partition: "jamie", role: "grind" },
    ];
`
);

// --- goal helpers: replace allBotsAtGoal function ---
replaceBetween(
  "    function allBotsAtGoal() {",
  "    }\n\n    function withBot(pid, fn) {",
  `
      return PLAYERS.every(function (p) { return botCash(p.id) >= activeGoal; });
    }

    function totalEarnedAll() {
      return PLAYERS.reduce(function (sum, pl) {
        var s = readPlayerSave(pl.id);
        return sum + (s && s.totalCashEarned ? s.totalCashEarned : 0);
      }, 0);
    }

    function swarmGoalMet() {
      if (goalMode === "perCash") return allBotsAtGoal();
      if (goalMode === "totalEarned") return totalEarnedAll() >= activeGoal;
      return allBotsAtGoal();
    }

    function botEarned(pid) {
      var s = readPlayerSave(pid);
      return s ? (s.totalCashEarned || 0) : 0;
    }

    function withBot(pid, fn) {`
);

// --- helpers before botMilestoneTrade ---
insAfter(
  "    function botAcceptIncomingLeases() {\n",
  `    function botBuyOpenChests() {
      var packTypes = ["basic", "rift", "twin"];
      packTypes.forEach(function (pt) {
        if (G.packReveal && G.packReveal.open) closePack();
        if (G.cash >= 5000 && buyPack(pt)) closePack();
      });
      var guard = 0;
      while ((G.pendingRewards || []).length && guard < 10) {
        var r = G.pendingRewards[0];
        var lbl = chestLabel(r);
        if (!r || (!r.packType && !r.kind)) {
          hotfixLog.push({ type: "unskinned-box", at: Date.now(), label: lbl || "(blank)" });
          console.warn("[VoidlineSwarm] HOTFIX: unskinned chest slot", r);
        }
        openChestSlot(0);
        guard++;
      }
    }

    function botCampaignPush(waves) {
      waves = waves || 8;
      equipBestBattle();
      for (var w = 0; w < waves; w++) {
        if (!G.bossMaxHp || G.bossHp <= 0) spawnBoss();
        tickBoss(140);
        if (G.bossHp <= 0) killBoss();
      }
    }

    function botShopSweep() {
      STORE.forEach(function (item) {
        for (var n = 0; n < 2 && G.cash >= item.price; n++) buyItem(item.id);
      });
      blitzShopRows().forEach(function (u) {
        if (!u.purchased && G.cash >= u.price) buyBlitz(u.id);
      });
    }

    function runStreamStep(stream) {
      SwarmBugCrusher.guard(function () {
        withBot(stream.partition, function () {
          if (!streamStats[stream.name]) streamStats[stream.name] = { partition: stream.partition, steps: 0, cash: 0, earned: 0 };
          var st = streamStats[stream.name];
          st.steps++;
          if (stream.role === "grind" || stream.name === "Bot_Aden" || stream.name === "Bot_Spark") {
            if (stream.name === "Bot_Aden") stepAdenCore();
            else {
              botCampaignPush(6);
              warpTick(6);
            }
          } else if (stream.role === "trade" || stream.name === "Bot_Dad") {
            if (loopCount % 40 === 0) stepDadCore();
          } else if (stream.role === "lease" || stream.name === "Bot_Jamie") {
            stepJamieCore();
          } else if (stream.role === "chest") {
            botBuyOpenChests();
          } else if (stream.role === "campaign") {
            botCampaignPush(10);
            warpTick(5);
          } else if (stream.role === "scan") {
            botInstantScan();
            warpTick(8);
          } else if (stream.role === "shop") {
            botShopSweep();
            warpTick(4);
          } else if (stream.role === "blitz") {
            botShopSweep();
          }
          st.cash = G.cash || 0;
          st.earned = G.totalCashEarned || 0;
        });
      }, "stream:" + stream.name);
    }

`
);

// Rename step bodies to Core and add wrappers - patch stepAden to stepAdenCore
src = src.replace("    function stepAden() {", "    function stepAdenCore() {");
src = src.replace("    function stepDad() {", "    function stepDadCore() {");
src = src.replace("    function stepJamie() {", "    function stepJamieCore() {");

insAfter(
  "    function stepJamieCore() {",
  ""
);

// Insert stream runners after stepJamieCore block ends - find stepJamieCore closing before swarmLoop
const jamieMarker = "    function stepJamieCore() {";
const swarmLoopMarker = "    function swarmLoop() {";
const j0 = src.indexOf(jamieMarker);
const sl0 = src.indexOf(swarmLoopMarker, j0);
if (j0 === -1 || sl0 === -1) throw new Error("jamie/swarmLoop markers");

// find end of stepJamieCore - the line before swarmLoop
const beforeLoop = src.slice(j0, sl0);
if (!beforeLoop.includes("leaseLedger = Math.max")) throw new Error("stepJamie block unexpected");

insAfter(
  "        leaseLedger = Math.max(leaseLedger, collected);\n      });\n    }\n\n",
  `    function stepAden() { stepAdenCore(); }
    function stepDad() { if (loopCount % 150 === 0) stepDadCore(); }
    function stepJamie() { stepJamieCore(); }

    function printStudioFinalLedger() {
      var bugStats = SwarmBugCrusher.getStats();
      var ledger = { players: [], totals: {}, streams: clone(streamStats), hotfixes: hotfixLog.slice(), bugs: bugStats };
      var totalEarned = 0;
      var totalCash = 0;
      var totalBlitz = 0;
      var totalMut = 0;
      var maxNode = 1;
      PLAYERS.forEach(function (pl) {
        var s = readPlayerSave(pl.id) || {};
        var row = {
          player: pl.label,
          id: pl.id,
          cash: s.cash || 0,
          totalCashEarned: s.totalCashEarned || 0,
          campaignNode: s.campaignNode || 1,
          nodesCleared: (s.campaignNodeClears || []).length,
          bossRound: s.bossRound || 1,
          blitzCount: (s.purchasedBlitzIds || []).length,
          mutations: (s.mutationItems || []).length,
          mutationEssence: s.mutationEssence || 0,
        };
        ledger.players.push(row);
        totalEarned += row.totalCashEarned;
        totalCash += row.cash;
        totalBlitz += row.blitzCount;
        totalMut += row.mutations;
        if (row.campaignNode > maxNode) maxNode = row.campaignNode;
      });
      ledger.totals = {
        cash: totalCash,
        totalCashEarned: totalEarned,
        blitzPurchases: totalBlitz,
        mutations: totalMut,
        maxCampaignNode: maxNode,
        crossTrades: tradeLog.length,
        leaseCash: window.__SWARM_LEASE_CASH__ || leaseLedger,
        bugsHealed: bugStats.healed,
        bugsPatched: bugStats.patches,
        bugsFound: (bugStats.errors || []).length,
        bugsFixed: bugStats.healed + bugStats.patches,
        hotfixNotes: hotfixLog.length,
        goalMode: goalMode,
        success: swarmGoalMet(),
        timeout: timeoutHit,
      };
      console.group("%cVOIDLINE STUDIO FINAL LEDGER", HEAD);
      console.table(ledger.players);
      console.table([ledger.totals]);
      if (Object.keys(streamStats).length) console.table(Object.keys(streamStats).map(function (k) {
        var s = streamStats[k];
        return { stream: k, partition: s.partition, steps: s.steps, cash: s.cash, earned: s.earned };
      }));
      if (hotfixLog.length) console.table(hotfixLog);
      if ((bugStats.errors || []).length) console.table(bugStats.errors);
      console.groupEnd();
      return ledger;
    }

`
);

// Replace swarmLoop body
replaceBetween(
  "    function swarmLoop() {",
  "    }\n\n    function finish() {",
  `
      if (!running || !G) return;
      loopCount++;
      SwarmBugCrusher.patrol();
      STREAMS.forEach(function (s) { runStreamStep(s); });
      checkMilestones();
      if (loopCount % 120 === 0) renderHUD();
      if (loopCount % 5000 === 0) {
        log("Progress earned " + fmtCash(totalEarnedAll()) + " / " + fmtCash(activeGoal) + " @ step " + loopCount);
      }
      if (swarmGoalMet()) { finish(); return; }
      if (loopCount >= maxSteps) { finish(); return; }
    }

    function finish() {`
);

// finish: add ledger + extended report fields
src = src.replace(
  "      if (allBotsAtGoal()) {",
  "      var ledger = printStudioFinalLedger();\n      if (swarmGoalMet()) {"
);
src = src.replace(
  "      } else {\n        console.log('%cSWARM SIMULATION INCOMPLETE",
  "      } else {\n        console.log('%cSWARM SIMULATION INCOMPLETE"
);
src = src.replace(
  "        success: allBotsAtGoal(),",
  `        success: swarmGoalMet(),
        goalMode: goalMode,
        totalEarned: totalEarnedAll(),
        timeout: timeoutHit,
        hotfixes: hotfixLog.length,
        streams: clone(streamStats),
        ledger: ledger,
        partitions: {
          aden: { cash: botCash('aden'), earned: botEarned('aden') },
          dad: { cash: botCash('dad'), earned: botEarned('dad') },
          jamie: { cash: botCash('jamie'), earned: botEarned('jamie') },
        },`
);

// prepareSwarm opts
src = src.replace(
  "      activeGoal = opts.goal || GOAL;\n      maxSteps = opts.maxSteps || 300000;",
  `      activeGoal = opts.goal || GOAL;
      goalMode = opts.goalMode || "totalEarned";
      maxWallMs = opts.maxWallMs || 600000;
      timeoutHit = false;
      hotfixLog = [];
      streamStats = {};
      maxSteps = opts.maxSteps || 500000;
      if (opts.tickMs != null) LOOP_MS = opts.tickMs;`
);

// runSync wall clock
src = src.replace(
  "        while (running && loopCount < maxSteps && !allBotsAtGoal()) swarmLoop();",
  `        while (running && loopCount < maxSteps && !swarmGoalMet()) {
          if (Date.now() - startedAt > maxWallMs) { timeoutHit = true; log("Wall timeout " + (maxWallMs / 1000) + "s"); break; }
          swarmLoop();
        }`
);

// return exports
src = src.replace(
  `      Bot_Jamie: { id: 'jamie', step: stepJamie },
    };`,
  `      Bot_Jamie: { id: 'jamie', step: stepJamie },
      STREAMS: STREAMS,
      printStudioFinalLedger: printStudioFinalLedger,
      totalEarnedAll: totalEarnedAll,
    };`
);

// VoidlineGalaxyFarm export
src = src.replace(
  "    runSwarmSync: function (opts) { return VoidlineSwarm.runSync(opts); },\n  };",
  "    runSwarmSync: function (opts) { return VoidlineSwarm.runSync(opts); },\n    printStudioLedger: function () { return VoidlineSwarm.printStudioFinalLedger(); },\n  };"
);

fs.writeFileSync(gamePath, src, "utf8");
console.log("patch-swarm-phase3 OK, lines", src.split(/\n/).length);

