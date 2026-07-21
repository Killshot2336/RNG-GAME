# Syndicate Swarm

3-player local co-op rogue-lite wave survival + slow-life outpost.

## Stack
- HTML5 shell (`index.html`)
- TypeScript (`src/`)
- Zustand vanilla store
- Canvas combat engine (rAF)
- Outpost simulation interval
- Tailwind CDN + custom AAA CSS (`src/index.css` → `assets/swarm.css`)
- esbuild bundle (no React / no Vite app wrapper)

## Commands
```bash
npm run build:swarm   # bundle TS → assets/swarm.js
npm run build         # swarm + copy dist (includes /chronos archive)
npm run smoke         # Syndicate Swarm e2e
npm run smoke:chronos # legacy Chronos at /chronos/
```

## Tabs
Combat · Outpost Farm · Shared Vault · Profiles

## Legacy
Voidline Chronos preserved at `/chronos/`.
