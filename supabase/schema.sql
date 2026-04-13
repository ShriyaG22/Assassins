-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  ASSASSINS — Supabase Database Schema                       ║
-- ║                                                             ║
-- ║  Run this in your Supabase SQL Editor:                      ║
-- ║  https://supabase.com/dashboard → SQL Editor → New Query    ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- ─── GAMES TABLE ───────────────────────────────────────────────
create table if not exists public.games (
  id            uuid default gen_random_uuid() primary key,
  code          text not null unique,
  host_id       text not null,
  status        text not null default 'lobby'
                  check (status in ('lobby', 'active', 'finished')),
  assignments   jsonb not null default '{}'::jsonb,
  winner_id     text,
  created_at    timestamptz default now(),
  started_at    timestamptz,
  finished_at   timestamptz
);

-- Index for quick code lookups (joining games)
create index if not exists idx_games_code on public.games (code);

-- ─── PLAYERS TABLE ─────────────────────────────────────────────
create table if not exists public.players (
  id            text primary key,
  game_id       uuid not null references public.games(id) on delete cascade,
  device_id     text not null,
  name          text not null,
  avatar        text not null,
  is_alive      boolean not null default true,
  kills         integer not null default 0,
  joined_at     timestamptz default now()
);

create index if not exists idx_players_game on public.players (game_id);

-- ─── FEED TABLE (activity log) ─────────────────────────────────
create table if not exists public.feed (
  id            uuid default gen_random_uuid() primary key,
  game_id       uuid not null references public.games(id) on delete cascade,
  type          text not null check (type in ('elimination', 'winner')),
  assassin_id   text,
  target_id     text,
  assassin_name text,
  target_name   text,
  remaining     integer,
  created_at    timestamptz default now()
);

create index if not exists idx_feed_game on public.feed (game_id, created_at desc);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────
-- For a simple game we allow all reads/writes via the anon key.
-- In production you'd lock this down with auth.

alter table public.games enable row level security;
alter table public.players enable row level security;
alter table public.feed enable row level security;

-- Allow all operations for anon users (the game is public by design)
create policy "Games are publicly accessible"
  on public.games for all
  using (true)
  with check (true);

create policy "Players are publicly accessible"
  on public.players for all
  using (true)
  with check (true);

create policy "Feed is publicly accessible"
  on public.feed for all
  using (true)
  with check (true);

-- ─── REALTIME ──────────────────────────────────────────────────
-- Enable realtime for all tables so players get live updates.

alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.feed;
