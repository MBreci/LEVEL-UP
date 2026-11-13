import { getRank } from "@/lib/domain/rank";
import type { ProfilesById } from "@/types/profile";

export interface RankingEntry {
  id: string;
  name: string;
  ovr: number;
  xp: number;
  rank: string;
  slug: string;
  emoji: string;
  pos: string;
}

export function getGeneralRanking(profiles: ProfilesById): RankingEntry[] {
  const list = Object.values(profiles).map((p) => {
    const r = getRank(p.xp);
    return {
      id: p.id,
      name: p.nickname || p.name,
      ovr: p.ovr,
      xp: p.xp || 0,
      rank: r.name,
      slug: r.slug,
      emoji: r.emoji,
      pos: (p.position || "").toUpperCase(),
    };
  });
  return list.sort((a, b) => b.ovr - a.ovr || b.xp - a.xp || a.name.localeCompare(b.name));
}

export interface PlatformStats {
  jugadores: number;
  partidos: number;
  goles: number;
  mvps: number;
}

export function getPlatformStats(profiles: ProfilesById): PlatformStats {
  const all = Object.values(profiles);
  return {
    jugadores: all.length,
    partidos: all.reduce((s, p) => s + (p.matches || 0), 0),
    goles: all.reduce((s, p) => s + (p.goals || 0), 0),
    mvps: all.reduce((s, p) => s + (p.mvps || 0), 0),
  };
}
