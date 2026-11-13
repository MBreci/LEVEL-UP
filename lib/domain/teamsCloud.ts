import type { SupabaseClient } from "@supabase/supabase-js";
import type { Team, TeamChallenge, TeamInvite, TeamMatch } from "@/types/team";

// ---------- Teams ----------

interface TeamRow {
  id: string;
  name: string;
  descripcion: string;
  city: string;
  color: string;
  photo?: string | null;
  captain_id: string;
  member_ids: (string | null)[] | null;
  open_for_players: boolean | null;
  join_requests: string[] | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  streak: string | null;
  created_at: number;
  slot_positions: string[] | null;
  leave_requests: string[] | null;
  join_log: Team["joinLog"] | null;
}

export function teamToRow(t: Team): Record<string, unknown> {
  return {
    id: t.id, name: t.name, descripcion: t.desc, city: t.city, color: t.color,
    captain_id: t.captainId, member_ids: t.memberIds, open_for_players: t.openForPlayers,
    join_requests: t.joinRequests, wins: t.wins, draws: t.draws, losses: t.losses,
    goals_for: t.goalsFor, goals_against: t.goalsAgainst, streak: t.streak, created_at: t.createdAt,
    slot_positions: t.slotPositions, leave_requests: t.leaveRequests, join_log: t.joinLog || [],
  };
}

export function rowToTeam(r: TeamRow): Team {
  return {
    id: r.id, name: r.name, desc: r.descripcion, city: r.city, color: r.color, photo: r.photo,
    captainId: r.captain_id, memberIds: r.member_ids || [], openForPlayers: !!r.open_for_players,
    joinRequests: r.join_requests || [], wins: r.wins || 0, draws: r.draws || 0, losses: r.losses || 0,
    goalsFor: r.goals_for || 0, goalsAgainst: r.goals_against || 0, streak: r.streak || "", createdAt: r.created_at,
    slotPositions: r.slot_positions || [], leaveRequests: r.leave_requests || [], joinLog: r.join_log || [],
  };
}

export const TEAM_SYNC_COLS =
  "id,name,descripcion,city,color,captain_id,member_ids,open_for_players,join_requests,wins,draws,losses,goals_for,goals_against,streak,created_at,slot_positions,leave_requests,join_log";

export async function pushTeamToCloud(sb: SupabaseClient, t: Team): Promise<void> {
  const { error } = await sb.from("teams").upsert(teamToRow(t));
  if (error) console.error("Error guardando equipo en la nube:", error.message);
}

/** Escribe SOLO el escudo con un UPDATE dirigido — el sync/edit normal no lo toca. */
export async function pushTeamPhotoToCloud(sb: SupabaseClient, t: Team): Promise<void> {
  const { error } = await sb.from("teams").update({ photo: t.photo || null }).eq("id", t.id);
  if (error) console.error("Error guardando escudo en la nube:", error.message);
}

export async function fetchTeamsFromCloud(sb: SupabaseClient): Promise<Team[] | null> {
  const { data, error } = await sb.from("teams").select(TEAM_SYNC_COLS);
  if (error || !data) {
    console.error("Error sincronizando equipos:", error?.message);
    return null;
  }
  return (data as unknown as TeamRow[]).map(rowToTeam);
}

export async function fetchTeamFromCloud(sb: SupabaseClient, teamId: string): Promise<Team | null> {
  const { data } = await sb.from("teams").select("*").eq("id", teamId).single();
  return data ? rowToTeam(data as unknown as TeamRow) : null;
}

export async function fetchAllTeamPhotos(sb: SupabaseClient): Promise<{ id: string; photo: string | null }[] | null> {
  const { data, error } = await sb.from("teams").select("id,photo");
  if (error || !data) return null;
  return data as { id: string; photo: string | null }[];
}

export async function fetchTeamPhoto(sb: SupabaseClient, teamId: string): Promise<string | null> {
  const { data, error } = await sb.from("teams").select("photo").eq("id", teamId).single();
  if (error || !data) return null;
  return (data as { photo: string | null }).photo || null;
}

// ---------- Team invites ----------

interface TeamInviteRow {
  id: string;
  team_id: string;
  team_name: string;
  from_captain_id: string;
  to_id: string;
  status: TeamInvite["status"];
  slot_index?: number | null;
}

