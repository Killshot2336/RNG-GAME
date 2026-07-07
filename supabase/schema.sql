-- Run once in Supabase: SQL Editor → New query → Run
-- Enable Email auth in Authentication → Providers before testing signup.

-- Co-op rooms (service role via api/room only)
create table if not exists game_rooms (
  room_id text primary key,
  state jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at bigint not null default 0,
  presence jsonb not null default '{}'::jsonb
);

create index if not exists game_rooms_updated_at_idx on game_rooms (updated_at desc);

alter table game_rooms enable row level security;

create policy "No public access"
  on game_rooms
  for all
  using (false)
  with check (false);

-- Per-user cloud saves (one row per player slot: aden / dad / jamie)
create table if not exists cloud_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id text not null check (player_id in ('aden', 'dad', 'jamie')),
  save_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, player_id)
);

create index if not exists cloud_saves_user_idx on cloud_saves (user_id);
create index if not exists cloud_saves_updated_idx on cloud_saves (updated_at desc);

alter table cloud_saves enable row level security;

create policy "Users read own cloud saves"
  on cloud_saves for select
  using (auth.uid() = user_id);

create policy "Users insert own cloud saves"
  on cloud_saves for insert
  with check (auth.uid() = user_id);

create policy "Users update own cloud saves"
  on cloud_saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own cloud saves"
  on cloud_saves for delete
  using (auth.uid() = user_id);
