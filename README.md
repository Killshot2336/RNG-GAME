# Syndicate Swarm

Fresh Vite restart — vanilla JS + Tailwind + Zustand + Firebase.

## Stack

- **Vite** — bundler / HMR
- **Tailwind CSS v3** — utility styles + glass panels
- **Zustand** — local game state (`src/store.js`)
- **Firebase** — multiplayer / cloud storage (`src/firebase.js`)

## Setup

```bash
npm install
cp .env.example .env   # fill Firebase keys when ready
npm run dev
```

## Scripts

| Command | What |
|---------|------|
| `npm run dev` | Local Vite server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
