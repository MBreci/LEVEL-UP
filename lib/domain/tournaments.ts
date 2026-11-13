import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tournament, TournamentStatus, TournamentTeamEntry } from "@/types/tournament";
import type { Team, TeamMatch } from "@/types/team";
import type { ProfilesById } from "@/types/profile";

/** Jugadores por equipo usados para calcular el valor total de inscripción. */
export const TN_TEAM_SIZE = 8;

export function pesosFmt(n: number | null | undefined): string {
  return "$" + Math.round(n || 0).toLocaleString("es-CO");
}

/** Link de ubicación que funciona en PC (maps.google.com) y celular (abre la app Maps). */
export function tnMapsUrl(t: Pick<Tournament, "direccion" | "cancha">): string {
  const d = (t.direccion || "").trim();
  if (/^https?:\/\//i.test(d)) return d;
  const q = encodeURIComponent(d || t.cancha || "cancha");
  return "https://www.google.com/maps/search/?api=1&query=" + q;
}

interface TournamentRow {
  id: string;
  data: Omit<Tournament, "id">;
}

export async function fetchTournamentsFromCloud(sb: SupabaseClient): Promise<Tournament[] | null> {
  const { data, error } = await sb.from("tournaments").select("id,data").order("updated_at", { ascending: false });
  if (error || !data) return null;
  return (data as TournamentRow[]).filter((r) => r.data).map((r) => ({ id: r.id, ...r.data }));
}

export async function pushTournamentToCloud(sb: SupabaseClient, adminId: string, t: Tournament): Promise<{ error: unknown }> {
  const { id, ...data } = t;
  const { error } = await sb.rpc("upsert_tournament", { p_admin_id: adminId, p_id: id, p_data: data });
  return { error };
}

export async function setTournamentStatusInCloud(sb: SupabaseClient, adminId: string, id: string, status: TournamentStatus): Promise<void> {
  await sb.rpc("set_tournament_status", { p_admin_id: adminId, p_id: id, p_status: status });
}

export async function deleteTournamentInCloud(sb: SupabaseClient, adminId: string, id: string): Promise<void> {
  await sb.rpc("delete_tournament", { p_admin_id: adminId, p_id: id });
}

/** El capitán inscribe su equipo: la nube hace append sin pisar a otros; devuelve el torneo actualizado. */
export async function addTeamToTournamentInCloud(
  sb: SupabaseClient,
  profileId: string,
  id: string,
  entry: TournamentTeamEntry
): Promise<{ error: unknown; tournament: Tournament | null }> {
  const { data, error } = await sb.rpc("tournament_add_team", { p_profile_id: profileId, p_id: id, p_entry: entry });
  return { error, tournament: !error && data ? { id, ...(data as Omit<Tournament, "id">) } : null };
}

export interface TorneoScorerRow {
  pid: string;
  name: string;
  goles: number;
  asistencias: number;
}

export interface TorneoStandingRow {
  teamId: string;
  name: string;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
  dg: number;
}

export interface TorneoStats {
  matches: TeamMatch[];
  scorersList: TorneoScorerRow[];
  standingsList: TorneoStandingRow[];
}

/**
 * Puerto fiel de calcTorneoStats (app.js ~6546-6577): tabla de goleadores/
 * asistencias y posiciones de un torneo, calculada a partir de los
 * team_matches etiquetados con ese torneoId — no hay tabla aparte en la nube.
 */
export function calcTorneoStats(torneoId: string, teamMatches: TeamMatch[], teams: Record<string, Team>, profiles: ProfilesById): TorneoStats {
  const matches = teamMatches.filter((m) => m.torneoId === torneoId);
  const finalizados = matches.filter((m) => m.estado === "finalizado" && m.resultado);

  const scorers: Record<string, { goles: number; asistencias: number }> = {};
  const standings: Record<string, { w: number; d: number; l: number; gf: number; ga: number }> = {};

  finalizados.forEach((m) => {
    Object.entries(m.stats || {}).forEach(([pid, s]) => {
      if (!scorers[pid]) scorers[pid] = { goles: 0, asistencias: 0 };
      scorers[pid].goles += s.goles || 0;
      scorers[pid].asistencias += s.asistencias || 0;
    });
    const gA = m.resultado?.golesA || 0;
    const gB = m.resultado?.golesB || 0;
    ([[m.teamAId, gA, gB], [m.teamBId, gB, gA]] as const).forEach(([tid, gf, ga]) => {
      if (!tid) return;
      if (!standings[tid]) standings[tid] = { w: 0, d: 0, l: 0, gf: 0, ga: 0 };
      standings[tid].gf += gf;
      standings[tid].ga += ga;
      if (gf > ga) standings[tid].w++;
      else if (gf < ga) standings[tid].l++;
      else standings[tid].d++;
    });
  });

  const scorersList = Object.entries(scorers)
    .map(([pid, s]) => ({ pid, name: (profiles[pid] && (profiles[pid].nickname || profiles[pid].name)) || pid, ...s }))
    .sort((a, b) => b.goles - a.goles || b.asistencias - a.asistencias)
    .slice(0, 10);

  const standingsList = Object.entries(standings)
    .map(([teamId, s]) => ({ teamId, name: (teams[teamId] && teams[teamId].name) || teamId, ...s, pts: s.w * 3 + s.d, dg: s.gf - s.ga }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg);

  return { matches, scorersList, standingsList };
}
