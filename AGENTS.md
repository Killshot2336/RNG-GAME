# Syndicate Dungeon Grinder

Multi-device co-op 3D isometric dungeon grinder. Single-page client: Vite + Tailwind + Three.js (WebGL) + optional Firebase, with a Zustand vanilla store. See `README.md` for the product overview and `src/` layout.

## Cursor Cloud specific instructions

- This is a **frontend-only** app. There is no backend, no test suite, and no linter configured. The only npm scripts are `dev`, `build`, and `preview` (see `package.json`).
- Run the dev server with `npm run dev`; it serves on `http://localhost:5173` (host/port pinned in `vite.config.js`). Verify a production build with `npm run build` (outputs to `dist/`).
- Firebase env vars (`.env`, see `.env.example`) are **optional**. Without them the app falls back to a `BroadcastChannel` local-multiplayer bus for presence/invites, and Google Sign-In is a no-op — the core game (market gacha, 3D battle hub, clan roster, skill map) still runs fully as a guest.
- **System Diagnostic Sandbox** (`src/debug/systemDiagnosticSandbox.js`): toggle HUD with `Ctrl+Shift+D`. Hotkeys: `Ctrl+Shift+L` loot ×5k, `H` horde ×120, `M` MP sim, `X` stop. Also `window.runLootSanityCheck` / `runHordeStressTest` / `runMultiplayerSimulation` / `stopDiagnosticSandbox`. Sandbox horde enemies are tagged and cleared without wiping live wave spawns; loot rolls never mutate inventory. MP sim injects into Zustand presence + combat listeners only (no Firebase writes).
- Toast notices use state field `toastNotice`; the action remains `toast(msg)`. Do not rename the notice field back to `toast` — that overwrites the action and throws in the combat loop.
