# Syndicate Dungeon Grinder

Multi-device co-op 3D isometric dungeon grinder. Single-page client: Vite + Tailwind + Three.js (WebGL) + optional Firebase, with a Zustand vanilla store. See `README.md` for the product overview and `src/` layout.

## Cursor Cloud specific instructions

- This is a **frontend-only** app. There is no backend, no test suite, and no linter configured. The only npm scripts are `dev`, `build`, and `preview` (see `package.json`).
- Run the dev server with `npm run dev`; it serves on `http://localhost:5173` (host/port pinned in `vite.config.js`). Verify a production build with `npm run build` (outputs to `dist/`).
- Firebase env vars (`.env`, see `.env.example`) are **optional**. Without them the app falls back to a `BroadcastChannel` local-multiplayer bus for presence/invites, and Google Sign-In is a no-op — the core game (market gacha, 3D battle hub, clan roster, skill map) still runs fully as a guest. Do not treat missing Firebase secrets as a blocker.
- Core flows to smoke-test in the browser: bottom tabs Market / Battle / Clan. Purchasing a gacha card in "Merchant Row" marks it SOLD OUT and adds it to the Inventory Vault; state persists to `localStorage`.
- Known pre-existing bug on `main` (not an environment issue): `toast` is defined both as a state field and as a store action in `src/store/gameStore.js`, so calling the action does `set({ toast: {...} })` and overwrites itself. After the first toast, subsequent `toast()` calls throw `state.toast is not a function` (spams the console, e.g. from `buyMarketSlot` and the combat loop). It does **not** block gameplay — purchases still persist because state is set before the failing toast call.
