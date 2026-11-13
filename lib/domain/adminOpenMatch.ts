import type { SupabaseClient } from "@supabase/supabase-js";
import { checkAchievements, computeMatchDeltas, type MatchStatsInput } from "@/lib/domain/matchDeltas";
import { pushProfileToCloud } from "@/lib/domain/profiles";
import { pushMatchToCloud } from "@/lib/domain/matches";
import type { OpenMatch } from "@/types/match";
import type { Profile, ProfilesById } from "@/types/profile";

/**
 * Puerto fiel del box score de openAdminMatch/adminFinalizeMatch/
 * adminStartCorrection (app.js ~7943-8264) para Modo Libre. Nota fiel: el DOM
 * id original es "tirosAlArco" pero adminFinalizeMatch lo guarda en el campo
 * `pases` del stats payload — se replica esa correspondencia tal cual, sin
 * "arreglar" el nombre. `errores`/`amarillas` se muestran en la tabla pero
 * NUNCA se pasan a computeMatchDeltas ni se persisten en el stats guardado
 * (inconsistencia real del original, replicada a propósito).
 */
export interface AdminOpenStatEntry {
  goles: number;
  asistencias: number;
  tirosAlArco: number;
  recuperaciones: number;
  errores: number;
  amarillas: number;
}

export const ADMIN_OPEN_STAT_FIELDS: { key: keyof AdminOpenStatEntry; label: string }[] = [
  { key: "goles", label: "GOL" },
  { key: "asistencias", label: "🎯 ASIST" },
  { key: "tirosAlArco", label: "🥅 TIRO" },
  { key: "recuperaciones", label: "🛡 RECUP" },
  { key: "errores", label: "❌ ERROR" },
  { key: "amarillas", label: "🟨 AMARILLA" },
];

const EVENT_LABELS: Record<keyof AdminOpenStatEntry, (name: string) => string> = {
  goles: (n) => `⚽ GOL de ${n}`,
  asistencias: (n) => `🎯 ASISTENCIA de ${n}`,
  tirosAlArco: (n) => `🥅 TIRO de ${n}`,
  recuperaciones: (n) => `🛡 RECUPERACIÓN de ${n}`,
  errores: (n) => `❌ ERROR de ${n}`,
  amarillas: (n) => `🟨 AMARILLA a ${n}`,
};

export function adminOpenEventLabel(stat: keyof AdminOpenStatEntry, playerName: string): string {
  return EVENT_LABELS[stat](playerName);
}

export function emptyAdminOpenStat(): AdminOpenStatEntry {
  return { goles: 0, asistencias: 0, tirosAlArco: 0, recuperaciones: 0, errores: 0, amarillas: 0 };
}

/** Igual criterio que openAdminMatch: creador + todos los unidos, sin duplicados. */
export function buildOpenMatchPlayerIds(m: Pick<OpenMatch, "necesita" | "creatorId">): string[] {
  const ids: string[] = [];
  (m.necesita || []).forEach((slot) => (slot.unidos || []).forEach((u) => ids.push(u.profileId)));
  if (m.creatorId && !ids.includes(m.creatorId)) ids.unshift(m.creatorId);
  return Array.from(new Set(ids));
}

/** Reconstruye el AdminOpenStatEntry guardado en m.stats[pid] (para VER/CORREGIR). */
export function adminOpenStatFromSaved(saved: Record<string, unknown> | undefined): AdminOpenStatEntry {
  const s = (saved || {}) as { goles?: number; asistencias?: number; pases?: number; recuperaciones?: number };
  return {
    goles: s.goles || 0,
    asistencias: s.asistencias || 0,
    tirosAlArco: s.pases || 0,
    recuperaciones: s.recuperaciones || 0,
    // errores/amarillas nunca se persisten (ver nota arriba) — siempre vuelven en 0 al abrir VER/CORREGIR.
    errores: 0,
    amarillas: 0,
  };
}

function toMatchStatsInput(s: AdminOpenStatEntry, calificacion: number, mvp: boolean): MatchStatsInput {
  return { goles: s.goles, asistencias: s.asistencias, pases: s.tirosAlArco, recuperaciones: s.recuperaciones, calificacion, mvp };
}

