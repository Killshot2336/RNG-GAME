# Voidline Galaxy Farm

Hyper-immersive space-botany tycoon PWA — React + Vite + Zustand.

**Live:** https://rng-game-gules.vercel.app  
**Repo:** https://github.com/Killshot2336/RNG-GAME

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind 4 |
| State | Zustand `gameStore` + `GameProvider` tick loop |
| Hosting | Vercel (auto-deploy on push to `main`) |
| Database | Supabase optional — legacy API in `api/room/` |

## Project structure

```
src/
├── context/GameContext.tsx    # GameProvider + useGame() facade
├── store/gameStore.ts         # All game logic (cash, strains, rivals, tick)
├── store/uiStore.ts           # Nav, modals, card lift, reality warp
├── screens/                   # Shop, Farm, Index, Clan tabs
├── components/                # HUD, LiftableCard, PackReveal, etc.
├── utils/
│   ├── strainGenerator.ts     # Procedural strain engine
│   ├── dialogueEngine.ts      # State-aware voice lines
│   └── persistence.ts         # localStorage save/load
legacy/syndicate-block.html    # Original co-op game (preserved)
api/room/[roomId].js           # Supabase co-op API (future sync)
```

## Features

- **4 tabs:** Shop (gacha + blitz + store), Farm (upgrade/control/portal), Index (infinite inventory), Clan (marketplace)
- **3-player profiles:** You, Player_Dad_99, Cousin_Chris with profile flipper
- **Tycoon tick:** Passive revenue from equipped portal floors (50ms interval)
- **Procedural strains:** Seeded gacha packs with scan-rate rarity bonuses
- **Card lift:** Fortnite-style 3D parallax on Index and Clan cards
- **Reality Warp:** CSS vignette + chromatic aberration shader toggle
- **Persistence:** Game state auto-saves to localStorage

## Deploy (Vercel)

1. Import **RNG-GAME** at [vercel.com/new](https://vercel.com/new)
2. Build: `npm run build` · Output: `dist`
3. Optional env vars for legacy co-op API:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Local dev (optional)

```powershell
cd c:\Users\Aden\syndicate-block
npm install
npm run dev
```

Open http://localhost:5173
