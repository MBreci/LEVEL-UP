import type { SupabaseClient } from "@supabase/supabase-js";
import { checkAchievements, computeMatchDeltas, type MatchStatsInput } from "@/lib/domain/matchDeltas";
import { pushProfileToCloud } from "@/lib/domain/profiles";
import { pushTeamMatchToCloud, pushTeamToCloud } from "@/lib/domain/teamsCloud";
import type { Profile, ProfilesById } from "@/types/profile";
import type { Team, TeamMatch, TeamMatchStatsEntry } from "@/types/team";

/**
 * Puerto fiel de admin-partido.html (consola /admin/partido, pieza 3):
 * campos de box score (posición vs portero), fórmula de calificación
 * (apCalcRating) y las dos funciones de finalizar/corregir propias de esta
 * consola — DISTINTAS de TeamsContext.finalizeTeamMatch (submitFinalizeMatch,
 * que nunca guarda .stats) y de lib/domain/adminStatsHub.ts (motor de revert
 * preciso). apFinalizeMatch SÍ construye y persiste un stats map completo —
 * esa es la diferencia clave que justifica una función nueva y separada.
 */

export interface ApFieldDef {
  key: string;
  label: string;
  shortkey: string;
}

export const AP_FIELD_POS_STATS: ApFieldDef[] = [
  { key: "goles", label: "GOL", shortkey: "G" },
  { key: "asistencias", label: "ASIST.", shortkey: "A" },
  { key: "tirosAlArco", label: "TIRO AL ARCO", shortkey: "TA" },
  { key: "pasesClave", label: "PASE CLAVE", shortkey: "PC" },
  { key: "recuperaciones", label: "RECUPERACIÓN", shortkey: "REC" },
  { key: "jugadasDestacadas", label: "JUGADA DESTACADA", shortkey: "JD" },
];
export const AP_POR_POS_STATS: ApFieldDef[] = [
  { key: "atajadas", label: "ATAJADAS", shortkey: "ATJ" },
  { key: "atajadasArea", label: "ATAJ. DENTRO DEL ÁREA", shortkey: "AA" },
  { key: "despejes", label: "DESPEJES", shortkey: "DES" },
  { key: "achiques", label: "ACHIQUÉS", shortkey: "ACH" },
  { key: "pasesLargos", label: "PASES LARGOS", shortkey: "PL" },
  { key: "jugadasIniciadas", label: "JUGADAS INICIADAS", shortkey: "JI" },
];
export const AP_NEG_STATS: ApFieldDef[] = [
  { key: "erroresGraves", label: "ERROR GRAVE", shortkey: "EG" },
  { key: "oportunidadesFalladas", label: "OP. FALLADA", shortkey: "OF" },
  { key: "faltasCometidas", label: "FALTA COMETIDA", shortkey: "F" },
  { key: "amarillas", label: "AMARILLA", shortkey: "AM" },
  { key: "rojas", label: "ROJA", shortkey: "R" },
];

export type ApStatValues = Record<string, number>;

/** Puerto fiel de apCalcRating (admin-partido.html ~569-604). */
export function apCalcRating(position: string | null | undefined, s: ApStatValues): number {
  if (position === "POR") {
    let r = 6.0;
    r += (s.atajadas || 0) * 0.15;
    r += (s.atajadasArea || 0) * 0.2;
    r += (s.despejes || 0) * 0.05;
    r += (s.achiques || 0) * 0.1;
    r += (s.pasesLargos || 0) * 0.02;
    r += (s.jugadasIniciadas || 0) * 0.08;
    r -= (s.erroresGraves || 0) * 0.4;
    r -= (s.oportunidadesFalladas || 0) * 0.15;
    r -= (s.faltasCometidas || 0) * 0.05;
    r -= (s.amarillas || 0) * 0.3;
    r -= (s.rojas || 0) * 1.2;
    return Math.round(Math.max(1, Math.min(10, r)) * 10) / 10;
  }
  let r = 6.0;
  r += (s.goles || 0) * 0.35;
  r += (s.asistencias || 0) * 0.2;
  r += (s.tirosAlArco || 0) * 0.08;
  r += (s.pasesClave || 0) * 0.1;
  r += (s.recuperaciones || 0) * 0.02;
  r += (s.jugadasDestacadas || 0) * 0.2;
  r -= (s.erroresGraves || 0) * 0.3;
  r -= (s.oportunidadesFalladas || 0) * 0.1;
  r -= (s.faltasCometidas || 0) * 0.05;
  r -= (s.amarillas || 0) * 0.3;
  r -= (s.rojas || 0) * 1.0;
  return Math.round(Math.max(1, Math.min(10, r)) * 10) / 10;
}

