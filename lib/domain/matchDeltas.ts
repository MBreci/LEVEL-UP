import { getGeneralRanking } from "@/lib/domain/ranking";
import { getRank, type Rank } from "@/lib/domain/rank";
import type { PlayerAttrs, Profile, ProfilesById } from "@/types/profile";

export const ACHIEVEMENTS_DEF: Record<string, { icon: string; label: string }> = {
  first_mvp: { icon: "🥇", label: "PRIMER MVP" },
  hat_trick: { icon: "⚡", label: "HAT-TRICK" },
  perfect_assist: { icon: "🎯", label: "ASISTENCIA PERFECTA" },
  defensive_wall: { icon: "🧱", label: "MURALLA DEFENSIVA" },
  century: { icon: "💯", label: "100 PARTIDOS OFICIALES" },
  top100: { icon: "🏆", label: "TOP 100" },
};

export const ATTR_LABELS: Record<keyof PlayerAttrs, string> = {
  pac: "RITMO", sho: "TIRO", pas: "PASE", dri: "REGATE", def: "DEFENSA", fis: "FÍSICO",
};

export interface MatchStatsInput {
  goles: number;
  asistencias: number;
  pases?: number;
  recuperaciones: number;
  calificacion: number;
  mvp: boolean;
}

/** Muta p.achievements (igual que el original) y devuelve los IDs recién desbloqueados. */
export function checkAchievements(p: Profile, m: MatchStatsInput, profiles: ProfilesById): string[] {
  const have = new Set(p.achievements || []);
  const unlocked: string[] = [];
  const add = (id: string) => {
    if (!have.has(id)) {
      unlocked.push(id);
      have.add(id);
    }
  };
  if (m.mvp) add("first_mvp");
  if (m.goles >= 3) add("hat_trick");
  if (m.asistencias >= 3) add("perfect_assist");
  if (m.recuperaciones >= 8) add("defensive_wall");
  if (p.matches + 1 === 100) add("century");
  const pos = getGeneralRanking(profiles).findIndex((r) => r.id === p.id) + 1;
  if (pos > 0 && pos <= 100) add("top100");
  p.achievements = Array.from(have);
  return unlocked;
}

export interface MatchDeltasResult {
  ovrDelta: number;
  ovrBefore: number;
  ovrAfter: number;
  xpGain: number;
  xpAfter: number;
  lpGain: number;
  rankBefore: Rank;
  rankAfter: Rank;
  attrsGain: (keyof PlayerAttrs)[];
}

/** Fórmula oficial de evolución OVR/XP/LP (documentada en DOCUMENTACION.md) — no se toca. */
export function computeMatchDeltas(p: Profile, m: MatchStatsInput): MatchDeltasResult {
  const cal = m.calificacion;
  let ovrDelta = 0;
  if (cal >= 9) ovrDelta = 2;
  else if (cal >= 7.5) ovrDelta = 1;
  else if (cal < 5) ovrDelta = -1;
  const ovrBefore = p.ovr;
  const ovrAfter = Math.max(40, Math.min(99, ovrBefore + ovrDelta));
  const xpGain = 80 + m.goles * 15 + m.asistencias * 10 + (m.mvp ? 50 : 0) + Math.round(cal * 5);
  const lpGain = 4 + (m.mvp ? 3 : 0) + (cal >= 8 ? 2 : 0);
  const rankBefore = getRank(p.xp);
  const xpAfter = p.xp + xpGain;
  const rankAfter = getRank(xpAfter);
  const attrsGain: (keyof PlayerAttrs)[] = [];
  if (m.goles > 0) attrsGain.push("sho");
  if (m.asistencias > 0 || (m.pases || 0) > 0) attrsGain.push("pas");
  if (m.recuperaciones > 0) attrsGain.push("def");
  if (cal >= 8) attrsGain.push("dri");
  return { ovrDelta, ovrBefore, ovrAfter, xpGain, xpAfter, lpGain, rankBefore, rankAfter, attrsGain };
}
