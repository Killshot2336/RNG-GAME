-- Run this if schema.sql failed partway (game_rooms already exists).
-- Safe to run multiple times.

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

drop policy if exists "Users read own cloud saves" on cloud_saves;
drop policy if exists "Users insert own cloud saves" on cloud_saves;
drop policy if exists "Users update own cloud saves" on cloud_saves;
drop policy if exists "Users delete own cloud saves" on cloud_saves;

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
