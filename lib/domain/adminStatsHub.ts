import type { SupabaseClient } from "@supabase/supabase-js";
import { checkAchievements, computeMatchDeltas, type MatchStatsInput } from "@/lib/domain/matchDeltas";
import { pushProfileToCloud } from "@/lib/domain/profiles";
import { pushMatchToCloud } from "@/lib/domain/matches";
import { pushTeamMatchToCloud, pushTeamToCloud } from "@/lib/domain/teamsCloud";
import type { Profile, ProfilesById } from "@/types/profile";
import type { Team, TeamMatch } from "@/types/team";
import type { OpenMatch } from "@/types/match";

/**
 * Puerto fiel del Centro de Estadísticas (admin-estadisticas.html + app.js
 * ~7060-7809): campos de box score por modo, fórmulas de calificación y el
 * motor de "revert preciso" para corregir un partido ya registrado sin perder
 * ni duplicar lo que ya se le aplicó a cada jugador. A propósito NO comparte
 * fórmula/campos con lib/domain/adminTeamMatch.ts (pieza 3) — el original
 * mantiene ambos consoles con rigor distinto y esto replica esa fidelidad.
 */

/** Puerto fiel de statsHubMatchPlayerIds (app.js ~7166-7175), rama esEquipo. */
export function statsHubTeamMatchPlayerIds(teamA: Team | undefined, teamB: Team | undefined): string[] {
  return ([...(teamA?.memberIds || []), ...(teamB?.memberIds || [])].filter(Boolean) as string[]);
}

/** Puerto fiel de statsHubMatchPlayerIds (app.js ~7166-7175), rama Modo Libre. */
export function statsHubOpenMatchPlayerIds(m: Pick<OpenMatch, "necesita" | "creatorId">): string[] {
  const ids: string[] = [];
  (m.necesita || []).forEach((slot) => (slot.unidos || []).forEach((u) => ids.push(u.profileId)));
  if (m.creatorId && !ids.includes(m.creatorId)) ids.unshift(m.creatorId);
  return Array.from(new Set(ids));
}