export function teamInviteToRow(i: TeamInvite): Record<string, unknown> {
  return { id: i.id, team_id: i.teamId, team_name: i.teamName, from_captain_id: i.fromCaptainId, to_id: i.toId, status: i.status };
}
export function rowToTeamInvite(r: TeamInviteRow): TeamInvite {
  return { id: r.id, teamId: r.team_id, teamName: r.team_name, fromCaptainId: r.from_captain_id, toId: r.to_id, status: r.status };
}
export async function pushTeamInviteToCloud(sb: SupabaseClient, i: TeamInvite): Promise<void> {
  const { error } = await sb.from("team_invites").upsert(teamInviteToRow(i));
  if (error) console.error("Error guardando invitación de equipo en la nube:", error.message);
}
export async function fetchTeamInvitesFromCloud(sb: SupabaseClient): Promise<TeamInvite[] | null> {
  const { data, error } = await sb.from("team_invites").select("*");
  if (error || !data) return null;
  return (data as unknown as TeamInviteRow[]).map(rowToTeamInvite);
}

// ---------- Challenges ----------

interface ChallengeRow {
  id: string;
  from_team_id: string;
  to_team_id: string;
  cancha: string;
  costo: string;
  fecha: string;
  hora: string;
  jugadores: string;
  observaciones: string;
  status: TeamChallenge["status"];
  created_at: number;
}

export function challengeToRow(c: TeamChallenge): Record<string, unknown> {
  return {
    id: c.id, from_team_id: c.fromTeamId, to_team_id: c.toTeamId, cancha: c.cancha, costo: c.costo,
    fecha: c.fecha, hora: c.hora, jugadores: c.jugadores, observaciones: c.observaciones,
    status: c.status, created_at: c.createdAt,
  };
}
export function rowToChallenge(r: ChallengeRow): TeamChallenge {
  return {
    id: r.id, fromTeamId: r.from_team_id, toTeamId: r.to_team_id, cancha: r.cancha, costo: r.costo,
    fecha: r.fecha, hora: r.hora, jugadores: r.jugadores, observaciones: r.observaciones,
    status: r.status, createdAt: r.created_at,
  };
}
export async function pushChallengeToCloud(sb: SupabaseClient, c: TeamChallenge): Promise<void> {
  const { error } = await sb.from("team_challenges").upsert(challengeToRow(c));
  if (error) console.error("Error guardando reto en la nube:", error.message);
}
export async function fetchChallengesFromCloud(sb: SupabaseClient): Promise<TeamChallenge[] | null> {
  const { data, error } = await sb.from("team_challenges").select("*");
  if (error || !data) return null;
  return (data as unknown as ChallengeRow[]).map(rowToChallenge);
}

// ---------- Team matches ----------

interface TeamMatchRow {
  id: string;
  team_a_id: string;
  team_b_id: string;
  cancha: string;
  costo: string;
  fecha: string;
  hora: string;
  jugadores: string;
  observaciones: string;
  estado: TeamMatch["estado"];
  resultado: TeamMatch["resultado"];
  mvp_id: string | null;
  created_at: number;
  stats: TeamMatch["stats"] | null;
  torneo_id: string | null;
  notes: string | null;
}

export function teamMatchToRow(m: TeamMatch): Record<string, unknown> {
  return {
    id: m.id, team_a_id: m.teamAId, team_b_id: m.teamBId, cancha: m.cancha, costo: m.costo,
    fecha: m.fecha, hora: m.hora, jugadores: m.jugadores, observaciones: m.observaciones,
    estado: m.estado, resultado: m.resultado, mvp_id: m.mvpId, created_at: m.createdAt,
    stats: m.stats || {}, torneo_id: m.torneoId || null, notes: m.notes || null,
  };
}
export function rowToTeamMatch(r: TeamMatchRow): TeamMatch {
  return {
    id: r.id, teamAId: r.team_a_id, teamBId: r.team_b_id, cancha: r.cancha, costo: r.costo,
    fecha: r.fecha, hora: r.hora, jugadores: r.jugadores, observaciones: r.observaciones,
    estado: r.estado, resultado: r.resultado, mvpId: r.mvp_id, createdAt: r.created_at,
    stats: r.stats || {}, torneoId: r.torneo_id || null, notes: r.notes || "",
  };
}
export async function pushTeamMatchToCloud(sb: SupabaseClient, m: TeamMatch): Promise<void> {
  const { error } = await sb.from("team_matches").upsert(teamMatchToRow(m));
  if (error) console.error("Error guardando partido de equipos en la nube:", error.message);
}
export async function fetchTeamMatchesFromCloud(sb: SupabaseClient): Promise<TeamMatch[] | null> {
  const { data, error } = await sb.from("team_matches").select("*");
  if (error || !data) return null;
  return (data as unknown as TeamMatchRow[]).map(rowToTeamMatch);
}
