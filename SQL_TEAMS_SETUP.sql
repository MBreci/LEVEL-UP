-- LEVEL UP — Equipos / Rey del Barrio / Retos
-- Tablas Supabase para sincronizar equipos, retos y partidos de equipo entre dispositivos.
-- Columnas alineadas con teamToRow/rowToTeam, challengeToRow/rowToChallenge,
-- teamMatchToRow/rowToTeamMatch en app.js.
-- Beta de acceso público (solo publishable key) -> políticas RLS permisivas "allow all",
-- igual al patrón usado para la tabla `profiles`.

create table if not exists teams (
  id text primary key,
  name text not null,
  descripcion text,
  city text,
  color text,
  photo text,
  captain_id text,
  member_ids jsonb default '[]'::jsonb,
  open_for_players boolean default false,
  join_requests jsonb default '[]'::jsonb,
  wins integer default 0,
  draws integer default 0,
  losses integer default 0,
  goals_for integer default 0,
  goals_against integer default 0,
  streak text,
  created_at bigint,
  slot_positions jsonb default '[]'::jsonb
);

alter table teams add column if not exists slot_positions jsonb default '[]'::jsonb;

alter table teams enable row level security;

create policy "allow all select teams" on teams for select using (true);
create policy "allow all insert teams" on teams for insert with check (true);
create policy "allow all update teams" on teams for update using (true);
create policy "allow all delete teams" on teams for delete using (true);

create table if not exists team_challenges (
  id text primary key,
  from_team_id text,
  to_team_id text,
  cancha text,
  costo text,
  fecha text,
  hora text,
  jugadores text,
  observaciones text,
  status text,
  created_at bigint
);

alter table team_challenges enable row level security;

create policy "allow all select team_challenges" on team_challenges for select using (true);
create policy "allow all insert team_challenges" on team_challenges for insert with check (true);
create policy "allow all update team_challenges" on team_challenges for update using (true);
create policy "allow all delete team_challenges" on team_challenges for delete using (true);

create table if not exists team_matches (
  id text primary key,
  team_a_id text,
  team_b_id text,
  cancha text,
  costo text,
  fecha text,
  hora text,
  jugadores text,
  observaciones text,
  estado text,
  resultado jsonb,
  mvp_id text,
  created_at bigint
);

alter table team_matches enable row level security;

create policy "allow all select team_matches" on team_matches for select using (true);
create policy "allow all insert team_matches" on team_matches for insert with check (true);
create policy "allow all update team_matches" on team_matches for update using (true);
create policy "allow all delete team_matches" on team_matches for delete using (true);