/** Puerto fiel de statsHubPlayerMatches (app.js ~7694-7705): filtro multi-término. */
export function statsHubPlayerMatches(p: Profile, query: string, teamLabel: string): boolean {
  const terms = (query || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystacks = [
    (p.name || "").toLowerCase(),
    (p.nickname || "").toLowerCase(),
    (p.position || "").toLowerCase(),
    teamLabel.toLowerCase(),
    p.dorsal === 0 || p.dorsal ? String(p.dorsal) : "",
  ];
  return terms.every((term) => haystacks.some((h) => h.includes(term)));
}

export interface ShFieldDef {
  key: string;
  label: string;
}

export const SH_TEAM_FIELD_STATS: ShFieldDef[] = [
  { key: "goles", label: "GOL" },
  { key: "asistencias", label: "ASIST" },
  { key: "tirosAlArco", label: "TIRO" },
  { key: "pasesClave", label: "PASE CLAVE" },
  { key: "recuperaciones", label: "RECUP" },
  { key: "jugadasDestacadas", label: "JUG. DEST" },
];
export const SH_TEAM_POR_STATS: ShFieldDef[] = [
  { key: "atajadas", label: "ATAJADAS" },
  { key: "atajadasArea", label: "ATAJ. ÁREA" },
  { key: "despejes", label: "DESPEJES" },
  { key: "achiques", label: "ACHIQUES" },
  { key: "pasesLargos", label: "PASES LARGOS" },
  { key: "jugadasIniciadas", label: "JUG. INICIADAS" },
];
export const SH_TEAM_NEG_STATS: ShFieldDef[] = [
  { key: "erroresGraves", label: "ERROR GRAVE" },
  { key: "oportunidadesFalladas", label: "OP. FALLADA" },
  { key: "faltasCometidas", label: "FALTA" },
  { key: "amarillas", label: "AMARILLA" },
  { key: "rojas", label: "ROJA" },
];
export const SH_LIBRE_STATS: ShFieldDef[] = [
  { key: "goles", label: "GOL" },
  { key: "asistencias", label: "ASIST" },
  { key: "tirosAlArco", label: "TIRO" },
  { key: "recuperaciones", label: "RECUP" },
  { key: "errores", label: "ERROR" },
  { key: "amarillas", label: "AMARILLA" },
];

export type ShStatValues = Record<string, number>;

/** Puerto fiel de shCalcRating (app.js ~7108-7119). */
export function shCalcRating(position: string | null | undefined, s: ShStatValues): number {
  if (position === "POR") {
    let r = 6.0;
    r += (s.atajadas || 0) * 0.15 + (s.atajadasArea || 0) * 0.2 + (s.despejes || 0) * 0.05 + (s.achiques || 0) * 0.1 + (s.pasesLargos || 0) * 0.02 + (s.jugadasIniciadas || 0) * 0.08;
    r -= (s.erroresGraves || 0) * 0.4 + (s.oportunidadesFalladas || 0) * 0.15 + (s.faltasCometidas || 0) * 0.05 + (s.amarillas || 0) * 0.3 + (s.rojas || 0) * 1.2;
    return Math.round(Math.max(1, Math.min(10, r)) * 10) / 10;
  }
  let r = 6.0;
  r += (s.goles || 0) * 0.35 + (s.asistencias || 0) * 0.2 + (s.tirosAlArco || 0) * 0.08 + (s.pasesClave || 0) * 0.1 + (s.recuperaciones || 0) * 0.02 + (s.jugadasDestacadas || 0) * 0.2;
  r -= (s.erroresGraves || 0) * 0.3 + (s.oportunidadesFalladas || 0) * 0.1 + (s.faltasCometidas || 0) * 0.05 + (s.amarillas || 0) * 0.3 + (s.rojas || 0) * 1.0;
  return Math.round(Math.max(1, Math.min(10, r)) * 10) / 10;
}

/** Puerto fiel de shCalcRatingLibre (app.js ~7126-7131). */
export function shCalcRatingLibre(s: ShStatValues): number {
  let r = 6.0;
  r += (s.goles || 0) * 0.35 + (s.asistencias || 0) * 0.2 + (s.tirosAlArco || 0) * 0.08 + (s.recuperaciones || 0) * 0.02;
  r -= (s.errores || 0) * 0.3 + (s.amarillas || 0) * 0.3;
  return Math.round(Math.max(1, Math.min(10, r)) * 10) / 10;
}

/**
 * Puerto fiel de statsHubUpdateRowPreview (app.js ~7230-7263): el texto de
 * previsualización de delta al lado de cada jugador, con tres ramas según el
 * estado del partido/corrección — ver comentario de cada rama.
 */
export function statsHubPreviewText(p: Profile, m2: MatchStatsInput, done: boolean, correcting: boolean, stored: StoredDeltaEntry | undefined): string {
  if (done && !correcting) {
    // Partido ya jugado, solo lectura (VER, sin corregir): no hay nada que
    // recalcular todavía, se muestra el estado actual de la carta.
    return `ACTUAL: OVR ${p.ovr || 60} · ${p.goals || 0}G ${p.assists || 0}A`;
  }
  if (done && correcting) {
    // Modo CORREGIR: el jugador TODAVÍA tiene aplicado el delta viejo de este
    // partido — se simula ya revertido antes de calcular el nuevo delta para
    // que la previsualización muestre el resultado neto final.
    const oldOvrDelta = stored?.ovrDelta || 0;
    const oldXpGain = stored?.xpGain || 0;
    const baseline: Profile = { ...p, ovr: Math.max(40, Math.min(99, (p.ovr || 60) - oldOvrDelta)), xp: Math.max(0, (p.xp || 0) - oldXpGain) };
    const d = computeMatchDeltas(baseline, m2);
    return `OVR ${p.ovr || 60} a ${d.ovrAfter} · este partido corregido da XP +${d.xpGain} · LP +${d.lpGain}`;
  }
  const d = computeMatchDeltas(p, m2);
  return `OVR ${d.ovrBefore} a ${d.ovrAfter} · XP +${d.xpGain} · LP +${d.lpGain}`;
}

/** Puerto fiel de la rama esEquipo de statsHubBuildM2 (app.js ~7209-7220). */
export function statsHubBuildM2Team(position: string | null | undefined, s: ShStatValues, mvp: boolean): MatchStatsInput & Record<string, unknown> {
  const cal = shCalcRating(position, s);
  return {
    goles: s.goles || 0, asistencias: s.asistencias || 0, tirosAlArco: s.tirosAlArco || 0,
    pasesClave: s.pasesClave || 0, recuperaciones: s.recuperaciones || 0, jugadasDestacadas: s.jugadasDestacadas || 0,
    erroresGraves: s.erroresGraves || 0, oportunidadesFalladas: s.oportunidadesFalladas || 0,
    faltasCometidas: s.faltasCometidas || 0, amarillas: s.amarillas || 0, rojas: s.rojas || 0,
    atajadas: s.atajadas || 0, atajadasArea: s.atajadasArea || 0, despejes: s.despejes || 0,
    achiques: s.achiques || 0, pasesLargos: s.pasesLargos || 0, jugadasIniciadas: s.jugadasIniciadas || 0,
    calificacion: cal, mvp,
  };
}

/** Puerto fiel de la rama Modo Libre de statsHubBuildM2 (app.js ~7222-7227). */
export function statsHubBuildM2Libre(s: ShStatValues, mvp: boolean): MatchStatsInput & Record<string, unknown> {
  const cal = shCalcRatingLibre(s);
  return {
    goles: s.goles || 0, asistencias: s.asistencias || 0, tirosAlArco: s.tirosAlArco || 0, pases: s.tirosAlArco || 0,
    recuperaciones: s.recuperaciones || 0, errores: s.errores || 0, amarillas: s.amarillas || 0,
    calificacion: cal, mvp,
  };
}

interface StoredDeltaEntry extends Record<string, unknown> {
  goles?: number;
  asistencias?: number;
  mvp?: boolean;
  ovrDelta?: number;
  xpGain?: number;
  lpGain?: number;
  attrsGain?: string[];
}

/** Puerto fiel del chequeo de statsHubRevertPlayerEffects (app.js ~7422). */
export function statsMapHasStoredDeltas(statsMap: Record<string, unknown> | null | undefined): boolean {
  const map = (statsMap || {}) as Record<string, StoredDeltaEntry>;
  const pids = Object.keys(map);
  return pids.length > 0 && pids.every((pid) => map[pid] && map[pid].ovrDelta !== undefined);
}

/**
 * Puerto fiel de statsHubRevertPlayerEffects (app.js ~7419-7463), sin la
 * parte de equipo (records W/D/L/GF/GA) — eso lo maneja el llamador para
 * partidos de equipo con revertTeamStandings/applyTeamStandings. Devuelve el
 * mapa de profiles ya revertidos (y los push+set uno por uno, igual que el
 * original) para que el llamador siga aplicando la corrección sobre esta base.
 */
export async function revertPlayerEffects(
  sb: SupabaseClient,
  statsMap: Record<string, unknown> | null | undefined,
  profiles: ProfilesById,
  matchId: string,
  fecha: string,
  cancha: string,
  setProfile: (p: Profile) => void
): Promise<ProfilesById> {
  const map = (statsMap || {}) as Record<string, StoredDeltaEntry>;
  let working = profiles;
  for (const [pid, d] of Object.entries(map)) {
    const p = working[pid];
    if (!p || !d) continue;
    const np: Profile = { ...p, attrs: { ...p.attrs } };
    np.ovr = Math.max(40, Math.min(99, (p.ovr || 60) - (d.ovrDelta || 0)));
    np.xp = Math.max(0, (p.xp || 0) - (d.xpGain || 0));
    np.lp = Math.max(0, (p.lp || 0) - (d.lpGain || 0));
    np.goals = Math.max(0, (p.goals || 0) - (d.goles || 0));
    np.assists = Math.max(0, (p.assists || 0) - (d.asistencias || 0));
    np.matches = Math.max(0, (p.matches || 0) - 1);
    if (d.mvp) np.mvps = Math.max(0, (p.mvps || 0) - 1);
    (d.attrsGain || []).forEach((k) => {
      const key = k as keyof Profile["attrs"];
      if (np.attrs[key] !== undefined) np.attrs[key] = Math.max(0, np.attrs[key] - 1);
    });
    const revIdx = [...p.history].reverse().findIndex((h) => (h.matchId ? h.matchId === matchId : h.date === fecha && h.cancha === cancha));
    np.history = revIdx === -1 ? p.history : p.history.filter((_, i) => i !== p.history.length - 1 - revIdx);
    setProfile(np);
    await pushProfileToCloud(sb, np);
    working = { ...working, [pid]: np };
  }
  return working;
}

export function revertTeamStandings(teamA: Team, teamB: Team, resultado: { golesA: number; golesB: number }): [Team, Team] {
  const { golesA, golesB } = resultado;
  const a: Team = { ...teamA, goalsFor: Math.max(0, (teamA.goalsFor || 0) - golesA), goalsAgainst: Math.max(0, (teamA.goalsAgainst || 0) - golesB) };
  const b: Team = { ...teamB, goalsFor: Math.max(0, (teamB.goalsFor || 0) - golesB), goalsAgainst: Math.max(0, (teamB.goalsAgainst || 0) - golesA) };
  if (golesA > golesB) {
    a.wins = Math.max(0, (a.wins || 0) - 1);
    b.losses = Math.max(0, (b.losses || 0) - 1);
  } else if (golesA < golesB) {
    b.wins = Math.max(0, (b.wins || 0) - 1);
    a.losses = Math.max(0, (a.losses || 0) - 1);
  } else {
    a.draws = Math.max(0, (a.draws || 0) - 1);
    b.draws = Math.max(0, (b.draws || 0) - 1);
  }
  return [a, b];
}

export function applyTeamStandings(teamA: Team, teamB: Team, golesA: number, golesB: number): [Team, Team] {
  const a: Team = { ...teamA, goalsFor: (teamA.goalsFor || 0) + golesA, goalsAgainst: (teamA.goalsAgainst || 0) + golesB };
  const b: Team = { ...teamB, goalsFor: (teamB.goalsFor || 0) + golesB, goalsAgainst: (teamB.goalsAgainst || 0) + golesA };
  if (golesA > golesB) {
    a.wins = (a.wins || 0) + 1;
    b.losses = (b.losses || 0) + 1;
  } else if (golesA < golesB) {
    b.wins = (b.wins || 0) + 1;
    a.losses = (a.losses || 0) + 1;
  } else {
    a.draws = (a.draws || 0) + 1;
    b.draws = (b.draws || 0) + 1;
  }
  return [a, b];
}

export interface StatsHubTeamSaveInput {
  golesA: number;
  golesB: number;
  notes: string;
  mvpId: string | null;
  stats: Record<string, ShStatValues>;
}

/**
 * Puerto fiel de la rama esEquipo de statsHubSaveMatch (app.js ~7481-7555).
 * correctionOnly=true revierte con precisión lo ya aplicado (statsMap guardado
 * DEBE traer ovrDelta) antes de recalcular todo desde los datos corregidos.
 */
export async function statsHubSaveTeamMatch(
  sb: SupabaseClient,
  match: TeamMatch,
  teamAIn: Team,
  teamBIn: Team,
  profilesIn: ProfilesById,
  input: StatsHubTeamSaveInput,
  correctionOnly: boolean,
  setProfile: (p: Profile) => void
): Promise<{ match: TeamMatch; teamA: Team; teamB: Team }> {
  let teamA = teamAIn;
  let teamB = teamBIn;
  let profiles = profilesIn;

  if (correctionOnly) {
    profiles = await revertPlayerEffects(sb, match.stats, profiles, match.id, match.fecha, match.cancha, setProfile);
    if (match.resultado) [teamA, teamB] = revertTeamStandings(teamA, teamB, match.resultado);
  }

  [teamA, teamB] = applyTeamStandings(teamA, teamB, input.golesA, input.golesB);
  const resultLabel =
    input.golesA > input.golesB
      ? `${teamA.name} venció a ${teamB.name} ${input.golesA}-${input.golesB}`
      : input.golesA < input.golesB
        ? `${teamB.name} venció a ${teamA.name} ${input.golesB}-${input.golesA}`
        : `${teamA.name} empató con ${teamB.name} ${input.golesA}-${input.golesB}`;

  const statsMap: Record<string, unknown> = {};
  const allIds = [...(teamA.memberIds || []), ...(teamB.memberIds || [])].filter(Boolean) as string[];
  for (const pid of allIds) {
    const p = profiles[pid];
    if (!p) continue;
    const s = input.stats[pid] || {};
    const m2 = statsHubBuildM2Team(p.position, s, pid === input.mvpId);
    const d = computeMatchDeltas(p, m2);
    statsMap[pid] = { ...m2, ovrDelta: d.ovrDelta, xpGain: d.xpGain, lpGain: d.lpGain, attrsGain: d.attrsGain || [] };

    const updated: Profile = { ...p, attrs: { ...p.attrs } };
    checkAchievements(updated, m2, profiles);
    updated.ovr = d.ovrAfter;
    updated.xp = d.xpAfter;
    updated.lp = (p.lp || 0) + d.lpGain;
    updated.matches = (p.matches || 0) + 1;
    updated.goals = (p.goals || 0) + m2.goles;
    updated.assists = (p.assists || 0) + m2.asistencias;
    if (m2.mvp) updated.mvps = (p.mvps || 0) + 1;
    d.attrsGain.forEach((k) => {
      updated.attrs[k] = Math.min(99, updated.attrs[k] + 1);
    });
    updated.lastUpdate = { ovrDelta: d.ovrDelta, xpGain: d.xpGain, lpGain: d.lpGain };
    updated.history = [
      ...p.history,
      {
        matchId: match.id, date: match.fecha, cancha: match.cancha, result: resultLabel,
        goles: m2.goles, asistencias: m2.asistencias, recuperaciones: (m2 as { recuperaciones?: number }).recuperaciones,
        calificacion: m2.calificacion, mvp: m2.mvp, ovrDelta: d.ovrDelta, xpGain: d.xpGain, lpGain: d.lpGain,
      },
    ];
    // El reveal post-partido solo se dispara la primera vez que se finaliza —
    // una corrección no debe volver a mostrarlo (igual que el original).
    if (!correctionOnly) {
      const teamObj = (teamA.memberIds || []).includes(pid) ? teamA : teamB;
      const rivalName = teamObj.id === match.teamAId ? teamB.name : teamA.name;
      updated.pendingReveal = {
        matchId: match.id, resultLabel, teamName: teamObj.name, rivalName,
        ovrBefore: d.ovrBefore, ovrAfter: d.ovrAfter, xpGain: d.xpGain, lpGain: d.lpGain,
        rankBefore: d.rankBefore ? d.rankBefore.name : null, rankAfter: d.rankAfter ? d.rankAfter.name : null,
        rankChanged: !!(d.rankBefore && d.rankAfter && d.rankBefore.name !== d.rankAfter.name),
      };
    }
    setProfile(updated);
    await pushProfileToCloud(sb, updated);
    profiles = { ...profiles, [pid]: updated };
  }

  const updatedMatch: TeamMatch = {
    ...match,
    estado: "finalizado",
    resultado: { golesA: input.golesA, golesB: input.golesB },
    stats: statsMap as TeamMatch["stats"],
    mvpId: input.mvpId,
    notes: input.notes,
  };

  if (!correctionOnly) {
    const winTeam = input.golesA > input.golesB ? teamA : input.golesB > input.golesA ? teamB : null;
    if (winTeam) {
      const cap = profiles[winTeam.captainId];
      if (cap) {
        const updatedCap: Profile = { ...cap, notifications: [...cap.notifications, { icon: "🏆", text: resultLabel, time: "AHORA" }] };
        setProfile(updatedCap);
        await pushProfileToCloud(sb, updatedCap);
      }
    }
  }

  await pushTeamMatchToCloud(sb, updatedMatch);
  await pushTeamToCloud(sb, teamA);
  await pushTeamToCloud(sb, teamB);

  return { match: updatedMatch, teamA, teamB };
}

/** Puerto fiel de statsHubResetMatch (app.js ~7600-7628) para partidos de equipo. */
export async function statsHubResetTeamMatch(
  sb: SupabaseClient,
  match: TeamMatch,
  teamAIn: Team,
  teamBIn: Team,
  profiles: ProfilesById,
  setProfile: (p: Profile) => void
): Promise<{ match: TeamMatch; teamA: Team; teamB: Team }> {
  await revertPlayerEffects(sb, match.stats, profiles, match.id, match.fecha, match.cancha, setProfile);
  let teamA = teamAIn;
  let teamB = teamBIn;
  if (match.resultado) [teamA, teamB] = revertTeamStandings(teamA, teamB, match.resultado);
  const updatedMatch: TeamMatch = { ...match, estado: "programado", resultado: null, stats: {}, mvpId: null, notes: "" };
  await pushTeamMatchToCloud(sb, updatedMatch);
  await pushTeamToCloud(sb, teamA);
  await pushTeamToCloud(sb, teamB);
  return { match: updatedMatch, teamA, teamB };
}

export interface StatsHubLibreSaveInput {
  golesLocal: number;
  golesVisitante: number;
  notes: string;
  mvpId: string | null;
  stats: Record<string, ShStatValues>;
  playerIds: string[];
}

/** Puerto fiel de la rama Modo Libre de statsHubSaveMatch (app.js ~7556-7589). */
export async function statsHubSaveOpenMatch(
  sb: SupabaseClient,
  match: OpenMatch,
  profilesIn: ProfilesById,
  input: StatsHubLibreSaveInput,
  correctionOnly: boolean,
  setProfile: (p: Profile) => void
): Promise<OpenMatch> {
  let profiles = profilesIn;
  if (correctionOnly) {
    profiles = await revertPlayerEffects(sb, match.stats, profiles, match.id, match.fecha, match.cancha || match.zona || "", setProfile);
  }

  const statsMap: Record<string, unknown> = {};
  for (const pid of input.playerIds) {
    const p = profiles[pid];
    if (!p) continue;
    const s = input.stats[pid] || {};
    const m2 = statsHubBuildM2Libre(s, pid === input.mvpId);
    const d = computeMatchDeltas(p, m2);
    statsMap[pid] = { ...m2, ovrDelta: d.ovrDelta, xpGain: d.xpGain, lpGain: d.lpGain };

    const updated: Profile = { ...p, attrs: { ...p.attrs } };
    checkAchievements(updated, m2, profiles);
    updated.ovr = d.ovrAfter;
    updated.xp = d.xpAfter;
    updated.lp = (p.lp || 0) + d.lpGain;
    updated.goals = (p.goals || 0) + m2.goles;
    updated.assists = (p.assists || 0) + m2.asistencias;
    updated.matches = (p.matches || 0) + 1;
    if (m2.mvp) updated.mvps = (p.mvps || 0) + 1;
    updated.lastUpdate = { ovrDelta: d.ovrDelta, xpGain: d.xpGain, lpGain: d.lpGain };
    updated.history = [
      ...p.history,
      {
        matchId: match.id, date: match.fecha, cancha: match.cancha || match.zona || "",
        calificacion: m2.calificacion, goles: m2.goles, asistencias: m2.asistencias, mvp: m2.mvp,
        ovrDelta: d.ovrDelta, xpGain: d.xpGain, lpGain: d.lpGain,
      },
    ];
    setProfile(updated);
    await pushProfileToCloud(sb, updated);
    profiles = { ...profiles, [pid]: updated };
  }

  const updatedMatch: OpenMatch = {
    ...match,
    finalizado: true,
    resultado: { golesLocal: input.golesLocal, golesVisitante: input.golesVisitante },
    stats: statsMap,
    mvpId: input.mvpId,
    notes: input.notes,
  };
  await pushMatchToCloud(sb, updatedMatch);
  return updatedMatch;
}

/** Puerto fiel de statsHubResetMatch (app.js ~7600-7628) para Modo Libre. */
export async function statsHubResetOpenMatch(
  sb: SupabaseClient,
  match: OpenMatch,
  profiles: ProfilesById,
  setProfile: (p: Profile) => void
): Promise<OpenMatch> {
  await revertPlayerEffects(sb, match.stats, profiles, match.id, match.fecha, match.cancha || match.zona || "", setProfile);
  const updatedMatch: OpenMatch = { ...match, finalizado: false, resultado: null, stats: {}, mvpId: null, notes: "" };
  await pushMatchToCloud(sb, updatedMatch);
  return updatedMatch;
}
