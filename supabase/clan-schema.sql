-- Clan / multiplayer foundation — run after schema.sql
-- Safe to re-run (idempotent)

create table if not exists clans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text not null check (char_length(tag) between 2 and 5),
  owner_id uuid not null references auth.users(id) on delete cascade,
  trophy_total integer not null default 0,
  war_points integer not null default 0,
  territories jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (tag)
);

create index if not exists clans_trophy_idx on clans (trophy_total desc);

create table if not exists clan_members (
  clan_id uuid not null references clans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'elder', 'member')),
  display_name text,
  trophies_contributed integer not null default 0,
  joined_at timestamptz not null default now(),
  primary key (clan_id, user_id)
);

create index if not exists clan_members_user_idx on clan_members (user_id);

create table if not exists clan_messages (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references clans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  body text not null check (char_length(body) <= 500),
  emote text,
  created_at timestamptz not null default now()
);

create index if not exists clan_messages_clan_idx on clan_messages (clan_id, created_at desc);

alter table clans enable row level security;
alter table clan_members enable row level security;
alter table clan_messages enable row level security;

drop policy if exists "Members read own clan" on clans;
create policy "Members read own clan"
  on clans for select
  using (exists (
    select 1 from clan_members m where m.clan_id = clans.id and m.user_id = auth.uid()
  ));

drop policy if exists "Anyone read clan tags for join" on clans;
create policy "Anyone read clan tags for join"
  on clans for select
  using (true);

drop policy if exists "Authenticated users create clans" on clans;
create policy "Authenticated users create clans"
  on clans for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Leaders update own clan" on clans;
create policy "Leaders update own clan"
  on clans for update
  using (owner_id = auth.uid());

drop policy if exists "Members read roster" on clan_members;
create policy "Members read roster"
  on clan_members for select
  using (exists (
    select 1 from clan_members m2
    where m2.clan_id = clan_members.clan_id and m2.user_id = auth.uid()
  ));

drop policy if exists "Users join clans" on clan_members;
create policy "Users join clans"
  on clan_members for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users leave or leaders kick" on clan_members;
create policy "Users leave or leaders kick"
  on clan_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from clan_members m
      where m.clan_id = clan_members.clan_id and m.user_id = auth.uid() and m.role in ('leader', 'elder')
    )
  );

drop policy if exists "Members read chat" on clan_messages;
create policy "Members read chat"
  on clan_messages for select
  using (exists (
    select 1 from clan_members m where m.clan_id = clan_messages.clan_id and m.user_id = auth.uid()
  ));

drop policy if exists "Members post chat" on clan_messages;
create policy "Members post chat"
  on clan_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from clan_members m where m.clan_id = clan_messages.clan_id and m.user_id = auth.uid()
    )
  );
