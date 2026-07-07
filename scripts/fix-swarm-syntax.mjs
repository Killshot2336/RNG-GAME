import fs from "fs";
const p = "game.js";
let s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const bad = `    function botAcceptIncomingLeases() {
    function botBuyOpenChests() {`;
if (!s.includes(bad)) throw new Error("bad block not found");
s = s.replace(bad, `    function botBuyOpenChests() {`);
const orphan = `      }, "stream:" + stream.name);
    }

      (G.leaseOffers || []).slice().forEach(function (o) {
        if (o.buyerId === 'jamie') respondLeaseOffer(o.id, true);
      });
    }

    function botMilestoneTrade`;
const fixed = `      }, "stream:" + stream.name);
    }

    function botAcceptIncomingLeases() {
      (G.leaseOffers || []).slice().forEach(function (o) {
        if (o.buyerId === 'jamie') respondLeaseOffer(o.id, true);
      });
    }

    function botMilestoneTrade`;
if (!s.includes(orphan)) throw new Error("orphan not found");
s = s.replace(orphan, fixed);
fs.writeFileSync(p, s);
console.log("fixed");
