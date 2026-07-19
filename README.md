# Voidline Chronos

Private 3-player co-op warband — **Aden · Jamie · Edward**.

Thrown into deep time. Stabilize eras. Merge relics. Spec the constellation. Hold the Chronolith. Raid planets for exotics.

**Live:** https://rng-game-gules.vercel.app  
**Repo:** https://github.com/Killshot2336/RNG-GAME

## Play

1. Open the app → pick who you are  
2. Hub is art — tap **Tower / Forge / Tree / Gate / Eras**  
3. Spec Bulwark / Rift / Warden · merge shards · push waves · extract exotics  
4. Progress syncs per seat (phone ↔ PC via local save + optional cloud)

## Stack

| Layer | Tech |
|-------|------|
| Game | Vanilla JS (`chronos.js`) + cinematic CSS |
| Auth / cloud | Supabase optional (`cloud-auth.js`) |
| Hosting | Vercel → `dist` |

## Scripts

```bash
npm run build    # copy static → dist
npm run preview  # serve dist
```

## Legacy

Previous Galaxy Farm shell preserved under `legacy/galaxy-farm/`.

## Design notes

See `docs/CHRONOS.md`.
