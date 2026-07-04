-- Run this once in Supabase: SQL Editor → New query → Run

create table if not exists game_rooms (
  room_id text primary key,
  state jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at bigint not null default 0,
  presence jsonb not null default '{}'::jsonb
);

create index if not exists game_rooms_updated_at_idx on game_rooms (updated_at desc);

alter table game_rooms enable row level security;

-- API uses service role key (server-side only). Block direct public access.
create policy "No public access"
  on game_rooms
  for all
  using (false)
  with check (false);