export interface ApEventEntry {
  min: number;
  text: string;
  dotColor: string;
}

/** Forma exacta del borrador autosaveado (apSaveDraft/apLoadDraft, admin-partido.html ~750-771). */
export interface ApDraft {
  stats: Record<string, ApStatValues>;
  mvpId: string | null;
  timerSecs: number;
  events: ApEventEntry[];
  notes: string;
}

export function apDraftKey(matchId: string): string {
  return "ap_draft_" + matchId;
}

function buildM2(position: string | null | undefined, s: ApStatValues, mvp: boolean): MatchStatsInput & Record<string, unknown> {
  const cal = apCalcRating(position, s);
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

export interface ApFinalizeInput {
  stats: Record<string, ApStatValues>;
  mvpId: string | null;
  notes: string;
}

/**
 * Puerto fiel de apFinalizeMatch (admin-partido.html ~787-919). A diferencia
 * de TeamsContext.finalizeTeamMatch, el marcador se calcula sumando el stat
 * 'goles' de cada jugador (no se pide a mano) y SÍ construye+persiste un
 * stats map completo sobre el team_matches. Siempre setea pendingReveal
 * (nunca se llama en modo corrección).
 */
export async function finalizeTeamMatchAdmin(
  sb: SupabaseClient,
  match: TeamMatch,
  teamA: Team,
  teamB: Team,
  profilesIn: ProfilesById,
  input: ApFinalizeInput,
  setProfile: (p: Profile) => void
): Promise<{ match: TeamMatch; teamA: Team; teamB: Team }> {
  let profiles = profilesIn;
  const statOf = (pid: string) => input.stats[pid] || {};
  const golesA = (teamA.memberIds || []).reduce((s, pid) => s + (pid ? statOf(pid).goles || 0 : 0), 0);
  const golesB = (teamB.memberIds || []).reduce((s, pid) => s + (pid ? statOf(pid).goles || 0 : 0), 0);

  const updatedTeamA: Team = { ...teamA, goalsFor: (teamA.goalsFor || 0) + golesA, goalsAgainst: (teamA.goalsAgainst || 0) + golesB };
  const updatedTeamB: Team = { ...teamB, goalsFor: (teamB.goalsFor || 0) + golesB, goalsAgainst: (teamB.goalsAgainst || 0) + golesA };
  if (golesA > golesB) {
    updatedTeamA.wins = (updatedTeamA.wins || 0) + 1;
    updatedTeamB.losses = (updatedTeamB.losses || 0) + 1;
  } else if (golesA < golesB) {
    updatedTeamB.wins = (updatedTeamB.wins || 0) + 1;
    updatedTeamA.losses = (updatedTeamA.losses || 0) + 1;
  } else {
    updatedTeamA.draws = (updatedTeamA.draws || 0) + 1;
    updatedTeamB.draws = (updatedTeamB.draws || 0) + 1;
  }

  const resultLabel =
    golesA > golesB
      ? `${updatedTeamA.name} venció a ${updatedTeamB.name} ${golesA}-${golesB}`
      : golesA < golesB
        ? `${updatedTeamB.name} venció a ${updatedTeamA.name} ${golesB}-${golesA}`
        : `${updatedTeamA.name} empató con ${updatedTeamB.name} ${golesA}-${golesB}`;

  const statsMap: Record<string, TeamMatchStatsEntry> = {};
  const allPlayerIds = [...(updatedTeamA.memberIds || []), ...(updatedTeamB.memberIds || [])].filter(Boolean) as string[];

  for (const pid of allPlayerIds) {
    const p = profiles[pid];
    if (!p) continue;
    const s = statOf(pid);
    const m2 = buildM2(p.position, s, pid === input.mvpId);
    statsMap[pid] = m2 as TeamMatchStatsEntry;

    const d = computeMatchDeltas(p, m2);
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
        date: match.fecha, cancha: match.cancha, result: resultLabel,
        goles: m2.goles, asistencias: m2.asistencias, recuperaciones: (m2 as { recuperaciones?: number }).recuperaciones,
        calificacion: m2.calificacion, mvp: m2.mvp, ovrDelta: d.ovrDelta, xpGain: d.xpGain, lpGain: d.lpGain,
      },
    ];

    const teamObj = (updatedTeamA.memberIds || []).includes(pid) ? updatedTeamA : updatedTeamB;
    const rivalName = teamObj.id === match.teamAId ? updatedTeamB.name : updatedTeamA.name;
    updated.pendingReveal = {
      matchId: match.id, resultLabel, teamName: teamObj.name, rivalName,
      ovrBefore: d.ovrBefore, ovrAfter: d.ovrAfter, xpGain: d.xpGain, lpGain: d.lpGain,
      rankBefore: d.rankBefore ? d.rankBefore.name : null, rankAfter: d.rankAfter ? d.rankAfter.name : null,
      rankChanged: !!(d.rankBefore && d.rankAfter && d.rankBefore.name !== d.rankAfter.name),
    };

    setProfile(updated);
    await pushProfileToCloud(sb, updated);
    profiles = { ...profiles, [pid]: updated };
  }

  // Notifica al capitán ganador/perdedor (notifyTeam en el original).
  function notifyCaptain(team: Team, icon: string) {
    const cap = profiles[team.captainId];
    if (!cap) return;
    const updatedCap: Profile = { ...cap, notifications: [...cap.notifications, { icon, text: resultLabel, time: "AHORA" }] };
    setProfile(updatedCap);
    void pushProfileToCloud(sb, updatedCap);
  }
  if (golesA > golesB) {
    notifyCaptain(updatedTeamA, "🏆");
    notifyCaptain(updatedTeamB, "😤");
  } else if (golesB > golesA) {
    notifyCaptain(updatedTeamB, "🏆");
    notifyCaptain(updatedTeamA, "😤");
  }

  const updatedMatch: TeamMatch = {
    ...match,
    estado: "finalizado",
    resultado: { golesA, golesB },
    stats: statsMap,
    mvpId: input.mvpId,
    notes: input.notes,
  };

  await pushTeamMatchToCloud(sb, updatedMatch);
  await pushTeamToCloud(sb, updatedTeamA);
  await pushTeamToCloud(sb, updatedTeamB);

  return { match: updatedMatch, teamA: updatedTeamA, teamB: updatedTeamB };
}

/**
 * Puerto fiel de apSaveCorrection (admin-partido.html ~952-983): parche
 * crudo, sin revertir/recalcular deltas ni tocar el marcador/récord de
 * equipo ya aplicado — solo sobreescribe el detalle del stats/notes/mvp.
 */
export async function correctTeamMatchAdmin(
  sb: SupabaseClient,
  match: TeamMatch,
  profiles: ProfilesById,
  input: ApFinalizeInput
): Promise<TeamMatch> {
  const statsMap: Record<string, TeamMatchStatsEntry> = {};
  const pids = Object.keys(input.stats);
  for (const pid of pids) {
    const p = profiles[pid];
    const s = input.stats[pid] || {};
    const m2 = buildM2(p?.position, s, pid === input.mvpId);
    statsMap[pid] = { ...(match.stats?.[pid] as TeamMatchStatsEntry), ...m2 } as TeamMatchStatsEntry;
  }
  const updatedMatch: TeamMatch = { ...match, stats: statsMap, mvpId: input.mvpId, notes: input.notes };
  await pushTeamMatchToCloud(sb, updatedMatch);
  return updatedMatch;
}