export interface AdminOpenMatchFormInput {
  golesLocal: number;
  golesVisitante: number;
  notes: string;
  mvpId: string | null;
  stats: Record<string, AdminOpenStatEntry>;
  calificaciones: Record<string, number>;
}

/**
 * Puerto fiel de adminFinalizeMatch (app.js ~8118-8199): aplica OVR/XP/LP/
 * historial a cada jugador confirmado y marca el partido finalizado con su
 * stats map. A diferencia de finalizeTeamMatch, NUNCA setea pendingReveal
 * (confirmado en el original) — no hay animación de reveal para Modo Libre
 * administrado.
 */
export async function finalizeOpenMatchAdmin(
  sb: SupabaseClient,
  match: OpenMatch,
  profiles: ProfilesById,
  input: AdminOpenMatchFormInput,
  setProfile: (p: Profile) => void
): Promise<OpenMatch> {
  const playerIds = buildOpenMatchPlayerIds(match);
  const statsMap: Record<string, unknown> = {};
  for (const pid of playerIds) {
    const p = profiles[pid];
    if (!p) continue;
    const s = input.stats[pid] || emptyAdminOpenStat();
    const calificacion = input.calificaciones[pid] ?? 6.5;
    const m2 = toMatchStatsInput(s, calificacion, pid === input.mvpId);
    statsMap[pid] = m2;

    const d = computeMatchDeltas(p, m2);
    const updated: Profile = { ...p, attrs: { ...p.attrs } };
    updated.ovr = d.ovrAfter;
    updated.xp = d.xpAfter;
    updated.lp = (p.lp || 0) + d.lpGain;
    updated.goals = (p.goals || 0) + m2.goles;
    updated.assists = (p.assists || 0) + m2.asistencias;
    updated.matches = (p.matches || 0) + 1;
    if (m2.mvp) updated.mvps = (p.mvps || 0) + 1;
    d.attrsGain.forEach((k) => {
      updated.attrs[k] = Math.min(99, updated.attrs[k] + 1);
    });
    updated.lastUpdate = { ovrDelta: d.ovrDelta, xpGain: d.xpGain, lpGain: d.lpGain };
    checkAchievements(updated, m2, profiles);
    // Nota fiel: el adminFinalizeMatch original no incluye lpGain en esta entrada
    // de historial (a diferencia de submitFinalizeMatch/statsHubSaveMatch) — se
    // agrega igual acá porque el tipo MatchDelta compartido lo exige y otras
    // pantallas (HistoryList) ya asumen su presencia; el valor es el real
    // calculado, no se inventa nada, solo se completa el campo faltante.
    updated.history = [
      ...p.history,
      {
        date: match.fecha,
        cancha: match.cancha || match.zona || "",
        calificacion,
        goles: m2.goles,
        asistencias: m2.asistencias,
        mvp: m2.mvp,
        ovrDelta: d.ovrDelta,
        xpGain: d.xpGain,
        lpGain: d.lpGain,
      },
    ];
    setProfile(updated);
    await pushProfileToCloud(sb, updated);
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

/**
 * Puerto fiel de adminSaveCorrection (app.js ~8232-8264): parche crudo, sin
 * revertir/recalcular deltas — solo sobreescribe stats/notes/mvpId (y el
 * marcador y MVP client-only) con lo que hay en el formulario.
 */
export async function correctOpenMatchAdmin(
  sb: SupabaseClient,
  match: OpenMatch,
  input: Pick<AdminOpenMatchFormInput, "stats" | "calificaciones" | "mvpId" | "notes">
): Promise<OpenMatch> {
  const playerIds = buildOpenMatchPlayerIds(match);
  const statsMap: Record<string, unknown> = {};
  for (const pid of playerIds) {
    const s = input.stats[pid] || emptyAdminOpenStat();
    const calificacion = input.calificaciones[pid] ?? 6.5;
    statsMap[pid] = toMatchStatsInput(s, calificacion, pid === input.mvpId);
  }
  const updatedMatch: OpenMatch = { ...match, stats: statsMap, mvpId: input.mvpId, notes: input.notes };
  await pushMatchToCloud(sb, updatedMatch);
  return updatedMatch;
}
