import { getMatchEstado } from "@/lib/domain/matches";
import type { OpenMatch } from "@/types/match";
import type { Profile } from "@/types/profile";

export function matchParticipantIds(m: OpenMatch): Set<string> {
  const ids = new Set<string>();
  if (m.creatorId) ids.add(m.creatorId);
  (m.necesita || []).forEach((n) => (n.unidos || []).forEach((u) => ids.add(u.profileId)));
  (m.confirmadosPrev || []).forEach((c) => {
    if (c.profileId) ids.add(c.profileId);
  });
  return ids;
}

/** ¿Jugué (o voy a jugar) un partido ya disputado junto a este jugador y aún no lo califiqué? */
export function playerSharedMatch(openMatches: OpenMatch[], me: Profile, otherId: string): boolean {
  if (me.ratedPlayers && me.ratedPlayers[otherId]) return false;
  return openMatches.some((m) => {
    if (getMatchEstado(m) !== "finalizado") return false;
    const ids = matchParticipantIds(m);
    return ids.has(me.id) && ids.has(otherId);
  });
}
