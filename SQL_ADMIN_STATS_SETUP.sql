-- LEVEL UP — Panel admin de estadísticas (carga manual de box score + torneos)
-- Columnas nuevas para persistir el detalle por jugador de cada partido (hoy se
-- calculaba y se aplicaba a la carta, pero se perdía al no guardarse en la fila
-- del partido) y para vincular partidos de equipo a un torneo.
-- Alineado con matchToRow/rowToMatch y teamMatchToRow/rowToTeamMatch en app.js.
-- Idempotente: seguro correrlo varias veces.

alter table open_matches add column if not exists stats jsonb default '{}'::jsonb;
alter table open_matches add column if not exists notes text;

alter table team_matches add column if not exists stats jsonb default '{}'::jsonb;
alter table team_matches add column if not exists torneo_id text;
alter table team_matches add column if not exists notes text;

-- Sin políticas RLS nuevas: open_matches y team_matches ya tienen "allow all"
-- (ver SQL_TEAMS_SETUP.sql), igual que el resto de columnas de estas tablas.
