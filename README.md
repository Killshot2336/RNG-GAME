# Syndicate Dungeon Grinder

Multi-device cooperative **3D isometric dungeon grinder** — Clash Royale chassis, Hay Day trade stands, Skyrim constellation skills, era research timers.

## Stack

- Vite + Tailwind CSS
- Three.js (WebGL isometric combat + celestial skill map)
- Firebase Auth (Google) + Realtime Database (presence / invites / combat sync)
- Zustand vanilla store

## Run

```bash
npm install
cp .env.example .env   # optional Firebase keys
npm run dev
```

Without Firebase env vars, a **BroadcastChannel** local multiplayer bus still drives invites + presence across tabs.

## Layout

| Swipe / Tab | Screen |
|-------------|--------|
| Left / Market | Timed 4-slot gacha + permanent chests |
| Center / Battle | 3D dungeon hub + With Team invite |
| Right / Clan | Aden / Edward / Jamie inspect + Trade |

## Engines

- `src/engines/multiplayerEngine.js`
- `src/engines/combatEngine.js`
- `src/engines/skillTreeEngine.js`
- `src/engines/eraEngine.js`
