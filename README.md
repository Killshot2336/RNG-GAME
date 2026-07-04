# Syndicate Block

Co-op VS tycoon game for Aden, Edward, and Jamie.

- **GitHub** — source code
- **Vercel** — hosting (static game + API routes)
- **Supabase** — online co-op save sync (Postgres)

## Play links

After deploy, share these URLs (replace `YOUR-APP` with your Vercel domain):

| Player | Link |
|--------|------|
| **Aden** | `https://YOUR-APP.vercel.app/?player=Aden&room=syndicate` |
| **Edward** | `https://YOUR-APP.vercel.app/?player=Edward&room=syndicate` |
| **Jamie** | `https://YOUR-APP.vercel.app/?player=Jamie&room=syndicate` |

Everyone uses the same `room=syndicate` to share one world. Trades, flex alerts, and inventory sync across devices within ~2 seconds.

---

## Step 1 — Supabase (online storage)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Open **SQL Editor** → paste and run [`supabase/schema.sql`](supabase/schema.sql)
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

Never put the service role key in `index.html`. It stays in Vercel env vars only.

---

## Step 2 — GitHub (store code)

```powershell
cd c:\Users\Aden\syndicate-block
git init
git add .
git commit -m "Syndicate Block — Vercel + Supabase co-op"
gh repo create syndicate-block --private --source=. --push
```

Use `--public` if you prefer a public repo.

No GitHub? Create a repo at [github.com/new](https://github.com/new), then:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/syndicate-block.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Vercel (host the game)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `syndicate-block` GitHub repo
3. Leave build settings empty (no build command)
4. Before deploying, add **Environment Variables**:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |

5. Click **Deploy**

---

## Step 4 — Verify co-op sync

1. Open three tabs with different `?player=` URLs
2. On Aden's tab, open a pack — Edward's tab should update within ~2s
3. Trade an item in Hideout — recipient sees it after sync

---

## Local development

```powershell
cd c:\Users\Aden\syndicate-block
npm install
copy .env.example .env.local
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
npx vercel link
npx vercel dev
```

Open `http://localhost:3000/?player=Aden&room=syndicate`

---

## Project structure

```
index.html              Game UI + client CloudSync
api/room/[roomId].js    Vercel serverless API
lib/supabase.js         Supabase client (server-side)
supabase/schema.sql     Database table setup
vercel.json             Static hosting + API routing
.env.example            Required env var template
```

## How sync works

- Game polls **GET** `/api/room/syndicate` every 2s
- Local changes push via **POST** `action: sync` with version locking
- Trades run **POST** `action: trade` — atomic on Supabase (no item dupes)
- Flex alerts use **POST** `action: flex`
- All room data lives in Supabase `game_rooms` table

Player identity is locked via `?player=` so each family member controls only their character.
