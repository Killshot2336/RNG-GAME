# Archived React/Vite Build

The Voidline Galaxy Farm UI was migrated to a static monolith (`index.html` + `game.js`) on 2026-07-05.

The previous React + Vite + Zustand implementation lived in `src/` at the repo root. That source tree is preserved here for reference.

To run the old build locally (if `src/` is restored to root):

```bash
npm install
npm run dev
```

Production deploy now serves `index.html` directly via Vercel with no build step.
